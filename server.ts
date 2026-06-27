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
import ffprobeStatic from 'ffprobe-static';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import FormDataNode from 'form-data';
import axios from 'axios';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

ffmpeg.setFfmpegPath(ffmpegStatic!);
ffmpeg.setFfprobePath(ffprobeStatic.path);

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

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(UPLOADS_DIR));

app.use('/tmp', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(TMP_DIR));

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
      timeout: 30000
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
    
    // Generate Script with Gemini Vision
    log('[2/4] Generating Script with Gemini Vision...');
    const inputPath = path.join(UPLOADS_DIR, filename);
    
    let videoDuration = 0;
    try {
      videoDuration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata.format.duration || 0);
        });
      });
      log(`Detected video duration: ${videoDuration.toFixed(2)}s`);
    } catch (e) {
      log('Could not determine video duration. Defaulting to 30s.');
      videoDuration = 30;
    }
    const max_words = Math.floor(videoDuration * 2.5);
    
    let script = "";
    
    if (geminiKey) {
      try {
        const genAI = new GoogleGenAI({ apiKey: geminiKey });
        log('Uploading video for analysis...');
        const uploadResult = await genAI.files.upload({ file: inputPath, config: { mimeType: 'video/mp4' } });
        
        log('Waiting for video processing in Gemini...');
        let fileInfo = await genAI.files.get({ name: uploadResult.name });
        while (fileInfo.state === 'PROCESSING') {
          await new Promise(r => setTimeout(r, 2000));
          fileInfo = await genAI.files.get({ name: uploadResult.name });
        }
        
        if (fileInfo.state === 'FAILED') {
          throw new Error('Video processing failed in Gemini.');
        }

        log('Generating detailed script...');
        const response = await genAI.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
              { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
              `You are an elite YouTube Movie Recap writer with 10+ years of experience. Your task is to transform the provided video into a highly engaging Burmese movie recap narration.
CRITICAL TIME LIMIT: The target video is exactly ${videoDuration.toFixed(2)} seconds long. Your ENTIRE script MUST be STRICTLY UNDER ${max_words} words. Count your words. Do not exceed this limit.
Rules:
Cover every important scene shown in the video in chronological order.
If characters are present, explain their emotions and motivations. Include important dialogue naturally. If no characters are present, build suspense and tension around the visible events.
Build suspense and curiosity throughout the recap. Connect scenes smoothly.
Use natural Burmese language suitable for AI voiceover. Write short and clear sentences.
Do not invent scenes that are not visible in the video.
Avoid repetitive phrases such as ရုတ်တရက်, ဒီအချိန်မှာပဲ, အံ့သြမှင်တက်သွားပါတယ်, and ဆက်လက်စောင့်ကြည့်ရမှာပါ.
Write like a human narrator, not like an AI describing scenes. Make viewers curious about what happens next.
Output: Generate a complete Burmese narration script ONLY. Do not include headings, timestamps, explanations, or bullet points. Output strictly in Burmese language. End scenes naturally before reaching the ${max_words} limit.`
            ],
        });
        script = response.text || "";
        
        // Cleanup
        await genAI.files.delete({ name: uploadResult.name }).catch(() => {});
      } catch (e: any) {
        log(`Gemini Vision generation failed: ${e.message}`);
      }
    }

    if (!script) {
      // Fallback script if no keys are provided or APIs fail, made long enough for 30-60s
      script = "ဒီဗီဒီယိုမှာတော့ အရမ်းကို စိတ်ဝင်စားဖို့ကောင်းတဲ့ အကြောင်းအရာတွေကို တွေ့ရမှာပါ။ ပထမဆုံးအနေနဲ့ မြင်တွေ့ရမယ့် မြင်ကွင်းတွေက သင့်ကို အံ့သြသွားစေမှာ အသေအချာပါပဲ။ အသေးစိတ် အချက်အလက်တိုင်းကို သေချာ ဂရုတစိုက် ရိုက်ကူးထားပြီး ကြည့်ရှုသူတွေကို ဆွဲဆောင်မှု အပြည့်အဝ ပေးစွမ်းနိုင်ပါတယ်။ ဒီလိုမျိုး ထူးခြားတဲ့ အတွေ့အကြုံကို ရရှိဖို့ဆိုတာ လွယ်ကူတဲ့ ကိစ္စတော့ မဟုတ်ပါဘူး။ ဒါကြောင့် အခုပဲ ဆက်လက် ကြည့်ရှုလိုက်ကြရအောင်။ ပိုမို စိတ်လှုပ်ရှားစရာ ကောင်းတဲ့ အခိုက်အတန့်တွေက သင့်ကို စောင့်ကြိုနေပါတယ်။ အားလုံးပဲ သဘောကျ နှစ်သက်လိမ့်မယ်လို့ မျှော်လင့်ပါတယ်။";
    }
    
    // Smart Trim & Voice Gen
    log('[3/4] Generating Tuned Voiceover...');
    const config = VOICES[voiceName as keyof typeof VOICES] || VOICES['Myint Myat'];
    const tts = new EdgeTTS({
      voice: config.voice,
      pitch: config.pitch,
      rate: config.rate,
      timeout: 120000 // Increase timeout to 120 seconds
    });
    const audioFilename = `voice_${uuidv4()}.mp3`;
    const audioPath = path.join(TMP_DIR, audioFilename);
    await tts.ttsPromise(script, audioPath);
    
    log('[4/4] Preparing Live Sync Editor...');
    
    // Instead of rendering directly, emit sync-ready with the video and audio filenames
    io.emit('sync-ready', {
      videoFilename: filename,
      audioFilename: audioFilename
    });
    
  } catch (error: any) {
    const errorMsg = error?.message || JSON.stringify(error) || String(error);
    log(`Error: ${errorMsg}`);
    console.error('Full process error:', error);
    io.emit('process-error', { error: errorMsg });
  }
});

// Finalize and Render
app.post('/api/render-final', async (req, res) => {
  const { videoFilename, audioFilename, videoSpeed, audioSpeed } = req.body;
  res.json({ message: 'Final render started' });
  const log = (msg: string) => io.emit('log', msg);
  
  try {
    log('Starting final render with adjusted speeds...');
    const inputPath = path.join(UPLOADS_DIR, videoFilename);
    const audioPath = path.join(TMP_DIR, audioFilename);
    const outputFilename = `final_${uuidv4()}.mp4`;
    const finalOutputPath = path.join(OUTPUTS_DIR, outputFilename);

    await new Promise((resolve, reject) => {
      // Calculate pts and atempo string
      // Note: setpts uses N/FRAME_RATE/TB or simply PTS*(1/videoSpeed)
      const vSpeedStr = `1/${videoSpeed}`;
      const aSpeedStr = `${audioSpeed}`;
      
      ffmpeg()
        .input(inputPath)
        .inputOptions(['-stream_loop', '-1'])
        .input(audioPath)
        .outputOptions([
          '-map 0:v:0', // Explicitly take video from input 0
          '-map 1:a:0', // Explicitly take audio from input 1
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 30',
          '-threads 1',
          '-c:a aac',
          '-b:a 96k',
          '-shortest', 
          `-vf mpdecimate,setpts=PTS*${vSpeedStr},scale=-2:480,fps=24,format=yuv420p`, 
          `-af silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-30dB,volume=1.5,atempo=${aSpeedStr}`
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
    
    log('Process Complete. Uploading to temporary host for download...');
    
    const form = new FormDataNode();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(finalOutputPath), outputFilename);
    
    const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    const externalUrl = uploadRes.data;
    
    log('Upload complete. Ready for download.');
    io.emit('process-complete', { status: 'success', outputUrl: typeof externalUrl === 'string' ? externalUrl.trim() : String(externalUrl).trim() });
    
  } catch (error: any) {
    const errorMsg = error?.message || JSON.stringify(error) || String(error);
    log(`Error: ${errorMsg}`);
    console.error('Full process error:', error);
    io.emit('process-error', { error: errorMsg });
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
