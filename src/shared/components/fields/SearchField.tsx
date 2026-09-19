import { InputAdornment } from "@mui/material";
import { ClearIcon, SearchIcon } from "@shared/icons/applicationIcons";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import TextInputField from "./TextInputField";
interface SearchFieldProperties {
  label: string;
  value: string;
  onChange: (value: string) => void;
}
export default function SearchField({
  label,
  value,
  onChange,
}: SearchFieldProperties) {
  return (
    <TextInputField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
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
            >
              <ClearIcon />
            </ApplicationIconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
