import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Textarea,
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
  Edit24Regular,
  DataBarVertical24Regular,
} from "@fluentui/react-icons";
import { parseFile } from "../utils/fileParser";
import { processImage, ImageData } from "../utils/imageHandler";
import { parseDataFile, ParsedData } from "../utils/dataParser";
import type { SlideTheme, SlideLayout } from "../taskpane";

const themeLabels: Record<SlideTheme, string> = {
  professional: "Professional",
  casual: "Casual",
  academic: "Academic",
  creative: "Creative",
  minimal: "Minimal",
  slider: "Slider",
};

const layoutLabels: Record<SlideLayout, string> = {
  "title-content": "Title + Content",
  "title-only": "Title Only",
  "two-column": "Two Column",
  "big-number": "Big Number",
  "quote": "Quote",
  "image-left": "Image Left",
  "image-right": "Image Right",
};

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload: (fileName: string, extractedText: string, extractedImages?: ImageData[]) => void;
  onImageUpload: (imageData: ImageData) => void;
  onDataUpload: (data: ParsedData) => void;
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
  selectedLayout?: SlideLayout;
  onLayoutChange?: (layout: SlideLayout) => void;
  onEditSlide?: () => void;
}

const useStyles = makeStyles({
  container: {
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "14px",
    paddingBottom: "10px",
    paddingLeft: "16px",
    paddingRight: "16px",
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
    paddingBottom: "10px",
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  slideIndicator: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    userSelect: "none",
    fontWeight: tokens.fontWeightMedium,
  },
  activeIndicatorRow: {
    display: "flex",
    gap: "8px",
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingTop: "10px",
    paddingBottom: "6px",
  },
  activeIndicatorChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(234, 129, 95, 0.15)",
    color: "#EA815F",
    border: "1px solid rgba(234, 129, 95, 0.3)",
    borderRadius: "16px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "12px",
    paddingRight: "10px",
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

const DRAFT_TEXT_KEY = "chatInputDraft";

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
  selectedLayout = "title-content",
  onLayoutChange,
  onEditSlide,
  onDataUpload,
}) => {
  const styles = useStyles();
  const [text, setText] = useState(() => {
    // Load saved draft on initial mount
    try {
      return localStorage.getItem(DRAFT_TEXT_KEY) || "";
    } catch {
      return "";
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Save draft to localStorage whenever text changes
  useEffect(() => {
    try {
      if (text) {
        localStorage.setItem(DRAFT_TEXT_KEY, text);
      } else {
        localStorage.removeItem(DRAFT_TEXT_KEY);
      }
    } catch (error) {
      console.warn("Failed to save draft:", error);
    }
  }, [text]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleDataUploadClick = () => {
    dataInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsParsingFile(true);
    try {
      const parsed = await parseFile(file);
      onFileUpload(parsed.fileName, parsed.text, parsed.images);
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

  const handleDataChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsParsingFile(true);
    try {
      const parsedData = await parseDataFile(file);
      onDataUpload(parsedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse data file.";
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
    // Clear draft from localStorage when sent
    try {
      localStorage.removeItem(DRAFT_TEXT_KEY);
    } catch (error) {
      console.warn("Failed to clear draft:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter (Mac) or Ctrl+Enter (Windows) inserts a newline
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Allow default behavior (insert newline)
      return;
    }

    // Plain Enter (without Shift, Cmd, or Ctrl) sends the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasSlideInfo = currentSlide !== null && currentSlide !== undefined;

  return (
    <div className={styles.container}>
      {/* Active Indicators Row */}
      {(selectedTheme || selectedLayout || isWebSearchActive) && (
        <div className={styles.activeIndicatorRow}>
          {/* Theme Indicator */}
          {selectedTheme && (
            <div className={styles.activeIndicatorChip}>
              <PaintBrush24Regular style={{ width: "14px", height: "14px" }} />
              <span>{themeLabels[selectedTheme]}</span>
            </div>
          )}

          {/* Layout Indicator */}
          {selectedLayout && (
            <div className={styles.activeIndicatorChip}>
              <SlideLayout24Regular style={{ width: "14px", height: "14px" }} />
              <span>{layoutLabels[selectedLayout]}</span>
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
      <input
        ref={dataInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleDataChange}
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

              {/* Layout Submenu */}
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <MenuItem icon={<SlideLayout24Regular />}>
                    Layouts
                  </MenuItem>
                </MenuTrigger>

                <MenuPopover>
                  <MenuList>
                    {(Object.keys(layoutLabels) as SlideLayout[]).map((layout) => (
                      <MenuItem
                        key={layout}
                        onClick={() => onLayoutChange?.(layout)}
                      >
                        {layoutLabels[layout]}
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuPopover>
              </Menu>

              <MenuItem icon={<Edit24Regular />} onClick={onEditSlide}>Edit Current Slide</MenuItem>
              <MenuItem icon={<Globe24Regular />} onClick={onWebSearch}>Web Search</MenuItem>
              <MenuItem icon={<ArrowUpload24Regular />} onClick={handleUploadClick}>
                Generate from notes
              </MenuItem>
              <MenuItem icon={<TextBulletListSquare24Regular />} onClick={onSummarize}>
                Summarize
              </MenuItem>
              <MenuItem icon={<Image24Regular />} onClick={handleImageUploadClick}>
                Generate from Image
              </MenuItem>
              <MenuItem icon={<DataBarVertical24Regular />} onClick={handleDataUploadClick}>
                Import Data Table
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Textarea
          className={styles.input}
          placeholder={placeholder}
          value={text}
          onChange={(_, data) => setText(data.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          size="medium"
          resize="vertical"
          rows={1}
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
