import { useEffect, useState } from 'react';
import './styles.css';
import { WebSearchPalette } from "./components/WebSearchPalette";
import { ToolFinderPalette } from "./components/ToolFinderPalette";
import { Action } from "./types/action";
import { db } from "./lib/db";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'tools'>('search');
  const [actions, setActions] = useState<Action[]>([]);
  const [defaultEngine, setDefaultEngine] = useState("google");

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
        
        {activeTab === 'tools' && (
          <ToolFinderPalette
            onClose={() => {}}
            actions={actions}
            isPopup={true}
          />
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