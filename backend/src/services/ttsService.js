const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const OpenAI = require("openai");

const BASE_DIR = path.join(__dirname, "..", "sessions");
const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;

function isSpeakable(text) {
  return /[.!?]$/.test(text.trim());
}

function getChunkPath(sessionId, chunkNum) {
  const dir = path.join(BASE_DIR, sessionId, "audio");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `chunk${chunkNum}.opus`);
}

function getWebmChunkPath(sessionId, chunkNum) {
  const dir = path.join(BASE_DIR, sessionId, "audio");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `chunk${chunkNum}.webm`);
}

function convertToWebm(inputPath, outputPath) {
  execSync(`ffmpeg -loglevel quiet -y -i "${inputPath}" -c:a libopus -f webm "${outputPath}"`);
  fs.unlinkSync(inputPath); // delete opus
}

async function generateAudio(sessionId, chunkNum, text) {
  try {
    const client = new OpenAI({
      baseURL: "https://api.deepinfra.com/v1/openai",
      apiKey: DEEPINFRA_API_KEY,
    });

    const opusPath = getChunkPath(sessionId, chunkNum);

    const response = await client.audio.speech.create({
      model: "hexgrad/Kokoro-82M",
      voice: "af_bella",
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(opusPath, buffer);

    const webmPath = getWebmChunkPath(sessionId, chunkNum);
    convertToWebm(opusPath, webmPath);

    const audioBase64 = fs.readFileSync(webmPath).toString("base64");
    return { text, audio: audioBase64 };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { generateAudio, isSpeakable };
