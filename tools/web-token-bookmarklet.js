// =============================================================================
//  Anycubic Cloud token helper  —  Web (bookmarklet, no terminal at all)
// =============================================================================
//
//  This is the readable source of the one-click bookmarklet. In plain English:
//    1. It reads ONE value ("XX-Token") that the Anycubic website already
//       stored in your browser after you logged in.
//    2. It copies that value to your clipboard.
//    3. It shows a little pop-up so you know it worked.
//
//  It runs only on the Anycubic page, in your own browser. It does NOT send
//  anything anywhere, and it can't see anything except that one saved value.
//
//  HOW TO USE (see tools/README.md for the picture version):
//    1. Make a new bookmark in your browser. For its address/URL, paste the
//       single-line "javascript:" version from tools/README.md.
//    2. Go to  https://cloud-universe.anycubic.com/file  and sign in.
//    3. Click the bookmark. Your token is copied — paste it into Home Assistant
//       using the "Web" option.
// =============================================================================

(function () {
  var token = window.localStorage["XX-Token"];

  if (!token) {
    alert(
      "No Anycubic token found on this page.\n\n" +
        "Make sure you are signed in at cloud-universe.anycubic.com, " +
        "then click this bookmark again from that tab."
    );
    return;
  }

  function done() {
    alert(
      "Done ✅\n\nYour Anycubic token has been copied to your clipboard.\n\n" +
        "Now paste it into Home Assistant using the “Web” option.\n\n" +
        "(Heads up: web tokens give status updates only — for live, " +
        "second-by-second updates use the Slicer option instead.)"
    );
  }

  // Preferred: copy straight to the clipboard (allowed because you clicked).
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(token).then(done, function () {
      // Fallback if the browser blocks silent clipboard writes:
      window.prompt("Copy your token (Ctrl/Cmd + C), then paste it into Home Assistant:", token);
    });
  } else {
    window.prompt("Copy your token (Ctrl/Cmd + C), then paste it into Home Assistant:", token);
  }
})();
