-- Migration: Add document_id column to conversations table
-- This allows each PowerPoint file to have its own conversation history

-- Add the document_id column to the conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS document_id TEXT;

-- Create an index for faster queries by document_id
CREATE INDEX IF NOT EXISTS idx_conversations_document_id
ON conversations(document_id);

-- Optional: Create a composite index for user_id + document_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_document
ON conversations(user_id, document_id);

-- Note: Existing conversations will have NULL document_id
-- They will still be accessible but won't be scoped to specific documents
