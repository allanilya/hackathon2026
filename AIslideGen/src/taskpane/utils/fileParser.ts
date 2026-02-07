import mammoth from "mammoth";

export interface ParsedFile {
  fileName: string;
  text: string;
}

const SUPPORTED_EXTENSIONS = [".txt", ".docx"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 15000;

export function isSupportedFile(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (!isSupportedFile(file)) {
    throw new Error(`Unsupported file type. Please upload ${SUPPORTED_EXTENSIONS.join(" or ")} files.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Please upload a file under 5 MB.");
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

  let text: string;

  if (ext === ".txt") {
    text = await readTextFile(file);
  } else if (ext === ".docx") {
    text = await readDocxFile(file);
  } else {
    throw new Error("Unsupported file type.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("The file appears to be empty.");
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { fileName: file.name, text: trimmed.substring(0, MAX_TEXT_LENGTH) + "\n\n[Content truncated due to length]" };
  }

  return { fileName: file.name, text: trimmed };
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read text file."));
    reader.readAsText(file);
  });
}

async function readDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
