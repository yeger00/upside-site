/* Upside: the menus. Main menu, Levels, Settings, How to Play, Full game, and the pause cards.
   Plain DOM over the game's canvas; the game (index.html) passes in what the menus need with UpsideMenu.init(game).
   The menus face the bottom of the phone (Black's side): one person holds the phone to choose. The pause cards
   face both seats. */
(function () {
  'use strict';
  const PR = window.UpsideProgress;
  const ICON = {
    play: 'M6 3.5v17l14-8.5z',
    levels: 'M2 5a2.2 2.2 0 104.4 0A2.2 2.2 0 002 5zm0 7a2.2 2.2 0 104.4 0A2.2 2.2 0 002 12zm0 7a2.2 2.2 0 104.4 0A2.2 2.2 0 002 19zM9 3h13v4H9zm0 7h13v4H9zm0 7h13v4H9z',
    settings: 'M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm9.4 5.1l-2.1-.3a7.6 7.6 0 01-.7 1.7l1.3 1.7-2.4 2.4-1.7-1.3c-.5.3-1.1.6-1.7.7l-.3 2.1h-3.4l-.3-2.1a7.6 7.6 0 01-1.7-.7l-1.7 1.3-2.4-2.4 1.3-1.7a7.6 7.6 0 01-.7-1.7l-2.1-.3v-3.4l2.1-.3c.2-.6.4-1.2.7-1.7L3.8 5.7l2.4-2.4 1.7 1.3c.5-.3 1.1-.6 1.7-.7l.3-2.1h3.4l.3 2.1c.6.2 1.2.4 1.7.7l1.7-1.3 2.4 2.4-1.3 1.7c.3.5.6 1.1.7 1.7l2.1.3z',
    help: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1.2 16h-2.4v-2.4h2.4zm2.3-7.9l-1 1c-.9.9-1.3 1.5-1.3 3h-2.3v-.6c0-1.2.4-2.3 1.3-3.1l1.3-1.4c.4-.4.6-.9.6-1.5a2 2 0 10-4 0H7.8a4.2 4.2 0 118.4 0c0 1-.4 1.9-.7 2.6z',
    star: 'M12 1.5l2.6 7.1 7.4.3-5.8 4.7 2 7.3L12 16.8l-6.2 4.1 2-7.3L2 8.9l7.4-.3z',
    sound: 'M3 9h4l5-5v16l-5-5H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z',
    vibrate: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm0 3v14h8V5zM2 8h2v8H2zm18 0h2v8h-2z',
    fullscreen: 'M3 3h7v2.5H5.5V10H3zm11 0h7v7h-2.5V5.5H14zM3 14h2.5v4.5H10V21H3zm15.5 0H21v7h-7v-2.5h4.5z',
    snail: 'M14 6a6 6 0 016 6c0 2.4-1.4 4.4-3.4 5.4H22V20H5a3 3 0 01-3-3v-1.5l2-.5V10l-1.6-3.3 1.8-.9L5.5 8h.8l1.3-2.7 1.8.9L8 9.3v5.2l.7-.2A6 6 0 0114 6zm0 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
    reset: 'M12 4a8 8 0 017.7 6h-2.6A5.5 5.5 0 106.6 14.6L9 12v7H2l2.9-2.9A8 8 0 0112 4z',
    check: 'M9.5 16.6L4.4 11.5l-2 2 7.1 7.1L22 8.1l-2-2z',
    home: 'M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z',
    restart: 'M12 4a8 8 0 11-7.7 10h2.6A5.5 5.5 0 1012 6.5V10L7 5l5-5z',
    unlock: 'M7 10V7a5 5 0 019.6-2l-2.2 1A2.6 2.6 0 009.5 7v3H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2zm5 4a2 2 0 00-1 3.7V19h2v-1.3A2 2 0 0012 14z',
    restore: 'M13 3a9 9 0 00-9 9H1l4 4 4-4H6.5a6.5 6.5 0 112 4.6l-1.8 1.8A9 9 0 1013 3zm-1 5v5l4.3 2.5 1-1.6-3.3-2V8z',
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  let G = null, root = null, pauseEl = null, current = null, opts = {}, levelPage = 0, tipsRAF = 0;
  const scr = {};

  function init(game) {
    G = game;
    root = el(`<div class="menu" id="menu" aria-hidden="true"><div class="scene"></div></div>`);
    const scene = root.querySelector('.scene');
    for (const [l, t, w, h] of [[8, 9, 90, 34], [58, 16, 120, 40], [20, 46, 100, 30], [64, 63, 130, 44], [6, 74, 110, 36]])
      scene.appendChild(el(`<div class="cloud" style="left:${l}%;top:${t}%;width:${w}px;height:${h}px"></div>`));
    for (let i = 0; i < 14; i++) scene.appendChild(el(`<div class="spark" style="left:${(i * 37) % 97}%;top:${(i * 23) % 70 + 4}%;opacity:${0.4 + (i % 3) * 0.2}"></div>`));
    for (const [cls, src] of [['ruins', 'ruins'], ['ground', 'ground'], ['tl', 'corner-tl'], ['tr', 'corner-tr']])
      scene.appendChild(el(`<img class="${cls}" src="assets/ui/${src}.webp" alt="">`));

    scr.home = el(`<section class="screen" data-screen="home" aria-label="Main menu">
      <img class="logo" src="assets/ui/logo.webp" alt="Upside">
      <div class="grow"></div>
      <button class="btn" data-go="play">${svg('play')}<span class="label">Play</span></button>
      <button class="btn" data-go="levels">${svg('levels')}<span class="label">Levels</span></button>
      <button class="btn" data-go="settings">${svg('settings')}<span class="label">Settings</span></button>
      <button class="btn" data-go="howto">${svg('help')}<span class="label">How to Play</span></button>
      <button class="btn small gold" data-go="full" hidden>${svg('star')}<span class="label">Full game</span></button>
      <div class="grow"></div><div class="grow"></div>
    </section>`);
    scr.levels = el(`<section class="screen" data-screen="levels" aria-label="Levels">
      <button class="round" data-back aria-label="Back"></button>
      <div class="ribbon"><span>Levels</span></div>
      <div class="pages"><div class="track"></div></div>
      <div class="dots"></div>
      <div class="hint" aria-live="polite"></div>
    </section>`);
    scr.settings = el(`<section class="screen" data-screen="settings" aria-label="Settings">
      <button class="round" data-back aria-label="Back"></button>
      <div class="ribbon"><span>Settings</span></div>
      <div class="rows"></div>
      <div class="grow"></div>
      <button class="btn" data-back>${svg('check')}<span class="label">Done</span></button>
      <div class="grow"></div>
    </section>`);
    scr.howto = el(`<section class="screen" data-screen="howto" aria-label="How to Play">
      <button class="round" data-back aria-label="Back"></button>
      <div class="ribbon"><span>How to Play</span></div>
      <div class="tips">
        <div class="tip"><canvas data-tip="move" width="320" height="200"></canvas><p><b>Each of you falls to your own side</b>White walks on the ceiling, Black on the floor. Move with ◀ ▶, jump with the arrow.</p></div>
        <div class="tip"><canvas data-tip="plates" width="320" height="200"></canvas><p><b>Plates open doors</b>Stand on a plate to open the door with the same symbol: often your friend's door.</p></div>
        <div class="tip"><canvas data-tip="exits" width="320" height="200"></canvas><p><b>Reach both exits</b>White's exit hangs from the ceiling, Black's stands on the floor. Get there together!</p></div>
      </div>
      <div class="grow"></div>
      <button class="btn" data-howto-done>${svg('check')}<span class="label">Got it!</span></button>
    </section>`);
    scr.full = el(`<section class="screen" data-screen="full" aria-label="Full game">
      <button class="round" data-back aria-label="Back"></button>
      <div class="ribbon"><span>Full game</span></div>
      <div class="pitch"></div>
      <div class="grow"></div>
      <div class="buy"></div>
      <div class="grow"></div>
    </section>`);
    for (const s of Object.values(scr)) root.appendChild(s);
    document.body.appendChild(root);

    pauseEl = el(`<div class="pause" id="pause" aria-hidden="true"></div>`);
    for (const seat of ['white', 'black']) pauseEl.appendChild(el(`<div class="seat ${seat}">
      <div class="ribbon"><span>Paused</span></div>
      <div class="grid">
        <button class="btn" data-pause="resume">${svg('play')}<span class="label">Resume</span></button>
        <button class="btn" data-pause="restart">${svg('restart')}<span class="label">Restart</span></button>
        <button class="btn" data-pause="settings">${svg('settings')}<span class="label">Settings</span></button>
        <button class="btn" data-pause="home">${svg('home')}<span class="label">Home</span></button>
      </div></div>`));
    document.body.appendChild(pauseEl);

    root.addEventListener('click', onClick);
    pauseEl.addEventListener('click', e => {
      const b = e.target.closest('[data-pause]'); if (!b) return;
      G.click();
      const what = b.dataset.pause;
      if (what === 'settings') { pause(false); open('settings', { back: 'pause' }); }   // the game stays paused underneath
      else { pause(false); G.pauseAction(what); }
    });
    window.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); back(); }
    });
    setupSwipe();
  }

  /* ---- navigation ---- */
  function isOpen() { return !!current; }
  function open(name, o) {
    opts = o || {};
    current = name;
    root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
    for (const [k, s] of Object.entries(scr)) s.classList.toggle('on', k === name);
    if (name === 'home') renderHome();
    if (name === 'levels') renderLevels(opts.page);
    if (name === 'settings') renderSettings();
    if (name === 'howto') startTips(); else stopTips();
    if (name === 'full') renderFull();
    const first = scr[name].querySelector('.btn, .card, .round');
    if (first && document.activeElement && document.activeElement.tagName !== 'CANVAS') first.focus({ preventScroll: true });
  }
  function close() {
    current = null; stopTips();
    if (root) { root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); }
  }
  function back() {
    G.click();
    if (opts.back === 'pause') { close(); pause(true); return; }
    if (current === 'home') return;
    open(opts.back && scr[opts.back] ? opts.back : 'home', opts.back === 'levels' ? { page: levelPage } : undefined);
  }
  function pause(on) {
    pauseEl.classList.toggle('open', !!on);
    pauseEl.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  function onClick(e) {
    const t = e.target;
    if (t.closest('[data-back]')) { back(); return; }
    const go = t.closest('[data-go]');
    if (go) {
      G.click();
      const where = go.dataset.go;
      if (where === 'play') playNext();
      else open(where);
      return;
    }
    if (t.closest('[data-howto-done]')) {
      G.click();
      G.update(s => Object.assign({}, s, { seenHowTo: true }));
      if (opts.thenPlay != null) { const i = opts.thenPlay; close(); G.play(i); }
      else open('home');
      return;
    }
    const card = t.closest('.card');
    if (card) { G.click(); cardTap(+card.dataset.i); return; }
    const dot = t.closest('.dots button');
    if (dot) { G.click(); showPage(+dot.dataset.p); return; }
    const tog = t.closest('.toggle');
    if (tog) { G.click(); toggleSetting(tog.dataset.key); return; }
  }

  /* ---- home ---- */
  function renderHome() {
    const ids = G.ids(), ed = G.edition(), s = G.save();
    const locked = PR.limit(ed, PR.total(ids, ed), s) < PR.total(ids, ed);
    scr.home.querySelector('[data-go="full"]').hidden = !locked;
  }
  // Play: the level you should be on next; with nothing left to play, the Levels screen.
  function playNext() {
    const i = PR.playIndex(G.ids(), G.edition(), G.save());
    if (i == null) { open(fullGameLocked() ? 'full' : 'levels'); return; }
    if (!G.save().seenHowTo) { open('howto', { thenPlay: i }); return; }
    close(); G.play(i);
  }
  function fullGameLocked() { const ids = G.ids(), ed = G.edition(); return PR.limit(ed, PR.total(ids, ed), G.save()) < PR.total(ids, ed); }

  /* ---- levels ---- */
  const PER_PAGE = 9;
  function renderLevels(page) {
    const list = PR.cards(G.ids(), G.edition(), G.save()), defs = G.defs();
    const track = scr.levels.querySelector('.track'), dots = scr.levels.querySelector('.dots');
    track.innerHTML = ''; dots.innerHTML = '';
    const pages = Math.ceil(list.length / PER_PAGE);
    for (let p = 0; p < pages; p++) {
      const pg = el(`<div class="page"></div>`);
      for (const c of list.slice(p * PER_PAGE, (p + 1) * PER_PAGE)) {
        const name = c.id && defs[c.i] ? defs[c.i].name : 'Full game';
        const label = { done: 'finished', next: 'play next', open: 'open', locked: 'locked', full: 'in the full game' }[c.state];
        const card = el(`<button class="card ${c.state === 'full' ? 'fullgame' : c.state}" data-i="${c.i}" aria-label="Level ${c.i + 1}, ${name}: ${label}"></button>`);
        if (c.state === 'full' || !defs[c.i]) card.appendChild(el(`<div class="blank"></div>`));
        else { const cv = el(`<canvas width="180" height="180"></canvas>`); card.appendChild(cv); G.drawThumb(cv, defs[c.i]); }
        card.appendChild(el(`<img class="frame" src="assets/ui/card.webp" alt="">`));
        card.appendChild(el(`<span class="num">${c.i + 1}</span>`));
        if (c.state === 'done') card.appendChild(el(`<img class="badge" src="assets/ui/badge-done.webp" alt="">`));
        if (c.state === 'locked') card.appendChild(el(`<img class="badge" src="assets/ui/badge-lock.webp" alt="">`));
        if (c.state === 'next') card.appendChild(el(`<span class="play">${svg('play')}</span>`));
        if (c.state === 'full') card.appendChild(el(`<span class="full">★ Full game</span>`));
        pg.appendChild(card);
      }
      track.appendChild(pg);
      if (pages > 1) dots.appendChild(el(`<button data-p="${p}" aria-label="Page ${p + 1}"></button>`));
    }
    hint('');
    const next = list.find(c => c.state === 'next');
    showPage(page != null ? page : next ? Math.floor(next.i / PER_PAGE) : 0);
  }
  function showPage(p) {
    const n = scr.levels.querySelectorAll('.page').length;
    levelPage = Math.max(0, Math.min(n - 1, p));
    scr.levels.querySelector('.track').style.transform = `translateX(${-100 * levelPage}%)`;
    scr.levels.querySelectorAll('.dots button').forEach((b, i) => b.classList.toggle('on', i === levelPage));
  }
  function hint(text) { scr.levels.querySelector('.hint').textContent = text; }
  function cardTap(i) {
    const c = PR.cards(G.ids(), G.edition(), G.save())[i];
    if (c.state === 'full') { open('full', { back: 'levels' }); return; }
    if (c.state === 'locked') { hint(`Finish level ${i} first`); return; }
    close(); G.play(i);
  }
  function setupSwipe() {
    const pagesEl = scr.levels.querySelector('.pages');
    let x0 = null, y0 = 0, moved = false;
    pagesEl.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; moved = false; });
    pagesEl.addEventListener('pointermove', e => { if (x0 != null && Math.abs(e.clientX - x0) > 12) moved = true; });
    pagesEl.addEventListener('pointerup', e => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) showPage(levelPage + (dx < 0 ? 1 : -1));
    });
    pagesEl.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }

  /* ---- settings ---- */
  function renderSettings() {
    const s = G.save().settings, rows = scr.settings.querySelector('.rows');
    rows.innerHTML = '';
    const toggle = (key, icon, label, sub, on) => rows.appendChild(el(`<div class="row">${svg(icon)}<span class="label">${label}${sub ? `<small>${sub}</small>` : ''}</span>
      <button class="toggle" role="switch" aria-checked="${on}" aria-label="${label}" data-key="${key}"></button></div>`));
    toggle('sound', 'sound', 'Sound', '', s.sound);
    if (G.canVibrate()) toggle('vibration', 'vibrate', 'Vibration', '', s.vibration);
    if (G.canFullscreen()) toggle('fullscreen', 'fullscreen', 'Full screen', '', s.fullscreen);
    toggle('speed', 'snail', 'Slower game', 'More time for tricky jumps', s.speed === 'slow');
    rows.appendChild(holdRow('reset', 'reset', 'Reset progress', 'Hold to start over', () => {
      G.update(sv => PR.resetProgress(sv)); flash(rows.lastElementChild, 'Progress cleared');
    }));
    if (G.isApp()) rows.appendChild(holdRow('restore', 'restore', 'Restore purchase', 'Ask a grown-up', () => {
      G.restorePurchase().then(msg => flash(rows.lastElementChild, msg));
    }));
  }
  function toggleSetting(key) {
    G.update(sv => {
      const st = Object.assign({}, sv.settings);
      if (key === 'speed') st.speed = st.speed === 'slow' ? 'normal' : 'slow';
      else st[key] = !st[key];
      return Object.assign({}, sv, { settings: st });
    });
    if (key === 'fullscreen') G.applyFullscreen();
    renderSettings();
  }
  // A row whose button must be held for 2.5 seconds (so a child can't do it by accident)
  function holdRow(key, icon, label, sub, done) {
    const row = el(`<div class="row">${svg(icon)}<span class="label">${label}<small>${sub}</small></span></div>`);
    const b = el(`<button class="toggle" style="background:none;width:auto;margin-right:-12px" aria-label="${label}: hold"><span class="btn small" style="width:96px;height:40px;margin:0;border-width:16px;border-image-width:16px 32px 16px 32px;font-size:15px;color:#3a2550"><span class="fill"></span><span style="margin-left:-2px;position:relative">Hold</span></span></button>`);
    row.appendChild(b);
    holdButton(b, 2500, b.querySelector('.fill'), done);
    return row;
  }
  function holdButton(b, ms, fill, done) {
    let t0 = 0, raf = 0;
    const stop = () => { cancelAnimationFrame(raf); t0 = 0; if (fill) fill.style.width = '0'; };
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      if (fill) fill.style.width = `calc(${k * 100}% + 40px)`;
      if (k >= 1) { stop(); done(); return; }
      raf = requestAnimationFrame(tick);
    };
    b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); tick(); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
    b.addEventListener('click', e => e.stopPropagation());
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done(); } });
  }
  function flash(row, text) {
    const small = row.querySelector('small'); if (!small) return;
    const was = small.textContent; small.textContent = text;
    setTimeout(() => { small.textContent = was; }, 2200);
  }

  /* ---- how to play: three little animated scenes ---- */
  function startTips() {
    stopTips();
    const cvs = [...scr.howto.querySelectorAll('canvas[data-tip]')];
    const t0 = performance.now();
    const loop = now => { for (const c of cvs) G.drawTip(c, c.dataset.tip, (now - t0) / 1000); tipsRAF = requestAnimationFrame(loop); };
    tipsRAF = requestAnimationFrame(loop);
  }
  function stopTips() { cancelAnimationFrame(tipsRAF); tipsRAF = 0; }

  /* ---- full game ---- */
  function renderFull() {
    const ids = G.ids(), ed = G.edition(), s = G.save(), defs = G.defs();
    const n = PR.total(ids, ed), lim = PR.limit(ed, n, s);
    const pitch = scr.full.querySelector('.pitch'), buy = scr.full.querySelector('.buy');
    pitch.innerHTML = `<h2>${n - lim} more levels</h2><p>Crates, buttons, hatches and floating together: harder puzzles to solve as a team.</p>`;
    const later = defs.slice(lim).filter(Boolean);
    if (later.length) {
      const shots = el(`<div class="shots"></div>`);
      for (const d of [later[1], later[Math.floor(later.length / 2)], later[later.length - 1]].filter(Boolean)) {
        const cv = el(`<canvas width="160" height="160"></canvas>`); shots.appendChild(cv); G.drawThumb(cv, d);
      }
      pitch.appendChild(shots);
    }
    buy.innerHTML = '';
    if (lim >= n) { pitch.appendChild(el(`<p>You have the full game. Enjoy!</p>`)); return; }
    if (G.isApp()) {
      const b = el(`<button class="btn">${svg('unlock')}<span class="fill"></span><span class="label">Unlock: hold</span></button>`);
      buy.appendChild(b);
      buy.appendChild(el(`<p class="hint" style="color:#fff">Ask a grown-up to hold the button</p>`));
      holdButton(b, 2500, b.querySelector('.fill'), () => {
        G.buy().then(ok => { if (ok) { open('home'); } });
      });
      pitch.appendChild(el(`<p class="note">${G.priceNote()}</p>`));
    } else {
      pitch.appendChild(el(`<p>The full game is coming soon to Android and iPhone.</p>`));
      pitch.appendChild(el(`<p class="note">Your progress here stays on this device.</p>`));
    }
  }

  window.UpsideMenu = { init, open, close, isOpen, pause, back, get current() { return current; } };
})();
