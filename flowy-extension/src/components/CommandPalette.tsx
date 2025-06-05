import { useEffect, useRef, useState } from "react"
import Fuse from "fuse.js"
import { useDebounce } from "../lib/hooks"

interface CommandPaletteProps {
  items: Array<{ id: string; name: string; [key: string]: any }>
  onSelect: (item: any) => void
  onClose: () => void
  placeholder?: string
  mode?: "web" | "tool"
}

export const CommandPalette = ({
  items,
  onSelect,
  onClose,
  placeholder = "Search...",
  mode = "web"
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const fuse = new Fuse(items, {
    keys: ["name"],
    threshold: 0.3,
    includeScore: true
  })

  const results = debouncedQuery
    ? fuse.search(debouncedQuery).map((result) => result.item)
    : items

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case "Enter":
        e.preventDefault()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {results.map((item, index) => (
            <div
              key={item.id}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedIndex
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => onSelect(item)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 