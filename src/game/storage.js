// Local storage for game records and achievements
const BEST_KEY = 'pkmn_math_best'
const ACHIEVEMENTS_KEY = 'pkmn_math_achievements'
const SETTINGS_KEY = 'pkmn_math_settings'
const GYM_KEY = 'pkmn_math_gyms'
const ENDLESS_KEY = 'pkmn_math_endless'
const STATS_KEY = 'pkmn_math_stats'

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

// Global stats tracking
export function loadStats() {
  try {
    const d = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    return { totalQuestions: d.totalQuestions || 0, totalCorrect: d.totalCorrect || 0, totalBattles: d.totalBattles || 0 }
  } catch (e) { return { totalQuestions: 0, totalCorrect: 0, totalBattles: 0 } }
}

export function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch (e) { /* ignore */ }
}

// Trainer rank system
export const TRAINER_RANKS = [
  { title: '新手训练师', minEXP: 0 },
  { title: '初级训练师', minEXP: 100 },
  { title: '中级训练师', minEXP: 300 },
  { title: '高级训练师', minEXP: 600 },
  { title: '精英训练师', minEXP: 1200 },
  { title: '准冠军', minEXP: 2000 },
  { title: '冠军', minEXP: 3500 },
  { title: '传说训练师', minEXP: 5000 },
]

export function calcTrainerEXP(settings, stats, gymProgress, achievements, endlessScore) {
  let exp = 0
  exp += (settings.totalDefeated || 0) * 10
  exp += (stats.totalCorrect || 0) * 2
  exp += (gymProgress.badges || []).length * 100
  exp += Object.keys(achievements || {}).length * 50
  exp += endlessScore || 0
  return exp
}

export function getTrainerRank(exp) {
  let rank = TRAINER_RANKS[0]
  let nextRank = TRAINER_RANKS[1]
  for (let i = TRAINER_RANKS.length - 1; i >= 0; i--) {
    if (exp >= TRAINER_RANKS[i].minEXP) {
      rank = TRAINER_RANKS[i]
      nextRank = TRAINER_RANKS[i + 1] || null
      break
    }
  }
  const lvl = TRAINER_RANKS.indexOf(rank) + 1
  let progress = 1
  if (nextRank) {
    progress = (exp - rank.minEXP) / (nextRank.minEXP - rank.minEXP)
  }
  return { title: rank.title, level: lvl, progress: Math.min(1, progress), exp }
}

// Pokemon unlock system - required trainer level for each POKEMON index
// [0]=皮卡丘, [1]=喷火龙, [2]=水箭龟, [3]=妙蛙花, [4]=超梦, [5]=耿鬼,
// [6]=卡比兽, [7]=路卡利欧, [8]=沙奈朵, [9]=快龙, [10]=拉普拉斯,
// [11]=太阳精灵, [12]=胡地, [13]=怪力, [14]=暴鲤龙
export const POKEMON_UNLOCK_MAP = [1, 1, 1, 2, 8, 4, 3, 4, 6, 7, 5, 5, 6, 2, 3]

export function getUnlockedPokemon(trainerLevel) {
  return POKEMON_UNLOCK_MAP.reduce((arr, reqLv, i) => {
    if (reqLv <= trainerLevel) arr.push(i)
    return arr
  }, [])
}

const LAST_RANK_KEY = 'pkmn_math_last_rank'

export function getLastSeenRank() {
  try { return parseInt(localStorage.getItem(LAST_RANK_KEY) || '0') || 0 }
  catch (e) { return 0 }
}

export function setLastSeenRank(level) {
  try { localStorage.setItem(LAST_RANK_KEY, String(level)) } catch (e) { /* ignore */ }
}
