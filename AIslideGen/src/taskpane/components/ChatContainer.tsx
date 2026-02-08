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
  onInsertSlide: (slide: GeneratedSlide, index: number) => void;
  onInsertAll: () => void;
  selectedValues: Record<string, string>;
  insertedSlideIndexes?: Set<number>;
}

const useStyles = makeStyles({
  container: {
    flex: "1",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "20px",
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
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
  insertedSlideIndexes,
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
        <React.Fragment key={msg.id}>
          <ChatMessageComponent
            message={msg}
            isLatestAssistant={idx === lastAssistantIdx}
            onOptionSelect={(option) => onOptionSelect(msg.id, option)}
            onOtherSubmit={(text) => onOtherSubmit(msg.id, text)}
            selectedValue={selectedValues[msg.id]}
          />
          {/* Render slides inline with the message that generated them */}
          {msg.slides && msg.slides.length > 0 && (
            <OutputPreview
              slides={msg.slides}
              onInsertSlide={onInsertSlide}
              onInsertAll={onInsertAll}
              insertedSlideIndexes={insertedSlideIndexes}
            />
          )}
        </React.Fragment>
      ))}
      {isTyping && <TypingIndicator />}
      {/* Only show slides at bottom if no message has claimed them (backwards compatibility) */}
      {slides.length > 0 && !messages.some((m) => m.slides && m.slides.length > 0) && (
        <OutputPreview
          slides={slides}
          onInsertSlide={onInsertSlide}
          onInsertAll={onInsertAll}
          insertedSlideIndexes={insertedSlideIndexes}
        />
      )}
      <div ref={endRef} />
    </div>
  );
};

export default ChatContainer;
