import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Play, Terminal, Loader2, CheckCircle2, Download } from 'lucide-react';
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
  
  const terminalRef = useRef<HTMLDivElement>(null);

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
    const handleProcessComplete = (data: { status: string, outputUrl?: string }) => {
      if (data.status === 'success' && data.outputUrl) {
        setFinalVideoUrl(data.outputUrl);
        setIsProcessing(false);
        setProcessStage(5);
      }
    };
    const handleProcessError = (data: { error: string }) => {
      setIsProcessing(false);
    };
    socket.on('process-complete', handleProcessComplete);
    socket.on('process-error', handleProcessError);
    return () => {
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
      <div className="flex flex-col bg-black/60 border border-white/10 rounded-3xl overflow-hidden h-full min-h-[400px] shadow-inner">
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
              <div key={i} className="flex">
                <span className="text-gray-600 mr-3">[{new Date().toLocaleTimeString()}]</span>
                <span className={`${log.includes('Error') ? 'text-red-400' : log.includes('Complete') ? 'text-green-400' : 'text-blue-200'}`}>
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
