// Gym definitions - 8 gyms mapped to math topics
// Each gym: 3 trainers + 1 leader boss fight
// Gym definitions - no external imports needed

export const GYMS = [
  {
    id: 1,
    name: '基础道馆',
    topics: ['集合', '逻辑'],
    maxDiff: 1,
    trainers: 3,
    trainerScale: 0.6,
    enemyTypes: ['normal', 'bug'],
    leader: {
      name: '集合大师 小智',
      avatar: '⚡',
      pokemon: { name: '皮卡丘', id: 25, type: 'electric', lv: 15, hp: 140, atkPow: 20 },
      skills: [
        { name: '电击', type: 'electric', power: 20, acc: 100 },
        { name: '十万伏特', type: 'electric', power: 50, acc: 100 },
      ],
      preBattle: [
        '你终于来了！我是集合大师小智！',
        '集合和逻辑是数学的基石...',
        '来吧，用你的知识打败我！',
      ],
      postDefeat: [
        '好厉害！你的基础知识很扎实！',
        '这是基础徽章，继续你的旅程吧！',
      ],
      badge: '🔰',
      badgeName: '基础徽章',
    },
    intro: [
      '这里是基础道馆——一切数学的起点。',
      '打败道馆里的训练师，才能挑战馆主！',
    ],
  },
  {
    id: 2,
    name: '函数研究所',
    topics: ['函数'],
    maxDiff: 2,
    trainers: 3,
    trainerScale: 0.7,
    enemyTypes: ['water', 'normal'],
    leader: {
      name: '函数博士 小霞',
      avatar: '💧',
      pokemon: { name: '海星星', id: 120, type: 'water', lv: 20, hp: 170, atkPow: 23 },
      skills: [
        { name: '水枪', type: 'water', power: 20, acc: 100 },
        { name: '冲浪', type: 'water', power: 50, acc: 100 },
      ],
      preBattle: [
        '欢迎来到函数研究所！',
        '函数就像水流，有定义域，有值域...',
        '让我看看你对函数的理解！',
      ],
      postDefeat: [
        '没想到你函数学得这么好！',
        '给你函数徽章，向下一站出发吧！',
      ],
      badge: '📐',
      badgeName: '函数徽章',
    },
    intro: [
      '函数研究所——探索变量关系的殿堂。',
      '小霞博士精通各种函数性质，小心应对！',
    ],
  },
  {
    id: 3,
    name: '指对数之塔',
    topics: ['指数对数'],
    maxDiff: 2,
    trainers: 3,
    trainerScale: 0.8,
    enemyTypes: ['rock', 'electric'],
    leader: {
      name: '对数仙人 马志士',
      avatar: '🪨',
      pokemon: { name: '大岩蛇', id: 95, type: 'rock', lv: 25, hp: 200, atkPow: 26 },
      skills: [
        { name: '落石', type: 'rock', power: 25, acc: 90 },
        { name: '岩崩', type: 'rock', power: 45, acc: 90 },
      ],
      preBattle: [
        '哼！能爬到这里，看来有点实力。',
        '指数和对数，互为逆运算...',
        '试试你能不能算过我！',
      ],
      postDefeat: [
        '居然被你解出来了...了不起。',
        '指数徽章是你的了！',
      ],
      badge: '📊',
      badgeName: '指数徽章',
    },
    intro: [
      '指对数之塔——越往上越难！',
      '马志士以坚固如岩石的指数功力闻名。',
    ],
  },
  {
    id: 4,
    name: '三角竞技场',
    topics: ['三角函数'],
    maxDiff: 2,
    trainers: 3,
    trainerScale: 0.9,
    enemyTypes: ['fairy', 'psychic'],
    leader: {
      name: '三角女王 娜姿',
      avatar: '✨',
      pokemon: { name: '沙奈朵', id: 282, type: 'fairy', lv: 30, hp: 210, atkPow: 28 },
      skills: [
        { name: '魅惑之声', type: 'fairy', power: 20, acc: 100 },
        { name: '月亮之力', type: 'fairy', power: 48, acc: 100 },
      ],
      preBattle: [
        '欢迎来到三角竞技场。',
        'sin、cos、tan...诱导公式、二倍角...',
        '你准备好面对三角函数的考验了吗？',
      ],
      postDefeat: [
        '你的三角函数功力让我印象深刻！',
        '三角徽章归你了，继续前进！',
      ],
      badge: '📏',
      badgeName: '三角徽章',
    },
    intro: [
      '三角竞技场——空气中弥漫着正弦波的气息。',
      '娜姿女王以诱导公式闻名，小心应对！',
    ],
  },
  {
    id: 5,
    name: '数列道场',
    topics: ['数列', '不等式'],
    maxDiff: 3,
    trainers: 3,
    trainerScale: 1.0,
    enemyTypes: ['fighting', 'normal'],
    leader: {
      name: '数列达人 阿桔',
      avatar: '👊',
      pokemon: { name: '路卡利欧', id: 448, type: 'fighting', lv: 35, hp: 210, atkPow: 30 },
      skills: [
        { name: '波导弹', type: 'fighting', power: 40, acc: 100 },
        { name: '近身战', type: 'fighting', power: 60, acc: 100 },
      ],
      preBattle: [
        '数列道场讲究的是规律和毅力！',
        '等差、等比、求和公式...',
        '来和我的路卡利欧一决高下！',
      ],
      postDefeat: [
        '你找到了规律！出色的战斗！',
        '数列徽章属于你了！',
      ],
      badge: '🔢',
      badgeName: '数列徽章',
    },
    intro: [
      '数列道场——在这里寻找规律的力量。',
      '阿桔用等差数列般精准的拳法战斗！',
    ],
  },
  {
    id: 6,
    name: '向量空间',
    topics: ['向量', '解析几何'],
    maxDiff: 3,
    trainers: 3,
    trainerScale: 1.1,
    enemyTypes: ['ice', 'water'],
    leader: {
      name: '向量猎人 科拿',
      avatar: '❄️',
      pokemon: { name: '拉普拉斯', id: 131, type: 'ice', lv: 40, hp: 240, atkPow: 32 },
      skills: [
        { name: '冰冻光线', type: 'ice', power: 50, acc: 100 },
        { name: '暴风雪', type: 'ice', power: 65, acc: 90 },
      ],
      preBattle: [
        '向量空间...方向与大小的世界。',
        '你能在坐标系中找到正确的方向吗？',
        '我的拉普拉斯会给你答案！',
      ],
      postDefeat: [
        '你在向量空间中找到了正确的方向。',
        '几何徽章送给你！',
      ],
      badge: '🧭',
      badgeName: '几何徽章',
    },
    intro: [
      '向量空间——一切都有方向和大小。',
      '科拿用冰冷的精准度驰骋在坐标系中。',
    ],
  },
  {
    id: 7,
    name: '概率殿堂',
    topics: ['概率', '复数'],
    maxDiff: 3,
    trainers: 3,
    trainerScale: 1.2,
    enemyTypes: ['dragon', 'psychic'],
    leader: {
      name: '概率之王 渡',
      avatar: '🐲',
      pokemon: { name: '哈克龙', id: 148, type: 'dragon', lv: 45, hp: 260, atkPow: 35 },
      skills: [
        { name: '龙之怒', type: 'dragon', power: 40, acc: 100 },
        { name: '逆鳞', type: 'dragon', power: 65, acc: 100 },
      ],
      preBattle: [
        '概率殿堂...命运在这里被计算。',
        '排列组合、条件概率、复数运算...',
        '你有多少胜算？让我们算算看！',
      ],
      postDefeat: [
        '你的胜率竟然是100%...了不起！',
        '概率徽章是你应得的奖赏！',
      ],
      badge: '🎲',
      badgeName: '概率徽章',
    },
    intro: [
      '概率殿堂——命运的数字在此交汇。',
      '渡精通排列组合，每一步都经过精密计算。',
    ],
  },
  {
    id: 8,
    name: '微积分之巅',
    topics: ['导数', '立体几何', '方程'],
    maxDiff: 3,
    trainers: 3,
    trainerScale: 1.3,
    enemyTypes: ['psychic', 'ghost'],
    leader: {
      name: '大木博士',
      avatar: '🔮',
      pokemon: { name: '超梦', id: 150, type: 'psychic', lv: 50, hp: 300, atkPow: 38 },
      skills: [
        { name: '精神强念', type: 'psychic', power: 50, acc: 100 },
        { name: '精神击破', type: 'psychic', power: 65, acc: 100 },
      ],
      preBattle: [
        '你终于来到了微积分之巅。',
        '导数、立体几何、方程...这里汇聚了最强的数学力量。',
        '我是大木博士，准备好接受最终考验了吗？',
      ],
      postDefeat: [
        '太出色了！你已经掌握了数学的精髓！',
        '终极徽章...你是真正的数学冠军！',
      ],
      badge: '🏅',
      badgeName: '终极徽章',
    },
    intro: [
      '微积分之巅——传说中只有最强训练师才能到达的地方。',
      '大木博士和超梦在这里等待着你...',
    ],
  },
]
