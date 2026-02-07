import * as React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "12px",
    borderTopLeftRadius: "4px",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "16px",
    paddingRight: "16px",
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: tokens.colorNeutralForeground3,
    animationName: {
      "0%, 80%, 100%": { opacity: 0.3 },
      "40%": { opacity: 1 },
    },
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
  },
  dot1: { animationDelay: "0s" },
  dot2: { animationDelay: "0.2s" },
  dot3: { animationDelay: "0.4s" },
});

const TypingIndicator: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.bubble}>
      <div className={`${styles.dot} ${styles.dot1}`} />
      <div className={`${styles.dot} ${styles.dot2}`} />
      <div className={`${styles.dot} ${styles.dot3}`} />
    </div>
  );
};

export default TypingIndicator;
