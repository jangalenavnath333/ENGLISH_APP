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
        model: "google/gemini-2.0-flash-exp:free", // using a reliable free model on openrouter
        messages: [
          {
            role: "system",
            content: "You are Bolu, a friendly and encouraging English teacher for Marathi speaking students. Your goal is to help the user practice spoken English in everyday scenarios (e.g., at a cafe, in an interview). Keep your responses short (1-2 sentences). Correct their mistakes politely, and explain in simple Marathi if needed. Then ask a follow-up question to keep the conversation going."
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
