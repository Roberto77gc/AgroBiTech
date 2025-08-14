export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'm3'

const toBase = (value: number, unit: Unit): number => {
  switch (unit) {
    case 'kg': return value * 1000 // base g
    case 'g': return value
    case 'L': return value * 1000 // base ml
    case 'ml': return value
    case 'm3': return value * 1000000 // base ml
    default: return value
  }
}

const fromBase = (baseValue: number, unit: Unit): number => {
  switch (unit) {
    case 'kg': return baseValue / 1000
    case 'g': return baseValue
    case 'L': return baseValue / 1000
    case 'ml': return baseValue
    case 'm3': return baseValue / 1000000
    default: return baseValue
  }
}

export function convertAmount(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  // Elegir base común: para masa usamos g; para volumen ml
  const isMass = (u: Unit) => u === 'kg' || u === 'g'
  const isVolume = (u: Unit) => u === 'L' || u === 'ml' || u === 'm3'

  if (isMass(from) && isMass(to)) {
    const base = toBase(value, from)
    return fromBase(base, to)
  }
  if (isVolume(from) && isVolume(to)) {
    // normalizamos a ml como base
    const toMl = (val: number, u: Unit) => (u === 'L' ? val * 1000 : u === 'm3' ? val * 1000000 : val)
    const fromMl = (ml: number, u: Unit) => (u === 'L' ? ml / 1000 : u === 'm3' ? ml / 1000000 : ml)
    const baseMl = toMl(value, from)
    return fromMl(baseMl, to)
  }
  // Si no son del mismo tipo, devolvemos el valor sin cambios
  return value
}


