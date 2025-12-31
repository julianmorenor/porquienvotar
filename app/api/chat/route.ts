import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, saveAnalyticsLog } from '@/lib/rate-limit';
import { chatWithLLM } from '@/lib/llm-service';

export async function POST(req: NextRequest) {
    // 1. Rate Limiting
    // In Next.js App Router, finding real IP can be tricky locally vs Vercel/Cloud.
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const { allowed, remaining } = await checkRateLimit(ip);

    if (!allowed) {
        return NextResponse.json(
            { error: "Has alcanzado el límite de consultas por hoy. Vuelve mañana para más análisis." },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { history } = body;

        // 2. Call LLM Service
        const llmResult = await chatWithLLM(history);

        // 3. Analytics & Logging
        // We log specific useful data if provided by the LLM
        if (llmResult.hidden_analysis) {
            const logData = {
                ip_hash: ip, // In real app, hash this for privacy
                ...llmResult.hidden_analysis,
                timestamp: new Date()
            };
            // Fire and forget logging
            saveAnalyticsLog(logData).catch(err => console.error("Logging failed", err));
        }

        // 4. Return Client Response (strip hidden analysis)
        return NextResponse.json(llmResult.client_response);

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
