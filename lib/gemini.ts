const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Tried in order; next model is used if one is overloaded (503) or rate limited (429)
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.0-flash"];
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";

export interface TalkLanguage {
  name: string;
  speech: string; // BCP-47 code for expo-speech fallback
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

export interface Tutor {
  id: "madam" | "sir";
  label: string; // shown in UI
  title: string; // used in prompt
  emoji: string;
  voice: string; // Gemini prebuilt voice name
}

export const TUTORS: Tutor[] = [
  { id: "madam", label: "Madam", title: "a warm, patient female teacher (Madam)", emoji: "👩‍🏫", voice: "Kore" },
  { id: "sir", label: "Sir", title: "a friendly, encouraging male teacher (Sir)", emoji: "👨‍🏫", voice: "Charon" },
];

export interface Topic {
  id: string;
  emoji: string;
  label: string; // Marathi label for UI
  prompt: string; // English description for the AI
}

export const TOPICS: Topic[] = [
  { id: "intro", emoji: "👋", label: "ओळख करून द्या", prompt: "introducing yourself (name, job, city)" },
  { id: "cafe", emoji: "☕", label: "कॅफेमध्ये ऑर्डर", prompt: "ordering food and drinks at a cafe" },
  { id: "travel", emoji: "✈️", label: "प्रवास", prompt: "travel: asking for directions, tickets and hotels" },
  { id: "daily", emoji: "🌅", label: "रोजची दिनचर्या", prompt: "talking about your daily routine" },
  { id: "shop", emoji: "🛍️", label: "खरेदी", prompt: "shopping and bargaining at a market" },
  { id: "free", emoji: "💬", label: "मोकळ्या गप्पा", prompt: "free casual chat about anything the user likes" },
  { id: "doctor", emoji: "🩺", label: "डॉक्टरकडे", prompt: "visiting a doctor and describing health problems" },
  { id: "phone", emoji: "📞", label: "फोनवर बोलणं", prompt: "talking on the phone: calling, leaving messages, asking someone to repeat" },
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
  start?: boolean; // tutor opens the conversation
}

export interface TalkOptions {
  tutor: Tutor;
  topic?: Topic;
}

// POST to Gemini, rotating through models on temporary overload / rate limit
// A slow request (> timeoutMs) is aborted and the next model is tried.
async function geminiRequest(models: string[], body: string, timeoutMs = 10000): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is missing in .env");
  }
  let data: any;
  for (let attempt = 0; attempt < models.length * 2; attempt++) {
    const model = models[attempt % models.length];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body,
          signal: controller.signal,
        }
      );
      data = await response.json();
      const retryable = response.status === 503 || response.status === 429;
      if (!data.error || !retryable) break;
    } catch (e: any) {
      if (e?.name !== "AbortError") throw e;
      data = { error: { message: "Server slow, please try again" } };
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }
  return data;
}

export async function sendTalkTurn(
  language: string,
  history: TalkHistoryItem[],
  input: TalkInput,
  opts: TalkOptions
): Promise<TalkTurn> {
  const isAuto = language === AUTO_LANGUAGE;
  const target = isAuto ? "the same language the user's latest message is in" : language;

  const system =
    `You are Bolu, ${opts.tutor.title}, a conversation tutor for a Marathi speaker.\n` +
    (isAuto
      ? `The user may speak or write in ANY language (English, Japanese, Hindi, Marathi, ...). Detect the language of their latest message and use it as the target language. If this is the very start of the chat, use English.\n`
      : `The user practices ${language} by speaking or writing.\n`) +
    (opts.topic ? `Conversation topic: ${opts.topic.prompt}.\n` : "") +
    `If audio is given, first transcribe exactly what they said.\n` +
    `Rules:\n` +
    `1. Check the user's sentence for grammar, vocabulary or word-order mistakes.\n` +
    `2. If there is a mistake: set hasMistake=true, put the corrected sentence in "corrected" (in ${target}), and explain the mistake simply in MARATHI in "explanation".\n` +
    `3. If correct: hasMistake=false, corrected="" and explanation="".\n` +
    `4. Then continue the conversation naturally in ${target} with a short, spoken-style reply (1-2 simple sentences, no emojis, no markdown) and a short follow-up question in "reply".\n` +
    `5. "replyTranslation" is the Marathi meaning of "reply" (empty string if reply is already Marathi).\n` +
    `6. "languageCode" is the BCP-47 code (e.g. en-US, ja-JP, hi-IN, mr-IN) of the language used in "reply".\n` +
    `Reply ONLY as JSON with keys: transcript, hasMistake, corrected, explanation, reply, replyTranslation, languageCode.`;

  const historyText = history
    .slice(-10)
    .map((h) => `${h.role === "user" ? "User" : "Tutor"}: ${h.text}`)
    .join("\n");

  const parts: any[] = [];
  if (historyText) parts.push({ text: `Conversation so far:\n${historyText}\n` });
  if (input.start) {
    parts.push({
      text:
        `Start the conversation now: greet the user warmly as their tutor and ask the first simple question` +
        (opts.topic ? ` about: ${opts.topic.prompt}` : "") +
        `. There is no user mistake yet (hasMistake=false, transcript="").`,
    });
  } else if (input.audioBase64) {
    parts.push({ text: "The user's new message is this audio:" });
    parts.push({
      inline_data: { mime_type: input.audioMimeType || "audio/wav", data: input.audioBase64 },
    });
  } else {
    parts.push({ text: `The user's new message: ${input.text ?? ""}` });
  }

  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" },
    })
  );

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

export async function sendCallTurn(
  language: string,
  history: TalkHistoryItem[],
  input: TalkInput,
  opts: TalkOptions
): Promise<{ reply: string; languageCode: string }> {
  const isAuto = language === AUTO_LANGUAGE;
  const target = isAuto ? "the same language the user's latest message is in" : language;

  const system =
    `You are Bolu, ${opts.tutor.title}, a friendly conversation tutor for a Marathi speaker.\n` +
    `The user is on a live voice call practicing ${target}. ` +
    `Reply in 1 or 2 short sentences. Be extremely fast and conversational. Ask a question back to keep it going. Do not output JSON.`;

  const historyText = history
    .slice(-10)
    .map((h) => `${h.role === "user" ? "User" : "Tutor"}: ${h.text}`)
    .join("\n");

  const parts: any[] = [];
  if (historyText) parts.push({ text: `Conversation so far:\n${historyText}\n` });
  
  if (input.start) {
    parts.push({ text: `Say a very short, warm greeting to start the call.` });
  } else if (input.audioBase64) {
    parts.push({
      inline_data: { mime_type: input.audioMimeType || "audio/wav", data: input.audioBase64 },
    });
  } else {
    parts.push({ text: `User: ${input.text ?? ""}` });
  }

  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "text/plain" },
    })
  );

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");

  return {
    reply: raw.trim(),
    languageCode: "en-US",
  };
}

export interface WritingFeedback {
  score: number; // 1-10
  corrected: string;
  mistakes: { wrong: string; right: string; why: string }[]; // why is in Marathi
  tip: string; // Marathi
}

// AI checks an English writing task and explains every mistake in Marathi
export async function checkWriting(task: string, text: string): Promise<WritingFeedback> {
  const system =
    `You are Bolu, an English writing teacher for a Marathi speaker who is a beginner.\n` +
    `Task given to the student: ${task}\n` +
    `Check the student's English text. Return ONLY JSON with keys:\n` +
    `score (integer 1-10), corrected (the full corrected text in simple natural English), ` +
    `mistakes (array of {wrong, right, why}; "why" is a short simple explanation in MARATHI; empty array if no mistakes), ` +
    `tip (one encouraging tip in MARATHI).`;
  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { responseMimeType: "application/json" },
    })
  );
  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");
  const p = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    score: Number(p.score) || 0,
    corrected: p.corrected ?? "",
    mistakes: Array.isArray(p.mistakes) ? p.mistakes : [],
    tip: p.tip ?? "",
  };
}

export interface SentenceFeedback {
  transcript: string; // what the student said/wrote
  isCorrect: boolean;
  score: number; // 1-10
  corrected: string; // best natural English version
  explanation: string; // Marathi
  pronunciation: string; // Marathi tip on pronunciation ("" if typed)
}

// Student translates a Marathi sentence into English (typed or spoken); AI checks it.
export async function checkSentence(
  marathi: string,
  input: { text?: string; audioBase64?: string; audioMimeType?: string }
): Promise<SentenceFeedback> {
  const system =
    `You are Bolu, an English teacher for a Marathi-speaking beginner.\n` +
    `The student must say this Marathi sentence in English: "${marathi}"\n` +
    `If audio is given, first transcribe exactly what the student said (in English). ` +
    `Judge whether the English conveys the same meaning with correct grammar.\n` +
    `Return ONLY JSON with keys: transcript, isCorrect (boolean), score (integer 1-10), ` +
    `corrected (the best simple natural English sentence for the Marathi meaning), ` +
    `explanation (short, simple, in MARATHI: what was wrong, or praise if correct), ` +
    `pronunciation (ONLY if audio was given: one short MARATHI tip on any mispronounced word, written with its Marathi-script pronunciation; otherwise empty string).`;
  const parts: any[] = input.audioBase64
    ? [{ inline_data: { mime_type: input.audioMimeType || "audio/wav", data: input.audioBase64 } }]
    : [{ text: input.text ?? "" }];
  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" },
    })
  );
  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");
  const p = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    transcript: p.transcript ?? input.text ?? "",
    isCorrect: !!p.isCorrect,
    score: Number(p.score) || 0,
    corrected: p.corrected ?? "",
    explanation: p.explanation ?? "",
    pronunciation: p.pronunciation ?? "",
  };
}

export interface WordInfo {
  word: string;
  partOfSpeech: string;
  meaning: string; // Marathi
  example: string;
  exampleMr: string;
  forms: string; // e.g. "go - went - gone" for verbs, "" otherwise
}

// Marathi meaning, example and verb forms of any English word or phrase
export async function lookupWord(word: string): Promise<WordInfo> {
  const system =
    `You are an English-Marathi dictionary for a beginner. Return ONLY JSON with keys: ` +
    `word, partOfSpeech (in English), meaning (Marathi), example (a simple English sentence), ` +
    `exampleMr (Marathi translation of the example), forms ("V1 - V2 - V3" if it is a verb, else "").`;
  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: word }] }],
      generationConfig: { responseMimeType: "application/json" },
    })
  );
  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");
  const p = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    word: p.word ?? word,
    partOfSpeech: p.partOfSpeech ?? "",
    meaning: p.meaning ?? "",
    example: p.example ?? "",
    exampleMr: p.exampleMr ?? "",
    forms: p.forms ?? "",
  };
}

export interface ProjectScript {
  title: string;
  sections: { title: string; titleMr: string; sentences: { en: string; mr: string }[] }[];
  questions: { q: string; qMr: string; a: string; aMr: string }[];
}

// Turns a project description (Marathi or English) into a simple English presentation script + likely questions
export async function generateProjectScript(description: string): Promise<ProjectScript> {
  const system =
    `You are an English coach for a Marathi-speaking beginner who must explain their project in English in 3-5 minutes.\n` +
    `Write a presentation script using ONLY simple, common words and SHORT sentences (max 12 words each). Never invent facts: use only what the student wrote.\n` +
    `Return ONLY JSON: {"title": string, "sections": [{"title": string, "titleMr": string, "sentences": [{"en": string, "mr": string}]}], ` +
    `"questions": [{"q": string, "qMr": string, "a": string, "aMr": string}]}.\n` +
    `Sections in order: Introduction, The Problem, My Solution, Main Features, Technology Used, My Role, Conclusion (skip a section if the student gave no information for it). ` +
    `Each section has 2-4 sentences. "mr" is the natural Marathi meaning of each sentence. ` +
    `Give 6 questions a teacher or interviewer would likely ask about this project, each with a short simple answer (1-2 sentences) and Marathi translations.`;
  const data = await geminiRequest(
    GEMINI_MODELS,
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: description }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    30000
  );
  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");
  const p = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    title: p.title ?? "My Project",
    sections: Array.isArray(p.sections) ? p.sections : [],
    questions: Array.isArray(p.questions) ? p.questions : [],
  };
}

// Natural human-like voice. Returns base64 WAV (24 kHz, mono, 16-bit).
export async function synthesizeSpeech(text: string, voiceName: string): Promise<string> {
  const data = await geminiRequest(
    [GEMINI_TTS_MODEL],
    JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
    20000
  );
  const audio: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audio) throw new Error("No audio returned");
  return audio;
}
