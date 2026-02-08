import * as React from "react";
import { Button, Card, CardHeader, Text, makeStyles, tokens } from "@fluentui/react-components";
import { SlideAdd24Regular, ArrowDownload24Regular } from "@fluentui/react-icons";

export interface GeneratedSlide {
  title: string;
  bullets: string[];
}

interface OutputPreviewProps {
  slides: GeneratedSlide[];
  onInsertSlide: (slide: GeneratedSlide, index: number) => void;
  onInsertAll: () => void;
  insertedSlideIndexes?: Set<number>;
}

const useStyles = makeStyles({
  wrapper: {
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingTop: "16px",
    paddingBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  card: {
    padding: "12px",
  },
  bulletList: {
    margin: "0",
    paddingLeft: "20px",
  },
  bullet: {
    fontSize: tokens.fontSizeBase300,
    paddingBottom: "4px",
  },
  cardActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "8px",
  },
});

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
                </Text>
              }
            />
            <ul className={styles.bulletList}>
              {slide.bullets.map((bullet, bIndex) => (
                <li key={bIndex} className={styles.bullet}>
                  {bullet}
                </li>
              ))}
            </ul>
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
