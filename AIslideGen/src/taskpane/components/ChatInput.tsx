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
  Globe24Regular,
  Dismiss16Regular,
  PaintBrush24Regular,
} from "@fluentui/react-icons";
import { parseFile } from "../utils/fileParser";
import { processImage, ImageData } from "../utils/imageHandler";
import type { SlideTheme } from "../taskpane";

const themeLabels: Record<SlideTheme, string> = {
  professional: "Professional",
  casual: "Casual",
  academic: "Academic",
  creative: "Creative",
  minimal: "Minimal",
};

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload: (fileName: string, extractedText: string) => void;
  onImageUpload: (imageData: ImageData) => void;
  disabled: boolean;
  placeholder: string;
  currentSlide?: number | null;
  totalSlides?: number | null;
  onSummarize?: () => void;
  onWebSearch?: () => void;
  isWebSearchActive?: boolean;
  onDismissWebSearch?: () => void;
  selectedTheme?: SlideTheme;
  onThemeChange?: (theme: SlideTheme) => void;
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
  activeIndicatorRow: {
    display: "flex",
    gap: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    paddingTop: "8px",
    paddingBottom: "4px",
  },
  activeIndicatorChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: "12px",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "10px",
    paddingRight: "8px",
    fontSize: "12px",
    fontWeight: tokens.fontWeightSemibold,
  },
  dismissButton: {
    minWidth: "16px",
    width: "16px",
    height: "16px",
    padding: "0",
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    color: tokens.colorBrandForeground2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileUpload,
  onImageUpload,
  disabled,
  placeholder,
  currentSlide,
  totalSlides,
  onSummarize,
  onWebSearch,
  isWebSearchActive,
  onDismissWebSearch,
  selectedTheme = "professional",
  onThemeChange,
}) => {
  const styles = useStyles();
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsParsingFile(true);
    try {
      const imageData = await processImage(file);
      onImageUpload(imageData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process image.";
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
      {/* Active Indicators Row */}
      {((selectedTheme && selectedTheme !== "professional") || isWebSearchActive) && (
        <div className={styles.activeIndicatorRow}>
          {/* Theme Indicator */}
          {selectedTheme && selectedTheme !== "professional" && (
            <div className={styles.activeIndicatorChip}>
              <PaintBrush24Regular style={{ width: "14px", height: "14px" }} />
              <span>{themeLabels[selectedTheme]}</span>
            </div>
          )}

          {/* Web Search Indicator */}
          {isWebSearchActive && (
            <div className={styles.activeIndicatorChip}>
              <Globe24Regular style={{ width: "14px", height: "14px" }} />
              <span>Web Search</span>
              <button
                className={styles.dismissButton}
                onClick={onDismissWebSearch}
                title="Cancel web search"
              >
                <Dismiss16Regular />
              </button>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={handleImageChange}
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
              {/* Theme Submenu */}
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <MenuItem icon={<PaintBrush24Regular />}>
                    Themes
                  </MenuItem>
                </MenuTrigger>

                <MenuPopover>
                  <MenuList>
                    {(Object.keys(themeLabels) as SlideTheme[]).map((theme) => (
                      <MenuItem
                        key={theme}
                        onClick={() => onThemeChange?.(theme)}
                      >
                        {themeLabels[theme]}
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuPopover>
              </Menu>

              <MenuItem icon={<Globe24Regular />} onClick={onWebSearch}>Web Search</MenuItem>
              <MenuItem icon={<ArrowUpload24Regular />} onClick={handleUploadClick}>
                Upload Notes
              </MenuItem>
              <MenuItem icon={<TextBulletListSquare24Regular />} onClick={onSummarize}>
                Summarize
              </MenuItem>
              <MenuItem icon={<Image24Regular />} onClick={handleImageUploadClick}>
                Add Image
              </MenuItem>
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
