import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";

let stopCurrent: (() => void) | null = null;

// iOS Safari only allows audio.play() after a user gesture. Our voice arrives after a network call,
// so we keep ONE audio element and "unlock" it on the first tap/click with a tiny silent clip.
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) sharedAudio = new Audio();
  return sharedAudio;
}

if (Platform.OS === "web" && typeof document !== "undefined") {
  const unlock = () => {
    const a = getSharedAudio();
    a.src = SILENT_WAV;
    a.play().then(() => a.pause()).catch(() => {});
    document.removeEventListener("touchend", unlock);
    document.removeEventListener("click", unlock);
  };
  document.addEventListener("touchend", unlock, { passive: true });
  document.addEventListener("click", unlock);
}

export function stopPlayback() {
  stopCurrent?.();
  stopCurrent = null;
}

// Plays a base64 WAV at full volume. Resolves when playback finishes.
export async function playWavBase64(base64: string): Promise<void> {
  stopPlayback();

  if (Platform.OS === "web") {
    return new Promise<void>((resolve, reject) => {
      const audio = getSharedAudio();
      audio.src = `data:audio/wav;base64,${base64}`;
      audio.volume = 1;
      stopCurrent = () => {
        audio.pause();
        resolve();
      };
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play().catch(reject);
    });
  }

  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
  const file = new File(Paths.cache, "bolu-tts.wav");
  if (!file.exists) file.create();
  file.write(base64, { encoding: "base64" });

  return new Promise<void>((resolve) => {
    const player = createAudioPlayer({ uri: file.uri });
    player.volume = 1;
    const sub = player.addListener("playbackStatusUpdate", (status: any) => {
      if (status.didJustFinish) done();
    });
    const done = () => {
      sub.remove();
      player.release();
      stopCurrent = null;
      resolve();
    };
    stopCurrent = done;
    player.play();
  });
}

// Web only: recorded blob (webm/ogg/mp4) -> 16 kHz mono WAV base64, which Gemini accepts for any recording format.
export async function blobUriToWavBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const buf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decoded = await ctx.decodeAudioData(buf);
  await ctx.close();

  const targetRate = 16000;
  const length = Math.ceil(decoded.duration * targetRate);
  const offline = new OfflineAudioContext(1, length, targetRate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);

  const wav = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const writeStr = (o: number, s: string) => [...s].forEach((c, i) => wav.setUint8(o + i, c.charCodeAt(0)));
  writeStr(0, "RIFF");
  wav.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVEfmt ");
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, targetRate, true);
  wav.setUint32(28, targetRate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  writeStr(36, "data");
  wav.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    wav.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const bytes = new Uint8Array(wav.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
