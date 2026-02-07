import * as React from "react";
import { Dropdown, Option, SpinButton, Label, Switch, makeStyles, tokens } from "@fluentui/react-components";
import type { SpinButtonChangeEvent, SpinButtonOnChangeData } from "@fluentui/react-components";

export type Tone = "professional" | "casual" | "academic";

interface OptionsRowProps {
  slideCount: number;
  onSlideCountChange: (count: number) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  showSlideNumber?: boolean;
  onShowSlideNumberChange?: (enabled: boolean) => void;
}

const useStyles = makeStyles({
  row: {
    display: "flex",
    gap: "12px",
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingTop: "12px",
    alignItems: "end",
    flexWrap: "wrap",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: "1",
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  switchField: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "4px",
  },
});

const OptionsRow: React.FC<OptionsRowProps> = (props: OptionsRowProps) => {
  const { slideCount, onSlideCountChange, tone, onToneChange, showSlideNumber, onShowSlideNumberChange } = props;
  const styles = useStyles();

  const handleSlideCountChange = (_ev: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
    if (data.value !== undefined && data.value !== null) {
      onSlideCountChange(Math.min(10, Math.max(1, data.value)));
    }
  };

  const handleToneChange = (_ev: unknown, data: { optionValue?: string }) => {
    if (data.optionValue) {
      onToneChange(data.optionValue as Tone);
    }
  };

  return (
    <div className={styles.row}>
      <div className={styles.field}>
        <Label className={styles.label}>Slides</Label>
        <SpinButton value={slideCount} min={1} max={10} onChange={handleSlideCountChange} />
      </div>
      <div className={styles.field}>
        <Label className={styles.label}>Tone</Label>
        <Dropdown value={tone.charAt(0).toUpperCase() + tone.slice(1)} onOptionSelect={handleToneChange}>
          <Option value="professional">Professional</Option>
          <Option value="casual">Casual</Option>
          <Option value="academic">Academic</Option>
        </Dropdown>
      </div>
      {onShowSlideNumberChange && (
        <div className={styles.switchField}>
          <Switch
            checked={showSlideNumber}
            onChange={(_ev, data) => onShowSlideNumberChange(data.checked)}
            label="Track slide"
          />
        </div>
      )}
    </div>
  );
};

export default OptionsRow;
