import * as React from "react";
import { useState, useRef } from "react";
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
  ArrowUpload24Regular,
  TextBulletListSquare24Regular,
} from "@fluentui/react-icons";
import { parseFile } from "../utils/fileParser";

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload: (fileName: string, extractedText: string) => void;
  disabled: boolean;
  placeholder: string;
  currentSlide?: number | null;
  totalSlides?: number | null;
  onSummarize?: () => void;
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
  onFileUpload,
  disabled,
  placeholder,
  currentSlide,
  totalSlides,
  onSummarize,
}) => {
  const styles = useStyles();
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsParsingFile(true);
    try {
      const parsed = await parseFile(file);
      onFileUpload(parsed.fileName, parsed.text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse file.";
      alert(message);
    } finally {
      setIsParsingFile(false);
    }
  };

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
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div className={styles.inputRow}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              className={styles.addButton}
              appearance="subtle"
              icon={<Add24Regular />}
              size="small"
              disabled={disabled || isParsingFile}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<ArrowUpload24Regular />} onClick={handleUploadClick}>
                Upload Notes
              </MenuItem>
              <MenuItem icon={<TextBulletListSquare24Regular />} onClick={onSummarize}>
                Summarize
              </MenuItem>
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
