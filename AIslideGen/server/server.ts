import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { indexMessage, indexSlides, retrieveContext, seedConversation } from "./ragStore";

dotenv.config();

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(cors({ origin: "https://localhost:3000" }));

// ChatOpenAI for slide generation and summarization (temperature 0.7)
const generateModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });

// ChatOpenAI for edits (lower temperature for precision)
const editModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0.3 });

type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";

// Helper to convert conversation history to LangChain message types
function toLangChainMessages(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }> | undefined,
  userMessage: string,
  ragContext?: string[]
): BaseMessage[] {
  let augmentedPrompt = systemPrompt;
  if (ragContext && ragContext.length > 0) {
    augmentedPrompt += `\n\n--- RELEVANT CONVERSATION CONTEXT ---\nThe following are relevant excerpts from earlier in this conversation. Use them to maintain context awareness:\n${ragContext.join("\n\n")}\n--- END CONTEXT ---`;
  }

  const messages: BaseMessage[] = [new SystemMessage(augmentedPrompt)];
  if (history?.length) {
    for (const msg of history) {
      messages.push(msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content));
    }
  }
  messages.push(new HumanMessage(userMessage));
  return messages;
}

const FORMAT_GUIDELINES = `
CONTENT FORMAT - Choose the best "format" for each slide:
- "bullets": Use for listing discrete items, features, facts, or comparisons. 2-7 bullet points.
- "numbered": Use for sequential steps, ranked lists, processes, or timelines. 2-7 items.
- "paragraph": Use for narrative explanations, summaries, conclusions, or contextual overviews. 1-3 entries, each a full paragraph (2-4 sentences).
- "headline": Use for title/transition slides, section dividers, or impactful single-statement slides. 1-2 entries: a main statement and optionally a subtitle.
VARIETY: Vary the format across slides for visual interest. Do NOT use the same format for every slide.`;

const LAYOUT_GUIDELINES = `
SLIDE LAYOUT - Choose the best "layout" for each slide based on its content:
- "title-content": Standard layout with title and content below. Best for most slides with bullet points, numbered lists, paragraphs, or general information.
- "title-only": Large centered title with no body content. Use for opening/closing slides, section dividers, or dramatic single-statement slides. When using this layout, the "bullets" array should be empty [].
- "two-column": Title with content split into two columns. Use when comparing two things side-by-side, showing pros/cons, or presenting parallel information. Needs 4+ bullet points to split evenly.
- "big-number": Large prominent number/statistic with supporting description. Use when a slide centers around a key metric, percentage, or statistic. First bullet should be the number/stat (e.g., "95%", "$2.4B", "10x"), remaining bullets are the description.
- "quote": Large centered quote. Use for notable quotes, testimonials, or impactful statements. First bullet is the quote text, optional second bullet is the attribution/author.
VARIETY: Vary layouts across slides for visual interest. Do NOT use "title-content" for every slide - pick the layout that best fits each slide's content.`;

const FORMAT_EXAMPLES = `
FORMAT VALUES: "bullets" | "numbered" | "paragraph" | "headline"
LAYOUT VALUES: "title-content" | "title-only" | "two-column" | "big-number" | "quote"
EXAMPLES:
- Bullets:    { "title": "Key Features", "layout": "title-content", "format": "bullets", "bullets": ["Fast performance", "Easy to use", "Scalable architecture"] }
- Numbered:   { "title": "Setup Steps", "layout": "title-content", "format": "numbered", "bullets": ["Install the CLI tool", "Configure your environment", "Run the initialization command"] }
- Two-Column: { "title": "Pros vs Cons", "layout": "two-column", "format": "bullets", "bullets": ["Pro: Fast performance", "Pro: Easy setup", "Con: Limited plugins", "Con: Steep learning curve"] }
- Big Number: { "title": "Market Growth", "layout": "big-number", "format": "bullets", "bullets": ["340%", "Year-over-year growth in AI adoption across enterprise companies since 2024"] }
- Quote:      { "title": "Industry Perspective", "layout": "quote", "format": "bullets", "bullets": ["The best way to predict the future is to invent it.", "Alan Kay"] }
- Headline:   { "title": "The Future of AI", "layout": "title-only", "format": "headline", "bullets": [] }
- Paragraph:  { "title": "Executive Summary", "layout": "title-content", "format": "paragraph", "bullets": ["The project achieved a 40% improvement in processing speed. This was driven by the new caching layer and database optimizations.", "Looking ahead, the team plans to focus on horizontal scaling to handle projected traffic increases."] }`;

const systemPrompts: Record<Mode, string> = {
  generate:
    `You are a presentation expert. Create slides with specific, valuable information - not generic statements. Each slide must contain concrete facts, actionable insights, or specific examples. Use clear titles. Avoid meta-commentary or process descriptions.

${FORMAT_GUIDELINES}

${LAYOUT_GUIDELINES}`,
  summarize:
    `You are a summarization expert. Extract the most important facts, insights, and takeaways from the content. Focus on specific information, key findings, and concrete details. Avoid generic summaries - be specific and informative.

${FORMAT_GUIDELINES}
Prefer "paragraph" for narrative summaries, "bullets" for key takeaways, "numbered" for sequential findings.

${LAYOUT_GUIDELINES}`,
  compare:
    `You are an analysis expert. Create detailed comparisons with specific differences, concrete examples, and quantifiable metrics where possible. Include factual distinctions, real-world implications, and data-driven insights. Avoid vague comparisons.

${FORMAT_GUIDELINES}
Use "bullets" for side-by-side comparison points, "numbered" for ranked differences, "paragraph" for nuanced analysis.

${LAYOUT_GUIDELINES}
Prefer "two-column" for direct comparisons.`,
  proscons:
    `You are a critical thinking expert. Provide specific, concrete pros and cons with real examples and evidence. Include factual benefits and drawbacks, not generic observations. Support claims with specifics.

${FORMAT_GUIDELINES}
Use "bullets" for pros and cons lists. Optionally use "paragraph" for an overall assessment slide.

${LAYOUT_GUIDELINES}
Prefer "two-column" for pros vs cons slides.`,
  research:
    `You are a research expert. Extract ONLY information that appears in the provided research sources - do NOT use general knowledge. Focus on CURRENT, SPECIFIC events: exact dates (e.g., 'On Feb 5, 2026...'), recent developments, specific people/places, breaking news, statistics with numbers, and concrete events from the sources. You may use shorthand citations like 'According to [source name]...' or 'Reuters reports...' in bullet points. Prioritize the most recent and newsworthy information. Avoid generic background - focus on what's happening NOW based on the sources.

${FORMAT_GUIDELINES}
Use "numbered" for chronological developments, "bullets" for key findings, "paragraph" for analysis or context.

${LAYOUT_GUIDELINES}
Use "big-number" for key statistics from research. Use "quote" for notable expert statements.`,
};

app.post("/api/generate", async (req, res) => {
  const { input, mode, slideCount, tone, additionalContext, conversationHistory, conversationId } = req.body as {
    input: string;
    mode: Mode;
    slideCount: number;
    tone: string;
    additionalContext?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };

  if (!input || !mode) {
    res.status(400).json({ error: "input and mode are required" });
    return;
  }

  const hasResearchSources = additionalContext?.includes("RESEARCH SOURCES:");

  console.log("Generate request - Mode:", mode, "Has research sources:", hasResearchSources);

  let jsonFormat = `{ "slides": [{ "title": "Slide Title", "layout": "title-content", "format": "bullets", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

${FORMAT_EXAMPLES}`;
  let citationInstructions = "";

  if (hasResearchSources && mode === "research") {
    console.log("Including sources in JSON format");
    jsonFormat = `{ "slides": [{ "title": "Slide Title", "layout": "title-content", "format": "bullets", "bullets": ["Point 1", "Point 2", "Point 3"], "sources": ["https://example.com/article", "https://news.site.com/story"] }] }

${FORMAT_EXAMPLES}
Each slide may also include a "sources" array with full URLs.`;
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

  // RAG: Seed store if needed, index user message, retrieve relevant context
  let ragContext: string[] = [];
  if (conversationId) {
    if (conversationHistory?.length) {
      await seedConversation(conversationId, conversationHistory);
    }
    await indexMessage(conversationId, "user", userMessage);
    ragContext = await retrieveContext(conversationId, userMessage, 5);
    console.log(`[RAG] Retrieved ${ragContext.length} context chunks for generate`);
  }

  const langchainMessages = toLangChainMessages(systemPrompt, conversationHistory?.slice(-4), userMessage, ragContext);

  try {
    const response = await generateModel.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : "";

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and default format and layout fields on each slide
    const validFormats = ["bullets", "numbered", "paragraph", "headline"];
    const validLayouts = ["title-content", "title-only", "two-column", "big-number", "quote"];
    if (parsed.slides) {
      for (const s of parsed.slides) {
        if (!s.format || !validFormats.includes(s.format)) {
          s.format = "bullets";
        }
        if (!s.layout || !validLayouts.includes(s.layout)) {
          s.layout = "title-content";
        }
      }
    }

    console.log("Generated slides:", JSON.stringify(parsed, null, 2));

    // RAG: Index the generated slides for future retrieval
    if (conversationId && parsed.slides) {
      const slidesSummary = parsed.slides
        .map((s: any, i: number) => {
          const fmt = s.format || "bullets";
          const content = fmt === "paragraph" ? s.bullets.join(" ") : s.bullets.join("; ");
          return `Slide ${i + 1} [${fmt}]: ${s.title} - ${content}`;
        })
        .join("\n");
      await indexSlides(conversationId, parsed.slides);
      await indexMessage(conversationId, "assistant", slidesSummary, { type: "slide_summary" });
    }

    res.json(parsed);
  } catch (error: unknown) {
    console.error("LangChain error:", error);
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
    const response = await generateModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(input),
    ]);

    const content = typeof response.content === "string" ? response.content : "";
    res.json({ summary: content.trim() });
  } catch (error: unknown) {
    console.error("LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/question", async (req, res) => {
  const { question, slideContent, conversationHistory, conversationId } = req.body as {
    question: string;
    slideContent: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  console.log("[Q&A] Question:", question);

  const systemPrompt = `You are a helpful presentation assistant. The user is working in PowerPoint and asking a question.

You have access to the content of their presentation slides (provided below). Answer the user's question based on the slide content when relevant. If the question is general knowledge that isn't covered by the slides, answer it using your own knowledge but keep answers concise (2-4 sentences).

If slide content is provided, reference specific slides by number when relevant (e.g., "Slide 3 covers...").

Be concise, helpful, and conversational. Respond with plain text only, no JSON or markdown formatting.`;

  let userMessage = question;
  if (slideContent && slideContent.trim()) {
    userMessage = `PRESENTATION CONTENT:\n${slideContent}\n\nQUESTION: ${question}`;
  }

  let ragContext: string[] = [];
  if (conversationId) {
    await indexMessage(conversationId, "user", question);
    ragContext = await retrieveContext(conversationId, question, 5);
    console.log(`[RAG] Retrieved ${ragContext.length} context chunks for question`);
  }

  const langchainMessages = toLangChainMessages(
    systemPrompt,
    conversationHistory?.slice(-4),
    userMessage,
    ragContext
  );

  try {
    const response = await generateModel.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : "";

    if (conversationId && content) {
      await indexMessage(conversationId, "assistant", content, { type: "qa_answer" });
    }

    res.json({ answer: content.trim() });
  } catch (error: unknown) {
    console.error("[Q&A] LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/search", async (req, res) => {
  const { query, maxResults = 8, slideCount = 3 } = req.body as {
    query: string;
    maxResults?: number;
    slideCount?: number;
  };

  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  if (!process.env.TAVILY_API_KEY) {
    res.status(500).json({ error: "Tavily API not configured. Please set TAVILY_API_KEY in .env file." });
    return;
  }

  // Detect if this is a current events/news query
  const lowerQuery = query.toLowerCase();
  const isCurrentEvents = /\b(latest|recent|current|today|news|2024|2025|2026|breaking|developments)\b/i.test(lowerQuery);

  // For current events, enhance query to get specific news articles (not category pages)
  // Add specific terms that encourage article-level results
  const searchQuery = isCurrentEvents
    ? `${query} latest news articles analysis 2025 2026`
    : query;

  console.log(`[Tavily] Searching for: "${searchQuery}" (max ${maxResults} results, slides: ${slideCount}, current events: ${isCurrentEvents})`);

  try {
    // Create a per-request TavilySearch instance to support dynamic maxResults
    const searchTool = new TavilySearch({
      maxResults: maxResults,
      searchDepth: "advanced",
      includeAnswer: false,
      includeRawContent: false,
    });

    const rawResults = await searchTool.invoke({ query: searchQuery });

    // TavilySearch returns a JSON string; parse it defensively
    const parsedResults = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;
    const resultArray = Array.isArray(parsedResults) ? parsedResults : (parsedResults.results || []);

    console.log(`[Tavily] Found ${resultArray.length} results`);

    const results = resultArray.map((r: { title: string; url: string; content: string }) => {
      console.log(`[Tavily] Result URL: ${r.url}`);

      return {
        title: r.title,
        url: r.url,
        snippet: r.content,
        source: r.url,
      };
    });

    res.json({ results });
  } catch (error: unknown) {
    console.error("[Tavily] Search error:", error);

    if (error instanceof Error) {
      console.error("[Tavily] Error message:", error.message);
      console.error("[Tavily] Error stack:", error.stack);
    }

    const message = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: `Tavily search failed: ${message}` });
  }
});

app.post("/api/fetch-article", async (req, res) => {
  const { url } = req.body as { url: string };

  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  console.log(`[Article Fetch] Fetching from: ${url}`);

  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SliderBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Basic HTML to text conversion (remove tags, get text content)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    console.log(`[Article Fetch] Successfully fetched ${textContent.length} characters`);

    res.json({
      url: url,
      content: textContent,
      length: textContent.length,
    });
  } catch (error: unknown) {
    console.error("[Article Fetch] Error:", error);

    if (error instanceof Error) {
      console.error("[Article Fetch] Error message:", error.message);
    }

    const message = error instanceof Error ? error.message : "Article fetch failed";
    res.status(500).json({ error: `Failed to fetch article: ${message}` });
  }
});

app.post("/api/analyze-image", async (req, res) => {
  const { image, text, slideCount } = req.body as {
    image: { base64: string; mimeType: string };
    text?: string;
    slideCount?: number;
  };

  if (!image || !image.base64) {
    res.status(400).json({ error: "image is required" });
    return;
  }

  console.log("[Image Analysis] Received image request", { hasText: !!text, slideCount });

  try {
    // Convert base64 to data URL for LangChain
    const imageUrl = `data:${image.mimeType};base64,${image.base64}`;

    // If text and slideCount are provided, generate slides
    if (text && slideCount) {
      console.log("[Image Analysis] Generating slides from image + text");
      
      const systemPrompt = `You are a presentation expert. Create slides based on the provided image and user's text input. Each slide must contain specific, valuable information - not generic statements. Use clear titles and choose the optimal content format and layout for each slide. Avoid meta-commentary or process descriptions.

${FORMAT_GUIDELINES}

${LAYOUT_GUIDELINES}

Respond ONLY with valid JSON in this exact format:
{ "slides": [{ "title": "Slide Title", "layout": "title-content", "format": "bullets", "bullets": ["Point 1", "Point 2", "Point 3"] }] }

${FORMAT_EXAMPLES}

Generate exactly ${slideCount} slides. Do not include any text outside the JSON.`;

      const userMessage = text || "Create a presentation based on this image.";

      // Create message with image - LangChain supports images in content array
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage({
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        } as any), // Type assertion needed for multimodal content
      ];

      const response = await generateModel.invoke(messages);
      const content = typeof response.content === "string" ? response.content : "";

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[Image Analysis] Generated slides:", JSON.stringify(parsed, null, 2));
      res.json(parsed);
    } else {
      // Image only: analyze and generate questions
      console.log("[Image Analysis] Analyzing image only");
      
      const systemPrompt = `You are a presentation expert. Analyze the provided image and:
1. Provide a brief analysis of what you see in the image (2-3 sentences)
2. Generate 3-5 specific questions that would help create a meaningful presentation about this image

Respond ONLY with valid JSON in this exact format:
{
  "analysis": "Brief description of what's in the image...",
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}

Do not include any text outside the JSON.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage({
          content: [
            { type: "text", text: "Analyze this image and suggest questions for creating a presentation." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        } as any), // Type assertion needed for multimodal content
      ];

      const response = await generateModel.invoke(messages);
      const content = typeof response.content === "string" ? response.content : "";

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[Image Analysis] Analysis result:", JSON.stringify(parsed, null, 2));
      res.json(parsed);
    }
  } catch (error: unknown) {
    console.error("[Image Analysis] Error:", error);
    const message = error instanceof Error ? error.message : "Image analysis failed";
    res.status(500).json({ error: message });
  }
});

app.post("/api/edit", async (req, res) => {
  const { slideContent, editRequest, conversationHistory, conversationId } = req.body as {
    slideContent: {
      shapes: Array<{
        index: number;
        name: string;
        text: string;
        role: string;
      }>;
    };
    editRequest: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };

  if (!slideContent || !editRequest) {
    res.status(400).json({ error: "slideContent and editRequest are required" });
    return;
  }

  console.log("[Edit] Request:", editRequest);

  const systemPrompt = `You are a PowerPoint slide editing assistant. The user wants to modify an existing slide.

You will receive the current slide content (shapes with their roles and text) and the user's edit request.

Respond ONLY with valid JSON containing edit instructions. Available operations:

- "change_title": Change the title text. Requires "newText".
- "replace_content": Replace the entire content/body text. Requires "newText". Format depends on the slide's current layout: bullet slides use "• Point 1\\n• Point 2", numbered slides use "1. Step one\\n2. Step two", paragraph slides use plain prose separated by \\n\\n, headline slides use a single statement.
- "add_bullets": Add new bullet points. Requires "bulletsToAdd" (array of strings, WITHOUT the bullet character).
- "remove_bullets": Remove bullet points matching text. Requires "bulletsToRemove" (array of partial text matches to identify which bullets to remove).
- "restyle": Change visual styling. Requires "target" ("title", "content", or "all") and "style" object with optional: fontSize (number), fontColor (hex string like "#FF0000"), bold (boolean), italic (boolean), backgroundColor (hex string).
- "rewrite": AI-rewrite of content while keeping the same meaning. Requires "target" ("title" or "content") and "newText". Preserve the original format style (bullets use "• ", numbered use "1. ", paragraphs use prose, headlines use a single statement).
- "delete_slide": Delete the entire slide. No additional fields needed.

Respond ONLY with valid JSON in this format:
{
  "instructions": [
    { "operation": "change_title", "newText": "New Title Here" }
  ],
  "summary": "Brief description of what was changed"
}

You may include multiple instructions for complex edits. Do not include any text outside the JSON.`;

  // Build user message with slide context
  let slideDescription = "Current slide content:\n";
  for (const shape of slideContent.shapes) {
    if (shape.text) {
      slideDescription += `- [${shape.role}] "${shape.text}"\n`;
    }
  }
  slideDescription += `\nUser's edit request: ${editRequest}`;

  // RAG: Index edit request and retrieve relevant context
  let ragContext: string[] = [];
  if (conversationId) {
    await indexMessage(conversationId, "user", editRequest);
    ragContext = await retrieveContext(conversationId, editRequest, 3);
    console.log(`[RAG] Retrieved ${ragContext.length} context chunks for edit`);
  }

  const langchainMessages = toLangChainMessages(
    systemPrompt,
    conversationHistory?.slice(-4),
    slideDescription,
    ragContext
  );

  try {
    const response = await editModel.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI edit response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[Edit] Generated instructions:", JSON.stringify(parsed, null, 2));

    // RAG: Index the edit result
    if (conversationId && parsed.summary) {
      await indexMessage(conversationId, "assistant", `Edit applied: ${parsed.summary}`, { type: "edit" });
    }

    res.json(parsed);
  } catch (error: unknown) {
    console.error("[Edit] LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// RAG: Seed a conversation with historical messages
app.post("/api/rag/seed", async (req, res) => {
  const { conversationId, messages } = req.body as {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };

  if (!conversationId || !messages?.length) {
    res.status(400).json({ error: "conversationId and messages are required" });
    return;
  }

  try {
    await seedConversation(conversationId, messages);
    console.log(`[RAG] Seeded conversation ${conversationId} with ${messages.length} messages`);
    res.json({ success: true, indexed: messages.length });
  } catch (error: unknown) {
    console.error("[RAG] Seed error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Spark API server running on http://localhost:${PORT}`);
});
