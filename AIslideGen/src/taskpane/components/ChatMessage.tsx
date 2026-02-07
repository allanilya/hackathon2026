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
    </div>
  );
};

export default ChatMessageComponent;
