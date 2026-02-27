// Local storage for game records and achievements
const BEST_KEY = 'pkmn_math_best'
const ACHIEVEMENTS_KEY = 'pkmn_math_achievements'
const SETTINGS_KEY = 'pkmn_math_settings'
const GYM_KEY = 'pkmn_math_gyms'
const ENDLESS_KEY = 'pkmn_math_endless'

export function loadBest() {
  try {
    const d = JSON.parse(localStorage.getItem(BEST_KEY) || '{}')
    return { defeated: d.defeated || 0, streak: d.streak || 0, accuracy: d.accuracy || 0 }
  } catch (e) { return { defeated: 0, streak: 0, accuracy: 0 } }
}

export function saveBest(stats) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(stats)) } catch (e) { /* ignore */ }
}

// Achievement definitions
export const ACHIEVEMENT_DEFS = [
  { id: 'first_win', name: '初次胜利', desc: '赢得第一场战斗', icon: '🏆' },
  { id: 'streak_5', name: '连击达人', desc: '连续答对5题', icon: '🔥' },
  { id: 'streak_10', name: '连击大师', desc: '连续答对10题', icon: '💥' },
  { id: 'perfect', name: '完美通关', desc: '零失误通关', icon: '⭐' },
  { id: 'all_pokemon', name: '全员出击', desc: '使用过所有宝可梦', icon: '📦' },
  { id: 'defeat_10', name: '百战百胜', desc: '累计击败10个对手', icon: '⚔️' },
  { id: 'defeat_50', name: '传说训练师', desc: '累计击败50个对手', icon: '👑' },
  { id: 'speed_demon', name: '闪电问答', desc: '在3秒内答对一道困难题', icon: '⚡' },
  { id: 'first_badge', name: '初出茅庐', desc: '获得第一个道馆徽章', icon: '🔰' },
  { id: 'four_badges', name: '半程冠军', desc: '获得5个道馆徽章', icon: '🎖️' },
  { id: 'all_badges', name: '数学冠军', desc: '获得全部道馆徽章', icon: '👑' },
  { id: 'challenge_win', name: '挑战成功', desc: '在突发挑战事件中答对', icon: '❓' },
  { id: 'evolution', name: '进化大师', desc: '进化了一只宝可梦', icon: '🧬' },
  { id: 'endless_10', name: '无尽勇者', desc: '无尽模式到达第10波', icon: '🌊' },
  { id: 'endless_20', name: '传说猎人', desc: '无尽模式到达第20波', icon: '🌟' },
  { id: 'team_alive', name: '全队存活', desc: '全队3只宝可梦存活通关', icon: '💪' },
  { id: 'perfect_gym', name: '完美道馆', desc: '100%正确率通关道馆', icon: '🎯' },
  { id: 'type_master', name: '类型克制大师', desc: '全程使用克制技能获胜', icon: '🔮' },
]

export function loadAchievements() {
  try {
    return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}')
  } catch (e) { return {} }
}

export function saveAchievement(id) {
  const achs = loadAchievements()
  if (achs[id]) return false // already unlocked
  achs[id] = Date.now()
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achs)) } catch (e) { /* ignore */ }
  return true // newly unlocked
}

export function loadSettings() {
  try {
    const d = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      difficulty: d.difficulty || 'normal',
      usedPokemon: d.usedPokemon || [],
      totalDefeated: d.totalDefeated || 0,
      bgm: d.bgm !== undefined ? d.bgm : true,
      sfx: d.sfx !== undefined ? d.sfx : true,
    }
  } catch (e) { return { difficulty: 'normal', usedPokemon: [], totalDefeated: 0, bgm: true, sfx: true } }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch (e) { /* ignore */ }
}

// Gym progress
export function loadGymProgress() {
  try {
    const d = JSON.parse(localStorage.getItem(GYM_KEY) || '{}')
    return { badges: d.badges || [] }
  } catch (e) { return { badges: [] } }
}

export function saveGymProgress(progress) {
  try { localStorage.setItem(GYM_KEY, JSON.stringify(progress)) } catch (e) { /* ignore */ }
}

// Endless mode high score
export function getEndlessHighScore() {
  try {
    return JSON.parse(localStorage.getItem(ENDLESS_KEY) || '0')
  } catch (e) { return 0 }
}

export function setEndlessHighScore(score) {
  try { localStorage.setItem(ENDLESS_KEY, JSON.stringify(score)) } catch (e) { /* ignore */ }
}
