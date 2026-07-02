/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Mic2, LayoutDashboard, ArrowLeft } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import VoiceStudioTab from './components/VoiceStudioTab';
import SettingsTab from './components/SettingsTab';
import LandingPage from './pages/LandingPage';
import { io, Socket } from 'socket.io-client';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Settings state
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('GROQ_API_KEY') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('SELECTED_VOICE') || 'Myint Myat');

  useEffect(() => {
    localStorage.setItem('GROQ_API_KEY', groqKey);
  }, [groqKey]);

  useEffect(() => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    localStorage.setItem('SELECTED_VOICE', selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('log', (msg: string) => {
      setLogs((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'DASH', icon: LayoutDashboard },
    { id: 'voice', label: 'VOICES', icon: Mic2 },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  if (showLanding) {
    return <LandingPage onGetAccess={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#ffffff] font-sans selection:bg-[#f5c400]/30 relative">
      <div className="absolute inset-0 bg-noise z-0"></div>

      {/* Toast Notification (if we had a global toast state, but we don't, we will pass a toast function to settings) */}

      <div className="max-w-[480px] mx-auto px-4 py-5 relative z-10 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLanding(true)}
              className="w-8 h-8 flex items-center justify-center bg-[#131313] border border-white/10 rounded-lg text-[#888] hover:text-white hover:border-[#f5c400]/50 transition-all shadow-card-lift"
              title="Back to Landing Page"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#ffffff] drop-shadow-[0_1px_0_#000000]">
                Blink Automation
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#a0a0a0] mt-1">Movie Recap Automation System</p>
            </div>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
            <span className="font-mono text-[10px] text-[#22c55e] tracking-[0.08em]">ONLINE</span>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex flex-row flex-nowrap gap-1 p-1.5 bg-[#111111] shadow-card-lift rounded-xl w-full border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-1 py-2 rounded-lg transition-all duration-200 relative flex-1 z-10 text-center whitespace-nowrap
                  ${isActive ? 'text-[#000000] shadow-tab-active bg-[#f5c400] font-[800]' : 'text-[#888888] hover:text-[#ffffff]'}`}
              >
                <Icon size={12} className="shrink-0" />
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  logs={logs} 
                  groqKey={groqKey} 
                  geminiKey={geminiKey} 
                  socket={socket}
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                />
              )}
              {activeTab === 'voice' && (
                <VoiceStudioTab 
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  groqKey={groqKey} 
                  setGroqKey={setGroqKey} 
                  geminiKey={geminiKey} 
                  setGeminiKey={setGeminiKey} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
