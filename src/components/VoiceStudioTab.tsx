import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Volume2, CheckCircle2 } from 'lucide-react';
import { Voices } from '../types';

interface VoiceStudioTabProps {
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
}

const Waveform = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-[2px] h-[18px] ml-2">
      {[0, 0.07, 0.14, 0.1, 0.03, 0.18].map((delay, i) => (
        <div key={i} className="w-[3px] bg-[#f5c400] rounded-[2px] animate-wave" style={{ animationDelay: `${delay}s` }} />
      ))}
    </div>
  );
};

export default function VoiceStudioTab({ selectedVoice, setSelectedVoice }: VoiceStudioTabProps) {
  const [voices, setVoices] = useState<Voices>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/voices')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch voices');
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid JSON response');
        }
      })
      .then(data => setVoices(data))
      .catch(err => console.error('Voices fetch error:', err));
  }, []);

  const handlePlay = async (e: React.MouseEvent, voiceName: string) => {
    e.stopPropagation();
    if (playing === voiceName && audio) {
      audio.pause();
      setPlaying(null);
      return;
    }

    if (audio) {
      audio.pause();
    }

    setPlaying(voiceName);
    
    try {
      const response = await fetch('/api/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName, text: 'မင်္ဂလာပါ၊ ဘလင့်အော်တိုမေးရှင်းမှ ကြိုဆိုပါတယ်။' })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      
      newAudio.onended = () => setPlaying(null);
      newAudio.play();
      setAudio(newAudio);
    } catch (err) {
      console.error(err);
      setPlaying(null);
    }
  };

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6">
      <style>{`
        @keyframes wave {
          0%,100% { height: 4px; opacity: 0.6 }
          50% { height: 18px; opacity: 1 }
        }
        .animate-wave { animation: wave 0.4s ease-in-out infinite; }
      `}</style>
      <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="mb-2">
        <h2 className="text-2xl font-bold text-[#ffffff] mb-1 drop-shadow-[0_1px_0_#000000]">Voice Studio</h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ffffff] font-bold">Preview and select your preferred voice.</p>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {(Object.entries(voices) as [string, {voice: string, pitch: string, rate: string, description?: string}][]).map(([name, config]) => {
          const isSelected = selectedVoice === name;
          return (
            <motion.div 
              whileHover={{ y: -3, boxShadow: "10px 10px 20px #000000, -10px -10px 20px #2c2c2c, inset 0 1px 0 rgba(255,255,255,0.07)" }}
              key={name} 
              onClick={() => setSelectedVoice(name)}
              className={`industrial-card cursor-pointer ${
                isSelected 
                  ? 'border-[1px] border-[rgba(245,196,0,0.4)] shadow-[0_0_20px_rgba(245,196,0,0.08)] bg-[#1a1a1a]' 
                  : 'border-[1px] border-[rgba(255,255,255,0.07)]'
              }`}
            >
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              {isSelected && (
                <div className="absolute top-6 right-6">
                  <div className="bg-[#f5c400] rounded-full p-1 text-[#1a1a1a] shadow-floating">
                    <CheckCircle2 size={16} className="animate-in zoom-in" />
                  </div>
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="pr-10">
                  <h3 className="text-base font-bold text-[#ffffff] drop-shadow-[0_1px_0_#000000] flex items-center gap-2">
                    <Volume2 size={16} className={isSelected ? 'text-[#f5c400]' : 'text-[#a0a0a0]'} />
                    {name}
                    {playing === name && <Waveform />}
                  </h3>
                  <p className="font-mono text-[11px] text-[#a0a0a0] uppercase tracking-[0.06em] mt-1 font-bold">{config.voice}</p>
                </div>
              </div>

              {config.description && (
                <p className="text-[13px] text-[#a0a0a0] font-medium italic mb-6 leading-relaxed">
                  {config.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2 text-xs">
                  <div className="bg-[#0f0f0f] shadow-recessed text-[#ffffff] font-mono text-[11px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                    <span className="font-bold opacity-60">P</span>
                    {config.pitch}
                  </div>
                  <div className="bg-[#0f0f0f] shadow-recessed text-[#ffffff] font-mono text-[11px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                    <span className="font-bold opacity-60">R</span>
                    {config.rate}
                  </div>
                </div>

                <motion.button 
                  whileTap={{ y: 2, boxShadow: "inset 4px 4px 10px #000000, inset -4px -4px 10px #282828" }}
                  onClick={(e) => handlePlay(e, name)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    playing === name 
                      ? 'bg-[#f5c400] text-[#1a1a1a] shadow-pressed' 
                      : 'bg-[#f5c400] text-[#1a1a1a] shadow-play hover:brightness-110'
                  }`}
                >
                  {playing === name ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
