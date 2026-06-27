import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Play, Terminal, Loader2, CheckCircle2, Download, Settings2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Voices } from '../types';

import { Socket } from 'socket.io-client';

interface DashboardTabProps {
  logs: string[];
  groqKey: string;
  geminiKey: string;
  socket: Socket | null;
}

const CHUNK_SIZE = 256 * 1024; // 256KB

export default function DashboardTab({ logs, groqKey, geminiKey, socket }: DashboardTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState(0);
  const [voices, setVoices] = useState<Voices>({});
  const [selectedVoice, setSelectedVoice] = useState('Myint Myat');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  
  // Live Sync Editor States
  const [syncState, setSyncState] = useState<'idle' | 'ready' | 'rendering'>('idle');
  const [syncData, setSyncData] = useState<{ videoFilename: string, audioFilename: string } | null>(null);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = videoSpeed;
  }, [videoSpeed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = audioSpeed;
  }, [audioSpeed]);

  const handlePlayPreview = () => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.currentTime = 0;
      audioRef.current.currentTime = 0;
      videoRef.current.play();
      audioRef.current.play();
    }
  };

  const handleRenderFinal = async () => {
    if (!syncData) return;
    setSyncState('rendering');
    try {
      const res = await fetch('/api/render-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoFilename: syncData.videoFilename,
          audioFilename: syncData.audioFilename,
          videoSpeed,
          audioSpeed
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
      .then(res => res.json())
      .then(data => {
        setVoices(data);
        if (Object.keys(data).length > 0) {
          setSelectedVoice(Object.keys(data)[0]);
        }
      })
      .catch(err => console.error(err));
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
    const handleSyncReady = (data: { videoFilename: string, audioFilename: string }) => {
      setSyncData(data);
      setSyncState('ready');
      setIsProcessing(false);
      setProcessStage(4);
      setVideoSpeed(1);
      setAudioSpeed(1);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Upload & Controls */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Upload Video</h2>
          <p className="text-gray-400 text-sm">Drop your raw video here to start the automation.</p>
        </div>

        {syncState === 'idle' && !finalVideoUrl && (
          <>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-black/20 hover:bg-white/5 hover:border-white/30'}
                ${isUploading || isProcessing ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={48} className={`mx-auto mb-4 ${isDragActive ? 'text-purple-400' : 'text-gray-500'}`} />
              {file ? (
                <div>
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium">Drag & drop your video</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse (MP4, MOV)</p>
                </div>
              )}
            </div>

            {file && (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Voice</label>
                  <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={isUploading || isProcessing}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                  >
                    {Object.keys(voices).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <button
                  onClick={uploadFile}
                  disabled={isUploading || isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Uploading {uploadProgress}%</span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Processing Video...</span>
                    </>
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      <span>Start Automation</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Live Sync Editor */}
        {syncState === 'ready' && syncData && (
          <div className="mt-8 bg-black/40 border border-white/10 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Settings2 size={24} className="text-purple-400" /> Live Sync Editor
            </h3>
            
            <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-black flex items-center justify-center border border-white/10 shadow-lg">
              <video 
                ref={videoRef}
                src={`/uploads/${syncData.videoFilename}`} 
                className="w-full h-full object-contain"
                controls
                onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                onPlay={() => { if (audioRef.current) audioRef.current.play(); }}
                onPause={() => { if (audioRef.current) audioRef.current.pause(); }}
                onSeeked={(e) => { if (audioRef.current) audioRef.current.currentTime = e.currentTarget.currentTime; }}
              />
              <audio 
                ref={audioRef}
                src={`/tmp/${syncData.audioFilename}`} 
                onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                className="hidden"
              />
            </div>

            <div className="space-y-6">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-300">Video Speed</label>
                    <span className="text-sm font-mono text-gray-400">{videoSpeed.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2" step="0.05" value={videoSpeed}
                    onChange={(e) => setVideoSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-300">Audio Speed</label>
                    <span className="text-sm font-mono text-gray-400">{audioSpeed.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2" step="0.05" value={audioSpeed}
                    onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Timeline Tracks */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-300">Timeline Comparison</span>
                  {Math.abs((videoDuration / videoSpeed) - (audioDuration / audioSpeed)) <= 0.5 ? (
                    <span className="text-green-400 font-bold text-xs bg-green-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 size={12} /> Synced
                    </span>
                  ) : (
                    <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-1 rounded-md">
                      Out of Sync
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative h-8 bg-black/50 rounded-lg overflow-hidden flex items-center">
                    <div 
                      className={`h-full transition-all duration-300 flex items-center px-3 ${Math.abs((videoDuration / videoSpeed) - (audioDuration / audioSpeed)) <= 0.5 ? 'bg-green-500/80' : 'bg-purple-500/80'}`}
                      style={{ width: `${((videoDuration / videoSpeed) / Math.max(videoDuration / videoSpeed, audioDuration / audioSpeed, 1)) * 100}%` }}
                    >
                      <span className="text-xs font-mono font-bold text-white drop-shadow-md">
                        Video: {(videoDuration / videoSpeed).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-black/50 rounded-lg overflow-hidden flex items-center">
                    <div 
                      className={`h-full transition-all duration-300 flex items-center px-3 ${Math.abs((videoDuration / videoSpeed) - (audioDuration / audioSpeed)) <= 0.5 ? 'bg-green-500/80' : 'bg-blue-500/80'}`}
                      style={{ width: `${((audioDuration / audioSpeed) / Math.max(videoDuration / videoSpeed, audioDuration / audioSpeed, 1)) * 100}%` }}
                    >
                      <span className="text-xs font-mono font-bold text-white drop-shadow-md">
                        Audio: {(audioDuration / audioSpeed).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePlayPreview}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all border border-white/20"
                >
                  <Play size={18} fill="currentColor" />
                  <span>Preview Sync</span>
                </button>
                <button
                  onClick={handleRenderFinal}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <CheckCircle2 size={18} />
                  <span>Finalize & Render</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bars */}
        {(isProcessing || processStage === 5) && (
          <div className="space-y-3 mt-6">
            {stages.map((stage, idx) => {
              const currentIdx = idx + 1;
              const isComplete = processStage > currentIdx;
              const isActive = processStage === currentIdx;
              
              return (
                <div key={stage} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${isComplete ? 'bg-green-500 text-black' : isActive ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-gray-500'}`}
                  >
                    {isComplete ? <CheckCircle2 size={14} /> : currentIdx}
                  </div>
                  <div className={`flex-1 h-2 rounded-full bg-black/50 overflow-hidden`}>
                    <div className={`h-full transition-all duration-1000 ${isComplete ? 'bg-green-500 w-full' : isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500 w-1/2 animate-pulse' : 'w-0'}`} />
                  </div>
                  <span className={`text-xs w-28 text-right ${isComplete || isActive ? 'text-gray-200' : 'text-gray-600'}`}>{stage}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Final Video Result */}
        {finalVideoUrl && (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <CheckCircle2 size={24} /> Processing Complete!
            </h3>
            
            <button 
              onClick={() => window.open(finalVideoUrl, '_blank')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all border border-white/20"
            >
              <Download size={18} />
              <span>Download Final Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Terminal */}
      <div className="flex flex-col bg-black/60 border border-white/10 rounded-3xl overflow-hidden h-full min-h-[300px] sm:min-h-[400px] shadow-inner">
        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center space-x-2">
          <Terminal size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-400 font-mono tracking-wider">SYSTEM LOGS</span>
        </div>
        <div 
          ref={terminalRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-2"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">Waiting for process to start...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3 mb-2">
                <span className="text-gray-600 whitespace-nowrap shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className={`break-words ${log.includes('Error') ? 'text-red-400' : log.includes('Complete') ? 'text-green-400' : 'text-blue-200'}`}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
