import * as React from "react";
import { Button, Card, CardHeader, Text, makeStyles, tokens } from "@fluentui/react-components";
import { SlideAdd24Regular, ArrowDownload24Regular } from "@fluentui/react-icons";
import type { GeneratedSlide } from "../types";

interface OutputPreviewProps {
  slides: GeneratedSlide[];
  onInsertSlide: (slide: GeneratedSlide, index: number) => void;
  onInsertAll: () => void;
  insertedSlideIndexes?: Set<number>;
}

const useStyles = makeStyles({
  wrapper: {
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  card: {
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "12px",
  },
  bulletList: {
    margin: "0",
    marginTop: "12px",
    paddingLeft: "20px",
  },
  bullet: {
    fontSize: "13px",
    paddingBottom: "6px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
  },
  cardActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "12px",
  },
  paragraphContent: {
    marginTop: "12px",
    paddingLeft: "4px",
    paddingRight: "4px",
  },
  paragraph: {
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.6",
    marginBottom: "8px",
    marginTop: "0",
  },
  headlineContent: {
    marginTop: "16px",
    paddingLeft: "4px",
    textAlign: "center" as const,
  },
  headlineText: {
    fontSize: "16px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.4",
    marginBottom: "4px",
    marginTop: "0",
  },
  headlineSubtext: {
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
    marginTop: "0",
  },
  formatBadge: {
    fontSize: "10px",
    marginLeft: "8px",
    paddingTop: "2px",
    paddingBottom: "2px",
    paddingLeft: "6px",
    paddingRight: "6px",
    borderRadius: "4px",
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
    fontWeight: 400,
  },
});

function renderSlideContent(
  slide: GeneratedSlide,
  styles: ReturnType<typeof useStyles>
): React.ReactNode {
  const format = slide.format || "bullets";

  switch (format) {
    case "numbered":
      return (
        <ol className={styles.bulletList} style={{ listStyleType: "decimal" }}>
          {slide.bullets.map((item, i) => (
            <li key={i} className={styles.bullet}>{item}</li>
          ))}
        </ol>
      );
    case "paragraph":
      return (
        <div className={styles.paragraphContent}>
          {slide.bullets.map((para, i) => (
            <p key={i} className={styles.paragraph}>{para}</p>
          ))}
        </div>
      );
    case "headline":
      return (
        <div className={styles.headlineContent}>
          <p className={styles.headlineText}>{slide.bullets[0]}</p>
          {slide.bullets[1] && (
            <p className={styles.headlineSubtext}>{slide.bullets[1]}</p>
          )}
        </div>
      );
    case "bullets":
    default:
      return (
        <ul className={styles.bulletList}>
          {slide.bullets.map((bullet, i) => (
            <li key={i} className={styles.bullet}>{bullet}</li>
          ))}
        </ul>
      );
  }
}

const OutputPreview: React.FC<OutputPreviewProps> = (props: OutputPreviewProps) => {
  const { slides, onInsertSlide, onInsertAll, insertedSlideIndexes } = props;
  const styles = useStyles();

  if (slides.length === 0) {
    return null;
  }

  // Check if all slides have been inserted
  const allInserted = insertedSlideIndexes && insertedSlideIndexes.size === slides.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <Text className={styles.heading}>Generated Slides ({slides.length})</Text>
        {!allInserted && (
          <Button appearance="primary" icon={<ArrowDownload24Regular />} onClick={onInsertAll} size="small">
            Insert All
          </Button>
        )}
      </div>
      {slides.map((slide, index) => {
        const isInserted = insertedSlideIndexes?.has(index);
        return (
          <Card
            key={index}
            className={styles.card}
            style={{
              opacity: isInserted ? 0.5 : 1,
              backgroundColor: isInserted ? tokens.colorNeutralBackground3 : undefined,
            }}
          >
            <CardHeader
              header={
                <Text weight="semibold">
                  {isInserted && "✓ "}
                  {index + 1}. {slide.title}
                  {slide.format && slide.format !== "bullets" && (
                    <span className={styles.formatBadge}>{slide.format}</span>
                  )}
                </Text>
              }
            />
            {renderSlideContent(slide, styles)}
            <div className={styles.cardActions}>
              <Button
                appearance="subtle"
                icon={<SlideAdd24Regular />}
                onClick={() => onInsertSlide(slide, index)}
                size="small"
                disabled={isInserted}
              >
                {isInserted ? "Inserted" : "Insert"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default OutputPreview;
