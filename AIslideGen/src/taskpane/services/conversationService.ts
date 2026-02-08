import { supabase } from "./supabaseClient";
import type { Conversation, ConversationState, ChatMessage, GeneratedSlide } from "../types";

// ── DB row types ──

interface ConversationRow {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  state: ConversationState;
  slides: GeneratedSlide[];
  selected_values: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  text: string;
  options: { label: string; value: string }[] | null;
  allow_other: boolean;
  timestamp: number;
}

// ── Fetch all conversations for a user and specific document ──

export async function fetchConversations(userId: string, documentId?: string): Promise<Conversation[]> {
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId);

  // Filter by document_id if provided
  if (documentId) {
    query = query.eq("document_id", documentId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw error;

  return (data as ConversationRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    state: { ...row.state, messages: [] }, // messages loaded separately
    slides: row.slides,
    selectedValues: row.selected_values,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

// ── Fetch messages for a conversation ──

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true });

  if (error) throw error;

  return (data as MessageRow[]).map((row) => ({
    id: row.id,
    role: row.role as ChatMessage["role"],
    text: row.text,
    options: row.options ?? undefined,
    allowOther: row.allow_other,
    timestamp: row.timestamp,
  }));
}

// ── Create a new conversation ──

export async function createConversation(
  userId: string,
  conversation: Conversation,
  documentId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      id: conversation.id,
      user_id: userId,
      document_id: documentId ?? null,
      title: conversation.title,
      state: conversation.state,
      slides: conversation.slides,
      selected_values: conversation.selectedValues,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ── Update conversation metadata (state, title, slides) ──

export async function updateConversation(
  conversationId: string,
  updates: {
    title?: string;
    state?: ConversationState;
    slides?: GeneratedSlide[];
    selectedValues?: Record<string, string>;
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.state !== undefined) row.state = updates.state;
  if (updates.slides !== undefined) row.slides = updates.slides;
  if (updates.selectedValues !== undefined) row.selected_values = updates.selectedValues;

  const { error } = await supabase
    .from("conversations")
    .update(row)
    .eq("id", conversationId);

  if (error) throw error;
}

// ── Save a single message ──

export async function saveMessage(
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    id: message.id,
    conversation_id: conversationId,
    role: message.role,
    text: message.text,
    options: message.options ?? null,
    allow_other: message.allowOther ?? false,
    timestamp: message.timestamp,
  });

  if (error) throw error;
}

// ── Delete a conversation (cascade deletes messages) ──

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) throw error;
}
