import * as React from "react";
import { useState } from "react";
import { Button, Input, makeStyles, tokens } from "@fluentui/react-components";
import { Checkmark24Regular } from "@fluentui/react-icons";
import type { ChatOption } from "../types";

interface ChatOptionChipsProps {
  options: ChatOption[];
  allowOther: boolean;
  onSelect: (option: ChatOption) => void;
  onOtherSubmit: (text: string) => void;
  disabled: boolean;
  selectedValue?: string;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },
  chip: {
    borderRadius: "16px",
    minWidth: "auto",
    paddingLeft: "14px",
    paddingRight: "14px",
  },
  chipSelected: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  otherRow: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    marginTop: "8px",
    width: "100%",
  },
  otherInput: {
    flex: "1",
  },
});

const ChatOptionChips: React.FC<ChatOptionChipsProps> = ({
  options,
  allowOther,
  onSelect,
  onOtherSubmit,
  disabled,
  selectedValue,
}) => {
  const styles = useStyles();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");

  const handleOtherSubmit = () => {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    onOtherSubmit(trimmed);
    setOtherText("");
    setShowOtherInput(false);
  };

  const handleOtherKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleOtherSubmit();
    }
  };

  return (
    <div>
      <div className={styles.container}>
        {options.map((option) => (
          <Button
            key={option.value}
            className={`${styles.chip} ${selectedValue === option.value ? styles.chipSelected : ""}`}
            appearance={selectedValue === option.value ? "primary" : "outline"}
            shape="circular"
            size="small"
            disabled={disabled}
            onClick={() => onSelect(option)}
          >
            {option.label}
          </Button>
        ))}
        {allowOther && !showOtherInput && (
          <Button
            className={styles.chip}
            appearance="outline"
            shape="circular"
            size="small"
            disabled={disabled}
            onClick={() => setShowOtherInput(true)}
          >
            Other...
          </Button>
        )}
      </div>
      {allowOther && showOtherInput && !disabled && (
        <div className={styles.otherRow}>
          <Input
            className={styles.otherInput}
            placeholder="Type your answer..."
            value={otherText}
            onChange={(_, data) => setOtherText(data.value)}
            onKeyDown={handleOtherKeyDown}
            size="small"
            autoFocus
          />
          <Button
            appearance="primary"
            icon={<Checkmark24Regular />}
            size="small"
            onClick={handleOtherSubmit}
            disabled={!otherText.trim()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatOptionChips;
