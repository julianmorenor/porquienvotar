export interface Candidate {
    id: string;
    name: string;
    affinity: number; // 0-100
    summary: string; // 2 lines max
    imageUrl: string;
    party?: string;
}

export interface Intent {
    topic: string; // e.g., "Obra pública", "Seguridad"
    sentiment: "Positivo" | "Negativo" | "Neutro" | "Preocupado" | "Enojo" | "Esperanza";
    urgency: "Baja" | "Media" | "Alta";
}

export interface HiddenAnalysis {
    user_location_inferred?: string;
    winning_candidate?: string;
    user_intents: Intent[];
    conversation_summary?: string;
}

export interface LLMResponse {
    client_response: {
        message: string;
        suggested_candidates?: Candidate[];
        is_final_answer: boolean;
    };
    hidden_analysis?: HiddenAnalysis;
}

export interface AnalyticsLog {
    timestamp: Date | string; // Firestore timestamp
    user_location: string;
    winning_candidate: string;
    user_intents: Intent[];
    conversation_length: number;
}
