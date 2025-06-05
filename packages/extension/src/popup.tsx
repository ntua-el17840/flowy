import { useEffect, useState } from 'react';
import './styles.css';
import { CommandPalette } from "./components/CommandPalette";
import { ColorPicker } from "./components/ColorPicker";
import { WebSearchPalette } from "./components/WebSearchPalette";
import { ToolFinderPalette } from "./components/ToolFinderPalette";
import { Action } from "./types/action";
import { db } from "./lib/db";
import { SEARCH_ENGINES } from "./types/settings";

export const Popup = () => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [palette, setPalette] = useState<null | 'web' | 'tool'>('web'); // Default to web search
  const [actions, setActions] = useState<Action[]>([]);
  const [defaultEngine, setDefaultEngine] = useState("google");

  useEffect(() => {
    // Listen for messages from background
    const handler = (msg: any) => {
      if (msg.type === 'OPEN_WEB_SEARCH') {
        setPalette('web');
      }
      if (msg.type === 'OPEN_TOOL_FINDER') {
        setPalette('tool');
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    // Load actions for tool finder
    db.actions.toArray().then(setActions);
    // Load default search engine
    chrome.storage.sync.get(['settings'], (result) => {
      setDefaultEngine(result.settings?.defaultSearchEngine || 'google');
    });
  }, []);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    // TODO: Copy to clipboard or show in a more prominent way
  };

  const handleToolAction = (action: Action) => {
    // Handle tool execution
    console.log('Executing tool:', action.name);
    setPalette(null);
  };

  // Header component with navigation
  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b" style={{ 
      backgroundColor: '#1e293b', 
      borderColor: '#334155' 
    }}>
      <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
        Flowy
      </h2>
      <div className="flex gap-2">
        <button
          onClick={() => setPalette('web')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            palette === 'web' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setPalette('tool')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            palette === 'tool' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Tools
        </button>
        <button
          onClick={() => setShowColorPicker(true)}
          className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white transition-colors"
        >
          Colors
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-96 bg-slate-800" style={{ backgroundColor: '#0f172a', minHeight: '400px' }}>
      {showColorPicker ? (
        <ColorPicker
          onColorSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      ) : (
        <>
          {renderHeader()}
          <div className="p-4">
            {palette === 'web' ? (
              <WebSearchPalette
                onClose={() => setPalette('web')} // Keep it open in popup mode
                defaultEngine={defaultEngine}
                isPopup={true}
              />
            ) : palette === 'tool' ? (
              <ToolFinderPalette
                onClose={() => setPalette('web')} // Return to web search
                actions={actions}
                isPopup={true}
              />
            ) : (
              <WebSearchPalette
                onClose={() => setPalette('web')}
                defaultEngine={defaultEngine}
                isPopup={true}
              />
            )}
          </div>
          <div className="p-4 border-t text-xs text-gray-500" style={{ 
            borderColor: '#334155',
            backgroundColor: '#1e293b'
          }}>
            <div className="flex justify-between items-center">
              <span>Keyboard shortcuts:</span>
              <div className="space-x-2">
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Space</kbd>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+Space</kbd>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Popup; 