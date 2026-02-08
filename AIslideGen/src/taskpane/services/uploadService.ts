import { supabase } from "./supabaseClient";

export interface UploadedImage {
  id: string;
  conversationId: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  type: "image";
}

/**
 * Upload an image to Supabase storage and create a database record
 */
export async function uploadImage(
  conversationId: string,
  file: File | { name: string; base64: string; mimeType: string }
): Promise<UploadedImage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const uploadId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // Determine file details
  let fileName: string;
  let mimeType: string;
  let fileData: Blob;

  if (file instanceof File) {
    fileName = file.name;
    mimeType = file.type;
    fileData = file;
  } else {
    // Convert base64 to Blob
    fileName = file.name;
    mimeType = file.mimeType;
    const base64Data = file.base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    fileData = new Blob([byteArray], { type: mimeType });
  }

  // Upload to Supabase storage
  const filePath = `${user.id}/${conversationId}/${uploadId}_${fileName}`;
  const { error: storageError } = await supabase.storage
    .from('uploads')
    .upload(filePath, fileData, {
      contentType: mimeType,
      upsert: false,
    });

  if (storageError) {
    console.error("[uploadImage] Storage error:", storageError);
    throw new Error(`Failed to upload image: ${storageError.message}`);
  }

  // Create database record (matching actual schema: TEXT id with size_bytes)
  const uploadRecord = {
    id: uploadId,
    conversation_id: conversationId,
    user_id: user.id,
    type: 'image' as const,
    original_name: fileName,
    file_path: filePath,
    mime_type: mimeType,
    size_bytes: fileData.size,
  };

  const { error: dbError } = await supabase
    .from('uploads')
    .insert(uploadRecord);

  if (dbError) {
    console.error("[uploadImage] Database error:", dbError);
    // Attempt to clean up storage
    await supabase.storage.from('uploads').remove([filePath]);
    throw new Error(`Failed to save upload record: ${dbError.message}`);
  }

  console.log(`[uploadImage] Successfully uploaded image ${uploadId}`);

  return {
    id: uploadId,
    conversationId,
    originalName: fileName,
    filePath,
    mimeType,
    type: 'image',
  };
}

/**
 * Get all uploads for a conversation
 */
export async function getConversationUploads(conversationId: string): Promise<UploadedImage[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('type', 'image')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("[getConversationUploads] Error:", error);
    throw new Error(`Failed to fetch uploads: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    conversationId: row.conversation_id,
    originalName: row.original_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    type: 'image',
  }));
}

/**
 * Download image data as base64 (for Office.js embedding)
 */
export async function downloadImageAsBase64(imageId: string): Promise<{ base64: string; mimeType: string }> {
  // First get the file path from the database
  const { data: upload, error: dbError } = await supabase
    .from('uploads')
    .select('file_path, mime_type')
    .eq('id', imageId)
    .single();

  if (dbError || !upload) {
    throw new Error(`Upload not found: ${imageId}`);
  }

  // Download the file from storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from('uploads')
    .download(upload.file_path);

  if (storageError || !fileData) {
    throw new Error(`Failed to download image: ${storageError?.message}`);
  }

  // Convert Blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
      resolve({ base64, mimeType: upload.mime_type });
    };
    reader.onerror = () => reject(new Error('Failed to read file data'));
    reader.readAsDataURL(fileData);
  });
}
