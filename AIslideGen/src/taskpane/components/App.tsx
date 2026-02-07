import * as React from "react";
import { useState } from "react";
import Header from "./Header";
import ModeSelector from "./ModeSelector";
import InputArea from "./InputArea";
import OptionsRow from "./OptionsRow";
import OutputPreview from "./OutputPreview";
import { Button, Spinner, makeStyles, tokens } from "@fluentui/react-components";
import { Sparkle24Filled } from "@fluentui/react-icons";
import { insertText } from "../taskpane";
import { useSlideDetection } from "../hooks/useSlideDetection";
import type { Mode } from "./ModeSelector";
import type { Tone } from "./OptionsRow";
import type { GeneratedSlide } from "./OutputPreview";

/* global fetch */

interface AppProps {
  title: string;
}

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  generateRow: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "16px",
    paddingBottom: "4px",
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  generateButton: {
    width: "100%",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingTop: "8px",
    textAlign: "center" as const,
  },
});

const API_URL = "/api/generate";

const App: React.FC<AppProps> = (props: AppProps) => {
  const styles = useStyles();

  const [mode, setMode] = useState<Mode>("generate");
  const [inputText, setInputText] = useState<string>("");
  const [slideCount, setSlideCount] = useState<number>(3);
  const [tone, setTone] = useState<Tone>("professional");
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlide[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Slide detection toggle
  const [showSlideNumber, setShowSlideNumber] = useState<boolean>(false);

  // Use slide detection hook (only active when toggle is enabled)
  const { currentSlide, totalSlides } = useSlideDetection({
    enabled: showSlideNumber,
  });

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText, mode, slideCount, tone }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      setGeneratedSlides(data.slides || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSlideText = (slide: GeneratedSlide): string => {
    const bullets = slide.bullets.map((b) => `\u2022 ${b}`).join("\n");
    return `${slide.title}\n\n${bullets}`;
  };

  const handleInsertSlide = async (slide: GeneratedSlide) => {
    await insertText(formatSlideText(slide));
  };

  const handleInsertAll = async () => {
    for (const slide of generatedSlides) {
      await insertText(formatSlideText(slide));
    }
  };

  return (
    <div className={styles.root}>
      <Header
        logo="assets/logo-filled.png"
        title={props.title}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
      />
      <ModeSelector selectedMode={mode} onModeChange={setMode} />
      <InputArea mode={mode} value={inputText} onChange={setInputText} />
      <OptionsRow
        slideCount={slideCount}
        onSlideCountChange={setSlideCount}
        tone={tone}
        onToneChange={setTone}
        showSlideNumber={showSlideNumber}
        onShowSlideNumberChange={setShowSlideNumber}
      />
      <div className={styles.generateRow}>
        <Button
          className={styles.generateButton}
          appearance="primary"
          icon={isGenerating ? <Spinner size="tiny" /> : <Sparkle24Filled />}
          disabled={isGenerating || !inputText.trim()}
          onClick={handleGenerate}
          size="large"
        >
          {isGenerating ? "Generating..." : "Generate Slides"}
        </Button>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      <OutputPreview
        slides={generatedSlides}
        onInsertSlide={handleInsertSlide}
        onInsertAll={handleInsertAll}
      />
    </div>
  );
};

export default App;
