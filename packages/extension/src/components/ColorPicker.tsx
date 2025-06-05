import { useState, useEffect } from "react"
import { db } from "../lib/db"

interface ColorPickerProps {
  onColorSelect: (color: string) => void
  onClose: () => void
}

export const ColorPicker = ({ onColorSelect, onClose }: ColorPickerProps) => {
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [isNativeSupported, setIsNativeSupported] = useState(true)

  useEffect(() => {
    // Check if EyeDropper is supported
    setIsNativeSupported("EyeDropper" in window)
    
    // Load recent colors from Dexie
    const loadRecentColors = async () => {
      const colors = await db.colors.orderBy("timestamp").reverse().limit(20).toArray()
      setRecentColors(colors.map(c => c.value))
    }
    loadRecentColors()
  }, [])

  const handleColorPick = async () => {
    try {
      if (isNativeSupported) {
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        const color = result.sRGBHex
        
        // Save to Dexie
        await db.colors.add({
          value: color,
          timestamp: Date.now()
        })
        
        // Update local state immediately - add to beginning and limit to 20
        setRecentColors(prev => {
          const newColors = [color, ...prev.filter(c => c !== color)].slice(0, 20)
          return newColors
        })
        
        onColorSelect(color)
      } else {
        // TODO: Implement iro.js fallback
        console.log("EyeDropper not supported, falling back to iro.js")
      }
    } catch (error) {
      console.error("Color picker error:", error)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleColorPick}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-2"
      >
        <span>🎨</span>
        <span>Pick Color from Screen</span>
      </button>

      {!isNativeSupported && (
        <div className="p-3 bg-amber-900/50 border border-amber-600/50 rounded-lg">
          <p className="text-amber-200 text-xs">
            EyeDropper API is not supported in this browser. Please use Chrome 95+ or Edge 95+.
          </p>
        </div>
      )}

      {recentColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Recent Colors ({recentColors.length})
          </h3>
          <div className="grid grid-cols-8 gap-2">
            {recentColors.map((color, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <button
                  onClick={() => {
                    // Move clicked color to front of the list
                    setRecentColors(prev => {
                      const newColors = [color, ...prev.filter(c => c !== color)]
                      return newColors
                    })
                    onColorSelect(color)
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`Click to copy: ${color}`}
                />
                <span className="text-xs text-slate-400 font-mono text-center leading-none">
                  {color.substring(1).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 text-center mt-4 space-y-1">
        <p>Click "Pick Color" to use the eyedropper tool</p>
        <p>Selected colors are automatically copied to clipboard</p>
      </div>
    </div>
  )
} 