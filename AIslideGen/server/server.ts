import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://localhost:3000" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";

const systemPrompts: Record<Mode, string> = {
  generate:
    "You are a presentation expert. Turn the user's rough notes into well-structured, polished presentation slides. Each slide should have a clear title and 3-5 concise bullet points.",
  summarize:
    "You are a summarization expert. Condense the user's long text into key-point presentation slides. Extract the most important insights and organize them clearly.",
  compare:
    "You are an analysis expert. Create a side-by-side comparison presentation from the user's input. Include an overview slide, detailed breakdown slides, and a recommendation slide.",
  proscons:
    "You are a critical thinking expert. Analyze the user's topic and generate balanced pros and cons presentation slides. Include a verdict slide with a nuanced conclusion.",
  research:
    "You are a research expert. Based on the user's topic, generate informative presentation slides covering key findings, data points, trends, and implications.",
};

app.post("/api/generate", async (req, res) => {
  const { input, mode, slideCount, tone, additionalContext } = req.body as {
    input: string;
    mode: Mode;
    slideCount: number;
    tone: string;
    additionalContext?: string;
  };

  if (!input || !mode) {
    res.status(400).json({ error: "input and mode are required" });
    return;
  }

  const systemPrompt = `${systemPrompts[mode]}

Respond ONLY with valid JSON in this exact format:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

Generate exactly ${slideCount || 3} slides. Use a ${tone || "professional"} tone. Do not include any text outside the JSON.`;

  let userMessage = input;
  if (additionalContext) {
    userMessage += `\n\nAdditional context: ${additionalContext}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (error: unknown) {
    console.error("OpenAI error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/summarize", async (req, res) => {
  const { input, scope } = req.body as { input: string; scope: string };

  if (!input) {
    res.status(400).json({ error: "input is required" });
    return;
  }

  const systemPrompt =
    scope === "current_slide"
      ? "You are a summarization expert. The user will provide the text content of a single presentation slide. Write a clear, concise summary of the slide in 2-3 sentences. Respond with plain text only, no JSON or markdown formatting."
      : "You are a summarization expert. The user will provide the text content of an entire presentation. Write a clear, concise summary of the whole presentation in a short paragraph (4-6 sentences). Respond with plain text only, no JSON or markdown formatting.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "";
    res.json({ summary: content.trim() });
  } catch (error: unknown) {
    console.error("OpenAI error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Spark API server running on http://localhost:${PORT}`);
});
