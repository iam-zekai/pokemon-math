// Sound engine using Web Audio API (zero network requests)
class SoundEngine {
  constructor() {
    this.ctx = null
  }

  init() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) { /* silently fail */ }
  }

  play(type) {
    if (!this.ctx) return
    const c = this.ctx
    const now = c.currentTime
    const g = c.createGain()
    g.connect(c.destination)
    g.gain.value = 0.15

    switch (type) {
      case 'correct': {
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.setValueAtTime(523, now)
        o.frequency.setValueAtTime(784, now + 0.1)
        g.gain.setValueAtTime(0.15, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        o.start(now); o.stop(now + 0.25)
        break
      }
      case 'wrong': {
        const o = c.createOscillator(); o.type = 'sawtooth'
        o.connect(g); o.frequency.value = 150
        g.gain.setValueAtTime(0.12, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.start(now); o.stop(now + 0.3)
        break
      }
      case 'hit': {
        const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
        const s = c.createBufferSource(); s.buffer = buf; s.connect(g)
        g.gain.value = 0.2
        s.start(now)
        break
      }
      case 'crit': {
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.setValueAtTime(200, now)
        o.frequency.exponentialRampToValueAtTime(800, now + 0.05)
        o.frequency.exponentialRampToValueAtTime(100, now + 0.2)
        g.gain.setValueAtTime(0.2, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.start(now); o.stop(now + 0.3)
        break
      }
      case 'defeat': {
        const notes = [523, 659, 784, 1047]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'square'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.1, now + i * 0.15)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3)
          o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3)
        })
        break
      }
      case 'charge': {
        const o = c.createOscillator(); o.type = 'sine'
        o.connect(g); o.frequency.setValueAtTime(200, now)
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.5)
        g.gain.setValueAtTime(0.08, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
        o.start(now); o.stop(now + 0.55)
        break
      }
      case 'select': {
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.value = 660
        g.gain.setValueAtTime(0.08, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        o.start(now); o.stop(now + 0.08)
        break
      }
      case 'levelup': {
        const notes = [440, 554, 659, 880]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'triangle'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.12, now + i * 0.12)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25)
          o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.25)
        })
        break
      }
      case 'gameover': {
        const notes = [440, 370, 311, 262]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'square'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.1, now + i * 0.2)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4)
          o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.4)
        })
        break
      }
    }
  }
}

export const SFX = new SoundEngine()
