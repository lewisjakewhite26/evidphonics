/** Procedural HSL linear gradient for activity tiles, phase cards, etc. */
export function generateTileGradient(seed: number): string {
  const seededRand = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000
    return x - Math.floor(x)
  }

  const angle = Math.floor(seededRand(0) * 60 + 110) // 110–170deg range

  const hue1 = Math.floor(seededRand(1) * 60 + 270) // 270–330
  const hue2 = Math.floor(seededRand(2) * 60 + 290) // 290–350
  const sat1 = Math.floor(seededRand(3) * 20 + 80) // 80–100%
  const sat2 = Math.floor(seededRand(4) * 20 + 70) // 70–90%
  const light1 = Math.floor(seededRand(5) * 15 + 35) // 35–50%
  const light2 = Math.floor(seededRand(6) * 15 + 50) // 50–65%

  return `linear-gradient(${angle}deg, hsl(${hue1}, ${sat1}%, ${light1}%) 0%, hsl(${hue2}, ${sat2}%, ${light2}%) 100%)`
}
