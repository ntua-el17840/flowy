import { useEffect, useState } from 'react';
import './styles.css';
import { WebSearchPalette } from "./components/WebSearchPalette";
import { ToolFinderPalette } from "./components/ToolFinderPalette";
import { ColorPicker } from "./components/ColorPicker";
import { Action } from "./types/action";
import { db } from "./lib/db";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'tools'>('search');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [defaultEngine, setDefaultEngine] = useState("google");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    // Listen for messages from background
    const handler = (msg: any) => {
      if (msg.type === 'OPEN_WEB_SEARCH') {
        setActiveTab('search');
      }
      if (msg.type === 'OPEN_TOOL_FINDER') {
        setActiveTab('tools');
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

  return (
    <div className="popup-container" style={{ 
      width: '400px', 
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Navigation */}
      <div className="border-b border-slate-700 bg-slate-900">
        <div className="flex">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'search' 
                ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'tools' 
                ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Tools
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {activeTab === 'search' && (
          <WebSearchPalette
            onClose={() => {}}
            defaultEngine={defaultEngine}
            isPopup={true}
          />
        )}
        
        {activeTab === 'tools' && !activeTool && (
          <ToolFinderPalette
            onClose={() => {}}
            actions={actions}
            isPopup={true}
            onToolSelect={(toolId) => {
              setActiveTool(toolId)
              setActiveTab('tools')
            }}
          />
        )}
        
        {activeTab === 'tools' && activeTool === 'color-picker' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Color Picker</h2>
              <button
                onClick={() => setActiveTool(null)}
                className="text-slate-400 hover:text-slate-200 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
              >
                ← Back
              </button>
            </div>
            <ColorPicker
              onColorSelect={(color) => {
                navigator.clipboard.writeText(color)
                setCopiedColor(color)
                setTimeout(() => setCopiedColor(null), 2000)
                console.log('Color copied to clipboard:', color)
              }}
              onClose={() => setActiveTool(null)}
            />
            
            {copiedColor && (
              <div className="mt-3 p-2 bg-green-900/50 border border-green-600/50 rounded-lg flex items-center space-x-2">
                <span className="text-green-200 text-sm">✓ Copied to clipboard:</span>
                <code className="bg-slate-800 px-2 py-1 rounded text-green-300 font-mono text-sm">
                  {copiedColor}
                </code>
              </div>
                         )}
            </div>
          )}
          
          {activeTab === 'tools' && activeTool && activeTool !== 'color-picker' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Tool Coming Soon</h2>
                <button
                  onClick={() => setActiveTool(null)}
                  className="text-slate-400 hover:text-slate-200 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                >
                  ← Back
                </button>
              </div>
              <div className="text-center py-8 space-y-4">
                <div className="text-6xl">🚧</div>
                <h3 className="text-lg font-medium text-slate-200">Tool Under Development</h3>
                <p className="text-slate-400 text-sm">
                  This tool is currently being developed and will be available in a future update.
                </p>
                <div className="text-xs text-slate-500">
                  Tool ID: <code className="bg-slate-800 px-2 py-1 rounded">{activeTool}</code>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Footer with shortcut info */}
      <div className="p-3 border-t border-slate-700 bg-slate-900">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-2">Keyboard Shortcuts:</p>
          <div className="flex justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <code className="bg-slate-700 px-2 py-1 rounded">Ctrl+Space</code>
              <span className="text-slate-500">Web Search</span>
            </div>
            <div className="flex items-center space-x-1">
              <code className="bg-slate-700 px-2 py-1 rounded">Ctrl+Shift+Space</code>
              <span className="text-slate-500">Tools</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            ✨ Shortcuts work automatically on any webpage
          </p>
        </div>
      </div>
    </div>
  );
};

export default Popup; 