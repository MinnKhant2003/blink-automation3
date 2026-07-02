import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Play, Terminal, Loader2, CheckCircle2, Download, Settings2, Mic2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Voices } from '../types';

import { Socket } from 'socket.io-client';

interface DashboardTabProps {
  logs: string[];
  groqKey: string;
  geminiKey: string;
  socket: Socket | null;
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
}

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB

const ProgressSteps = ({ stage }: { stage: number }) => {
  const steps = ["UPLOAD", "ANALYZE", "GENERATE", "VOICE", "DONE"];
  
  return (
    <div className="flex items-center justify-between mb-6 relative px-2">
      <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#1a1a1a] -z-10 -translate-y-1/2"></div>
      
      {steps.map((label, idx) => {
        const isDone = stage > idx;
        const isActive = stage === idx;
        const isPending = stage < idx;
        
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative z-10 w-[28px]">
              <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all duration-300
                ${isDone ? 'bg-[#f5c400] text-[#000] shadow-[0_0_10px_rgba(245,196,0,0.5)]' : ''}
                ${isActive ? 'bg-[#131313] border-[2px] border-[#f5c400] shadow-[0_0_14px_rgba(245,196,0,0.4)]' : ''}
                ${isPending ? 'bg-[#0f0f0f] border border-[#2a2a2a]' : ''}
              `}>
                {isDone && <span className="text-sm font-bold">✓</span>}
                {isActive && <div className="w-[8px] h-[8px] bg-[#f5c400] rounded-full animate-pulse"></div>}
              </div>
              <span className={`absolute top-[34px] font-mono text-[7px] uppercase whitespace-nowrap text-center w-[50px] left-1/2 -translate-x-1/2
                ${isDone || isActive ? 'text-[#f5c400]' : 'text-[#444]'}
              `}>{label}</span>
            </div>
            
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 transition-all duration-500
                ${stage > idx ? 'bg-[#f5c400] shadow-[0_0_6px_rgba(245,196,0,0.4)]' : 'bg-transparent'}
              `}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const TypewriterLog = ({ logs }: { logs: string[] }) => {
  const [displayLogs, setDisplayLogs] = useState<{text: string, time: string, isTyping: boolean, currentText?: string}[]>([]);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logs.length > 0) return;
    const seq = [
      "> Initializing Blink Automation v2.0...",
      "> Google Cloud TTS (my-MM): Loaded ✓",
      "> Groq — Llama 3 70B: Connected ✓",
      "> Gemini Vision: Ready ✓",
      "> FFmpeg: Available ✓",
      "> Awaiting input..."
    ];
    let step = 0;
    const interval = setInterval(() => {
      setBootSequence(prev => [...prev, seq[step]]);
      step++;
      if (step >= seq.length) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [logs.length]);

  useEffect(() => {
    if (logs.length === 0) return;
    const latestLog = logs[logs.length - 1];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    setDisplayLogs(prev => {
      const updated = prev.map(l => ({ ...l, isTyping: false, currentText: l.text }));
      return [...updated, { text: latestLog, time: timeStr, isTyping: true, currentText: '' }];
    });
  }, [logs]);

  useEffect(() => {
    const activeLogIndex = displayLogs.findIndex(l => l.isTyping);
    if (activeLogIndex === -1) return;

    const activeLog = displayLogs[activeLogIndex];
    if (activeLog.currentText === undefined) activeLog.currentText = '';

    if (activeLog.currentText.length < activeLog.text.length) {
      const timeout = setTimeout(() => {
        setDisplayLogs(prev => {
          const next = [...prev];
          next[activeLogIndex] = { 
            ...next[activeLogIndex], 
            currentText: activeLog.text.slice(0, activeLog.currentText!.length + 1)
          };
          return next;
        });
      }, 20);
      return () => clearTimeout(timeout);
    } else {
      setDisplayLogs(prev => {
        const next = [...prev];
        next[activeLogIndex] = { ...next[activeLogIndex], isTyping: false };
        return next;
      });
    }
  }, [displayLogs]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayLogs, bootSequence]);

  return (
    <div 
      ref={terminalRef}
      className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide text-[12px] font-mono pb-4"
    >
      {logs.length === 0 ? (
        <>
          {bootSequence.map((log, i) => (
            <div key={i} className="flex space-x-3 text-[#4ade80]">
              <span className="text-[#444] whitespace-nowrap shrink-0">
                [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
              </span>
              <span className="break-words">{log}</span>
            </div>
          ))}
          <div className="text-[#4ade80] mt-1"><span className="animate-blink">█</span></div>
        </>
      ) : (
        <>
          {displayLogs.map((log, i) => {
            const isError = log.text.includes('Error');
            const color = isError ? 'text-[#f5c400]' : 'text-[#4ade80]';
            const textToShow = log.isTyping ? log.currentText : log.text;
            return (
              <div key={i} className={`flex space-x-3 ${color}`}>
                <span className="text-[#444] whitespace-nowrap shrink-0">
                  [{log.time}]
                </span>
                <span className="break-words">
                  {textToShow}
                  {log.isTyping && <span className="animate-blink">█</span>}
                </span>
              </div>
            );
          })}
          {displayLogs.length > 0 && !displayLogs[displayLogs.length - 1]?.isTyping && (
             <div className="text-[#4ade80] mt-1"><span className="animate-blink">█</span></div>
          )}
        </>
      )}
    </div>
  );
};

export default function DashboardTab({ logs, groqKey, geminiKey, socket, selectedVoice, setSelectedVoice }: DashboardTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState(0);
  const [voices, setVoices] = useState<Voices>({});
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  
  // Live Sync Editor States
  const [syncState, setSyncState] = useState<'idle' | 'ready' | 'rendering'>('idle');
  const [syncData, setSyncData] = useState<{ videoFilename: string, scenes?: any[], fullScript?: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleRenderFinal = async () => {
    if (!syncData) return;
    setSyncState('rendering');
    try {
      const res = await fetch('/api/render-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoFilename: syncData.videoFilename,
          scenes: syncData.scenes
        })
      });
      if (!res.ok) throw new Error('Render failed');
    } catch (err: any) {
      alert(`Render failed: ${err.message}`);
      setSyncState('ready');
    }
  };

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
      .then(data => {
        setVoices(data);
        if (Object.keys(data).length > 0 && !data[selectedVoice]) {
          setSelectedVoice(Object.keys(data)[0]);
        }
      })
      .catch(err => console.error('Voices fetch error:', err));
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    
    // Simple logic to advance progress bar based on logs
    const latestLog = logs[logs.length - 1] || '';
    if (latestLog.includes('[1/4]')) setProcessStage(1);
    else if (latestLog.includes('[2/4]')) setProcessStage(2);
    else if (latestLog.includes('[3/4]')) setProcessStage(3);
    else if (latestLog.includes('[4/4]')) setProcessStage(4);
    else if (latestLog.includes('Process Complete')) {
      setProcessStage(5);
      setIsProcessing(false);
    }
  }, [logs]);

  useEffect(() => {
    if (!socket) return;
    const handleSyncReady = (data: { videoFilename: string, scenes?: any[], fullScript?: string }) => {
      setSyncData(data);
      setSyncState('ready');
      setIsProcessing(false);
      setProcessStage(4);
    };
    const handleProcessComplete = (data: { status: string, outputUrl?: string }) => {
      if (data.status === 'success' && data.outputUrl) {
        setFinalVideoUrl(data.outputUrl);
        setIsProcessing(false);
        setSyncState('idle');
        setProcessStage(5);
      }
    };
    const handleProcessError = (data: { error: string }) => {
      setIsProcessing(false);
      setSyncState('idle');
    };
    socket.on('sync-ready', handleSyncReady);
    socket.on('process-complete', handleProcessComplete);
    socket.on('process-error', handleProcessError);
    return () => {
      socket.off('sync-ready', handleSyncReady);
      socket.off('process-complete', handleProcessComplete);
      socket.off('process-error', handleProcessError);
    };
  }, [socket]);

  const onDrop = useCallback((acceptedFiles: any[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadProgress(0);
      setFinalVideoUrl(null);
      setProcessStage(0);
      setIsProcessing(false);
      setSyncState('idle');
      setSyncData(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1
  } as any);

  const uploadFile = async () => {
    if (!file) return;
    
    if (!groqKey || !geminiKey) {
      alert('Please set your API keys in Project Settings first.');
      return;
    }

    setIsUploading(true);
    const uploadId = uuidv4();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const res = await fetch(`/api/upload-chunk?uploadId=${uploadId}&chunkIndex=${i}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: chunk,
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Chunk ${i} failed: ${res.status} ${res.statusText} - ${errText}`);
        }

        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          originalName: file.name,
          totalChunks
        }),
      });
      
      if (!completeRes.ok) {
        const errText = await completeRes.text();
        throw new Error(`Upload complete failed: ${completeRes.status} ${completeRes.statusText} - ${errText}`);
      }
      
      const { filename } = await completeRes.json();
      setIsUploading(false);
      
      // Start processing
      setIsProcessing(true);
      setProcessStage(0);
      setFinalVideoUrl(null);
      
      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          groqKey,
          geminiKey,
          voiceName: selectedVoice
        })
      });
      
      if (!processRes.ok) {
        const errText = await processRes.text();
        throw new Error(`Process start failed: ${processRes.status} ${processRes.statusText} - ${errText}`);
      }

    } catch (err: any) {
      console.error('Upload failed', err);
      setIsUploading(false);
      setIsProcessing(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  const stages = [
    'AI Transcription',
    'Script Gen',
    'Smart Trim',
    'Voice Sync'
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
      }}
      initial="hidden"
      animate="show"
    >
      {/* Left Column: Upload & Controls */}
      <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="space-y-6">
        <div className="industrial-card">
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>
          <div className="vent-container">
            <div className="vent-slot"></div>
            <div className="vent-slot"></div>
            <div className="vent-slot"></div>
          </div>

          <div className="mb-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ffffff] font-bold drop-shadow-[0_1px_0_#000000]">UPLOAD VIDEO</h2>
          </div>

          {syncState === 'idle' && !finalVideoUrl && (
            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-[12px] p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 shadow-recessed
                  ${isDragActive ? 'border-[rgba(245,196,0,0.6)] bg-[rgba(245,196,0,0.03)]' : 'border-[rgba(255,255,255,0.15)] bg-[#111111] hover:border-[rgba(245,196,0,0.6)] hover:bg-[rgba(245,196,0,0.03)]'}
                  ${isUploading || isProcessing ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto mb-4 w-12 h-12 text-[#f5c400]" />
                {file ? (
                  <div>
                    <p className="font-semibold text-lg text-[#ffffff] truncate drop-shadow-[0_1px_0_#000000]">{file.name}</p>
                    <p className="font-mono text-[11px] text-[#a0a0a0] mt-1 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-base text-[#ffffff] drop-shadow-[0_1px_0_#000000]">Drag & drop your video</p>
                    <p className="font-mono text-[11px] text-[#a0a0a0] mt-1 font-bold">(MP4, MOV)</p>
                  </div>
                )}
              </div>

              {/* STATS STRIP */}
              <div className="flex gap-2 mt-4 mb-6">
                <div className="flex-1 bg-[#131313] border border-white/5 shadow-[4px_4px_10px_#000,-4px_-4px_10px_#2a2a2a] rounded-[10px] p-3 text-center">
                  <div className="font-mono font-[700] text-[15px] text-[#f5c400]">--:--</div>
                  <div className="font-mono text-[8px] text-[#555] uppercase mt-[3px]">DURATION</div>
                </div>
                <div className="flex-1 bg-[#131313] border border-white/5 shadow-[4px_4px_10px_#000,-4px_-4px_10px_#2a2a2a] rounded-[10px] p-3 text-center">
                  <div className="font-mono font-[700] text-[15px] text-[#f5c400]">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '-- MB'}
                  </div>
                  <div className="font-mono text-[8px] text-[#555] uppercase mt-[3px]">SIZE</div>
                </div>
                <div className="flex-1 bg-[#131313] border border-white/5 shadow-[4px_4px_10px_#000,-4px_-4px_10px_#2a2a2a] rounded-[10px] p-3 text-center flex flex-col items-center justify-center">
                  <div className="font-mono font-[700] text-[15px] text-[#f5c400] flex items-center gap-1.5 justify-center">
                    {(syncState === 'ready' || (syncState === 'idle' && file)) ? (
                      <><div className="w-[5px] h-[5px] bg-[#22c55e] rounded-full animate-pulse"></div>READY</>
                    ) : syncState === 'rendering' ? 'BUSY' : '--'}
                  </div>
                  <div className="font-mono text-[8px] text-[#555] uppercase mt-[3px]">STATUS</div>
                </div>
              </div>

              {selectedVoice && voices[selectedVoice] ? (
                <>
                  <div className="h-[1px] bg-white/5 my-4" />
                  <div className="flex justify-between items-center bg-[#131313] p-4 rounded-[12px] border border-white/5 shadow-recessed">
                    <span className="font-mono text-[10px] text-[#888] tracking-widest uppercase flex items-center gap-2">
                      <Mic2 size={14} className="text-[#f5c400]" />
                      TARGET VOICE
                    </span>
                    <div className="text-right flex flex-col justify-center">
                      <div className="font-sans text-[15px] font-bold text-[#f5c400] drop-shadow-[0_1px_0_#000]">
                        {selectedVoice}
                      </div>
                      <div className="font-mono text-[11px] text-[#a0a0a0] italic mt-0.5 max-w-[200px] truncate">
                        {voices[selectedVoice].description}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-[1px] bg-white/5 my-4" />
                  <div className="flex justify-between items-center bg-[#131313] p-4 rounded-[12px] border border-white/5 shadow-recessed">
                    <span className="font-mono text-[10px] text-[#888] tracking-widest uppercase flex items-center gap-2">
                      <Mic2 size={14} className="text-[#f5c400]" />
                      TARGET VOICE
                    </span>
                    <span className="font-mono text-[11px] text-[#666]">
                      — Select in VOICES tab —
                    </span>
                  </div>
                </>
              )}

              {file && (
                <div className="space-y-6 mt-6">
                  <motion.button
                    whileTap={{ y: 2, boxShadow: "inset 4px 4px 10px #000000, inset -4px -4px 10px #282828" }}
                    onClick={uploadFile}
                    disabled={isUploading || isProcessing}
                    className="w-full bg-[#f5c400] text-[#1a1a1a] font-bold py-4 px-6 rounded-[12px] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-play"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span className="font-mono text-[11px] uppercase tracking-wider">Uploading... {uploadProgress}%</span>
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span className="font-mono text-[11px] uppercase tracking-wider">Processing Video...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        <span className="font-mono text-[11px] uppercase tracking-wider">Start Automation</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>

        {syncState === 'ready' && syncData && (
          <div className="industrial-card mt-8">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ffffff] font-bold mb-4 flex items-center gap-2 drop-shadow-[0_1px_0_#000000]">
              <Settings2 size={16} className="text-[#f5c400]" /> LIVE SYNC EDITOR
            </h3>
            
            <div className="relative rounded-xl overflow-hidden mb-6 aspect-video bg-[#0a0a0a] flex items-center justify-center shadow-recessed border border-white/5">
              <video 
                ref={videoRef}
                src={`/uploads/${syncData.videoFilename}`} 
                className="w-full h-full object-contain"
                controls
              />
            </div>

            <div className="space-y-6">
              {/* Scenes List */}
              <div className="bg-[#0f0f0f] p-4 rounded-xl shadow-recessed border border-[rgba(255,255,255,0.07)]">
                <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase">
                  <span className="font-bold text-[#ffffff] drop-shadow-[0_1px_0_#000000]">Detected Scenes ({syncData.scenes?.length || 0})</span>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {syncData.scenes?.map((scene: any, idx: number) => (
                    <div key={idx} className="bg-[#131313] p-4 rounded-lg border border-[rgba(255,255,255,0.05)] relative flex flex-col gap-3 shadow-card-lift transition-all hover:border-[rgba(255,255,255,0.1)]">
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                         <span className="font-mono text-[11px] tracking-widest text-[#f5c400] font-bold drop-shadow-[0_1px_0_#000]">SCENE {scene.scene}</span>
                         <div className="flex gap-4 font-mono text-[10px] uppercase text-[#a0a0a0] font-bold">
                           <span className="flex gap-1 items-center bg-[#0a0a0a] px-2 py-1 rounded">VID <span className="text-white">{scene.duration.toFixed(1)}s</span></span>
                           <span className={`flex gap-1 items-center bg-[#0a0a0a] px-2 py-1 rounded ${scene.actualAudioDuration > scene.duration ? 'text-[#f5c400]' : ''}`}>AUD <span className="text-white">{scene.actualAudioDuration?.toFixed(1) || '--'}s</span></span>
                         </div>
                       </div>
                       <p className="font-sans text-[14px] text-[#e0e0e0] leading-relaxed">
                         {scene.narration_text}
                       </p>
                       <audio src={`/tmp/${scene.audioFilename}`} controls className="h-8 w-full opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>

              {syncData.fullScript && (
                <div className="bg-[#0f0f0f] p-4 rounded-xl shadow-recessed border border-[rgba(255,255,255,0.07)]">
                  <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase">
                    <span className="font-bold text-[#ffffff] drop-shadow-[0_1px_0_#000000]">Generated Movie Recap Script</span>
                  </div>
                  <textarea 
                    readOnly 
                    value={syncData.fullScript} 
                    className="w-full h-[150px] bg-[#0a0a0a] rounded-lg p-3 text-[#e0e0e0] font-sans text-sm resize-none outline-none custom-scrollbar border border-[rgba(255,255,255,0.05)]" 
                  />
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <motion.button
                  whileTap={{ y: 2, boxShadow: "inset 4px 4px 10px #000000, inset -4px -4px 10px #282828" }}
                  onClick={handleRenderFinal}
                  className="w-full bg-[#f5c400] text-[#1a1a1a] font-bold py-4 px-6 rounded-[12px] flex items-center justify-center space-x-2 transition-all shadow-play"
                >
                  <CheckCircle2 size={18} />
                  <span className="font-mono text-[11px] uppercase tracking-wider">Start Final Render</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Final Video Result */}
        {finalVideoUrl && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#131313] border border-white/5 p-6 rounded-[16px] shadow-card-lift">
            <h3 className="text-xl font-bold text-[#f5c400] flex items-center gap-2 drop-shadow-[0_1px_0_#000000]">
              <CheckCircle2 size={24} className="text-[#f5c400]" /> Processing Complete!
            </h3>
            
            <button 
              onClick={() => window.open(finalVideoUrl, '_blank')}
              className="w-full bg-[#f5c400] hover:brightness-110 text-[#1a1a1a] font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-play"
            >
              <Download size={18} />
              <span>Download Final Video</span>
            </button>

            {syncData?.fullScript && (
              <div className="mt-6 bg-[#0a0a0a] p-4 rounded-xl border border-white/5 shadow-recessed">
                <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#a0a0a0] mb-3 font-bold">Movie Recap Script</h4>
                <textarea 
                  readOnly 
                  value={syncData.fullScript} 
                  className="w-full h-[300px] bg-transparent text-[#e0e0e0] font-sans text-sm resize-none outline-none custom-scrollbar" 
                />
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Right Column: Terminal */}
      <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } } }} className="flex flex-col h-full min-h-[300px] sm:min-h-[400px]">
        <ProgressSteps stage={file ? (processStage === 0 ? 0 : processStage) : -1} />
        
        <div className="flex flex-col flex-1 bg-[#0a0a0a] rounded-xl overflow-hidden font-mono text-sm p-4 shadow-pressed border-[2px] border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#a0a0a0] font-bold mb-3 flex items-center gap-2 border-b border-white/5 pb-2 shrink-0">
            <span className="text-[#f5c400]">›_</span> SYSTEM LOGS
          </div>
          <TypewriterLog logs={logs} />
        </div>
      </motion.div>
    </motion.div>
  );
}
