import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, saveAnalyticsLog } from '@/lib/rate-limit';
import { chatWithLLMStream } from '@/lib/llm-service';

export async function POST(req: NextRequest) {
    console.log("[API] Incoming request");
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    try {
        const { allowed } = await checkRateLimit(ip);
        console.log("[API] Rate limit check:", allowed);

        if (!allowed) {
            return NextResponse.json(
                { error: "Has alcanzado el límite de consultas por hoy." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const history = body.messages || body.history;
        console.log("[API] History size:", history?.length);

        // Call streaming service
        console.log("[API] Calling LLM Stream...");
        const result = await chatWithLLMStream(history);
        console.log("[API] Stream obtained");

        // Handle analytics logging when the stream finishes
        result.object.then((object) => {
            console.log("[API] Stream finished, object captured");
            if (object?.hidden_analysis) {
                const logData = {
                    ip_hash: ip,
                    ...object.hidden_analysis,
                    timestamp: new Date()
                };
                saveAnalyticsLog(logData).catch(err => console.error("Logging failed", err));
            }
        }).catch(err => console.error("[API] Stream object error:", err));

        // Return the stream response
        console.log("[API] Returning stream response");
        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("[API] Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}



