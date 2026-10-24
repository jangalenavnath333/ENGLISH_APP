import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";

import * as LegacyFileSystem from "expo-file-system/legacy";

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

// Converts any audio URI (native file:// or web blob:) into base64 string reliably across platforms
export async function fileUriToBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const b64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native: Android / iOS
  // 1. Try legacy FileSystem.readAsStringAsync (most reliable on Android/iOS native file:// URIs)
  try {
    const b64 = await LegacyFileSystem.readAsStringAsync(uri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    if (b64) return b64;
  } catch (err1) {
    console.log("LegacyFileSystem.readAsStringAsync error:", err1);
  }

  // 2. Try expo-file-system next File(uri).base64()
  try {
    const f = new File(uri);
    const b64 = await f.base64();
    if (b64) return b64;
  } catch (err2) {
    console.log("File.base64 error:", err2);
  }

  // 3. Fallback: fetch blob
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const b64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err3) {
    throw new Error(`Audio file read failed: ${err3}`);
  }
}

// Writes base64 wav to cache file on device
export async function writeWavCacheFile(base64: string): Promise<string> {
  const filename = "bolu-tts.wav";
  try {
    const targetUri = `${LegacyFileSystem.cacheDirectory}${filename}`;
    await LegacyFileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    return targetUri;
  } catch (err1) {
    console.log("LegacyFileSystem write error:", err1);
  }

  try {
    const file = new File(Paths.cache, filename);
    if (!file.exists) file.create();
    file.write(base64, { encoding: "base64" });
    return file.uri;
  } catch (err2) {
    console.log("File.write error:", err2);
    throw err2;
  }
}

// Plays a base64 WAV at full volume. Resolves when playback finishes.
export async function playWavBase64(base64: string, isSpeaker: boolean = true): Promise<void> {
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

  // iOS only honours earpiece routing while the session is in play-and-record mode
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: !isSpeaker,
    shouldRouteThroughEarpiece: !isSpeaker,
  });

  const fileUri = await writeWavCacheFile(base64);

  return new Promise<void>((resolve) => {
    let resolved = false;
    let guardTimer: any = null;
    let sub: any = null;
    let player: any = null;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      if (guardTimer) clearTimeout(guardTimer);
      try {
        sub?.remove?.();
      } catch {}
      try {
        player?.pause?.();
      } catch {}
      try {
        if (typeof player?.release === "function") {
          player.release();
        }
      } catch {}
      stopCurrent = null;
      resolve();
    };

    stopCurrent = cleanup;

    try {
      player = createAudioPlayer({ uri: fileUri });
      player.volume = 1;
      sub = player.addListener("playbackStatusUpdate", (status: any) => {
        if (status.didJustFinish) cleanup();
      });
      player.play();

      // Guard timer: if audio finishes or status listener fails to fire on native,
      // resolve after 15 seconds so the call loop never freezes
      guardTimer = setTimeout(() => {
        cleanup();
      }, 15000);
    } catch (e) {
      console.log("AudioPlayer play error:", e);
      cleanup();
    }
  });
}

// A phone-style ringback tone (440 + 480 Hz for 2 s, then short silence), generated in code so no audio file is needed.
export function makeRingbackWavBase64(): string {
  const rate = 8000;
  const toneSec = 2;
  const silenceSec = 0.4;
  const total = Math.floor(rate * (toneSec + silenceSec));
  const wav = new DataView(new ArrayBuffer(44 + total * 2));
  const writeStr = (o: number, s: string) => [...s].forEach((c, i) => wav.setUint8(o + i, c.charCodeAt(0)));
  writeStr(0, "RIFF");
  wav.setUint32(4, 36 + total * 2, true);
  writeStr(8, "WAVEfmt ");
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, rate, true);
  wav.setUint32(28, rate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  writeStr(36, "data");
  wav.setUint32(40, total * 2, true);
  const toneSamples = rate * toneSec;
  for (let i = 0; i < total; i++) {
    let v = 0;
    if (i < toneSamples) {
      const t = i / rate;
      const fade = Math.min(1, i / 200, (toneSamples - i) / 200); // avoid clicks
      v = 0.25 * fade * (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 480 * t));
    }
    wav.setInt16(44 + i * 2, Math.round(v * 0x7fff), true);
  }
  const bytes = new Uint8Array(wav.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// Web only: recorded blob (webm/ogg/mp4) -> 16 kHz mono WAV base64, which Gemini accepts for any recording format.
export async function blobUriToWavBase64(uri: string): Promise<string> {
  return blobToWavBase64(await (await fetch(uri)).blob());
}

// Same conversion for a Blob we already hold in memory
export async function blobToWavBase64(blob: Blob): Promise<string> {
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
