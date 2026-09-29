/* Hanekom Innovations — site behaviour
   - mobile nav
   - quote basket (localStorage, degrades gracefully)
   - catalogue rendering, filtering and search
   No build step, no dependencies. */

(function () {
  'use strict';

  // Everything contactable comes from site.config.json via config.js, so a
  // number is changed in one place. The fallbacks only matter if config.js
  // failed to load, in which case the links still work.
  var CFG = window.HANEKOM_CONFIG || {};
  var WA = (CFG.wa && CFG.wa.main && CFG.wa.main.number) || '260954263566';
  // guarded: this file is also required under Node at build time, where
  // `location` does not exist
  var SITE = CFG.site || (typeof location !== 'undefined'
    ? location.origin + location.pathname.replace(/[^/]*$/, '')
    : '');
  var KEY = 'hanekom_quote_v1';

  /* ---------------- storage (safe) ----------------
     A basket line is { q: quantity, s: size, c: colour }. Everything that
     reaches this object can come from a URL a stranger sent the visitor, so
     every field is bounded and normalised on the way IN — one place, not at
     each of the dozen places that later read it. Nothing here is ever trusted
     because it came out of localStorage; localStorage is attacker-writable the
     moment any script runs on the origin. */
  var MAX_LINES = 200;          // more than any real PPE order line count
  var MAX_QTY   = 100000;
  var MAX_TEXT  = 40;           // longest legitimate size or colour label

  // A size or colour is only ever accepted if the catalogue actually offers
  // it for that product. Free text is not stored — the quote form has a
  // requirement-details box for anything unusual, and that field is sent as
  // text, never rendered back into the page as markup.
  function optValues(p, key) {
    var out = [];
    (p && p.opts || []).forEach(function (o) {
      if (o.key === key) out = out.concat(o.values);
    });
    return out;
  }
  // String() itself can throw — { toString: 1 } and objects with a hostile
  // valueOf both raise "Cannot convert object to primitive value". A stored
  // basket is attacker-writable, so even the coercion has to be safe: one
  // throw in here would take down every page that paints the quote count.
  function str(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return '' + v;
    try { return String(v); } catch (e) { return ''; }
  }

  function cleanLine(p, v) {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) v = { q: v };  // v1: a bare string
    var n = parseInt(str(v.q).replace(/[^0-9]/g, ''), 10);
    var s = str(v.s).slice(0, MAX_TEXT);
    var c = str(v.c).slice(0, MAX_TEXT);
    return {
      q: isFinite(n) && n > 0 ? Math.min(n, MAX_QTY) : 1,
      s: optValues(p, 'size').indexOf(s) > -1 ? s : '',
      c: optValues(p, 'colour').indexOf(c) > -1 ? c : ''
    };
  }

  var mem = null;                              // fallback when storage is blocked
  function read() {
    if (mem) return mem;
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { return (mem = {}); }
    var parsed;
    try { parsed = raw ? JSON.parse(raw) : {}; } catch (e) { parsed = {}; }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parsed = {};
    var out = {};
    Object.keys(parsed).slice(0, MAX_LINES).forEach(function (code) {
      var p = byCode(code);
      if (!p) return;                          // unknown code: drop, never invent
      out[code] = cleanLine(p, parsed[code]);
    });
    return out;
  }
  function write(obj) {
    mem = obj;
    try { window.localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* private mode, or quota */ }
    paintCount();
    document.dispatchEvent(new CustomEvent('quote:change'));
  }

  var api = {
    all: read,
    count: function () { return Object.keys(read()).length; },
    line: function (code) { return read()[code] || null; },
    add: function (code, v) {
      var p = byCode(code); if (!p) return;
      var b = read();
      if (Object.keys(b).length >= MAX_LINES && !(code in b)) return;
      b[code] = cleanLine(p, v != null ? v : (b[code] || {}));
      write(b);
    },
    remove: function (code) { var b = read(); delete b[code]; write(b); },
    set: function (code, field, value) {
      var p = byCode(code); if (!p) return;
      var b = read(); if (!(code in b)) return;
      var next = { q: b[code].q, s: b[code].s, c: b[code].c };
      next[field] = value;
      b[code] = cleanLine(p, next);
      write(b);
    },
    setQty: function (code, q) { api.set(code, 'q', q); },
    clear: function () { write({}); }
  };
  window.HanekomQuote = api;

  /* ---------------- helpers ---------------- */
  function money(n) {
    return n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  window.hanekomMoney = money;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Every page that builds markup from data uses this one function. There is
  // no second, weaker escaper anywhere in the site.
  window.hanekomEsc = esc;

  function byCode(code) {
    var list = window.HANEKOM_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
    return null;
  }
  window.hanekomByCode = byCode;

  function waLink(text) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }
  window.hanekomWa = waLink;

  function absolute(path) {
    return String(SITE).replace(/\/$/, '') + '/' + String(path).replace(/^\//, '');
  }
  window.hanekomAbs = absolute;

  // A wa.me link carries text only — it cannot attach an image. So the message
  // carries the product page URL (WhatsApp renders a preview card from that
  // page's og:image, which is the product photo) and the direct image URL as a
  // fallback. The recipient can always identify the exact item.
  function waProduct(p, qty) {
    var v = (qty && typeof qty === 'object') ? qty : { q: qty || '', s: '', c: '' };
    var lines = [
      'Hello Hanekom, please quote me on:',
      '',
      p.code + ' — ' + p.name + (p.variant ? ' (' + p.variant + ')' : ''),
      'Quantity needed: ' + (v.q || ''),
      'Size requested: ' + (v.s || ''),
      'Colour requested: ' + (v.c || ''),
      '',
      'Product page: ' + absolute(p.url),
      'Photo: ' + absolute('assets/cat/' + p.img + '.jpg')
    ];
    return waLink(lines.join('\n'));
  }
  window.hanekomWaProduct = waProduct;

  /* ---------------- header ---------------- */
  function paintCount() {
    var n = api.count();
    document.querySelectorAll('[data-quote-count]').forEach(function (el) {
      el.textContent = n;
      var pill = el.closest('.quote-pill');
      if (pill) pill.style.display = n ? '' : '';
    });
  }

  function initNav() {
    var t = document.querySelector('.nav-toggle');
    var l = document.querySelector('.nav-links');
    if (!t || !l) return;
    t.addEventListener('click', function () {
      var open = l.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // mark current page
    var here = location.pathname.split('/').pop() || 'index.html';
    l.querySelectorAll('a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------------- product card ---------------- */
  function card(p) {
    var inBasket = p.code in read();
    var wa = waProduct(p, '');
    return '' +
      '<article class="product" data-cat="' + p.cat + '" data-code="' + esc(p.code) + '" ' +
      'data-search="' + esc((p.code + ' ' + p.name + ' ' + (p.variant || '') + ' ' + p.brand + ' ' + p.desc + ' ' + p.tag).toLowerCase()) + '">' +
        '<div class="ph"><span class="code">' + esc(p.code) + '</span>' +
          '<a class="ph-link" href="' + p.url + '" aria-label="' + esc(p.name) + ' details"></a>' +
          (p.imgNote ? '<span class="ph-note" title="' + esc(p.imgNote) + '">packaging shown</span>' : '') +
          '<picture>' +
            '<source srcset="assets/cat/' + p.img + '.webp" type="image/webp">' +
            '<img src="assets/cat/' + p.img + '.jpg" alt="' + esc(p.name) + (p.variant ? ' — ' + esc(p.variant) : '') + '" loading="lazy" decoding="async" fetchpriority="low" width="400" height="400">' +
          '</picture></div>' +
        '<div class="pb">' +
          '<span class="tag">' + esc(p.tag) + '</span>' +
          '<h3><a href="' + p.url + '">' + esc(p.name) + '</a></h3>' +
          (p.variant ? '<p class="var">' + esc(p.variant) +
            (/colour|color/i.test(p.variant) ? ' <span class="var-note" title="One representative colour shown; confirm colours on quote">representative photo</span>' : '') +
            '</p>' : '') +
          '<p class="desc">' + esc(p.desc) + '</p>' +
          '<p class="spec">' + esc(p.spec) + '</p>' +
          '<div class="foot">' +
            '<span class="price"><span class="cur">ZMW</span>' + money(p.price) + '</span>' +
            '<span style="display:flex;gap:.4rem">' +
              '<a class="btn btn-sm btn-ghost card-wa" href="' + wa + '" target="_blank" rel="noopener" aria-label="WhatsApp about ' + esc(p.code) + '">WhatsApp</a>' +
              '<button type="button" class="add-btn' + (inBasket ? ' added' : '') + '" data-add="' + esc(p.code) + '">' +
                (inBasket ? 'Edit selection' : 'Add to quotation') + '</button>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }
  window.hanekomCard = card;

  /* Plain-language catalogue search.
     Buyers often know the hazard (dust, noise, rain, height) or a familiar
     name (overalls, helmet, gum boots), not the catalogue term. These groups
     add those intentions to each product without changing its public copy. */
  var SEARCH_INTENTS = {
    workwear: 'work suit worksuit overalls overall boiler suit uniform clothes clothing protective clothing coverall coveralls body protection work clothes',
    hivis: 'high visibility hi vis hivis reflective reflector visibility vest traffic road roadside night low light be seen jacket cold winter warm',
    hand: 'hand hands glove gloves grip cut resistant sharp metal handling welding heat hand protection',
    respiratory: 'breathing breath lungs lung mask masks face mask dust dusty smoke fumes particles particulate respirator respiratory protection ffp2 ffp3',
    eye: 'eye eyes glasses goggles spectacles face shield visor sparks grinding welding splash eye protection face protection',
    head: 'head helmet helmets hardhat hard hat safety helmet falling objects impact head protection',
    hearing: 'ear ears hearing noise noisy loud sound earmuff earmuffs ear muff ear muffs earplug earplugs ear plug ear plugs',
    foot: 'foot feet shoe shoes boot boots safety boot steel toe toe cap footwear gumboot gumboots gum boot gum boots rubber boot waterproof rain wet mud',
    gumboots: 'foot feet boot boots gumboot gumboots gum boot gum boots rubber boot rubber boots waterproof water resistant rain wet muddy mud wash down farm farming',
    body: 'body leg legs apron aprons spat spats gaiter gaiters welding sparks heat coverall coveralls disposable splash chemical',
    harness: 'height heights high roof roofing scaffold scaffolding climbing tower fall falling fall arrest body harness safety harness working at height',
    lanyards: 'height heights lanyard lanyards rope connector karabiner carabiner tool tether dropped objects energy absorber scaffold fall protection',
    srl: 'height heights lifeline life line retractable block inertia reel fall arrester fall arrest roof scaffold climbing working at height'
  };
  var SEARCH_PHRASES = {
    'acid': 'chemical chemicals splash corrosion resistant workwear worksuit',
    'chemical': 'acid splash resistant workwear worksuit gloves goggles',
    'fire': 'flame heat hot welding fire resistant retardant workwear worksuit',
    'flame': 'fire heat hot welding resistant retardant workwear worksuit',
    'welding': 'welder sparks heat fire gloves helmet shield mask workwear',
    'construction': 'hard hat helmet boots gloves vest harness height',
    'mining': 'boots gumboots hard hat helmet respirator mask hearing vest workwear harness',
    'rain': 'wet waterproof gumboot gumboots boots jacket',
    'dust': 'mask respirator respiratory breathing particles ffp2 ffp3',
    'noise': 'hearing ear earmuff earmuffs earplug earplugs',
    'loud': 'noise hearing ear earmuff earmuffs earplug earplugs',
    'height': 'harness lanyard lifeline fall arrest retractable block scaffold roof climbing',
    'fall': 'harness lanyard lifeline arrester height scaffold roof climbing',
    'sharp': 'cut resistant gloves hand protection',
    'visibility': 'reflective high vis hivis vest traffic road night',
    'cold': 'winter warm jacket outerwear'
  };

  function searchNormalise(value) {
    return str(value).toLowerCase().replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ').replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
  }
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    var row = [], prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      row = [i];
      for (j = 1; j <= b.length; j++) {
        row[j] = Math.min(row[j - 1] + 1, prev[j] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      prev = row;
    }
    return prev[b.length];
  }
  function searchHaystack(p) {
    var base = [p.code, p.name, p.variant, p.brand, p.desc, p.tag, SEARCH_INTENTS[p.cat] || ''].join(' ');
    var n = searchNormalise(base);
    Object.keys(SEARCH_PHRASES).forEach(function (term) {
      if ((' ' + n + ' ').indexOf(' ' + term + ' ') > -1) n += ' ' + SEARCH_PHRASES[term];
    });
    return n;
  }
  function searchScore(p, query) {
    var q = searchNormalise(query);
    if (!q) return 1;
    var hay = searchHaystack(p);
    if ((' ' + hay + ' ').indexOf(' ' + q + ' ') > -1) return 100;
    var stop = ['a','an','and','for','from','in','my','of','on','the','to','with','area','areas','work','working','need','protection'];
    var needles = q.split(' ').filter(function (x, i, all) {
      return x.length > 1 && stop.indexOf(x) < 0 && all.indexOf(x) === i;
    });
    var words = hay.split(' '), hits = 0;
    needles.forEach(function (needle) {
      if (words.indexOf(needle) > -1) { hits++; return; }
      if (needle.length < 4) return;
      var close = words.some(function (word) {
        return word.length >= 4 && Math.abs(word.length - needle.length) <= 1 && editDistance(word, needle) <= 1;
      });
      if (close) hits += .72;
    });
    return needles.length ? hits / needles.length : 0;
  }
  window.hanekomSearchScore = searchScore;
  window.hanekomSearchHaystack = searchHaystack;

  /* ---------------- site-wide PPE search ---------------- */
  function initGlobalSearch() {
    if (document.querySelector('.site-search-strip')) return;
    var header = document.querySelector('.site-header');
    if (!header) return;
    var links = header.querySelector('.nav-links');
    var strip = document.createElement('div');
    strip.className = 'site-search-strip';
    strip.id = 'site-search-panel';
    strip.hidden = true;
    strip.innerHTML =
      '<form action="products.html" method="get" role="search" aria-label="Search PPE from any page">' +
        '<label for="global-ppe-search">Search PPE, hazards or tasks</label>' +
        '<input type="search" id="global-ppe-search" name="q" placeholder="Try: dust mask, welding, loud area, boots for rain&hellip;" autocomplete="off" spellcheck="true" required>' +
        '<button type="submit" aria-label="Search PPE catalogue">Search</button>' +
      '</form>';
    header.insertAdjacentElement('afterend', strip);
    if (!links) return;
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-search-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', strip.id);
    trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"></circle><path d="m16 16 5 5"></path></svg><span>Search</span>';
    var quote = links.querySelector('.quote-pill');
    links.insertBefore(trigger, quote || null);
    var input = strip.querySelector('input');
    function closeSearch() {
      strip.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('is-open');
    }
    trigger.addEventListener('click', function () {
      var open = strip.hidden;
      strip.hidden = !open;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      trigger.classList.toggle('is-open', open);
      if (open) setTimeout(function () { input.focus(); }, 0);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !strip.hidden) { closeSearch(); trigger.focus(); }
    });
  }

  /* ---------------- catalogue page ---------------- */
  function initCatalogue() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;

    var products = window.HANEKOM_PRODUCTS || [];
    var cats = window.HANEKOM_CATEGORIES || [];
    var state = { cat: 'all', q: '' };

    // filter buttons
    var fbox = document.getElementById('filters');
    if (fbox) {
      var html = '<button type="button" class="filter" data-cat="all" aria-pressed="true">All products <span style="opacity:.6">(' + products.length + ')</span></button>';
      cats.forEach(function (c) {
        var n = products.filter(function (p) { return p.cat === c.id; }).length;
        if (!n) return;
        html += '<button type="button" class="filter" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.name) + ' <span style="opacity:.6">(' + n + ')</span></button>';
      });
      fbox.innerHTML = html;
      fbox.addEventListener('click', function (e) {
        var b = e.target.closest('.filter'); if (!b) return;
        state.cat = b.dataset.cat;
        fbox.querySelectorAll('.filter').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        render();
      });
    }

    var search = document.getElementById('search');
    if (search) {
      var t = null;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.q = search.value.trim();
          render();
        }, 140);
      });
    }

    // A homepage search arrives as products.html?q=plain+language+request.
    // Populate the catalogue field and apply the same intent-aware matching.
    var query = '';
    try { query = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
    if (query && search) {
      state.q = query.trim();
      search.value = state.q;
    }

    function matches(p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (!state.q) return true;
      return searchScore(p, state.q) >= .6;
    }

    function render() {
      var list = products.filter(matches);
      var counter = document.getElementById('result-count');
      if (counter) counter.textContent = list.length + (list.length === 1 ? ' product' : ' products');
      grid.innerHTML = list.length
        ? list.map(card).join('')
        : '';
      var empty = document.getElementById('empty');
      if (empty) empty.hidden = list.length > 0;
      var emptyQuery = document.getElementById('empty-query');
      if (emptyQuery) emptyQuery.textContent = state.q ? '\u201c' + state.q + '\u201d' : 'that item';
      var emptyWa = document.getElementById('empty-wa');
      if (emptyWa) {
        var msg = 'Hello Hanekom, I searched your PPE catalogue for "' + (state.q || 'an item') + '" but could not find a suitable match. Please help me choose or source the right product.';
        emptyWa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      }
      grid.hidden = list.length === 0;
    }

    // The build pre-renders the full grid into the HTML so crawlers and
    // no-JS visitors see every product. Leave it alone until the visitor
    // actually filters or searches.
    if (grid.dataset.prerendered === 'true' && !location.hash && !state.q) {
      grid.dataset.prerendered = 'used';
      return;
    }

    // deep link: products.html#cat=foot
    // products.html#cat=foot — the value goes into a CSS selector, so it is
    // matched against the known category ids rather than interpolated. An
    // unmatched or hostile value renders the full grid instead of throwing a
    // selector SyntaxError that would leave the page blank.
    var hash = location.hash.replace('#', '');
    var btn = null;
    if (hash.indexOf('cat=') === 0) {
      var want = decode(hash.slice(4));
      var known = cats.filter(function (c) { return c.id === want; })[0];
      if (known && fbox) btn = fbox.querySelector('[data-cat="' + known.id + '"]');
    }
    if (btn) btn.click(); else render();
  }

  /* ---------------- add-to-quotation picker ----------------
     A product is not added until the visitor confirms quantity and every
     applicable catalogue option. Re-opening an existing line edits it; removal
     remains an explicit action on the quotation page, so a second click can
     never accidentally discard a configured line. */
  function initQuotePicker() {
    if (document.getElementById('quote-picker')) return;

    var dialog = document.createElement('dialog');
    dialog.id = 'quote-picker';
    dialog.className = 'quote-picker';
    dialog.setAttribute('aria-labelledby', 'quote-picker-title');
    dialog.innerHTML =
      '<form method="dialog" id="quote-picker-form">' +
        '<button type="button" class="qp-close" data-qp-close aria-label="Close">&times;</button>' +
        '<div class="qp-head">' +
          '<span class="qp-img"><img id="quote-picker-img" src="" alt="" width="92" height="92"></span>' +
          '<span><span class="qp-code" id="quote-picker-code"></span>' +
          '<h2 id="quote-picker-title">Configure product</h2>' +
          '<p id="quote-picker-variant"></p></span>' +
        '</div>' +
        '<div class="qp-fields" id="quote-picker-fields"></div>' +
        '<p class="qp-note">Sizes and colours are requested and will be confirmed on the written quotation.</p>' +
        '<div class="qp-actions">' +
          '<button type="button" class="btn btn-ghost" data-qp-close>Cancel</button>' +
          '<button type="submit" class="btn btn-primary" id="quote-picker-save">Add to quotation</button>' +
        '</div>' +
        '<a class="qp-view" href="quote.html">View quotation list <span aria-hidden="true">&rarr;</span></a>' +
      '</form>';
    document.body.appendChild(dialog);

    var form = document.getElementById('quote-picker-form');
    var fields = document.getElementById('quote-picker-fields');
    var current = null;

    function optionField(p, o, selected) {
      var id = 'qp-' + o.key;
      return '<div class="field"><label for="' + id + '">' + esc(o.label) + ' <span class="req">*</span></label>' +
        '<select id="' + id + '" data-qp-option="' + esc(o.key) + '" required>' +
          '<option value="">Choose ' + esc(o.label.toLowerCase()) + '&hellip;</option>' +
          o.values.map(function (v) {
            return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>';
          }).join('') +
        '</select></div>';
    }

    function openPicker(code) {
      var p = byCode(code); if (!p) return;
      current = p;
      var line = api.line(code) || { q: 1, s: '', c: '' };
      document.getElementById('quote-picker-code').textContent = p.code;
      document.getElementById('quote-picker-title').textContent = p.name;
      document.getElementById('quote-picker-variant').textContent = p.variant || p.tag || '';
      var img = document.getElementById('quote-picker-img');
      img.src = 'assets/cat/' + p.img + '.jpg';
      img.alt = p.name;
      fields.innerHTML =
        '<div class="field"><label for="qp-quantity">Quantity <span class="req">*</span></label>' +
        '<input id="qp-quantity" type="number" inputmode="numeric" min="1" max="100000" step="1" required value="' + line.q + '"></div>' +
        (p.opts || []).map(function (o) {
          return optionField(p, o, o.key === 'size' ? line.s : line.c);
        }).join('');
      document.getElementById('quote-picker-save').textContent = api.line(code) ? 'Update selection' : 'Add to quotation';
      dialog.showModal();
      setTimeout(function () { document.getElementById('qp-quantity').focus(); }, 0);
    }

    function paintButtons(code) {
      document.querySelectorAll('[data-add]').forEach(function (b) {
        if (code && b.dataset.add !== code) return;
        var added = !!api.line(b.dataset.add);
        b.classList.toggle('added', added);
        b.textContent = added ? 'Edit selection' : 'Add to quotation';
      });
    }

    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); openPicker(add.dataset.add); return; }
      if (e.target.closest('[data-qp-close]')) dialog.close();
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!current || !form.checkValidity()) { form.reportValidity(); return; }
      var value = { q: document.getElementById('qp-quantity').value, s: '', c: '' };
      fields.querySelectorAll('[data-qp-option]').forEach(function (select) {
        if (select.dataset.qpOption === 'size') value.s = select.value;
        if (select.dataset.qpOption === 'colour') value.c = select.value;
      });
      api.add(current.code, value);
      paintButtons(current.code);
      dialog.close();
    });
    document.addEventListener('quote:change', function () { paintButtons(); });
    paintButtons();
  }





  /* ---------------- floating contact button ----------------
     The markup is a <details>, so opening, closing and keyboard operation all
     work with this script absent. Everything here is enhancement on top:
     closing on Escape, closing when you click away, and letting the options
     animate out before the element actually collapses (a <details> snaps shut
     instantly, which looks broken next to the way they flew in). */
  function initFloatingContact() {
    var box = document.getElementById('wa-float');
    if (!box) return;
    var fab = box.querySelector('summary');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var closing = null;

    function close(refocus) {
      if (!box.open || closing) return;
      if (reduced) { box.open = false; if (refocus && fab) fab.focus(); return; }
      box.classList.add('wa-closing');
      closing = setTimeout(function () {
        box.classList.remove('wa-closing');
        box.open = false;
        closing = null;
        if (refocus && fab) fab.focus();
      }, 170);
    }

    // Escape closes and puts focus back where the visitor left it.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.open) { e.stopPropagation(); close(true); }
    });

    // Clicking anywhere else closes it. Pointerdown rather than click so it
    // does not fight the link the visitor is actually trying to press.
    document.addEventListener('pointerdown', function (e) {
      if (box.open && !box.contains(e.target)) close(false);
    });

    // Following one of the options should not leave the panel hanging open
    // behind the WhatsApp or mail handover.
    box.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.wa-opt');
      if (!a) return;
      track(a.classList.contains('wa-mail') ? 'Email opened' : 'WhatsApp opened',
            { from: 'floating button' });
      setTimeout(function () { box.open = false; }, 60);
    });

    // Replay the heartbeat when the visitor ADDS something to their quote --
    // the one moment where drawing the eye to "talk to us" is useful rather
    // than decorative. Only on an increase, so typing a quantity (which also
    // fires quote:change) does not set it beating on every keystroke.
    var lastCount = api.count();
    document.addEventListener('quote:change', function () {
      var n = api.count();
      var grew = n > lastCount;
      lastCount = n;
      if (!grew || box.open || reduced) return;
      box.classList.remove('wa-again');
      void box.offsetWidth;                 // force the animation to restart
      box.classList.add('wa-again');
      setTimeout(function () { box.classList.remove('wa-again'); }, 8200);
    });

    // A stray click on the summary while closing would re-open it mid-fade.
    box.addEventListener('toggle', function () {
      if (!box.open && closing) { clearTimeout(closing); closing = null; box.classList.remove('wa-closing'); }
    });
  }

  /* ---------------- conversion events ----------------
     Four moments worth counting. Each is a no-op until an analytics provider is
     configured in site.config.json — nothing is loaded, nothing is sent, and no
     consent banner is needed on a site that has not opted in. */
  function track(name, props) {
    if (!(CFG.analytics && CFG.analytics.on)) return;
    try {
      if (window.plausible) window.plausible(name, props ? { props: props } : undefined);
    } catch (e) { /* analytics must never break the page */ }
  }
  window.hanekomTrack = track;

  /* ---------------- shareable quote state ----------------
     localStorage is the primary store: it survives refresh and multi-page
     navigation, and needs no backend. But it is per-browser — it does not
     follow a buyer from their phone to their desk, and private mode can drop
     it. So the list is also expressible as a URL, which is portable, works
     with no storage at all, and lets a buyer send a draft to a colleague.
     Product ids are used rather than codes because codes contain spaces and
     brackets ("PN 10(S)+PN 361"). */
  function byId(id) {
    var list = window.HANEKOM_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Fields are joined with "," and lines with "|", both of which
  // encodeURIComponent escapes — so no value can ever forge a separator.
  function encodeQuote() {
    var b = read(), out = [];
    Object.keys(b).forEach(function (code) {
      var p = byCode(code); if (!p) return;
      var v = b[code];
      out.push([p.id, v.q, v.s, v.c].map(encodeURIComponent).join(','));
    });
    return out.join('|');
  }
  window.hanekomQuoteLink = function () {
    var q = encodeQuote();
    return absolute('quote.html') + (q ? '#q=' + q : '');
  };

  // A shared link is untrusted input: it may have been sent to the visitor by
  // anyone. Bound it before it is parsed, cap the number of lines, drop ids
  // that are not in the catalogue, and put every field through cleanLine —
  // which only accepts sizes and colours this product actually offers.
  var MAX_HASH = 4000;

  function decode(s) {
    try { return decodeURIComponent(s || ''); } catch (e) { return ''; }
  }

  function importQuoteFromUrl() {
    var m = /[#&]q=([^&]*)/.exec(location.hash);
    if (!m || m[1].length > MAX_HASH) return false;
    var added = 0, b = read();
    m[1].split('|').slice(0, MAX_LINES).forEach(function (pair) {
      if (!pair) return;
      var bits = pair.indexOf(',') > -1 ? pair.split(',') : pair.split(':');
      var p = byId(decode(bits[0]));
      if (!p) return;                       // unknown id: skip, never invent
      b[p.code] = cleanLine(p, { q: decode(bits[1]), s: decode(bits[2]), c: decode(bits[3]) });
      added++;
    });
    if (!added) return false;
    write(b);
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    return true;
  }
  window.hanekomImportQuote = importQuoteFromUrl;

  /* ---------------- forms ----------------
     Two failure modes matter here, and neither may look like success:
       1. the site was built without a form access key  -> offline mode
       2. the form service rejects or is unreachable    -> visible error + retry
     Nothing is ever swallowed. If we cannot send it, we say so and hand the
     visitor a route that does work. */

  // Turn whatever the visitor filled in into a readable message. Used for the
  // mailto and WhatsApp routes, so nothing they typed is lost when the site has
  // no form service configured.

  // The gear from the logo, as a working indicator. Marked aria-hidden because
  // the surrounding status text is what a screen reader should announce.
  function gearMarkup(cls) {
    return '<span class="hn-gear ' + (cls || '') + '" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24">' +
        '<use class="g-a" href="#i-gear"></use>' +
        '<use class="g-b" href="#i-gear"></use>' +
      '</svg></span>';
  }
  window.hanekomGear = gearMarkup;

  function formSubject(f) {
    var co = f.querySelector('[name="Company"]');
    return 'Quote request from ' + ((co && co.value.trim()) || 'the Hanekom website');
  }

  function formBody(f) {
    var out = [], skip = { botcheck: 1, access_key: 1, subject: 1, from_name: 1, redirect: 1, Page: 1 };
    Array.prototype.forEach.call(f.elements, function (el) {
      if (!el.name || skip[el.name] || el.type === 'submit' || el.type === 'button') return;
      var v = (el.value || '').trim();
      if (!v) return;
      out.push(el.name + ': ' + v);
    });
    return out.join('\n');
  }

  function initForms() {
    var forms = document.querySelectorAll('form[data-hanekom-form]');
    if (!forms.length) return;
    var ready = !!(CFG.form && CFG.form.ready);
    var endpoint = (CFG.form && CFG.form.endpoint) || '';
    var mail = (CFG.email && CFG.email.primary) || 'sales@hanekom.co.zm';

    /* ---- abuse controls ----
       Be clear about what these are. A static site has no server of its own,
       so there is no real rate limit here and this code cannot stop a
       determined attacker — anyone can POST to the form endpoint directly and
       never load this page at all. What it does stop is the ordinary case:
       the commodity spam bot that fills every field it finds and submits at
       once, and the visitor who double-taps Send on a slow connection.
       The durable protection is on the receiving side, and it is written up
       in SECURITY.md: Web3Forms' own spam filtering and monthly cap, plus
       ordinary mailbox filtering. Nothing here is presented as more than it
       is, and nothing here is allowed to block a real person: every check
       below either lets the submission through or explains itself on screen. */
    var MIN_FILL_MS = 3000;      // no human completes this form in 3 seconds
    var COOLDOWN_MS = 20000;     // one submission per 20s per browser

    function abuseCheck(f, started, say) {
      // 1. honeypot — a field positioned off-screen and hidden from screen
      //    readers. A person cannot see it; a bot fills it in.
      //
      //    Read .checked ONLY. An unchecked checkbox still reports
      //    value === "on" in every browser, so testing .value here treated
      //    every genuine visitor as a bot: the form showed "Thank you" and
      //    sent nothing. That is the worst possible failure — a form that
      //    lies about having worked — and it is why this is tested.
      var hp = f.querySelector('[name="botcheck"]');
      if (hp && (hp.type === 'checkbox' ? hp.checked : !!hp.value)) return 'silent';

      // 2. time trap
      if (Date.now() - started < MIN_FILL_MS) {
        say('warn', 'That was submitted very quickly. Please check the form and press Send again.');
        return 'blocked';
      }

      // 3. cooldown, so a stuck retry loop cannot hammer the endpoint
      var last = 0;
      try { last = parseInt(window.sessionStorage.getItem('hanekom_sent') || '0', 10) || 0; } catch (e) {}
      if (Date.now() - last < COOLDOWN_MS) {
        say('warn', 'We already have that request &mdash; give us a moment. ' +
                    'If something looks wrong, WhatsApp us instead and we will sort it out.');
        return 'blocked';
      }
      try { window.sessionStorage.setItem('hanekom_sent', String(Date.now())); } catch (e) {}
      return 'ok';
    }

    forms.forEach(function (f) {
      var box = f.querySelector('[data-form-status]');
      var started = Date.now();

      function say(kind, html) {
        if (!box) return;
        box.className = 'form-status ' + kind;
        box.innerHTML = html;
        box.hidden = false;
      }

      // 1. built without a form service — the form still has to WORK.
      //    Rather than disable it, we compose the visitor's own message for
      //    them: everything they typed, formatted, handed to their mail client
      //    or to WhatsApp. No third-party service, no signup, nothing lost.
      if (!ready) {
        var sub = f.querySelector('button[type=submit]');
        if (sub) sub.textContent = 'Send by email';
        say('', 'Your details go straight to <strong>' + mail + '</strong> from your own ' +
                'email app, or to WhatsApp — whichever you prefer.');

        f.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!f.checkValidity()) {
            var bad = f.querySelector(':invalid');
            if (bad) bad.focus();
            say('warn', 'Please complete the required fields marked with an asterisk.');
            return;
          }
          var url = 'mailto:' + mail +
                    '?subject=' + encodeURIComponent(formSubject(f)) +
                    '&body=' + encodeURIComponent(formBody(f));
          // mailto has a practical length limit in some clients; if the body is
          // very long, say so rather than letting it silently truncate
          if (url.length > 1900) {
            say('warn', '<strong>That is a long message.</strong> Your email app may cut it ' +
                        'short. WhatsApp handles it better — or shorten the requirement ' +
                        'details field.<span class="fs-actions">' +
                        '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' +
                        waLink(formBody(f)) + '">Send on WhatsApp instead</a></span>');
            return;
          }
          window.location.href = url;
          say('busy', gearMarkup('duo') + ' Opening your email app with everything filled in&hellip; ' +
                      'If nothing happened, use the WhatsApp button below.' +
                      '<span class="fs-actions">' +
                      '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' +
                      waLink(formBody(f)) + '">Send on WhatsApp instead</a>' +
                      '<a class="btn btn-ghost btn-sm" href="mailto:' + mail + '">Just open a blank email</a>' +
                      '</span>');
        });

        // a WhatsApp button that carries the form contents, kept up to date
        var waBtn = f.querySelector('[data-wa-form]');
        if (waBtn) {
          var refresh = function () { waBtn.href = waLink(formBody(f)); };
          f.addEventListener('input', refresh);
          f.addEventListener('change', refresh);
          refresh();
        }
        return;
      }

      // 2. connected — submit over fetch so failures are visible
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!f.checkValidity()) {
          var bad = f.querySelector(':invalid');
          if (bad) bad.focus();
          say('warn', 'Please complete the required fields marked with an asterisk.');
          return;
        }
        var verdict = abuseCheck(f, started, say);
        if (verdict !== 'ok') {
          // A honeypot hit gets no explanation — telling a bot why it failed
          // just tells the next one how to pass.
          if (verdict === 'silent') say('', 'Thank you — we have your request.');
          return;
        }
        var btn = f.querySelector('button[type=submit]');
        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        say('busy', gearMarkup('duo') + ' Sending your request&hellip;');

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(f)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok || res.d.success === false) {
            throw new Error((res.d && res.d.message) || ('HTTP ' + res.status));
          }
          track('Quote submitted');
          window.location.href = 'thank-you.html';
        })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          say('error',
            '<strong>That did not send.</strong> ' +
            (err && err.message ? '<span class="fs-detail">' + esc(String(err.message)) + '</span> ' : '') +
            'Your details are still in the form — press the button to try again, ' +
            'or send the same information by WhatsApp or email.' +
            '<span class="fs-actions">' +
            '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' +
              waLink('Hello Hanekom, I would like a quotation.') + '">WhatsApp us</a>' +
            '<a class="btn btn-ghost btn-sm" href="mailto:' + mail + '">Email ' + mail + '</a>' +
            '</span>');
        });
      });
    });
  }

  /* ---------------- bottom navigation ---------------- */
  var NAV_TABS = [
    { href:'index.html',     label:'Home',     icon:'#i-home' },
    { href:'products.html',  label:'Products', icon:'#i-products' },
    { href:'quote.html',     label:'Quote',    icon:'#i-quote', badge:true },
    { href:'resources.html', label:'Guides',   icon:'#i-guides' },
    { href:'contact.html',   label:'Contact',  icon:'#i-contact' }
  ];
  // pages that belong under a tab even though they are not the tab itself
  var NAV_ALIAS = {
    'guide-safety-footwear.html':'resources.html',
    'guide-glove-selection.html':'resources.html',
    'guide-working-at-height.html':'resources.html',
    'guide-ppe-law-zambia.html':'resources.html',
    'industries.html':'index.html',
    'gallery.html':'products.html',
    'about.html':'contact.html',
    'thank-you.html':'quote.html'
  };

  function initBottomNav() {
    var nav = document.getElementById('hn-nav');
    if (!nav) return;

    var here = window.__previewPage || window.__navTab ||
               location.pathname.split('/').pop() || 'index.html';
    here = NAV_ALIAS[here] || here;
    var active = 0;
    NAV_TABS.forEach(function (t, i) { if (t.href === here) active = i; });

    function badgeHTML(onPuck) {
      var n = api.count();
      if (!n) return '';
      return '<span class="hn-badge"' + (onPuck ? '' : '') + '>' + n + '</span>';
    }

    function paint() {
      nav.querySelector('.hn-items').innerHTML = NAV_TABS.map(function (t, i) {
        var on = i === active;
        return '<a class="hn-item" href="' + t.href + '"' + (on ? ' aria-current="page"' : '') +
               ' data-i="' + i + '">' +
                 '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="' + t.icon + '"></use></svg>' +
                 (t.badge && !on ? badgeHTML(false) : '') +
                 '<span class="lbl">' + t.label + '</span>' +
               '</a>';
      }).join('');

      var t = NAV_TABS[active];
      nav.style.setProperty('--notch-x', ((active + 0.5) / NAV_TABS.length * 100).toFixed(2) + '%');
      nav.querySelector('.hn-puck').innerHTML =
        '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="' + t.icon + '"></use></svg>' +
        (t.badge ? badgeHTML(true) : '');
    }

    // left/right arrows move between tabs, as a tablist should
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var cur = document.activeElement && document.activeElement.closest('.hn-item');
      if (!cur) return;
      e.preventDefault();
      var i = (+cur.dataset.i + (e.key === 'ArrowRight' ? 1 : -1) + NAV_TABS.length) % NAV_TABS.length;
      var next = nav.querySelector('[data-i="' + i + '"]');
      if (next) next.focus();
    });

    // The raised button hops to the selected tab before the new page opens.
    nav.addEventListener('click', function (e) {
      var item = e.target.closest('.hn-item');
      if (!item || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var nextIndex = +item.dataset.i;
      if (nextIndex === active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      e.preventDefault();
      var href = item.href;
      nav.querySelectorAll('.hn-item.is-next').forEach(function (el) { el.classList.remove('is-next'); });
      item.classList.add('is-next');
      nav.classList.remove('is-hopping', 'is-forward', 'is-backward');
      void nav.offsetWidth;
      nav.classList.add(nextIndex > active ? 'is-forward' : 'is-backward');
      nav.style.setProperty('--notch-x', ((nextIndex + 0.5) / NAV_TABS.length * 100).toFixed(2) + '%');
      nav.classList.add('is-hopping');

      setTimeout(function () { location.href = href; }, 760);
    });

    document.addEventListener('quote:change', paint);
    paint();
  }

  /* ---------------- arrival motion ---------------- */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = document.querySelectorAll(
      'section > .wrap > .grid > *, .product-grid > *, .steps > .step, .split > *, .gallery figure'
    );
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .04 });

    targets.forEach(function (el, i) {
      // anything already on screen at load stays visible — no blank first frame
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) { el.classList.add('reveal', 'in'); return; }
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 8, 5) * 45) + 'ms';
      io.observe(el);
    });
  }

  /* ---------------- boot ---------------- */
  // exposed so a single-page preview can re-run it after swapping <main>
  window.hanekomBoot = function () {
    initNav();
    initGlobalSearch();
    paintCount();
    initCatalogue();
    initQuotePicker();
    initBottomNav();
    initForms();
    initFloatingContact();
    initReveal();
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  };
  document.addEventListener('DOMContentLoaded', window.hanekomBoot);
})();
