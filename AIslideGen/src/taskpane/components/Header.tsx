import * as React from "react";
import { Image, tokens, makeStyles } from "@fluentui/react-components";

export interface HeaderProps {
  title: string;
  logo: string;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingTop: "16px",
    paddingBottom: "12px",
    paddingLeft: "20px",
    paddingRight: "20px",
    backgroundColor: tokens.colorNeutralBackground3,
    justifyContent: "space-between",
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  textGroup: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    margin: "0",
    lineHeight: tokens.lineHeightBase500,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    margin: "0",
  },
});

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { title, logo } = props;
  const styles = useStyles();

  return (
    <section className={styles.header}>
      <div className={styles.leftGroup}>
        <Image width="36" height="36" src={logo} alt={title} />
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Spark</h1>
          <p className={styles.subtitle}>Ideas to slides, instantly</p>
        </div>
      </div>
    </section>
  );
};

export default Header;
