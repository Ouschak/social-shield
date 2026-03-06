import { useState, useEffect } from 'react';
import '@/styles/index.css';
import 'remixicon/fonts/remixicon.css';
import { useDetectionStore } from '@/shared/store/detectionStore';
import { BlocklistScreen } from './components/BlocklistScreen';

type Screen = 'home' | 'blocklist';

function App() {
  const { enabled, toggleEnabled, softHarassmentEnabled, toggleSoftHarassment } = useDetectionStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [localEnabled, setLocalEnabled] = useState(enabled);

  useEffect(() => {
    setLocalEnabled(enabled);
  }, [enabled]);

  const handleToggle = () => {
    setLocalEnabled(prev => !prev);
    toggleEnabled();
  };

  if (currentScreen === 'blocklist') {
    return <BlocklistScreen onBack={() => setCurrentScreen('home')} />;
  }

  return (
    <div className="w-80 bg-white font-sans text-slate-900 min-h-[400px] flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <i className="ri-shield-flash-fill text-indigo-600 text-xl"></i>
          <h1 className="font-bold text-slate-800">Social Shield</h1>
        </div>
      </header>

      <div className="p-6 flex-1 flex flex-col">
        <div
          className={`border rounded-xl p-5 mb-6 text-center transition-all ${localEnabled
            ? 'bg-indigo-50 border-indigo-100'
            : 'bg-slate-50 border-slate-100'
            }`}
        >
          <div className="text-sm font-medium mb-2 text-slate-500 uppercase tracking-wide">
            Protection Status
          </div>

          <div
            className={`text-2xl font-bold flex items-center justify-center gap-2 ${localEnabled ? 'text-indigo-700' : 'text-slate-400'
              }`}
          >
            {localEnabled ? (
              <>
                <i className="ri-instagram-fill" />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <i className="ri-shield-line" />
                <span>Disabled</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="space-y-3">
          {/* Hidden Words Button */}
          <button
            onClick={() => setCurrentScreen('blocklist')}
            className="w-full flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <i className="ri-eye-off-line"></i>
              </div>
              <span className="font-medium text-slate-700">Hidden Words</span>
            </div>
            <i className="ri-arrow-right-s-line text-slate-400"></i>
          </button>

          {/* Toggle Button */}
          <div
            onClick={handleToggle}
            className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer select-none"
          >
            <span className="font-medium text-slate-700">
              Enable Detection
            </span>

            <div
              role="switch"
              aria-checked={localEnabled}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${localEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${localEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </div>
          </div>

          {/* Soft Harassment Toggle - Secondary */}
          {localEnabled && (
            <div
              onClick={toggleSoftHarassment}
              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer select-none ml-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-600">
                  Hide discouraging comments
                </span>
                <span className="text-[10px] text-slate-400">
                  Filters "boring", "do better", etc.
                </span>
              </div>

              <div
                role="switch"
                aria-checked={softHarassmentEnabled}
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${softHarassmentEnabled ? 'bg-indigo-500' : 'bg-slate-300'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${softHarassmentEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="p-3 text-center text-[10px] text-slate-400 border-t border-slate-50 mt-auto">
        Powered by THE TEAM
      </footer>
    </div>
  );
}

export default App;
