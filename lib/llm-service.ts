import OpenAI from 'openai';
import { LLMResponse } from './types';

const openai = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || 'mock-key',
    baseURL: process.env.GOOGLE_API_KEY ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
});

const SYSTEM_PROMPT = `
Eres "porquienvotar.co", un asistente de orientación política neutral para Colombia.
Tu objetivo es ayudar al usuario a definir su voto mediante preguntas socráticas, neutrales y basadas en hechos.
NO debes imponer opiniones. Debes ser conciso.

IMPORTANTE: Eres parte de una API JSON. TU SALIDA DEBE SER SIEMPRE Y ÚNICAMENTE UN OBJETO JSON VÁLIDO.
No incluyas markdown, bloques de código ni texto adicional fuera del JSON.

FORMATO DE RESPUESTA:
{
  "client_response": {
    "message": "Texto que ve el usuario. Usar tono amigable, claro y directo. Máximo 50 palabras por turno, salvo la conclusión.",
    "is_final_answer": boolean, // true solo cuando ya has dado la recomendación de candidatos
    "suggested_candidates": [ // Solo incluir si is_final_answer es true. Máximo 3.
       { "id": "cand_1", "name": "Nombre", "affinity": 0-100, "summary": "Razón breve...", "imageUrl": "placeholder/url", "party": "Partido" }
    ]
  },
  "hidden_analysis": {
    "user_location_inferred": "Ciudad/Region o 'Unknown'",
    "winning_candidate": "Nombre del candidato con mayor afinidad (o 'Indeciso')",
    "user_intents": [
       // Extrae preocupaciones o temas mencionados en ESTE turno o acumulados.
       // Ejemplo: { "topic": "Seguridad", "sentiment": "Preocupado", "urgency": "Alta" }
    ],
    "conversation_summary": "Resumen técnico brevísimo del estado actual"
  }
}

REGLAS DE INTERACCIÓN:
1. Al principio, saluda y pregunta sobre qué tema le preocupa más (Economía, Seguridad, Salud, etc.).
2. Haz 3-4 preguntas de profundización para entender su postura.
3. Cruza sus respuestas con el panorama político colombiano REAL (Candidatos 2022-2026 o hipotéticos actuales).
4. Al final, sugiere 3 candidatos con % de afinidad.
5. Si el usuario es agresivo o pide cosas ilegales, responde neutralmente desviando el tema.

Recuerda: SALIDA JSON PURO.
`;

export async function chatWithLLM(history: any[]): Promise<LLMResponse> {
    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
        // Mock response for dev without keys
        return {
            client_response: {
                message: "Modo de desarrollo: No se detectó API KEY. Por favor configura OPENAI_API_KEY o GOOGLE_API_KEY.",
                is_final_answer: false
            },
            hidden_analysis: {
                user_intents: [],
                user_location_inferred: "Unknown",
                winning_candidate: "None"
            }
        };
    }

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.GOOGLE_API_KEY ? "gemini-2.5-flash" : "gpt-3.5-turbo", // Use cheaper models for MVP
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response from LLM");

        // Robust parsing: strip markdown blocks if they exist
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith("```")) {
            cleanedContent = cleanedContent.replace(/^```[a-z]*\n/i, "").replace(/\n```$/m, "").trim();
        }

        try {
            const parsed = JSON.parse(cleanedContent) as LLMResponse;
            return parsed;
        } catch (parseError) {
            throw new Error("Invalid JSON response from AI");
        }

    } catch (error) {
        console.error("LLM Service Error:", error instanceof Error ? error.message : "Undefined error");
        // Fallback error structure
        return {
            client_response: {
                message: "Estamos trabajando por Colombia, intenta más tarde.",
                is_final_answer: false
            },
            hidden_analysis: {
                user_intents: [],
                user_location_inferred: "Unknown",
                winning_candidate: "Error"
            }
        };
    }
}
