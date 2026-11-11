/* Upside level format: one shared checker for the game, the editor and the tests.
 *
 * A level file (levels/<id>.json):
 *   {
 *     "format": "upside-level",
 *     "version": 1,
 *     "id": "stepping-stones",      lowercase-hyphen, unique, never changes
 *     "name": "Stepping stones",
 *     "author": "yeger00",          optional
 *     "notes": "...",               optional, never shown in the game
 *     "map": ["###...", "..."]      text grid, one string per row
 *   }
 *
 * Map legend:
 *   #  wall                 1 / 2  Black / White start
 *   X  Black exit           Y      White exit
 *   a-d plate  ->  A-D door with the same letter. A door is one straight line of its letter, up-and-down or
 *                  side-to-side; a letter may have several doors, and its plates open all of them (see doorRuns)
 *   K  black crate          W      white crate
 *   ^  thorns on the floor  v      thorns on the ceiling
 *   space  empty
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UpsideLevelFormat = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FORMAT = 'upside-level';
  const VERSION = 1;
  const MIN_SIZE = 10, MAX_SIZE = 16;
  const LEGEND = '#12XYabcdABCDKW^v ';
  const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const ONE_OF_EACH = { '1': 'Black start (1)', '2': 'White start (2)', X: 'Black exit (X)', Y: 'White exit (Y)' };

  function slugify(name) {
    return String(name || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* Returns { ok, errors: [plain-language strings] }. opts.fileId: expected id (file name). */
  function checkLevel(def, opts) {
    opts = opts || {};
    const errors = [];
    if (!def || typeof def !== 'object' || Array.isArray(def)) return { ok: false, errors: ['This is not a level (expected a JSON object).'] };
    if (def.format !== FORMAT) errors.push(`"format" must be "${FORMAT}".`);
    if (def.version !== VERSION) errors.push(`"version" must be ${VERSION}.`);
    if (typeof def.id !== 'string' || !ID_RE.test(def.id)) errors.push('The id must be lowercase letters and digits joined by hyphens, like "stepping-stones".');
    else if (opts.fileId && def.id !== opts.fileId) errors.push(`The id "${def.id}" doesn't match the file name "${opts.fileId}.json".`);
    if (typeof def.name !== 'string' || !def.name.trim()) errors.push('The level needs a name.');
    for (const k of ['author', 'notes']) if (k in def && typeof def[k] !== 'string') errors.push(`"${k}" must be text.`);

    const map = def.map;
    if (!Array.isArray(map) || !map.length || !map.every(r => typeof r === 'string')) {
      errors.push('"map" must be a list of text rows.');
      return { ok: false, errors };
    }
    const h = map.length, w = map[0].length;
    if (!map.every(r => r.length === w)) { errors.push('Every map row must be the same width.'); return { ok: false, errors }; }
    if (w < MIN_SIZE || w > MAX_SIZE || h < MIN_SIZE || h > MAX_SIZE) errors.push(`The map is ${w}×${h}; width and height must each be ${MIN_SIZE}–${MAX_SIZE}.`);

    const bad = new Set();
    for (const r of map) for (const ch of r) if (!LEGEND.includes(ch)) bad.add(ch);
    if (bad.size) errors.push(`Unknown map characters: ${[...bad].map(c => `"${c}"`).join(', ')}.`);

    let edgeOk = true;
    for (let x = 0; x < w; x++) if (map[0][x] !== '#' || map[h - 1][x] !== '#') edgeOk = false;
    for (let y = 0; y < h; y++) if (map[y][0] !== '#' || map[y][w - 1] !== '#') edgeOk = false;
    if (!edgeOk) errors.push('The outer edge of the map must be all walls (#).');

    const count = {};
    const cells = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      count[ch] = (count[ch] || 0) + 1;
      (cells[ch] = cells[ch] || []).push({ x, y });
    }
    for (const ch in ONE_OF_EACH) {
      const n = count[ch] || 0;
      if (n !== 1) errors.push(n === 0 ? `Missing the ${ONE_OF_EACH[ch]}.` : `There are ${n} of the ${ONE_OF_EACH[ch]}; there must be exactly one.`);
    }
    for (const p of 'abcd') {
      const D = p.toUpperCase();
      if (count[p] && !count[D]) errors.push(`Plate ${p} has no door ${D}.`);
      if (count[D] && !count[p]) errors.push(`Door ${D} has no plate ${p}.`);
    }
    if (!bad.size) errors.push(...doorRuns(map).errors);
    return { ok: errors.length === 0, errors };
  }

  /* Splits a map's door tiles into doors. Touching tiles of the same letter make one door, which must be a straight
     line: up-and-down (dir 'v') or side-to-side (dir 'h'). A single tile is side-to-side when it sits between walls on
     its left and right (a hatch in a floor or ceiling), and up-and-down otherwise.
     Returns { doors: [{ letter, dir, cells: [{x, y}], x, y, w, h }], errors: [plain-language strings] }. */
  function doorRuns(map) {
    const h = map.length, w = h ? map[0].length : 0;
    const at = (x, y) => (x < 0 || y < 0 || y >= h || x >= map[y].length) ? '#' : map[y][x];
    const seen = new Set(), doors = [], errors = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      if (!(ch >= 'A' && ch <= 'D') || seen.has(y * w + x)) continue;
      const cells = [], todo = [[x, y]];
      seen.add(y * w + x);
      while (todo.length) {
        const [cx, cy] = todo.pop();
        cells.push({ x: cx, y: cy });
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (at(nx, ny) === ch && nx >= 0 && ny >= 0 && nx < w && ny < h && !seen.has(ny * w + nx)) { seen.add(ny * w + nx); todo.push([nx, ny]); }
        }
      }
      cells.sort((a, b) => a.y - b.y || a.x - b.x);
      const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      if (x0 !== x1 && y0 !== y1) {
        errors.push(`Door ${ch} tiles around column ${x0 + 1}, row ${y0 + 1} don't make a straight line. A door is one straight line, up-and-down or side-to-side; tiles that touch belong to the same door.`);
        continue;
      }
      let dir = x0 === x1 && y0 !== y1 ? 'v' : 'h';
      if (cells.length === 1) dir = at(x0 - 1, y0) === '#' && at(x0 + 1, y0) === '#' && !(at(x0, y0 - 1) === '#' && at(x0, y0 + 1) === '#') ? 'h' : 'v';
      doors.push({ letter: ch, dir, cells, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
    return { doors, errors };
  }

  /* Soft hints for the editor: things that are allowed but are often mistakes. */
  function hints(map) {
    const out = [];
    if (!Array.isArray(map) || !map.length) return out;
    const h = map.length, w = map[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '#' : map[y][x];
    const solid = (x, y) => at(x, y) === '#';
    const seen = new Set();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (solid(x, y)) continue;
      for (const g of [1, -1]) {                   // 1 = Black (floor below), -1 = White (ceiling above)
        if (!solid(x, y + g)) continue;
        for (const dir of [-1, 1]) {
          const nx = x + dir;
          if (nx < 1 || nx > w - 2) continue;
          let k = 0;
          while (solid(nx, y - g * k) && k < 6) k++;
          if ((k === 3 || k === 4) && !solid(nx, y - g * k)) {
            const key = `${g}:${nx}:${y - g * k}`;
            if (!seen.has(key)) {
              seen.add(key);
              out.push(`${g > 0 ? 'Black' : 'White'} meets a ${k}-tile step at column ${nx + 1}: too high to jump without a crate.`);
            }
          }
        }
      }
    }
    const runs = doorRuns(map).doors;
    for (const d of runs) {
      if (d.dir !== 'v' || d.cells.length >= 3) continue;
      const one = runs.filter(o => o.letter === d.letter).length > 1 ? ` at column ${d.x + 1}` : '';
      out.push(`Door ${d.letter}${one} is only ${d.cells.length} tile${d.cells.length > 1 ? 's' : ''} tall; a player may jump over it.`);
    }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const ch = map[y][x];
      if ((ch === 'K' || ch === 'W') && solid(x - 1, y) && solid(x + 1, y)) out.push(`The ${ch === 'K' ? 'black' : 'white'} crate at column ${x + 1}, row ${y + 1} is boxed in and can't be pushed.`);
      if (ch === '1' && !solid(x, y + 1)) out.push('Black starts in the air; it will fall at the start.');
      if (ch === '2' && !solid(x, y - 1)) out.push('White starts in the air; it will fall upward at the start.');
    }
    return out;
  }

  /* The canonical file text: one map row per line, so diffs read like the level. */
  function formatLevelJSON(def) {
    const head = { format: FORMAT, version: VERSION, id: def.id, name: def.name };
    if (def.author) head.author = def.author;
    if (def.notes) head.notes = def.notes;
    const lines = Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    const rows = def.map.map((r, i) => `    ${JSON.stringify(r)}${i < def.map.length - 1 ? ',' : ''}`);
    return `{\n${lines.join('\n')}\n  "map": [\n${rows.join('\n')}\n  ]\n}\n`;
  }

  /* ---------------- sharing a level in a link ----------------
   * A link carries the whole level after "#share=", so nothing has to be saved anywhere:
   *   index.html#share=...    plays it        editor.html#share=...   opens it for editing
   * The text is the level's JSON (without "format" and "version") in URL-safe base64.
   */
  const SHARE_KEY = 'share';
  function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromBase64Url(code) {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  /* The "#share=..." part of a link for this level. */
  function shareCode(def) {
    const d = { id: def.id, name: def.name };
    if (def.author) d.author = def.author;
    if (def.notes) d.notes = def.notes;
    d.map = def.map;
    return toBase64Url(JSON.stringify(d));
  }
  /* Reads a level from a share code, a whole link, or pasted level JSON.
     Returns { def } or { error: plain-language string }; the level is not checked here (use checkLevel). */
  function readShared(text) {
    text = String(text || '').trim();
    if (!text) return { error: 'There is nothing here to open.' };
    let json = null;
    if (text[0] === '{') json = text;
    else {
      const m = text.match(new RegExp('[#&?]' + SHARE_KEY + '=([A-Za-z0-9_-]+)')) || text.match(/^([A-Za-z0-9_-]{16,})$/);
      if (!m) return { error: "This isn't a level file or a level link." };
      try { json = fromBase64Url(m[1]); } catch (e) { return { error: 'This level link is broken (maybe it was cut short when copying).' }; }
    }
    let def;
    try { def = JSON.parse(json); } catch (e) { return { error: "This isn't valid level text (the JSON can't be read)." }; }
    if (!def || typeof def !== 'object' || Array.isArray(def)) return { error: "This isn't a level." };
    def = Object.assign({ format: FORMAT, version: VERSION }, def);
    return { def };
  }

  return { FORMAT, VERSION, MIN_SIZE, MAX_SIZE, LEGEND, slugify, checkLevel, hints, formatLevelJSON, doorRuns, SHARE_KEY, shareCode, readShared };
});
