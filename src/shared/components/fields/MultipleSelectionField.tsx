import { useId, useMemo, useState } from "react";
import {
  Autocomplete,
  Button,
  Checkbox,
  Stack,
  TextField,
  createFilterOptions,
} from "@mui/material";
import type { SelectionOption } from "./SelectionField";

export interface MultipleSelectionFieldProperties {
  label: string;
  options: SelectionOption[];
  value: SelectionOption[];
  onChange: (value: SelectionOption[]) => void;
  maximumSelections?: number;
  showFilteredSelectionActions?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const filterSelectionOptions = createFilterOptions<SelectionOption>();

export default function MultipleSelectionField({
  label,
  options,
  value,
  onChange,
  maximumSelections,
  showFilteredSelectionActions = true,
  disabled,
  error,
  helperText,
}: MultipleSelectionFieldProperties) {
  const identifier = useId();
  const [inputValue, setInputValue] = useState("");
  const filteredOptions = useMemo(
    () =>
      filterSelectionOptions(options, {
        inputValue,
        getOptionLabel: (option) => option.label,
      }),
    [inputValue, options],
  );
  const selectionLimitReached =
    maximumSelections !== undefined && value.length >= maximumSelections;
  const selectedIdentifiers = useMemo(
    () => new Set(value.map((option) => option.identifier)),
    [value],
  );

  function selectFilteredOptions() {
    const additions = filteredOptions.filter(
      (option) =>
        !option.disabled && !selectedIdentifiers.has(option.identifier),
    );
    const nextValue = [...value, ...additions];
    onChange(
      maximumSelections === undefined
        ? nextValue
        : nextValue.slice(0, maximumSelections),
    );
  }

  function clearFilteredOptions() {
    const filteredIdentifiers = new Set(
      filteredOptions.map((option) => option.identifier),
    );
    onChange(
      value.filter((option) => !filteredIdentifiers.has(option.identifier)),
    );
  }

  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Autocomplete
        id={identifier}
        multiple
        fullWidth
        disableCloseOnSelect
        options={options}
        value={value}
        inputValue={inputValue}
        disabled={disabled}
        onInputChange={(_event, nextInputValue) =>
          setInputValue(nextInputValue)
        }
        onChange={(_event, selection) =>
          onChange(
            maximumSelections === undefined
              ? selection
              : selection.slice(0, maximumSelections),
          )
        }
        isOptionEqualToValue={(option, selection) =>
          option.identifier === selection.identifier
        }
        getOptionLabel={(option) => option.label}
        getOptionDisabled={(option) =>
          Boolean(option.disabled) ||
          (selectionLimitReached && !selectedIdentifiers.has(option.identifier))
        }
        renderOption={(properties, option, state) => (
          <li {...properties} key={option.identifier}>
            <Checkbox checked={state.selected} sx={{ mr: 1 }} />
            {option.label}
          </li>
        )}
        sx={{
          "& .MuiChip-root": {
            maxWidth: "100%",
            height: "auto",
            minHeight: 32,
          },
          "& .MuiChip-label": {
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            py: 1,
          },
        }}
        renderInput={(parameters) => (
          <TextField
            {...parameters}
            label={label}
            error={error}
            helperText={
              maximumSelections === undefined
                ? helperText
                : `${helperText ? `${helperText} ` : ""}${value.length} of ${maximumSelections} selected.`
            }
          />
        )}
      />
      {showFilteredSelectionActions && !disabled ? (
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
          <Button
            size="small"
            onClick={selectFilteredOptions}
            disabled={selectionLimitReached || filteredOptions.length === 0}
          >
            Select filtered
          </Button>
          <Button
            size="small"
            onClick={clearFilteredOptions}
            disabled={
              !filteredOptions.some((option) =>
                selectedIdentifiers.has(option.identifier),
              )
            }
          >
            Clear filtered
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
