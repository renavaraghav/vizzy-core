'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (val: boolean) => void;
  onResetProject?: () => void;
  theme?: 'dark' | 'light' | 'system';
  onThemeChange?: (theme: 'dark' | 'light' | 'system') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDemoMode: externalDemoMode,
  onToggleDemoMode,
  onResetProject,
  theme: externalTheme,
  onThemeChange
}) => {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vizzy_custom_api_key') || '';
    }
    return '';
  });
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [localDemoMode, setLocalDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vizzy_demo_mode') === 'true';
    }
    return false;
  });
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vizzy_theme') as 'dark' | 'light' | 'system') || 'dark';
    }
    return 'dark';
  });
  const [defaultPacing, setDefaultPacing] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPacing = localStorage.getItem('vizzy:default-pacing');
      if (savedPacing) return parseInt(savedPacing, 10);
    }
    return 4;
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDemoMode = externalDemoMode !== undefined ? externalDemoMode : localDemoMode;
  const activeTheme = externalTheme || currentTheme;

  const handleToggleDemo = (checked: boolean) => {
    setLocalDemoMode(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vizzy_demo_mode', String(checked));
    }
    onToggleDemoMode?.(checked);
  };

  const handleSelectTheme = (newTheme: 'dark' | 'light' | 'system') => {
    setCurrentTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vizzy_theme', newTheme);
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    }
    onThemeChange?.(newTheme);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('vizzy_custom_api_key', apiKey.trim());
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset this project and start a new story?')) {
      if (onResetProject) {
        onResetProject();
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('vizzy:studio-state');
        localStorage.removeItem('vizzy_demo_mode');
        window.location.reload();
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0f0f11]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="bg-white rounded-3xl max-w-lg w-full border border-[#ebe8e1] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#18181b]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#ebe8e1] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18181b] text-white flex items-center justify-center">
              <Icon name="settings" size={16} className="text-indigo-300" />
            </div>
            <div>
              <h3 id="settings-dialog-title" className="text-sm font-bold text-[#18181b]">Project &amp; AI Settings</h3>
              <p className="text-[11px] text-[#6d6d7a]">Configure appearance, visual generation, and storage</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-[#888894] hover:text-[#44444d] hover:bg-[#ebe8e1] transition-colors"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="studio-scrollbar max-h-[72vh] overflow-y-auto p-6 space-y-5 text-xs text-[#44444d]">
          {/* Theme Changing Option (Dark Mode / Light Mode / System) */}
          <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe8e1] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#18181b] block">Studio Theme &amp; Appearance</span>
              <span className="text-[11px] text-[#888894] capitalize">{activeTheme} mode</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTheme === 'dark'
                    ? 'border-[#18181b] bg-[#18181b] text-white shadow-sm'
                    : 'border-[#ebe8e1] bg-white text-[#44444d] hover:bg-[#ebe8e1]/60'
                }`}
              >
                <Icon name="moon" size={14} />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTheme === 'light'
                    ? 'border-[#777fd7] bg-[#777fd7] text-white shadow-sm'
                    : 'border-[#ebe8e1] bg-white text-[#44444d] hover:bg-[#ebe8e1]/60'
                }`}
              >
                <Icon name="sun" size={14} />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('system')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTheme === 'system'
                    ? 'border-[#777fd7] bg-[#777fd7] text-white shadow-sm'
                    : 'border-[#ebe8e1] bg-white text-[#44444d] hover:bg-[#ebe8e1]/60'
                }`}
              >
                <Icon name="sparkles" size={14} />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe8e1] flex items-center justify-between">
            <div className="space-y-0.5 pr-3">
              <span className="font-bold text-[#18181b] block">High-Fidelity Demo Mode</span>
              <p className="text-[#6d6d7a] text-[11px] leading-relaxed">
                Uses pre-rendered cinematic WWII assets and instant offline visual generation without API rate limits.
              </p>
            </div>
            <input
              type="checkbox"
              checked={currentDemoMode}
              onChange={(e) => handleToggleDemo(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Optional Custom API Key */}
          <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe8e1] space-y-3">
            <div className="flex items-center space-x-2">
              <Icon name="key" size={16} className="text-indigo-600" />
              <span className="font-bold text-[#18181b]">Custom Image API Key (Optional)</span>
            </div>
            <p className="text-[#6d6d7a] text-[11px] leading-relaxed">
              You can also specify <code className="bg-[#ebe8e1] px-1 py-0.5 rounded text-[#18181b]">CLOUDFLARE_API_TOKEN</code>, <code className="bg-[#ebe8e1] px-1 py-0.5 rounded text-[#18181b]">IMAGE_API_KEY</code>, or <code className="bg-[#ebe8e1] px-1 py-0.5 rounded text-[#18181b]">OPENAI_API_KEY</code> in <code className="bg-[#ebe8e1] px-1 py-0.5 rounded text-[#18181b]">.env.local</code>. Alternatively paste a key below.
            </p>
            <form onSubmit={handleSaveKey} className="flex items-center space-x-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... or cfut_..."
                className="flex-1 bg-white border border-[#ded9ce] rounded-xl px-3 py-2 text-xs text-[#18181b] outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272c] text-white font-semibold text-xs flex items-center space-x-1 transition-colors"
              >
                {savedKeySuccess ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Icon name="check" size={14} /> Saved
                  </span>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </form>
          </div>

          {/* Slideshow Presentation Settings */}
          <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe8e1] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#18181b] block">Slideshow Beat Pacing</span>
              <span className="text-[11px] text-[#888894]">{defaultPacing} seconds / beat</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setDefaultPacing(sec);
                    try {
                      localStorage.setItem('vizzy:default-pacing', String(sec));
                    } catch {
                      // ignore
                    }
                  }}
                  className={`py-1.5 px-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                    defaultPacing === sec
                      ? 'border-[#18181b] bg-[#18181b] text-white'
                      : 'border-[#ebe8e1] bg-white text-[#44444d] hover:bg-[#ebe8e1]/60'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone: Reset Local Data */}
          <div className="pt-2 border-t border-[#ebe8e1] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#18181b] block">Reset Story &amp; Memory</span>
              <span className="text-[11px] text-[#888894]">Clear localStorage and start fresh</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Icon name="trash" size={14} />
              <span>Reset Project</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#faf9f6] border-t border-[#ebe8e1] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272c] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
