/* Upside: the menus, laid out like the painted designs in art/menu/. Main menu, Levels, How to Play,
   Credits, Full game, Level complete, and the pause panel.
   Plain DOM over the game's canvas; the game (index.html) passes in what the menus need with UpsideMenu.init(game).
   The menus face the bottom of the phone (Black's side): one person holds the phone to choose. The pause panel
   faces whoever pressed their menu button. */
(function () {
  'use strict';
  const PR = window.UpsideProgress;
  const VERSION = 'v1.0';
  const ICON = {
    play: 'M6 3.5v17l14-8.5z',
    levels: 'M2 5a2.2 2.2 0 104.4 0A2.2 2.2 0 002 5zm0 7a2.2 2.2 0 104.4 0A2.2 2.2 0 002 12zm0 7a2.2 2.2 0 104.4 0A2.2 2.2 0 002 19zM9 3h13v4H9zm0 7h13v4H9zm0 7h13v4H9z',
    settings: 'M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm9.4 5.1l-2.1-.3a7.6 7.6 0 01-.7 1.7l1.3 1.7-2.4 2.4-1.7-1.3c-.5.3-1.1.6-1.7.7l-.3 2.1h-3.4l-.3-2.1a7.6 7.6 0 01-1.7-.7l-1.7 1.3-2.4-2.4 1.3-1.7a7.6 7.6 0 01-.7-1.7l-2.1-.3v-3.4l2.1-.3c.2-.6.4-1.2.7-1.7L3.8 5.7l2.4-2.4 1.7 1.3c.5-.3 1.1-.6 1.7-.7l.3-2.1h3.4l.3 2.1c.6.2 1.2.4 1.7.7l1.7-1.3 2.4 2.4-1.3 1.7c.3.5.6 1.1.7 1.7l2.1.3z',
    book: 'M2 4.5C4.6 3.4 8 3.6 11 5.4V20c-3-1.6-6.3-1.8-9-.8zm20 0c-2.6-1.1-6-.9-9 .9V20c3-1.6 6.3-1.8 9-.8z',
    star: 'M12 1.5l2.6 7.1 7.4.3-5.8 4.7 2 7.3L12 16.8l-6.2 4.1 2-7.3L2 8.9l7.4-.3z',
    sound: 'M3 9h4l5-5v16l-5-5H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z',
    vibrate: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm0 3v14h8V5zM2 8h2v8H2zm18 0h2v8h-2z',
    fullscreen: 'M3 3h7v2.5H5.5V10H3zm11 0h7v7h-2.5V5.5H14zM3 14h2.5v4.5H10V21H3zm15.5 0H21v7h-7v-2.5h4.5z',
    snail: 'M14 6a6 6 0 016 6c0 2.4-1.4 4.4-3.4 5.4H22V20H5a3 3 0 01-3-3v-1.5l2-.5V10l-1.6-3.3 1.8-.9L5.5 8h.8l1.3-2.7 1.8.9L8 9.3v5.2l.7-.2A6 6 0 0114 6zm0 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
    trash: 'M9 2h6l1 2h5v2.5H3V4h5zM5 8h14l-1.2 13.2A2 2 0 0115.8 23H8.2a2 2 0 01-2-1.8zm4 3v9h2v-9zm4 0v9h2v-9z',
    restore: 'M13 3a9 9 0 00-9 9H1l4 4 4-4H6.5a6.5 6.5 0 112 4.6l-1.8 1.8A9 9 0 1013 3zm-1 5v5l4.3 2.5 1-1.6-3.3-2V8z',
    check: 'M9.5 16.6L4.4 11.5l-2 2 7.1 7.1L22 8.1l-2-2z',
    home: 'M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z',
    restart: 'M12 4a8 8 0 11-7.7 10h2.6A5.5 5.5 0 1012 6.5V10L7 5l5-5z',
    unlock: 'M7 10V7a5 5 0 019.6-2l-2.2 1A2.6 2.6 0 009.5 7v3H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2zm5 4a2 2 0 00-1 3.7V19h2v-1.3A2 2 0 0012 14z',
    person: 'M12 2.5a4.8 4.8 0 110 9.6 4.8 4.8 0 010-9.6zM3 21.5c0-4.6 4-7.5 9-7.5s9 2.9 9 7.5z',
    quit: 'M4 3h10v4h-2.4V5.4H6.4v13.2h5.2V17H14v4H4zm11.5 4.5L21 12l-5.5 4.5V13.3H9v-2.6h6.5z',
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;
  const LOCK = `<svg class="lock" viewBox="0 0 64 70" aria-hidden="true"><path d="M18 30V20a14 14 0 0128 0v10" fill="none" stroke="#3a2550" stroke-width="9"/><path d="M18 30V20a14 14 0 0128 0v10" fill="none" stroke="#fff6ec" stroke-width="3.5"/><rect x="7" y="28" width="50" height="38" rx="10" fill="#fff6ec" stroke="#3a2550" stroke-width="5"/><circle cx="32" cy="44" r="5.5" fill="#3a2550"/><rect x="29.5" y="46" width="5" height="10" rx="2.5" fill="#3a2550"/></svg>`;
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const btn = (go, icon, label, cls = '') => `<button class="btn ${cls}" ${go}>${icon ? `<span class="ic">${svg(icon)}</span><span class="div"></span>` : ''}<span class="label">${label}</span></button>`;
  const crest = (title, cls = 'small') => `<div class="crest ${cls}"><img src="assets/ui/crest.webp" alt=""><div class="title">${title}</div></div>`;

  let G = null, root = null, pauseEl = null, toastEl = null, current = null, opts = {}, levelPage = 0, selected = null, tipsRAF = 0, pausePid = 1;
  const scr = {};

  function init(game) {
    G = game;
    root = el(`<div class="menu" id="menu" aria-hidden="true"></div>`);
    scr.home = el(`<section class="screen" data-screen="home" aria-label="Main menu">
      <button class="round l sound" data-sound aria-label="Sound"></button>
      ${crest('Floating Garden', 'sub')}
      <div class="grow"></div>
      ${btn('data-go="play"', 'play', 'Play')}
      ${btn('data-go="levels"', 'levels', 'Levels')}
      ${btn('data-go="howto"', 'book', 'How to Play')}
      <div class="grow"></div>
      <div class="pills">
        <button class="pill" data-go="credits">${svg('person')}<span>Credits</span></button>
        <button class="pill" data-go="full" hidden>${svg('star')}<span>Full game</span></button>
        <button class="pill" data-quit hidden>${svg('quit')}<span>Quit</span></button>
      </div>
    </section>`);
    scr.levels = el(`<section class="screen" data-screen="levels" aria-label="Select level">
      <button class="round l back" data-back aria-label="Back"></button>
      <button class="round r home" data-home aria-label="Home"></button>
      ${crest('Select Level')}
      <div class="pages"><div class="track"></div></div>
      <div class="dots"></div>
      <div class="grow"></div>
      ${btn('data-play-selected', 'play', 'Play Selected', 'wide')}
    </section>`);
    scr.howto = el(`<section class="screen" data-screen="howto" aria-label="How to Play">
      <button class="round l back" data-back aria-label="Back"></button>
      ${crest('How to Play')}
      <div class="tips">
        ${[['move', 'Move'], ['jump', 'Jump'], ['plates', 'Plates &amp; Doors'], ['exits', 'Reach Both Exits']].map(([k, t]) =>
          `<div class="tip"><canvas data-tip="${k}" width="388" height="306" role="img" aria-label="${t}"></canvas><img src="assets/ui/tip-card.webp" alt=""><div class="tab">${t}</div></div>`).join('')}
      </div>
      <div class="grow"></div>
      ${btn('data-howto-done', '', 'Got It!')}
    </section>`);
    scr.credits = el(`<section class="screen" data-screen="credits" aria-label="Credits">
      <button class="round l back" data-back aria-label="Back"></button>
      ${crest('Credits')}
      <div class="panel">
        <h2>Upside</h2>
        <p>A puzzle game for two friends<br>and one phone.</p>
        <p><b>Made by</b> yeger00</p>
        <p><b>Font</b> Fredoka, by Milena Brandão<br><span class="note">SIL Open Font License</span></p>
        <p class="note">${VERSION}</p>
      </div>
      <div class="grow"></div>
      ${btn('data-back', 'check', 'Done')}
    </section>`);
    scr.full = el(`<section class="screen" data-screen="full" aria-label="Full game">
      <button class="round l back" data-back aria-label="Back"></button>
      ${crest('Full Game')}
      <div class="panel pitch"></div>
      <div class="grow"></div>
      <div class="buy"></div>
      <div class="grow"></div>
    </section>`);
    scr.complete = el(`<section class="screen" data-screen="complete" aria-label="Level complete">
      <div class="crest sub" style="--crest:0.42"><img src="assets/ui/crest.webp" alt=""><div class="title">Floating Garden</div></div>
      <div class="grow"></div>
      <div class="hero" style="width:calc(600 * var(--k))"><img src="assets/ui/complete-hero.webp" alt="Level complete!"></div>
      <div class="donecard" style="width:calc(580 * var(--k))"><img src="assets/ui/complete-card.webp" alt=""><div class="tab"></div><div class="big"></div><div class="small"></div></div>
      <div style="height:calc(40 * var(--k))"></div>
      ${btn('data-complete="next"', 'play', 'Next Level')}
      <div class="grow"></div>
    </section>`);
    for (const s of Object.values(scr)) root.appendChild(s);
    document.body.appendChild(root);

    pauseEl = el(`<div class="pause" id="pause" aria-hidden="true" role="dialog" aria-label="Paused">
      <div class="panel2"><img src="assets/ui/pause-panel.webp" alt="">
        <div class="ptitle">Paused</div>
        <button class="close" data-pause="resume" aria-label="Close"></button>
        <div class="pbtns">
          ${btn('data-pause="resume"', 'play', 'Resume')}
          ${btn('data-pause="restart"', 'restart', 'Restart')}
          ${btn('data-pause="home"', 'home', 'Home')}
        </div>
      </div></div>`);
    document.body.appendChild(pauseEl);
    toastEl = el(`<div class="toast" aria-live="polite"></div>`);
    document.body.appendChild(toastEl);

    root.addEventListener('click', onClick);
    pauseEl.addEventListener('click', e => {
      const b = e.target.closest('[data-pause]'); if (!b) return;
      G.click();
      const what = b.dataset.pause;
      pause(false); G.pauseAction(what);
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
    if (name === 'howto') startTips(); else stopTips();
    if (name === 'full') renderFull();
    if (name === 'complete') renderComplete();
    const first = scr[name].querySelector('.btn, .card, .round');
    if (first && document.activeElement && document.activeElement !== document.body && document.activeElement.tagName !== 'CANVAS') first.focus({ preventScroll: true });
  }
  function close() {
    current = null; stopTips();
    if (root) { root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); }
  }
  // Back (Android's back button, the browser's, Esc): one step back. false on the main menu (the game decides).
  function back() {
    if (!current) return false;
    if (current === 'home') return false;
    G.click();
    if (current === 'complete') { open('levels'); return true; }
    open(opts.back && scr[opts.back] ? opts.back : 'home', opts.back === 'levels' ? { page: levelPage } : undefined);
    return true;
  }
  function pause(on, pid) {
    if (pid) pausePid = pid;
    pauseEl.classList.toggle('open', !!on);
    pauseEl.setAttribute('aria-hidden', on ? 'false' : 'true');
    pauseEl.querySelector('.panel2').classList.toggle('white', pausePid === 2);
  }
  function isPauseOpen() { return pauseEl.classList.contains('open'); }
  let toastT = 0;
  function toast(text) {
    toastEl.textContent = text; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }

  function onClick(e) {
    const t = e.target;
    if (t.closest('[data-back]')) { back(); return; }
    if (t.closest('[data-home]')) { G.click(); open('home'); return; }
    if (t.closest('[data-sound]')) { G.click(); toggleSetting('sound'); renderHome(); return; }
    if (t.closest('[data-quit]')) { G.click(); G.quit(); return; }
    const go = t.closest('[data-go]');
    if (go) {
      G.click();
      const where = go.dataset.go;
      if (where === 'play') playNext();
      else open(where, where === 'full' ? { back: 'home' } : undefined);
      return;
    }
    if (t.closest('[data-howto-done]')) {
      G.click();
      G.update(s => Object.assign({}, s, { seenHowTo: true }));
      if (opts.thenPlay != null) { const i = opts.thenPlay; close(); G.play(i); }
      else open('home');
      return;
    }
    if (t.closest('[data-play-selected]')) { G.click(); playSelected(); return; }
    const done = t.closest('[data-complete]');
    if (done) { G.click(); G.completeAction(done.dataset.complete); return; }
    const card = t.closest('.card');
    if (card) { G.click(); cardTap(+card.dataset.i); return; }
    const dot = t.closest('.dots button');
    if (dot) { G.click(); showPage(+dot.dataset.p); return; }
  }

  /* ---- home ---- */
  function fullGameLocked() { const ids = G.ids(), ed = G.edition(); return PR.limit(ed, PR.total(ids, ed), G.save()) < PR.total(ids, ed); }
  function renderHome() {
    scr.home.querySelector('[data-go="full"]').hidden = !fullGameLocked();
    scr.home.querySelector('[data-quit]').hidden = !G.canQuit();
    scr.home.querySelector('[data-sound]').classList.toggle('off', !G.save().settings.sound);
  }
  // Play: the level you should be on next; with nothing left to play, the Levels screen (or the full game).
  function playNext() {
    const i = PR.playIndex(G.ids(), G.edition(), G.save());
    if (i == null) { open(fullGameLocked() ? 'full' : 'levels', { back: 'home' }); return; }
    if (!G.save().seenHowTo) { open('howto', { thenPlay: i }); return; }
    close(); G.play(i);
  }

  /* ---- levels ---- */
  const PER_PAGE = 7;
  function cardsNow() { return PR.cards(G.ids(), G.edition(), G.save()); }
  function renderLevels(page) {
    const list = cardsNow(), defs = G.defs();
    const track = scr.levels.querySelector('.track'), dots = scr.levels.querySelector('.dots');
    track.innerHTML = ''; dots.innerHTML = '';
    if (selected == null || !list[selected] || !['done', 'next', 'open'].includes(list[selected].state)) {
      const nx = list.find(c => c.state === 'next') || list.filter(c => c.state === 'done').pop() || list[0];
      selected = nx ? nx.i : 0;
    }
    const pages = Math.ceil(list.length / PER_PAGE);
    for (let p = 0; p < pages; p++) {
      const pg = el(`<div class="page"></div>`);
      const items = list.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
      for (const line of [items.slice(0, 3), items.slice(3, 6), items.slice(6)]) {
        if (!line.length) continue;
        const ln = el(`<div class="line"></div>`);
        for (const c of line) ln.appendChild(makeCard(c, defs));
        pg.appendChild(ln);
      }
      track.appendChild(pg);
      if (pages > 1) dots.appendChild(el(`<button data-p="${p}" aria-label="Page ${p + 1}"></button>`));
    }
    dots.hidden = pages < 2;
    showPage(page != null ? page : Math.floor(selected / PER_PAGE));
  }
  function makeCard(c, defs) {
    const name = c.id && defs[c.i] ? defs[c.i].name : 'Full game';
    const label = { done: 'finished', next: 'play next', open: 'open', locked: 'locked', full: 'in the full game' }[c.state];
    const cls = c.state === 'full' ? 'fullgame' : c.state;
    const card = el(`<button class="card ${cls}${c.i === selected ? ' sel' : ''}" data-i="${c.i}" aria-label="Level ${c.i + 1}, ${name}: ${label}"></button>`);
    card.appendChild(el(`<img class="pic${Math.floor(c.i / 3) % 2 ? ' flip' : ''}" src="assets/ui/card-${(c.i % 3) + 1}.webp" alt="">`));
    const plaque = c.i === selected ? 'gold' : c.state === 'done' ? 'done' : (c.state === 'locked' || c.state === 'full') ? 'locked' : null;
    if (plaque) card.appendChild(el(`<img class="plq" src="assets/ui/plaque-${plaque}.webp" alt="">`));
    card.appendChild(el(`<span class="num">${c.i + 1}</span>`));
    if (c.state === 'done') { card.appendChild(el(`<img class="star" src="assets/ui/star.webp" alt="">`)); card.appendChild(el(`<img class="check" src="assets/ui/check.webp" alt="">`)); }
    if (c.state === 'locked') card.appendChild(el(LOCK));
    if (c.state === 'full') card.appendChild(el(`<span class="tag">★ Full game</span>`));
    return card;
  }
  function showPage(p) {
    const n = scr.levels.querySelectorAll('.page').length;
    levelPage = Math.max(0, Math.min(n - 1, p));
    scr.levels.querySelector('.track').style.transform = `translateX(${-100 * levelPage}%)`;
    scr.levels.querySelectorAll('.dots button').forEach((b, i) => b.classList.toggle('on', i === levelPage));
  }
  function cardTap(i) {
    const c = cardsNow()[i];
    if (c.state === 'full') { open('full', { back: 'levels' }); return; }
    if (c.state === 'locked') return;
    if (selected === i) { close(); G.play(i); return; }         // a second tap plays it
    selected = i; renderLevels(levelPage);
  }
  function playSelected() {
    const c = cardsNow()[selected];
    if (!c || c.state === 'locked' || c.state === 'full') return;
    close(); G.play(selected);
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

  /* ---- sound (the main menu's corner button) and hold-to-confirm buttons ---- */
  function toggleSetting(key) {
    G.update(sv => {
      const st = Object.assign({}, sv.settings);
      if (key === 'speed') st.speed = st.speed === 'slow' ? 'normal' : 'slow';
      else st[key] = !st[key];
      return Object.assign({}, sv, { settings: st });
    });
    if (key === 'fullscreen') G.applyFullscreen();
  }
  // A button that must be held for 2.5 seconds (so a child can't do it by accident): the full game's Unlock
  function holdButton(b, ms, fill, done) {
    let t0 = 0, raf = 0;
    const stop = () => { cancelAnimationFrame(raf); t0 = 0; if (fill) fill.style.width = '0'; };
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      if (fill) fill.style.width = `${k * 88}%`;
      if (k >= 1) { stop(); done(); return; }
      raf = requestAnimationFrame(tick);
    };
    b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); tick(); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
    b.addEventListener('click', e => e.stopPropagation());
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done(); } });
  }
  /* ---- how to play: four little animated scenes ---- */
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
    pitch.innerHTML = `<h2>${n - lim} more levels</h2><p>Crates, buttons, hatches and floating together: bigger puzzles to solve as a team.</p>`;
    const later = defs.slice(lim).filter(Boolean);
    if (later.length) {
      const shots = el(`<div class="shots"></div>`);
      for (const d of [later[1], later[Math.floor(later.length / 2)], later[later.length - 1]].filter(Boolean)) {
        const cv = el(`<canvas width="200" height="200"></canvas>`); shots.appendChild(cv); G.drawThumb(cv, d);
      }
      pitch.appendChild(shots);
    }
    buy.innerHTML = '';
    if (lim >= n) { pitch.appendChild(el(`<p>You have the full game. Enjoy!</p>`)); return; }
    if (G.isApp()) {
      const b = el(`<button class="btn" data-unlock><span class="fill"></span><span class="ic">${svg('unlock')}</span><span class="div"></span><span class="label">Unlock</span></button>`);
      buy.appendChild(b);
      buy.appendChild(el(`<div class="under">Ask a grown-up to hold the button</div>`));
      holdButton(b, 2500, b.querySelector('.fill'), () => { G.buy().then(ok => { if (ok) open('home'); }); });
      pitch.appendChild(el(`<p class="note">${G.priceNote()}</p>`));
    } else {
      pitch.appendChild(el(`<p><b>Coming soon</b> to Android and iPhone.</p>`));
      pitch.appendChild(el(`<p class="note">Your progress here stays on this device.</p>`));
    }
  }

  /* ---- level complete ---- */
  function renderComplete() {
    const i = opts.level || 0, defs = G.defs();
    const after = PR.afterWin(G.ids(), G.edition(), G.save(), i);
    scr.complete.querySelector('.donecard .tab').textContent = `Level ${i + 1}`;
    scr.complete.querySelector('.donecard .big').textContent = after.end ? 'You did them all!' : 'Great teamwork!';
    scr.complete.querySelector('.donecard .small').textContent = defs[i] ? defs[i].name : '';
    const next = scr.complete.querySelector('[data-complete="next"]');
    next.querySelector('.label').textContent = after.next != null ? 'Next Level' : after.fullGame ? 'Full Game' : 'Home';
    next.querySelector('.ic').innerHTML = svg(after.next != null ? 'play' : after.fullGame ? 'star' : 'home');
  }

  // Load the main menu's pictures and font before it is first shown, so it never appears half-drawn
  // (a plain blue screen with bare words). Gives up after `ms`, so a missing file can't stop the game.
  const PRELOAD = ['bg', 'crest', 'plate', 'plate-pressed', 'pill', 'round-sound', 'card-1', 'card-2', 'card-3', 'plaque-gold', 'plaque-locked', 'plaque-done'];
  function preload(ms = 2500) {
    const pics = PRELOAD.map(n => new Promise(done => {
      const img = new Image(); img.onload = img.onerror = () => done(); img.src = `assets/ui/${n}.webp`;
      if (img.decode) img.decode().then(done, done);
    }));
    let font = Promise.resolve();
    try { if (document.fonts && document.fonts.load) font = document.fonts.load('700 20px "Fredoka"').catch(() => {}); } catch (e) {}
    const limit = new Promise(done => setTimeout(done, ms));
    return Promise.race([Promise.all([...pics, font]), limit]);
  }

  window.UpsideMenu = { init, open, close, isOpen, isPauseOpen, pause, back, toast, preload, get current() { return current; }, get selected() { return selected; } };
})();
