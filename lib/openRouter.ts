const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[]) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free", // Best for free usage, always available
        messages: [
          {
            role: "system",
            content: "You are Bolu, an AI English coach for Marathi speakers practicing a cafe conversation.\nCRITICAL RULES:\n1. CORRECTION FIRST: If the user makes any grammar or vocabulary mistake, you MUST gently correct them first. Say 'Correction: [correct sentence]' and briefly explain the mistake in Marathi in parenthesis.\n2. ALWAYS speak primarily in simple ENGLISH. Never reply only in Marathi. Put all Marathi translations inside parenthesis: (मराठीत अर्थ).\n3. After correcting them (or if they were correct), continue the roleplay naturally by asking a short follow-up question.\n4. Keep your entire response short (2-3 sentences)."
          },
          ...messages
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter API Error Data:", data.error);
      throw new Error(data.error.message || "Unknown API Error");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("OpenRouter API Error:", error.message);
    throw new Error(error.message || "Failed to connect to AI.");
  }
}
