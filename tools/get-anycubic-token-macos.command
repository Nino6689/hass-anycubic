#!/bin/bash
# =============================================================================
#  Anycubic Cloud token helper  —  macOS
# =============================================================================
#
#  WHAT THIS DOES, in plain English:
#    1. Reads ONE file that Anycubic Slicer Next already saved on your Mac.
#    2. Copies your login token from it to your clipboard.
#    3. Shows a pop-up telling you it's done.
#
#  WHAT IT DOES NOT DO:
#    • It does NOT connect to the internet or send anything anywhere.
#    • It does NOT change or delete anything.
#    • It does NOT ask for your password.
#
#  You can read every line below — it's short on purpose. Nothing is hidden.
#
#  TO RUN IT: double-click this file.
#  If double-clicking opens it in TextEdit instead of running it, macOS stripped
#  the "executable" flag when you downloaded it. See tools/README.md for the
#  one-line fix, or just use the copy-and-paste command in the README instead.
# =============================================================================

CONF="$HOME/Library/Application Support/AnycubicSlicerNext/AnycubicSlicerNext.conf"

# Native macOS pop-ups instead of scary terminal text.
popup() {
  /usr/bin/osascript -e "display dialog \"$1\" with title \"Anycubic Cloud token helper\" buttons {\"OK\"} default button \"OK\"" >/dev/null 2>&1
}

if [ ! -f "$CONF" ]; then
  popup "Couldn't find Anycubic Slicer Next on this Mac.

Please install it, sign in once (Settings → Account), then run this again."
  exit 1
fi

# plutil is part of macOS itself and reads JSON. Deliberately NOT python3 --
# that is a stub on Macs without the Xcode Command Line Tools and would pop up
# an installer prompt instead of working.
TOKEN="$(/usr/bin/plutil -extract anycubic_cloud.access_token raw -o - "$CONF" 2>/dev/null | /usr/bin/tr -d '\n')"

if [ -z "$TOKEN" ]; then
  popup "Your Slicer Next didn't have a readable token.

Sign in to your Anycubic account inside the slicer at least once, quit the slicer, then run this again."
  exit 1
fi

case "$TOKEN" in
  eyJ*)
    printf "%s" "$TOKEN" | /usr/bin/pbcopy
    popup "Done ✅

Your Anycubic token has been copied to your clipboard ($(printf %s "$TOKEN" | wc -c | tr -d ' ') characters).

Now in Home Assistant: Settings → Devices & services → Add integration → Anycubic Cloud, and paste it (⌘V) into the token box."
    ;;
  *)
    # Newer slicer builds encrypt the token — it won't start with eyJ.
    popup "Your Slicer Next has encrypted its saved token, so it can't be read directly.

This happens on newer slicer versions. See the integration's README section
'If your slicer config is encrypted' for the recovery steps.

(Nothing on your Mac was changed.)"
    exit 1
    ;;
esac
