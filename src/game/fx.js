// Particle effects engine
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

export class FX {
  constructor(c) { this.c = c; this.x = c.getContext('2d'); this.p = []; this.on = false }
  resize() { const r = this.c.parentElement.getBoundingClientRect(); this.c.width = r.width; this.c.height = r.height }
  add(o) { this.p.push({ life: 1, ...o }); if (!this.on) this.loop() }

  burst(x, y, n, colors, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 / n * i + Math.random() * 0.5
      const sp = (opts.sp || 3) + Math.random() * (opts.sv || 2)
      const sz = (opts.sz || 3) + Math.random() * (opts.szv || 3)
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sz,
        c: colors[Math.floor(Math.random() * colors.length)],
        dk: opts.dk || 0.02, g: opts.g || 0.05, sh: opts.sh || 'c' })
    }
  }

  beam(x1, y1, x2, y2, colors, count = 15) {
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20
      const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20
      this.add({ x: px, y: py, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        sz: 2 + Math.random() * 4, c: colors[Math.floor(Math.random() * colors.length)],
        dk: 0.03, g: 0, sh: 'c', glow: true })
    }
  }

  ring(x, y, r, colors, count = 20) {
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 2 / count * i
      this.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5,
        sz: 3 + Math.random() * 3, c: colors[Math.floor(Math.random() * colors.length)],
        dk: 0.025, g: 0, sh: 'c', glow: true })
    }
  }

  fire(x, y) {
    const c = ['#ef4444', '#f97316', '#fbbf24', '#fef3c7']
    for (let i = 0; i < 45; i++) this.add({ x: x + (Math.random() - 0.5) * 50, y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6 - 2,
      sz: 4 + Math.random() * 7, c: c[randInt(0, 3)], dk: 0.022, g: -0.04, sh: 'c' })
  }
  water(x, y) {
    const c = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
    for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2
      this.add({ x, y, vx: Math.cos(a) * (2.5 + Math.random() * 5), vy: Math.sin(a) * (2.5 + Math.random() * 5),
        sz: 4 + Math.random() * 6, c: c[randInt(0, 3)], dk: 0.018, g: 0.09, sh: 'c' }) }
  }
  electric(x, y) {
    const c = ['#fbbf24', '#fef08a', '#fff', '#f59e0b']
    for (let i = 0; i < 35; i++) this.add({ x: x + (Math.random() - 0.5) * 70, y: y + (Math.random() - 0.5) * 70,
      vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
      sz: 2.5 + Math.random() * 4, c: c[randInt(0, 3)], dk: 0.035, g: 0, sh: 'b', glow: true })
  }
  grass(x, y) {
    const c = ['#22c55e', '#4ade80', '#86efac', '#dcfce7']
    for (let i = 0; i < 30; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
      this.add({ x: x + (Math.random() - 0.5) * 30, y, vx: Math.cos(a) * (3.5 + Math.random() * 4),
        vy: Math.sin(a) * (3.5 + Math.random() * 4), sz: 5 + Math.random() * 5,
        c: c[randInt(0, 3)], dk: 0.016, g: 0.04, sh: 'l' }) }
  }
  ghost(x, y) {
    const c = ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd']
    for (let i = 0; i < 32; i++) this.add({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 3.5, vy: (Math.random() - 0.5) * 3.5,
      sz: 6 + Math.random() * 10, c: c[randInt(0, 3)], dk: 0.013, g: -0.025, sh: 'c', glow: true })
  }
  psychic(x, y) {
    const c = ['#ec4899', '#f9a8d4', '#a855f7', '#fce7f3']
    this.ring(x, y, 50, c, 28)
    this.ring(x, y, 25, c, 14)
    this.ring(x, y, 75, c, 20)
  }
  ice(x, y) {
    const c = ['#67e8f9', '#a5f3fc', '#cffafe', '#fff']
    for (let i = 0; i < 38; i++) this.add({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
      sz: 4 + Math.random() * 5, c: c[randInt(0, 3)], dk: 0.018, g: 0.02, sh: 's' })
  }
  dragon(x, y) {
    const c = ['#7c3aed', '#a855f7', '#6d28d9', '#ddd6fe']
    this.fire(x, y)
    this.ring(x, y, 60, c, 20)
    this.ring(x, y, 30, c, 12)
  }
  normal(x, y) {
    this.burst(x, y, 22, ['#fbbf24', '#fde68a', '#fff', '#f59e0b'], { sp: 4, sz: 3, sh: 's' })
  }
  dark(x, y) {
    const c = ['#1c1917', '#44403c', '#78716c', '#a8a29e']
    for (let i = 0; i < 28; i++) this.add({ x: x + (Math.random() - 0.5) * 70, y: y + (Math.random() - 0.5) * 70,
      vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
      sz: 6 + Math.random() * 8, c: c[randInt(0, 3)], dk: 0.018, g: 0, sh: 'c', glow: true })
  }
  fairy(x, y) {
    const c = ['#f9a8d4', '#fbcfe8', '#ec4899', '#fff']
    for (let i = 0; i < 32; i++) {
      const a = Math.random() * Math.PI * 2
      this.add({ x: x + (Math.random() - 0.5) * 50, y: y + (Math.random() - 0.5) * 50,
        vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5 - 1.5,
        sz: 4 + Math.random() * 6, c: c[randInt(0, 3)], dk: 0.015, g: -0.025, sh: 's', glow: true })
    }
  }
  fighting(x, y) {
    const c = ['#b45309', '#d97706', '#f59e0b', '#fef3c7']
    this.burst(x, y, 30, c, { sp: 6, sz: 5, dk: 0.028 })
    this.fire(x, y)
  }
  heal(x, y) {
    const c = ['#22c55e', '#86efac', '#bbf7d0', '#fff']
    for (let i = 0; i < 24; i++) this.add({ x: x + (Math.random() - 0.5) * 60, y: y + Math.random() * 20,
      vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 4 - 1,
      sz: 4 + Math.random() * 5, c: c[randInt(0, 3)], dk: 0.013, g: -0.035, sh: '+' })
  }
  charge(x, y) {
    const c = ['#fbbf24', '#f97316', '#ef4444', '#fff']
    for (let i = 0; i < 55; i++) { const a = Math.random() * Math.PI * 2; const d = 35 + Math.random() * 70
      this.add({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        vx: -Math.cos(a) * (2.5 + Math.random() * 2.5), vy: -Math.sin(a) * (2.5 + Math.random() * 2.5),
        sz: 2.5 + Math.random() * 5, c: c[randInt(0, 3)], dk: 0.018, g: 0, sh: 'c', glow: true }) }
  }

  // ===== New Effects =====

  evolution(x, y) {
    // Swirling particles spiraling inward then outward burst, white/gold, bright flash
    const c = ['#fff', '#fbbf24', '#fde68a', '#fffbeb', '#f0fdf4']
    const N = 60
    // Inward spiral phase
    for (let i = 0; i < N; i++) {
      const a = (Math.PI * 2 / N) * i + (i * 0.3)
      const d = 60 + Math.random() * 40
      this.add({
        x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        vx: -Math.cos(a) * (3 + Math.random() * 2),
        vy: -Math.sin(a) * (3 + Math.random() * 2),
        sz: 3 + Math.random() * 5,
        c: c[randInt(0, c.length - 1)],
        dk: 0.014, g: 0, sh: 's', glow: true
      })
    }
    // Outward burst after short delay (simulate with slower decay particles)
    for (let i = 0; i < N; i++) {
      const a = (Math.PI * 2 / N) * i
      this.add({
        x, y,
        vx: Math.cos(a) * (4 + Math.random() * 5),
        vy: Math.sin(a) * (4 + Math.random() * 5),
        sz: 4 + Math.random() * 6,
        c: c[randInt(0, c.length - 1)],
        dk: 0.01, g: 0, sh: 's', glow: true
      })
    }
    // Flash overlay particle
    this.add({ x, y, vx: 0, vy: 0, sz: 80, c: '#fff', dk: 0.08, g: 0, sh: 'c' })
  }

  superEffective(x, y) {
    // More dramatic: bigger, more particles, screen-wide spread
    const colors = ['#ef4444', '#fbbf24', '#fff', '#f97316', '#fde68a']
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 4 + Math.random() * 8
      this.add({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 80,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        sz: 5 + Math.random() * 9,
        c: colors[randInt(0, colors.length - 1)],
        dk: 0.016, g: 0.03, sh: Math.random() > 0.5 ? 's' : 'c', glow: true
      })
    }
    this.ring(x, y, 80, colors, 30)
    this.ring(x, y, 40, colors, 16)
  }

  levelUp(x, y) {
    // Rising golden particles with sparkle effect
    const c = ['#fbbf24', '#fde68a', '#fff', '#f59e0b', '#fef3c7']
    for (let i = 0; i < 50; i++) {
      this.add({
        x: x + (Math.random() - 0.5) * 80,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: -(2 + Math.random() * 5),
        sz: 3 + Math.random() * 6,
        c: c[randInt(0, c.length - 1)],
        dk: 0.012, g: -0.02, sh: Math.random() > 0.4 ? 's' : 'c', glow: true
      })
    }
    this.ring(x, y, 35, c, 16)
  }

  switchPokemon(x, y) {
    // Quick dissolve-reform: scatter outward then new particles come in
    const c = ['#fff', '#a5b4fc', '#818cf8', '#c7d2fe', '#6366f1']
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 3 + Math.random() * 5
      this.add({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
        sz: 3 + Math.random() * 4,
        c: c[randInt(0, c.length - 1)],
        dk: 0.025, g: 0, sh: 'c', glow: true
      })
    }
  }

  typeFX(type, x, y) {
    const m = {
      fire: 'fire', water: 'water', electric: 'electric', grass: 'grass', bug: 'grass',
      ghost: 'ghost', psychic: 'psychic', ice: 'ice', dragon: 'dragon', normal: 'normal',
      flying: 'normal', rock: 'normal', fighting: 'fighting', poison: 'ghost', dark: 'dark',
      fairy: 'fairy', steel: 'ice',
    }
    const method = m[type] || 'normal'
    this[method](x, y)
  }

  screenShake(container, intensity = 8, duration = 400) {
    if (!container) return
    const frames = 12
    const interval = duration / frames
    let t = 0
    const shake = () => {
      if (t >= frames) { container.style.transform = ''; return }
      const decay = 1 - t / frames
      const dx = (Math.random() - 0.5) * intensity * decay * 2
      const dy = (Math.random() - 0.5) * intensity * decay
      container.style.transform = `translate(${dx}px, ${dy}px)`
      t++
      setTimeout(shake, interval)
    }
    shake()
  }

  loop() {
    this.on = true
    const go = () => {
      if (!this.p.length) { this.on = false; return }
      this.x.clearRect(0, 0, this.c.width, this.c.height)
      this.p = this.p.filter(p => {
        p.life -= p.dk; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.98
        if (p.life <= 0) return false
        const ctx = this.x; ctx.save(); ctx.globalAlpha = Math.max(0, p.life)
        if (p.glow) { ctx.shadowColor = p.c; ctx.shadowBlur = 16 }
        ctx.fillStyle = p.c; ctx.translate(p.x, p.y)
        const s = p.sz * p.life
        if (p.sh === 's') { this._star(ctx, s) }
        else if (p.sh === 'b') { this._bolt(ctx, s) }
        else if (p.sh === 'l') { ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.35, 0, 0, Math.PI * 2); ctx.fill() }
        else if (p.sh === '+') { ctx.fillRect(-s / 6, -s / 2, s / 3, s); ctx.fillRect(-s / 2, -s / 6, s, s / 3) }
        else { ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill() }
        ctx.restore(); return true
      })
      requestAnimationFrame(go)
    }
    go()
  }
  _star(ctx, r) { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = Math.PI * 2 / 5 * i - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); const ia = a + Math.PI / 5; ctx.lineTo(Math.cos(ia) * r * 0.4, Math.sin(ia) * r * 0.4) } ctx.closePath(); ctx.fill() }
  _bolt(ctx, s) { ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(0, 0); ctx.lineTo(s, s); ctx.lineTo(-s * 0.3, s * 0.3); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill() }
  clear() { this.p = []; this.x.clearRect(0, 0, this.c.width, this.c.height) }
}
