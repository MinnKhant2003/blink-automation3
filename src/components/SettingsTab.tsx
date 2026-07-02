import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsTabProps {
  groqKey: string;
  setGroqKey: (key: string) => void;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

export default function SettingsTab({ groqKey, setGroqKey, geminiKey, setGeminiKey }: SettingsTabProps) {
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="relative">
      <motion.div 
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} 
        initial="hidden" 
        animate="show" 
        className="space-y-6 max-w-2xl"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="mb-2">
          <h2 className="text-2xl font-bold text-[#ffffff] mb-1 drop-shadow-[0_1px_0_#000000]">Project Settings</h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#a0a0a0] font-bold">Configure your API keys for script generation and vision analysis.</p>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="space-y-6 mt-6">
          <div className="industrial-card">
            <div className="screw screw-tl"></div>
            <div className="screw screw-tr"></div>
            <div className="screw screw-bl"></div>
            <div className="screw screw-br"></div>
            
            <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ffffff] font-bold mb-3 flex items-center gap-2 drop-shadow-[0_1px_0_#000000]">
              <Key size={16} className="text-[#f5c400]" />
              GROQ_API_KEY
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-[#0f0f0f] border-none shadow-recessed rounded-lg px-4 py-3 text-[#ffffff] placeholder-[#a0a0a0]/50 focus:outline-none focus:shadow-[inset_3px_3px_8px_#000000,inset_-3px_-3px_8px_#252525,0_0_0_2px_#f5c400] transition-all duration-200 font-mono text-[13px]"
            />
            <p className="font-mono text-[10px] text-[#a0a0a0] font-bold mt-2">Required for Llama 3 70B script generation.</p>
          </div>

          <div className="industrial-card">
            <div className="screw screw-tl"></div>
            <div className="screw screw-tr"></div>
            <div className="screw screw-bl"></div>
            <div className="screw screw-br"></div>

            <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ffffff] font-bold mb-3 flex items-center gap-2 drop-shadow-[0_1px_0_#000000]">
              <Key size={16} className="text-[#f5c400]" />
              GEMINI_API_KEY
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-[#0f0f0f] border-none shadow-recessed rounded-lg px-4 py-3 text-[#ffffff] placeholder-[#a0a0a0]/50 focus:outline-none focus:shadow-[inset_3px_3px_8px_#000000,inset_-3px_-3px_8px_#252525,0_0_0_2px_#f5c400] transition-all duration-200 font-mono text-[13px]"
            />
            <p className="font-mono text-[10px] text-[#a0a0a0] font-bold mt-2">Required for Gemini Vision context analysis.</p>
          </div>

          <motion.button
            whileTap={{ y: 2, boxShadow: "inset 4px 4px 10px #000000, inset -4px -4px 10px #282828" }}
            onClick={handleSave}
            className="w-full bg-[#f5c400] text-[#1a1a1a] font-bold py-4 px-6 rounded-[12px] flex items-center justify-center space-x-2 transition-all shadow-play mt-6"
          >
            <span>Save Configuration</span>
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#131313] border-[1.5px] border-[#f5c400] rounded-[10px] px-6 py-3 text-[#ffffff] font-sans font-semibold text-[13px] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(245,196,0,0.1)] flex items-center gap-2"
          >
            <span className="text-[#f5c400]">✓</span> Saved successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
