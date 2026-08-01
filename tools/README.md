# Getting your Anycubic token — the easy, safe ways

Home Assistant can't log in to Anycubic for you: their login uses a captcha and
2‑factor, which software can't tick. So instead you grab a **token** (a long
"you're already logged in" pass) from somewhere you *are* signed in, and paste
that one value into Home Assistant.

The helpers here make that a **one‑click** job. Pick the row that matches you.

| You have… | Use | Live updates? |
|---|---|---|
| An Anycubic **web** login in your browser | [Web bookmarklet](#web--one-click-bookmarklet) — no terminal at all | Status only |
| **Anycubic Slicer Next** on a **Mac** | [macOS one‑liner or helper](#mac) | ✅ Full, live |
| **Anycubic Slicer Next** on **Windows** | [Windows one‑liner or helper](#windows) | ✅ Full, live |

> ### 🛡️ Before you worry — here's exactly what these do
> Every helper here is short and **you can read all of it**. In plain terms:
> - It reads **one value** that Anycubic already saved on *your own* computer or browser.
> - It copies that value to your **clipboard** so you can paste it.
> - **It does not connect to the internet, send anything anywhere, ask for your password, or change/delete a single thing.**
>
> If a helper ever can't find your token, it says so and stops — it never guesses.

---

## Web — one-click bookmarklet

The gentlest option: no terminal, no files, no code to run. You add a normal
browser **bookmark** once, then click it.

**1. Make the bookmark.** Create a new bookmark in your browser and, for its
**address / URL**, paste this whole line (it's the readable script in
[`web-token-bookmarklet.js`](web-token-bookmarklet.js), just squashed onto one line):

```text
javascript:(function%20()%20%7B%20var%20token%20%3D%20window.localStorage%5B%22XX-Token%22%5D%3B%20if%20(!token)%20%7B%20alert(%20%22No%20Anycubic%20token%20found%20on%20this%20page.%5Cn%5Cn%22%20%2B%20%22Make%20sure%20you%20are%20signed%20in%20at%20cloud-universe.anycubic.com%2C%20%22%20%2B%20%22then%20click%20this%20bookmark%20again%20from%20that%20tab.%22%20)%3B%20return%3B%20%7D%20function%20done()%20%7B%20alert(%20%22Done%20%E2%9C%85%5Cn%5CnYour%20Anycubic%20token%20has%20been%20copied%20to%20your%20clipboard.%5Cn%5Cn%22%20%2B%20%22Now%20paste%20it%20into%20Home%20Assistant%20using%20the%20%E2%80%9CWeb%E2%80%9D%20option.%5Cn%5Cn%22%20%2B%20%22(Heads%20up%3A%20web%20tokens%20give%20status%20updates%20only%20%E2%80%94%20for%20live%2C%20%22%20%2B%20%22second-by-second%20updates%20use%20the%20Slicer%20option%20instead.)%22%20)%3B%20%7D%20if%20(navigator.clipboard%20%26%26%20navigator.clipboard.writeText)%20%7B%20navigator.clipboard.writeText(token).then(done%2C%20function%20()%20%7B%20window.prompt(%22Copy%20your%20token%20(Ctrl%2FCmd%20%2B%20C)%2C%20then%20paste%20it%20into%20Home%20Assistant%3A%22%2C%20token)%3B%20%7D)%3B%20%7D%20else%20%7B%20window.prompt(%22Copy%20your%20token%20(Ctrl%2FCmd%20%2B%20C)%2C%20then%20paste%20it%20into%20Home%20Assistant%3A%22%2C%20token)%3B%20%7D%20%7D)()%3B
```

Give it a friendly name like **"Get Anycubic token"**.

**2. Sign in.** Go to <https://cloud-universe.anycubic.com/file> and log in.

**3. Click the bookmark.** A pop‑up says your token is copied. Paste it into
Home Assistant using the **Web** option.

> Web tokens give **status updates only** (roughly once a minute). For live,
> second‑by‑second updates and the control buttons, use the **Slicer** option below.

---

## Mac

Sign in once inside **Anycubic Slicer Next** (**Settings → Account**) and quit it first.

### The quick way — one line, nothing to download

Open **Terminal** (⌘Space, type "Terminal") and paste this:

```bash
plutil -extract anycubic_cloud.access_token raw -o - ~/Library/Application\ Support/AnycubicSlicerNext/AnycubicSlicerNext.conf | tr -d '\n' | pbcopy && echo "Token copied to clipboard"
```

Your token is now on the clipboard — paste it into Home Assistant using the
**Slicer** option. `plutil` ships with macOS, so nothing needs installing.

### The double‑click way

⚠️ **Downloading `.command` from GitHub and double‑clicking it does not work**,
and it isn't your fault. GitHub serves the file without the executable flag, so
macOS opens it in TextEdit instead of running it. If it came through a browser
it is also quarantined, so Gatekeeper blocks it even after you fix the flag.

Run this once to put a *working* copy on your Desktop:

```bash
curl -fsSL https://raw.githubusercontent.com/Nino6689/hass-anycubic_cloud/main/tools/get-anycubic-token-macos.command -o ~/Desktop/AnycubicToken.command && chmod +x ~/Desktop/AnycubicToken.command && xattr -c ~/Desktop/AnycubicToken.command && echo "Saved to your Desktop"
```

`chmod +x` restores the executable flag and `xattr -c` clears the quarantine.
From then on, **double‑click `AnycubicToken.command`** whenever you need a fresh
token — a pop‑up confirms it's on your clipboard.

You can read the whole script first; it's a few dozen lines and it only reads
one file.

---

## Windows

Sign in once inside **Anycubic Slicer Next** (**Settings → Account**) and quit it first.

### The quick way — one line, nothing to download

Open **PowerShell** (Start → type "PowerShell") and paste this:

```powershell
(Get-Content "$env:APPDATA\AnycubicSlicerNext\AnycubicSlicerNext.conf" -Raw | ConvertFrom-Json).anycubic_cloud.access_token | Set-Clipboard; "Token copied to clipboard"
```

Your token is now on the clipboard — paste it into Home Assistant using the
**Slicer** option. Typing a command interactively isn't affected by the script
restrictions below, so this works on a stock Windows install.

### The right‑click way

⚠️ Windows blocks scripts downloaded from the internet. A `.ps1` saved from
GitHub carries a "mark of the web", and the default execution policy refuses to
run it — usually with *"cannot be loaded because running scripts is disabled on
this system"*.

Download [`Get-AnycubicToken-Windows.ps1`](Get-AnycubicToken-Windows.ps1), then
in PowerShell unblock it once:

```powershell
Unblock-File "$HOME\Downloads\Get-AnycubicToken-Windows.ps1"
```

After that, **right‑click** the file → **Run with PowerShell**. If it still
refuses, your machine's execution policy disallows local scripts entirely; use
the one‑liner above instead.

> The macOS instructions above were tested end to end on a real Mac. The Windows
> steps follow the same reasoning but have **not** been verified on a Windows
> machine — if they don't work for you, please
> [open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues) and say
> what you saw.

> Windows may ask whether you're sure about running a script — that prompt
> appears for *any* `.ps1` file. This one only reads one file and copies one
> value, and you can read every line first.

---

## "My token is encrypted" (newer Slicer Next)

Recent Slicer Next versions **scramble** the saved token, so the helpers above
will tell you they can't read it. That's not a fault — Anycubic encrypted it,
and the key is locked inside the slicer.

There's a recovery method (a one‑time memory snapshot of the running slicer) in
the main [README, "If your slicer config is encrypted"](../README.md#2-get-an-auth-token).
It's a bit more involved, but still runs entirely on your own PC.

---

## Why is this needed at all?

Anycubic's own login has a captcha and 2‑factor step designed to stop
automation — which also stops Home Assistant from logging in directly. Grabbing
a token is the safe way around that: you log in the normal way (on Anycubic's
own site or slicer), and just hand Home Assistant the "already logged in" pass.

If Anycubic ever offers a proper "connect an app" option, this whole dance goes
away — see the project roadmap.
