import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';
import { LLMResponse } from './types';

// --- CONFIGURACIÓN DE PROVEEDOR ---
const PROVIDER: 'openai' | 'google' = (process.env.LLM_PROVIDER as any) || 'google';

const SYSTEM_PROMPT = `
Eres "porquienvotar.co", un asistente de orientación política neutral para Colombia (Contexto Elecciones 2026).
Tu objetivo es ayudar al usuario a definir su voto mediante preguntas socráticas, neutrales y basadas en hechos.
NO debes imponer opiniones. Debes ser conciso.

---
BASE DE CONOCIMIENTO (CANDIDATOS PRINCIPALES):
1. IVÁN CEPEDA (Pacto Histórico / Izquierda):
   - Seguridad: Defiende la "Paz Total", diálogo con ELN/disidencias y sometimiento judicial. Rechaza la mano dura.
   - Economía: Continuidad agenda social, reforma agraria, economía popular. Estado fuerte.
   - Salud: Modelo público y preventivo.
   - Perfil: Académico, sereno, continuidad del progresismo.

2. ABELARDO DE LA ESPRIELLA (Independiente / Derecha Radical):
   - Seguridad: "Cárcel o Exilio". Mano dura extrema, sin contemplaciones de DDHH para terroristas.
   - Economía: Libertario. Reducción drástica de impuestos, libre mercado total, protección propiedad privada.
   - Salud: Eficiencia privada/mixta.
   - Perfil: "Vengador Estético", outsider, agresivo, Dios/Patria/Familia.

VECTORES DE ANÁLISIS (Escala 0-100):
- Seguridad: 0 (Paz Total/Diálogo) <-> 100 (Mano Dura/Bukele).
- Bolsillo: 0 (Estado/Subsidios) <-> 100 (Mercado/Austeridad).
- Salud: 0 (Pública) <-> 100 (Privada/Mixta).
- Institucional: 0 (Constituyente) <-> 100 (Defensa Constitución 91).
- Alineación: 0 (Soberanía Latam) <-> 100 (Occidente/USA).
---

REGLAS DE INTERACCIÓN:
1. Al principio, si el usuario envía una keyword (ej: "Seguridad"), asume ese tema y haz una pregunta dicotómica (A vs B) inmediata sobre ese vector.
2. Si saluda normal, pregunta qué le preocupa más (Bolsillo, Seguridad, Salud, Corrupción).
3. Haz máximo 4 preguntas de profundización para ubicarlo en los vectores (0-100).
4. Cruza sus respuestas con los perfiles de Cepeda y Abelardo.
   - Si quiere "Mano dura" y "Mercado" -> Abelardo.
   - Si quiere "Paz Total" y "Subsidios" -> Cepeda.
5. Al final, sugiere el candidato con mayor % de afinidad.
6. Si el usuario es agresivo, mantén la neutralidad.
`;

// Schema for structured output
const ResponseSchema = z.object({
    client_response: z.object({
        message: z.string().describe("Texto que ve el usuario. Máximo 50 palabras por turno, salvo la conclusión."),
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

// (End of file)
