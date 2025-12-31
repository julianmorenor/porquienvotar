import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import DashboardClient from './dashboard-client';
import { AnalyticsLog } from '@/lib/types';

// Reuse Firebase init logic ideally, but for now duplicate to ensure server component isolation or imports work cleanly
function getFirebaseAdmin() {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_PRIVATE_KEY) {
            return initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        }
    }
    return getApps()[0];
}

async function getAnalyticsData(): Promise<AnalyticsLog[]> {
    // 1. Try fetching from Firestore
    if (process.env.FIREBASE_PRIVATE_KEY && getApps().length > 0) {
        try {
            const db = getFirestore();
            const snapshot = await db.collection('analytics_logs')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    // Convert Firestore timestamp to JS Date/String
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
                } as AnalyticsLog;
            });
        } catch (e) {
            console.error("Firestore Fetch Error", e);
        }
    }

    // 2. Return MOCK DATA if no keys or error
    return [
        {
            timestamp: new Date().toISOString(),
            user_location: "Bogotá, COL",
            winning_candidate: "Candidato A",
            conversation_length: 5,
            user_intents: [
                { topic: "Seguridad", sentiment: "Preocupado", urgency: "Alta" },
                { topic: "Economía", sentiment: "Neutro", urgency: "Media" }
            ]
        },
        {
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            user_location: "Medellín, COL",
            winning_candidate: "Candidato B",
            conversation_length: 8,
            user_intents: [
                { topic: "Salud", sentiment: "Enojo", urgency: "Alta" }
            ]
        },
        {
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            user_location: "Cali, COL",
            winning_candidate: "Candidato A",
            conversation_length: 6,
            user_intents: [
                { topic: "Seguridad", sentiment: "Esperanza", urgency: "Baja" }
            ]
        },
        {
            timestamp: new Date(Date.now() - 10000000).toISOString(),
            user_location: "Barranquilla, COL",
            winning_candidate: "Candidato C",
            conversation_length: 4,
            user_intents: [
                { topic: "Empleo", sentiment: "Preocupado", urgency: "Alta" }
            ]
        }
    ];
}

export default async function DashboardPage() {
    // Basic Auth Check (Simulated)
    // In prod, check cookies or headers.

    const logs = await getAnalyticsData();

    // Process data for charts
    const totalConversations = logs.length;

    // Top Concerns Logic
    const concernCounts: Record<string, number> = {};
    logs.forEach(log => {
        log.user_intents?.forEach(intent => {
            concernCounts[intent.topic] = (concernCounts[intent.topic] || 0) + 1;
        });
    });
    const sortedConcerns = Object.entries(concernCounts).sort((a, b) => b[1] - a[1]);
    const topConcern = sortedConcerns[0]?.[0] || 'N/A';

    // Top Candidate Logic
    const candCounts: Record<string, number> = {};
    logs.forEach(log => {
        if (log.winning_candidate) {
            candCounts[log.winning_candidate] = (candCounts[log.winning_candidate] || 0) + 1;
        }
    });
    const sortedCandidates = Object.entries(candCounts).sort((a, b) => b[1] - a[1]);
    const topCandidate = sortedCandidates[0]?.[0] || 'N/A';

    // Chart Data Structuring
    const chartData = {
        concerns: sortedConcerns.slice(0, 5).map(([name, value]) => ({ name, value })),
        candidates: sortedCandidates.map(([name, value]) => ({ name, value }))
    };

    const stats = {
        totalConversations,
        topConcern,
        topCandidate
    };

    return <DashboardClient data={logs} stats={stats} chartData={chartData} />;
}
