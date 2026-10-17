import * as Speech from "expo-speech";
import { synthesizeSpeech, TUTORS } from "./gemini";
import { playWavBase64, stopPlayback } from "./audio";

const voiceCache = new Map<string, string>();

// Natural Gemini voice (cached per text). Falls back to the device voice if the AI voice fails.
export async function speakNatural(text: string) {
  stopPlayback();
  Speech.stop();
  try {
    let wav = voiceCache.get(text);
    if (!wav) {
      wav = await synthesizeSpeech(text, TUTORS[0].voice);
      voiceCache.set(text, wav);
    }
    await playWavBase64(wav);
  } catch {
    await new Promise<void>((resolve) =>
      Speech.speak(text, {
        language: "en-US",
        rate: 0.85,
        volume: 1,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      })
    );
  }
}

// Slow device voice, for "listen again slowly"
export function speakSlow(text: string) {
  stopPlayback();
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.5, volume: 1 });
}
