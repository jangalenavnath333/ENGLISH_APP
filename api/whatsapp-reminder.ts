/**
 * Vercel Cron API — runs daily at 8 PM IST (14:30 UTC)
 * Sends FREE WhatsApp reminder via CallMeBot to users who haven't opened the app today
 *
 * CallMeBot is FREE — no Meta Business API needed!
 * User must register once at: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *
 * Vercel env vars needed:
 *   CRON_SECRET — any random string for security
 *   FIREBASE_SERVICE_ACCOUNT_KEY — Firebase Admin JSON
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

// Send FREE WhatsApp message via CallMeBot
// User must register their number once at callmebot.com to get apikey
async function sendWhatsAppMessage(
  phoneNumber: string,  // format: +919876543210
  apiKey: string,       // user's CallMeBot API key (stored in Firebase)
  userName: string
) {
  const message = encodeURIComponent(
    `🙏 नमस्ते ${userName}!\n\n` +
    `आज तुम्ही *Bolu English* app उघडलं नाही 📚\n\n` +
    `5 मिनिटे practice करा — streak तुटू देऊ नका! 🔥\n\n` +
    `👉 https://bolu-english.vercel.app`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${message}&apikey=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CallMeBot error: ${response.status}`);
  }
  return true;
}

export default async function handler(req: Request) {
  // Security: Only allow Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = getAdminDb();
    const today = new Date().toISOString().split("T")[0];

    const usersSnap = await db.collection("users").get();
    const results = { sent: 0, skipped: 0, errors: 0 };

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();

      // Skip: no WhatsApp number or no CallMeBot API key
      if (!user.whatsappNumber || !user.callmebotApiKey) {
        results.skipped++;
        continue;
      }

      // Skip: already used the app today
      if (user.lastActiveDate === today) {
        results.skipped++;
        continue;
      }

      // Send free WhatsApp reminder
      try {
        await sendWhatsAppMessage(
          user.whatsappNumber,
          user.callmebotApiKey,
          user.name || "मित्र"
        );
        results.sent++;
      } catch (e: any) {
        console.error(`Failed to send to ${user.whatsappNumber}:`, e.message);
        results.errors++;
      }
    }

    console.log("WhatsApp Reminder Results:", results);
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

