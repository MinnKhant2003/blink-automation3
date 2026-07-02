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
  // Male variations (ThihaNeural)
  'Myint Myat': { voice: 'my-MM-ThihaNeural', pitch: '+10Hz', rate: '+15%', description: 'တက်ကြွပြီး မြန်ဆန်သော အသံ (Energetic & Fast)' },
  'Nay Toe': { voice: 'my-MM-ThihaNeural', pitch: '-5Hz', rate: '+0%', description: 'တည်ငြိမ်ပြီး လေးနက်သော အသံ (Deep & Calm)' },
  'Aung La': { voice: 'my-MM-ThihaNeural', pitch: '-15Hz', rate: '+10%', description: 'သြဇာပါပြီး အားမာန်ပါသော အသံ (Authoritative)' },
  'Min Thway': { voice: 'my-MM-ThihaNeural', pitch: '+20Hz', rate: '-5%', description: 'နုပျိုပြီး ခံစားချက်ပါသော အသံ (Youthful & Expressive)' },
  'Kyaw Swar': { voice: 'my-MM-ThihaNeural', pitch: '-10Hz', rate: '-10%', description: 'ပုံပြင်ပြောသူ အသံ (Slow Storyteller)' },
  
  // Female variations (NilarNeural)
  'Nilar': { voice: 'my-MM-NilarNeural', pitch: '+0Hz', rate: '+5%', description: 'ကြည်လင်ပြီး သေသပ်သော အသံ (Clear & Professional)' },
  'Shwe Hmone': { voice: 'my-MM-NilarNeural', pitch: '+15Hz', rate: '+10%', description: 'ချိုသာပြီး ရွှင်လန်းသော အသံ (Sweet & Cheerful)' },
  'Phyu Phyu': { voice: 'my-MM-NilarNeural', pitch: '-10Hz', rate: '-5%', description: 'ရင့်ကျက်ပြီး ညင်သာသော အသံ (Mature & Gentle)' },
  'Thazin': { voice: 'my-MM-NilarNeural', pitch: '+5Hz', rate: '+20%', description: 'မြန်ဆန်ပြီး သွက်လက်သော အသံ (Dynamic & Fast)' },
  'May': { voice: 'my-MM-NilarNeural', pitch: '-5Hz', rate: '-15%', description: 'အေးချမ်းပြီး နားထောင်ကောင်းသော အသံ (Calm & Soothing)' },
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

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata?.format?.duration || 0);
    });
  });
}

function getSceneDurations(inputPath: string, totalDuration: number): Promise<{scene: number, duration: number, start: number, end: number}[]> {
  return new Promise((resolve, reject) => {
    const sceneTimestamps: number[] = [0];
    ffmpeg(inputPath)
      .outputOptions([
        '-filter:v select=\'gt(scene,0.4)\',showinfo',
        '-f null'
      ])
      .on('stderr', (stderrLine) => {
        const match = stderrLine.match(/pts_time:([0-9\.]+)/);
        if (match) {
          sceneTimestamps.push(parseFloat(match[1]));
        }
      })
      .on('error', (err) => {
        console.error('Scene detection error', err);
        resolve([{ scene: 1, duration: totalDuration, start: 0, end: totalDuration }]);
      })
      .on('end', () => {
        sceneTimestamps.push(totalDuration);
        const scenes = [];
        let sceneIndex = 1;
        for (let i = 0; i < sceneTimestamps.length - 1; i++) {
          const start = sceneTimestamps[i];
          const end = sceneTimestamps[i + 1];
          const duration = end - start;
          if (duration > 0.5) { // min 0.5s
            scenes.push({
              scene: sceneIndex++,
              start,
              end,
              duration
            });
          }
        }
        if (scenes.length === 0) {
          scenes.push({ scene: 1, duration: totalDuration, start: 0, end: totalDuration });
        }
        resolve(scenes);
      })
      .save('pipe:1');
  });
}

// Process Video
app.post('/api/process', async (req, res) => {
  const { filename, groqKey, geminiKey, voiceName } = req.body;
  res.json({ message: 'Processing started' });
  const log = (msg: string) => io.emit('log', msg);
  
  try {
    log('Started processing video...');
    const inputPath = path.join(UPLOADS_DIR, filename);
    
    let videoDuration = 0;
    try {
      videoDuration = await getAudioDuration(inputPath);
      log(`Detected video duration: ${videoDuration.toFixed(2)}s`);
    } catch (e) {
      log('Could not determine video duration. Defaulting to 30s.');
      videoDuration = 30;
    }

    // Step 1: FFmpeg Scene Detection
    log('[1/4] Running FFmpeg Scene Detection...');
    const sceneDurations = await getSceneDurations(inputPath, videoDuration);
    log(`Detected ${sceneDurations.length} scenes.`);
    
    // Step 2: Gemini Vision Integration
    let scenes: any[] = [];
    let fullScript = "";
    if (geminiKey) {
      try {
        const genAI = new GoogleGenAI({ apiKey: geminiKey });
        log('[2/4] Generating Script with Gemini Vision...');
        const uploadResult = await genAI.files.upload({ file: inputPath, config: { mimeType: 'video/mp4' } });
        
        let fileInfo = await genAI.files.get({ name: uploadResult.name });
        while (fileInfo.state === 'PROCESSING') {
          await new Promise(r => setTimeout(r, 2000));
          fileInfo = await genAI.files.get({ name: uploadResult.name });
        }
        if (fileInfo.state === 'FAILED') throw new Error('Video processing failed in Gemini.');

        const prompt = `Act as a strict Video Transcript Extractor, Professional Burmese Translator, precise video editor, and TikTok Content Optimizer for the 'blinkrecap' TikTok channel.
Analyze the provided video and the following scene durations.
Write a Burmese narration strictly tailored to each scene's duration.
Here are the detected scenes:
${JSON.stringify(sceneDurations, null, 2)}

You must output a strict JSON object exactly matching this schema:
{
  "scenes": [
    {
      "scene": 1,
      "duration": 4.5,
      "narration_text": "your burmese narration here"
    }
  ],
  "tiktok_details": {
    "original_transcript": "Extract the exact spoken words (English). DO NOT summarize. Append: 'Follow for more movie recaps.'",
    "outro_script": "1-2s CTA like 'Follow for more!' or 'Next part မလွတ်ချင်ရင် Follow လုပ်ထားပေးပါ။'",
    "cover_text": "SHORT, high-curiosity Burmese hook (max 6 words)",
    "caption": "Viral Reddit-style hook + emojis. Ends with: 'Movie Recap အတွက် Follow လုပ်ထားပါ။'",
    "hashtags": "#blinkrecap #movierecap #recapmovies #fyp #viral #movieclips"
  }
}

CRITICAL RULES:
- Output ONLY valid JSON without any markdown formatting blocks.
- DO NOT create a new story.
- Maintain chronological order and match the provided scenes.
- Use natural Burmese language for narration_text.`;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
              prompt
            ],
            config: { responseMimeType: "application/json" }
        });
        
        const jsonText = response.text || "{}";
        try {
          const generatedData = JSON.parse(jsonText);
          const generatedScenes = generatedData.scenes || [];
          scenes = sceneDurations.map((sd: any) => {
            const gScene = generatedScenes.find((g: any) => g.scene === sd.scene);
            return { ...sd, narration_text: gScene ? gScene.narration_text : "ဒီအပိုင်းမှာတော့ ဆက်လက်ပြီး ကြည့်ရှုရမှာဖြစ်ပါတယ်။" };
          });
          
          if (generatedData.tiktok_details) {
            fullScript = `1. Original Transcript (English)
${generatedData.tiktok_details.original_transcript}

2. Outro Script (Only CTA)
${generatedData.tiktok_details.outro_script}

3. Cover Text
${generatedData.tiktok_details.cover_text}

4. Caption
${generatedData.tiktok_details.caption}

5. Hashtags
${generatedData.tiktok_details.hashtags}`;
          }
        } catch (e) {
          log("Failed to parse JSON from Gemini. Proceeding with fallback.");
        }
        
        await genAI.files.delete({ name: uploadResult.name }).catch(() => {});
      } catch (e: any) {
        log(`Gemini Vision generation failed: ${e.message}`);
      }
    }

    if (!scenes || scenes.length === 0) {
      scenes = sceneDurations.map((sd: any) => ({
        ...sd,
        narration_text: "ဒီဗီဒီယိုမှာတော့ အရမ်းကို စိတ်ဝင်စားဖို့ကောင်းတဲ့ အကြောင်းအရာတွေကို တွေ့ရမှာပါ။ ဆက်လက် ကြည့်ရှုလိုက်ကြရအောင်။"
      }));
    }
    
    // Step 3: Text-to-Speech (node-edge-tts)
    log('[3/4] Generating Voiceover for scenes (node-edge-tts)...');
    const config = VOICES[voiceName as keyof typeof VOICES] || VOICES['Myint Myat'];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const audioFilename = `voice_${uuidv4()}_scene_${scene.scene}.mp3`;
      const audioPath = path.join(TMP_DIR, audioFilename);
      
      const tts = new EdgeTTS({
        voice: config.voice,
        pitch: config.pitch,
        rate: config.rate,
        timeout: 120000
      });
      await tts.ttsPromise(scene.narration_text, audioPath);
      
      // Step 3.5: Audio Measurement
      log(`Measuring actual audio duration for scene ${scene.scene}...`);
      const actualAudioDuration = await getAudioDuration(audioPath);
      
      scene.audioFilename = audioFilename;
      scene.audioPath = audioPath;
      scene.actualAudioDuration = actualAudioDuration;
    }
    
    log('[4/4] Preparing Live Sync Editor...');
    io.emit('sync-ready', { videoFilename: filename, scenes: scenes, fullScript: fullScript });
    
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    log(`Error: ${errorMsg}`);
    console.error('Full process error:', error);
    io.emit('process-error', { error: errorMsg });
  }
});

// Finalize and Render
app.post('/api/render-final', async (req, res) => {
  const { videoFilename, scenes } = req.body;
  res.json({ message: 'Final render started' });
  const log = (msg: string) => io.emit('log', msg);
  
  try {
    log('Step 4: FFmpeg Final Render & Sync started...');
    const inputPath = path.join(UPLOADS_DIR, videoFilename);
    const outputFilename = `final_${uuidv4()}.mp4`;
    const finalOutputPath = path.join(OUTPUTS_DIR, outputFilename);

    const mergedScenes = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      log(`Processing Scene ${scene.scene}...`);
      const sceneAudioPath = scene.audioPath;
      const sceneMergedPath = path.join(TMP_DIR, `scene_merged_${scene.scene}_${uuidv4()}.mp4`);
      
      const audioDur = scene.actualAudioDuration || await getAudioDuration(sceneAudioPath);
      const videoDur = scene.duration;
      
      // Sync & Render in one single step to avoid double encoding and ensure frame-accurate normalization
      await new Promise((resolve, reject) => {
        let cmd = ffmpeg()
          .input(inputPath)
          .seekInput(scene.start)
          .inputOptions([`-t ${videoDur}`])
          .input(sceneAudioPath);
        
        if (audioDur > videoDur) {
           const freezeDur = audioDur - videoDur;
           cmd.complexFilter([ `[0:v]scale=-2:480,fps=24,format=yuv420p,tpad=stop_mode=clone:stop_duration=${freezeDur}[v]` ])
             .outputOptions([
               '-map [v]', '-map 1:a',
               '-c:v libx264', '-preset ultrafast', '-crf 30',
               '-c:a aac', '-b:a 96k', '-shortest'
             ]);
        } else {
           cmd.complexFilter([ `[0:v]scale=-2:480,fps=24,format=yuv420p[v]` ])
             .outputOptions([
               '-map [v]', '-map 1:a',
               '-c:v libx264', '-preset ultrafast', '-crf 30',
               '-c:a aac', '-b:a 96k', '-shortest'
             ]);
        }
        
        cmd.save(sceneMergedPath).on('end', resolve).on('error', reject);
      });
      mergedScenes.push(sceneMergedPath);
    }
    
    log('Concatenating all synced scenes...');
    const concatListPath = path.join(TMP_DIR, `concat_${uuidv4()}.txt`);
    const concatContent = mergedScenes.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .save(finalOutputPath)
        .on('end', resolve)
        .on('error', reject);
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
    const errorMsg = error?.message || String(error);
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
