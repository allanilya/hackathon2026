import * as React from "react";
import { useEffect, useRef } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import ChatMessageComponent from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import OutputPreview from "./OutputPreview";
import type { ChatMessage, ChatOption, GeneratedSlide } from "../types";

interface ChatContainerProps {
  messages: ChatMessage[];
  onOptionSelect: (messageId: string, option: ChatOption) => void;
  onOtherSubmit: (messageId: string, text: string) => void;
  isTyping: boolean;
  slides: GeneratedSlide[];
  onInsertSlide: (slide: GeneratedSlide) => void;
  onInsertAll: () => void;
  selectedValues: Record<string, string>;
}

const useStyles = makeStyles({
  container: {
    flex: "1",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "12px",
    paddingBottom: "12px",
    paddingLeft: "12px",
    paddingRight: "12px",
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onOptionSelect,
  onOtherSubmit,
  isTyping,
  slides,
  onInsertSlide,
  onInsertAll,
  selectedValues,
}) => {
  const styles = useStyles();
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Auto-scroll only if user is near the bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, slides]);

  // Find the last assistant message that has options and hasn't been answered yet
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && messages[i].options && messages[i].options!.length > 0) {
        // Check if there's a user message after this one
        const hasUserReply = messages.slice(i + 1).some((m) => m.role === "user");
        if (!hasUserReply) return i;
        break;
      }
    }
    return -1;
  })();

  return (
    <div className={styles.container} ref={containerRef}>
      {messages.map((msg, idx) => (
        <ChatMessageComponent
          key={msg.id}
          message={msg}
          isLatestAssistant={idx === lastAssistantIdx}
          onOptionSelect={(option) => onOptionSelect(msg.id, option)}
          onOtherSubmit={(text) => onOtherSubmit(msg.id, text)}
          selectedValue={selectedValues[msg.id]}
        />
      ))}
      {isTyping && <TypingIndicator />}
      {slides.length > 0 && (
        <OutputPreview slides={slides} onInsertSlide={onInsertSlide} onInsertAll={onInsertAll} />
      )}
      <div ref={endRef} />
    </div>
  );
};

export default ChatContainer;
