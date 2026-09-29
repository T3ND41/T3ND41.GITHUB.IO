/* Hanekom Innovations — product catalogue data
   Originally from the Hanekom Innovations Complete Product Catalogue 2026.

   ODOO IS THE SYSTEM OF RECORD for products, prices and stock. This file is
   downstream of it. Do not hand-edit a price here and assume it is correct —
   the risk this project has to manage is the website publishing a figure Odoo
   no longer agrees with, which a customer can then hold you to.

   To update prices:
       export Products to CSV from Odoo
       python3 tools/odoo.py diff <that file>     (shows changes, writes nothing)
       python3 tools/odoo.py apply <that file>
       python3 build.py
   See ODOO-AND-WORDPRESS.md. odoo-map.json pairs these codes to Odoo's own
   internal references.

   Everything other than price — descriptions, categories, images, the size and
   colour option sets — is edited here by hand. Every page reads from this file. */

window.HANEKOM_CATEGORIES = [
  { id: 'workwear',    name: 'Protective Workwear',   blurb: 'Conti suits, worksuits and specialist flame and acid resistant garments.' },
  { id: 'hivis',       name: 'Hi-Vis & Outerwear',    blurb: 'Reflective vests and cold-weather layers for visibility and exposure.' },
  { id: 'hand',        name: 'Hand Protection',       blurb: 'Nitrile grip, cut-resistant and welding gloves.' },
  { id: 'respiratory', name: 'Respiratory Protection',blurb: 'Disposable dust masks, FFP2 and FFP3 respirators.' },
  { id: 'eye',         name: 'Eye & Face Protection', blurb: 'Safety spectacles, goggles and welding shields.' },
  { id: 'head',        name: 'Head Protection',       blurb: 'Hard hats with and without chin-strap retention.' },
  { id: 'hearing',     name: 'Hearing Protection',    blurb: 'Ear muffs rated for noisy industrial environments.' },
  { id: 'foot',        name: 'Safety Footwear',       blurb: 'Safety boots for routine and demanding site duty.' },
  { id: 'gumboots',    name: 'Gumboots',              blurb: 'Water-resistant footwear for wet and wash-down work.' },
  { id: 'body',        name: 'Task-Specific Body',    blurb: 'Leather aprons and spats, snake gaiters, disposable coveralls.' },
  { id: 'height',      name: 'Working at Height',     blurb: 'EN 361 harnesses, positioning and rope-access systems.' },
  { id: 'lanyards',    name: 'Lanyards & Tool Retention', blurb: 'Energy-absorbing lanyards and dropped-object control.' },
  { id: 'srl',         name: 'Self-Retracting Lifelines', blurb: 'EN 360 webbing and wire-rope fall arrest blocks.' }
];

window.HANEKOM_PRODUCTS = [
  /* ---- Protective workwear ---- */
  { code:'P01', name:'Impressions 65/35 Conti Suit', variant:'All Colours', cat:'workwear', brand:'Impressions', price:450.00,
    desc:'Durable everyday two-piece workwear for industrial teams, with colour options for role or company identification.',
    tag:'Workwear | Colour options', spec:'Model / options: confirm on quote', img:'P01' },
  { code:'P03', name:'Green Worksuit', variant:'100% Polyester', cat:'workwear', brand:'Hanekom', price:250.00,
    desc:'Lightweight two-piece workwear suited to general duties, housekeeping and warm working conditions.',
    tag:'Lightweight workwear', spec:'Model / options: confirm on quote', img:'P03' },
  { code:'P04', name:'Javlin Acid Resistant Worksuit', variant:'', cat:'workwear', brand:'Javlin', price:950.00,
    desc:'Acid-resistant workwear option for chemical-handling and process environments; confirm the exact supplied model.',
    tag:'Chemical handling', spec:'Representative image — confirm exact item', img:'P04' },
  { code:'P02', name:'D59 Flame & Acid Resistant Worksuit', variant:'', cat:'workwear', brand:'D59', price:1098.50,
    desc:'Heavy-duty workwear for tasks where flame and acid-splash hazards require enhanced garment protection.',
    tag:'Specialist workwear', spec:'Model / options: confirm on quote', img:'P02' },

  /* ---- Hi-vis & outerwear ---- */
  { code:'P06', name:'Reflective Vest', variant:'Assorted Colours', cat:'hivis', brand:'Hanekom', price:75.00,
    desc:'Cost-effective visibility layer in assorted colours for visitors, crews and general site identification.',
    tag:'High visibility', spec:'Model / options: confirm on quote', img:'P06' },
  { code:'P05', name:'Reflective Vest', variant:'Lime Green', cat:'hivis', brand:'Hanekom', price:150.00,
    desc:'Bright lime visibility vest that improves worker conspicuity around vehicles, machinery and low-light work areas.',
    tag:'High visibility', spec:'Model / options: confirm on quote', img:'P05' },
  { code:'P07', name:'WATT Winter Jacket', variant:'', cat:'hivis', brand:'WATT', price:850.00,
    desc:'Insulated outer layer for colder shifts, early starts and exposed outdoor work.',
    tag:'Cold-weather layer', spec:'Model / options: confirm on quote', img:'P07' },

  /* ---- Hand protection ---- */
  { code:'C03', name:'GLO 300 Flexnite Grip Glove', variant:'Nitrile', cat:'hand', brand:'GLO', price:63.80,
    desc:'Nitrile-coated grip glove for general handling where abrasion resistance, dexterity and secure grip are important.',
    tag:'Nitrile-coated glove', spec:'Model / options: confirm on quote', img:'C03' },
  { code:'C04', name:'GLO 305 Cut Resistant Glove', variant:'13 Gauge Alkimos Cut 5 liner, nitrile coating', cat:'hand', brand:'GLO', price:154.00,
    desc:'Cut level 5 liner with nitrile coating for sharp-edged material handling while maintaining practical grip.',
    tag:'Cut-resistant glove', spec:'Model / options: confirm on quote', img:'C04' },
  { code:'P10', name:'Welding Glove Double Palm', variant:'', cat:'hand', brand:'Hanekom', price:125.00,
    desc:'Reinforced double-palm welding glove for improved durability and hand protection during hot-work handling.',
    tag:'Hand protection', spec:'Model / options: confirm on quote', img:'P10' },

  /* ---- Respiratory ---- */
  { code:'C01', name:'Karam Disposable Dust Mask', variant:'', cat:'respiratory', brand:'KARAM', price:7.50,
    desc:'Single-use dust mask for basic nuisance-particle control; confirm suitability for the assessed airborne hazard.',
    tag:'Disposable respiratory PPE', spec:'Model / options: confirm on quote', img:'C01' },
  { code:'C10', name:'KARAM FFP3 Mask', variant:'', cat:'respiratory', brand:'KARAM', price:33.34,
    desc:'FFP3 disposable respirator for higher-level particulate filtration where the task requires enhanced protection.',
    tag:'Respiratory PPE', spec:'FFP3 class — confirm fit testing', img:'C10' },
  { code:'C11', name:'KARAM FFP2 Welding Mask', variant:'', cat:'respiratory', brand:'KARAM', price:46.95,
    desc:'FFP2 respirator for welding-related particulate exposure; confirm fit, use limits and PPE compatibility.',
    tag:'Respiratory PPE', spec:'FFP2 class — confirm fit testing', img:'C11' },

  /* ---- Eye & face ---- */
  { code:'C06', name:'ES 001 Karam Clear Sporty Glasses', variant:'', cat:'eye', brand:'KARAM', price:29.95,
    desc:'Clear wraparound-style safety glasses for everyday eye protection in workshops, warehouses and industrial tasks.',
    tag:'Eye protection', spec:'Model / options: confirm on quote', img:'C06' },
  { code:'C05', name:'Dromex Sporty Clear Goggles', variant:'', cat:'eye', brand:'Dromex', price:35.00,
    desc:'Clear sporty goggles for impact and dust protection, with a lightweight profile for routine site use.',
    tag:'Eye protection', spec:'Model / options: confirm on quote', img:'C05' },
  { code:'C07', name:'ES 015 Karam Safety Glasses', variant:'Euro Style', cat:'eye', brand:'KARAM', price:45.00,
    desc:'Euro-style safety glasses offering lightweight eye coverage for visitors, operators and routine site activities.',
    tag:'Eye protection', spec:'Model / options: confirm on quote', img:'C07' },
  { code:'P11', name:'KARAM ES 61 Welding Shield', variant:'', cat:'eye', brand:'KARAM', price:300.00,
    desc:'Handheld welding shield that helps protect the face and eyes; confirm the required lens shade and configuration.',
    tag:'Face protection', spec:'Confirm required lens shade', img:'P11' },

  /* ---- Head ---- */
  { code:'C08', name:'Nikki Hard Hat', variant:'', cat:'head', brand:'Nikki', price:75.00,
    desc:'General-purpose hard hat for overhead-impact protection on construction, maintenance and industrial sites.',
    tag:'Head protection', spec:'Model / options: confirm on quote', img:'C08' },
  { code:'C09', name:'PN542 Karam Hard Hat', variant:'2-point chin strap', cat:'head', brand:'KARAM', price:142.46,
    desc:'KARAM hard hat with a two-point chin strap for improved retention during active or elevated work.',
    tag:'Head protection', spec:'2-point chin strap retention', img:'C09' },

  /* ---- Hearing ---- */
  { code:'P13', name:'Karam EP21 Ear Muff', variant:'27 dB', cat:'hearing', brand:'KARAM', price:278.00,
    desc:'Over-ear hearing protector rated at 27 dB for noisy industrial environments, subject to exposure assessment.',
    tag:'Hearing protection', spec:'27 dB attenuation rating', img:'P13' },

  /* ---- Footwear ---- */
  { code:'P14', name:'Rebel FX2 Safety Boot', variant:'', cat:'foot', brand:'Rebel Safety Gear', price:950.00,
    desc:'Practical safety boot for routine site work, balancing protective coverage with everyday wearability.',
    tag:'Safety footwear', spec:'Model / options: confirm on quote', img:'P14' },
  { code:'P17', name:'Grittgear Mangano Safety Boot', variant:'', cat:'foot', brand:'Grittgear', price:1050.00,
    desc:'Robust safety boot for demanding daily site use; confirm sole, toe protection and available sizing.',
    tag:'Safety footwear', spec:'Confirm sole and toe protection', img:'P17' },
  { code:'P15', name:'Tasco Safety Boot', variant:'', cat:'foot', brand:'Tasco', price:1115.00,
    desc:'Industrial safety boot option for workshops, construction and general plant duties; confirm the protection specification.',
    tag:'Safety footwear', spec:'Model / options: confirm on quote', img:'P15',
    // the only photograph supplied for this line shows the packaging rather
    // than the boot — flagged rather than substituted with another product
    imgNote:'The supplied photograph shows the packaging, not the boot itself. Ask us for a product photograph before ordering.' },
  { code:'P16', name:'Bova Chelsea Safety Boot', variant:'', cat:'foot', brand:'Bova', price:1950.00,
    desc:'Chelsea-style safety boot offering easy slip-on access for supervisors, technicians and mobile site personnel.',
    tag:'Safety footwear', spec:'Model / options: confirm on quote', img:'P16' },

  /* ---- Gumboots ---- */
  { code:'P18', name:'Egoli Gum Boot', variant:'', cat:'gumboots', brand:'Egoli', price:400.00,
    desc:'Economical gumboot for wet, muddy and wash-down environments requiring basic water-resistant footwear.',
    tag:'Water-resistant footwear', spec:'Model / options: confirm on quote', img:'P18' },
  { code:'P19', name:'Stimela Gum Boot', variant:'', cat:'gumboots', brand:'Stimela', price:750.00,
    desc:'Heavy-duty gumboot for industrial and agricultural wet-work; confirm sole and toe-protection options.',
    tag:'Water-resistant footwear', spec:'Confirm sole and toe options', img:'P19' },

  /* ---- Task-specific body ---- */
  { code:'P09', name:'Zam Leather Spat', variant:'', cat:'body', brand:'Zam', price:250.00,
    desc:'Leather lower-leg cover designed to shield footwear and ankles from sparks, spatter and hot debris.',
    tag:'Leather lower-leg protection', spec:'Model / options: confirm on quote', img:'P09' },
  { code:'P08', name:'Zam Leather Apron', variant:'', cat:'body', brand:'Zam', price:350.00,
    desc:'Leather apron providing front-body coverage against sparks, heat and abrasion during welding or grinding.',
    tag:'Leather body protection', spec:'Model / options: confirm on quote', img:'P08' },
  { code:'P12', name:'ASI Snake Gaiter', variant:'', cat:'body', brand:'ASI', price:1450.00,
    desc:'Protective gaiter designed to reduce lower-leg exposure in snake-prone field, farming and outdoor work.',
    tag:'Lower-leg protection', spec:'Model / options: confirm on quote', img:'P12' },
  { code:'C02', name:'30203/65 KARAM Disposable Coverall', variant:'65g Microporous Type 5/6', cat:'body', brand:'KARAM', price:154.87,
    desc:'Lightweight 65 g microporous disposable coverall for Type 5/6 particulate and limited liquid-splash protection.',
    tag:'Disposable chemical protection', spec:'Type 5/6 | 65 g microporous', img:'C02' },

  /* ---- Working at height ---- */
  { code:'PN 10(S)+PN 361', id:'PN10S', name:'Full Body Harness with Double Lanyard', variant:'Steel scaffold hooks', cat:'height', brand:'KARAM', price:775.41,
    desc:'Entry-level full-body fall-arrest set with a double lanyard and scaffold hooks for continuous connection.',
    tag:'Harness + lanyard', spec:'EN 361 + EN 355 | 1.7 m | dorsal', img:'PN10S' },
  { code:'PN 21(WB)+PN 361', id:'PN21WB', name:'Waist-Belt Harness with Double Lanyard', variant:'Steel scaffold hooks', cat:'height', brand:'KARAM', price:954.16,
    desc:'Full-body harness with positioning waist belt and twin lanyard for support and mobility at height.',
    tag:'Harness + lanyard + belt', spec:'EN 361 + EN 355 | 1.75 m', img:'PN21WB' },
  { code:'PN 24', id:'PN24', name:'Padded Dorsal and Sternal Full Body Harness', variant:'', cat:'height', brand:'KARAM', price:1917.29,
    desc:'Padded harness with dorsal and sternal attachment points for improved comfort during extended fall-arrest work.',
    tag:'Padded fall-arrest harness', spec:'EN 361 | dorsal + sternal | 1.50 kg', img:'PN24' },
  { code:'PN 42(03)', id:'PN4203', name:'Padded Work-Positioning Full Body Harness', variant:'', cat:'height', brand:'KARAM', price:2463.96,
    desc:'Padded harness combining fall-arrest and work-positioning functions for maintenance and access tasks.',
    tag:'Fall arrest + positioning', spec:'EN 361 + EN 358 | 2.04 kg', img:'PN4203' },
  { code:'PN 56', id:'PN56', name:'Padded Tower and Rope-Access Harness', variant:'', cat:'height', brand:'KARAM', price:3737.51,
    desc:'Four-point padded harness for tower climbing and rope-access work requiring multiple attachment options.',
    tag:'Four-point tower harness', spec:'EN 361 + EN 358 + EN 813 | 2.24 kg', img:'PN56' },
  { code:'MAGNA 2', id:'MAGNA2', name:'Alpha Series Work-Positioning Harness', variant:'', cat:'height', brand:'KARAM', price:6567.86,
    desc:'Advanced positioning harness with dorsal, sternal and lateral points for supported hands-free work at height.',
    tag:'Advanced positioning harness', spec:'Dorsal + sternal + lateral | 2.50 kg', img:'MAGNA2' },
  { code:'MAGNA 3', id:'MAGNA3', name:'Alpha Series Rope-Access Harness', variant:'', cat:'height', brand:'KARAM', price:7921.45,
    desc:'Advanced rope-access harness combining fall-arrest, positioning and sit-harness functions for technical teams.',
    tag:'Advanced rope-access harness', spec:'EN 361 + EN 358 + EN 813 | 2.30 kg', img:'MAGNA3' },

  /* ---- Lanyards & tool retention ---- */
  { code:'TL 01(N)', id:'TL01', name:'Single Tool Lanyard with Karabiner', variant:'', cat:'lanyards', brand:'KARAM', price:152.79,
    desc:'Adjustable single-leg tool lanyard that helps retain one tool and reduce dropped-object risk at height.',
    tag:'Single tool retention', spec:'85–135 cm | tools up to 10 kg', img:'TL01' },
  { code:'TL 02(N)', id:'TL02', name:'Twin Tool Lanyard with Karabiner', variant:'', cat:'lanyards', brand:'KARAM', price:205.32,
    desc:'Twin-leg tool lanyard for securing two tools or maintaining retention during tool changeover.',
    tag:'Twin tool retention', spec:'Twin leg | tools up to 10 kg', img:'TL02' },
  { code:'PN 361(30)', id:'PN36130', name:'Forked Lanyard with Energy Absorber', variant:'', cat:'lanyards', brand:'KARAM', price:1150.20,
    desc:'Forked energy-absorbing lanyard supporting continuous attachment between suitable anchor points.',
    tag:'Energy-absorbing lanyard', spec:'EN 355 | 1.5 m / 1.8 m / 2.0 m', img:'PN36130' },

  /* ---- Self-retracting lifelines ---- */
  { code:'MIC 02', id:'MIC02', name:'2 m Micron Webbing Block', variant:'', cat:'srl', brand:'KARAM', price:3447.43,
    desc:'Lightweight two-metre webbing block for compact personal fall arrest and short-range movement.',
    tag:'Compact retractable block', spec:'EN 360 | 2 m webbing | 1.17 kg', img:'MIC02' },
  { code:'TPGS 3.5', id:'TPGS35', name:'3.5 m Wire-Rope Self-Retracting Lifeline', variant:'', cat:'srl', brand:'KARAM', price:5174.00,
    desc:'Compact wire-rope self-retracting lifeline for shorter-range fall protection with fast line take-up.',
    tag:'Retractable fall arrester', spec:'EN 360 | 3.5 m | 2.23 kg | ATEX', img:'TPGS35' },
  { code:'TPGS 06', id:'TPGS06', name:'6 m Wire-Rope Self-Retracting Lifeline', variant:'', cat:'srl', brand:'KARAM', price:6463.66,
    desc:'Six-metre wire-rope self-retracting lifeline for mobile work zones requiring additional reach.',
    tag:'Retractable fall arrester', spec:'EN 360 | 6 m | 2.88 kg | ATEX', img:'TPGS06' },
  { code:'TPGS 10', id:'TPGS10', name:'10 m Wire-Rope Self-Retracting Lifeline', variant:'', cat:'srl', brand:'KARAM', price:9009.54,
    desc:'Ten-metre wire-rope self-retracting lifeline for larger work areas and elevated access routes.',
    tag:'Retractable fall arrester', spec:'EN 360 | 10 m | 4.28 kg | ATEX', img:'TPGS10' },
  { code:'TPGS 15', id:'TPGS15', name:'15 m Wire-Rope Self-Retracting Lifeline', variant:'', cat:'srl', brand:'KARAM', price:11193.66,
    desc:'Long-reach fifteen-metre wire-rope self-retracting lifeline for extensive work zones.',
    tag:'Retractable fall arrester', spec:'EN 360 | 15 m | 5.65 kg | ATEX', img:'TPGS15' }
];

/* Starter kits: a first-time buyer arriving with an empty quote list gets a
   plausible head-to-toe selection in one tap rather than a dead end.
   Codes must exist in HANEKOM_PRODUCTS above. */
window.HANEKOM_KITS = [
  { id:'site',   name:'General site kit',
    blurb:'Head-to-toe basics for a visitor, supervisor or new starter.',
    codes:['C08','P06','P14','C03','C06'] },
  { id:'weld',   name:'Welding &amp; hot work kit',
    blurb:'Face, hand and body protection for grinding and hot work.',
    codes:['P11','P10','P08','P09','C11'] },
  { id:'height', name:'Working-at-height kit',
    blurb:'EN 361 fall arrest set with retention and visibility.',
    codes:['PN 10(S)+PN 361','C09','TL 01(N)','P05'] },
  { id:'wet',    name:'Wet-work &amp; utility kit',
    blurb:'Water-resistant and chemical-handling essentials.',
    codes:['P19','P04','P05','C05'] }
];

/* give every product a DOM-safe id and its own page URL.
   The slug carries the brand and product name because that is what buyers
   actually search for — "bova chelsea safety boot zambia". */
window.hanekomSlug = function (p) {
  var base = (p.name + ' ' + (p.variant || '') + ' ' + p.code)
    .toLowerCase()
    .replace(/[&/]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return base + '.html';
};
window.HANEKOM_PRODUCTS.forEach(function (p) {
  if (!p.id) p.id = p.code;
  p.url = window.hanekomSlug(p);
});

/* ---------------------------------------------------------------------------
   SIZE AND COLOUR OPTIONS  —  READ THIS BEFORE EDITING

   The 2026 catalogue supplied prices, descriptions and photographs. It did
   NOT list a size range or a colour range for any product; every entry says
   "Model / options: confirm on quote". So the lists below are NOT a statement
   of what Hanekom holds in stock. They are the options a buyer may REQUEST,
   and the quote page says exactly that on screen.

   They use the ranges these garment and footwear types are normally made in
   for the Southern African market — UK sizing for boots, EN 420 numeric
   sizing for gloves, alpha sizing for suits and vests.

   HANEKOM: send your real ranges and this is the only file that changes.
   Delete a value you do not carry, add one you do. Nothing else needs
   touching — the quote page, the product pages and the WhatsApp and email
   messages all read from here.
--------------------------------------------------------------------------- */
window.HANEKOM_OPTION_SETS = {
  bootUK: { key: 'size', label: 'Size (UK)',
    values: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'] },
  gloveEN: { key: 'size', label: 'Glove size',
    values: ['7 / S', '8 / M', '9 / L', '10 / XL', '11 / 2XL'] },
  garment: { key: 'size', label: 'Size',
    values: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] },
  vest: { key: 'size', label: 'Size',
    values: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  suitColour: { key: 'colour', label: 'Colour',
    values: ['Navy blue', 'Royal blue', 'Khaki', 'Grey', 'Black',
             'Bottle green', 'Orange', 'Red', 'White'] },
  vestColour: { key: 'colour', label: 'Colour',
    values: ['Lime green', 'Yellow', 'Orange', 'Red', 'Blue', 'Navy blue', 'White'] }
};

/* Which sets apply to which products. Category first, then named exceptions.
   A product that is genuinely one-size — a hard hat, a harness, a lanyard, an
   SRL, eye and respiratory protection — gets no dropdown at all rather than a
   dropdown offering a choice that does not exist. */
(function assignOptions() {
  var S = window.HANEKOM_OPTION_SETS;
  var byCat = {
    foot: ['bootUK'], gumboots: ['bootUK'],
    hand: ['gloveEN'],
    workwear: ['garment'],
    hivis: ['vest']
  };
  var byCode = {
    P01: ['garment', 'suitColour'],   // "All Colours" in the catalogue
    P06: ['vest', 'vestColour'],      // "Assorted Colours" in the catalogue
    P05: ['vest'],                    // already a named colour — size only
    P07: ['garment'],                 // jacket, not a vest
    C02: ['garment'],                 // disposable coverall
    P08: [], P09: [], P12: []         // apron, spat, gaiter — one size
  };
  window.HANEKOM_PRODUCTS.forEach(function (p) {
    var names = byCode[p.code] || byCat[p.cat] || [];
    p.opts = names.map(function (n) { return S[n]; }).filter(Boolean);
  });
})();
