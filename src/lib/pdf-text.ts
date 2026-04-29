import { PreloadPool } from "./preload-pool"

export interface ExtractPdfTextOptions {
  onProgress?: (percent: number) => void
  includePageMarkers?: boolean
}

export interface ExtractPdfTextResult {
  pageTexts: string[]
  fullText: string
}

export async function extractPdfText(
  file: File,
  options: ExtractPdfTextOptions = {}
): Promise<ExtractPdfTextResult> {
  const { onProgress, includePageMarkers = false } = options
  
  // Dynamic import of heavy PDF.js engine
  const pdfjsLib = await import("pdfjs-dist")
  const pdfWorker = (await import("pdfjs-dist/build/pdf.worker?url")).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item: any) => item.str).join(" ")
    pageTexts.push(text)
    onProgress?.(Math.round((i / pdf.numPages) * 100))
  }

  const fullText = includePageMarkers
    ? pageTexts.map((text, idx) => `--- Page ${idx + 1} ---\n${text}`).join("\n\n")
    : pageTexts.join("\n")

  // Cleanup PDF document resources
  try {
    await pdf.destroy()
  } catch (e) {
    console.warn("PDF destroy error", e)
  }

  return { pageTexts, fullText }
}

/**
 * Pre-warm the PDF.js engine
 */
export function prewarmPdf() {
  PreloadPool.pdf(() => import("pdfjs-dist"))
}
