# =============================================================================
#  Anycubic Cloud token helper  —  Windows
# =============================================================================
#
#  WHAT THIS DOES, in plain English:
#    1. Reads ONE file that Anycubic Slicer Next already saved on your PC.
#    2. Copies your login token from it to your clipboard.
#    3. Shows a pop-up window telling you it's done.
#
#  WHAT IT DOES NOT DO:
#    * It does NOT connect to the internet or send anything anywhere.
#    * It does NOT change or delete anything.
#    * It does NOT ask for your password.
#
#  You can read every line below - it's short on purpose. Nothing is hidden.
#
#  TO RUN IT:  right-click this file  ->  "Run with PowerShell".
#  (If Windows warns about running a script, that's the normal prompt for any
#   .ps1 file; this one only reads one file and copies one value.)
# =============================================================================

Add-Type -AssemblyName System.Windows.Forms | Out-Null

function Show-Popup($text) {
    [System.Windows.Forms.MessageBox]::Show($text, "Anycubic Cloud token helper") | Out-Null
}

$conf = Join-Path $env:APPDATA "AnycubicSlicerNext\AnycubicSlicerNext.conf"

if (-not (Test-Path $conf)) {
    Show-Popup("Couldn't find Anycubic Slicer Next on this PC.`n`nPlease install it, sign in once (Settings -> Account), then run this again.")
    exit
}

try {
    $token = (Get-Content $conf -Raw | ConvertFrom-Json).anycubic_cloud.access_token
} catch {
    $token = $null
}

if ([string]::IsNullOrWhiteSpace($token)) {
    Show-Popup("Your Slicer Next didn't have a readable token.`n`nMake sure you've signed in to your Anycubic account inside the slicer at least once, then run this again.")
    exit
}

if ($token.StartsWith("eyJ")) {
    Set-Clipboard -Value $token
    Show-Popup("Done!`n`nYour Anycubic token has been copied to your clipboard.`n`nNow go to Home Assistant, choose the Slicer option, and paste it (Ctrl+V) into the token box.")
} else {
    # Newer slicer builds encrypt the token - it won't start with eyJ.
    Show-Popup("Your Slicer Next has encrypted its saved token, so it can't be read directly.`n`nThis happens on newer slicer versions. See the integration's README section 'If your slicer config is encrypted' for the recovery steps.`n`n(Nothing on your PC was changed.)")
}
