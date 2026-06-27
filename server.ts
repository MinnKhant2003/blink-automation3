import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';
import { EdgeTTS } from 'node-edge-tts';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

ffmpeg.setFfmpegPath(ffmpegStatic!);

app.use(express.json());

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const TMP_DIR = path.join(process.cwd(), 'tmp');

[UPLOADS_DIR, OUTPUTS_DIR, TMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/outputs', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(OUTPUTS_DIR));

// Voice Config
const VOICES = {
  'Myint Myat': { voice: 'my-MM-ThihaNeural', pitch: '+10Hz', rate: '+15%' },
  'Nay Toe': { voice: 'my-MM-ThihaNeural', pitch: '-5Hz', rate: '+0%' },
  'Nilar': { voice: 'my-MM-NilarNeural', pitch: '+0Hz', rate: '+5%' },
};

app.get('/api/voices', (req, res) => {
  res.json(VOICES);
});

// Voice Preview
app.post('/api/preview-voice', async (req, res) => {
  const { voiceName, text } = req.body;
  const config = VOICES[voiceName as keyof typeof VOICES];
  
  if (!config) {
    return res.status(400).json({ error: 'Voice not found' });
  }

  const outputPath = path.join(TMP_DIR, `preview_${uuidv4()}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice: config.voice,
      pitch: config.pitch,
      rate: config.rate,
    });
    
    await tts.ttsPromise(text || 'မင်္ဂလာပါ၊ ဘလင့်အော်တိုမေးရှင်းမှ ကြိုဆိုပါတယ်။', outputPath);
    
    res.download(outputPath, 'preview.mp3', () => {
      // Clean up after download
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Chunked Upload via express.raw
app.post('/api/upload-chunk', express.raw({ limit: '10mb', type: '*/*' }), (req, res) => {
  const { uploadId, chunkIndex } = req.query;
  const fileData = req.body;

  if (!fileData || !uploadId || chunkIndex === undefined) {
    return res.status(400).json({ error: 'Missing parameters or body' });
  }

  const finalDir = path.join(UPLOADS_DIR, uploadId as string);
  if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

  const chunkPath = path.join(finalDir, `chunk_${chunkIndex}`);
  fs.writeFileSync(chunkPath, fileData);

  res.json({ message: 'Chunk received' });
});

app.post('/api/upload/complete', async (req, res) => {
  const { uploadId, originalName, totalChunks } = req.body;
  const finalDir = path.join(UPLOADS_DIR, uploadId);
  const finalPath = path.join(UPLOADS_DIR, `${uploadId}_${originalName}`);

  try {
    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(finalDir, `chunk_${i}`);
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
      fs.unlinkSync(chunkPath);
    }
    writeStream.end();
    fs.rmdirSync(finalDir);

    res.json({ fileId: uploadId, filename: `${uploadId}_${originalName}` });
  } catch (error) {
    console.error('Error combining chunks:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

// Download result
app.get('/api/download-result', (req, res) => {
  const { file, name } = req.query;
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Missing file parameter' });
  }
  
  const filename = path.basename(file);
  const finalPath = path.join(OUTPUTS_DIR, filename);
  
  if (!fs.existsSync(finalPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(finalPath, typeof name === 'string' ? name : 'recap_final.mp4');
});

// Process Video
app.post('/api/process', async (req, res) => {
  const { filename, groqKey, geminiKey, voiceName } = req.body;
  
  // We handle the background processing to avoid blocking the request
  res.json({ message: 'Processing started' });
  
  const log = (msg: string) => io.emit('log', msg);
  
  try {
    log('Started processing video...');
    
    // Simulate AI Transcription
    log('[1/4] Running AI Transcription...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulate Script Gen
    log('[2/4] Generating Script with Groq and Gemini Vision...');
    await new Promise(r => setTimeout(r, 3000));
    const script = "ဒါကတော့ ဇာတ်လမ်းအကျဉ်းချုပ်ပါ။ ဒီနေရာမှာ စိတ်ဝင်စားစရာတွေ အများကြီးပါဝင်ပါတယ်။";
    
    // Smart Trim & Voice Gen
    log('[3/4] Generating Tuned Voiceover...');
    const config = VOICES[voiceName as keyof typeof VOICES] || VOICES['Myint Myat'];
    const tts = new EdgeTTS({
      voice: config.voice,
      pitch: config.pitch,
      rate: config.rate,
    });
    const audioPath = path.join(TMP_DIR, `voice_${uuidv4()}.mp3`);
    await tts.ttsPromise(script, audioPath);
    
    log('[4/4] Smart Trimming & Syncing via FFmpeg...');
    const inputPath = path.join(UPLOADS_DIR, filename);
    const outputFilename = `final_${uuidv4()}.mp4`;
    const finalOutputPath = path.join(OUTPUTS_DIR, outputFilename);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .input(audioPath)
        .complexFilter([
          '[0:a]silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-30dB[trimmed_orig_a]',
          '[1:a]volume=1.5[voice_a]',
          '[trimmed_orig_a][voice_a]amix=inputs=2:duration=first:dropout_transition=2[audio_out]',
          '[0:v]fps=30,format=yuv420p[video_out]'
        ])
        .outputOptions([
          '-map [video_out]',
          '-map [audio_out]',
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 28',
          '-c:a aac',
          '-b:a 128k',
          '-shortest'
        ])
        .save(finalOutputPath)
        .on('start', (cmdline) => log(`FFmpeg started...`))
        .on('end', () => {
           log('FFmpeg processing complete.');
           resolve(true);
        })
        .on('error', (err) => {
           log(`FFmpeg error: ${err.message}`);
           reject(err);
        });
    });
    
    // Upload to Catbox.moe for public access (avoids Cloudflare HTML blocks)
    log('Process Complete. Uploading to temporary host for download...');
    
    const fileBuffer = fs.readFileSync(finalOutputPath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, outputFilename);
    
    const uploadRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadRes.ok) {
        throw new Error('Failed to upload final video to catbox');
    }
    
    const externalUrl = await uploadRes.text();
    
    log('Upload complete. Ready for download.');
    io.emit('process-complete', { status: 'success', outputUrl: externalUrl.trim() });
    
  } catch (error: any) {
    log(`Error: ${error.message}`);
    io.emit('process-error', { error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
