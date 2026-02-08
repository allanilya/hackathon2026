import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import { TavilyClient } from "tavily";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://localhost:3000" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tavilyClient = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });

type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";

const systemPrompts: Record<Mode, string> = {
  generate:
    "You are a presentation expert. Create slides with specific, valuable information - not generic statements. Each slide must contain concrete facts, actionable insights, or specific examples. Use clear titles and 3-5 concise, informative bullet points. Avoid meta-commentary or process descriptions.",
  summarize:
    "You are a summarization expert. Extract the most important facts, insights, and takeaways from the content. Focus on specific information, key findings, and concrete details. Avoid generic summaries - be specific and informative.",
  compare:
    "You are an analysis expert. Create detailed comparisons with specific differences, concrete examples, and quantifiable metrics where possible. Include factual distinctions, real-world implications, and data-driven insights. Avoid vague comparisons.",
  proscons:
    "You are a critical thinking expert. Provide specific, concrete pros and cons with real examples and evidence. Include factual benefits and drawbacks, not generic observations. Support claims with specifics.",
  research:
    "You are a research expert. Extract ONLY information that appears in the provided research sources - do NOT use general knowledge. Focus on CURRENT, SPECIFIC events: exact dates (e.g., 'On Feb 5, 2026...'), recent developments, specific people/places, breaking news, statistics with numbers, and concrete events from the sources. You may use shorthand citations like 'According to [source name]...' or 'Reuters reports...' in bullet points. Prioritize the most recent and newsworthy information. Avoid generic background - focus on what's happening NOW based on the sources.",
};

app.post("/api/generate", async (req, res) => {
  const { input, mode, slideCount, tone, additionalContext, conversationHistory } = req.body as {
    input: string;
    mode: Mode;
    slideCount: number;
    tone: string;
    additionalContext?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!input || !mode) {
    res.status(400).json({ error: "input and mode are required" });
    return;
  }

  const hasResearchSources = additionalContext?.includes("RESEARCH SOURCES:");

  console.log("Generate request - Mode:", mode, "Has research sources:", hasResearchSources);

  let jsonFormat = `{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }`;
  let citationInstructions = "";

  if (hasResearchSources && mode === "research") {
    console.log("Including sources in JSON format");
    jsonFormat = `{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"], "sources": ["https://example.com/article", "https://news.site.com/story"] }] }`;
    citationInstructions = "\n\nIMPORTANT: For each slide that uses information from the research sources, include a 'sources' array with the FULL URLs of the sources used (e.g., ['https://www.nytimes.com/article', 'https://www.reuters.com/news']). Include complete URLs with https:// protocol. If a slide doesn't use any research sources, omit the 'sources' field or set it to an empty array.";
  }

  const systemPrompt = `${systemPrompts[mode]}${citationInstructions}

Respond ONLY with valid JSON in this exact format:
${jsonFormat}

Generate exactly ${slideCount || 3} slides. Use a ${tone || "professional"} tone. Do not include any text outside the JSON.`;

  let userMessage = input;
  if (additionalContext) {
    userMessage += `\n\nAdditional context: ${additionalContext}`;
  }

  // Build messages array with conversation history for context
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add recent conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }

  // Add the current user message
  messages.push({ role: "user", content: userMessage });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
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
    console.log("Generated slides:", JSON.stringify(parsed, null, 2));
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

app.post("/api/search", async (req, res) => {
  const { query, maxResults = 5 } = req.body as { query: string; maxResults?: number };

  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  if (!process.env.TAVILY_API_KEY) {
    res.status(500).json({ error: "Tavily API not configured. Please set TAVILY_API_KEY in .env file." });
    return;
  }

  console.log(`[Tavily] Searching for: "${query}" (max ${maxResults} results)`);

  try {
    const response = await tavilyClient.search({
      query,
      max_results: maxResults,
      include_answer: false,
      search_depth: "basic",
    });

    console.log(`[Tavily] Found ${response.results.length} results`);

    const results = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: r.url, // Full URL for citations
    }));

    res.json({ results });
  } catch (error: unknown) {
    console.error("[Tavily] Search error:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error("[Tavily] Error message:", error.message);
      console.error("[Tavily] Error stack:", error.stack);
    }

    const message = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: `Tavily search failed: ${message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Spark API server running on http://localhost:${PORT}`);
});
