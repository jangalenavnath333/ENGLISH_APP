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
            content: "You are Bolu, an AI English coach for Marathi speakers. CRITICAL RULE: You MUST reply primarily in simple ENGLISH. NEVER reply only in Marathi. If you want to explain something in Marathi, put it inside parenthesis like this: (मराठीत अर्थ). Keep your responses to 1-2 short sentences. Continue the cafe conversation by asking the user what they want."
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
