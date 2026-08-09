#!/usr/bin/env python3
"""Update the supporter count in the README from Buy Me a Coffee.

Reads one number -- how many people have bought a coffee -- and writes it
between the SUPPORTERS markers.

It deliberately does NOT publish names, and it never even looks at an
individual supporter. The count comes from the paginator's `total`, so no
supporter object is parsed, which means no name, email, note or amount enters
this process at any point.

That is not timidity, it is the only safe reading of the API. Buy Me a Coffee
returns private supporters alongside public ones and expects the caller to
filter them out, using `support_visibility` and an undocumented
`support_hidden` -- and no source, including Buy Me a Coffee's own
documentation, states which value of `support_visibility` means public, or
whether it governs the supporter or merely their message. Guess the polarity
wrong and this publishes the names of people who paid to stay anonymous,
silently, looking exactly like correct output, into a public repository whose
history is mirrored beyond anyone's reach. A count cannot be wrong that way.

Named credits are added by hand, with the supporter's agreement.
"""

from __future__ import annotations

import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request

API = "https://developers.buymeacoffee.com/api/v1/supporters"

START = "<!-- SUPPORTERS-COUNT:START -->"
END = "<!-- SUPPORTERS-COUNT:END -->"


def fetch_total(token: str) -> int:
    """How many supporters there are, and nothing else about them."""
    request = urllib.request.Request(
        API,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        # Deliberately not printing the body: an error response can echo the
        # request back, and this runs in a public log.
        raise SystemExit(f"Buy Me a Coffee returned HTTP {error.code}") from None
    except Exception as error:
        raise SystemExit(f"Could not reach Buy Me a Coffee: {type(error).__name__}") from None

    total = payload.get("total")

    if not isinstance(total, int):
        # A shape we do not recognise means the API changed. Write nothing
        # rather than a number that might mean something else.
        raise SystemExit("Unexpected response shape; refusing to guess at a total")

    return total


def phrase(total: int) -> str:
    if total <= 0:
        return (
            "_Nobody yet — and that is entirely fine. The integration is free either way._"
        )
    if total == 1:
        return "**One person** has bought me a coffee. Thank you, genuinely."
    return f"**{total} people** have bought me a coffee. Thank you, all of you."


def main() -> int:
    token = os.environ.get("BMC_TOKEN", "").strip()

    if not token:
        # Doing nothing is safe; guessing is not. The rule this must not break
        # is "never write a number we are unsure of" -- writing no number at
        # all does not break it, so a missing secret is not a failure.
        #
        # It is only a failure when someone asked for it by hand, because then
        # silence would look like success. On a schedule it stays quiet, so an
        # unconfigured repository does not mail out a failure every Monday.
        by_hand = os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch"

        if by_hand:
            print(
                "BMC_TOKEN is not set. Add it as a repository secret "
                "(Settings -> Secrets and variables -> Actions).",
                file=sys.stderr,
            )
            return 1

        print("BMC_TOKEN is not set; leaving the count alone.")
        output = os.environ.get("GITHUB_OUTPUT")
        if output:
            with open(output, "a") as handle:
                handle.write("changed=false\n")
        return 0

    total = fetch_total(token)

    readme = pathlib.Path("README.md")
    text = readme.read_text()

    if START not in text or END not in text:
        print("markers not found in README.md", file=sys.stderr)
        return 1

    block = f"{START}\n{phrase(total)}\n{END}"
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
            handle.write(f"total={total}\n")

    print(f"{total} supporter(s); README {'updated' if changed else 'unchanged'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
