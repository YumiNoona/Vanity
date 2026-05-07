// Seeded RNG to match Rust frand logic
class Rng {
  private s: number
  constructor(seed = 12345) { this.s = seed >>> 0 }
  next(): number {
    this.s = Math.imul(this.s, 1664525) + 1013904223 >>> 0
    return this.s
  }
}

function heuristic(
  ax: number, ay: number,   // current position
  bx: number, by: number,   // target position
  ar: number, ag: number, ab: number,  // source pixel color
  tr: number, tg: number, tb: number,  // target color at that position
  spatialWeight: number      // proximityImportance
): number {
  const spatial = (ax - bx) ** 2 + (ay - by) ** 2
  const color = (ar - tr) ** 2 + (ag - tg) ** 2 + (ab - tb) ** 2
  
  // Replicate Rust i64 overflow behavior by capping the spatial term.
  // In JS, we use 2^53 (Number.MAX_SAFE_INTEGER) as the practical limit.
  const I64_MAX = 2 ** 53
  const spatialTerm = ((spatial * spatialWeight) ** 2) % I64_MAX
  return (color * 255 + spatialTerm) % I64_MAX
}

function makeImage(
  r: Uint8Array, g: Uint8Array, b: Uint8Array, 
  sidelen: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(sidelen * sidelen * 4)
  for (let i = 0; i < sidelen * sidelen; i++) {
    const base = i * 4
    out[base]   = r[i]
    out[base+1] = g[i]
    out[base+2] = b[i]
    out[base+3] = 255
  }
  return out
}

let isCancelled = false

self.onmessage = (e: MessageEvent) => {
  const { type, sourcePixels, targetPixels, sidelen, proximityImportance } = e.data

  if (type === 'cancel') {
    isCancelled = true
    return
  }

  isCancelled = false
  const pixelCount = sidelen * sidelen
  const SWAPS_PER_GENERATION_PER_PIXEL = 128

  // Deconstruct RGBA to separate RGB arrays for speed
  const srcR = new Uint8Array(pixelCount)
  const srcG = new Uint8Array(pixelCount)
  const srcB = new Uint8Array(pixelCount)
  const tgtR = new Uint8Array(pixelCount)
  const tgtG = new Uint8Array(pixelCount)
  const tgtB = new Uint8Array(pixelCount)

  for (let i = 0; i < pixelCount; i++) {
    srcR[i] = sourcePixels[i * 4]
    srcG[i] = sourcePixels[i * 4 + 1]
    srcB[i] = sourcePixels[i * 4 + 2]
    tgtR[i] = targetPixels[i * 4]
    tgtG[i] = targetPixels[i * 4 + 1]
    tgtB[i] = targetPixels[i * 4 + 2]
  }

  // Pixel data for current arrangement
  const currR = new Uint8Array(srcR)
  const currG = new Uint8Array(srcG)
  const currB = new Uint8Array(srcB)
  const currX = new Int16Array(pixelCount) // original X
  const currY = new Int16Array(pixelCount) // original Y
  const currH = new Float64Array(pixelCount) // current heuristic cost

  for (let i = 0; i < pixelCount; i++) {
    const x = i % sidelen
    const y = Math.floor(i / sidelen)
    currX[i] = x
    currY[i] = y
    currH[i] = heuristic(x, y, x, y, currR[i], currG[i], currB[i], tgtR[i], tgtG[i], tgtB[i], proximityImportance)
  }

  const rng = new Rng()
  let maxDist = sidelen

  const loop = () => {
    if (isCancelled) {
      self.postMessage({ type: 'cancelled' })
      return
    }

    let swapsMade = 0
    const iterations = SWAPS_PER_GENERATION_PER_PIXEL * pixelCount

    for (let i = 0; i < iterations; i++) {
      const apos = rng.next() % pixelCount
      const ax = apos % sidelen
      const ay = Math.floor(apos / sidelen)
      
      const dx = (rng.next() % (2 * maxDist + 1)) - maxDist
      const dy = (rng.next() % (2 * maxDist + 1)) - maxDist
      
      const bx = Math.max(0, Math.min(sidelen - 1, ax + dx))
      const by = Math.max(0, Math.min(sidelen - 1, ay + dy))
      const bpos = by * sidelen + bx

      if (apos === bpos) continue

      // Cost of pixel currently at apos moving to bpos
      const aOnB = heuristic(currX[apos], currY[apos], bx, by, currR[apos], currG[apos], currB[apos], tgtR[bpos], tgtG[bpos], tgtB[bpos], proximityImportance)
      
      // Cost of pixel currently at bpos moving to apos
      const bOnA = heuristic(currX[bpos], currY[bpos], ax, ay, currR[bpos], currG[bpos], currB[bpos], tgtR[apos], tgtG[apos], tgtB[apos], proximityImportance)

      const improvementA = currH[apos] - bOnA
      const improvementB = currH[bpos] - aOnB

      if (improvementA + improvementB > 0) {
        // SWAP
        const tr = currR[apos]; currR[apos] = currR[bpos]; currR[bpos] = tr
        const tg = currG[apos]; currG[apos] = currG[bpos]; currG[bpos] = tg
        const tb = currB[apos]; currB[apos] = currB[bpos]; currB[bpos] = tb
        const tx = currX[apos]; currX[apos] = currX[bpos]; currX[bpos] = tx
        const ty = currY[apos]; currY[apos] = currY[bpos]; currY[bpos] = ty
        
        currH[apos] = bOnA
        currH[bpos] = aOnB
        swapsMade++
      }
    }

    const preview = makeImage(currR, currG, currB, sidelen)
    self.postMessage({ type: 'preview', pixels: preview })
    self.postMessage({ type: 'progress', value: 1.0 - maxDist / sidelen })

    if (maxDist < 4 && swapsMade < 10) {
      self.postMessage({ type: 'done', pixels: preview })
      return
    }

    maxDist = Math.max(Math.floor(maxDist * 0.99), 2)
    
    // Use setTimeout to avoid blocking the worker event loop and allow cancellation messages to come through
    setTimeout(loop, 0)
  }

  loop()
}
