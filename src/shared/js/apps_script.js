/**
 * Tours JSON Web App with multi-client support and visible server-side caching
 * Query:
 *   ?client=demo|kamar-tours&mode=all|index|slug|type|tag|keyword|snippet&value=...&debug=1&nocache=1
 * Response:
 *   JSON (for data modes) or HTML (for mode=snippet)
 */
const CONFIG = {
  // Map client IDs to sheet names
  CLIENT_SHEETS: {
    'tour-driver': 'Tour Driver (Demo)',
    'kamar-tours': 'Kamar Tours'
  },
  CACHE_TTL_SEC: 900, // 15 minutes
};

function doGet(e) {
  var params = (e && e.parameter) || {};
  var client = String(params.client || '').toLowerCase().trim();
  var mode  = String((params.mode  || 'all')).toLowerCase().trim();
  var value = String((params.value || '')).trim();
  var debug = String(params.debug || '').trim() === '1';
  var noCache = String(params.nocache || '').trim() === '1';

  // Require client parameter
  if (!client) {
    return jsonOut_({ 
      error: 'client_required', 
      message: 'Please specify a client parameter',
      availableClients: Object.keys(CONFIG.CLIENT_SHEETS),
      version: isoNowUTC_(), 
      tours: [] 
    });
  }

  // Initialize debug info
  var debugInfo = {};

  // Validate client
  if (!CONFIG.CLIENT_SHEETS[client]) {
    return jsonOut_({ 
      error: 'invalid_client', 
      availableClients: Object.keys(CONFIG.CLIENT_SHEETS),
      version: isoNowUTC_(), 
      tours: [] 
    });
  }

  // allow "snippet" to return a ready-to-paste inline JSON block
  var ALLOWED = new Set(['all','index','slug','type','tag','keyword','snippet']);
  if (!ALLOWED.has(mode)) {
    return jsonOut_({ error: 'invalid_mode', version: isoNowUTC_(), tours: [] });
  }

  var ss = openSpreadsheet_();
  var version = isoLastUpdated_(ss);
  var sheetName = CONFIG.CLIENT_SHEETS[client];

  // Add basic debug info
  if (debug) {
    debugInfo.client = client;
    debugInfo.sheetName = sheetName;
    debugInfo.mode = mode;
    debugInfo.value = value;
  }

  // --- Special case: mode=snippet returns HTML snippet for a single slug ---
  if (mode === 'snippet') {
    if (!value) {
      return htmlOut_(
        '<p style="font:14px system-ui">Provide a slug: <code>?client=' + client + '&mode=snippet&value=your-slug</code></p>'
      );
    }
    var hit = findTourBySlug_(ss, value, sheetName);
    if (!hit) {
      return htmlOut_('<p style="font:14px system-ui;color:#b91c1c">Slug not found in ' + client + ' tours.</p>');
    }
    var jsonStr = buildInlineJSON_(hit, version);
    var snippet = buildInlineSnippet_(jsonStr);
    return htmlOut_(snippet);
  }

  // ------- Normal JSON modes below (with server-side caching) -------
  var cache = CacheService.getScriptCache();
  var cacheKey = ['tours-json-v6', client, version, mode, value].join('::');

  if (!noCache) {
    var cached = cache.get(cacheKey);
    if (cached) {
      if (debug) {
        try {
          var obj = JSON.parse(cached);
          obj._cache = 'hit';
          obj._client = client;
          return jsonOut_(obj);
        } catch (_) {}
      }
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
  }

  var sh = ss.getSheetByName(sheetName);
  if (!sh) {
    var missEmpty = { version: version, client: client, tours: [] };
    if (debug) {
      missEmpty._cache = 'miss';
      missEmpty._debug = { error: 'Sheet not found', sheetName: sheetName };
    }
    return cacheOut_(cache, cacheKey, missEmpty, CONFIG.CACHE_TTL_SEC, !noCache);
  }

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  
  if (debug) {
    debugInfo.lastRow = lastRow;
    debugInfo.lastCol = lastCol;
  }

  if (lastRow < 2 || lastCol < 1) {
    var missEmpty2 = { version: version, client: client, tours: [] };
    if (debug) {
      missEmpty2._cache = 'miss';
      missEmpty2._debug = debugInfo;
      missEmpty2._debug.error = 'No data rows or columns';
    }
    return cacheOut_(cache, cacheKey, missEmpty2, CONFIG.CACHE_TTL_SEC, !noCache);
  }

  var grid = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (!grid || !grid.length) {
    var missEmpty3 = { version: version, client: client, tours: [] };
    if (debug) {
      missEmpty3._cache = 'miss';
      missEmpty3._debug = debugInfo;
      missEmpty3._debug.error = 'No grid data';
    }
    return cacheOut_(cache, cacheKey, missEmpty3, CONFIG.CACHE_TTL_SEC, !noCache);
  }

  // Add more debug info
  if (debug) {
    debugInfo.gridLength = grid.length;
    debugInfo.headers = grid[0];
    debugInfo.firstDataRow = grid[1] || null;
  }

  var headerRaw = grid[0].map(function(h){ return String(h || '').trim(); });
  var headerLen = rightmostNonEmptyIndex_(headerRaw) + 1;
  
  if (debug) {
    debugInfo.headerRaw = headerRaw;
    debugInfo.headerLen = headerLen;
  }

  if (headerLen <= 0) {
    var missEmpty4 = { version: version, client: client, tours: [] };
    if (debug) {
      missEmpty4._cache = 'miss';
      missEmpty4._debug = debugInfo;
      missEmpty4._debug.error = 'No valid headers';
    }
    return cacheOut_(cache, cacheKey, missEmpty4, CONFIG.CACHE_TTL_SEC, !noCache);
  }

  var header = headerRaw.slice(0, headerLen);
  var rows = grid.slice(1).map(function(r){ return r.slice(0, headerLen); });

  if (debug) {
    debugInfo.header = header;
    debugInfo.rowCount = rows.length;
    debugInfo.sampleRow = rows[0] || null;
  }

  // Build objects
  var tours = rows.map(function (r) {
      var obj = {};
      for (var i = 0; i < headerLen; i++) {
        var key = header[i];
        var v = r[i];
        if (typeof v === 'string') {
          var s = v.trim();
          var looksArray = s.length >= 2 && s[0] === '[' && s[s.length - 1] === ']';
          var looksObj   = s.length >= 2 && s[0] === '{' && s[s.length - 1] === '}';
          if (looksArray || looksObj) { try { v = JSON.parse(s); } catch (_) {} }
        }
        obj[key] = v;
      }
      normalizeTour_(obj);
      return obj;
    })
    // keep only rows that actually have a slug
    .filter(function (t) { return t && String(t.slug || '').trim() !== ''; });

  if (debug) {
    debugInfo.toursBeforeFilter = rows.length;
    debugInfo.toursAfterSlugFilter = tours.length;
    debugInfo.sampleTour = tours[0] || null;
  }

  if (mode === 'index') {
    var slim = tours.map(pickIndexFields_);
    var bodyIndex = { version: version, client: client, tours: slim };
    if (debug) {
      bodyIndex._cache = 'miss';
      bodyIndex._debug = debugInfo;
    }
    return cacheOut_(cache, cacheKey, bodyIndex, CONFIG.CACHE_TTL_SEC, !noCache);
  }

  // filtering
  var filtered = filterRows_(tours, mode, value);
  
  if (debug) {
    debugInfo.toursAfterModeFilter = filtered.length;
  }
  
  var body = { 
    version: version, 
    client: client, 
    tours: filtered 
  };
  if (debug) {
    body._cache = 'miss';
    body._debug = debugInfo;
  }
  return cacheOut_(cache, cacheKey, body, CONFIG.CACHE_TTL_SEC, !noCache);
}

/* ---------- Helpers ---------- */

function openSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function isoLastUpdated_(ss) {
  var file = DriveApp.getFileById(ss.getId());
  var d = file.getLastUpdated();
  return Utilities.formatDate(d, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function isoNowUTC_() {
  return Utilities.formatDate(new Date(), 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function rightmostNonEmptyIndex_(arr) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] && String(arr[i]).trim() !== '') return i;
  }
  return -1;
}

function cacheOut_(cache, key, obj, ttlSec, allowPut) {
  var json = JSON.stringify(obj);
  if (allowPut && cache && key) cache.put(key, json, Math.max(1, (ttlSec|0) || 60));
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlOut_(html) {
  return ContentService.createTextOutput(String(html))
    .setMimeType(ContentService.MimeType.HTML);
}

/** Build a tour list (UPDATED for multi-client) */
function getAllTours_(ss, sheetName) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  var grid = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (!grid || !grid.length) return [];

  var headerRaw = grid[0].map(function(h){ return String(h || '').trim(); });
  var headerLen = rightmostNonEmptyIndex_(headerRaw) + 1;
  if (headerLen <= 0) return [];

  var header = headerRaw.slice(0, headerLen);
  var rows = grid.slice(1).map(function(r){ return r.slice(0, headerLen); });

  var tours = rows.map(function (r) {
      var obj = {};
      for (var i = 0; i < headerLen; i++) {
        var key = header[i];
        var v = r[i];
        if (typeof v === 'string') {
          var s = v.trim();
          var looksArray = s.length >= 2 && s[0] === '[' && s[s.length - 1] === ']';
          var looksObj   = s.length >= 2 && s[0] === '{' && s[s.length - 1] === '}';
          if (looksArray || looksObj) { try { v = JSON.parse(s); } catch (_) {} }
        }
        obj[key] = v;
      }
      normalizeTour_(obj);
      return obj;
    })
    .filter(function (t) { return t && String(t.slug || '').trim() !== ''; });

  return tours;
}

function findTourBySlug_(ss, slug, sheetName) {
  var tours = getAllTours_(ss, sheetName);
  var vv = norm_(trimSlashes_(slug));
  for (var i=0; i<tours.length; i++){
    if (norm_(trimSlashes_(tours[i].slug)) === vv) return tours[i];
  }
  return null;
}

/** Normalization */
function normalizeTour_(obj) {
  var map = function (cand) {
    for (var i = 0; i < cand.length; i++) {
      var k = cand[i];
      if (Object.prototype.hasOwnProperty.call(obj, k)) return k;
    }
    return null;
  };

  var kName     = map(['name','Name','title','Title']);
  var kSlug     = map(['slug','Slug','urlslug','URL Slug']);
  var kImage    = map(['image','Image','photo','Photo']);
  var kDuration = map(['duration','Duration']);
  var kLocation = map(['location','Location','city','City']);
  var kType     = map(['type','Type','category','Category']);
  var kGroup    = map(['group','Group']);
  var kExcerpt  = map(['excerpt','Excerpt','description','Description','summary','Summary']);
  var kPrice    = map(['fromPrice','From Price','price','Price','starting_price','Starting Price']);
  var kTags     = map(['tags','Tags','labels','Labels']);

  var tags = [];
  if (kTags) {
    var t = obj[kTags];
    if (Array.isArray(t)) tags = t.map(function (x){return String(x).trim();}).filter(Boolean);
    else if (typeof t === 'string') tags = t.split(/[,|\n]/).map(function (x){return String(x).trim();}).filter(Boolean);
    else if (t == null) tags = [];
    else tags = [String(t)];
  }
  obj.tags = tags;

  if (kPrice) {
    var raw = obj[kPrice];
    if (raw != null && raw !== '') {
      var num = Number(String(raw).replace(/[^\d.]/g, ''));
      obj.fromPrice = Number.isFinite(num) ? num : raw;
    }
  }

  if (kName)     obj.name = obj[kName];
  if (kSlug)     obj.slug = obj[kSlug];
  if (kImage)    obj.image = obj[kImage];
  if (kDuration) obj.duration = obj[kDuration];
  if (kLocation) obj.location = obj[kLocation];
  if (kType)     obj.type = obj[kType];
  if (kGroup)    obj.group = obj[kGroup];
  if (kExcerpt)  obj.excerpt = obj[kExcerpt];

  if (!Array.isArray(obj.tags)) obj.tags = [];
  if (obj.fromPrice == null) obj.fromPrice = '';
  obj.name     = obj.name     != null ? obj.name     : '';
  obj.slug     = obj.slug     != null ? obj.slug     : '';
  obj.image    = obj.image    != null ? obj.image    : '';
  obj.duration = obj.duration != null ? obj.duration : '';
  obj.location = obj.location != null ? obj.location : '';
  obj.type     = obj.type     != null ? obj.type     : '';
  obj.group    = obj.group    != null ? obj.group    : '';
  obj.excerpt  = obj.excerpt  != null ? obj.excerpt  : '';
}

function norm_(s) { return String(s || '').toLowerCase().trim(); }
function trimSlashes_(s) { return String(s || '').replace(/\/+$/,''); }

function filterRows_(tours, mode, value) {
  if (!tours || !tours.length) return [];
  var v = norm_(value);

  if (mode === 'all') return tours;

  if (mode === 'slug') {
    var vv = norm_(trimSlashes_(value));
    var hit = tours.find(function (t) {
      return norm_(trimSlashes_(t.slug)) === vv;
    });
    return hit ? [hit] : [];
  }

  if (mode === 'type') return tours.filter(function (t) { return norm_(t.type) === v; });

  if (mode === 'tag') {
    return tours.filter(function (t) {
      var tags = Array.isArray(t.tags) ? t.tags : [];
      var n = tags.map(norm_);
      return n.indexOf(v) !== -1;
    });
  }

  if (mode === 'keyword') {
    return tours.filter(function (t) {
      var hay = [
        t.name, t.excerpt, (Array.isArray(t.tags) ? t.tags.join(' ') : ''),
        t.location, t.type, t.group, t.slug
      ].map(norm_).join(' ');
      return hay.indexOf(v) !== -1;
    });
  }

  return [];
}

function pickIndexFields_(t) {
  return {
    name: t.name || '',
    slug: t.slug || '',
    image: t.image || '',
    location: t.location || '',
    duration: t.duration || '',
    type: t.type || '',
    group: t.group || '',
    excerpt: t.excerpt || '',
    fromPrice: t.fromPrice != null ? t.fromPrice : ''
  };
}

/* --------- Inline JSON builder (Option A) --------- */

function buildInlineObject_(t, version) {
  var obj = {
    slug: t.slug || '',
    name: t.name || '',
    image: t.image || '',
    gallery: Array.isArray(t.gallery) ? t.gallery.filter(Boolean) : [],
    descriptionHTML: String(t.descriptionHTML != null ? t.descriptionHTML : (t.description || '')).toString(),
    highlights: Array.isArray(t.highlights) ? t.highlights : (Array.isArray(t.tags) ? t.tags : []),
    itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
    inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
    exclusions: Array.isArray(t.exclusions) ? t.exclusions : [],
    faqs: Array.isArray(t.faqs) ? t.faqs : [],
    location: t.location || '',
    duration: t.duration || '',
    type: t.type || '',
    group: t.group || '',
    fromPrice: (t.fromPrice != null ? t.fromPrice : ''),
    __v: version || isoNowUTC_()
  };
  return obj;
}

function buildInlineJSON_(tour, version) {
  var obj = buildInlineObject_(tour, version);
  var json = JSON.stringify(obj, null, 2);
  // Guard against closing </script> sequences inside descriptionHTML
  json = json.replace(/<\/script>/gi, '<\\/script>');
  return json;
}

function buildInlineSnippet_(jsonStr) {
  return [
    '<!-- Paste this anywhere above Block A -->',
    '<script id="tour-data" type="application/json">',
    jsonStr,
    '</script>'
  ].join('\n');
}

/* --------- Sheets UI (Sidebar) --------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tour Publisher')
    .addItem('Inline JSON (Sidebar)', 'openInlineSidebar_')
    .addToUi();
}

function openInlineSidebar_() {
  // No string-replace. Sidebar will fetch slugs via google.script.run
  var out = HtmlService.createHtmlOutputFromFile('InlineJSONSidebar')
    .setTitle('Inline JSON')
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(out);
}

// Sidebar RPCs
function listSlugs() {
  var ss = openSpreadsheet_();
  var tours = getAllTours_(ss);
  return tours.map(function(t){ return t.slug; }).filter(Boolean).sort();
}

function getInlineSnippetForSlug(slug) {
  var ss = openSpreadsheet_();
  var version = isoLastUpdated_(ss);
  var t = findTourBySlug_(ss, slug);
  if (!t) return '/* Slug not found */';
  var jsonStr = buildInlineJSON_(t, version);
  return buildInlineSnippet_(jsonStr);
}