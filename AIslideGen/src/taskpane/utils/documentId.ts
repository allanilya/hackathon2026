/**
 * Gets or creates a unique identifier for the current PowerPoint document.
 * This ID persists with the document and is used to scope conversations.
 */
export async function getOrCreateDocumentId(): Promise<string> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.get("documentId");

    const existingId = Office.context.document.settings.get("documentId");

    if (existingId) {
      resolve(existingId as string);
      return;
    }

    // Generate a new unique ID for this document
    const newId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    Office.context.document.settings.set("documentId", newId);
    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(newId);
      } else {
        reject(new Error("Failed to save document ID"));
      }
    });
  });
}
