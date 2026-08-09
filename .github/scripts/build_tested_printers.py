#!/usr/bin/env python3
"""Build the verified-models table in the README from discussion reports.

Reads the "Tested printers" discussion category and rewrites the block between
the TESTED-PRINTERS markers in README.md.

Only the structured answers are read -- the model, the multi-colour unit, the
connection, and the "what works" tick-boxes. The free-text fields are
deliberately ignored: they belong to the person who wrote them, and copying
them into the README unread is how a project ends up publishing something it
cannot stand behind. The workflow that calls this opens a pull request rather
than pushing, so a human still sees every change.
"""

from __future__ import annotations

import json
import os
import pathlib
import re
import subprocess
import sys

REPO = os.environ.get("GITHUB_REPOSITORY", "Nino6689/hass-anycubic")
OWNER, NAME = REPO.split("/")
CATEGORY = "Tested printers"

START = "<!-- TESTED-PRINTERS:START -->"
END = "<!-- TESTED-PRINTERS:END -->"

QUERY = """
query($owner:String!, $name:String!, $after:String) {
  repository(owner:$owner, name:$name) {
    discussions(first:50, after:$after, orderBy:{field:CREATED_AT, direction:DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        url
        category { name }
        body
        author { login }
      }
    }
  }
}
"""


def graphql(after: str | None) -> dict:
    args = [
        "gh", "api", "graphql",
        "-f", f"query={QUERY}",
        "-F", f"owner={OWNER}",
        "-F", f"name={NAME}",
    ]
    if after:
        args += ["-F", f"after={after}"]
    out = subprocess.run(args, capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def answer(body: str, label: str) -> str:
    """The text under a form heading, up to the next heading.

    Discussion forms render as '### Label' followed by the answer, so the
    answers are recoverable without asking the API for the form schema.
    """
    pattern = rf"^###\s+{re.escape(label)}\s*$(.*?)(?=^###\s|\Z)"
    found = re.search(pattern, body, re.MULTILINE | re.DOTALL)
    return found.group(1).strip() if found else ""


def ticked(body: str) -> list[str]:
    section = answer(body, "What works")
    return [
        line.split("]", 1)[1].strip()
        for line in section.splitlines()
        if line.strip().startswith("- [x]") or line.strip().startswith("- [X]")
    ]


def clean(value: str, limit: int = 60) -> str:
    """One line, no markdown that could break out of a table cell."""
    value = value.replace("|", "/").replace("\n", " ").strip()
    return value[:limit]


def join_ticked(items: list[str], limit: int = 3) -> str:
    """The ticked boxes, shortened by dropping items rather than characters.

    Cutting the joined string mid-word left things like "Controls (preheat,"
    in the table -- a dangling bracket that reads as a broken row rather than
    an abbreviated one.
    """
    if not items:
        return "—"

    shown = [clean(i, 40) for i in items[:limit]]
    remaining = len(items) - len(shown)

    if remaining > 0:
        return ", ".join(shown) + f" +{remaining} more"

    return ", ".join(shown)


def main() -> int:
    reports: list[dict] = []
    after = None

    while True:
        data = graphql(after)["data"]["repository"]["discussions"]
        for node in data["nodes"]:
            if (node.get("category") or {}).get("name") != CATEGORY:
                continue
            body = node.get("body") or ""
            model = clean(answer(body, "Printer model"), 40)
            if not model:
                continue
            reports.append({
                "model": model,
                "ace": clean(answer(body, "Multi-colour unit"), 20),
                "connection": clean(answer(body, "How is it connected?"), 32),
                "works": ticked(body),
                "url": node["url"],
                "number": node["number"],
            })
        if not data["pageInfo"]["hasNextPage"]:
            break
        after = data["pageInfo"]["endCursor"]

    readme = pathlib.Path("README.md")
    text = readme.read_text()

    if START not in text or END not in text:
        print(f"markers not found in README.md; nothing to do", file=sys.stderr)
        return 0

    if reports:
        rows = ["| Printer | Unit | Connection | Confirmed working | Report |",
                "| --- | --- | --- | --- | --- |"]
        for r in sorted(reports, key=lambda x: x["model"]):
            rows.append(
                f"| {r['model']} | {r['ace']} | {r['connection']} | {join_ticked(r['works'])} "
                f"| [#{r['number']}]({r['url']}) |"
            )
        table = "\n".join(rows)
        summary = f"{len(reports)} report{'s' if len(reports) != 1 else ''}"
    else:
        table = (
            "_No reports yet. If you run one of these printers, "
            "[tell us how it went](https://github.com/Nino6689/hass-anycubic/discussions) "
            "— it is the only way this list "
            "rests on something firmer than inference._"
        )
        summary = "no reports yet"

    block = f"{START}\n{table}\n{END}"
    updated = re.sub(
        re.escape(START) + r".*?" + re.escape(END), block, text, flags=re.DOTALL
    )

    changed = updated != text
    if changed:
        readme.write_text(updated)

    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a") as handle:
            handle.write(f"changed={'true' if changed else 'false'}\n")
            handle.write(f"summary={summary}\n")

    print(f"{len(reports)} report(s); README {'updated' if changed else 'unchanged'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
