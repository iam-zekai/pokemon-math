// Sprite CDN
const CDN1 = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites/sprites/pokemon'
const CDN2 = 'https://fastly.jsdelivr.net/gh/PokeAPI/sprites/sprites/pokemon'

export const spr = id => `${CDN1}/${id}.png`
export const sprBack = id => `${CDN1}/back/${id}.png`
export const sprFallback = id => `${CDN2}/${id}.png`
export const sprBackFallback = id => `${CDN2}/back/${id}.png`

export function imgFallback(el, fallbackSrc) {
  el.onerror = function () {
    if (this.dataset.tried) return
    this.dataset.tried = '1'
    this.src = fallbackSrc
  }
}

// Type colors
export const TYPE_COLORS = {
  electric: '#eab308', fire: '#ef4444', water: '#3b82f6', grass: '#22c55e',
  normal: '#9ca3af', ghost: '#8b5cf6', flying: '#93c5fd', bug: '#84cc16',
  psychic: '#ec4899', poison: '#a855f7', rock: '#78716c', fighting: '#b45309',
  ice: '#67e8f9', dragon: '#7c3aed', dark: '#44403c', fairy: '#f9a8d4',
  steel: '#94a3b8',
}

// Type icons
export const TYPE_ICONS = {
  electric: '⚡', fire: '🔥', water: '💧', grass: '🍃',
  normal: '💥', ghost: '👻', flying: '🌪️', bug: '🐛',
  psychic: '🔮', poison: '☠️', rock: '🪨', fighting: '👊',
  ice: '❄️', dragon: '🐲', dark: '🌑', fairy: '✨',
  steel: '🔩',
}

// Type effectiveness chart (attacker -> defender -> multiplier)
export const TYPE_EFF = {
  fire: { grass: 2, ice: 2, bug: 2, water: 0.5, rock: 0.5, fire: 0.5, dragon: 0.5 },
  water: { fire: 2, rock: 2, ice: 0.5, water: 0.5, grass: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, rock: 2, grass: 0.5, fire: 0.5, flying: 0.5, bug: 0.5, poison: 0.5, dragon: 0.5 },
  ice: { grass: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0 },
  ghost: { ghost: 2, psychic: 2, normal: 0, dark: 0.5 },
  dragon: { dragon: 2, fairy: 0 },
  dark: { ghost: 2, psychic: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  fighting: { normal: 2, rock: 2, ice: 2, dark: 2, ghost: 0, flying: 0.5, psychic: 0.5, fairy: 0.5 },
  normal: { ghost: 0, rock: 0.5 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5 },
  poison: { grass: 2, fairy: 2, poison: 0.5, rock: 0.5, ghost: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, flying: 0.5, ghost: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5 },
  steel: { rock: 2, ice: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
}

export function getTypeMultiplier(atkType, defType) {
  const chart = TYPE_EFF[atkType]
  if (!chart) return 1
  return chart[defType] ?? 1
}
