import { useEffect, useState, useCallback, useMemo } from "react"
import { CommandPalette } from "./CommandPalette"
import { Action } from "../types/action"
import Fuse from "fuse.js"

interface ToolFinderPaletteProps {
  onClose: () => void
  actions: Action[]
  isPopup?: boolean
  onToolSelect?: (toolId: string) => void
}

// Default tools list
const DEFAULT_TOOLS: Action[] = [
  {
    id: "background-removal",
    name: "Background Removal",
    description: "Remove background from images using AI",
    handler: () => console.log("Background removal tool"),
    shortcut: "",
    tags: ["image", "ai", "background", "remove"]
  },
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Pick colors from any webpage",
    handler: () => console.log("Color picker tool"),
    shortcut: "",
    tags: ["color", "picker", "design"]
  },
  {
    id: "file-converter",
    name: "File Converter",
    description: "Convert files between different formats",
    handler: () => console.log("File converter tool"),
    shortcut: "",
    tags: ["file", "convert", "format"]
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop and resize images",
    handler: () => console.log("Image cropper tool"),
    shortcut: "",
    tags: ["image", "crop", "resize"]
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    description: "Merge multiple PDF files into one",
    handler: () => console.log("PDF merger tool"),
    shortcut: "",
    tags: ["pdf", "merge", "combine"]
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for text, URLs, and more",
    handler: () => console.log("QR generator tool"),
    shortcut: "",
    tags: ["qr", "code", "generate"]
  },
  {
    id: "text-formatter",
    name: "Text Formatter",
    description: "Format and transform text in various ways",
    handler: () => console.log("Text formatter tool"),
    shortcut: "",
    tags: ["text", "format", "transform"]
  },
  {
    id: "url-shortener",
    name: "URL Shortener",
    description: "Create short URLs for long links",
    handler: () => console.log("URL shortener tool"),
    shortcut: "",
    tags: ["url", "shorten", "link"]
  },
  {
    id: "video-compressor",
    name: "Video Compressor",
    description: "Compress video files to reduce size",
    handler: () => console.log("Video compressor tool"),
    shortcut: "",
    tags: ["video", "compress", "size"]
  },
  {
    id: "watermark-remover",
    name: "Watermark Remover",
    description: "Remove watermarks from images",
    handler: () => console.log("Watermark remover tool"),
    shortcut: "",
    tags: ["watermark", "remove", "image"]
  }
]

export const ToolFinderPalette = ({ onClose, actions, isPopup = false, onToolSelect }: ToolFinderPaletteProps) => {
  const [query, setQuery] = useState("")
  const [filteredTools, setFilteredTools] = useState<Action[]>([])
  
  // Use actions from props or default tools if empty and sort them
  const sortedTools = useMemo(() => {
    const allTools = actions.length > 0 ? actions : DEFAULT_TOOLS
    return [...allTools].sort((a, b) => a.name.localeCompare(b.name))
  }, [actions])

  useEffect(() => {
    if (query.trim()) {
      const fuse = new Fuse(sortedTools, {
        keys: ["name", "description", "tags"],
        threshold: 0.3,
        includeScore: true
      })
      const results = fuse.search(query).map((result) => result.item)
      setFilteredTools(results)
    } else {
      setFilteredTools(sortedTools)
    }
  }, [query, sortedTools])

  const handleSelect = useCallback(async (action: Action) => {
    try {
      // If we're in popup mode and onToolSelect is provided, use it
      if (isPopup && onToolSelect) {
        onToolSelect(action.id)
        return
      }
      
      // Otherwise, execute the handler as before
      if (typeof action.handler === 'function') {
        await action.handler()
      } else {
        console.log('Action handler not implemented:', action.name)
      }
      onClose()
    } catch (error) {
      console.error(`Error executing action ${action.name}:`, error)
    }
  }, [onClose, isPopup, onToolSelect])

  // For popup version, render a custom interface
  if (isPopup) {
    return (
      <div className="w-full">
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full px-4 py-3 text-lg border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: '#374151',
              color: '#f1f5f9',
              fontSize: '16px',
              fontWeight: '400'
            }}
          />
        </div>

        {/* Tools list */}
        <div className="max-h-80 overflow-y-auto rounded-lg" style={{ backgroundColor: '#374151' }}>
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                onClick={() => handleSelect(tool)}
                className="px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-slate-600 last:border-b-0 hover:bg-blue-600"
                style={{
                  fontSize: '14px'
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">{tool.name}</span>
                  {tool.description && (
                    <span className="text-xs text-slate-400 mt-1">{tool.description}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center" style={{ color: '#64748b', fontSize: '14px' }}>
              {query.trim() ? `No tools found for "${query}"` : "No tools available"}
            </div>
          )}
        </div>

        {/* Tool count */}
        <div className="mt-3 text-xs text-slate-500 text-center">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} 
          {query.trim() && ` matching "${query}"`}
        </div>
      </div>
    )
  }

  // For overlay version, use the CommandPalette
  return (
    <CommandPalette
      items={filteredTools}
      onSelect={handleSelect}
      onQueryChange={setQuery}
      onClose={onClose}
      placeholder="Search tools..."
      mode="tool"
      isPopup={isPopup}
    />
  )
} 