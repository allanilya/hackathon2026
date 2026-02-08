-- Migration: Add document_id to conversations table
-- This migration adds document-scoped conversations support

-- Add document_id column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS document_id TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_document_id
ON conversations(document_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_document
ON conversations(user_id, document_id);

-- Optional: Add a comment explaining the column
COMMENT ON COLUMN conversations.document_id IS
'PowerPoint document identifier from custom properties (slider_document_id). Null for conversations not tied to a specific document.';
