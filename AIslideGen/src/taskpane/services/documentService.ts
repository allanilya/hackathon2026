/* global PowerPoint */

/**
 * Gets a unique identifier for the current PowerPoint document
 * Uses the document's URL or creates a stable identifier
 */
export async function getDocumentId(): Promise<string> {
  try {
    return await PowerPoint.run(async (context) => {
      // Load presentation properties
      const docProperties = context.presentation.properties;
      docProperties.load("title");
      await context.sync();

      // Use document title + timestamp hash as ID
      // In a real app, you might use document.url or a custom property
      const title = docProperties.title || "Untitled";

      // Try to get or create a custom document property for stable ID
      try {
        const customProps = context.presentation.properties.customProperties;
        customProps.load("items");
        await context.sync();

        // Check if we already have a document ID stored
        const existingIdProp = customProps.items.find((prop) => prop.key === "slider_document_id");

        if (existingIdProp) {
          existingIdProp.load("value");
          await context.sync();
          return String(existingIdProp.value);
        }

        // Create a new document ID
        const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        customProps.add("slider_document_id", newId);
        await context.sync();

        return newId;
      } catch (propError) {
        // Fallback: use a hash of the title
        // This is less stable but works if custom properties fail
        console.warn("Could not use custom properties, falling back to title hash:", propError);
        return `doc_${hashString(title)}`;
      }
    });
  } catch (error) {
    console.error("Error getting document ID:", error);
    // Fallback to a session-based ID
    return "doc_session_" + Date.now();
  }
}

/**
 * Simple string hash function for creating stable IDs
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
