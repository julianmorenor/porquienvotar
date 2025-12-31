import type { App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
// Note: This expects FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// to be available in process.env.
// In a real local dev environment without credentials, we might mock this.

function getFirebaseAdmin(): App {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_PRIVATE_KEY) {
            return initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Handle potential newline issues in private key
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        } else {
            // Fallback for mock/dev if no keys present
            console.warn("No Firebase keys found. Using mock/default app initialization.");
            return initializeApp();
        }
    }
    return getApps()[0];
}

const app = getFirebaseAdmin();
// Be careful calling getFirestore(app) if app is not properly credentialed in Dev.
// We will handle the error gracefully or mock.

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
    if (!process.env.FIREBASE_PRIVATE_KEY) {
        // Bypass rate limit in dev if no keys
        return { allowed: true, remaining: 999 };
    }

    try {
        const db = getFirestore(app);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const docId = `${ip}_${today}`;
        const docRef = db.collection('rate_limits').doc(docId);

        const doc = await docRef.get();
        const LIMIT = 3;

        if (!doc.exists) {
            await docRef.set({ count: 1, created_at: new Date() });
            return { allowed: true, remaining: LIMIT - 1 };
        }

        const data = doc.data();
        const count = data?.count || 0;

        if (count >= LIMIT) {
            return { allowed: false, remaining: 0 };
        }

        await docRef.update({ count: count + 1 });
        return { allowed: true, remaining: LIMIT - (count + 1) };
    } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open if database error, or close if you want to be strict. 
        // For MVP, fail open is safer for avoiding blocks due to config errors.
        return { allowed: true, remaining: 1 };
    }
}

export async function saveAnalyticsLog(data: any) {
    if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.log("Mock saving analytics log:", JSON.stringify(data, null, 2));
        return;
    }
    try {
        const db = getFirestore(app);
        await db.collection('analytics_logs').add({
            ...data,
            timestamp: new Date()
        });
    } catch (e) {
        console.error("Failed to save analytics:", e);
    }
}
