/* A very small PDF writer — enough to produce the Hanekom quotation-request
   document, and nothing more.

   Why hand-written rather than jsPDF or pdfmake:

   The site's whole security posture is that it loads NOTHING from a third
   party and its Content-Security-Policy permits no outside origin. Pulling in
   a PDF library from a CDN would undo that in one line. Bundling one would
   add ~350 KB and a supply chain to this site's only dependency-free build.
   The document we need is a table, some rules and one logo — about 300 lines
   of PDF operators. So it is written here, in full view, with no dependency.

   What it supports, because that is all the document needs:
     - A4 pages, multiple, with automatic overflow
     - Helvetica and Helvetica-Bold (PDF base-14 — no font embedding)
     - Text, filled rectangles, lines
     - One embedded baseline JPEG (DCTDecode)

   It does NOT support: Unicode beyond Latin-1 (text is transliterated to
   ASCII), transparency, or vector graphics. If any of those are ever needed,
   that is the point to reach for a real library — not before.

   PDF cross-reference tables are byte offsets, so everything here is built as
   bytes from the start. Building strings and converting at the end silently
   corrupts offsets the moment a multi-byte character appears.  */
(function () {
  'use strict';

  var A4 = { w: 595.28, h: 841.89 };

  /* ---------- byte plumbing ---------- */

  function Bytes() { this.parts = []; this.len = 0; }
  Bytes.prototype.raw = function (u8) { this.parts.push(u8); this.len += u8.length; return this; };
  Bytes.prototype.str = function (s) {
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xff;
    return this.raw(u);
  };
  Bytes.prototype.done = function () {
    var out = new Uint8Array(this.len), o = 0;
    for (var i = 0; i < this.parts.length; i++) { out.set(this.parts[i], o); o += this.parts[i].length; }
    return out;
  };

  // The base-14 fonts are WinAnsi. Rather than carry an encoding table for
  // characters this document will never legitimately contain, fold the few
  // typographic ones the site actually uses down to ASCII and drop the rest.
  // A product name is never silently mangled into something misleading:
  // anything unmappable becomes '?', which is visible.
  var FOLD = {
    '—': '-', '–': '-', '‒': '-', '−': '-',
    '‘': "'", '’': "'", '“': '"', '”': '"',
    '…': '...', '·': '-', ' ': ' ', '×': 'x',
    '™': '(TM)', '®': '(R)', '°': ' deg', '≥': '>=', '≤': '<='
  };
  function ascii(s) {
    s = String(s == null ? '' : s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (FOLD[c] !== undefined) out += FOLD[c];
      else if (c.charCodeAt(0) < 128) out += c;
      else out += '?';
    }
    return out;
  }
  // ( ) and \ terminate or escape a PDF string literal.
  function pdfStr(s) { return ascii(s).replace(/([\\()])/g, '\\$1'); }

  /* ---------- Helvetica metrics ----------
     Widths for the printable ASCII range, in 1/1000 em, from the Adobe AFM
     files for Helvetica and Helvetica-Bold. Needed to centre and right-align
     text and to wrap descriptions; without them every column would have to be
     left-aligned and guessed. */
  var W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  var W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

  function width(text, size, bold) {
    var t = ascii(text), tab = bold ? W_BOLD : W_REG, total = 0;
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      total += (c >= 32 && c <= 126) ? tab[c - 32] : 556;
    }
    return total * size / 1000;
  }

  /* ---------- document ---------- */

  function Doc(opts) {
    opts = opts || {};
    this.pages = [];
    this.image = opts.image || null;     // { data: Uint8Array, w, h }
    this.margin = opts.margin || 40;
    this.newPage();
  }

  Doc.prototype.newPage = function () {
    this.ops = [];
    this.pages.push(this.ops);
    this.y = A4.h - this.margin;
    return this;
  };

  function num(n) {
    // PDF wants a plain decimal. Also guards against NaN reaching the file,
    // which produces a document that opens blank with no error anywhere.
    if (!isFinite(n)) throw new Error('non-finite coordinate in PDF');
    return (Math.round(n * 100) / 100).toString();
  }

  Doc.prototype.rect = function (x, y, w, h, rgb) {
    this.ops.push(num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' rg ' +
                  num(x) + ' ' + num(y) + ' ' + num(w) + ' ' + num(h) + ' re f');
    return this;
  };
  Doc.prototype.line = function (x1, y1, x2, y2, rgb, w) {
    this.ops.push(num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' RG ' +
                  num(w || 0.5) + ' w ' + num(x1) + ' ' + num(y1) + ' m ' +
                  num(x2) + ' ' + num(y2) + ' l S');
    return this;
  };
  Doc.prototype.text = function (x, y, s, o) {
    o = o || {};
    var size = o.size || 9, bold = !!o.bold, rgb = o.color || [0, 0, 0];
    var t = pdfStr(s);
    if (o.align === 'right') x -= width(s, size, bold);
    else if (o.align === 'center') x -= width(s, size, bold) / 2;
    this.ops.push('BT ' + num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' rg /' +
                  (bold ? 'FB' : 'FR') + ' ' + num(size) + ' Tf ' +
                  num(x) + ' ' + num(y) + ' Td (' + t + ') Tj ET');
    return this;
  };
  Doc.prototype.img = function (x, y, w, h) {
    if (!this.image) return this;
    this.ops.push('q ' + num(w) + ' 0 0 ' + num(h) + ' ' + num(x) + ' ' + num(y) + ' cm /IM0 Do Q');
    return this;
  };

  // Greedy wrap on the real glyph widths, so a long product description
  // occupies the number of lines it actually needs.
  Doc.prototype.wrap = function (s, maxW, size, bold) {
    var words = ascii(s).split(/\s+/).filter(Boolean), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (width(test, size, bold) <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = words[i]; }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  /* ---------- serialise ---------- */

  Doc.prototype.build = function (meta) {
    meta = meta || {};
    var self = this;
    var objects = [];                 // 1-based; objects[i] is object i+1
    function add(bodyBytes) { objects.push(bodyBytes); return objects.length; }
    function addStr(s) { var b = new Bytes(); b.str(s); return add(b.done()); }

    var nPages = this.pages.length;
    // Reserve: 1 catalog, 2 pages tree, then contents + page objects.
    var catalogId = addStr('<< /Type /Catalog /Pages 2 0 R >>');
    var pagesId = addStr('');          // patched below
    var fontR = addStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    var fontB = addStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    var imgId = 0;
    if (this.image) {
      var ib = new Bytes();
      ib.str('<< /Type /XObject /Subtype /Image /Width ' + this.image.w + ' /Height ' + this.image.h +
             ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
             this.image.data.length + ' >>\nstream\n');
      ib.raw(this.image.data);
      ib.str('\nendstream');
      imgId = add(ib.done());
    }

    var res = '<< /Font << /FR ' + fontR + ' 0 R /FB ' + fontB + ' 0 R >>' +
              (imgId ? ' /XObject << /IM0 ' + imgId + ' 0 R >>' : '') + ' >>';

    var pageIds = [];
    this.pages.forEach(function (ops) {
      var stream = ops.join('\n');
      var cid = addStr('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      pageIds.push(addStr('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + num(A4.w) + ' ' + num(A4.h) +
                          '] /Resources ' + res + ' /Contents ' + cid + ' 0 R >>'));
    });

    var kids = pageIds.map(function (i) { return i + ' 0 R'; }).join(' ');
    var pb = new Bytes();
    pb.str('<< /Type /Pages /Count ' + nPages + ' /Kids [' + kids + '] >>');
    objects[pagesId - 1] = pb.done();

    var infoId = addStr('<< /Title (' + pdfStr(meta.title || 'Quotation request') + ')' +
                        ' /Author (' + pdfStr(meta.author || 'Hanekom Innovations Limited') + ')' +
                        ' /Creator (' + pdfStr(meta.creator || 'hanekom.co.zm') + ')' +
                        ' /Producer (' + pdfStr(meta.creator || 'hanekom.co.zm') + ') >>');

    // Assemble, recording the byte offset of every object for the xref table.
    var out = new Bytes(), offsets = [];
    out.str('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    objects.forEach(function (body, i) {
      offsets.push(out.len);
      out.str((i + 1) + ' 0 obj\n').raw(body).str('\nendobj\n');
    });
    var xref = out.len;
    var x = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (o) {
      x += ('0000000000' + o).slice(-10) + ' 00000 n \n';
    });
    x += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogId + ' 0 R /Info ' +
         infoId + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    out.str(x);
    return out.done();
  };

  window.HanekomPDF = { Doc: Doc, A4: A4, width: width, ascii: ascii };
})();
