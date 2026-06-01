export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export const checkModerationWithAI = async (text: string): Promise<ModerationResult> => {
    if (!text || text.trim() === "") return { passed: true };

    try {
        const response = await fetch('/api/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
           return { passed: false, reason: "Error de red en moderación." };
        }

        const json = await response.json();
        return {
            passed: Boolean(json.passed),
            reason: json.reason || ""
        };
    } catch (error) {
        console.error("Moderation request failed:", error);
        return { passed: false, reason: "Pendiente de revisión manual (Fallo del sistema de moderación)" }; 
    }
};
