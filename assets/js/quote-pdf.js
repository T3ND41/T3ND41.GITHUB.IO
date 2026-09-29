/* The downloadable quotation-request document.

   Modelled on Hanekom's own Excel quotation template — same letterhead, same
   column order, same subtotal / VAT / total arithmetic, same terms — with two
   deliberate differences:

   1. NO BANK DETAILS. The Excel template carries the Stanbic account number
      and Swift code, which is right for a document Hanekom prepares and sends
      to a named customer. It is wrong for a document any anonymous visitor can
      generate from a public web page. Publishing a perfect Hanekom letterhead
      alongside real bank details is precisely the raw material for invoice
      fraud: the attacker keeps the letterhead and substitutes their own
      account. So this document carries none, and says where the real details
      come from.

   2. IT IS A REQUEST, NOT A QUOTATION. Prices here are catalogue prices, VAT
      and stock are unconfirmed, and delivery is not costed. Titling it
      "quotation" would invite somebody to pay against it. It is titled
      "Quotation request", it says on its face that it is not a payable
      document, and it carries an anti-fraud line telling the reader to
      telephone before paying anyone claiming to be Hanekom.

   Everything else — the products, the prices, the VAT rate, the terms, the
   contact block — comes from site.config.json and products.js, so it cannot
   drift from the website.  */
(function () {
  'use strict';

  var CFG = window.HANEKOM_CONFIG || {};
  var M = 38;                                  // page margin, points
  var A4 = { w: 595.28, h: 841.89 };
  var RIGHT = A4.w - M;
  var COLW = A4.w - M * 2;

  // House colours, matching the site and the Excel template.
  var GREEN = [0.161, 0.404, 0.169];           // dark green header bars
  var GREEN_L = [0.373, 0.659, 0.235];         // brand green
  var GOLD = [0.914, 0.710, 0.227];
  var INK = [0.10, 0.12, 0.11];
  var GREY = [0.42, 0.45, 0.43];
  var RULE = [0.78, 0.80, 0.78];
  var BAND = [0.955, 0.965, 0.950];

  var VAT_RATE = (CFG.quote && CFG.quote.vatRate) || 0.16;
  var ODOO = CFG.odooRef || {};

  // Shrink text until it fits its column rather than letting it overlap the
  // next one. Bottoms out at 5.4pt -- below that it would be unreadable, and a
  // code that long is a data problem to fix in products.js, not to hide here.
  function fit(text, maxW, size, bold) {
    while (size > 5.4 && window.HanekomPDF.width(text, size, bold) > maxW) size -= 0.2;
    return size;
  }

  function money(n) {
    return n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function today() {
    var d = new Date();
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }
  // A reference the buyer and Hanekom can both quote in an email. Not a
  // sequence number — this document is generated in the visitor's browser and
  // has no way to know what Hanekom's last quote number was, so inventing one
  // that looked sequential would be a lie. The W prefix says "from the web".
  function reference() {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) +
                ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    var rnd = Math.floor(Math.random() * 46656).toString(36).toUpperCase();
    return 'W' + stamp + '-' + ('000' + rnd).slice(-3);
  }

  /* ---------- fetch the letterhead once, on demand ---------- */
  var logoPromise = null;
  function logo() {
    if (logoPromise) return logoPromise;
    logoPromise = fetch('assets/img/logo-pdf.jpg')
      .then(function (r) { if (!r.ok) throw new Error('logo ' + r.status); return r.arrayBuffer(); })
      .then(function (b) { return { data: new Uint8Array(b), w: 640, h: 205 }; })
      .catch(function () { return null; });   // a missing logo must not stop the download
    return logoPromise;
  }

  /* ---------- page furniture ---------- */

  function letterhead(doc, ref) {
    var y = A4.h - M;

    doc.img(M, y - 44, 132, 42);

    // Company block, mirroring the template's COMPANY DETAILS / CONTACT / TPIN
    var bx = M + 250, bw = RIGHT - bx;
    doc.rect(bx, y - 14, bw, 14, GREEN);
    doc.text(bx + 6, y - 10.5, 'HANEKOM INNOVATIONS LIMITED', { size: 8, bold: true, color: [1, 1, 1] });

    var lines = [
      (CFG.address && CFG.address.kitwe) || '1559 Independence Avenue, Kitwe, Copperbelt',
      (CFG.address && CFG.address.lusaka) || '218A Mbereshi Street, Nyumba Yanga, Lusaka',
      ((CFG.wa && CFG.wa.sales && CFG.wa.sales.display) || '+260 975 956 570') + '  |  ' +
        ((CFG.email && CFG.email.primary) || 'sales@hanekom.co.zm'),
      (CFG.site || 'https://www.hanekom.co.zm').replace(/^https?:\/\//, '')
    ];
    if (CFG.company && CFG.company.tpin) lines.push('TPIN ' + CFG.company.tpin);
    var ly = y - 24;
    lines.forEach(function (t) {
      doc.text(bx + 6, ly, t, { size: 7.4, color: GREY });
      ly -= 9;
    });

    // Title bar
    var ty = Math.min(y - 56, ly - 8);
    doc.rect(M, ty - 20, COLW, 20, GREEN);
    doc.text(M + 8, ty - 14, 'QUOTATION REQUEST', { size: 11, bold: true, color: [1, 1, 1] });
    doc.text(RIGHT - 8, ty - 14, 'Ref ' + ref + '   ' + today(), { size: 8.5, align: 'right', color: [1, 1, 1] });

    // The gold rule the template uses under its header.
    doc.rect(M, ty - 23, COLW, 2, GOLD);
    return ty - 36;
  }

  function footer(doc, page, ref) {
    var y = M + 22;
    doc.line(M, y + 12, RIGHT, y + 12, RULE, 0.5);
    doc.text(M, y + 2,
      'Hanekom Innovations Limited  |  ' +
      ((CFG.email && CFG.email.primary) || 'sales@hanekom.co.zm') + '  |  ' +
      ((CFG.wa && CFG.wa.sales && CFG.wa.sales.display) || '+260 975 956 570'),
      { size: 7.2, color: GREY });
    doc.text(RIGHT, y + 2, 'Ref ' + ref + '  -  page ' + page, { size: 7.2, align: 'right', color: GREY });
    doc.text(M, y - 8,
      'Generated from hanekom.co.zm. Catalogue prices, shown before confirmation. Not a payable document.',
      { size: 7.2, color: GREY });
  }

  /* ---------- the table ---------- */

  // The code column is sized for the longest code in the catalogue,
  // "PN 10(S)+PN 361", which overran a narrower column and collided with the
  // description. fit() below is the safety net for any code added later.
  var COLS = [
    { k: 'code', label: 'Code', x: M + 4, w: 76 },
    { k: 'desc', label: 'Description', x: M + 84, w: 198 },
    { k: 'unit', label: 'Unit', x: M + 292, w: 30, align: 'center' },
    { k: 'price', label: 'Unit price (K)', x: M + 400, w: 66, align: 'right' },
    { k: 'qty', label: 'Qty', x: M + 432, w: 30, align: 'right' },
    { k: 'total', label: 'Total (K)', x: RIGHT - 4, w: 70, align: 'right' }
  ];

  function tableHead(doc, y) {
    doc.rect(M, y - 15, COLW, 15, GREEN);
    COLS.forEach(function (c) {
      var x = c.align === 'right' ? c.x : (c.align === 'center' ? c.x + c.w / 2 : c.x);
      doc.text(x, y - 10.5, c.label, { size: 7.6, bold: true, color: [1, 1, 1], align: c.align });
    });
    return y - 15;
  }

  /* ---------- build ---------- */

  function build(lines, buyer, img) {
    var D = window.HanekomPDF;
    var ref = reference();
    var doc = new D.Doc({ image: img, margin: M });
    var page = 1;
    var y = letterhead(doc, ref);

    /* buyer block */
    var hasBuyer = buyer && (buyer.company || buyer.name || buyer.email || buyer.phone);
    doc.rect(M, y - 13, COLW, 13, BAND);
    doc.text(M + 5, y - 9.5, hasBuyer ? 'PREPARED FOR' : 'YOUR DETAILS', { size: 7.4, bold: true, color: GREEN });
    y -= 13;
    var rows = [
      ['Company', buyer && buyer.company],
      ['Contact person', buyer && buyer.name],
      ['Email', buyer && buyer.email],
      ['Phone', buyer && buyer.phone],
      ['Town / site', buyer && buyer.town]
    ];
    rows.forEach(function (r) {
      doc.text(M + 5, y - 9, r[0], { size: 7.6, color: GREY });
      if (r[1]) doc.text(M + 80, y - 9, r[1], { size: 8.2, color: INK });
      else doc.line(M + 80, y - 10.5, M + 300, y - 10.5, RULE, 0.4);   // a line to write on
      y -= 12;
    });

    y -= 8;
    y = tableHead(doc, y);

    /* line items */
    var subtotal = 0, zebra = false;
    lines.forEach(function (x) {
      var p = x.p, v = x.v;
      var desc = p.name + (p.variant ? ' - ' + p.variant : '');
      var extra = [];
      if (v.s) extra.push('Size requested: ' + v.s);
      if (v.c) extra.push('Colour requested: ' + v.c);
      var wrapped = doc.wrap(desc, COLS[1].w - 6, 8, false);
      if (extra.length) wrapped = wrapped.concat(doc.wrap(extra.join('   '), COLS[1].w - 6, 7.2, false));
      var h = Math.max(ODOO[p.code] ? 24 : 16, 6 + wrapped.length * 9.4);

      if (y - h < M + 96) {                    // room for the footer
        footer(doc, page, ref);
        doc.newPage(); page++;
        y = letterhead(doc, ref);
        y = tableHead(doc, y);
      }

      if (zebra) doc.rect(M, y - h, COLW, h, BAND);
      zebra = !zebra;

      var total = p.price * v.q;
      subtotal += total;

      doc.text(COLS[0].x, y - 12, p.code, { size: fit(p.code, COLS[0].w - 4, 7.6, true), bold: true, color: INK });
      // Odoo's own reference, so whoever raises the quotation can search for
      // the product rather than match it by description.
      var oref = ODOO[p.code];
      if (oref) doc.text(COLS[0].x, y - 21, oref, { size: fit(oref, COLS[0].w - 4, 6.4, false), color: GREY });
      var ty = y - 11;
      wrapped.forEach(function (t, i) {
        var isExtra = i >= doc.wrap(desc, COLS[1].w - 6, 8, false).length;
        doc.text(COLS[1].x, ty, t, { size: isExtra ? 7.2 : 8, color: isExtra ? GREY : INK });
        ty -= 9.4;
      });
      doc.text(COLS[2].x + COLS[2].w / 2, y - 12, 'Unit', { size: 7.6, color: GREY, align: 'center' });
      doc.text(COLS[3].x, y - 12, money(p.price), { size: 8, color: INK, align: 'right' });
      doc.text(COLS[4].x, y - 12, String(v.q), { size: 8, color: INK, align: 'right' });
      doc.text(COLS[5].x, y - 12, money(total), { size: 8, bold: true, color: INK, align: 'right' });

      y -= h;
      doc.line(M, y, RIGHT, y, RULE, 0.4);
    });

    /* totals — the template's arithmetic, marked for what it is */
    var vat = subtotal * VAT_RATE;
    y -= 6;
    if (y < M + 190) { footer(doc, page, ref); doc.newPage(); page++; y = letterhead(doc, ref); }

    var tx = RIGHT - 200;
    function totalRow(label, value, bold, band) {
      if (band) doc.rect(tx, y - 15, 200, 15, band);
      doc.text(tx + 6, y - 10.5, label, { size: 8.2, bold: bold, color: bold ? [1, 1, 1] : INK });
      doc.text(RIGHT - 6, y - 10.5, value, { size: 8.2, bold: bold, align: 'right', color: bold ? [1, 1, 1] : INK });
      y -= 15;
    }
    totalRow('Subtotal', 'K ' + money(subtotal), false, BAND);
    totalRow('VAT @ ' + Math.round(VAT_RATE * 100) + '%', 'K ' + money(vat), false, BAND);
    doc.text(tx + 6, y - 10.5, 'Delivery', { size: 8.2, color: GREY });
    doc.text(RIGHT - 6, y - 10.5, 'quoted separately', { size: 8.2, align: 'right', color: GREY });
    y -= 15;
    totalRow('INDICATIVE TOTAL', 'K ' + money(subtotal + vat), true, GREEN);

    y -= 16;

    /* terms — from Hanekom's own template */
    doc.rect(M, y - 13, COLW, 13, BAND);
    doc.text(M + 5, y - 9.5, 'DELIVERY & PAYMENT TERMS', { size: 7.4, bold: true, color: GREEN });
    y -= 13;
    var terms = (CFG.quote && CFG.quote.terms) || {};
    [['Delivery period', terms.delivery || '14-21 days, confirmed on quotation'],
     ['Payment terms', terms.payment || 'Upfront payment or as negotiated'],
     ['Warranty', terms.warranty || 'As per manufacturer specifications'],
     ['Validity', terms.validity || 'Catalogue prices; confirmed on quotation']
    ].forEach(function (r) {
      doc.text(M + 5, y - 9, r[0], { size: 7.6, color: GREY });
      doc.text(M + 100, y - 9, r[1], { size: 8, color: INK });
      y -= 11;
    });

    y -= 10;

    /* the honest bit — why this document is not an invoice */
    var noteH = 62;
    if (y - noteH < M + 40) { footer(doc, page, ref); doc.newPage(); page++; y = letterhead(doc, ref); }
    doc.rect(M, y - noteH, COLW, noteH, [1, 0.972, 0.898]);
    doc.rect(M, y - noteH, 2.5, noteH, GOLD);
    doc.text(M + 10, y - 13, 'This is a request, not a quotation.', { size: 8.6, bold: true, color: INK });
    [
      'You created this document yourself from the catalogue on hanekom.co.zm. The prices are catalogue',
      'prices and the total above is indicative only. Price, VAT status, stock, certification, sizes,',
      'colours and delivery are all confirmed on the written quotation Hanekom sends you. Send this',
      'document to ' + ((CFG.email && CFG.email.primary) || 'sales@hanekom.co.zm') + ' and we will reply within one working day.'
    ].forEach(function (t, i) {
      doc.text(M + 10, y - 25 - i * 9.6, t, { size: 7.6, color: INK });
    });

    y -= noteH + 10;
    if (y - 30 < M + 40) { footer(doc, page, ref); doc.newPage(); page++; y = letterhead(doc, ref); }
    doc.rect(M, y - 30, COLW, 30, [1, 0.94, 0.94]);
    doc.rect(M, y - 30, 2.5, 30, [0.80, 0.35, 0.30]);
    doc.text(M + 10, y - 12, 'Before you pay anyone', { size: 8.2, bold: true, color: [0.55, 0.15, 0.12] });
    doc.text(M + 10, y - 23,
      'No bank details appear on this document by design. Telephone ' +
      ((CFG.wa && CFG.wa.sales && CFG.wa.sales.display) || '+260 975 956 570') +
      ' to confirm ours before making any payment.',
      { size: 7.6, color: [0.35, 0.12, 0.10] });

    footer(doc, page, ref);
    return { bytes: doc.build({ title: 'Quotation request ' + ref }), ref: ref };
  }

  /* ---------- public entry point ---------- */

  window.hanekomQuotePDF = function (lines, buyer) {
    if (!window.HanekomPDF) return Promise.reject(new Error('PDF writer not loaded'));
    if (!lines || !lines.length) return Promise.reject(new Error('empty'));
    return logo().then(function (img) { return build(lines, buyer, img); });
  };
})();
