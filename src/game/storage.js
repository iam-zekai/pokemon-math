// Local storage for game records and achievements
const BEST_KEY = 'pkmn_math_best'
const ACHIEVEMENTS_KEY = 'pkmn_math_achievements'
const SETTINGS_KEY = 'pkmn_math_settings'

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
      difficulty: d.difficulty || 'normal', // easy, normal, hard
      usedPokemon: d.usedPokemon || [],
      totalDefeated: d.totalDefeated || 0,
    }
  } catch (e) { return { difficulty: 'normal', usedPokemon: [], totalDefeated: 0 } }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch (e) { /* ignore */ }
}
