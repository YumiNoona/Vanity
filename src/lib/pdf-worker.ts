import * as pdfjs from 'pdfjs-dist';

/**
 * Robustly sets up the PDF.js worker using the bundled worker file.
 * This avoids CDN issues and CSP blocks.
 */
export async function setupPdfWorker() {
  if (pdfjs.GlobalWorkerOptions.workerSrc) return;

  try {
    // In Vite, we use the ?url suffix to get the URL of the worker file
    // We target the .mjs version as it's the modern standard for pdfjs-dist v4+
    // @ts-ignore
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (error) {
    console.error('Failed to load PDF worker locally, falling back to CDN', error);
    // Fallback if local import fails for some reason
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
}
