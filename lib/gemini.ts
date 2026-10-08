const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// Tried in order; next model is used if one is overloaded (503) or rate limited (429)
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-flash-latest"];

export interface TalkLanguage {
  name: string;
  speech: string; // BCP-47 code for expo-speech
}

export const AUTO_LANGUAGE = "Auto";

export const TALK_LANGUAGES: TalkLanguage[] = [
  { name: AUTO_LANGUAGE, speech: "mr-IN" },
  { name: "English", speech: "en-US" },
  { name: "Japanese", speech: "ja-JP" },
  { name: "Hindi", speech: "hi-IN" },
  { name: "Marathi", speech: "mr-IN" },
  { name: "Korean", speech: "ko-KR" },
  { name: "Spanish", speech: "es-ES" },
  { name: "French", speech: "fr-FR" },
  { name: "German", speech: "de-DE" },
];

export interface TalkTurn {
  transcript: string; // what the user said/wrote (transcribed if audio)
  hasMistake: boolean;
  corrected: string; // corrected sentence in the target language ("" if no mistake)
  explanation: string; // explanation in Marathi ("" if no mistake)
  reply: string; // tutor's reply in the target language
  replyTranslation: string; // Marathi meaning of the reply
  languageCode: string; // BCP-47 code of the language of "reply" / "corrected"
}

export interface TalkHistoryItem {
  role: "user" | "tutor";
  text: string;
}

export interface TalkInput {
  text?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export async function sendTalkTurn(
  language: string,
  history: TalkHistoryItem[],
  input: TalkInput
): Promise<TalkTurn> {
  if (!GEMINI_API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is missing in .env");
  }

  const isAuto = language === AUTO_LANGUAGE;
  const target = isAuto ? "the same language the user's latest message is in" : language;

  const system =
    `You are Bolu, a friendly language conversation tutor for a Marathi speaker.\n` +
    (isAuto
      ? `The user may speak or write in ANY language (English, Japanese, Hindi, Marathi, ...). Detect the language of their latest message and use it as the target language.\n`
      : `The user practices ${language} by speaking or writing.\n`) +
    `If audio is given, first transcribe exactly what they said.\n` +
    `Rules:\n` +
    `1. Check the user's sentence for grammar, vocabulary or word-order mistakes.\n` +
    `2. If there is a mistake: set hasMistake=true, put the corrected sentence in "corrected" (in ${target}), and explain the mistake simply in MARATHI in "explanation".\n` +
    `3. If correct: hasMistake=false, corrected="" and explanation="".\n` +
    `4. Then continue the conversation naturally in ${target} with a short reply (1-2 simple sentences) and a short follow-up question in "reply".\n` +
    `5. "replyTranslation" is the Marathi meaning of "reply" (empty string if reply is already Marathi).\n` +
    `6. "languageCode" is the BCP-47 code (e.g. en-US, ja-JP, hi-IN, mr-IN) of the language used in "reply".\n` +
    `Reply ONLY as JSON with keys: transcript, hasMistake, corrected, explanation, reply, replyTranslation, languageCode.`;

  const historyText = history
    .slice(-10)
    .map((h) => `${h.role === "user" ? "User" : "Tutor"}: ${h.text}`)
    .join("\n");

  const parts: any[] = [];
  if (historyText) parts.push({ text: `Conversation so far:\n${historyText}\n` });
  if (input.audioBase64) {
    parts.push({ text: "The user's new message is this audio:" });
    parts.push({
      inline_data: { mime_type: input.audioMimeType || "audio/mp4", data: input.audioBase64 },
    });
  } else {
    parts.push({ text: `The user's new message: ${input.text ?? ""}` });
  }

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json" },
  });

  // Retry a few times on temporary overload (503) / rate limit (429)
  let data: any;
  for (let attempt = 0; attempt < GEMINI_MODELS.length * 2; attempt++) {
    const model = GEMINI_MODELS[attempt % GEMINI_MODELS.length];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body,
      }
    );
    data = await response.json();
    const retryable = response.status === 503 || response.status === 429;
    if (!data.error || !retryable) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }

  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");

  const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    transcript: parsed.transcript ?? "",
    hasMistake: !!parsed.hasMistake,
    corrected: parsed.corrected ?? "",
    explanation: parsed.explanation ?? "",
    reply: parsed.reply ?? "",
    replyTranslation: parsed.replyTranslation ?? "",
    languageCode: parsed.languageCode ?? "",
  };
}
