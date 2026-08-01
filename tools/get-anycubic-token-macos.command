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
#  To run it: double-click this file. That's it.
# =============================================================================

CONF="$HOME/Library/Application Support/AnycubicSlicerNext/AnycubicSlicerNext.conf"

# A small helper so we can show native macOS pop-ups instead of scary terminal text.
popup() { # popup "message"  (title fixed)
  /usr/bin/osascript -e "display dialog \"$1\" with title \"Anycubic Cloud token helper\" buttons {\"OK\"} default button \"OK\"" >/dev/null 2>&1
}

if [ ! -f "$CONF" ]; then
  popup "Couldn't find Anycubic Slicer Next on this Mac.

Please install it, sign in once (Settings → Account), then run this again."
  exit 1
fi

# Read the token out of the file with Python (built in to macOS). Read-only.
TOKEN="$(/usr/bin/python3 - "$CONF" <<'PY'
import json, sys
try:
    data = json.load(open(sys.argv[1]))
    print((data.get("anycubic_cloud") or {}).get("access_token", ""))
except Exception:
    print("")
PY
)"

# A valid Slicer token is a long string starting with "eyJ".
if [ -z "$TOKEN" ]; then
  popup "Your Slicer Next didn't have a readable token.

Make sure you have signed in to your Anycubic account inside the slicer at least once, then run this again."
  exit 1
fi

case "$TOKEN" in
  eyJ*)
    printf "%s" "$TOKEN" | /usr/bin/pbcopy
    popup "Done ✅

Your Anycubic token has been copied to your clipboard.

Now go to Home Assistant, choose the Slicer option, and paste it (⌘V) into the token box."
    ;;
  *)
    # Newer slicer builds encrypt the token — it won't start with eyJ.
    popup "Your Slicer Next has encrypted its saved token, so it can't be read directly.

This happens on newer slicer versions. See the integration's README section
'If your slicer config is encrypted' for the recovery steps.

(Nothing on your Mac was changed.)"
    ;;
esac
