import { Box } from "@mui/material";
import DropdownField from "@shared/components/fields/DropdownField";
import TextInputField from "@shared/components/fields/TextInputField";
import type { SelectionOption } from "@shared/components/fields/SelectionField";

export type ImportanceScoreCondition =
  "greater-than" | "equal-to" | "less-than";

export interface ImportanceScoreValue {
  condition: ImportanceScoreCondition;
  score: number | null;
}

export interface ImportanceScoreFieldProperties {
  value: ImportanceScoreValue;
  onChange: (value: ImportanceScoreValue) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const importanceScoreConditions: SelectionOption[] = [
  { identifier: "greater-than", label: "Greater than" },
  { identifier: "equal-to", label: "Equal to" },
  { identifier: "less-than", label: "Less than" },
];

export default function ImportanceScoreField({
  value,
  onChange,
  disabled,
  error,
  helperText,
}: ImportanceScoreFieldProperties) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "minmax(10rem, 0.8fr) minmax(0, 1fr)",
        },
        gap: 3,
        minWidth: 0,
      }}
    >
      <DropdownField
        label="Score condition"
        options={importanceScoreConditions}
        value={value.condition}
        onChange={(condition) =>
          onChange({
            ...value,
            condition: condition as ImportanceScoreCondition,
          })
        }
        disabled={disabled}
      />
      <TextInputField
        label="Importance score"
        type="number"
        value={value.score ?? ""}
        onChange={(event) =>
          onChange({
            ...value,
            score:
              event.target.value === "" ? null : Number(event.target.value),
          })
        }
        disabled={disabled}
        error={error}
        helperText={helperText}
        inputProps={{ min: 0, max: 999, inputMode: "numeric" }}
      />
    </Box>
  );
}
