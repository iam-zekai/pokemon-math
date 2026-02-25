// Player-selectable Pokemon
export const POKEMON = [
  {
    name: '皮卡丘', id: 25, type: 'electric', hp: 110, skills: [
      { name: '电击', type: 'electric', power: 25, acc: 100 },
      { name: '十万伏特', type: 'electric', power: 50, acc: 90 },
      { name: '电光一闪', type: 'normal', power: 30, acc: 100 },
      { name: '打雷', type: 'electric', power: 70, acc: 70 },
    ]
  },
  {
    name: '喷火龙', id: 6, type: 'fire', hp: 120, skills: [
      { name: '火花', type: 'fire', power: 25, acc: 100 },
      { name: '火焰喷射', type: 'fire', power: 50, acc: 90 },
      { name: '龙之怒', type: 'dragon', power: 40, acc: 100 },
      { name: '大字爆炎', type: 'fire', power: 75, acc: 70 },
    ]
  },
  {
    name: '水箭龟', id: 9, type: 'water', hp: 140, skills: [
      { name: '水枪', type: 'water', power: 25, acc: 100 },
      { name: '水炮', type: 'water', power: 55, acc: 85 },
      { name: '冰冻光线', type: 'ice', power: 45, acc: 90 },
      { name: '破坏光线', type: 'normal', power: 80, acc: 65 },
    ]
  },
  {
    name: '妙蛙花', id: 3, type: 'grass', hp: 130, skills: [
      { name: '藤鞭', type: 'grass', power: 25, acc: 100 },
      { name: '飞叶快刀', type: 'grass', power: 45, acc: 95 },
      { name: '寄生种子', type: 'grass', power: 35, acc: 90, heal: true },
      { name: '日光束', type: 'grass', power: 70, acc: 75 },
    ]
  },
  {
    name: '超梦', id: 150, type: 'psychic', hp: 100, skills: [
      { name: '念力', type: 'psychic', power: 30, acc: 100 },
      { name: '精神强念', type: 'psychic', power: 55, acc: 90 },
      { name: '暗影球', type: 'ghost', power: 45, acc: 95 },
      { name: '精神击破', type: 'psychic', power: 75, acc: 70 },
    ]
  },
  {
    name: '耿鬼', id: 94, type: 'ghost', hp: 95, skills: [
      { name: '舌舔', type: 'ghost', power: 25, acc: 100 },
      { name: '暗影球', type: 'ghost', power: 50, acc: 90 },
      { name: '催眠术', type: 'psychic', power: 35, acc: 85 },
      { name: '灭亡之歌', type: 'ghost', power: 70, acc: 70 },
    ]
  },
  {
    name: '卡比兽', id: 143, type: 'normal', hp: 180, skills: [
      { name: '撞击', type: 'normal', power: 25, acc: 100 },
      { name: '泰山压顶', type: 'normal', power: 50, acc: 90 },
      { name: '睡觉', type: 'psychic', power: 0, acc: 100, heal: true, healFlat: 60 },
      { name: '破坏光线', type: 'normal', power: 80, acc: 65 },
    ]
  },
  {
    name: '路卡利欧', id: 448, type: 'fighting', hp: 105, skills: [
      { name: '真空波', type: 'fighting', power: 30, acc: 100 },
      { name: '波导弹', type: 'fighting', power: 50, acc: 90 },
      { name: '骨头棒', type: 'fighting', power: 40, acc: 95 },
      { name: '近身战', type: 'fighting', power: 75, acc: 70 },
    ]
  },
  {
    name: '沙奈朵', id: 282, type: 'fairy', hp: 100, skills: [
      { name: '魅惑之声', type: 'fairy', power: 30, acc: 100 },
      { name: '月亮之力', type: 'fairy', power: 50, acc: 90 },
      { name: '精神强念', type: 'psychic', power: 45, acc: 90 },
      { name: '梦幻之光', type: 'fairy', power: 70, acc: 75 },
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
