/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Mic2, LayoutDashboard } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import VoiceStudioTab from './components/VoiceStudioTab';
import SettingsTab from './components/SettingsTab';
import { io, Socket } from 'socket.io-client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Settings state
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('GROQ_API_KEY') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');

  useEffect(() => {
    localStorage.setItem('GROQ_API_KEY', groqKey);
  }, [groqKey]);

  useEffect(() => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
  }, [geminiKey]);

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'voice', label: 'Voice Studio', icon: Mic2 },
    { id: 'settings', label: 'Project Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-purple-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Blink Automation
            </h1>
            <p className="text-gray-400 mt-2">Movie Recap Automation System</p>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex space-x-2 mb-8 bg-white/5 p-2 rounded-2xl backdrop-blur-xl border border-white/10 w-full overflow-x-auto max-w-full md:w-fit whitespace-nowrap scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/20"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-black/50 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  logs={logs} 
                  groqKey={groqKey} 
                  geminiKey={geminiKey} 
                  socket={socket}
                />
              )}
              {activeTab === 'voice' && <VoiceStudioTab />}
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
