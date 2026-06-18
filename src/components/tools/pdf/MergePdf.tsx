import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropZone } from '@/components/shared/DropZone'
import {
  ArrowRight,
  CheckCircle,
  Download,
  FileText,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePremium } from '@/hooks/usePremium'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { ToolLayout, ToolUploadLayout } from '@/components/layout/ToolLayout'
import { PillToggle } from '@/components/shared/PillToggle'
import { downloadBlob } from '@/lib/canvas/export'

interface MergablePdf {
  id: string
  file: File
  pageCount: number
}

interface SortablePdfCardProps {
  pdf: MergablePdf
  removePdf: (id: string) => void
}

const SortablePdfCard: React.FC<SortablePdfCardProps> = ({ pdf, removePdf }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pdf.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10"
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-white/30 hover:text-white/60 transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium text-white truncate">{pdf.file.name}</span>
          <span className="text-xs text-muted-foreground">{pdf.pageCount} pages</span>
        </div>
      </div>
      <button 
        onClick={() => removePdf(pdf.id)}
        className="p-2 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export function MergePdf() {
  const { validateFiles } = usePremium()
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('bulk')
  const [pdfs, setPdfs] = useState<MergablePdf[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const { url: mergedUrl, setUrl: setMergedUrl, clear: clearMergedUrl } = useObjectUrl()
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDrop = async (acceptedFiles: File[]) => {
    if (!validateFiles(acceptedFiles, pdfs.length)) return
    
    const newPdfs: MergablePdf[] = []
    const pdfjsLib = await import('pdfjs-dist')
    await (window as any).pdfWorkerPromise

    for (const file of acceptedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        newPdfs.push({
          id: Math.random().toString(36).substring(7),
          file,
          pageCount: pdf.numPages,
        })
        await pdf.destroy()
      } catch (error) {
        console.error('Failed to process file:', file.name, error)
        toast.error(`Failed to load ${file.name}`)
      }
    }

    setPdfs(prev => [...prev, ...newPdfs])
  }

  const removePdf = (id: string) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== id))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPdfs((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const mergeFiles = async () => {
    if (pdfs.length < 2) {
      toast.error('Add at least 2 PDFs to merge')
      return
    }

    setIsMerging(true)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const mergedPdf = await PDFDocument.create()

      for (const pdfData of pdfs) {
        const arrayBuffer = await pdfData.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      setMergedBlob(blob)
      setMergedUrl(blob)
      toast.success('PDFs merged successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to merge PDFs')
    } finally {
      setIsMerging(false)
    }
  }

  const resetTool = () => {
    setPdfs([])
    clearMergedUrl()
    setMergedBlob(null)
    setIsMerging(false)
  }

  const getDropzoneProps = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: handleDrop,
      accept: { 'application/pdf': ['.pdf'] },
      multiple: true,
    })
    return { getRootProps, getInputProps, isDragActive }
  }

  const { getRootProps, getInputProps, isDragActive } = getDropzoneProps()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const renderTabSwitcher = () => (
    <div className="mb-10 flex justify-center">
      <PillToggle
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        options={[
          { id: 'single', label: 'Single Merge', icon: Layers },
          { id: 'bulk', label: 'Bulk Merge', icon: Layers },
        ]}
      />
    </div>
  )

  if (pdfs.length === 0 && !mergedUrl) {
    return (
      <ToolUploadLayout
        title="Merge PDFs"
        description="Combine multiple PDF files into one. 100% locally on your machine."
        icon={Layers}
      >
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ 'application/pdf': ['.pdf'] }} label="Drop PDF files here" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Merge PDFs"
      description={mergedUrl ? 'Merge complete' : `${pdfs.length} PDFs ready to merge`}
      icon={Layers}
      centered={true}
      maxWidth="max-w-3xl"
    >
      <div className="mb-10 flex justify-center">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: 'single', label: 'Single Merge', icon: Layers },
            { id: 'bulk', label: 'Bulk Merge', icon: Layers },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <div className="glass-panel p-8 rounded-2xl space-y-6">
            {mergedUrl ? (
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
                  <CheckCircle className="w-20 h-20 text-emerald-500 opacity-50" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-syne">Merge Complete!</h2>
                  <p className="text-muted-foreground mt-2">Your PDF has been merged successfully.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => {
                      if (mergedUrl && mergedBlob) {
                        downloadBlob(mergedBlob, 'vanity-merged.pdf')
                      }
                    }}
                    variant="primary"
                    className="px-8 py-5 text-lg font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Download className="w-6 h-6 mr-2" /> Download Merged PDF
                  </Button>
                  <Button
                    onClick={resetTool}
                    variant="secondary"
                    className="px-8 py-5 text-lg font-bold border border-white/10 transition-all"
                  >
                    Merge New PDFs
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <h3 className="font-bold font-syne text-white flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Files to Merge ({pdfs.length})
                  </h3>
                  <div {...getRootProps()} className="cursor-pointer">
                    <input {...getInputProps()} />
                    <Button variant="secondary" className="border border-white/10">
                      <Plus className="w-4 h-4 mr-2" />
                      Add PDFs
                    </Button>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  onDragStart={handleDragStart}
                >
                  <SortableContext
                    items={pdfs.map(pdf => pdf.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {pdfs.map(pdf => (
                        <SortablePdfCard
                          key={pdf.id}
                          pdf={pdf}
                          removePdf={removePdf}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="p-4 bg-white/10 border border-accent rounded-xl shadow-2xl">
                        {(() => {
                          const pdf = pdfs.find(p => p.id === activeId)
                          return pdf ? (
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-accent/20 rounded">
                                <FileText className="w-5 h-5 text-accent" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{pdf.file.name}</span>
                                <span className="text-xs text-muted-foreground">{pdf.pageCount} pages</span>
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>

                <div className="pt-6">
                  <Button
                    onClick={mergeFiles}
                    disabled={isMerging || pdfs.length < 2}
                    variant="primary"
                    className="w-full px-8 py-5 text-lg font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Merging PDFs...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Merge PDFs Now
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
