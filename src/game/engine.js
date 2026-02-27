import { spr, sprBack, sprFallback, sprBackFallback, imgFallback, TYPE_COLORS, TYPE_ICONS, getTypeMultiplier } from './constants.js'
import { POKEMON, ENEMIES } from './pokemon.js'
import { Q_BANK } from './questions.js'
import { GYMS } from './gyms.js'
import { EVENTS, pickRandomEvent } from './events.js'
import { SFX } from './sound.js'
import { FX } from './fx.js'
import { loadBest, saveBest, loadSettings, saveSettings, saveAchievement, ACHIEVEMENT_DEFS, loadAchievements, loadGymProgress, saveGymProgress, getEndlessHighScore, setEndlessHighScore, loadStats, saveStats, calcTrainerEXP, getTrainerRank, TRAINER_RANKS, POKEMON_UNLOCK_MAP, getUnlockedPokemon, getLastSeenRank, setLastSeenRank } from './storage.js'
import { shuffle, randInt, sleep } from './utils.js'

// BGM integration - will be set if bgm.js is available
let BGM = null
export function setBGM(bgmObj) { BGM = bgmObj }

// Difficulty presets
const DIFFICULTY = {
  easy: { timerMult: 1.5, enemyScale: 0.7, maxDiffQ: 2, label: '简单', goalEnemies: 5 },
  normal: { timerMult: 1.0, enemyScale: 1.0, maxDiffQ: 3, label: '普通', goalEnemies: 5 },
  hard: { timerMult: 0.6, enemyScale: 1.5, maxDiffQ: 3, label: '困难', goalEnemies: 10 },
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
  timerIv: null, skillTimerIv: null, qBank: [],
  topicStats: {},
  statusEffects: { player: [], enemy: [] },
  difficulty: 'normal',
  goalEnemies: 5,
  // Gym mode
  mode: 'quick', // 'quick' | 'gym' | 'endless'
  gymId: null,
  gymStep: 0,
  gymData: null,
  isLeaderFight: false,
  _nextEnemyBuff: null,
  _nextEnemyReward: null,
  // Team system
  team: [], // [{pokemon, hp, maxHp, evolved, killCount}, ...]
  activeIdx: 0,
  selectedTeam: [], // indices into POKEMON during selection
  // Endless mode
  wave: 0,
  endlessScore: 0,
  // Evolution
  _evolvedThisBattle: new Set(),
  // Type tracking
  _allSuperEffective: true,
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
  el.textContent = '未命中'
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

function bgmPlay(track) {
  try { if (BGM) BGM.play(track) } catch (e) { /* ignore */ }
}
function bgmStop() {
  try { if (BGM) BGM.stop() } catch (e) { /* ignore */ }
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

  function finish() {
    overlay.style.display = 'none'
    overlay.onclick = null
    const skipBtn = $('dialogue-skip')
    if (skipBtn) skipBtn.onclick = null
    callback()
  }

  function showLine() {
    if (idx >= lines.length) { finish(); return }
    $('dialogue-text').textContent = lines[idx]
    idx++
  }

  overlay.onclick = () => { SFX.play('select'); showLine() }
  const skipBtn = $('dialogue-skip')
  if (skipBtn) skipBtn.onclick = (e) => { e.stopPropagation(); SFX.play('select'); finish() }
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

    function dismiss() {
      SFX.play('select')
      overlay.style.display = 'none'
      document.removeEventListener('keydown', onKey)
      if (event.effect) event.effect(st)
      syncTeamHP()
      updateUI()
      resolve(event)
    }

    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss() }
    }

    const btn = $('event-btn')
    btn.textContent = event.isChallenge ? '接受挑战！' : '好的！'
    btn.onclick = dismiss
    document.addEventListener('keydown', onKey)
  })
}

async function handleRandomEvent() {
  if (st.isLeaderFight) return
  if (Math.random() > 0.3) return

  const event = pickRandomEvent()

  if (event.isChallenge) {
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
    $('switch-btn').style.display = 'none'
    const panel = $('question-panel')
    panel.style.display = 'flex'
    $('question-text').textContent = q.q
    $('explain-box').style.display = 'none'
    $('question-category').textContent = q.cat || '挑战'
    $('question-diff').textContent = '? 挑战'

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

        // Track challenge question stats
        const cgs = loadStats()
        cgs.totalQuestions++
        if (opt === q.a) cgs.totalCorrect++
        saveStats(cgs)

        if (opt === q.a) {
          SFX.play('correct')
          const heal = Math.floor(st.pMaxHP * 0.25)
          st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
          syncTeamHP()
          msg(`答对了！恢复${heal}HP！`)
          tryAchievement('challenge_win')
        } else {
          SFX.play('wrong')
          const dmg = Math.floor(st.pMaxHP * 0.15)
          st.pHP = Math.max(1, st.pHP - dmg)
          syncTeamHP()
          msg(`答错了！失去${dmg}HP...`)
        }
        updateUI()

        setTimeout(() => {
          panel.style.display = 'none'
          $('skill-panel').style.display = 'grid'
          showSwitchBtn()
          msg('选择技能！')
          resolve()
        }, 1200)
      }
      grid.appendChild(btn)
    })
  })
}

// ===================================================================
// TEAM HELPERS
// ===================================================================
function syncTeamHP() {
  if (st.team.length > 0 && st.team[st.activeIdx]) {
    st.team[st.activeIdx].hp = st.pHP
    st.team[st.activeIdx].maxHp = st.pMaxHP
  }
}

function loadActiveFromTeam() {
  const m = st.team[st.activeIdx]
  if (!m) return
  st.player = m.pokemon
  st.pHP = m.hp
  st.pMaxHP = m.maxHp
}

function showSwitchBtn() {
  const btn = $('switch-btn')
  if (!btn) return
  // Show switch button only if team has more than 1 alive member
  const aliveOthers = st.team.filter((m, i) => i !== st.activeIdx && m.hp > 0)
  btn.style.display = aliveOthers.length > 0 ? 'block' : 'none'
}

function updateTeamStatus() {
  const el = $('team-status')
  if (!el) return
  if (st.team.length === 0) { el.innerHTML = ''; return }
  el.innerHTML = st.team.map((m, i) => {
    const active = i === st.activeIdx ? ' active' : ''
    const fainted = m.hp <= 0 ? ' fainted' : ''
    const hpPct = Math.max(0, m.hp / m.maxHp * 100)
    return `<div class="team-indicator${active}${fainted}" title="${m.pokemon.name} ${m.hp}/${m.maxHp}">
      <img src="${spr(m.pokemon.id)}" alt="${m.pokemon.name}">
      <div class="team-hp-mini"><div class="team-hp-fill" style="width:${hpPct}%"></div></div>
    </div>`
  }).join('')
}

// ===================================================================
// SCREENS
// ===================================================================
export function showBestScore() {
  // Render profile panel
  renderProfilePanel()

  // Check for newly unlocked Pokemon
  checkNewUnlocks()

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

  // Show endless high score
  const hsEl = $('high-score-value')
  if (hsEl) {
    hsEl.textContent = getEndlessHighScore()
  }

  // Apply saved settings
  applySettings()

  bgmPlay('title')
}

function renderProfilePanel() {
  const panel = $('profile-panel')
  if (!panel) return

  const stats = loadStats()
  const settings = loadSettings()
  const gymProg = loadGymProgress()
  const achs = loadAchievements()
  const endlessHS = getEndlessHighScore()

  const exp = calcTrainerEXP(settings, stats, gymProg, achs, endlessHS)
  const rank = getTrainerRank(exp)

  // Accuracy
  const accuracy = stats.totalQuestions > 0
    ? Math.round(stats.totalCorrect / stats.totalQuestions * 100)
    : -1

  // Skill assessment
  let assessment
  if (stats.totalQuestions === 0) {
    assessment = '尚未开始冒险'
  } else if (accuracy >= 90) {
    assessment = '数学天才！几乎无人能敌'
  } else if (accuracy >= 80) {
    assessment = '实力雄厚，基础扎实'
  } else if (accuracy >= 70) {
    assessment = '稳步提升中，继续努力'
  } else if (accuracy >= 60) {
    assessment = '有潜力，需要多练习'
  } else {
    assessment = '勇气可嘉，加油！'
  }

  // Next step recommendation
  const badges = gymProg.badges || []
  const totalDef = settings.totalDefeated || 0
  let nextStep
  if (totalDef === 0) {
    nextStep = '开始你的第一场快速对战！'
  } else if (badges.length === 0) {
    nextStep = '尝试挑战第一个道馆！'
  } else if (badges.length < GYMS.length) {
    const nextGym = GYMS.find(g => !badges.includes(g.id))
    nextStep = nextGym ? `挑战下一个道馆: ${nextGym.name}` : '继续道馆挑战！'
  } else if (!achs['endless_10']) {
    nextStep = '挑战无尽模式第10波！'
  } else if (!achs['endless_20']) {
    nextStep = '无尽模式挑战第20波！'
  } else {
    const missing = ACHIEVEMENT_DEFS.find(a => !achs[a.id])
    nextStep = missing ? `解锁成就: ${missing.name}` : '你已是传说！试试刷新最高分吧！'
  }

  // Avatar: use first Pokemon from usedPokemon, or default
  const avatarId = settings.usedPokemon.length > 0 ? settings.usedPokemon[0] : 25
  const avatarSrc = spr(avatarId)

  const achCount = Object.keys(achs).length
  const progressPct = Math.round(rank.progress * 100)

  panel.innerHTML = `
    <div class="profile-header">
      <img class="profile-avatar" src="${avatarSrc}" alt="">
      <div class="profile-rank-info">
        <div class="profile-rank-title">Lv.${rank.level} ${rank.title}</div>
        <div class="profile-exp-bar"><div class="profile-exp-fill" style="width:${progressPct}%"></div></div>
        <div class="profile-rank-sub">${rank.level < TRAINER_RANKS.length ? `经验 ${exp} / ${TRAINER_RANKS[rank.level].minEXP}` : `经验 ${exp} MAX`}</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><span class="profile-stat-val">${stats.totalQuestions}</span><span class="profile-stat-label">答题</span></div>
      <div class="profile-stat"><span class="profile-stat-val">${accuracy >= 0 ? accuracy + '%' : '--'}</span><span class="profile-stat-label">正确率</span></div>
      <div class="profile-stat"><span class="profile-stat-val">${totalDef}</span><span class="profile-stat-label">击败</span></div>
      <div class="profile-stat"><span class="profile-stat-val">${achCount}/${ACHIEVEMENT_DEFS.length}</span><span class="profile-stat-label">成就</span></div>
    </div>
    <div class="profile-footer">
      <div class="profile-assessment">💬 ${assessment}</div>
      <div class="profile-nextstep">👉 ${nextStep}</div>
    </div>
  `
}

function checkNewUnlocks() {
  const stats = loadStats()
  const settings = loadSettings()
  const gymProg = loadGymProgress()
  const achs = loadAchievements()
  const endlessHS = getEndlessHighScore()
  const exp = calcTrainerEXP(settings, stats, gymProg, achs, endlessHS)
  const rank = getTrainerRank(exp)

  const lastRank = getLastSeenRank()
  if (rank.level <= lastRank) {
    // First time: set lastSeenRank to current level
    if (lastRank === 0) setLastSeenRank(rank.level)
    return
  }

  // Find newly unlocked Pokemon (between lastRank+1 and current level)
  const newIndices = []
  POKEMON_UNLOCK_MAP.forEach((reqLv, i) => {
    if (reqLv > lastRank && reqLv <= rank.level) newIndices.push(i)
  })

  setLastSeenRank(rank.level)
  if (newIndices.length > 0) showUnlockNotification(newIndices)
}

function showUnlockNotification(indices) {
  const overlay = $('unlock-overlay')
  if (!overlay) return
  overlay.style.display = 'flex'

  const list = indices.map(i => {
    const p = POKEMON[i]
    return `<div class="unlock-item">
      <img src="${spr(p.id)}" alt="${p.name}">
      <span>${p.name}</span>
    </div>`
  }).join('')

  overlay.querySelector('.unlock-list').innerHTML = list
  overlay.querySelector('.unlock-close-btn').onclick = () => {
    SFX.play('select')
    overlay.style.display = 'none'
  }
}

function renderSelectGrid() {
  const g = $('pokemon-grid'); g.innerHTML = ''
  const stats = loadStats()
  const settings = loadSettings()
  const gymProg = loadGymProgress()
  const achs = loadAchievements()
  const endlessHS = getEndlessHighScore()
  const exp = calcTrainerEXP(settings, stats, gymProg, achs, endlessHS)
  const rank = getTrainerRank(exp)
  const unlocked = getUnlockedPokemon(rank.level)

  POKEMON.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'pokemon-card'
    const isLocked = !unlocked.includes(i)

    if (isLocked) {
      d.classList.add('locked')
      const cardImg = document.createElement('img')
      cardImg.src = spr(p.id)
      cardImg.alt = p.name
      imgFallback(cardImg, sprFallback(p.id))
      d.appendChild(cardImg)
      d.insertAdjacentHTML('beforeend', `<span class="name">${p.name}</span>
        <span class="lock-badge">🔒 Lv.${POKEMON_UNLOCK_MAP[i]}</span>`)
      g.appendChild(d)
      return
    }

    // Check if already selected in team
    const teamIdx = st.selectedTeam.indexOf(i)
    if (teamIdx >= 0) {
      d.classList.add('selected')
      d.dataset.teamNum = teamIdx + 1
    }
    const cardImg = document.createElement('img')
    cardImg.src = spr(p.id)
    cardImg.alt = p.name
    imgFallback(cardImg, sprFallback(p.id))
    d.appendChild(cardImg)
    d.insertAdjacentHTML('beforeend', `<span class="name">${p.name}</span>
      <span class="type-badge" style="background:${TYPE_COLORS[p.type]}">${p.type}</span>
      <span class="stats-preview">HP:${p.hp}</span>`)
    if (teamIdx >= 0) {
      d.insertAdjacentHTML('beforeend', `<span class="team-num">${teamIdx + 1}</span>`)
    }
    d.onclick = () => { SFX.play('select'); selPoke(i) }
    g.appendChild(d)
  })
}

function updateTeamOrder() {
  const el = $('team-order')
  if (!el) return
  el.innerHTML = st.selectedTeam.map((idx, i) => {
    const p = POKEMON[idx]
    return `<div class="team-order-item">
      <img src="${spr(p.id)}" alt="${p.name}">
      <span>${i + 1}. ${p.name}</span>
    </div>`
  }).join('')
}

export function showSelectScreen() {
  SFX.init()
  SFX.play('select')
  st.mode = 'quick'

  const settings = loadSettings()
  st.difficulty = settings.difficulty || 'normal'

  st.selectedTeam = []
  st.selectedIdx = -1

  $('title-screen').style.display = 'none'
  $('gym-map-screen').style.display = 'none'
  $('select-screen').style.display = 'flex'

  $('team-count').textContent = '0'
  renderSelectGrid()
  updateTeamOrder()

  document.querySelector('.difficulty-selector').style.display = 'flex'
  updateDifficultyUI()
  $('confirm-btn').style.display = 'none'
  const tsi = $('team-select-info')
  if (tsi) tsi.style.display = 'block'
}

// ===================================================================
// ENDLESS MODE
// ===================================================================
export function startEndless() {
  SFX.init()
  SFX.play('select')
  st.mode = 'endless'

  const settings = loadSettings()
  st.difficulty = settings.difficulty || 'normal'

  st.selectedTeam = []
  st.selectedIdx = -1

  $('title-screen').style.display = 'none'
  $('select-screen').style.display = 'flex'

  $('team-count').textContent = '0'
  renderSelectGrid()
  updateTeamOrder()

  document.querySelector('.difficulty-selector').style.display = 'flex'
  updateDifficultyUI()
  $('confirm-btn').style.display = 'none'
  const tsi = $('team-select-info')
  if (tsi) tsi.style.display = 'block'
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
      <div class="gym-status">${isCleared ? '✅ 再次挑战' : isUnlocked ? '⚔️ 挑战' : '🔒'}</div>
    `

    if (isUnlocked && !isCleared) {
      card.onclick = () => selectGym(i)
    } else if (isCleared) {
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
  st.difficulty = 'normal'

  st.selectedTeam = []
  st.selectedIdx = -1

  $('gym-map-screen').style.display = 'none'
  $('select-screen').style.display = 'flex'

  $('team-count').textContent = '0'
  renderSelectGrid()
  updateTeamOrder()

  document.querySelector('.difficulty-selector').style.display = 'none'
  $('confirm-btn').style.display = 'none'
  const tsi = $('team-select-info')
  if (tsi) tsi.style.display = 'block'
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
  // Guard against locked Pokemon
  const stats = loadStats()
  const settings = loadSettings()
  const gymProg = loadGymProgress()
  const achs = loadAchievements()
  const endlessHS = getEndlessHighScore()
  const exp = calcTrainerEXP(settings, stats, gymProg, achs, endlessHS)
  const rank = getTrainerRank(exp)
  const unlocked = getUnlockedPokemon(rank.level)
  if (!unlocked.includes(i)) return

  const existing = st.selectedTeam.indexOf(i)
  if (existing >= 0) {
    // Deselect
    st.selectedTeam.splice(existing, 1)
  } else if (st.selectedTeam.length < 3) {
    st.selectedTeam.push(i)
  } else {
    // Already 3 selected, ignore
    return
  }

  $('team-count').textContent = st.selectedTeam.length
  renderSelectGrid()
  updateTeamOrder()
  $('confirm-btn').style.display = st.selectedTeam.length === 3 ? 'block' : 'none'
}

// ===================================================================
// BATTLE INIT
// ===================================================================
export function startBattle() {
  if (st.selectedTeam.length !== 3) return
  SFX.play('select')

  bgmStop()

  // Build team
  st.team = st.selectedTeam.map(idx => {
    const p = { ...POKEMON[idx] }
    return { pokemon: p, hp: p.hp, maxHp: p.hp, evolved: false, killCount: 0 }
  })
  st.activeIdx = 0
  loadActiveFromTeam()

  st.round = 1; st.streak = 0; st.maxStreak = 0
  st.correct = 0; st.wrong = 0; st.defeated = 0; st.busy = false
  st.topicStats = {}
  st.statusEffects = { player: [], enemy: [] }
  st._nextEnemyBuff = null
  st._nextEnemyReward = null
  st._nextGuaranteedHit = false
  st._nextDoubleDmg = false
  st._isChampion = false
  st._evolvedThisBattle = new Set()
  st._allSuperEffective = true
  st.wave = 0
  st.endlessScore = 0
  usedQuestions = new Set()

  if (st.mode === 'gym') {
    const gymQ = Q_BANK.filter(q => st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
    const extra = Q_BANK.filter(q => !st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
    st.qBank = shuffle([...gymQ, ...gymQ, ...extra.slice(0, 10)])
    st.goalEnemies = st.gymData.trainers + 1
  } else if (st.mode === 'endless') {
    st.qBank = shuffle([...Q_BANK])
    st.goalEnemies = 999999 // endless
  } else {
    const diff = DIFFICULTY[st.difficulty]
    st.qBank = shuffle([...Q_BANK])
    st.goalEnemies = diff.goalEnemies
  }

  // Track used Pokemon for achievement
  const settings = loadSettings()
  st.team.forEach(m => {
    if (!settings.usedPokemon.includes(m.pokemon.id)) {
      settings.usedPokemon.push(m.pokemon.id)
    }
  })
  saveSettings(settings)
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
    $('difficulty-badge').textContent = st.gymData.name
    spawnEnemy()
    renderSkills()
    updateUI()
    bgmPlay('battle')
    showDialogue('旁白', '📖', st.gymData.intro, () => {
      msg(`${st.player.name}，就决定是你了！`)
      startSkillTimer()
    })
  } else if (st.mode === 'endless') {
    $('difficulty-badge').textContent = '无尽模式'
    st.wave = 1
    spawnEnemy()
    renderSkills()
    updateUI()
    bgmPlay('battle')
    msg(`无尽模式开始！第${st.wave}波！`)
    startSkillTimer()
  } else {
    const diff = DIFFICULTY[st.difficulty]
    $('difficulty-badge').textContent = diff.label
    spawnEnemy()
    renderSkills()
    updateUI()
    bgmPlay('battle')
    msg(`${st.player.name}，就决定是你了！`)
    startSkillTimer()
  }
}

function spawnEnemy() {
  // Check if this is the gym leader fight
  if (st.mode === 'gym' && st.gymStep >= st.gymData.trainers) {
    spawnGymLeader()
    return
  }

  if (st.mode === 'gym') {
    const gymTypes = st.gymData.enemyTypes || []
    let pool = ENEMIES.filter(e => gymTypes.includes(e.type))
    if (pool.length === 0) pool = ENEMIES
    const base = pool[randInt(0, pool.length - 1)]
    const lv = Math.min(5 + st.round * 3, 50)
    const scale = (0.8 + st.round * 0.3) * st.gymData.trainerScale
    let maxHP = Math.floor(80 * scale)

    if (st._nextEnemyBuff) {
      maxHP = Math.floor(maxHP * st._nextEnemyBuff)
    }

    st.enemy = { ...base, lv, atkPow: Math.floor((base.atk + st.round * 2) * st.gymData.trainerScale) }
    st.eHP = maxHP; st.eMaxHP = maxHP
  } else if (st.mode === 'endless') {
    const base = ENEMIES[randInt(0, ENEMIES.length - 1)]
    const lv = Math.min(5 + st.wave * 3, 99)
    const hpScale = 1 + (st.wave - 1) * 0.05
    const atkScale = 1 + (st.wave - 1) * 0.03
    let maxHP = Math.floor(80 * hpScale)

    // Mini-boss every 5th wave
    const isBoss5 = st.wave % 5 === 0 && st.wave % 10 !== 0
    // Gym leader boss every 10th wave
    const isBoss10 = st.wave % 10 === 0

    if (isBoss10) {
      // Random gym leader as boss
      const gym = GYMS[randInt(0, GYMS.length - 1)]
      const pk = gym.leader.pokemon
      st.enemy = {
        name: `${gym.leader.name}的${pk.name}`, id: pk.id, type: pk.type, lv: Math.min(pk.lv + st.wave, 99),
        atkPow: Math.floor(pk.atkPow * atkScale * 1.3),
        leaderName: gym.leader.name,
        leaderSkills: gym.leader.skills,
      }
      maxHP = Math.floor(pk.hp * hpScale * 1.3)
      st.eHP = maxHP; st.eMaxHP = maxHP
      st.isLeaderFight = false // not a real gym leader fight
    } else if (isBoss5) {
      st.enemy = { ...base, name: `强化${base.name}`, lv, atkPow: Math.floor((base.atk + st.wave * 2) * atkScale * 1.5) }
      maxHP = Math.floor(maxHP * 1.5)
      st.eHP = maxHP; st.eMaxHP = maxHP
    } else {
      st.enemy = { ...base, lv, atkPow: Math.floor((base.atk + st.wave * 2) * atkScale) }
      st.eHP = maxHP; st.eMaxHP = maxHP
    }

    if (st._nextEnemyBuff) {
      st.eMaxHP = Math.floor(st.eMaxHP * st._nextEnemyBuff)
      st.eHP = st.eMaxHP
    }
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
  updateEnemyType()
  const eSprite = $('enemy-sprite')
  eSprite.src = spr(st.enemy.id)
  imgFallback(eSprite, sprFallback(st.enemy.id))
  eSprite.className = 'enemy-pokemon enter-anim'
  setTimeout(() => eSprite.classList.remove('enter-anim'), 400)

  if (st.mode === 'endless') {
    $('level-indicator').textContent = `第${st.wave}波`
  } else if (st.mode === 'gym') {
    $('level-indicator').textContent = `训练师 ${st.gymStep + 1}/${st.gymData.trainers}`
  } else {
    $('level-indicator').textContent = `第${st.round}回合`
  }
  $('player-level').textContent = `Lv.${5 + st.defeated * 3}`
}

function updateEnemyType() {
  const el = $('enemy-type')
  if (el && st.enemy) {
    el.textContent = TYPE_ICONS[st.enemy.type] || st.enemy.type
    el.style.background = TYPE_COLORS[st.enemy.type] || '#6b7280'
  }
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
  updateEnemyType()
  const eSprite = $('enemy-sprite')
  eSprite.src = spr(pk.id)
  imgFallback(eSprite, sprFallback(pk.id))
  eSprite.className = 'enemy-pokemon enter-anim'
  setTimeout(() => eSprite.classList.remove('enter-anim'), 400)
  $('level-indicator').textContent = '馆主战！'
  $('player-level').textContent = `Lv.${5 + st.defeated * 3}`

  bgmPlay('gym')

  showDialogue(leader.name, leader.avatar, leader.preBattle, () => {
    msg(`馆主${leader.name}发起了挑战！`)
    startSkillTimer()
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

  if (st.mode === 'endless') {
    $('exp-bar').style.width = '100%'
  } else {
    $('exp-bar').style.width = (Math.min(st.defeated, st.goalEnemies) / st.goalEnemies * 100) + '%'
  }

  $('player-status').innerHTML =
    st.statusEffects.player.map(s => `<span class="status-icon">${s.icon}</span>`).join('')
  $('enemy-status').innerHTML =
    st.statusEffects.enemy.map(s => `<span class="status-icon">${s.icon}</span>`).join('')

  updateTeamStatus()
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
  showSwitchBtn()
}

// ===================================================================
// SWITCH POKEMON
// ===================================================================
export function switchPokemon() {
  if (st.busy) return
  clearSkillTimer()
  SFX.play('select')

  const overlay = $('switch-overlay')
  overlay.style.display = 'flex'
  const options = $('switch-options')
  options.innerHTML = ''

  st.team.forEach((m, i) => {
    if (i === st.activeIdx) return // skip current
    const card = document.createElement('div')
    card.className = 'switch-card' + (m.hp <= 0 ? ' fainted' : '')
    const hpPct = Math.max(0, m.hp / m.maxHp * 100)
    card.innerHTML = `
      <img src="${spr(m.pokemon.id)}" alt="${m.pokemon.name}">
      <div class="switch-info">
        <div class="switch-name">${m.pokemon.name}</div>
        <div class="switch-hp-bar"><div class="switch-hp-fill" style="width:${hpPct}%"></div></div>
        <div class="switch-hp-text">${m.hp}/${m.maxHp}</div>
      </div>
    `
    if (m.hp > 0) {
      card.onclick = () => doSwitch(i)
    }
    options.appendChild(card)
  })
}

export function cancelSwitch() {
  SFX.play('select')
  $('switch-overlay').style.display = 'none'
  startSkillTimer()
}

async function doSwitch(newIdx) {
  $('switch-overlay').style.display = 'none'
  st.busy = true
  SFX.play('select')

  // Save current HP
  syncTeamHP()

  // Enemy gets a free attack on switch
  msg(`收回${st.player.name}！${st.enemy.name}趁机攻击！`)
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

  let dmg = st.enemy.atkPow + randInt(0, 5)
  dmg = Math.floor(dmg * enemyTypeMulti)
  const defBuff = st.statusEffects.player.find(s => s.type === 'def_up')
  if (defBuff) dmg = Math.floor(dmg * 0.7)

  st.pHP = Math.max(0, st.pHP - dmg)
  syncTeamHP()
  showDmg('player', dmg)
  updateUI()
  await sleep(500)

  // Check if current fainted from free attack
  if (st.pHP <= 0) {
    // If the switched-to Pokemon is still alive, proceed with switch
    if (st.team[newIdx].hp > 0) {
      performSwitch(newIdx)
    } else {
      // Check if all fainted
      if (isTeamWiped()) {
        showResult(false)
        return
      }
    }
  } else {
    // Normal switch
    performSwitch(newIdx)
  }

  st.busy = false
  $('question-panel').style.display = 'none'
  $('skill-panel').style.display = 'grid'
  showSwitchBtn()
  msg('选择技能！')
  updateUI()
  startSkillTimer()
}

function performSwitch(newIdx) {
  syncTeamHP()
  st.activeIdx = newIdx
  loadActiveFromTeam()
  st.statusEffects.player = [] // clear status on switch

  $('player-name').textContent = st.player.name
  const playerSpr = $('player-sprite')

  // Switch particle effect
  if (fx) {
    fx.resize()
    const pr = playerSpr.getBoundingClientRect()
    const br = $('battle-bg').getBoundingClientRect()
    fx.switchPokemon(pr.left - br.left + pr.width / 2, pr.top - br.top + pr.height / 2)
  }

  playerSpr.src = sprBack(st.player.id)
  imgFallback(playerSpr, sprBackFallback(st.player.id))

  renderSkills()
  SFX.play('switch')
  msg(`去吧，${st.player.name}！`)
}

function isTeamWiped() {
  return st.team.every(m => m.hp <= 0)
}

async function handleFaint() {
  // Current Pokemon fainted, find next alive
  if (isTeamWiped()) {
    showResult(false)
    return true
  }

  // Force switch to next alive Pokemon
  msg(`${st.player.name}倒下了！选择下一只宝可梦！`)
  await sleep(600)

  return new Promise(resolve => {
    const overlay = $('switch-overlay')
    overlay.style.display = 'flex'
    const options = $('switch-options')
    options.innerHTML = ''
    // Hide cancel button during forced switch
    const cancelBtn = overlay.querySelector('.cancel-btn')
    if (cancelBtn) cancelBtn.style.display = 'none'

    st.team.forEach((m, i) => {
      if (i === st.activeIdx || m.hp <= 0) return
      const card = document.createElement('div')
      card.className = 'switch-card'
      const hpPct = Math.max(0, m.hp / m.maxHp * 100)
      card.innerHTML = `
        <img src="${spr(m.pokemon.id)}" alt="${m.pokemon.name}">
        <div class="switch-info">
          <div class="switch-name">${m.pokemon.name}</div>
          <div class="switch-hp-bar"><div class="switch-hp-fill" style="width:${hpPct}%"></div></div>
          <div class="switch-hp-text">${m.hp}/${m.maxHp}</div>
        </div>
      `
      card.onclick = () => {
        overlay.style.display = 'none'
        if (cancelBtn) cancelBtn.style.display = 'block'
        performSwitch(i)
        updateUI()
        resolve(false)
      }
      options.appendChild(card)
    })
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
  } else if (st.mode === 'endless') {
    if (st.wave <= 3) maxDiff = 1
    else if (st.wave <= 7) maxDiff = 2
    else maxDiff = 3
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
      const gymQ = Q_BANK.filter(q => st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
      const extra = Q_BANK.filter(q => !st.gymData.topics.includes(q.cat) && (q.diff || 1) <= st.gymData.maxDiff)
      st.qBank = shuffle([...gymQ, ...gymQ, ...extra.slice(0, 10)])
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
  clearSkillTimer()
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
  $('switch-btn').style.display = 'none'
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
    if (rem <= 0) { clearInterval(st.timerIv); onWrong(true) }
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

  // Track global stats
  const gs = loadStats()
  gs.totalQuestions++
  if (chosen === st.curQ.answer) gs.totalCorrect++
  saveStats(gs)

  if (chosen === st.curQ.answer) {
    st.topicStats[topic].correct++
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

  if (st.streak >= 5) tryAchievement('streak_5')
  if (st.streak >= 10) tryAchievement('streak_10')

  const sk = st.curSkill
  const guaranteedHit = st._nextGuaranteedHit
  if (guaranteedHit) st._nextGuaranteedHit = false
  const hit = guaranteedHit || Math.random() * 100 < sk.acc
  if (!hit) {
    msg(`${st.player.name}的${sk.name}没有命中！`)
    await sleep(400)
    fx.resize()
    showMiss('enemy')
    await sleep(700)
    endTurn(); return
  }

  let streakBonus = 1
  if (st.streak >= 5) streakBonus = 1.3
  else if (st.streak >= 3) streakBonus = 1.15

  const diffBonus = 1 + (st.curQ.diff - 1) * 0.15
  const typeMultiplier = getTypeMultiplier(sk.type, st.enemy.type)

  // Track super effective for achievement
  if (typeMultiplier <= 1 && sk.power > 0) st._allSuperEffective = false

  let dmg = Math.floor(sk.power * streakBonus * diffBonus * typeMultiplier)

  // Heal-only skill
  if (sk.healFlat && sk.power === 0) {
    const h = sk.healFlat
    st.pHP = Math.min(st.pMaxHP, st.pHP + h)
    syncTeamHP()
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

  if (st._nextDoubleDmg) { dmg = Math.floor(dmg * 2); st._nextDoubleDmg = false }

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
  if (typeMultiplier > 1) fx.superEffective(ex, ey)
  if (sk.power >= 50) {
    screenFlash(TYPE_COLORS[sk.type] || '#fff')
    fx.screenShake($('battle-bg'))
  }
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
    syncTeamHP()
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

  const hasMentor = st.statusEffects.player.find(s => s.type === 'mentor')
  if (hasMentor) showExplain = true

  if (showExplain && st.curQ) {
    const explainEl = $('explain-box')
    explainEl.style.display = 'block'
    const expText = st.curQ.exp ? ` — ${st.curQ.exp}` : ''
    explainEl.textContent = `正确答案: ${st.curQ.answer}${expText}`
    await sleep(1500)
    explainEl.style.display = 'none'
  }

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
  syncTeamHP()
  showDmg('player', dmg)
  updateUI()

  if (st.pHP <= 0) {
    await sleep(400)
    const wiped = await handleFaint()
    if (wiped) return
    endTurn()
    return
  }
  await sleep(500)
  endTurn()
}

async function enemyDefeated() {
  st.defeated++; st.round++
  if (st.mode === 'gym') st.gymStep++
  if (st.mode === 'endless') st.wave++
  SFX.play('defeat')
  const el = $('enemy-sprite')
  el.classList.add('faint-anim')

  // Track kills per team member
  if (st.team[st.activeIdx]) {
    st.team[st.activeIdx].killCount = (st.team[st.activeIdx].killCount || 0) + 1
  }

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

  // Endless achievements
  if (st.mode === 'endless') {
    if (st.wave >= 10) tryAchievement('endless_10')
    if (st.wave >= 20) tryAchievement('endless_20')
  }

  // Check for buffed enemy reward
  if (st._nextEnemyReward) {
    const heal = Math.floor(st.pMaxHP * st._nextEnemyReward)
    st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
    syncTeamHP()
    msg(`击败强敌！额外恢复${heal}HP！`)
    st._nextEnemyBuff = null
    st._nextEnemyReward = null
    updateUI()
    await sleep(800)
  } else {
    msg(`${st.enemy.name}被击败了！`)
    await sleep(900)
  }

  // Check evolution
  await checkEvolution()

  // Gym leader defeated
  if (st.isLeaderFight && st.mode === 'gym') {
    await gymLeaderDefeated()
    return
  }

  // Check win in quick mode
  if (st.mode !== 'endless' && st.defeated >= st.goalEnemies) { showResult(true); return }

  // Random event between battles
  el.classList.remove('faint-anim')
  el.style.opacity = '1'; el.style.transform = ''
  await handleRandomEvent()

  // Heal between rounds
  const healRate = (st.mode === 'gym' && st.gymStep >= st.gymData.trainers) ? 0.08 : 0.15
  const heal = Math.floor(st.pMaxHP * healRate)
  st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
  syncTeamHP()

  spawnEnemy()
  updateUI()

  if (st.isLeaderFight) {
    // Leader dialogue already shown in spawnGymLeader
  } else if (st.mode === 'endless') {
    msg(`第${st.wave}波！${st.enemy.name}出现了！(+${heal}HP)`)
  } else {
    msg(`野生的${st.enemy.name}出现了！(+${heal}HP)`)
  }
  await sleep(700)
  endTurn()
}

// ===================================================================
// EVOLUTION SYSTEM
// ===================================================================
async function checkEvolution() {
  const member = st.team[st.activeIdx]
  if (!member || member.evolved) return
  if (st._evolvedThisBattle.has(st.activeIdx)) return

  const pokemon = member.pokemon
  if (!pokemon.evolution) return
  if (member.killCount < 3) return

  // Show evolution prompt
  const accepted = await showEvolutionPrompt(pokemon)
  if (accepted) {
    await performEvolution(member, pokemon)
  }
}

function showEvolutionPrompt(pokemon) {
  return new Promise(resolve => {
    const overlay = $('evolution-overlay')
    overlay.style.display = 'flex'
    const content = $('evolution-content')
    content.innerHTML = `
      <div class="evolution-title">${pokemon.name} 想要进化！</div>
      <div class="evolution-sprites">
        <img src="${spr(pokemon.id)}" alt="${pokemon.name}">
        <span class="evolution-arrow">→</span>
        <img src="${spr(pokemon.evolution.id)}" alt="${pokemon.evolution.name}">
      </div>
      <div class="evolution-info">${pokemon.evolution.name} - HP+20%</div>
      <div class="evolution-buttons">
        <button class="evolution-accept" id="evo-accept">进化！</button>
        <button class="evolution-decline" id="evo-decline">取消</button>
      </div>
    `
    $('evo-accept').onclick = () => {
      overlay.style.display = 'none'
      resolve(true)
    }
    $('evo-decline').onclick = () => {
      overlay.style.display = 'none'
      resolve(false)
    }
  })
}

async function performEvolution(member, pokemon) {
  SFX.play('levelup')
  st._evolvedThisBattle.add(st.activeIdx)
  member.evolved = true
  tryAchievement('evolution')

  // Flash animation
  const playerSpr = $('player-sprite')
  playerSpr.classList.add('evolution-flash')

  // Evolution particle effect
  fx.resize()
  const pr = playerSpr.getBoundingClientRect()
  const br = $('battle-bg').getBoundingClientRect()
  fx.evolution(pr.left - br.left + pr.width / 2, pr.top - br.top + pr.height / 2)

  await sleep(600)

  // Update Pokemon data
  const evo = pokemon.evolution
  member.pokemon = {
    ...member.pokemon,
    name: evo.name,
    id: evo.id,
    skills: evo.skills || member.pokemon.skills,
  }
  member.maxHp = Math.floor(member.maxHp * 1.2)
  member.hp = member.maxHp // heal to full

  // Update active state
  loadActiveFromTeam()
  playerSpr.src = sprBack(st.player.id)
  imgFallback(playerSpr, sprBackFallback(st.player.id))
  playerSpr.classList.remove('evolution-flash')

  $('player-name').textContent = st.player.name
  renderSkills()
  updateUI()

  msg(`${pokemon.name}进化成了${evo.name}！`)
  await sleep(1200)
}

export function acceptEvolution() {
  // Handled via button onclick in showEvolutionPrompt
}

export function declineEvolution() {
  // Handled via button onclick in showEvolutionPrompt
}

// ===================================================================
// GYM LEADER DEFEATED
// ===================================================================
async function gymLeaderDefeated() {
  const leader = st.gymData.leader

  const gymProg = loadGymProgress()
  if (!gymProg.badges.includes(st.gymData.id)) {
    gymProg.badges.push(st.gymData.id)
    saveGymProgress(gymProg)
  }

  if (gymProg.badges.length >= 1) tryAchievement('first_badge')
  if (gymProg.badges.length >= 5) tryAchievement('four_badges')
  if (gymProg.badges.length >= GYMS.length) tryAchievement('all_badges')

  // Check perfect gym achievement
  const tot = st.correct + st.wrong
  const accuracy = tot > 0 ? Math.round(st.correct / tot * 100) : 0
  if (accuracy === 100) tryAchievement('perfect_gym')

  bgmStop()
  bgmPlay('victory')

  showDialogue(leader.name, leader.avatar, leader.postDefeat, () => {
    if (gymProg.badges.length >= GYMS.length) {
      showDialogue('大木博士', '🔮', [
        '恭喜你！你已经征服了所有道馆！',
        '集合、函数、三角、数列、向量、概率、导数、排列组合、圆锥曲线...',
        '你已经掌握了高中数学的全部精髓！',
        '你是当之无愧的——数学冠军！！',
      ], () => {
        st._isChampion = true
        showResult(true)
      })
    } else {
      showResult(true)
    }
  })
}

function endTurn() {
  st.busy = false
  $('question-panel').style.display = 'none'
  $('skill-panel').style.display = 'grid'
  $('explain-box').style.display = 'none'
  showSwitchBtn()

  ;['player', 'enemy'].forEach(side => {
    st.statusEffects[side] = st.statusEffects[side].filter(s => {
      s.turns--
      return s.turns > 0
    })
  })

  msg('选择技能！')
  updateUI()
  startSkillTimer()
}

function startSkillTimer() {
  clearInterval(st.skillTimerIv)
  const dur = 15 // seconds to pick a skill
  const bar = $('timer-bar')
  const con = $('timer-container')
  con.style.display = 'block'; bar.style.width = '100%'
  bar.style.backgroundColor = '#6366f1'
  bar.classList.remove('timer-pulse')
  const t0 = Date.now()
  st.skillTimerIv = setInterval(() => {
    const rem = Math.max(0, dur - (Date.now() - t0) / 1000)
    bar.style.width = (rem / dur * 100) + '%'
    if (rem <= dur * 0.3) {
      bar.style.backgroundColor = '#ef4444'
      bar.classList.add('timer-pulse')
    } else {
      bar.style.backgroundColor = '#6366f1'
      bar.classList.remove('timer-pulse')
    }
    if (rem <= 0) {
      clearInterval(st.skillTimerIv)
      con.style.display = 'none'
      // Auto-select first skill on timeout
      if (!st.busy) useSkill(0)
    }
  }, 50)
}

function clearSkillTimer() {
  clearInterval(st.skillTimerIv)
  $('timer-container').style.display = 'none'
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
  clearInterval(st.timerIv); clearSkillTimer(); st.busy = true

  // Track battle count
  const battleStats = loadStats()
  battleStats.totalBattles++
  saveStats(battleStats)

  if (win) {
    tryAchievement('first_win')
    if (st.wrong === 0) tryAchievement('perfect')
    // Check all team alive
    if (st.team.every(m => m.hp > 0)) tryAchievement('team_alive')
    // Check type master
    if (st._allSuperEffective && st.correct > 0) tryAchievement('type_master')
    SFX.play('levelup')
    bgmStop()
    bgmPlay('victory')
  } else {
    SFX.play('gameover')
    bgmStop()
    bgmPlay('defeat_bgm')
  }

  const s = $('result-screen')
  s.style.display = 'flex'; s.className = win ? 'victory' : 'defeat'
  $('result-emoji').textContent = win ? '🏆' : '💀'

  // Badge earned display for gym mode
  const badgeEl = $('badge-earned')
  if (st.mode === 'gym' && win && st.gymData) {
    if (st._isChampion) {
      badgeEl.style.display = 'block'
      const allBadges = GYMS.map(g => g.leader.badge).join(' ')
      badgeEl.innerHTML = `<div class="champion-banner"><div class="champion-title">🏆 数学冠军 🏆</div><div class="champion-badges">${allBadges}</div></div>`
      $('result-title').textContent = '全道馆制霸！'
      $('result-emoji').textContent = '👑'
      st._isChampion = false
    } else {
      badgeEl.style.display = 'block'
      badgeEl.innerHTML = `<span class="badge-icon">${st.gymData.leader.badge}</span>获得${st.gymData.leader.badgeName}！`
      $('result-title').textContent = `${st.gymData.name}通关！`
    }
  } else if (st.mode === 'endless') {
    badgeEl.style.display = 'none'
    $('result-title').textContent = `无尽模式 - 第${st.wave}波`
  } else {
    badgeEl.style.display = 'none'
    $('result-title').textContent = win ? '胜利！' : '战斗结束...'
  }

  const tot = st.correct + st.wrong
  const accuracy = tot > 0 ? Math.round(st.correct / tot * 100) : 0

  animateStatCount('stat-correct', st.correct)
  animateStatCount('stat-wrong', st.wrong)
  animateStatCount('stat-accuracy', accuracy, '%')
  animateStatCount('stat-streak', st.maxStreak)
  animateStatCount('stat-defeated', st.defeated)

  // Endless mode extra stats
  const waveRow = $('stat-wave-row')
  const scoreRow = $('stat-score-row')
  if (st.mode === 'endless') {
    const score = st.defeated * 100 + st.correct * 50 + st.maxStreak * 200
    st.endlessScore = score
    if (waveRow) { waveRow.style.display = 'flex'; animateStatCount('stat-wave', st.wave) }
    if (scoreRow) { scoreRow.style.display = 'flex'; animateStatCount('stat-score', score) }

    // Save high score
    const hs = getEndlessHighScore()
    if (score > hs) {
      setEndlessHighScore(score)
      const nrEl = $('new-record')
      nrEl.style.display = 'block'
      nrEl.textContent = '🎉 新纪录！'
    } else {
      $('new-record').style.display = 'none'
    }
  } else {
    if (waveRow) waveRow.style.display = 'none'
    if (scoreRow) scoreRow.style.display = 'none'
  }

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
  } else if (st.mode !== 'endless') {
    $('new-record').style.display = 'none'
  }
}

function animateStatCount(id, target, suffix = '') {
  const el = $(id)
  if (!el) return
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
  st.selectedTeam = []
  st.team = []
  st.mode = 'quick'
  st.gymData = null
  st.isLeaderFight = false
  if (fx) fx.clear()
  showBestScore()
}

export function quitBattle() {
  SFX.play('select')
  const overlay = $('quit-overlay')
  overlay.style.display = 'flex'
}

export function confirmQuit() {
  $('quit-overlay').style.display = 'none'
  clearInterval(st.timerIv)
  clearSkillTimer()
  st.busy = true
  bgmStop()
  restartGame()
}

export function cancelQuit() {
  SFX.play('select')
  $('quit-overlay').style.display = 'none'
}

// ===================================================================
// SETTINGS
// ===================================================================
export function openSettings() {
  SFX.play('select')
  const overlay = $('settings-overlay')
  overlay.style.display = 'flex'
  const settings = loadSettings()
  $('bgm-toggle').checked = settings.bgm !== false
  $('sfx-toggle').checked = settings.sfx !== false
}

export function closeSettings() {
  SFX.play('select')
  $('settings-overlay').style.display = 'none'
}

export function toggleBGM() {
  const settings = loadSettings()
  settings.bgm = $('bgm-toggle').checked
  saveSettings(settings)
  if (!settings.bgm) {
    bgmStop()
  }
}

export function toggleSFX() {
  const settings = loadSettings()
  settings.sfx = $('sfx-toggle').checked
  saveSettings(settings)
}

function applySettings() {
  const settings = loadSettings()
  const bgmEl = $('bgm-toggle')
  const sfxEl = $('sfx-toggle')
  if (bgmEl) bgmEl.checked = settings.bgm !== false
  if (sfxEl) sfxEl.checked = settings.sfx !== false
}

// ===================================================================
// KEYBOARD SUPPORT
// ===================================================================
export function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (['1', '2', '3', '4'].includes(e.key)) {
      const btns = document.querySelectorAll('.answer-btn')
      const idx = parseInt(e.key) - 1
      if (btns[idx]) btns[idx].click()
    }
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
