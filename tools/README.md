# Getting your Anycubic token — the easy, safe ways

Home Assistant can't log in to Anycubic for you: their login uses a captcha and
2‑factor, which software can't tick. So instead you grab a **token** (a long
"you're already logged in" pass) from somewhere you *are* signed in, and paste
that one value into Home Assistant.

The helpers here make that a **one‑click** job. Pick the row that matches you.

| You have… | Use | Live updates? |
|---|---|---|
| An Anycubic **web** login in your browser | [Web bookmarklet](#web--one-click-bookmarklet) — no terminal at all | Status only |
| **Anycubic Slicer Next** on a **Mac** | [macOS helper](#mac--double-click-helper) — double‑click | ✅ Full, live |
| **Anycubic Slicer Next** on **Windows** | [Windows helper](#windows--right-click-helper) — right‑click → Run | ✅ Full, live |

> ### 🛡️ Before you worry — here's exactly what these do
> Every helper here is short and **you can read all of it**. In plain terms:
> - It reads **one value** that Anycubic already saved on *your own* computer or browser.
> - It copies that value to your **clipboard** so you can paste it.
> - **It does not connect to the internet, send anything anywhere, ask for your password, or change/delete a single thing.**
>
> If a helper ever can't find your token, it says so and stops — it never guesses.

---

## Web — one‑click bookmarklet

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

## Mac — double‑click helper

**1.** Download [`get-anycubic-token-macos.command`](get-anycubic-token-macos.command).

**2.** Make sure you've signed in once inside **Anycubic Slicer Next**
(**Settings → Account**).

**3.** **Double‑click** the file. A macOS pop‑up will tell you your token is
copied to the clipboard.

**4.** Paste it into Home Assistant using the **Slicer** option.

> First time, macOS may say *"cannot be opened because it is from an
> unidentified developer."* That's the standard warning for any downloaded
> script. Right‑click the file → **Open** → **Open**, and it'll run. You only
> need to do that once, and you can read the whole script first — it's a dozen lines.

---

## Windows — right‑click helper

**1.** Download [`Get-AnycubicToken-Windows.ps1`](Get-AnycubicToken-Windows.ps1).

**2.** Make sure you've signed in once inside **Anycubic Slicer Next**
(**Settings → Account**).

**3.** **Right‑click** the file → **Run with PowerShell**. A pop‑up window will
tell you your token is copied to the clipboard.

**4.** Paste it into Home Assistant using the **Slicer** option.

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
