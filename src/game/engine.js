import { spr, sprBack, sprFallback, sprBackFallback, imgFallback, TYPE_COLORS, TYPE_ICONS, getTypeMultiplier } from './constants.js'
import { POKEMON, ENEMIES } from './pokemon.js'
import { Q_BANK } from './questions.js'
import { GYMS } from './gyms.js'
import { EVENTS, pickRandomEvent } from './events.js'
import { SFX } from './sound.js'
import { FX } from './fx.js'
import { loadBest, saveBest, loadSettings, saveSettings, saveAchievement, ACHIEVEMENT_DEFS, loadAchievements, loadGymProgress, saveGymProgress } from './storage.js'
import { shuffle, randInt, sleep } from './utils.js'

// Difficulty presets
const DIFFICULTY = {
  easy: { timerMult: 1.5, enemyScale: 0.7, maxDiffQ: 2, label: '简单', goalEnemies: 5 },
  normal: { timerMult: 1.0, enemyScale: 1.0, maxDiffQ: 3, label: '普通', goalEnemies: 5 },
  hard: { timerMult: 0.7, enemyScale: 1.4, maxDiffQ: 3, label: '困难', goalEnemies: 7 },
}

let fx
let usedQuestions = new Set()
let questionStartTime = 0

// Game state
let st = {
  player: null, enemy: null,
  pHP: 0, pMaxHP: 0, eHP: 0, eMaxHP: 0,
  round: 1, streak: 0, maxStreak: 0,
  correct: 0, wrong: 0, defeated: 0,
  curSkill: null, curQ: null, busy: false, selectedIdx: -1,
  timerIv: null, qBank: [],
  topicStats: {},
  statusEffects: { player: [], enemy: [] },
  difficulty: 'normal',
  goalEnemies: 5,
  paused: false,
  // Gym mode
  mode: 'quick', // 'quick' | 'gym'
  gymId: null,
  gymStep: 0, // 0..trainers-1 = trainers, trainers = leader
  gymData: null,
  isLeaderFight: false,
  _nextEnemyBuff: null,
  _nextEnemyReward: null,
}

// ===================================================================
// DOM helpers
// ===================================================================
const $ = id => document.getElementById(id)

function msg(t) { $('message-box').textContent = t }

function screenFlash(color) {
  const el = document.createElement('div')
  el.className = 'screen-flash'; el.style.background = color
  $('battle-bg').appendChild(el)
  setTimeout(() => el.remove(), 250)
}

function showDmg(target, amount, isHeal = false, isCrit = false, effClass = '') {
  const c = $('battle-bg')
  const el = document.createElement('div')
  let cls = 'damage-num'
  if (isHeal) cls += ' heal'
  else if (isCrit) cls += ' crit'
  else if (effClass) cls += ' ' + effClass
  el.className = cls
  el.textContent = (isHeal ? '+' : '-') + amount
  if (target === 'enemy') { el.style.right = '45px'; el.style.top = '25px' }
  else { el.style.left = '45px'; el.style.bottom = '75px' }
  c.appendChild(el)
  setTimeout(() => el.remove(), 1100)
}

function showMiss(target) {
  const c = $('battle-bg')
  const el = document.createElement('div')
  el.className = 'damage-num miss'
  el.textContent = 'MISS'
  if (target === 'enemy') { el.style.right = '55px'; el.style.top = '35px' }
  else { el.style.left = '55px'; el.style.bottom = '85px' }
  c.appendChild(el)
  setTimeout(() => el.remove(), 1100)
}

function showEffText(target, text, cls) {
  const c = $('battle-bg')
  const el = document.createElement('div')
  el.className = 'effectiveness-text ' + cls
  el.textContent = text
  if (target === 'enemy') { el.style.right = '30px'; el.style.top = '50px' }
  else { el.style.left = '30px'; el.style.bottom = '100px' }
  c.appendChild(el)
  setTimeout(() => el.remove(), 1500)
}

// Achievement notification
function showAchievementNotif(achId) {
  const def = ACHIEVEMENT_DEFS.find(a => a.id === achId)
  if (!def) return
  const el = document.createElement('div')
  el.className = 'achievement-notif'
  el.innerHTML = `<span class="ach-icon">${def.icon}</span><div><div class="ach-title">成就解锁!</div><div class="ach-name">${def.name}</div></div>`
  document.getElementById('game').appendChild(el)
  setTimeout(() => el.classList.add('show'), 10)
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300) }, 2500)
}

function tryAchievement(id) {
  if (saveAchievement(id)) {
    SFX.play('levelup')
    showAchievementNotif(id)
  }
}

// ===================================================================
// DIALOGUE SYSTEM
// ===================================================================
function showDialogue(speaker, avatar, lines, callback) {
  const overlay = $('dialogue-overlay')
  overlay.style.display = 'flex'
  $('dialogue-name').textContent = speaker
  $('dialogue-avatar').textContent = avatar
  let idx = 0

  function showLine() {
    if (idx >= lines.length) {
      overlay.style.display = 'none'
      overlay.onclick = null
      callback()
      return
    }
    $('dialogue-text').textContent = lines[idx]
    idx++
  }

  overlay.onclick = () => { SFX.play('select'); showLine() }
  showLine()
}

// ===================================================================
// EVENT POPUP SYSTEM
// ===================================================================
function showEventPopup(event) {
  return new Promise(resolve => {
    const overlay = $('event-overlay')
    overlay.style.display = 'flex'
    $('event-icon').textContent = event.icon
    $('event-name').textContent = event.name
    $('event-desc').textContent = event.desc

    const btn = $('event-btn')
    btn.textContent = event.isChallenge ? '接受挑战！' : '好的！'
    btn.onclick = () => {
      SFX.play('select')
      overlay.style.display = 'none'
      if (event.effect) event.effect(st)
      updateUI()
      resolve(event)
    }
  })
}

async function handleRandomEvent() {
  if (st.isLeaderFight) return
  if (Math.random() > 0.3) return

  const event = pickRandomEvent()

  if (event.isChallenge) {
    // Challenge event: show a bonus question
    event.desc = '一位神秘训练师提出挑战！答对回复25%HP，答错扣15%HP！'
    await showEventPopup(event)
    await handleChallengeQuestion()
    return
  }

  await showEventPopup(event)
}

function handleChallengeQuestion() {
  return new Promise(resolve => {
    const q = getQuestion()
    const opts = shuffle([q.a, ...q.w])

    $('skill-panel').style.display = 'none'
    const panel = $('question-panel')
    panel.style.display = 'flex'
    $('question-text').textContent = q.q
    $('explain-box').style.display = 'none'
    $('question-category').textContent = q.cat || '挑战'
    $('question-diff').textContent = '❓ 挑战'

    const grid = $('answer-grid'); grid.innerHTML = ''
    opts.forEach(opt => {
      const btn = document.createElement('button')
      btn.className = 'answer-btn'; btn.textContent = opt
      btn.onclick = () => {
        document.querySelectorAll('.answer-btn').forEach(b => { b.onclick = null })
        document.querySelectorAll('.answer-btn').forEach(b => {
          if (b.textContent === q.a) b.classList.add('correct')
          else if (b === btn && opt !== q.a) b.classList.add('wrong')
        })

        if (opt === q.a) {
          SFX.play('correct')
          const heal = Math.floor(st.pMaxHP * 0.25)
          st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
          msg(`答对了！恢复${heal}HP！`)
          tryAchievement('challenge_win')
        } else {
          SFX.play('wrong')
          const dmg = Math.floor(st.pMaxHP * 0.15)
          st.pHP = Math.max(1, st.pHP - dmg)
          msg(`答错了！失去${dmg}HP...`)
        }
        updateUI()

        setTimeout(() => {
          panel.style.display = 'none'
          $('skill-panel').style.display = 'grid'
          msg('选择技能！')
          resolve()
        }, 1200)
      }
      grid.appendChild(btn)
    })
  })
}

// ===================================================================
// SCREENS
// ===================================================================
export function showBestScore() {
  const b = loadBest()
  const el = $('best-score')
  if (b.defeated > 0) {
    el.innerHTML = `最佳记录: 击败<span>${b.defeated}</span> 连击<span>${b.streak}</span> 正确率<span>${b.accuracy}%</span>`
  } else {
    el.textContent = '尚无战绩记录'
  }

  // Show achievement count
  const achs = loadAchievements()
  const unlocked = Object.keys(achs).length
  const achEl = $('achievement-count')
  if (achEl) {
    achEl.textContent = `${unlocked}/${ACHIEVEMENT_DEFS.length}`
  }

  // Show badge case
  const badgeCase = $('badge-case')
  if (badgeCase) {
    const gymProg = loadGymProgress()
    badgeCase.innerHTML = ''
    GYMS.forEach(gym => {
      const slot = document.createElement('span')
      slot.className = 'badge-slot' + (gymProg.badges.includes(gym.id) ? ' earned' : '')
      slot.textContent = gym.leader.badge
      slot.title = gym.leader.badgeName
      badgeCase.appendChild(slot)
    })
  }
}

export function showSelectScreen() {
  SFX.init()
  SFX.play('select')
  st.mode = 'quick'

  // Read difficulty setting
  const settings = loadSettings()
  st.difficulty = settings.difficulty || 'normal'

  $('title-screen').style.display = 'none'
  $('gym-map-screen').style.display = 'none'
  $('select-screen').style.display = 'flex'
  const g = $('pokemon-grid'); g.innerHTML = ''
  POKEMON.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'pokemon-card'
    const cardImg = document.createElement('img')
    cardImg.src = spr(p.id)
    cardImg.alt = p.name
    imgFallback(cardImg, sprFallback(p.id))
    d.appendChild(cardImg)
    d.insertAdjacentHTML('beforeend', `<span class="name">${p.name}</span>
      <span class="type-badge" style="background:${TYPE_COLORS[p.type]}">${p.type}</span>
      <span class="stats-preview">HP:${p.hp}</span>`)
    d.onclick = () => { SFX.play('select'); selPoke(i) }
    g.appendChild(d)
  })

  // Difficulty selector - show in quick mode
  document.querySelector('.difficulty-selector').style.display = st.mode === 'quick' ? 'flex' : 'none'
  updateDifficultyUI()
}

// ===================================================================
// GYM MAP
// ===================================================================
export function showGymMap() {
  SFX.init()
  SFX.play('select')
  $('title-screen').style.display = 'none'
  $('gym-map-screen').style.display = 'flex'

  const gymProg = loadGymProgress()
  const list = $('gym-list')
  list.innerHTML = ''

  GYMS.forEach((gym, i) => {
    const isCleared = gymProg.badges.includes(gym.id)
    const isUnlocked = i === 0 || gymProg.badges.includes(GYMS[i - 1].id)

    const card = document.createElement('div')
    card.className = 'gym-card' + (isCleared ? ' cleared' : '') + (!isUnlocked ? ' locked' : '')
    card.innerHTML = `
      <div class="gym-badge">${gym.leader.badge}</div>
      <div class="gym-info">
        <div class="gym-name">${gym.id}. ${gym.name}</div>
        <div class="gym-topics">${gym.topics.join(' / ')}</div>
        <div class="gym-leader">馆主: ${gym.leader.name}</div>
      </div>
      <div class="gym-status">${isCleared ? '已通关' : isUnlocked ? '挑战' : '🔒'}</div>
    `

    if (isUnlocked && !isCleared) {
      card.onclick = () => selectGym(i)
    } else if (isCleared) {
      // Allow replay
      card.onclick = () => selectGym(i)
    }

    list.appendChild(card)
  })
}

function selectGym(gymIndex) {
  SFX.play('select')
  st.mode = 'gym'
  st.gymId = gymIndex
  st.gymData = GYMS[gymIndex]
  st.gymStep = 0
  st.isLeaderFight = false
  st.difficulty = 'normal' // Gym uses its own scaling

  $('gym-map-screen').style.display = 'none'
  $('select-screen').style.display = 'flex'

  const g = $('pokemon-grid'); g.innerHTML = ''
  POKEMON.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'pokemon-card'
    const cardImg = document.createElement('img')
    cardImg.src = spr(p.id)
    cardImg.alt = p.name
    imgFallback(cardImg, sprFallback(p.id))
    d.appendChild(cardImg)
    d.insertAdjacentHTML('beforeend', `<span class="name">${p.name}</span>
      <span class="type-badge" style="background:${TYPE_COLORS[p.type]}">${p.type}</span>
      <span class="stats-preview">HP:${p.hp}</span>`)
    d.onclick = () => { SFX.play('select'); selPoke(i) }
    g.appendChild(d)
  })

  // Hide difficulty selector in gym mode
  document.querySelector('.difficulty-selector').style.display = 'none'
  st.selectedIdx = -1
  $('confirm-btn').style.display = 'none'
}

export function backToTitle() {
  SFX.play('select')
  $('gym-map-screen').style.display = 'none'
  $('select-screen').style.display = 'none'
  $('title-screen').style.display = 'flex'
  showBestScore()
}

function updateDifficultyUI() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === st.difficulty)
  })
}

export function setDifficulty(diff) {
  st.difficulty = diff
  const settings = loadSettings()
  settings.difficulty = diff
  saveSettings(settings)
  updateDifficultyUI()
  SFX.play('select')
}

function selPoke(i) {
  st.selectedIdx = i
  document.querySelectorAll('.pokemon-card').forEach((c, j) => c.classList.toggle('selected', j === i))
  $('confirm-btn').style.display = 'block'
}

// ===================================================================
// BATTLE INIT
// ===================================================================
export function startBattle() {
  if (st.selectedIdx < 0) return
  SFX.play('select')
  st.player = { ...POKEMON[st.selectedIdx] }
  st.pHP = st.player.hp; st.pMaxHP = st.player.hp
  st.round = 1; st.streak = 0; st.maxStreak = 0
  st.correct = 0; st.wrong = 0; st.defeated = 0; st.busy = false
  st.topicStats = {}
  st.statusEffects = { player: [], enemy: [] }
  st._nextEnemyBuff = null
  st._nextEnemyReward = null
  usedQuestions = new Set()

  if (st.mode === 'gym') {
    // Gym mode: filter questions by gym topics
    const gymQ = Q_BANK.filter(q => st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
    // If not enough questions, also include some unfiltered ones
    const extra = Q_BANK.filter(q => !st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
    st.qBank = shuffle([...gymQ, ...gymQ, ...extra.slice(0, 10)]) // double gym questions + some extra
    st.goalEnemies = st.gymData.trainers + 1 // trainers + leader
  } else {
    const diff = DIFFICULTY[st.difficulty]
    st.qBank = shuffle([...Q_BANK])
    st.goalEnemies = diff.goalEnemies
  }

  // Track used Pokemon for achievement
  const settings = loadSettings()
  if (!settings.usedPokemon.includes(st.player.id)) {
    settings.usedPokemon.push(st.player.id)
    saveSettings(settings)
  }
  if (settings.usedPokemon.length >= POKEMON.length) {
    tryAchievement('all_pokemon')
  }

  $('select-screen').style.display = 'none'
  $('battle-scene').style.display = 'flex'

  const canvas = $('fx-canvas')
  fx = new FX(canvas); fx.resize()
  window.onresize = () => fx && fx.resize()

  $('player-name').textContent = st.player.name
  const playerSpr = $('player-sprite')
  playerSpr.src = sprBack(st.player.id)
  imgFallback(playerSpr, sprBackFallback(st.player.id))

  if (st.mode === 'gym') {
    // Show gym intro dialogue
    $('difficulty-badge').textContent = st.gymData.name
    spawnEnemy()
    renderSkills()
    updateUI()
    showDialogue('旁白', '📖', st.gymData.intro, () => {
      msg(`${st.player.name}，就决定是你了！`)
    })
  } else {
    const diff = DIFFICULTY[st.difficulty]
    $('difficulty-badge').textContent = diff.label
    spawnEnemy()
    renderSkills()
    updateUI()
    msg(`${st.player.name}，就决定是你了！`)
  }
}

function spawnEnemy() {
  // Check if this is the gym leader fight
  if (st.mode === 'gym' && st.gymStep >= st.gymData.trainers) {
    spawnGymLeader()
    return
  }

  if (st.mode === 'gym') {
    // Spawn a gym trainer - use enemies matching gym type, or random
    const gymTypes = st.gymData.enemyTypes || []
    let pool = ENEMIES.filter(e => gymTypes.includes(e.type))
    if (pool.length === 0) pool = ENEMIES
    const base = pool[randInt(0, pool.length - 1)]
    const lv = Math.min(5 + st.round * 3, 50)
    const scale = (0.8 + st.round * 0.3) * st.gymData.trainerScale
    let maxHP = Math.floor(80 * scale)

    // Apply buff from event
    if (st._nextEnemyBuff) {
      maxHP = Math.floor(maxHP * st._nextEnemyBuff)
    }

    st.enemy = { ...base, lv, atkPow: Math.floor((base.atk + st.round * 2) * st.gymData.trainerScale) }
    st.eHP = maxHP; st.eMaxHP = maxHP
  } else {
    const diff = DIFFICULTY[st.difficulty]
    const base = ENEMIES[randInt(0, ENEMIES.length - 1)]
    const lv = Math.min(5 + st.round * 3, 50)
    const scale = (0.8 + st.round * 0.3) * diff.enemyScale
    let maxHP = Math.floor(80 * scale)

    if (st._nextEnemyBuff) {
      maxHP = Math.floor(maxHP * st._nextEnemyBuff)
    }

    st.enemy = { ...base, lv, atkPow: Math.floor((base.atk + st.round * 2) * diff.enemyScale) }
    st.eHP = maxHP; st.eMaxHP = maxHP
  }

  st.statusEffects.enemy = []
  st.isLeaderFight = false

  $('enemy-name').textContent = st.enemy.name
  $('enemy-level').textContent = `Lv.${st.enemy.lv}`
  const eSprite = $('enemy-sprite')
  eSprite.src = spr(st.enemy.id)
  imgFallback(eSprite, sprFallback(st.enemy.id))
  eSprite.className = 'enemy-pokemon enter-anim'
  setTimeout(() => eSprite.classList.remove('enter-anim'), 400)
  $('level-indicator').textContent = st.mode === 'gym' ? `训练师 ${st.gymStep + 1}/${st.gymData.trainers}` : `ROUND ${st.round}`
  $('player-level').textContent = `Lv.${5 + st.defeated * 3}`
}

function spawnGymLeader() {
  st.isLeaderFight = true
  const leader = st.gymData.leader
  const pk = leader.pokemon

  st.enemy = {
    name: pk.name, id: pk.id, type: pk.type, lv: pk.lv,
    atkPow: pk.atkPow,
    leaderName: leader.name,
    leaderSkills: leader.skills,
  }
  st.eHP = pk.hp; st.eMaxHP = pk.hp
  st.statusEffects.enemy = []

  $('enemy-name').textContent = `${leader.name}的${pk.name}`
  $('enemy-level').textContent = `Lv.${pk.lv}`
  const eSprite = $('enemy-sprite')
  eSprite.src = spr(pk.id)
  imgFallback(eSprite, sprFallback(pk.id))
  eSprite.className = 'enemy-pokemon enter-anim'
  setTimeout(() => eSprite.classList.remove('enter-anim'), 400)
  $('level-indicator').textContent = '馆主战！'
  $('player-level').textContent = `Lv.${5 + st.defeated * 3}`

  // Show leader pre-battle dialogue, then allow fighting
  showDialogue(leader.name, leader.avatar, leader.preBattle, () => {
    msg(`馆主${leader.name}发起了挑战！`)
  })
}

// ===================================================================
// UI
// ===================================================================
function updateUI() {
  const pp = Math.max(0, st.pHP / st.pMaxHP * 100)
  const pb = $('player-hp-bar')
  pb.style.width = pp + '%'
  pb.style.backgroundColor = pp > 50 ? 'var(--hp-green)' : pp > 20 ? 'var(--hp-yellow)' : 'var(--hp-red)'
  $('player-hp-text').textContent = `${Math.max(0, st.pHP)}/${st.pMaxHP}`

  const ep = Math.max(0, st.eHP / st.eMaxHP * 100)
  const eb = $('enemy-hp-bar')
  eb.style.width = ep + '%'
  eb.style.backgroundColor = ep > 50 ? 'var(--hp-green)' : ep > 20 ? 'var(--hp-yellow)' : 'var(--hp-red)'
  $('enemy-hp-text').textContent = `${Math.max(0, st.eHP)}/${st.eMaxHP}`

  const si = $('streak-indicator')
  if (st.streak >= 2) { si.style.display = 'block'; si.textContent = `🔥 x${st.streak}` }
  else si.style.display = 'none'

  $('exp-bar').style.width = (Math.min(st.defeated, st.goalEnemies) / st.goalEnemies * 100) + '%'

  $('player-status').innerHTML =
    st.statusEffects.player.map(s => `<span class="status-icon">${s.icon}</span>`).join('')
  $('enemy-status').innerHTML =
    st.statusEffects.enemy.map(s => `<span class="status-icon">${s.icon}</span>`).join('')
}

function renderSkills() {
  const panel = $('skill-panel')
  panel.innerHTML = ''
  st.player.skills.forEach((sk, i) => {
    const btn = document.createElement('button')
    btn.className = 'skill-btn'
    const icon = TYPE_ICONS[sk.type] || '💥'
    btn.innerHTML = `<span class="skill-icon">${icon}</span><span class="skill-name"><span class="skill-type-dot" style="background:${TYPE_COLORS[sk.type]}"></span>${sk.name}</span><span class="skill-dmg">威力${sk.power} 命中${sk.acc}</span>`
    btn.onclick = () => useSkill(i)
    panel.appendChild(btn)
  })
}

// ===================================================================
// QUESTION SELECTION
// ===================================================================
function getQuestion() {
  const diff = DIFFICULTY[st.difficulty]

  let maxDiff
  if (st.mode === 'gym') {
    maxDiff = st.gymData.maxDiff
  } else {
    if (st.round <= 2) maxDiff = Math.min(1, diff.maxDiffQ)
    else if (st.round <= 3) maxDiff = Math.min(2, diff.maxDiffQ)
    else maxDiff = diff.maxDiffQ
  }

  const eligible = []
  for (let i = 0; i < st.qBank.length; i++) {
    if (!usedQuestions.has(i) && (st.qBank[i].diff || 1) <= maxDiff) {
      eligible.push(i)
    }
  }

  if (eligible.length === 0) {
    for (let i = 0; i < st.qBank.length; i++) {
      if (!usedQuestions.has(i)) eligible.push(i)
    }
  }

  if (eligible.length === 0) {
    usedQuestions.clear()
    if (st.mode === 'gym') {
      const gymQ = Q_BANK.filter(q => st.gymData.topics.includes(q.cat))
      st.qBank = shuffle([...gymQ, ...gymQ])
    } else {
      st.qBank = shuffle([...Q_BANK])
    }
    usedQuestions.add(0)
    return st.qBank[0]
  }

  const idx = eligible[randInt(0, eligible.length - 1)]
  usedQuestions.add(idx)
  return st.qBank[idx]
}

// ===================================================================
// BATTLE FLOW
// ===================================================================
function useSkill(idx) {
  if (st.busy) return
  SFX.play('select')
  st.curSkill = st.player.skills[idx]
  msg(`${st.player.name}使用${st.curSkill.name}！答对才能命中！`)
  showQuestion()
}

function showQuestion() {
  st.busy = true
  const q = getQuestion()
  const opts = shuffle([q.a, ...q.w])
  st.curQ = { text: q.q, answer: q.a, options: opts, cat: q.cat || '其他', diff: q.diff || 1, exp: q.exp || '' }

  $('skill-panel').style.display = 'none'
  const panel = $('question-panel')
  panel.style.display = 'flex'
  $('question-text').textContent = q.q
  $('explain-box').style.display = 'none'

  const catEl = $('question-category')
  catEl.textContent = st.curQ.cat
  const diffEl = $('question-diff')
  const stars = '★'.repeat(st.curQ.diff) + '☆'.repeat(3 - st.curQ.diff)
  diffEl.textContent = stars

  const grid = $('answer-grid'); grid.innerHTML = ''
  opts.forEach((opt, i) => {
    const btn = document.createElement('button')
    btn.className = 'answer-btn'; btn.textContent = opt
    btn.onclick = () => submitAnswer(opt, btn)
    grid.appendChild(btn)
  })
  questionStartTime = Date.now()
  startTimer()
}

function startTimer() {
  const diff = DIFFICULTY[st.difficulty]
  const timerMult = st.mode === 'gym' ? 1.0 : diff.timerMult
  const baseDur = (st.curQ.diff === 3 ? 25 : st.curQ.diff === 2 ? 20 : 15) * timerMult
  const bar = $('timer-bar')
  const con = $('timer-container')
  con.style.display = 'block'; bar.style.width = '100%'
  bar.classList.remove('timer-pulse')
  clearInterval(st.timerIv)
  const t0 = Date.now()
  st.timerIv = setInterval(() => {
    const rem = Math.max(0, baseDur - (Date.now() - t0) / 1000)
    bar.style.width = (rem / baseDur * 100) + '%'
    if (rem <= baseDur * 0.3) {
      bar.style.backgroundColor = '#ef4444'
      bar.classList.add('timer-pulse')
    } else {
      bar.style.backgroundColor = '#6366f1'
      bar.classList.remove('timer-pulse')
    }
    if (rem <= 0) { clearInterval(st.timerIv); onWrong() }
  }, 50)
}

function submitAnswer(chosen, btn) {
  if (!st.busy) return
  clearInterval(st.timerIv)
  $('timer-container').style.display = 'none'
  document.querySelectorAll('.answer-btn').forEach(b => { b.onclick = null })
  document.querySelectorAll('.answer-btn').forEach(b => {
    if (b.textContent === st.curQ.answer) b.classList.add('correct')
    else if (b === btn && chosen !== st.curQ.answer) b.classList.add('wrong')
  })

  const topic = st.curQ.cat
  if (!st.topicStats[topic]) st.topicStats[topic] = { correct: 0, total: 0 }
  st.topicStats[topic].total++

  if (chosen === st.curQ.answer) {
    st.topicStats[topic].correct++
    // Check speed achievement
    const elapsed = (Date.now() - questionStartTime) / 1000
    if (elapsed < 3 && st.curQ.diff === 3) {
      tryAchievement('speed_demon')
    }
    onCorrect()
  } else {
    onWrong(chosen !== undefined)
  }
}

async function onCorrect() {
  st.correct++; st.streak++
  if (st.streak > st.maxStreak) st.maxStreak = st.streak
  SFX.play('correct')

  // Streak achievements
  if (st.streak >= 5) tryAchievement('streak_5')
  if (st.streak >= 10) tryAchievement('streak_10')

  const sk = st.curSkill
  const hit = Math.random() * 100 < sk.acc
  if (!hit) {
    msg(`${st.player.name}的${sk.name}没有命中！`)
    await sleep(400)
    fx.resize()
    showMiss('enemy')
    await sleep(700)
    endTurn(); return
  }

  let streakBonus = 1
  if (st.streak >= 5) streakBonus = 1.5
  else if (st.streak >= 3) streakBonus = 1.3

  const diffBonus = 1 + (st.curQ.diff - 1) * 0.15
  const typeMultiplier = getTypeMultiplier(sk.type, st.enemy.type)

  let dmg = Math.floor(sk.power * streakBonus * diffBonus * typeMultiplier)

  // Heal-only skill (like Snorlax's Rest)
  if (sk.healFlat && sk.power === 0) {
    const h = sk.healFlat
    st.pHP = Math.min(st.pMaxHP, st.pHP + h)
    msg(`${st.player.name}恢复了${h}点HP！`)
    fx.resize()
    const pe = $('player-sprite')
    const pr = pe.getBoundingClientRect()
    const br = $('battle-bg').getBoundingClientRect()
    fx.heal(pr.left - br.left + pr.width / 2, pr.top - br.top + pr.height / 2)
    showDmg('player', h, true)
    updateUI()
    await sleep(700)
    endTurn(); return
  }

  const isCrit = Math.random() < 0.15
  if (isCrit) dmg = Math.floor(dmg * 1.5)

  const atkBuff = st.statusEffects.player.find(s => s.type === 'atk_up')
  if (atkBuff) dmg = Math.floor(dmg * 1.3)
  const defDebuff = st.statusEffects.enemy.find(s => s.type === 'def_down')
  if (defDebuff) dmg = Math.floor(dmg * 1.2)

  let texts = []
  if (isCrit) texts.push('暴击！')
  if (st.streak >= 3) texts.push(`连击x${st.streak}！`)
  if (typeMultiplier > 1) texts.push('效果拔群！')
  else if (typeMultiplier < 1 && typeMultiplier > 0) texts.push('效果一般...')
  else if (typeMultiplier === 0) texts.push('没有效果！')

  msg(`答对了！${sk.name}命中！${texts.join(' ')}`)

  await sleep(350)
  fx.resize()

  if (sk.power >= 60) {
    const pe = $('player-sprite')
    const pr = pe.getBoundingClientRect()
    const br = $('battle-bg').getBoundingClientRect()
    pe.classList.add('charge-anim')
    SFX.play('charge')
    fx.charge(pr.left - br.left + pr.width / 2, pr.top - br.top + pr.height / 2)
    await sleep(550)
    pe.classList.remove('charge-anim')
  }

  if (typeMultiplier === 0) {
    showMiss('enemy')
    await sleep(700)
    endTurn(); return
  }

  await playAtk(true)
  SFX.play(isCrit ? 'crit' : 'hit')

  const ee = $('enemy-sprite')
  const er = ee.getBoundingClientRect()
  const br2 = $('battle-bg').getBoundingClientRect()
  const ex = er.left - br2.left + er.width / 2, ey = er.top - br2.top + er.height / 2

  fx.typeFX(sk.type, ex, ey)
  if (typeMultiplier > 1) fx.burst(ex, ey, 20, ['#fbbf24', '#fff'], { sp: 5, sz: 5 })
  if (sk.power >= 50) screenFlash(TYPE_COLORS[sk.type] || '#fff')
  if (sk.power >= 60) {
    fx.beam(br2.width * 0.25, br2.height * 0.7, ex, ey,
      [TYPE_COLORS[sk.type] || '#fff', '#fff'], 20)
  }

  if (typeMultiplier > 1) showEffText('enemy', '效果拔群！', 'super')
  else if (typeMultiplier < 1) showEffText('enemy', '效果一般...', 'resist')

  st.eHP = Math.max(0, st.eHP - dmg)
  showDmg('enemy', dmg, false, isCrit, typeMultiplier > 1 ? 'super' : typeMultiplier < 1 ? 'resist' : '')
  updateUI()

  if (sk.heal) {
    const h = Math.floor(dmg * 0.5)
    st.pHP = Math.min(st.pMaxHP, st.pHP + h)
    const pe2 = $('player-sprite')
    const pr2 = pe2.getBoundingClientRect()
    fx.heal(pr2.left - br2.left + pr2.width / 2, pr2.top - br2.top + pr2.height / 2)
    showDmg('player', h, true)
    updateUI()
  }

  if (st.streak === 3 && !st.statusEffects.player.find(s => s.type === 'atk_up')) {
    st.statusEffects.player.push({ type: 'atk_up', icon: '⚔️', turns: 3 })
    updateUI()
  }
  if (st.streak === 5 && !st.statusEffects.enemy.find(s => s.type === 'def_down')) {
    st.statusEffects.enemy.push({ type: 'def_down', icon: '🔻', turns: 3 })
    updateUI()
  }

  if (st.eHP <= 0) { await sleep(400); await enemyDefeated(); return }
  await sleep(500)
  endTurn()
}

async function onWrong(showExplain = false) {
  st.wrong++; st.streak = 0
  SFX.play('wrong')
  updateUI()

  if (showExplain && st.curQ) {
    const explainEl = $('explain-box')
    explainEl.style.display = 'block'
    const expText = st.curQ.exp ? ` — ${st.curQ.exp}` : ''
    explainEl.textContent = `正确答案: ${st.curQ.answer}${expText}`
    await sleep(1500)
    explainEl.style.display = 'none'
  }

  // Leader uses named skill in attack message
  if (st.isLeaderFight && st.enemy.leaderSkills) {
    const sk = st.enemy.leaderSkills[randInt(0, st.enemy.leaderSkills.length - 1)]
    msg(`${st.enemy.leaderName}的${st.enemy.name}使用${sk.name}！`)
  } else {
    msg(`答错了！${st.enemy.name}发动攻击！`)
  }

  await sleep(400)
  await playAtk(false)
  SFX.play('hit')

  fx.resize()
  const pe = $('player-sprite')
  const pr = pe.getBoundingClientRect()
  const br = $('battle-bg').getBoundingClientRect()
  const px = pr.left - br.left + pr.width / 2, py = pr.top - br.top + pr.height / 2

  const enemyTypeMulti = getTypeMultiplier(st.enemy.type, st.player.type)
  fx.typeFX(st.enemy.type, px, py)
  if (enemyTypeMulti > 1) showEffText('player', '效果拔群！', 'super')

  let dmg = st.enemy.atkPow + randInt(0, 5)
  dmg = Math.floor(dmg * enemyTypeMulti)

  const defBuff = st.statusEffects.player.find(s => s.type === 'def_up')
  if (defBuff) dmg = Math.floor(dmg * 0.7)

  st.pHP = Math.max(0, st.pHP - dmg)
  showDmg('player', dmg)
  updateUI()

  if (st.pHP <= 0) { await sleep(400); showResult(false); return }
  await sleep(500)
  endTurn()
}

async function enemyDefeated() {
  st.defeated++; st.round++; st.gymStep++
  SFX.play('defeat')
  const el = $('enemy-sprite')
  el.classList.add('faint-anim')

  fx.resize()
  const er = el.getBoundingClientRect()
  const br = $('battle-bg').getBoundingClientRect()
  fx.burst(er.left - br.left + er.width / 2, er.top - br.top + er.height / 2,
    30, ['#fbbf24', '#fff', '#f97316'], { sp: 4, sz: 4, dk: 0.015 })

  // Update total defeated
  const settings = loadSettings()
  settings.totalDefeated = (settings.totalDefeated || 0) + 1
  saveSettings(settings)
  if (settings.totalDefeated >= 10) tryAchievement('defeat_10')
  if (settings.totalDefeated >= 50) tryAchievement('defeat_50')

  // Check for buffed enemy reward
  if (st._nextEnemyReward) {
    const heal = Math.floor(st.pMaxHP * st._nextEnemyReward)
    st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
    msg(`击败强敌！额外恢复${heal}HP！`)
    st._nextEnemyBuff = null
    st._nextEnemyReward = null
    updateUI()
    await sleep(800)
  } else {
    msg(`${st.enemy.name}被击败了！`)
    await sleep(900)
  }

  // Gym leader defeated
  if (st.isLeaderFight && st.mode === 'gym') {
    await gymLeaderDefeated()
    return
  }

  // Check win in quick mode or gym all enemies done
  if (st.defeated >= st.goalEnemies) { showResult(true); return }

  // Random event between battles
  el.classList.remove('faint-anim')
  el.style.opacity = '1'; el.style.transform = ''
  await handleRandomEvent()

  // Heal between rounds
  const heal = Math.floor(st.pMaxHP * 0.2)
  st.pHP = Math.min(st.pMaxHP, st.pHP + heal)

  if (!st.statusEffects.player.find(s => s.type === 'def_up')) {
    st.statusEffects.player.push({ type: 'def_up', icon: '🛡️', turns: 2 })
  }

  spawnEnemy()
  updateUI()

  if (st.isLeaderFight) {
    // Leader dialogue already shown in spawnGymLeader
  } else {
    msg(`野生的${st.enemy.name}出现了！(+${heal}HP)`)
  }
  await sleep(700)
  endTurn()
}

async function gymLeaderDefeated() {
  const leader = st.gymData.leader

  // Save badge
  const gymProg = loadGymProgress()
  if (!gymProg.badges.includes(st.gymData.id)) {
    gymProg.badges.push(st.gymData.id)
    saveGymProgress(gymProg)
  }

  // Check badge achievements
  if (gymProg.badges.length >= 1) tryAchievement('first_badge')
  if (gymProg.badges.length >= 4) tryAchievement('four_badges')
  if (gymProg.badges.length >= 8) tryAchievement('all_badges')

  // Show post-defeat dialogue
  showDialogue(leader.name, leader.avatar, leader.postDefeat, () => {
    showResult(true)
  })
}

function endTurn() {
  st.busy = false
  $('question-panel').style.display = 'none'
  $('skill-panel').style.display = 'grid'
  $('explain-box').style.display = 'none'

  ;['player', 'enemy'].forEach(side => {
    st.statusEffects[side] = st.statusEffects[side].filter(s => {
      s.turns--
      return s.turns > 0
    })
  })

  msg('选择技能！')
  updateUI()
}

// ===================================================================
// ANIMATIONS
// ===================================================================
async function playAtk(isPlayer) {
  return new Promise(res => {
    if (isPlayer) {
      const e = $('player-sprite')
      e.classList.add('atk-right')
      setTimeout(() => {
        e.classList.remove('atk-right')
        const t = $('enemy-sprite')
        t.classList.add('hit-anim')
        setTimeout(() => t.classList.remove('hit-anim'), 450)
        res()
      }, 220)
    } else {
      const e = $('enemy-sprite')
      e.classList.add('atk-left')
      setTimeout(() => {
        e.classList.remove('atk-left')
        const t = $('player-sprite')
        t.classList.add('hit-anim')
        setTimeout(() => t.classList.remove('hit-anim'), 450)
        res()
      }, 220)
    }
  })
}

// ===================================================================
// RESULT
// ===================================================================
function showResult(win) {
  clearInterval(st.timerIv); st.busy = true
  if (win) {
    tryAchievement('first_win')
    if (st.wrong === 0) tryAchievement('perfect')
    SFX.play('levelup')
  } else {
    SFX.play('gameover')
  }

  const s = $('result-screen')
  s.style.display = 'flex'; s.className = win ? 'victory' : 'defeat'
  $('result-emoji').textContent = win ? '🏆' : '💀'

  // Badge earned display for gym mode
  const badgeEl = $('badge-earned')
  if (st.mode === 'gym' && win && st.gymData) {
    badgeEl.style.display = 'block'
    badgeEl.innerHTML = `<span class="badge-icon">${st.gymData.leader.badge}</span>获得${st.gymData.leader.badgeName}！`
    $('result-title').textContent = `${st.gymData.name}通关！`
  } else {
    badgeEl.style.display = 'none'
    $('result-title').textContent = win ? '胜利！' : '战斗结束...'
  }

  const tot = st.correct + st.wrong
  const accuracy = tot > 0 ? Math.round(st.correct / tot * 100) : 0

  // Animate stats counting up
  animateStatCount('stat-correct', st.correct)
  animateStatCount('stat-wrong', st.wrong)
  animateStatCount('stat-accuracy', accuracy, '%')
  animateStatCount('stat-streak', st.maxStreak)
  animateStatCount('stat-defeated', st.defeated)

  // Topic breakdown
  const topicDiv = $('topic-stats')
  topicDiv.innerHTML = ''
  const topics = Object.keys(st.topicStats).sort()
  topics.forEach(t => {
    const ts = st.topicStats[t]
    const pct = ts.total > 0 ? Math.round(ts.correct / ts.total * 100) : 0
    const row = document.createElement('div')
    row.className = 'topic-row'
    row.innerHTML = `<span>${t}</span><div class="topic-bar"><div class="topic-bar-fill" style="width:${pct}%;background:${pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444'}"></div></div><span>${ts.correct}/${ts.total}</span>`
    topicDiv.appendChild(row)
  })

  // Show unlocked achievements
  const achDiv = $('result-achievements')
  if (achDiv) {
    const achs = loadAchievements()
    achDiv.innerHTML = ''
    ACHIEVEMENT_DEFS.forEach(def => {
      const unlocked = achs[def.id]
      const el = document.createElement('span')
      el.className = 'result-ach' + (unlocked ? ' unlocked' : '')
      el.title = `${def.name}: ${def.desc}`
      el.textContent = def.icon
      achDiv.appendChild(el)
    })
  }

  // Check & save best (only for quick mode)
  if (st.mode === 'quick') {
    const best = loadBest()
    let isNewRecord = false
    if (st.defeated > best.defeated || (st.defeated === best.defeated && accuracy > best.accuracy)) {
      isNewRecord = true
      saveBest({ defeated: st.defeated, streak: st.maxStreak, accuracy })
    } else if (st.maxStreak > best.streak) {
      best.streak = st.maxStreak
      saveBest(best)
    }

    const nrEl = $('new-record')
    if (isNewRecord) {
      nrEl.style.display = 'block'
      nrEl.textContent = '🎉 新纪录！'
    } else {
      nrEl.style.display = 'none'
    }
  } else {
    $('new-record').style.display = 'none'
  }
}

function animateStatCount(id, target, suffix = '') {
  const el = $(id)
  let current = 0
  const duration = 600
  const step = target / (duration / 16)
  if (target === 0) { el.textContent = '0' + suffix; return }
  const timer = setInterval(() => {
    current += step
    if (current >= target) {
      current = target
      clearInterval(timer)
    }
    el.textContent = Math.round(current) + suffix
  }, 16)
}

export function restartGame() {
  $('result-screen').style.display = 'none'
  $('battle-scene').style.display = 'none'
  $('select-screen').style.display = 'none'
  $('gym-map-screen').style.display = 'none'
  $('title-screen').style.display = 'flex'
  st.selectedIdx = -1
  st.mode = 'quick'
  st.gymData = null
  st.isLeaderFight = false
  if (fx) fx.clear()
  showBestScore()
}

// ===================================================================
// KEYBOARD SUPPORT
// ===================================================================
export function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (st.paused) return
    // Answer keys 1-4
    if (['1', '2', '3', '4'].includes(e.key)) {
      const btns = document.querySelectorAll('.answer-btn')
      const idx = parseInt(e.key) - 1
      if (btns[idx]) btns[idx].click()
    }
    // Skill keys 1-4 (when skill panel is visible)
    const skillPanel = $('skill-panel')
    if (skillPanel && skillPanel.style.display !== 'none') {
      const skillBtns = skillPanel.querySelectorAll('.skill-btn')
      if (e.key === 'q' || e.key === 'Q') skillBtns[0]?.click()
      if (e.key === 'w' || e.key === 'W') skillBtns[1]?.click()
      if (e.key === 'a' || e.key === 'A') skillBtns[2]?.click()
      if (e.key === 's' || e.key === 'S') skillBtns[3]?.click()
    }
  })
}

// ===================================================================
// INIT TITLE SPRITES
// ===================================================================
export function initTitleSprites() {
  document.querySelectorAll('#title-sprites img').forEach(img => {
    const id = img.dataset.id
    img.src = spr(id)
    imgFallback(img, sprFallback(id))
  })
}
