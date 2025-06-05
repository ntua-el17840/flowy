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
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Color Picker</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <button
        onClick={handleColorPick}
        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
      >
        Pick Color
      </button>

      {recentColors.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Colors
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {recentColors.map((color, index) => (
              <button
                key={index}
                onClick={() => onColorSelect(color)}
                className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 