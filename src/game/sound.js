// Sound engine using Web Audio API (zero network requests)
class SoundEngine {
  constructor() {
    this.ctx = null
    this._vol = 1.0
    this._muted = false
  }

  init() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) { /* silently fail */ }
  }

  setVolume(v) { this._vol = Math.max(0, Math.min(1, v)) }
  mute() { this._muted = true }
  unmute() { this._muted = false }

  _gain(val) {
    if (!this.ctx) return null
    const g = this.ctx.createGain()
    g.connect(this.ctx.destination)
    g.gain.value = this._muted ? 0 : val * this._vol
    return g
  }

  play(type) {
    if (!this.ctx) return
    const c = this.ctx
    const now = c.currentTime

    switch (type) {
      case 'correct': {
        const g = this._gain(0.15); if (!g) return
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.setValueAtTime(523, now)
        o.frequency.setValueAtTime(784, now + 0.1)
        g.gain.setValueAtTime(this._muted ? 0 : 0.15 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        o.start(now); o.stop(now + 0.25)
        break
      }
      case 'wrong': {
        const g = this._gain(0.12); if (!g) return
        const o = c.createOscillator(); o.type = 'sawtooth'
        o.connect(g); o.frequency.value = 150
        g.gain.setValueAtTime(this._muted ? 0 : 0.12 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.start(now); o.stop(now + 0.3)
        break
      }
      case 'hit': {
        const g = this._gain(0.2); if (!g) return
        const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
        const s = c.createBufferSource(); s.buffer = buf; s.connect(g)
        s.start(now)
        break
      }
      case 'crit': {
        const g = this._gain(0.2); if (!g) return
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.setValueAtTime(200, now)
        o.frequency.exponentialRampToValueAtTime(800, now + 0.05)
        o.frequency.exponentialRampToValueAtTime(100, now + 0.2)
        g.gain.setValueAtTime(this._muted ? 0 : 0.2 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.start(now); o.stop(now + 0.3)
        break
      }
      case 'defeat': {
        if (this._muted) return
        const notes = [523, 659, 784, 1047]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'square'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.1 * this._vol, now + i * 0.15)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3)
          o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3)
        })
        break
      }
      case 'charge': {
        const g = this._gain(0.08); if (!g) return
        const o = c.createOscillator(); o.type = 'sine'
        o.connect(g); o.frequency.setValueAtTime(200, now)
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.5)
        g.gain.setValueAtTime(this._muted ? 0 : 0.08 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
        o.start(now); o.stop(now + 0.55)
        break
      }
      case 'select': {
        const g = this._gain(0.08); if (!g) return
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.value = 660
        g.gain.setValueAtTime(this._muted ? 0 : 0.08 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        o.start(now); o.stop(now + 0.08)
        break
      }
      case 'levelup': {
        if (this._muted) return
        const notes = [440, 554, 659, 880]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'triangle'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.12 * this._vol, now + i * 0.12)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25)
          o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.25)
        })
        break
      }
      case 'gameover': {
        if (this._muted) return
        const notes = [440, 370, 311, 262]
        notes.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'square'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.1 * this._vol, now + i * 0.2)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4)
          o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.4)
        })
        break
      }
      case 'evolution': {
        // Ascending sparkle
        if (this._muted) return
        const freqs = [523, 659, 784, 1047, 1319, 1568, 2093]
        freqs.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'triangle'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0, now + i * 0.07)
          ng.gain.linearRampToValueAtTime(0.1 * this._vol, now + i * 0.07 + 0.04)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2)
          o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.2)
        })
        break
      }
      case 'switch': {
        // Whoosh
        const g = this._gain(0.12); if (!g) return
        const o = c.createOscillator(); o.type = 'sine'
        o.connect(g); o.frequency.setValueAtTime(800, now)
        o.frequency.exponentialRampToValueAtTime(200, now + 0.25)
        g.gain.setValueAtTime(this._muted ? 0 : 0.12 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        o.start(now); o.stop(now + 0.25)
        break
      }
      case 'item': {
        // Pickup chime
        if (this._muted) return
        const notes2 = [880, 1100, 1320]
        notes2.forEach((f, i) => {
          const o = c.createOscillator(); o.type = 'triangle'
          const ng = c.createGain(); ng.connect(c.destination)
          o.connect(ng); o.frequency.value = f
          ng.gain.setValueAtTime(0.08 * this._vol, now + i * 0.08)
          ng.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15)
          o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.15)
        })
        break
      }
      case 'bgm_toggle': {
        // Click
        const g = this._gain(0.15); if (!g) return
        const o = c.createOscillator(); o.type = 'square'
        o.connect(g); o.frequency.value = 440
        g.gain.setValueAtTime(this._muted ? 0 : 0.15 * this._vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        o.start(now); o.stop(now + 0.05)
        break
      }
    }
  }
}

// ===== BGM System =====
class BGMEngine {
  constructor() {
    this.ctx = null
    this._vol = 0.35
    this._nodes = []
    this._track = null
    this._fadeTimer = null
    this._masterGain = null
  }

  _init() {
    if (this.ctx) return true
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this._masterGain = this.ctx.createGain()
      this._masterGain.gain.value = this._vol
      this._masterGain.connect(this.ctx.destination)
      return true
    } catch (e) { return false }
  }

  setVolume(v) {
    this._vol = Math.max(0, Math.min(1, v))
    if (this._masterGain) this._masterGain.gain.value = this._vol
  }

  stop() {
    this._track = null
    this._nodes.forEach(n => { try { n.stop(); n.disconnect() } catch (e) {} })
    this._nodes = []
  }

  fadeOut(duration = 1.0) {
    if (!this._masterGain) return
    const now = this.ctx.currentTime
    this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, now)
    this._masterGain.gain.linearRampToValueAtTime(0, now + duration)
    setTimeout(() => { this.stop(); if (this._masterGain) this._masterGain.gain.value = this._vol }, duration * 1000 + 50)
  }

  play(trackName) {
    if (!this._init()) return
    if (this._track === trackName) return
    this.stop()
    if (this._masterGain) this._masterGain.gain.value = this._vol
    this._track = trackName
    switch (trackName) {
      case 'title': this._playTitle(); break
      case 'battle': this._playBattle(); break
      case 'gym': this._playGym(); break
      case 'victory': this._playVictory(); break
      case 'defeat_bgm': this._playDefeatBGM(); break
    }
  }

  // Helper: schedule a looping melody using note arrays
  _schedNote(freq, start, dur, type, gainVal, detune = 0) {
    const c = this.ctx
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    o.detune.value = detune
    o.connect(g); g.connect(this._masterGain)
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(gainVal, start + 0.02)
    g.gain.setValueAtTime(gainVal, start + dur - 0.03)
    g.gain.linearRampToValueAtTime(0, start + dur)
    o.start(start); o.stop(start + dur)
    this._nodes.push(o)
  }

  _playTitle() {
    // Calm C major nostalgic melody, 100 BPM, loops
    const c = this.ctx
    const bpm = 100
    const beat = 60 / bpm
    // C major scale: C4=261.6, D=293.7, E=329.6, F=349.2, G=392, A=440, B=493.9, C5=523.3
    const M = { C4:261.6, D4:293.7, E4:329.6, F4:349.2, G4:392, A4:440, B4:493.9,
                 C5:523.3, D5:587.3, E5:659.3, G5:784, C3:130.8, G3:196, E3:164.8 }
    // Melody pattern (note, beats)
    const mel = [
      [M.E5,1],[M.D5,0.5],[M.E5,0.5],[M.C5,1],[M.G4,1],
      [M.A4,1],[M.B4,0.5],[M.A4,0.5],[M.G4,2],
      [M.E5,1],[M.D5,0.5],[M.C5,0.5],[M.D5,1],[M.E5,1],
      [M.C5,2],[M.G4,2],
    ]
    const bass = [
      [M.C3,2],[M.G3,2],[M.A4/2,2],[M.F4/2,2],
      [M.C3,2],[M.G3,2],[M.A4/2,2],[M.G3,2],
    ]
    const loopBars = 16 * beat
    const scheduleLoop = (offset) => {
      if (this._track !== 'title') return
      let t = c.currentTime + offset
      mel.forEach(([f, b]) => {
        this._schedNote(f, t, b * beat * 0.9, 'triangle', 0.18)
        t += b * beat
      })
      let tb = c.currentTime + offset
      bass.forEach(([f, b]) => {
        this._schedNote(f, tb, b * beat * 0.85, 'square', 0.06)
        tb += b * beat
      })
      setTimeout(() => scheduleLoop(0), (loopBars - 0.1) * 1000)
    }
    scheduleLoop(0.05)
  }

  _playBattle() {
    // Energetic minor key, 150 BPM
    const c = this.ctx
    const bpm = 150
    const beat = 60 / bpm
    // A minor: A3=220, B3=246.9, C4=261.6, D4=293.7, E4=329.6, F4=349.2, G4=392, A4=440
    const M = { A3:220, B3:246.9, C4:261.6, D4:293.7, E4:329.6, F4:349.2, G4:392, A4:440,
                 E5:659.3, C5:523.3, B4:493.9, G3:196, E3:164.8, A2:110, D3:146.8 }
    const mel = [
      [M.A4,0.5],[M.A4,0.5],[M.C5,0.5],[M.E5,0.5],
      [M.D4,0.5],[M.D4,0.5],[M.F4,0.5],[M.A4,0.5],
      [M.G4,0.5],[M.G4,0.5],[M.B4,0.5],[M.D4+200,0.5],
      [M.E4,0.5],[M.G4,0.5],[M.A4,1],[M.A4,0.5],
    ]
    const bass = [
      [M.A2,0.5],[M.A2,0.5],[M.A2,0.5],[M.A2,0.5],
      [M.D3,0.5],[M.D3,0.5],[M.D3,0.5],[M.D3,0.5],
      [M.G3,0.5],[M.G3,0.5],[M.G3,0.5],[M.G3,0.5],
      [M.E3,0.5],[M.E3,0.5],[M.A2,0.5],[M.A2,0.5],
    ]
    const loopBars = 8 * beat
    const scheduleLoop = (offset) => {
      if (this._track !== 'battle') return
      let t = c.currentTime + offset
      mel.forEach(([f, b]) => {
        this._schedNote(f, t, b * beat * 0.85, 'square', 0.14)
        t += b * beat
      })
      let tb = c.currentTime + offset
      bass.forEach(([f, b]) => {
        this._schedNote(f, tb, b * beat * 0.8, 'sawtooth', 0.08)
        tb += b * beat
      })
      setTimeout(() => scheduleLoop(0), (loopBars - 0.1) * 1000)
    }
    scheduleLoop(0.05)
  }

  _playGym() {
    // More intense battle music, 170 BPM, minor key with added rhythm
    const c = this.ctx
    const bpm = 170
    const beat = 60 / bpm
    const M = { A2:110, A3:220, B3:246.9, C4:261.6, D4:293.7, E4:329.6, F4:349.2,
                 G4:392, A4:440, B4:493.9, C5:523.3, D5:587.3, E5:659.3,
                 D3:146.8, E3:164.8, G3:196 }
    const mel = [
      [M.E5,0.5],[M.D5,0.25],[M.C5,0.25],[M.B4,0.5],[M.A4,0.5],
      [M.G4,0.5],[M.F4,0.25],[M.E4,0.25],[M.D4,0.5],[M.E4,0.5],
      [M.A4,0.5],[M.A4,0.25],[M.B4,0.25],[M.C5,0.5],[M.D5,0.5],
      [M.E5,0.5],[M.E5,0.5],[M.A4,1],
    ]
    const bass = [
      [M.A2,0.25],[M.A2,0.25],[M.A3,0.25],[M.A2,0.25],
      [M.D3,0.25],[M.D3,0.25],[M.D3,0.25],[M.D3,0.25],
      [M.E3,0.25],[M.E3,0.25],[M.E3,0.25],[M.E3,0.25],
      [M.A2,0.25],[M.A2,0.25],[M.E3,0.25],[M.A2,0.25],
    ]
    const loopBars = 8 * beat
    const scheduleLoop = (offset) => {
      if (this._track !== 'gym') return
      let t = c.currentTime + offset
      mel.forEach(([f, b]) => {
        this._schedNote(f, t, b * beat * 0.82, 'square', 0.16)
        this._schedNote(f * 2, t, b * beat * 0.7, 'triangle', 0.04)
        t += b * beat
      })
      let tb = c.currentTime + offset
      bass.forEach(([f, b]) => {
        this._schedNote(f, tb, b * beat * 0.75, 'sawtooth', 0.1)
        tb += b * beat
      })
      setTimeout(() => scheduleLoop(0), (loopBars - 0.1) * 1000)
    }
    scheduleLoop(0.05)
  }

  _playVictory() {
    // Short triumphant fanfare ~6 seconds
    const c = this.ctx
    const bpm = 140
    const beat = 60 / bpm
    const M = { C4:261.6, E4:329.6, G4:392, C5:523.3, E5:659.3, G5:784,
                 A4:440, B4:493.9, D5:587.3, F5:698.5, G3:196 }
    const fanfare = [
      [M.C4,0.25],[M.C4,0.25],[M.C4,0.25],[M.C4,0.75],
      [M.C4,0.25],[M.E4,0.25],[M.G4,0.25],[M.C5,0.75],
      [M.G4,0.25],[M.E5,0.25],[M.C5,0.25],[M.E5,0.5],[M.G5,1.5],
    ]
    let t = c.currentTime + 0.05
    fanfare.forEach(([f, b]) => {
      this._schedNote(f, t, b * beat * 0.9, 'square', 0.2)
      this._schedNote(f * 0.5, t, b * beat * 0.85, 'triangle', 0.07)
      t += b * beat
    })
    this._track = null
  }

  _playDefeatBGM() {
    // Sad slow melody ~4 seconds
    const c = this.ctx
    const bpm = 70
    const beat = 60 / bpm
    const M = { A3:220, G3:196, F3:174.6, E3:164.8, D3:146.8, C3:130.8, B2:123.5 }
    const sad = [
      [M.A3,1],[M.G3,0.5],[M.F3,0.5],[M.E3,1],[M.D3,1],
      [M.C3,2],
    ]
    let t = c.currentTime + 0.05
    sad.forEach(([f, b]) => {
      this._schedNote(f, t, b * beat * 0.9, 'triangle', 0.15)
      t += b * beat
    })
    this._track = null
  }
}

export const SFX = new SoundEngine()
export const BGM = new BGMEngine()
