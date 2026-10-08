import { Platform } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File } from "expo-file-system";
import { blobUriToWavBase64 } from "./audio";

export interface VoiceClip {
  base64: string;
  mime: string;
}

// Tap-to-start / tap-to-stop microphone recording. stop() returns audio ready to send to Gemini.
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  const start = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) throw new Error("बोलण्यासाठी माइक चालू करा (Microphone permission द्या).");
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async (): Promise<VoiceClip> => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) throw new Error("रेकॉर्डिंग मिळालं नाही");
    if (Platform.OS === "web") {
      return { base64: await blobUriToWavBase64(uri), mime: "audio/wav" };
    }
    return { base64: await new File(uri).base64(), mime: "audio/mp4" };
  };

  return { isRecording: state.isRecording, start, stop };
}
