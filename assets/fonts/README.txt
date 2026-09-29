Self-hosting the Inter typeface
================================

This folder is empty on purpose. The site currently renders in the visitor's
operating-system interface font and loads NO webfont and NO third-party
resource of any kind.

That is a deliberate security and privacy decision, not an oversight. The
site previously loaded Inter from fonts.googleapis.com, which meant every
visitor's IP address was disclosed to a third party before any Hanekom
content had loaded — a transfer with no notice and no lawful basis under
Zambia's Data Protection Act No. 3 of 2021, and one that also forced the
Content-Security-Policy to permit an outside origin.

If you want Inter back, host it yourself:

  1. Download Inter from https://rsms.me/inter/  (SIL Open Font Licence —
     free to use and redistribute, including commercially).
  2. From the "web" folder of that download, copy these four files here:
       Inter-Regular.woff2
       Inter-SemiBold.woff2
       Inter-Bold.woff2
       Inter-ExtraBold.woff2
  3. Run: python3 build.py

The build detects the files, inlines the @font-face rules and preloads the
regular weight. Nothing else needs changing, and the site still makes zero
third-party requests because the fonts are served from hanekom.co.zm.

The build prints which mode it produced. Do not add a link to Google Fonts
back into build.py — the Content-Security-Policy will block it, and the page
will silently lose the font rather than fall back cleanly.
