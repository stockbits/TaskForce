import { Box } from "@mui/material";
import DropdownField from "@shared/components/fields/DropdownField";
import TextInputField from "@shared/components/fields/TextInputField";
import type { SelectionOption } from "@shared/components/fields/SelectionField";

export interface LocationCriterionValue {
  criterionIdentifier: string;
  location: string;
}

export interface LocationCriterionFieldProperties {
  criterionOptions: SelectionOption[];
  value: LocationCriterionValue;
  onChange: (value: LocationCriterionValue) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function LocationCriterionField({
  criterionOptions,
  value,
  onChange,
  disabled,
  error,
  helperText,
}: LocationCriterionFieldProperties) {
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
        label="Location criterion"
        options={criterionOptions}
        value={value.criterionIdentifier}
        onChange={(criterionIdentifier) =>
          onChange({ ...value, criterionIdentifier })
        }
        disabled={disabled}
      />
      <TextInputField
        label="Location value"
        value={value.location}
        onChange={(event) =>
          onChange({ ...value, location: event.target.value })
        }
        disabled={disabled}
        error={error}
        helperText={helperText}
      />
    </Box>
  );
}
