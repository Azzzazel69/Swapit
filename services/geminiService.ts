import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export const checkModerationWithAI = async (text: string): Promise<ModerationResult> => {
    if (!text || text.trim() === "") return { passed: true };

    try {
        const prompt = `Analiza el siguiente texto y determina si infringe alguna de las normas de la comunidad:
1. Insultos malintencionados o acoso
2. Contenido sobre drogas ilegales
3. Contenido sobre armas
4. Contenido sexual explícito

Ten en cuenta que en España, palabras como "coño", "joder", "cabrón", "mierda" se usan a menudo de forma coloquial, amigable o expresiva sin intención de ofender (ej: "qué bueno, joder").
Si el tono es puramente coloquial, amistoso o inofensivo, apruébalo. Si es un insulto directo, acoso, o contenido ilegal, recházalo identificando la norma infringida.

Responde ÚNICAMENTE con un JSON válido usando esta estructura exacta (no uses Markdown en tu respuesta):
{"passed": true, "reason": ""} o {"passed": false, "reason": "Motivo corto resaltando la norma infringida"}

Texto: "${text}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0,
            }
        });

        const resultText = response.text?.trim() || "";
        const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(jsonStr);
        return {
            passed: json.passed !== false,
            reason: json.reason || ""
        };
    } catch (error) {
        console.error("Gemini API error in moderation:", error);
        return { passed: true }; 
    }
};
