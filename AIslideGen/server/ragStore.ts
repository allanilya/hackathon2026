import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// Singleton embeddings instance (reused across all conversations)
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

// Per-conversation vector store cache
const conversationStores = new Map<string, MemoryVectorStore>();

function getStore(conversationId: string): MemoryVectorStore {
  let store = conversationStores.get(conversationId);
  if (!store) {
    store = new MemoryVectorStore(embeddings);
    conversationStores.set(conversationId, store);
  }
  return store;
}

/**
 * Index a single message into the conversation's vector store.
 */
export async function indexMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!content || content.length < 10) return;

  const store = getStore(conversationId);
  const doc = new Document({
    pageContent: content,
    metadata: { role, timestamp: Date.now(), ...metadata },
  });

  await store.addDocuments([doc]);
}

/**
 * Index generated slide content as separate documents for fine-grained retrieval.
 */
export async function indexSlides(
  conversationId: string,
  slides: Array<{ title: string; bullets: string[]; sources?: string[]; format?: string }>
): Promise<void> {
  const store = getStore(conversationId);
  const docs = slides.map((slide, index) => {
    const format = slide.format || "bullets";
    let contentText: string;
    switch (format) {
      case "paragraph":
        contentText = slide.bullets.join(" ");
        break;
      case "headline":
        contentText = slide.bullets.join(" — ");
        break;
      case "numbered":
        contentText = slide.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
        break;
      default:
        contentText = slide.bullets.map((b) => `- ${b}`).join("\n");
    }
    const text = `Slide ${index + 1} [${format}]: ${slide.title}\n${contentText}${
      slide.sources?.length ? `\nSources: ${slide.sources.join(", ")}` : ""
    }`;
    return new Document({
      pageContent: text,
      metadata: { role: "assistant", type: "slide", slideIndex: index, timestamp: Date.now() },
    });
  });

  await store.addDocuments(docs);
}

/**
 * Index research/article content, chunked for better retrieval.
 */
export async function indexResearchContent(
  conversationId: string,
  content: string
): Promise<void> {
  if (!content || content.length < 20) return;

  const store = getStore(conversationId);
  const chunks = chunkText(content, 500);
  const docs = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk,
        metadata: { role: "system", type: "research", timestamp: Date.now() },
      })
  );

  await store.addDocuments(docs);
}

/**
 * Retrieve relevant context for a new user query.
 */
export async function retrieveContext(
  conversationId: string,
  query: string,
  k: number = 5
): Promise<string[]> {
  const store = conversationStores.get(conversationId);
  if (!store || store.memoryVectors.length === 0) {
    return [];
  }

  try {
    const results = await store.similaritySearch(query, k);
    return results.map((doc) => {
      const roleLabel =
        doc.metadata.role === "user"
          ? "User"
          : doc.metadata.type === "slide"
            ? "Slide"
            : doc.metadata.type === "research"
              ? "Research"
              : "Assistant";
      return `[${roleLabel}]: ${doc.pageContent}`;
    });
  } catch (error) {
    console.error("[RAG] Retrieval error:", error);
    return [];
  }
}

/**
 * Seed a conversation's vector store with historical messages.
 * No-op if the store already has vectors.
 */
export async function seedConversation(
  conversationId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  const store = getStore(conversationId);
  if (store.memoryVectors.length > 0) return;

  for (const msg of messages) {
    await indexMessage(conversationId, msg.role, msg.content);
  }
}

/**
 * Delete a conversation's vector store.
 */
export function deleteConversationStore(conversationId: string): void {
  conversationStores.delete(conversationId);
}

/**
 * Split text into chunks of approximately maxLen characters at sentence boundaries.
 */
function chunkText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    let breakPoint = remaining.lastIndexOf(". ", maxLen);
    if (breakPoint === -1 || breakPoint < maxLen * 0.3) {
      breakPoint = remaining.lastIndexOf(" ", maxLen);
    }
    if (breakPoint === -1) {
      breakPoint = maxLen;
    }

    chunks.push(remaining.slice(0, breakPoint + 1).trim());
    remaining = remaining.slice(breakPoint + 1).trim();
  }

  return chunks;
}
