'use strict';

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const approach = (x, target, rate, dt) => x + (target - x) * (1 - Math.exp(-rate * dt));

// One soft body, many circulating cells. All rates are expressed in seconds.
class LivingField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = this.motion.matches;
    this.pointer = { x: 0, y: 0, lastX: 0, lastY: 0, active: false, down: false, id: null, speed: 0 };
    this.width = this.height = 0;
    this.resize();
    this.reset();
    this.listen();
    this.syncPause();
    this.lastFrame = 0;
    this.accumulator = 0;
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const oldWidth = this.width || rect.width, oldHeight = this.height || rect.height;
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const narrow = this.width <= 680;
    this.homeX = this.width * (narrow ? 0.52 : 0.61);
    this.homeY = this.height * (narrow ? 0.59 : 0.50);
    this.radius = Math.max(16, Math.min(this.width * (narrow ? 0.30 : 0.255), this.height * 0.29));
    if (this.body) {
      this.body.x *= this.width / oldWidth;
      this.body.y *= this.height / oldHeight;
      for (const p of this.particles) { p.x *= this.width / oldWidth; p.y *= this.height / oldHeight; }
    }
    this.renderNeeded = true;
  }

  reset() {
    this.time = 0;
    this.trust = 0;
    this.alarm = 0;
    this.contact = 0;
    this.breath = 0;
    this.pulseClock = 0;
    this.waves = [];
    this.pointer.active = this.pointer.down = false;
    if (this.pointer.id !== null && this.canvas.hasPointerCapture(this.pointer.id)) this.canvas.releasePointerCapture(this.pointer.id);
    this.pointer.id = null;
    this.pointer.speed = 0;
    this.body = { x: this.homeX, y: this.homeY, vx: 0, vy: 0 };
    this.particles = Array.from({ length: 6200 }, (_, i) => {
      const angle = Math.random() * TAU;
      // A denser membrane surrounds a less dense, circulating interior.
      const shell = i % 3 === 0;
      const depth = shell ? 0.91 + Math.random() * 0.09 : Math.sqrt(Math.random()) * 0.94;
      const p = { angle, depth, shell, phase: Math.random() * TAU, vx: 0, vy: 0, bin: i % 4 };
      const r = this.surface(angle) * depth;
      p.x = this.body.x + Math.cos(angle) * r;
      p.y = this.body.y + Math.sin(angle) * r;
      return p;
    });
    this.renderNeeded = true;
    this.updateStatus();
  }

  surface(angle) {
    const t = this.time;
    const folds = 1 + 0.10 * Math.sin(angle * 3 + t * 0.23)
      + 0.065 * Math.sin(angle * 5 - t * 0.17) + 0.035 * Math.sin(angle * 8 + t * 0.31);
    return this.radius * folds * (1 + this.breath * 0.055 - this.alarm * 0.19 + this.contact * 0.055);
  }

  listen() {
    const pointer = this.pointer;
    const position = e => {
      const rect = this.canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) * this.width / rect.width;
      pointer.y = (e.clientY - rect.top) * this.height / rect.height;
      if (!pointer.active) { pointer.lastX = pointer.x; pointer.lastY = pointer.y; pointer.speed = 0; }
      pointer.active = true;
    };
    this.canvas.addEventListener('pointermove', e => { if (pointer.id === null || e.pointerId === pointer.id) position(e); });
    this.canvas.addEventListener('pointerdown', e => {
      if (pointer.id !== null || e.button !== 0) return;
      position(e);
      pointer.down = true;
      pointer.id = e.pointerId;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.focus({ preventScroll: true });
    });
    const release = e => {
      if (pointer.id !== e.pointerId) return;
      pointer.down = false;
      pointer.id = null;
      const rect = this.canvas.getBoundingClientRect();
      if (e.type !== 'pointerup' || e.pointerType !== 'mouse' || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) pointer.active = false;
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
    this.canvas.addEventListener('lostpointercapture', release);
    this.canvas.addEventListener('pointerleave', () => { if (!pointer.down) pointer.active = false; });
    const clearInput = () => {
      pointer.active = pointer.down = false;
      pointer.speed = 0;
      const id = pointer.id;
      pointer.id = null;
      if (id !== null && this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
    };
    window.addEventListener('blur', clearInput);
    this.canvas.addEventListener('blur', clearInput);
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => { this.lastFrame = 0; this.accumulator = 0; clearInput(); });
    this.canvas.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === ' ') { if (!e.repeat) this.togglePause(); return; }
      if (e.key === 'Escape') { clearInput(); return; }
      if (!pointer.active) {
        pointer.x = pointer.lastX = this.body.x;
        pointer.y = pointer.lastY = this.body.y;
        pointer.active = true;
      }
      if (e.key === 'Enter') pointer.down = true;
      pointer.x = clamp(pointer.x + (e.key === 'ArrowRight' ? 12 : e.key === 'ArrowLeft' ? -12 : 0), 0, this.width);
      pointer.y = clamp(pointer.y + (e.key === 'ArrowDown' ? 12 : e.key === 'ArrowUp' ? -12 : 0), 0, this.height);
    });
    this.canvas.addEventListener('keyup', e => { if (e.key === 'Enter') pointer.down = false; });
    document.getElementById('pause').addEventListener('click', () => this.togglePause());
    document.getElementById('reset').addEventListener('click', () => this.reset());
    this.motion.addEventListener('change', e => { if (e.matches) { this.paused = true; this.syncPause(); } });
  }

  togglePause() {
    this.paused = !this.paused;
    this.pointer.lastX = this.pointer.x;
    this.pointer.lastY = this.pointer.y;
    this.pointer.speed = 0;
    this.accumulator = 0;
    this.syncPause();
  }

  syncPause() {
    const button = document.getElementById('pause');
    button.textContent = this.paused ? 'Resume' : 'Pause';
    button.setAttribute('aria-pressed', String(this.paused));
    this.updateStatus();
  }

  step(dt) {
    this.time += dt;
    const m = this.pointer, b = this.body;
    const speed = m.active ? Math.hypot(m.x - m.lastX, m.y - m.lastY) / dt : 0;
    m.speed = approach(m.speed, Math.min(speed, 2200), 12, dt);
    m.lastX = m.x; m.lastY = m.y;
    const dx = m.x - b.x, dy = m.y - b.y;
    const distance = Math.hypot(dx, dy);
    const near = m.active ? clamp(1 - Math.max(0, distance - this.radius * 0.8) / (this.radius * 1.6), 0, 1) : 0;
    const threat = clamp((m.speed - 380) / 850, 0, 1) * near;
    this.alarm = approach(this.alarm, threat, threat > this.alarm ? 9 : 0.48, dt);
    const gentle = near * (1 - clamp(m.speed / 480, 0, 1)) * (1 - this.alarm);
    this.trust = approach(this.trust, gentle, gentle > this.trust ? 0.24 : 0.10, dt);
    this.contact = approach(this.contact, m.down ? gentle : 0, m.down ? 1.5 : 0.6, dt);
    this.breath = Math.sin(this.time * (1.12 + this.alarm * 0.6)) * 0.78 + Math.sin(this.time * 0.41) * 0.22;

    const attraction = near * (0.10 + this.trust * 0.27) * (1 - this.alarm);
    const invDistance = 1 / Math.max(distance, 1);
    const targetX = this.homeX + Math.sin(this.time * 0.19) * this.radius * 0.075
      + clamp(m.x - this.homeX, -this.radius, this.radius) * attraction - dx * invDistance * this.alarm * this.radius * 0.27;
    const targetY = this.homeY + Math.cos(this.time * 0.16) * this.radius * 0.055
      + clamp(m.y - this.homeY, -this.radius, this.radius) * attraction - dy * invDistance * this.alarm * this.radius * 0.27;
    b.vx = (b.vx + (targetX - b.x) * 2.5 * dt) * Math.exp(-2.4 * dt);
    b.vy = (b.vy + (targetY - b.y) * 2.5 * dt) * Math.exp(-2.4 * dt);
    b.x += b.vx * dt; b.y += b.vy * dt;

    this.pulseClock += dt * (0.16 + this.contact * 0.72);
    if (this.pulseClock >= 1) {
      this.pulseClock -= 1;
      this.waves.push({ x: this.contact > 0.2 ? m.x : b.x, y: this.contact > 0.2 ? m.y : b.y, age: 0, strength: 0.35 + this.contact * 0.65 });
    }
    for (const wave of this.waves) wave.age += dt;
    this.waves = this.waves.filter(w => w.age < 3);

    const drag = Math.exp(-5.2 * dt);
    for (const p of this.particles) {
      p.angle += dt * (p.shell ? 0.022 : 0.09 + (1 - p.depth) * 0.20) * (1 + this.contact * 0.4);
      const a = p.angle;
      const r = this.surface(a) * p.depth;
      let tx = b.x + Math.cos(a) * r, ty = b.y + Math.sin(a) * r;
      const eddy = Math.sin(a * 4 + this.time * 0.7 + p.depth * 12);
      tx += Math.cos(a + Math.PI / 2) * eddy * this.radius * 0.036 * (1 - p.depth);
      ty += Math.sin(a + Math.PI / 2) * eddy * this.radius * 0.036 * (1 - p.depth);
      if (near > 0) {
        const pdx = m.x - tx, pdy = m.y - ty;
        const pd = Math.hypot(pdx, pdy);
        const local = Math.exp(-pd * pd / (this.radius * this.radius * 0.48));
        const reach = local * (this.trust * 0.34 + this.contact * 0.16 - this.alarm * 0.65);
        tx += pdx * reach; ty += pdy * reach;
      }
      p.vx = (p.vx + (tx - p.x) * 17 * dt) * drag;
      p.vy = (p.vy + (ty - p.y) * 17 * dt) * drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  render() {
    const ctx = this.ctx, b = this.body, r = this.radius;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#080e10';
    ctx.fillRect(0, 0, this.width, this.height);
    const halo = ctx.createRadialGradient(b.x, b.y, r * 0.2, b.x, b.y, r * 1.75);
    halo.addColorStop(0, `rgba(45,105,87,${0.10 + this.contact * 0.06})`);
    halo.addColorStop(0.6, 'rgba(23,62,54,0.075)');
    halo.addColorStop(1, 'rgba(8,14,16,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(b.x - r * 1.8, b.y - r * 1.8, r * 3.6, r * 3.6);

    // Long, overlapping cilia give the boundary a soft, living edge.
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = `rgba(139,205,178,${0.12 + this.contact * 0.08})`;
    ctx.beginPath();
    for (let i = 0; i < 144; i++) {
      const a = i / 144 * TAU + this.time * 0.022;
      const edge = this.surface(a);
      const length = r * (0.06 + 0.05 * Math.sin(i * 2.39) ** 2) * (1 - this.alarm * 0.65);
      const sway = Math.sin(this.time * 1.3 - a * 6) * 0.065;
      ctx.moveTo(b.x + Math.cos(a) * edge * 0.97, b.y + Math.sin(a) * edge * 0.97);
      ctx.quadraticCurveTo(b.x + Math.cos(a + sway) * (edge + length * 0.6), b.y + Math.sin(a + sway) * (edge + length * 0.6), b.x + Math.cos(a + sway * 0.7) * (edge + length), b.y + Math.sin(a + sway * 0.7) * (edge + length));
    }
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    const colors = this.alarm > 0.22 ? ['125,154,131', '186,177,129', '228,179,122', '244,214,171'] : ['78,135,119', '112,174,148', '174,210,158', '226,225,182'];
    for (let bin = 0; bin < 4; bin++) {
      ctx.strokeStyle = `rgba(${colors[bin]},${0.29 + bin * 0.10 + this.contact * 0.13 + this.breath * 0.035})`;
      ctx.lineWidth = bin === 3 ? 1.05 : 0.65;
      ctx.beginPath();
      for (const p of this.particles) {
        if (p.bin !== bin) continue;
        const length = p.shell ? 1.7 : 1 + (1 - p.depth) * 2.4;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.sin(p.angle) * length - p.vx * 0.025, p.y + Math.cos(p.angle) * length - p.vy * 0.025);
      }
      ctx.stroke();
    }
    // Signals illuminate cells as they pass; no hard concentric ripple outlines.
    ctx.fillStyle = 'rgba(221,240,192,0.65)';
    ctx.beginPath();
    for (const wave of this.waves) {
      const front = wave.age * r * 0.85;
      for (let i = 0; i < this.particles.length; i += 3) {
        const p = this.particles[i];
        const band = Math.abs(Math.hypot(p.x - wave.x, p.y - wave.y) - front) / (r * 0.09);
        if (band < 1) {
          const size = (1 - band) * wave.strength * (1 - wave.age / 3) * 1.8;
          ctx.rect(p.x, p.y, size, size);
        }
      }
    }
    ctx.fill();

    // A wandering cluster of organelles, rather than a perfectly centered core.
    for (let i = 0; i < 3; i++) {
      const a = this.time * 0.13 + i * 2.1;
      const x = b.x + Math.cos(a) * r * 0.16, y = b.y + Math.sin(a * 1.3) * r * 0.12;
      const size = r * (0.10 + i * 0.017) * (1 + this.breath * 0.1);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      glow.addColorStop(0, `rgba(187,205,135,${0.15 + this.contact * 0.1})`);
      glow.addColorStop(0.45, 'rgba(111,172,115,0.08)');
      glow.addColorStop(1, 'rgba(65,133,109,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (this.pointer.active) {
      ctx.strokeStyle = `rgba(196,224,202,${this.pointer.down ? 0.50 : 0.22})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(this.pointer.x, this.pointer.y, this.pointer.down ? 9 : 4, 0, TAU); ctx.stroke();
    }
    this.updateStatus();
  }

  updateStatus() {
    let label = 'Resting', note = 'A quiet, independent rhythm';
    if (this.alarm > 0.22) { label = 'Guarded'; note = 'A sudden movement. A moment to recover.'; }
    else if (this.contact > 0.25) { label = 'Connected'; note = 'Your stillness becomes a pulse'; }
    else if (this.pointer.active && this.trust > 0.15) { label = 'Curious'; note = 'Growing accustomed to your presence'; }
    else if (!this.pointer.active && this.trust > 0.12) { label = 'Settling'; note = 'The encounter lingers'; }
    if (this.paused) { label = 'Paused'; note = this.motion.matches ? 'Resume when you are ready for motion' : 'A moment held still'; }
    if (this.statusLabel !== label) { document.getElementById('state').textContent = label; this.statusLabel = label; }
    if (this.statusNote !== note) { document.getElementById('state-note').textContent = note; this.statusNote = note; }
  }

  frame(timestamp) {
    const elapsed = this.lastFrame ? Math.min((timestamp - this.lastFrame) / 1000, 0.05) : 0;
    this.lastFrame = timestamp;
    if (!document.hidden && !this.paused) {
      this.accumulator += elapsed;
      // Fixed steps preserve response timing on both 60 Hz and 144 Hz displays.
      while (this.accumulator >= 1 / 60) { this.step(1 / 60); this.accumulator -= 1 / 60; }
      this.render();
      this.renderNeeded = false;
    } else if (this.renderNeeded && !document.hidden) {
      this.render(); this.renderNeeded = false;
    }
    requestAnimationFrame(this.frame);
  }
}

window.organism = new LivingField(document.getElementById('c'));
