import React, { useState, useMemo } from "react";
import { Autocomplete, Box, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import useFieldSizes from './useFieldSizes';

type OptionItem = string | { label: string; value: string };

interface SingleSelectFieldProps {
  label: string;
  options: OptionItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  renderOption?: (props: any, option: OptionItem) => React.ReactNode;
  wrapperSx?: any;
  [key: string]: any;
}


// DEFAULT_WRAPPER_SX will be created inside the component using theme-backed sizes

const SingleSelectField: React.FC<SingleSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  inputValue: controlledInputValue,
  onInputChange,
  renderOption,
  wrapperSx,
  ...rest
}) => {
  const [internalInput, setInternalInput] = useState("");
  const inputValue = controlledInputValue !== undefined ? controlledInputValue : internalInput;

  const { INPUT_HEIGHT, CHIP_SIZE, MAX_WIDTH, MIN_WIDTH } = useFieldSizes();

  const DEFAULT_WRAPPER_SX = {
    maxWidth: MAX_WIDTH,
    minWidth: MIN_WIDTH,
    px: 1,
    display: "flex",
    alignItems: "center",
    minHeight: INPUT_HEIGHT,
    flex: "0 0 auto",
    '& .MuiInputBase-root': { minHeight: INPUT_HEIGHT },
    '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: INPUT_HEIGHT },
    '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0, transition: 'all 120ms ease' },
  } as const;

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      return label.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  // Placeholder uses only the header `label` now.

  const handleInputChange = (_e: any, newInput: string) => {
    if (controlledInputValue === undefined) setInternalInput(newInput);
    onInputChange?.(newInput);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start', ...(wrapperSx ?? DEFAULT_WRAPPER_SX) }}>
      <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
      <Autocomplete
      componentsProps={{ popper: { style: { zIndex: 13000 } } }}
      disableClearable
      options={filteredOptions}
      value={
        (() => {
          if (value == null) return undefined;
          const found = options.find((opt) => (typeof opt === 'string' ? opt === value : opt.value === value));
          return found ?? undefined;
        })()
      }
      onChange={(_e, newValue) => {
        if (newValue == null) {
          onChange(null);
          return;
        }
        const out = typeof newValue === 'string' ? newValue : newValue.value;
        onChange(out);
      }}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      renderOption={renderOption ?? ((props, option: OptionItem) => (
        <ListItem {...props} dense>
          <ListItemText primary={typeof option === 'string' ? option : option.label} />
        </ListItem>
      ))}
      renderInput={(params) => {
        const endAdornment = (
          <>
            {params.InputProps.endAdornment}
          </>
        );

        return (
          <TextField
            {...params}
            placeholder=""
            size="small"
            required={required}
            aria-label={label}
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { height: INPUT_HEIGHT, transition: 'all 120ms ease', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: `${CHIP_SIZE}px` } },
            }}
          />
        );
      }}
      ListboxProps={{ sx: { zIndex: 2000, maxHeight: 320 } }}
      sx={{ width: '90ch', '& .MuiAutocomplete-inputRoot': { minHeight: INPUT_HEIGHT, maxHeight: INPUT_HEIGHT, alignItems: 'center', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: `${CHIP_SIZE}px` } } }}
      {...rest}
    />
    </Box>
  );
};

export default SingleSelectField;
