export interface QueueItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'failed'
  resultBlob?: Blob
  errorMessage?: string
  originalSize: number
  resultSize?: number
}
