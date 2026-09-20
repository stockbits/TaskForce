import { Box } from "@mui/material";
import TextInputField from "./TextInputField";

export interface DateTimeRangeValue {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface DateTimeRangeFieldProperties {
  value: DateTimeRangeValue;
  onChange: (value: DateTimeRangeValue) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function DateTimeRangeField({
  value,
  onChange,
  disabled,
  error,
  helperText,
}: DateTimeRangeFieldProperties) {
  function updateValue<Key extends keyof DateTimeRangeValue>(
    key: Key,
    nextValue: DateTimeRangeValue[Key],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
        },
        gap: 3,
        minWidth: 0,
      }}
    >
      <TextInputField
        label="Start date"
        type="date"
        value={value.startDate}
        onChange={(event) => updateValue("startDate", event.target.value)}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputLabelProps={{ shrink: true }}
      />
      <TextInputField
        label="Start time"
        type="time"
        value={value.startTime}
        onChange={(event) => updateValue("startTime", event.target.value)}
        disabled={disabled}
        error={error}
        InputLabelProps={{ shrink: true }}
      />
      <TextInputField
        label="End date"
        type="date"
        value={value.endDate}
        onChange={(event) => updateValue("endDate", event.target.value)}
        disabled={disabled}
        error={error}
        InputLabelProps={{ shrink: true }}
      />
      <TextInputField
        label="End time"
        type="time"
        value={value.endTime}
        onChange={(event) => updateValue("endTime", event.target.value)}
        disabled={disabled}
        error={error}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}
