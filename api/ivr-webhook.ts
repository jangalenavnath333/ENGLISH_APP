import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
function getAdminDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export default async function handler(req: Request) {
  // Twilio sends a POST request with URL-encoded form data
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Parse form data from Twilio
    const formData = await req.formData();
    const digits = formData.get('Digits'); // This is the button user pressed (1 or 2)
    const toPhone = formData.get('To'); // The user's phone number

    console.log(`Received IVR response: Phone=${toPhone}, Digits=${digits}`);

    if (digits && toPhone) {
      const db = getAdminDb();
      
      // Find the user with this phone number
      const usersRef = db.collection("users");
      // Note: Twilio phone numbers come with country code, e.g., +919876543210
      // Our DB stores whatsappNumber exactly like this.
      const snapshot = await usersRef.where("whatsappNumber", "==", toPhone).get();

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        
        // Update user's task status based on input
        if (digits === '1') {
          await userDoc.ref.update({
            taskCompletedToday: true,
            lastActiveDate: new Date().toISOString().split("T")[0]
          });
          console.log(`Updated user ${userDoc.id} - Task Completed!`);
        } else if (digits === '2') {
          await userDoc.ref.update({
            taskCompletedToday: false
          });
          console.log(`Updated user ${userDoc.id} - Task Not Completed.`);
        }
      }
    }

    // Twilio requires a TwiML response. We tell it to say Thank You and hang up.
    const twimlResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
          <Say language="hi-IN">Dhanyawad. Aapka response save ho gaya hai.</Say>
      </Response>
    `;

    return new Response(twimlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error: any) {
    console.error("IVR Webhook Error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
