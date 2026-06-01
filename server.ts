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

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/batch-check-match", async (req, res) => {
    try {
      const { otherItems, userItems } = req.body;

      if (!otherItems || !otherItems.length || !userItems || !userItems.length) {
        return res.json({ matches: {} });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY configured, falling back to empty matches.");
        return res.json({ matches: {}, aiFailed: true });
      }

      const prompt = `Actúa como un motor de matching inteligente para una aplicación de trueque de segunda mano.
Queremos saber qué usuarios de "Otros Artículos" estarían interesados en los artículos ofrecidos por el Usuario Actual, basándonos estricta e inteligentemente en su campo "wishedItem" (lo que están buscando a cambio).

Aquí están los artículos que OFRECE el Usuario Actual:
${JSON.stringify(userItems.map((i: any) => ({ id: i.id, title: i.title, category: i.category, description: i.description })))}

Aquí están los artículos de otros usuarios, listando QUÉ BUSCAN a cambio:
${JSON.stringify(otherItems.map((i: any) => ({ id: i.id, wishedItem: i.wishedItem })))}

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
      const matchDict = JSON.parse(text);
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
