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
