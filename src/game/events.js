// Random events that trigger between battles
export const EVENTS = [
  {
    id: 'heal_spring',
    name: '宝可梦中心',
    icon: '💊',
    desc: '路边发现了一个宝可梦中心！恢复30%HP！',
    effect(st) {
      const heal = Math.floor(st.pMaxHP * 0.3)
      st.pHP = Math.min(st.pMaxHP, st.pHP + heal)
      return heal
    },
    weight: 3,
  },
  {
    id: 'rare_candy',
    name: '神奇糖果',
    icon: '🍬',
    desc: '捡到了神奇糖果！最大HP+15！',
    effect(st) {
      st.pMaxHP += 15
      st.pHP += 15
      return 15
    },
    weight: 2,
  },
  {
    id: 'atk_boost',
    name: '力量药剂',
    icon: '💪',
    desc: '喝下力量药剂！攻击力提升3回合！',
    effect(st) {
      if (!st.statusEffects.player.find(s => s.type === 'atk_up')) {
        st.statusEffects.player.push({ type: 'atk_up', icon: '⚔️', turns: 3 })
      }
    },
    weight: 2,
  },
  {
    id: 'def_boost',
    name: '防御护盾',
    icon: '🛡️',
    desc: '获得了防御护盾！减伤3回合！',
    effect(st) {
      if (!st.statusEffects.player.find(s => s.type === 'def_up')) {
        st.statusEffects.player.push({ type: 'def_up', icon: '🛡️', turns: 3 })
      }
    },
    weight: 2,
  },
  {
    id: 'full_restore',
    name: '全恢复药',
    icon: '✨',
    desc: '意外发现了全恢复药！HP完全恢复！',
    effect(st) {
      const heal = st.pMaxHP - st.pHP
      st.pHP = st.pMaxHP
      return heal
    },
    weight: 1,
  },
  {
    id: 'tough_enemy',
    name: '强敌出没',
    icon: '⚠️',
    desc: '前方出现了一只强化的宝可梦！击败后获得额外奖励！',
    effect(st) {
      st._nextEnemyBuff = 1.5
      st._nextEnemyReward = 0.4
    },
    weight: 2,
  },
  {
    id: 'challenge',
    name: '神秘挑战',
    icon: '❓',
    desc: '一位神秘训练师提出挑战！答对额外回复HP，答错则扣血！',
    isChallenge: true,
    weight: 2,
  },
]

// Weighted random pick
export function pickRandomEvent() {
  const totalWeight = EVENTS.reduce((s, e) => s + e.weight, 0)
  let r = Math.random() * totalWeight
  for (const e of EVENTS) {
    r -= e.weight
    if (r <= 0) return e
  }
  return EVENTS[0]
}
