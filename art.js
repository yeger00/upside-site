/* Upside art: the one look shared by the game and the editor ("floating garden ruins").
 *
 * The look comes from the design reference (art/reference.png): art/extract.py cuts each object out of it into
 * one sprite atlas (assets/sprites.webp) and paints the objects out of its level window to make the sky
 * (assets/sky.webp). SPRITES below says where each sprite sits. Until the images have loaded (and in Node),
 * every function falls back to a drawing in code of the same object.
 *
 * Pure drawing, no state: every function takes a 2D canvas context and sizes in pixels.
 * The rule that keeps levels readable: anything you can touch has a dark outline; the scenery
 * behind it (sky, clouds, far ruins) never does.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UpsideArt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const P = {
    sky: '#87D5FF', skyTop: '#4FA5EA', skyLow: '#A9E2FF', cloud: '#F5FBFF',
    grass: '#88D26A', leaf: '#3FA87A', pink: '#F7A8C8',
    stone: '#B9A8D6', wall: '#A594CE', wallDim: '#8E7DB9', darkStone: '#6C5B8F', deepStone: '#57487A',
    accent: '#FFD27A', glow: '#FFE89A', light: '#FFF6F0', dark: '#2D2340',
    cyan: '#59E7E2', cyanLit: '#B8FBF8', outline: '#3A2B5A', door: '#EADCF0',
    thorn: '#4A2F63', thornTip: '#FF8FB3', stage: '#231A36',
    bandLight: '#C4B5E2', bandDark: '#3A2F63'
  };

  /* ---------- helpers ---------- */
  function rr(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  // a steady "random" number from 0 to 1 for a tile, so decorations never flicker or move
  function hash(x, y, k) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  function mix(a, b, k) {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
  }
  function star4(g, cx, cy, r, color) {      // a four-point sparkle
    g.fillStyle = color; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rad = i % 2 ? r * 0.36 : r; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    g.closePath(); g.fill();
  }
  function symbol(g, kind, cx, cy, r, fill, stroke) {
    g.beginPath();
    if (kind === 'circle') g.arc(cx, cy, r, 0, Math.PI * 2);
    else if (kind === 'triangle') { g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.95, cy + r * 0.75); g.lineTo(cx - r * 0.95, cy + r * 0.75); g.closePath(); }
    else if (kind === 'square') g.rect(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
    else { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); }
    g.fillStyle = fill; g.fill();
    if (stroke) { g.lineJoin = 'round'; g.lineWidth = Math.max(1, r * 0.3); g.strokeStyle = stroke; g.stroke(); }
  }

  /* ---------- scenery ---------- */
  // The sky behind a level: soft clouds, far ruins and blossom trees. `seed` varies it from level to level.
  function vSky(g, x, y, w, h, seed) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, P.skyTop); gr.addColorStop(0.55, P.sky); gr.addColorStop(1, P.skyLow);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    const u = Math.min(w, h), R = k => hash(seed, k, 5);
    for (let i = 0; i < 5; i++) {              // far ruins: pale columns along the bottom
      const cw = u * (0.05 + 0.05 * R(i * 7 + 1)), ch = h * (0.1 + 0.22 * R(i * 7 + 2)), cx = x + w * R(i * 7 + 3);
      g.fillStyle = 'rgba(96,140,214,0.28)';
      rr(g, cx, y + h - ch, cw, ch + 8, cw * 0.2); g.fill();
      g.fillRect(cx - cw * 0.2, y + h - ch, cw * 1.4, cw * 0.28);
    }
    for (let i = 0; i < 2; i++) {              // blossom trees
      const cx = x + w * (0.12 + 0.76 * R(40 + i)), cy = y + h * (0.5 + 0.38 * R(50 + i)), r = u * (0.07 + 0.04 * R(60 + i));
      g.fillStyle = 'rgba(120,98,160,0.22)'; g.fillRect(cx - r * 0.12, cy, r * 0.24, r * 1.7);
      g.fillStyle = 'rgba(247,168,200,0.36)';
      for (const [dx, dy, k] of [[0, 0, 1], [-0.7, 0.25, 0.75], [0.7, 0.2, 0.8], [0.1, -0.55, 0.7]]) { g.beginPath(); g.arc(cx + dx * r, cy + dy * r, r * k, 0, Math.PI * 2); g.fill(); }
    }
    for (let i = 0; i < 6; i++) {              // clouds
      const cx = x + w * R(100 + i), cy = y + h * (0.06 + 0.86 * R(110 + i)), r = u * (0.035 + 0.04 * R(120 + i));
      g.fillStyle = 'rgba(245,251,255,0.62)';
      for (const [dx, dy, k] of [[0, 0, 1], [-1.1, 0.25, 0.7], [1.1, 0.2, 0.8], [0.35, -0.5, 0.75]]) { g.beginPath(); g.arc(cx + dx * r, cy + dy * r, r * k, 0, Math.PI * 2); g.fill(); }
      g.fillRect(cx - r * 1.6, cy + r * 0.2, r * 3.3, r * 0.75);
    }
  }
  // Dark stone bricks: everything around a level. (ox, oy) lines the bricks up with the level's tiles.
  function vStone(g, x, y, w, h, ts, ox, oy) {
    g.fillStyle = P.darkStone; g.fillRect(x, y, w, h);
    const lw = Math.max(1, ts * 0.05), x0 = Math.floor((x - ox) / ts) - 1, y0 = Math.floor((y - oy) / ts) - 1;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let ty = y0; oy + ty * ts < y + h; ty++) for (let tx = x0; ox + tx * ts < x + w; tx++) {
      const px = ox + tx * ts, py = oy + ty * ts;
      if (hash(tx, ty, 9) < 0.3) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(px, py, ts / 2, ts / 2); }
      if (hash(tx, ty, 8) < 0.3) { g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(px, py + ts / 2, ts, ts / 2); }
      g.fillStyle = P.deepStone;
      g.fillRect(px, py, ts, lw); g.fillRect(px, py + ts / 2, ts, lw);
      g.fillRect(px + ts / 2, py, lw, ts / 2); g.fillRect(px, py + ts / 2, lw, ts / 2);
    }
    g.restore();
  }

  /* ---------- tiles ---------- */
  // One wall tile at tile (o.tx, o.ty). o.up / down / left / right: is that neighbour open (not a wall)?
  // o.grass / o.vines: may this tile grow grass on top / leaves underneath? o.dim: the level's fixed outer edge.
  function vWall(g, x, y, ts, o) {
    const tx = o.tx, ty = o.ty, face = o.dim ? P.wallDim : P.wall, h2 = ts / 2, lw = Math.max(1, ts * 0.05);
    const tint = (i, j, k) => mix(face, hash(i, j, k) < 0.5 ? '#FFFFFF' : P.darkStone, 0.02 + 0.1 * hash(i, j, k + 1));
    g.fillStyle = tint(tx * 2, ty, 1); g.fillRect(x, y, h2 + 0.5, h2 + 0.5);                 // top row: two bricks
    g.fillStyle = tint(tx * 2 + 1, ty, 1); g.fillRect(x + h2, y, h2 + 0.5, h2 + 0.5);
    g.fillStyle = tint(tx, ty, 3); g.fillRect(x, y + h2, h2 + 0.5, h2 + 0.5);                 // bottom row: bricks shared with the neighbours
    g.fillStyle = tint(tx + 1, ty, 3); g.fillRect(x + h2, y + h2, h2 + 0.5, h2 + 0.5);
    g.fillStyle = 'rgba(108,91,143,0.55)';                                                    // mortar
    g.fillRect(x, y, ts, lw); g.fillRect(x, y + h2, ts, lw);
    g.fillRect(x + h2, y, lw, h2); g.fillRect(x, y + h2, lw, h2);
    const e = Math.max(1.5, ts * 0.075);
    g.fillStyle = P.outline;
    if (o.left) g.fillRect(x, y, e, ts);
    if (o.right) g.fillRect(x + ts - e, y, e, ts);
    if (o.down) g.fillRect(x, y + ts - e, ts, e);
    if (o.up) g.fillRect(x, y, ts, e);
    if (o.down && o.vines && hash(tx, ty, 20) < 0.75) {                                       // leaves hanging underneath
      const n = 2 + Math.floor(hash(tx, ty, 21) * 2);
      for (let k = 0; k < n; k++) {
        const cx = x + ts * (0.18 + 0.64 * hash(tx, ty, 22 + k)), r = ts * (0.09 + 0.05 * hash(tx, ty, 26 + k));
        g.fillStyle = k % 2 ? P.grass : P.leaf;
        g.beginPath(); g.ellipse(cx, y + ts - e * 0.2 + r * 0.5, r, r * 1.35, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (o.up && o.grass) {                                                                    // a grassy top
      const gh = ts * 0.2;
      g.fillStyle = P.leaf;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + ts * (k + 0.5) / 3, y + gh * 0.75, ts * 0.19, 0, Math.PI); g.fill(); }
      g.fillStyle = P.grass; g.fillRect(x, y - 0.5, ts + 0.5, gh * 0.75 + 0.5);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + ts * (k + 0.5) / 3, y + gh * 0.55, ts * 0.165, 0, Math.PI); g.fill(); }
      for (let k = 0; k < 2; k++) {                                                           // a couple of blades
        const bx = x + ts * (0.12 + 0.76 * hash(tx, ty, 30 + k)), bh = ts * (0.07 + 0.06 * hash(tx, ty, 32 + k));
        g.beginPath(); g.moveTo(bx - ts * 0.05, y + 1); g.lineTo(bx, y - bh); g.lineTo(bx + ts * 0.05, y + 1); g.closePath(); g.fill();
      }
      if (hash(tx, ty, 34) < 0.17) {                                                          // now and then, a flower
        const fx = x + ts * (0.25 + 0.5 * hash(tx, ty, 35)), fy = y + gh * 0.2, r = ts * 0.055;
        g.fillStyle = P.pink;
        for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4; g.beginPath(); g.arc(fx + Math.cos(a) * r * 1.1, fy + Math.sin(a) * r * 1.1, r, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = P.accent; g.beginPath(); g.arc(fx, fy, r * 0.8, 0, Math.PI * 2); g.fill();
      }
    }
  }
  // Thorns: dark spikes with pink tips, pointing up from a floor or down from a ceiling.
  function thorns(g, x, y, ts, up) {
    // In the reference's style: chunky pink spikes with a thick dark-purple outline, a soft shine on one side,
    // growing out of a little stone ledge. Drawn pointing up; a ceiling's thorns are the same, flipped.
    const ink = '#3C2B56', lw = Math.max(1.2, ts * 0.06);
    g.save();
    if (up) g.translate(x, y); else { g.translate(x, y + ts); g.scale(1, -1); }
    g.lineJoin = 'round'; g.lineCap = 'round';
    const spikes = [[0.2, 0.36, 0.3], [0.5, 0.24, 0.34], [0.8, 0.36, 0.3]];   // middle (u), tip height (v), width
    for (const [u, tip, w] of spikes) {
      const cx = u * ts, ty = tip * ts, by = ts * 0.86, hw = w * ts / 2;
      const path = () => {
        g.beginPath(); g.moveTo(cx - hw, by);
        g.quadraticCurveTo(cx - hw * 0.35, by - (by - ty) * 0.45, cx, ty);
        g.quadraticCurveTo(cx + hw * 0.35, by - (by - ty) * 0.45, cx + hw, by);
        g.closePath();
      };
      const gr = g.createLinearGradient(0, ty, 0, by);
      gr.addColorStop(0, '#FFE1EC'); gr.addColorStop(0.35, '#F79AC0'); gr.addColorStop(1, '#B0589E');
      path(); g.fillStyle = gr; g.fill();
      g.lineWidth = lw; g.strokeStyle = ink; g.stroke();
      g.beginPath(); g.moveTo(cx - hw * 0.5, by - ts * 0.04);                 // a shine down the left side
      g.quadraticCurveTo(cx - hw * 0.22, by - (by - ty) * 0.5, cx - hw * 0.04, ty + ts * 0.1);
      g.lineWidth = Math.max(1, ts * 0.035); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.stroke();
    }
    rr(g, ts * 0.02, ts * 0.8, ts * 0.96, ts * 0.2, ts * 0.07);                 // the stone ledge they grow from
    g.fillStyle = '#A594CE'; g.fill();
    g.lineWidth = lw; g.strokeStyle = ink; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(ts * 0.1, ts * 0.835, ts * 0.8, Math.max(1, ts * 0.03));
    g.fillStyle = 'rgba(60,43,86,0.45)'; g.fillRect(ts * 0.5, ts * 0.83, Math.max(1, ts * 0.03), ts * 0.14);
    g.restore();
  }
  // A pressure pad on the floor or ceiling of its tile: cyan, and glowing while something presses it.
  function vPlate(g, x, y, ts, side, pressed) {
    const th = Math.max(2, ts * (pressed ? 0.1 : 0.2)), w = ts * 0.84, px = x + ts * 0.08, py = side === 'floor' ? y + ts - th : y;
    if (pressed) { g.fillStyle = 'rgba(89,231,226,0.35)'; rr(g, px - ts * 0.1, py - ts * 0.1, w + ts * 0.2, th + ts * 0.2, ts * 0.16); g.fill(); }
    rr(g, px, py, w, th, ts * 0.07);
    g.fillStyle = pressed ? P.cyanLit : P.cyan; g.fill();
    g.lineWidth = Math.max(1, ts * 0.055); g.strokeStyle = P.outline; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(px + ts * 0.12, side === 'floor' ? py + th * 0.22 : py + th * 0.55, w - ts * 0.24, Math.max(1, th * 0.2));
  }
  // A door: a pale stone pillar. The caller draws its symbol.
  function vDoor(g, x, y, w, h, ts) {
    rr(g, x, y, w, h, ts * 0.16);
    g.fillStyle = P.door; g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + w * 0.12, y, w * 0.16, h);
    g.fillStyle = 'rgba(108,91,143,0.16)'; g.fillRect(x + w * 0.76, y, w * 0.24, h);
    g.restore();
    rr(g, x, y, w, h, ts * 0.16);
    g.lineWidth = Math.max(1.5, ts * 0.075); g.strokeStyle = P.outline; g.stroke();
  }
  // A goal portal: a stone arch with a golden doorway. Drawn around (0, 0) = the middle of its tile, standing on
  // the tile's bottom edge; the caller turns it upside down for the light player. active: its player is on it.
  function vPortal(g, ts, dark, active, t) {
    const w = ts * 0.9, h = ts * 0.98, base = ts / 2, top = base - h;
    const arch = (aw, ah) => { g.beginPath(); g.moveTo(-aw / 2, base); g.lineTo(-aw / 2, base - ah + aw / 2); g.arc(0, base - ah + aw / 2, aw / 2, Math.PI, 0); g.lineTo(aw / 2, base); g.closePath(); };
    if (active) {
      const gl = g.createRadialGradient(0, 0, 0, 0, 0, ts * 1.1);
      gl.addColorStop(0, 'rgba(255,232,154,0.75)'); gl.addColorStop(1, 'rgba(255,232,154,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(0, 0, ts * 1.1, 0, Math.PI * 2); g.fill();
    }
    arch(w, h);
    g.fillStyle = dark ? P.darkStone : '#DDD2EE'; g.fill();
    g.lineJoin = 'round'; g.lineWidth = Math.max(1.5, ts * 0.075); g.strokeStyle = P.outline; g.stroke();
    arch(w * 0.62, h * 0.82);
    const gr = g.createLinearGradient(0, top, 0, base);
    gr.addColorStop(0, active ? '#FFF7D6' : P.glow); gr.addColorStop(1, active ? P.glow : '#FFBE55');
    g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1, ts * 0.045); g.strokeStyle = P.outline; g.stroke();
    const pulse = active ? 1 + 0.18 * Math.sin(t * 9) : 1, cy = base - h * 0.42;
    star4(g, 0, cy, ts * 0.17 * pulse, '#FFFDF2');
    if (active) for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * Math.PI * 2 / 3; star4(g, Math.cos(a) * ts * 0.62, cy + Math.sin(a) * ts * 0.3, ts * 0.08, '#FFFDF2'); }
  }
  // A crate: dark crates fall down like the dark player, light crates fall up like the light player.
  function crate(g, x, y, s, dark) {
    const lw = Math.max(1.5, s * 0.075);
    if (dark) { rr(g, x - lw * 0.7, y - lw * 0.7, s + lw * 1.4, s + lw * 1.4, s * 0.2); g.fillStyle = 'rgba(255,246,240,0.8)'; g.fill(); }
    rr(g, x, y, s, s, s * 0.16);
    g.fillStyle = dark ? '#3B2E58' : P.light; g.fill();
    g.lineWidth = lw; g.strokeStyle = P.outline; g.stroke();
    g.strokeStyle = dark ? '#7767A3' : '#D3C1DF'; g.lineWidth = Math.max(1, s * 0.07); g.lineCap = 'round';
    const i = s * 0.24;
    rr(g, x + s * 0.13, y + s * 0.13, s * 0.74, s * 0.74, s * 0.1); g.stroke();
    g.beginPath(); g.moveTo(x + i, y + i); g.lineTo(x + s - i, y + s - i); g.moveTo(x + s - i, y + i); g.lineTo(x + i, y + s - i); g.stroke();
  }
  // A player, drawn around (0, 0) with the head up. look: { facing: -1 | 0 | 1, blink: 0..1,
  // mood: 'idle' | 'happy' (jumping, celebrating: ^ ^) | 'squint' (falling, landing: > <) }
  function vCharacter(g, w, h, dark, look) {
    look = look || {};
    const r = Math.min(w, h) * 0.34, lw = Math.max(1.5, w * 0.1);
    if (dark) { rr(g, -w / 2 - lw * 0.8, -h / 2 - lw * 0.8, w + lw * 1.6, h + lw * 1.6, r + lw * 0.8); g.fillStyle = 'rgba(255,246,240,0.85)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, r);
    g.fillStyle = dark ? P.dark : P.light; g.fill();
    g.lineWidth = lw; g.strokeStyle = P.outline; g.stroke();
    g.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)';                  // a soft shine
    g.beginPath(); g.ellipse(-w * 0.2, -h * 0.3, w * 0.13, h * 0.06, -0.5, 0, Math.PI * 2); g.fill();
    const ink = dark ? P.light : P.dark, ex = (look.facing || 0) * w * 0.1, ey = -h * 0.1, a = w * 0.1;
    g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = Math.max(1.5, w * 0.075); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of [-1, 1]) {
      const cx = ex + s * w * 0.19;
      g.beginPath();
      if (look.mood === 'happy') { g.moveTo(cx - a, ey + a * 0.55); g.lineTo(cx, ey - a * 0.6); g.lineTo(cx + a, ey + a * 0.55); g.stroke(); }
      else if (look.mood === 'squint') { g.moveTo(cx - s * a, ey - a * 0.8); g.lineTo(cx + s * a * 0.7, ey); g.lineTo(cx - s * a, ey + a * 0.8); g.stroke(); }
      else { g.ellipse(cx, ey, w * 0.085, h * 0.125 * (look.blink == null ? 1 : look.blink), 0, 0, Math.PI * 2); g.fill(); }
    }
  }
  // A chunky control button with a lip under it. kind: 'light' (cream) or 'dark' (purple).
  function vButton(g, x, y, w, h, kind, pressed) {
    const lip = Math.max(3, Math.min(7, h * 0.09)), r = Math.min(18, h * 0.26), dy = pressed ? lip * 0.6 : 0;
    const face = kind === 'light' ? (pressed ? P.accent : P.light) : (pressed ? '#9B6BE0' : '#4B3F80');
    const under = kind === 'light' ? (pressed ? '#D9A24A' : '#CDBBD0') : (pressed ? '#6B45A8' : '#241B3B');
    rr(g, x, y + lip, w, h - lip, r); g.fillStyle = under; g.fill();
    rr(g, x, y + dy, w, h - lip, r); g.fillStyle = face; g.fill();
    g.lineWidth = 2; g.strokeStyle = kind === 'light' ? 'rgba(58,43,90,0.55)' : 'rgba(20,14,36,0.7)'; g.stroke();
    g.fillStyle = kind === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)';
    rr(g, x + r * 0.6, y + dy + 3, w - r * 1.2, Math.max(2, h * 0.07), 3); g.fill();
    return { dy, ink: kind === 'light' ? P.outline : P.light };
  }

  /* ---------- sprites cut from the design reference ---------- */
  // [x, y, w, h] in the atlas; body: the character's body inside its frame (effects like sweat drops sit outside it)
  const SPRITES = {
    "btn-bot-jump": {"rect":[774,266,294,212]},
    "btn-bot-jump-pressed": {"rect":[1656,266,294,212]},
    "btn-bot-left": {"rect":[190,266,288,212]},
    "btn-bot-left-pressed": {"rect":[1072,266,288,212]},
    "btn-bot-right": {"rect":[482,266,288,212]},
    "btn-bot-right-pressed": {"rect":[1364,266,288,212]},
    "btn-top-b": {"rect":[300,0,290,262]},
    "btn-top-b-pressed": {"rect":[1188,0,290,262]},
    "btn-top-c": {"rect":[594,0,290,262]},
    "btn-top-c-pressed": {"rect":[1482,0,290,262]},
    "btn-top-jump": {"rect":[0,0,296,262]},
    "btn-top-jump-pressed": {"rect":[888,0,296,262]},
    "dark-celebrate": {"rect":[1828,528,108,142],"body":[8,48,106,140]},
    "dark-fall": {"rect":[1622,528,100,148],"body":[4,58,98,146]},
    "dark-idle": {"rect":[886,866,100,98],"body":[2,2,98,96]},
    "dark-jump": {"rect":[1092,866,98,96],"body":[2,2,96,94]},
    "dark-land": {"rect":[1676,866,140,84],"body":[22,2,116,82]},
    "dark-run1": {"rect":[576,866,150,102],"body":[22,12,112,100]},
    "dark-run2": {"rect":[1296,866,114,90],"body":[22,2,112,88]},
    "deco-bl": {"rect":[600,722,220,124]},
    "deco-br": {"rect":[308,722,288,130]},
    "deco-tl": {"rect":[0,266,186,258]},
    "deco-tr": {"rect":[0,528,178,190]},
    "dot": {"rect":[1252,982,24,24]},
    "dot-big": {"rect":[1198,982,50,54]},
    "ind-circle": {"rect":[0,982,74,74]},
    "ind-circle-on": {"rect":[234,982,70,72]},
    "ind-diamond": {"rect":[156,982,74,74]},
    "ind-diamond-on": {"rect":[382,982,70,72]},
    "ind-square": {"rect":[78,982,74,74]},
    "ind-square-on": {"rect":[308,982,70,72]},
    "ind-triangle": {"rect":[1820,866,84,78]},
    "ind-triangle-on": {"rect":[1908,866,82,78]},
    "light-celebrate": {"rect":[0,722,106,140],"body":[8,48,104,138]},
    "light-fall": {"rect":[1726,528,98,146],"body":[2,58,96,144]},
    "light-idle": {"rect":[990,866,98,96],"body":[2,2,96,94]},
    "light-jump": {"rect":[1194,866,98,94],"body":[2,2,96,92]},
    "light-land": {"rect":[1532,866,140,84],"body":[22,2,116,82]},
    "light-run1": {"rect":[730,866,152,100],"body":[24,12,116,98]},
    "light-run2": {"rect":[1414,866,114,88],"body":[22,2,112,86]},
    "pad": {"rect":[938,982,134,58]},
    "pad-disabled": {"rect":[1076,982,118,58]},
    "pad-pressed": {"rect":[612,982,136,62]},
    "pillar-circle": {"rect":[1776,0,114,260]},
    "pillar-triangle": {"rect":[1894,0,116,260]},
    "platform": {"rect":[752,982,182,60]},
    "platform-cyan": {"rect":[456,982,152,64]},
    "portal-dark-completed": {"rect":[646,528,250,172]},
    "portal-dark-locked": {"rect":[182,528,230,172]},
    "portal-dark-ready": {"rect":[416,528,226,172]},
    "portal-light-completed": {"rect":[1136,528,250,170]},
    "portal-light-locked": {"rect":[900,528,232,170]},
    "portal-light-ready": {"rect":[1390,528,228,168]},
    "tile-bricks": {"rect":[1526,722,92,114]},
    "tile-dirt-flower": {"rect":[1072,722,96,120]},
    "tile-dirt-vines": {"rect":[1296,722,106,118]},
    "tile-grass-dirt": {"rect":[824,722,124,122]},
    "tile-grass-stone": {"rect":[1780,722,122,112]},
    "tile-l": {"rect":[274,866,122,108]},
    "tile-stone-leaves": {"rect":[1906,722,124,112]},
    "tile-stone-vines": {"rect":[952,722,116,120]},
    "tile-u": {"rect":[116,866,154,110]},
    "util-restart-dark": {"rect":[1172,722,120,120]},
    "util-restart-light": {"rect":[1406,722,116,116]},
    "util-sound": {"rect":[0,866,112,112]},
    "vine-1": {"rect":[110,722,194,134]},
    "vine-2": {"rect":[400,866,172,108]},
    "vine-3": {"rect":[1622,722,154,114]}
  };
  let sheet = null, skyImg = null, loaded = false;
  const waiting = [];
  function load(base) {
    if (sheet || typeof Image === 'undefined') return;
    base = base || '';
    let left = 2;
    const done = () => { if (--left === 0) { loaded = true; waiting.splice(0).forEach(f => f()); } };
    sheet = new Image(); skyImg = new Image();
    sheet.onload = skyImg.onload = done;
    sheet.src = base + 'assets/sprites.webp'; skyImg.src = base + 'assets/sky.webp';
  }
  const ready = () => loaded;
  function onReady(f) { if (loaded) f(); else waiting.push(f); }
  function spr(g, name, x, y, w, h) { const r = SPRITES[name].rect; g.drawImage(sheet, r[0], r[1], r[2], r[3], x, y, w, h); }
  function sprPart(g, name, sx, sy, sw, sh, x, y, w, h) {    // part of a sprite (sx..: in the sprite's own pixels)
    const r = SPRITES[name].rect; g.drawImage(sheet, r[0] + sx, r[1] + sy, sw, sh, x, y, w, h);
  }
  const PILLAR = { circle: 'pillar-circle', triangle: 'pillar-triangle', square: 'pillar-circle', diamond: 'pillar-circle' };

  // The painted sky, covering the box (cropped, never stretched).
  function sky(g, x, y, w, h, seed) {
    if (!loaded) return vSky(g, x, y, w, h, seed);
    const iw = skyImg.width, ih = skyImg.height, k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
    g.drawImage(skyImg, (iw - sw) / 2, ih - sh, sw, sh, x, y, w, h);
  }
  // Stone bricks all around a level: the brick tile, a little darker. (ox, oy) lines them up with the level's tiles.
  function stone(g, x, y, w, h, ts, ox, oy) {
    if (!loaded) return vStone(g, x, y, w, h, ts, ox, oy);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#7C6AA5'; g.fillRect(x, y, w, h);
    const x0 = Math.floor((x - ox) / ts) - 1, y0 = Math.floor((y - oy) / ts) - 1;
    for (let ty = y0; oy + ty * ts < y + h; ty++) for (let tx = x0; ox + tx * ts < x + w; tx++) spr(g, 'tile-bricks', ox + tx * ts, oy + ty * ts, ts + 0.5, ts + 0.5);
    g.fillStyle = 'rgba(45,35,64,0.22)'; g.fillRect(x, y, w, h);
    g.restore();
  }
  // A wall tile. Grass on its top when the tile above is open; when only the tile below is open (a ceiling that
  // White walks on), the grassy tile hangs upside down. o.dim: the level's outer edge, a little darker.
  function wall(g, x, y, ts, o) {
    if (!loaded) return vWall(g, x, y, ts, o);
    g.fillStyle = '#7C6AA5'; g.fillRect(x, y, ts + 0.5, ts + 0.5);
    const grassTop = o.up && o.grass !== false, grassBottom = o.down && o.vines !== false;
    if (grassTop) spr(g, 'tile-grass-stone', x, y, ts, ts);
    if (grassBottom) {                        // hanging grass underneath; on a one-tile-thick ledge, only its lower half
      g.save();
      if (grassTop) { g.beginPath(); g.rect(x, y + ts * 0.5, ts + 0.5, ts * 0.5 + 0.5); g.clip(); }
      g.translate(x, y + ts); g.scale(1, -1); spr(g, 'tile-grass-stone', 0, 0, ts, ts); g.restore();
    }
    if (!grassTop && !grassBottom) spr(g, 'tile-bricks', x, y, ts, ts);
    if (o.dim) { g.fillStyle = 'rgba(45,35,64,0.22)'; g.fillRect(x, y, ts + 0.5, ts + 0.5); }
  }
  // A pressure pad on the floor or the ceiling of its tile.
  function plate(g, x, y, ts, side, pressed) {
    if (!loaded) return vPlate(g, x, y, ts, side, pressed);
    const w = ts * 1.0, h = ts * 0.42, px = x + (ts - w) / 2;
    if (side === 'floor') spr(g, pressed ? 'pad-pressed' : 'pad', px, y + ts - h, w, h);
    else { g.save(); g.translate(px, y + h); g.scale(1, -1); spr(g, pressed ? 'pad-pressed' : 'pad', 0, 0, w, h); g.restore(); }
  }
  // The round badge that shows a pad's symbol: grey, or cyan while the pad is pressed.
  function indicator(g, kind, cx, cy, size, on) {
    if (!loaded) return symbol(g, kind, cx, cy, size * 0.3, on ? P.cyan : '#9B93B5', P.outline);
    spr(g, 'ind-' + kind + (on ? '-on' : ''), cx - size / 2, cy - size / 2, size, size);
  }
  // A door: a stone pillar of any height, its symbol in the middle (kind: circle, triangle, square or diamond).
  // dir 'h': a side-to-side door, the same pillar lying down as one joined slab (its symbol stays upright).
  function door(g, x, y, w, h, ts, kind, dir) {
    if (w <= 0.5 || h <= 0.5) return;
    if (dir === 'h') {
      g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-Math.PI / 2);
      door(g, -h / 2, -w / 2, h, w, ts, null);
      g.restore();
      if (kind) symbol(g, kind, x + w / 2, y + h / 2, Math.min(h * 0.24, ts * 0.2), '#3E3560');
      return;
    }
    if (!loaded) { vDoor(g, x, y, w, h, ts); if (kind) symbol(g, kind, x + w / 2, y + h / 2, ts * 0.17, P.darkStone); return; }
    const name = PILLAR[kind] || 'pillar-circle', r = SPRITES[name].rect, sw = r[2], sh = r[3];
    const capS = sh * 0.36, k = w / sw, cap = Math.min(capS * k, h / 2);   // the caps keep their shape; the middle stretches
    const capSrc = cap / k;
    sprPart(g, name, 0, 0, sw, capSrc, x, y, w, cap);
    sprPart(g, name, 0, sh - capSrc, sw, capSrc, x, y + h - cap, w, cap);
    if (h > 2 * cap) sprPart(g, name, 0, sh * 0.37, sw, sh * 0.03, x, y + cap - 0.5, w, h - 2 * cap + 1);
    if (kind) symbol(g, kind, x + w / 2, y + h / 2, Math.min(w * 0.24, ts * 0.2), '#3E3560');
  }
  // A goal portal, drawn around (0, 0) = the middle of its tile, standing on the tile's bottom edge.
  // dark: Black's (a dark stone arch), else White's (a pale arch). active: its player is standing in it.
  function portal(g, ts, dark, active, t) {
    if (!loaded) return vPortal(g, ts, dark, active, t);
    const name = `portal-${dark ? 'dark' : 'light'}-${active ? 'completed' : 'ready'}`, r = SPRITES[name].rect;
    const w = ts * (active ? 1.66 : 1.6), h = w * r[3] / r[2];
    spr(g, name, -w / 2, ts / 2 - h + ts * 0.04, w, h);
  }
  // A player, drawn around (0, 0), head up, body w x h. look.frame: idle, run1, run2, jump, fall, land, celebrate;
  // look.facing: -1 mirrors the sprite.
  const MOOD = { jump: 'happy', celebrate: 'happy', fall: 'squint', land: 'squint' };
  function character(g, w, h, dark, look) {
    look = look || {};
    const frame = look.frame || 'idle';
    if (!loaded) return vCharacter(g, w, h, dark, Object.assign({ mood: look.mood || MOOD[frame] }, look));
    const sp = SPRITES[(dark ? 'dark-' : 'light-') + frame], [bx0, by0, bx1, by1] = sp.body, r = sp.rect;
    const k = h / (by1 - by0);                     // the body's height fills the player's height
    const bw = (bx1 - bx0) * k;
    g.save();
    if (look.facing < 0) g.scale(-1, 1);
    const left = -bw / 2 - bx0 * k, top = -h / 2 - by0 * k;
    g.drawImage(sheet, r[0], r[1], r[2], r[3], left, top, r[2] * k, r[3] * k);
    g.restore();
  }
  // A control button. kind 'light' (White's cream buttons) or 'dark' (Black's purple ones); icon: 'left', 'right',
  // 'jump', or none for a wide blank button. White's buttons are drawn in White's turned-around frame, so their
  // pictures are the reference's top buttons turned around too.
  function button(g, x, y, w, h, kind, pressed, icon) {
    if (!loaded) return vButton(g, x, y, w, h, kind, pressed);
    const ink = kind === 'light' ? P.outline : P.light, suf = pressed ? '-pressed' : '';
    const name = kind === 'light' ? { left: 'btn-top-c', right: 'btn-top-b', jump: 'btn-top-jump' }[icon] || 'btn-top-jump'
                                  : { left: 'btn-bot-left', right: 'btn-bot-right', jump: 'btn-bot-jump' }[icon] || 'btn-bot-jump';
    g.save();
    if (kind === 'light') { g.translate(x + w / 2, y + h / 2); g.rotate(Math.PI); g.translate(-x - w / 2, -y - h / 2); }
    if (icon) spr(g, name + suf, x, y, w, h);
    else {                                          // stretched sideways: the two ends as they are, a clean strip between
      const r = SPRITES[name + suf].rect, sw = r[2], sh = r[3], e = Math.min(w / 2, sw * 0.22 * h / sh);
      sprPart(g, name + suf, 0, 0, sw * 0.22, sh, x, y, e, h);
      sprPart(g, name + suf, sw * 0.78, 0, sw * 0.22, sh, x + w - e, y, e, h);
      sprPart(g, name + suf, sw * 0.2, 0, sw * 0.03, sh, x + e - 0.5, y, w - 2 * e + 1, h);
    }
    g.restore();
    return { dy: 0, ink };
  }
  // A decoration from the reference's frame (deco-tl, deco-tr, deco-bl, deco-br, vine-1..3), w wide, its
  // anchor corner at (x, y): ax, ay = 0 (left / top) or 1 (right / bottom). Returns false before the art loads.
  function decor(g, name, x, y, w, ax, ay) {
    if (!loaded) return false;
    const r = SPRITES[name].rect, h = w * r[3] / r[2];
    spr(g, name, x - ax * w, y - ay * h, w, h);
    return true;
  }
  // A round utility button: 'restart-light' (White's restart), 'restart-dark' (Black's) or 'sound'.
  function utility(g, cx, cy, r, which) {
    if (!loaded) return false;
    spr(g, 'util-' + which, cx - r, cy - r, 2 * r, 2 * r);
    return true;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') load();

  return { P, SPRITES, rr, hash, mix, star4, symbol, sky, stone, wall, thorns, plate, indicator, door, portal, crate, character, button, utility,
           decor, ready, onReady };
});
