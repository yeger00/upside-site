/* Upside: saved progress and settings, and the rules that read them.
   Used by the game (index.html) and the tests. No dependencies; works in the browser and in Node.

   Progress is kept by level id, never by number, so reordering levels/index.json can't mix it up.

   Editions (from edition.json, written by tools/build.js):
     demo  the website: only the demo's level files are there; the rest show as "Full game" cards
     app   the phone app: every level file is there; levels past the demo open once the full game is bought
     full  no edition.json (running the repo locally, the tests): everything can be opened */
(function (root) {
  'use strict';
  const KEY = 'upside.save.v1';
  const DEMO_LEVELS = 7;

  const blank = () => ({
    v: 1,
    finished: [],          // ids of levels both players have completed
    started: [],           // ids of levels that were played (finished or not)
    last: null,            // id of the level played most recently
    bought: false,         // the full game is unlocked (the app's purchase)
    seenHowTo: false,      // How to Play has been shown once
    settings: { sound: true, vibration: true, fullscreen: true, speed: 'normal' },
    t: 0,                  // when this was saved (to pick the newer of two copies)
  });

  function clean(s) {
    const b = blank();
    if (!s || typeof s !== 'object') return b;
    const ids = a => Array.isArray(a) ? a.filter(x => typeof x === 'string') : [];
    return {
      v: 1,
      finished: ids(s.finished), started: ids(s.started),
      last: typeof s.last === 'string' ? s.last : null,
      bought: s.bought === true, seenHowTo: s.seenHowTo === true,
      settings: Object.assign({}, b.settings, s.settings && typeof s.settings === 'object' ? s.settings : {}),
      t: +s.t || 0,
    };
  }

  // ---- the rules ----
  // How many levels this edition lets you open (the rest are "Full game" cards).
  function limit(edition, total, save) {
    const e = edition && edition.edition;
    const demo = (edition && edition.demoLevels) || DEMO_LEVELS;
    if (e === 'demo' || (e === 'app' && !save.bought)) return Math.min(total, demo);
    return total;
  }
  // Total number of levels the cards show: the website knows the full game's count from edition.json.
  function total(ids, edition) {
    return Math.max(ids.length, (edition && edition.edition === 'demo' && edition.fullLevels) || 0);
  }
  // A level opens when the one before it is finished; a level you've finished or started stays open.
  function isOpen(ids, i, save) {
    if (i === 0) return true;
    const id = ids[i];
    return save.finished.includes(ids[i - 1]) || save.finished.includes(id) || save.started.includes(id);
  }
  // What Play starts: the furthest level you've started and not finished; if none, the first open level you
  // haven't finished. null when everything you can open is finished.
  function playIndex(ids, edition, save) {
    const lim = Math.min(limit(edition, total(ids, edition), save), ids.length);
    let started = -1, first = -1;
    for (let i = 0; i < lim; i++) {
      if (!isOpen(ids, i, save) || save.finished.includes(ids[i])) continue;
      if (first < 0) first = i;
      if (save.started.includes(ids[i])) started = i;
    }
    return started >= 0 ? started : first >= 0 ? first : null;
  }
  // One entry per card: done | next | open | locked (finish the one before first) | full (needs the full game).
  function cards(ids, edition, save) {
    const n = total(ids, edition), lim = limit(edition, n, save), next = playIndex(ids, edition, save);
    const out = [];
    for (let i = 0; i < n; i++) {
      const id = ids[i] || null;
      let state;
      if (i >= lim || !id) state = 'full';
      else if (save.finished.includes(id)) state = 'done';
      else if (i === next) state = 'next';
      else if (isOpen(ids, i, save)) state = 'open';
      else state = 'locked';
      out.push({ i, id, state });
    }
    return out;
  }
  // After finishing level i: which level comes next, or why there isn't one.
  function afterWin(ids, edition, save, i) {
    const n = total(ids, edition), lim = limit(edition, n, save);
    if (i + 1 < Math.min(lim, ids.length)) return { next: i + 1 };
    if (i + 1 < n) return { fullGame: true };        // the demo is over
    return { end: true };                             // that was the last level
  }

  // ---- changing it ----
  const add = (list, id) => list.includes(id) ? list : list.concat(id);
  function markStarted(save, id) { return Object.assign({}, save, { started: add(save.started, id), last: id }); }
  function markFinished(save, id) { return Object.assign({}, save, { finished: add(save.finished, id), started: add(save.started, id), last: id }); }
  function resetProgress(save) { const b = blank(); return Object.assign({}, save, { finished: b.finished, started: b.started, last: null, seenHowTo: false }); }

  // ---- storing it ----
  // localStorage in the browser; in the app also Capacitor's Preferences, which the phone never clears.
  function prefs() { try { const C = root.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Preferences; } catch (e) { return null; } }
  function loadLocal() {
    try { const raw = root.localStorage && root.localStorage.getItem(KEY); return raw ? clean(JSON.parse(raw)) : blank(); }
    catch (e) { return blank(); }
  }
  async function load() {
    let s = loadLocal();
    const P = prefs();
    if (P) {
      try { const r = await P.get({ key: KEY }); if (r && r.value) { const p = clean(JSON.parse(r.value)); if (p.t > s.t) s = p; } }
      catch (e) {}
    }
    return s;
  }
  function store(save) {
    const s = Object.assign({}, save, { t: Date.now() });
    const json = JSON.stringify(s);
    try { root.localStorage && root.localStorage.setItem(KEY, json); } catch (e) {}
    const P = prefs();
    if (P) { try { P.set({ key: KEY, value: json }); } catch (e) {} }
    return s;
  }

  const api = { KEY, DEMO_LEVELS, blank, clean, limit, total, isOpen, playIndex, cards, afterWin,
    markStarted, markFinished, resetProgress, load, loadLocal, store };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UpsideProgress = api;
})(typeof window !== 'undefined' ? window : globalThis);
