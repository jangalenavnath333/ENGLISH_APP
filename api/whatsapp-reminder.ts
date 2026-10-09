/**
 * Vercel Cron API — runs daily at 8 PM IST (14:30 UTC)
 * Sends WhatsApp reminder to users who haven't opened the app today
 *
 * Vercel cron config is in vercel.json
 * Env vars needed: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, FIREBASE_SERVICE_ACCOUNT_KEY
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side)
function getAdminDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

// Send WhatsApp message via Meta Business API
async function sendWhatsAppMessage(phoneNumber: string, userName: string) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp API credentials missing");
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: `🙏 नमस्ते ${userName}!\n\nआज तुम्ही *Bolu English* ॲप उघडलं नाही. 📚\n\n5 मिनिटे practice करा — streak तुटू देऊ नका! 🔥\n\n👉 https://bolu-english.vercel.app\n\nशुभेच्छा! 💪`,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
  }

  return response.json();
}

export default async function handler(req: Request) {
  // Security: Only allow Vercel Cron or requests with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = getAdminDb();
    const today = new Date().toISOString().split("T")[0];

    // Get all users who have a WhatsApp number but haven't been active today
    const usersSnap = await db.collection("users").get();

    const results = { sent: 0, skipped: 0, errors: 0 };

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();

      // Skip: no WhatsApp number or guest users
      if (!user.whatsappNumber || user.whatsappNumber === "") {
        results.skipped++;
        continue;
      }

      // Skip: already used the app today
      if (user.lastActiveDate === today) {
        results.skipped++;
        continue;
      }

      // Send WhatsApp reminder
      try {
        await sendWhatsAppMessage(user.whatsappNumber, user.name || "मित्र");
        results.sent++;
      } catch (e: any) {
        console.error(`Failed to send to ${user.whatsappNumber}:`, e.message);
        results.errors++;
      }
    }

    console.log(`WhatsApp Reminder Results:`, results);
    return new Response(
      JSON.stringify({ success: true, date: today, ...results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
