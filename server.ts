import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '64kb' })); // Mitiga payloads gigantes que puedan tumbar el backend

  // Limite IPs rudimentario en memoria (para no añadir Redis ni deps complejas)
  const ipStore = new Map<string, { count: number, resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, stats] of ipStore.entries()) {
      if (stats.resetAt < now) ipStore.delete(ip);
    }
  }, 60000);

  app.use("/api", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let stats = ipStore.get(ip);
    if (!stats || stats.resetAt < now) {
      stats = { count: 0, resetAt: now + 60000 };
    }
    stats.count++;
    ipStore.set(ip, stats);
    if (stats.count > 60) return res.status(429).json({ error: "Too many requests" });
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/moderate", async (req, res) => {
    try {
      const { text } = req.body;
      if (typeof text !== 'string') return res.status(400).json({ passed: false, reason: "Payload inválido" });
      if (!text || text.trim() === "") return res.json({ passed: true });

      const safeText = text.slice(0, 3000); // 3000 chars limit (prevents abuse)

      if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY for moderation. Failing closed (PENDING).");
        return res.json({ passed: false, reason: "Pendiente de revisión manual (Sistema AI no disponible)" });
      }

      const prompt = `Analiza el siguiente texto y determina si infringe alguna de las normas de la comunidad:
1. Insultos malintencionados o acoso
2. Contenido sobre drogas ilegales
3. Contenido sobre armas
4. Contenido sexual explícito

Ten en cuenta que en España, ciertas groserías se usan coloquialmente de forma amigable (ej. "joder").
Si el tono es puramente coloquial e inofensivo, apruébalo. Si es un insulto directo o viola una norma, recházalo identificando la norma infringida.

Responde ÚNICAMENTE con un JSON válido usando esta estructura exacta (no uses Markdown en tu respuesta):
{"passed": true, "reason": ""} o {"passed": false, "reason": "Motivo corto"}

Texto a revisar:
${JSON.stringify(safeText)}`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            temperature: 0,
            responseMimeType: "application/json"
        }
      });

      const resultText = response.text?.trim() || "";
      const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let passed = false;
      let reason = "Error procesando validación";
      try {
        const json = JSON.parse(jsonStr);
        passed = json.passed !== false;
        reason = json.reason || "";
      } catch (err) {
        console.warn("Could not parse moderation response", resultText);
      }
      
      res.json({ passed, reason });
    } catch (error: any) {
      console.error("Moderation AI error:", error.message || error);
      res.json({ passed: false, reason: "Error de moderación AI (bloqueado por seguridad)" });
    }
  });

  app.post("/api/batch-check-match", async (req, res) => {
    try {
      const { otherItems, userItems } = req.body;
      
      if (!Array.isArray(otherItems) || !Array.isArray(userItems)) {
         return res.status(400).json({ matches: {}, aiFailed: true, error: "Invalid payload format" });
      }
      
      if (otherItems.length > 200 || userItems.length > 50) {
         return res.status(400).json({ error: "Payload too large", matches: {}, aiFailed: true });
      }

      if (!otherItems || !otherItems.length || !userItems || !userItems.length) {
        return res.json({ matches: {} });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY configured, falling back to empty matches.");
        return res.json({ matches: {}, aiFailed: true });
      }

      const safeString = (val: any, max: number) => typeof val === 'string' ? val.substring(0, max) : '';

      const safeUserItems = userItems.map((i: any) => ({
         id: safeString(i.id, 50),
         title: safeString(i.title, 120),
         category: safeString(i.category, 80),
         description: safeString(i.description, 500)
      })).filter(i => i.id);

      const safeOtherItems = otherItems.map((i: any) => ({
         id: safeString(i.id, 50),
         wishedItem: safeString(i.wishedItem, 300)
      })).filter(i => i.id);

      if (!safeUserItems.length || !safeOtherItems.length) {
          return res.json({ matches: {} });
      }

      const prompt = `Actúa como un motor de matching inteligente para una aplicación de trueque de segunda mano.
Queremos saber qué usuarios de "Otros Artículos" estarían interesados en los artículos ofrecidos por el Usuario Actual, basándonos estricta e inteligentemente en su campo "wishedItem" (lo que están buscando a cambio).

Aquí están los artículos que OFRECE el Usuario Actual:
${JSON.stringify(safeUserItems)}

Aquí están los artículos de otros usuarios, listando QUÉ BUSCAN a cambio:
${JSON.stringify(safeOtherItems)}

Instrucciones: Revisa cada uno de los elementos buscados ("wishedItem") y determina si la descripción y características del "wishedItem" encajan SEMÁNTICA y LÓGICAMENTE con alguno de los artículos ofrecidos.
REGLAS ESTRICTAS:
1. Validar contexto: Si buscan 'sofá grande', un 'sofá pequeño' NO es match.
2. Comprobación cruzada de categorías: Una lámpara nunca es match para un reloj, incluso si ambos tienen la palabra "vintage". Comprende de qué objeto se trata.
3. El resultado debe ser un JSON donde la llave es el ID del "otherItem", y el valor es el ID del artículo que se OFRECE que mejor hace match.
Si no hay match, o hay conflicto directo de significado, simplemente no lo incluyas en el JSON final. NO DEBEN OCURRIR FALSOS POSITIVOS.

Ejemplo de formato EXACTO del output JSON esperado sin formato extra:
{
  "item-other-id-123": "item-user-id-abc",
  "item-other-id-456": "item-user-id-def"
}
Devuelve ÚNICAMENTE código JSON.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
           responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const rawMatchDict = JSON.parse(text);
      const matchDict: Record<string, string> = {};
      const validOtherIds = new Set(safeOtherItems.map(i => i.id));
      const validUserIds = new Set(safeUserItems.map(i => i.id));

      for (const [otherId, userId] of Object.entries(rawMatchDict)) {
         if (validOtherIds.has(otherId) && typeof userId === 'string' && validUserIds.has(userId)) {
             matchDict[otherId] = userId;
         }
      }

      res.json({ matches: matchDict });
    } catch (e: any) {
      const errorString = (e.message || e.toString() || "").toLowerCase();
      if (errorString.includes('api key not valid') || errorString.includes('api_key_invalid')) {
         console.warn("AI Matching fallback: Invalid or missing API key.");
      } else {
         console.error("AI Matching error:", e.message || e);
      }
      res.json({ matches: {}, aiFailed: true }); 
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
