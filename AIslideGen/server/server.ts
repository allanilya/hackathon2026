import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Increase body size limit to 50MB to handle base64-encoded images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
  const { input, mode, slideCount, tone, additionalContext, image } = req.body as {
    input: string;
    mode: Mode;
    slideCount: number;
    tone: string;
    additionalContext?: string;
    image?: { base64: string; mimeType: string };
  };

  if (!input || !mode) {
    res.status(400).json({ error: "input and mode are required" });
    return;
  }

  const count = slideCount || 3;
  const systemPrompt = `${systemPrompts[mode]}

CRITICAL: You MUST generate EXACTLY ${count} slides. No more, no less. If you generate a different number, the response will be invalid.

Respond ONLY with valid JSON in this exact format:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

Generate EXACTLY ${count} slides. Use a ${tone || "professional"} tone. Do not include any text outside the JSON.`;

  let userMessage = input;
  if (additionalContext) {
    userMessage += `\n\nAdditional context: ${additionalContext}`;
  }

  try {
    const messages: any[] = [{ role: "system", content: systemPrompt }];

    // Build user message with image if provided
    if (image) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userMessage || "Generate a presentation based on this image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.base64}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

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
    
    // Ensure we only return the requested number of slides
    if (parsed.slides && Array.isArray(parsed.slides)) {
      parsed.slides = parsed.slides.slice(0, count);
    }
    
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

app.post("/api/analyze-image", async (req, res) => {
  const { image, text, slideCount } = req.body as {
    image: { base64: string; mimeType: string };
    text?: string;
    slideCount?: number;
  };

  if (!image) {
    res.status(400).json({ error: "image is required" });
    return;
  }

  try {
    // If slideCount is provided, generate slides (even if text is minimal)
    // If text is provided, analyze image and generate presentation
    if (slideCount !== undefined || (text && text.trim())) {
      const count = slideCount || 3;
      const hasText = text && text.trim();
      
      const systemPrompt = hasText
        ? `You are a presentation expert. The user has provided an image and additional text. Generate a presentation that incorporates both the image content and the text provided.

CRITICAL: You MUST generate EXACTLY ${count} slides. No more, no less. If you generate a different number, the response will be invalid.

Respond ONLY with valid JSON in this exact format:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

Generate EXACTLY ${count} slides. Use a professional tone. Do not include any text outside the JSON.`
        : `You are a presentation expert. The user has provided an image. Analyze the image and generate a presentation based on what you see.

CRITICAL: You MUST generate EXACTLY ${count} slides. No more, no less. If you generate a different number, the response will be invalid.

Respond ONLY with valid JSON in this exact format:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

Generate EXACTLY ${count} slides. Use a professional tone. Do not include any text outside the JSON.`;

      const userMessage = hasText
        ? `Generate a presentation based on this image and the following text: ${text}`
        : "Generate a presentation based on this image.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userMessage,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${image.mimeType};base64,${image.base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure we only return the requested number of slides
      if (parsed.slides && Array.isArray(parsed.slides)) {
        parsed.slides = parsed.slides.slice(0, count);
      }
      
      res.json(parsed);
    } else {
      // No text provided - analyze image and generate follow-up questions
      const systemPrompt = `You are a helpful assistant that analyzes images and generates relevant follow-up questions to help create a presentation.

First, analyze the image in detail. Describe what you see, identify key themes, subjects, data, or concepts present in the image.

Then, generate 3-5 relevant follow-up questions that would help the user create a presentation about this image. The questions should be specific to the image content and help clarify:
- What aspect of the image they want to focus on
- What type of presentation they want (informational, persuasive, educational, etc.)
- What additional context or details they want to include
- Who the audience is
- What the main message should be

Respond ONLY with valid JSON in this exact format:
{
  "analysis": "Detailed description of the image content, themes, and key elements",
  "questions": ["Question 1", "Question 2", "Question 3"]
}

Do not include any text outside the JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and generate relevant follow-up questions to help create a presentation.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${image.mimeType};base64,${image.base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    }
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
    // Dynamic import for ES module
    const { TavilyClient } = await import("tavily");
    const tavilyClient = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });

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
      source: new URL(r.url).hostname,
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
