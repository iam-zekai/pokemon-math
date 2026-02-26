// Player-selectable Pokemon
// Skill power/acc reference authentic game values, scaled for this game's balance
// power roughly = original_power * 0.5~0.6, acc stays authentic
export const POKEMON = [
  {
    name: '皮卡丘', id: 25, type: 'electric', hp: 110, skills: [
      { name: '电击', type: 'electric', power: 20, acc: 100 },       // 原作40/100
      { name: '十万伏特', type: 'electric', power: 50, acc: 100 },   // 原作90/100
      { name: '电光一闪', type: 'normal', power: 20, acc: 100 },     // 原作40/100 先制
      { name: '打雷', type: 'electric', power: 65, acc: 70 },        // 原作110/70
    ]
  },
  {
    name: '喷火龙', id: 6, type: 'fire', hp: 120, skills: [
      { name: '火花', type: 'fire', power: 20, acc: 100 },           // 原作40/100
      { name: '喷射火焰', type: 'fire', power: 50, acc: 100 },      // 原作90/100
      { name: '龙之怒', type: 'dragon', power: 40, acc: 100 },       // 原作固定40伤害/100
      { name: '大字爆炎', type: 'fire', power: 65, acc: 85 },        // 原作110/85
    ]
  },
  {
    name: '水箭龟', id: 9, type: 'water', hp: 140, skills: [
      { name: '水枪', type: 'water', power: 20, acc: 100 },          // 原作40/100
      { name: '冲浪', type: 'water', power: 50, acc: 100 },          // 原作90/100
      { name: '冰冻光线', type: 'ice', power: 50, acc: 100 },        // 原作90/100
      { name: '水炮', type: 'water', power: 65, acc: 80 },           // 原作110/80
    ]
  },
  {
    name: '妙蛙花', id: 3, type: 'grass', hp: 130, skills: [
      { name: '藤鞭', type: 'grass', power: 23, acc: 100 },          // 原作45/100
      { name: '飞叶快刀', type: 'grass', power: 28, acc: 95 },       // 原作55/95
      { name: '寄生种子', type: 'grass', power: 0, acc: 90, heal: true, healFlat: 30 }, // 原作吸血效果
      { name: '日光束', type: 'grass', power: 65, acc: 100 },        // 原作120/100 需蓄力
    ]
  },
  {
    name: '超梦', id: 150, type: 'psychic', hp: 100, skills: [
      { name: '念力', type: 'psychic', power: 25, acc: 100 },        // 原作50/100
      { name: '精神强念', type: 'psychic', power: 50, acc: 100 },    // 原作90/100
      { name: '暗影球', type: 'ghost', power: 40, acc: 100 },        // 原作80/100
      { name: '精神击破', type: 'psychic', power: 65, acc: 100 },    // 原作120/100 降特防
    ]
  },
  {
    name: '耿鬼', id: 94, type: 'ghost', hp: 105, skills: [
      { name: '影子球', type: 'ghost', power: 25, acc: 100 },        // 原作30/100
      { name: '暗影球', type: 'ghost', power: 45, acc: 100 },        // 原作80/100
      { name: '污泥炸弹', type: 'poison', power: 50, acc: 100 },     // 原作90/100
      { name: '灭亡之歌', type: 'ghost', power: 70, acc: 85 },       // 原作特殊技/—
    ]
  },
  {
    name: '卡比兽', id: 143, type: 'normal', hp: 155, skills: [
      { name: '撞击', type: 'normal', power: 20, acc: 100 },         // 原作40/100
      { name: '泰山压顶', type: 'normal', power: 43, acc: 100 },     // 原作85/100
      { name: '睡觉', type: 'psychic', power: 0, acc: 100, heal: true, healFlat: 50 }, // 原作回满/睡2回合
      { name: '破坏光线', type: 'normal', power: 65, acc: 90 },      // 原作150/90 需休息
    ]
  },
  {
    name: '路卡利欧', id: 448, type: 'fighting', hp: 110, skills: [
      { name: '真空波', type: 'fighting', power: 20, acc: 100 },     // 原作40/100 先制
      { name: '波导弹', type: 'fighting', power: 45, acc: 100 },     // 原作80/必中
      { name: '金属爪', type: 'steel', power: 28, acc: 95 },         // 原作50/95
      { name: '近身战', type: 'fighting', power: 65, acc: 100 },     // 原作120/100 降双防
    ]
  },
  {
    name: '沙奈朵', id: 282, type: 'fairy', hp: 100, skills: [
      { name: '魅惑之声', type: 'fairy', power: 20, acc: 100 },      // 原作40/必中
      { name: '月亮之力', type: 'fairy', power: 48, acc: 100 },      // 原作95/100
      { name: '精神强念', type: 'psychic', power: 50, acc: 100 },    // 原作90/100
      { name: '未来预知', type: 'psychic', power: 60, acc: 100 },    // 原作120/100 延迟
    ]
  },
]

// Enemy Pokemon pool
export const ENEMIES = [
  { name: '小拉达', id: 19, type: 'normal', atk: 14 },
  { name: '大针蜂', id: 15, type: 'bug', atk: 18 },
  { name: '烈雀', id: 21, type: 'flying', atk: 16 },
  { name: '阿柏蛇', id: 23, type: 'poison', atk: 17 },
  { name: '小火马', id: 77, type: 'fire', atk: 19 },
  { name: '可达鸭', id: 54, type: 'water', atk: 16 },
  { name: '催眠貘', id: 96, type: 'psychic', atk: 18 },
  { name: '小磁怪', id: 81, type: 'electric', atk: 17 },
  { name: '大岩蛇', id: 95, type: 'rock', atk: 20 },
  { name: '腕力', id: 66, type: 'fighting', atk: 19 },
  { name: '迷你龙', id: 147, type: 'dragon', atk: 21 },
  { name: '拉普拉斯', id: 131, type: 'ice', atk: 22 },
  { name: '六尾', id: 37, type: 'fire', atk: 17 },
  { name: '臭泥', id: 88, type: 'poison', atk: 18 },
  { name: '穿山鼠', id: 27, type: 'normal', atk: 16 },
  { name: '海星星', id: 120, type: 'water', atk: 17 },
  { name: '皮皮', id: 35, type: 'fairy', atk: 15 },
  { name: '凯西', id: 63, type: 'psychic', atk: 19 },
]
