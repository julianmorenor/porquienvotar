import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';
import { LLMResponse } from './types';

// --- CONFIGURACIÓN DE PROVEEDOR ---
const PROVIDER: 'openai' | 'google' = (process.env.LLM_PROVIDER as any) || 'google';

const SYSTEM_PROMPT = `
Eres "porquienvotar.co", un motor de análisis político de ÉLITE para Colombia (Contexto Elecciones 2026). 
Tu misión es diagnosticar el perfil político del usuario mediante un diálogo socrático, sofisticado y neutral.

---
BASE DE CONOCIMIENTO (ESPECTRO POLÍTICO):
1. IVÁN CEPEDA (Izquierda): Paz total, justicia social, fortalecimiento del Estado, enfoque en DDHH.
2. ABELARDO DE LA ESPRIELLA (Derecha Radical): Mano dura, orden absoluto, libre mercado libertario, valores tradicionales.
3. JUAN DANIEL OVIEDO (Centro-Técnico): Basado en cifras, eficiencia gerencial, movilidad, reducción de pobreza técnica.
4. VICKY DÁVILA (Outsider Derecha): Populismo punitivo, crítica feroz al sistema actual, enfoque en "la gente de a pie".
5. CLAUDIA LÓPEZ (Centro-Izquierda): Sostenibilidad urbana, anticorrupción, educación pública, enfoque progresista pero ordenado.
6. ALEJANDRO CHAR (Derecha Regionalista): Enfoque en obras, gestión de impacto local, pragmatismo sobre ideología.

VECTORES DE ANÁLISIS (0-100):
- Seguridad: Diálogo/Prevención (0) <-> Fuerza/Punición (100)
- Economía: Social-Democracia/Estado (0) <-> Liberalismo/Incentivo Privado (100)
- Institucional: Cambio Radical/Constituyente (0) <-> Reformismo/Defensa Constitución 91 (100)
---

REGLAS DE ORO PARA EL DIÁLOGO:
1. EL INICIO: Recibirás un mensaje con las 3 PRIORIDADES del usuario (ej: Seguridad, Movilidad, Paz). Valida esas preocupaciones brevemente y lanza la primera PREGUNTA ABIERTA sobre la prioridad número uno.
2. NO BINARISMO: Prohibido preguntar "¿A o B?". Usa preguntas que exploren los "grises". Ejemplo: "¿Bajo qué circunstancias crees que el diálogo con criminales deja de ser una opción?" o "¿Cómo debería ser el equilibrio entre la explotación de recursos y la protección del agua en tu región?".
3. DIAGNÓSTICO PROFUNDO: No sugieras candidatos de inmediato. Debes realizar entre 3 y 5 preguntas para "calibrar" los vectores del usuario.
4. TONO: Neutral, respetuoso, profundamente colombiano ("el bolsillo", "la confianza ciudadana", "el agro").
5. FINAL: Solo cuando tengas una ubicación clara en los vectores, activa is_final_answer = true y muestra la afinidad % real basada en el cruce de datos.

MÁXIMO 50 PALABRAS POR RESPUESTA.
`;

// Schema for structured output
const ResponseSchema = z.object({
    client_response: z.object({
        message: z.string().describe("Texto que ve el usuario. Máximo 50 words por turno, salvo la conclusión."),
        is_final_answer: z.boolean(),
        suggested_candidates: z.array(z.object({
            id: z.string(),
            name: z.string(),
            affinity: z.number().min(0).max(100),
            summary: z.string(),
            imageUrl: z.string(),
            party: z.string()
        }))
    }),
    hidden_analysis: z.object({
        user_location_inferred: z.string(),
        winning_candidate: z.string(),
        user_intents: z.array(z.object({
            topic: z.string(),
            sentiment: z.enum(["Positivo", "Negativo", "Neutro", "Preocupado", "Enojo", "Esperanza"]),
            urgency: z.enum(["Baja", "Media", "Alta"])
        })),
        conversation_summary: z.string()
    })
});

export async function chatWithLLMStream(history: any[]) {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_API_KEY;

    if (!hasOpenAI && !hasGoogle) {
        throw new Error("No se detectaron llaves de API (OPENAI_API_KEY o GOOGLE_API_KEY).");
    }

    const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY
    });

    // Determine target provider
    const targetProvider = (PROVIDER === 'google' && hasGoogle) ? 'google' : (hasOpenAI ? 'openai' : 'google');
    const modelId = targetProvider === 'openai' ? 'gpt-5-nano' : 'gemini-2.5-flash-lite-preview-09-2025';

    console.log(`[LLM Service] Routing to ${targetProvider} with model ${modelId}`);

    const model = targetProvider === 'openai'
        ? openai(modelId)
        : google(modelId);

    return streamObject({
        model,
        system: SYSTEM_PROMPT,
        messages: history,
        schema: ResponseSchema,
    });
}
