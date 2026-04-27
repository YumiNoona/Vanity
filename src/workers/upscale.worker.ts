/**
 * Lanczos3 upscaling worker
 */

function lanczos3(x: number): number {
  if (x === 0) return 1;
  if (x < -3 || x > 3) return 0;
  const px = Math.PI * x;
  return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px);
}

self.onmessage = (e) => {
  const { srcData, srcW, srcH, dstW, dstH } = e.data;
  const dst = new Uint8ClampedArray(dstW * dstH * 4);
  
  const ratioX = srcW / dstW;
  const ratioY = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const srcX = (dx + 0.5) * ratioX - 0.5;
      const srcY = (dy + 0.5) * ratioY - 0.5;

      let r = 0, g = 0, b = 0, a = 0, weightSum = 0;

      const x0 = Math.max(0, Math.floor(srcX) - 2);
      const x1 = Math.min(srcW - 1, Math.floor(srcX) + 3);
      const y0 = Math.max(0, Math.floor(srcY) - 2);
      const y1 = Math.min(srcH - 1, Math.floor(srcY) + 3);

      for (let sy = y0; sy <= y1; sy++) {
        for (let sx = x0; sx <= x1; sx++) {
          const weight = lanczos3(srcX - sx) * lanczos3(srcY - sy);
          const idx = (sy * srcW + sx) * 4;
          r += srcData[idx] * weight;
          g += srcData[idx + 1] * weight;
          b += srcData[idx + 2] * weight;
          a += srcData[idx + 3] * weight;
          weightSum += weight;
        }
      }

      const dIdx = (dy * dstW + dx) * 4;
      if (weightSum > 0) {
        dst[dIdx] = Math.max(0, Math.min(255, r / weightSum));
        dst[dIdx + 1] = Math.max(0, Math.min(255, g / weightSum));
        dst[dIdx + 2] = Math.max(0, Math.min(255, b / weightSum));
        dst[dIdx + 3] = Math.max(0, Math.min(255, a / weightSum));
      }
    }

    if (dy % 40 === 0) {
      self.postMessage({ 
        type: 'progress', 
        progress: Math.round((dy / dstH) * 100) 
      });
    }
  }

  self.postMessage({ 
    type: 'done', 
    data: dst 
  }, [dst.buffer] as any);
};
