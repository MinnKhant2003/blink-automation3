import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Uploading...");
  fs.writeFileSync("dummy.txt", "hello world");
  
  const uploadResult = await ai.files.upload({ file: "dummy.txt", config: { mimeType: "text/plain" } });
  console.log("Uploaded file uri:", uploadResult.uri);
  
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
        }
      }, 
      "What is in the file?"
    ]
  });
  console.log("Result fileData:", res.text);
  
  const res2 = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      uploadResult, 
      "What is in the file?"
    ]
  });
  console.log("Result uploadResult directly:", res2.text);

  await ai.files.delete({ name: uploadResult.name });
}

run().catch(console.error);
