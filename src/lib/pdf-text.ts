import * as pdfjsLib from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

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

  return { pageTexts, fullText }
}
