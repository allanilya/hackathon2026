import * as React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import ChatOptionChips from "./ChatOptionChips";
import type { ChatMessage as ChatMessageType, ChatOption } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
  isLatestAssistant: boolean;
  onOptionSelect: (option: ChatOption) => void;
  onOtherSubmit: (text: string) => void;
  selectedValue?: string;
}

const useStyles = makeStyles({
  row: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "85%",
  },
  assistantRow: {
    alignSelf: "flex-start",
  },
  userRow: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "12px",
    borderTopLeftRadius: "4px",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "14px",
    paddingRight: "14px",
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground1,
  },
  userBubble: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: "12px",
    borderTopRightRadius: "4px",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "14px",
    paddingRight: "14px",
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  searchResults: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  },
  searchResultCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    padding: "12px",
  },
  resultTitleContainer: {
    marginBottom: "4px",
  },
  resultSnippet: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: "4px",
    lineHeight: "1.4",
  },
  resultSource: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isLatestAssistant,
  onOptionSelect,
  onOtherSubmit,
  selectedValue,
}) => {
  const styles = useStyles();
  const isAssistant = message.role === "assistant";

  return (
    <div className={`${styles.row} ${isAssistant ? styles.assistantRow : styles.userRow}`}>
      <div className={isAssistant ? styles.assistantBubble : styles.userBubble}>{message.text}</div>
      {isAssistant && message.options && message.options.length > 0 && (
        <ChatOptionChips
          options={message.options}
          allowOther={message.allowOther || false}
          onSelect={onOptionSelect}
          onOtherSubmit={onOtherSubmit}
          disabled={!isLatestAssistant}
          selectedValue={selectedValue}
        />
      )}
      {isAssistant && message.searchResults && message.searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {message.searchResults.map((result, idx) => (
            <div key={idx} className={styles.searchResultCard}>
              <div className={styles.resultTitleContainer}>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    color: tokens.colorBrandForeground1,
                    fontSize: tokens.fontSizeBase300,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {result.title}
                </a>
              </div>
              <div className={styles.resultSnippet}>{result.snippet}</div>
              <div className={styles.resultSource}>{result.source || new URL(result.url).hostname}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessageComponent;
