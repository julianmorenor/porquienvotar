import OpenAI from 'openai';
import { LLMResponse } from './types';

// --- CONFIGURACIÓN DE PROVEEDOR ---
// const PROVIDER: 'openai' | 'google' = 'google'; 
const PROVIDER: 'openai' | 'google' = 'openai';

const openai = new OpenAI(PROVIDER === 'openai' ? {
    apiKey: process.env.OPENAI_API_KEY,
} : {
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

console.log(`[LLM Service] Initialized with PROVIDER: ${PROVIDER}`);

/* 
// Configuración anterior (Auto-switch)
const openai = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || 'mock-key',
    baseURL: process.env.GOOGLE_API_KEY ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
});
*/

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

IMPORTANTE: Eres parte de una API JSON. TU SALIDA DEBE SER SIEMPRE Y ÚNICAMENTE UN OBJETO JSON VÁLIDO.
No incluyas markdown, bloques de código ni texto adicional fuera del JSON.

FORMATO DE RESPUESTA:
{
  "client_response": {
    "message": "Texto que ve el usuario. Usar tono amigable, claro y directo. Máximo 50 palabras por turno, salvo la conclusión.",
    "is_final_answer": boolean, // true solo cuando ya has dado la recomendación de candidatos
    "suggested_candidates": [ // Solo incluir si is_final_answer es true. Máximo 2.
       { "id": "ivan_cepeda", "name": "Iván Cepeda", "affinity": 0-100, "summary": "Coinciden en...", "imageUrl": "/images/cepeda.jpg", "party": "Pacto Histórico" },
       { "id": "abelardo_espriella", "name": "Abelardo De La Espriella", "affinity": 0-100, "summary": "Coinciden en...", "imageUrl": "/images/abelardo.jpg", "party": "Independiente" }
    ]
  },
  "hidden_analysis": {
    "user_location_inferred": "Ciudad/Region o 'Unknown'",
    "winning_candidate": "Nombre del candidato con mayor afinidad (o 'Indeciso')",
    "user_intents": [
       // Extrae preocupaciones o temas mencionados en ESTE turno o acumulados.
       // Ejemplo: { "topic": "Seguridad", "sentiment": "Miedo", "urgency": "Alta" }
    ],
    "conversation_summary": "Resumen técnico brevísimo del estado actual"
  }
}

REGLAS DE INTERACCIÓN:
1. Al principio, si el usuario envía una keyword (ej: "Seguridad"), asume ese tema y haz una pregunta dicotómica (A vs B) inmediata sobre ese vector.
2. Si saluda normal, pregunta qué le preocupa más (Bolsillo, Seguridad, Salud, Corrupción).
3. Haz máximo 4 preguntas de profundización para ubicarlo en los vectores (0-100).
4. Cruza sus respuestas con los perfiles de Cepeda y Abelardo.
   - Si quiere "Mano dura" y "Mercado" -> Abelardo.
   - Si quiere "Paz Total" y "Subsidios" -> Cepeda.
5. Al final, sugiere el candidato con mayor % de afinidad.
6. Si el usuario es agresivo, mantén la neutralidad.

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
        const currentModel = PROVIDER === 'openai' ? "gpt-5-nano-2025-08-07" : "gemini-2.5-flash";
        console.log(`[LLM Service] Calling ${PROVIDER} with model: ${currentModel}`);

        const completion = await openai.chat.completions.create({
            model: currentModel,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history
            ],
            // Note: gpt-5-nano-2025-08-07 has strict parameter requirements
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
