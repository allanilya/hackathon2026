import * as React from "react";
import { useState } from "react";
import {
  Input,
  Button,
  makeStyles,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
} from "@fluentui/react-components";
import {
  Send24Filled,
  Add24Regular,
  Image24Regular,
  DocumentBulletList24Regular,
  SlideLayout24Regular,
} from "@fluentui/react-icons";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  currentSlide?: number | null;
  totalSlides?: number | null;
}

const useStyles = makeStyles({
  container: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "10px",
    paddingBottom: "6px",
    paddingLeft: "8px",
    paddingRight: "12px",
  },
  input: {
    flex: "1",
  },
  addButton: {
    minWidth: "32px",
    width: "32px",
    height: "32px",
    padding: "0",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  slideIndicator: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    userSelect: "none",
  },
});

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  placeholder,
  currentSlide,
  totalSlides,
}) => {
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

  const hasSlideInfo = currentSlide !== null && currentSlide !== undefined;

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              className={styles.addButton}
              appearance="subtle"
              icon={<Add24Regular />}
              size="small"
              disabled={disabled}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Image24Regular />}>Add Image</MenuItem>
              <MenuItem icon={<DocumentBulletList24Regular />}>Use Template</MenuItem>
              <MenuItem icon={<SlideLayout24Regular />}>Change Layout</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
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
      {hasSlideInfo && (
        <div className={styles.bottomRow}>
          <Text className={styles.slideIndicator}>
            Slide {currentSlide}{totalSlides ? ` / ${totalSlides}` : ""}
          </Text>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
