import * as React from "react";
import { useState } from "react";
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Label,
  Spinner,
  Image,
} from "@fluentui/react-components";
import { useAuth } from "../contexts/AuthContext";

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground2,
    paddingLeft: "24px",
    paddingRight: "24px",
  },
  logo: {
    marginBottom: "8px",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    margin: "0 0 24px 0",
  },
  form: {
    width: "100%",
    maxWidth: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  error: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteRedForeground1,
    textAlign: "center",
  },
  toggle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    marginTop: "8px",
  },
  toggleLink: {
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    fontSize: tokens.fontSizeBase200,
    padding: "0",
    textDecoration: "underline",
  },
});

const AuthScreen: React.FC = () => {
  const styles = useStyles();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.root}>
      <Image className={styles.logo} width="48" height="48" src="assets/logo-filled.png" alt="Spark" />
      <h1 className={styles.title}>Spark</h1>
      <p className={styles.subtitle}>
        {isSignUp ? "Create your account" : "Sign in to continue"}
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <Label htmlFor="email" size="small">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(_e, data) => setEmail(data.value)}
            required
            size="medium"
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="password" size="small">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(_e, data) => setPassword(data.value)}
            required
            size="medium"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Button appearance="primary" type="submit" disabled={submitting}>
          {submitting ? <Spinner size="tiny" /> : isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <div className={styles.toggle}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            className={styles.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthScreen;
