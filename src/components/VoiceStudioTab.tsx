import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { Voices } from '../types';

export default function VoiceStudioTab() {
  const [voices, setVoices] = useState<Voices>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/voices')
      .then(res => res.json())
      .then(data => setVoices(data))
      .catch(err => console.error(err));
  }, []);

  const handlePlay = async (voiceName: string) => {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Voice Studio</h2>
        <p className="text-gray-400 text-sm">Preview tuned Myanmar voices via edge-tts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {(Object.entries(voices) as [string, {voice: string, pitch: string, rate: string}][]).map(([name, config]) => (
          <div key={name} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Volume2 size={18} className="text-purple-400" />
                  {name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{config.voice}</p>
              </div>
              <button 
                onClick={() => handlePlay(name)}
                className={`p-3 rounded-full flex items-center justify-center transition-all ${
                  playing === name 
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {playing === name ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div className="bg-black/40 rounded-lg p-2 text-center border border-white/5">
                <span className="block text-xs text-gray-500 mb-1">Pitch</span>
                <span className="font-mono text-purple-300">{config.pitch}</span>
              </div>
              <div className="bg-black/40 rounded-lg p-2 text-center border border-white/5">
                <span className="block text-xs text-gray-500 mb-1">Rate</span>
                <span className="font-mono text-blue-300">{config.rate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
