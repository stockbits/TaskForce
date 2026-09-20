import { InputAdornment } from "@mui/material";
import { ClearIcon, SearchIcon } from "@shared/icons/applicationIcons";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import TextInputField from "./TextInputField";
interface SearchFieldProperties {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  validate?: (value: string) => string | undefined;
  disabled?: boolean;
  helperText?: string;
}
export default function SearchField({
  label,
  value,
  onChange,
  onSearch,
  validate,
  disabled,
  helperText,
}: SearchFieldProperties) {
  const validationMessage = validate?.(value);

  return (
    <TextInputField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && onSearch && !validationMessage) {
          event.preventDefault();
          onSearch(value);
        }
      }}
      disabled={disabled}
      error={Boolean(validationMessage)}
      helperText={validationMessage ?? helperText}
      type="search"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <ApplicationIconButton
              label={`Clear ${label.toLowerCase()}`}
              onClick={() => onChange("")}
              disabled={disabled}
            >
              <ClearIcon />
            </ApplicationIconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
