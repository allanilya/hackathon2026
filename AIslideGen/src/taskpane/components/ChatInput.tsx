import * as React from "react";
import { useState } from "react";
import { Input, Button, makeStyles, tokens } from "@fluentui/react-components";
import { Send24Filled } from "@fluentui/react-icons";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  input: {
    flex: "1",
  },
});

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder }) => {
  const styles = useStyles();
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <Input
        className={styles.input}
        placeholder={placeholder}
        value={text}
        onChange={(_, data) => setText(data.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size="medium"
      />
      <Button
        appearance="primary"
        icon={<Send24Filled />}
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        size="medium"
      />
    </div>
  );
};

export default ChatInput;
