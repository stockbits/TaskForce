import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BaseField from '../base/BaseField';
import { BaseFieldProps } from '../types';
import useFieldSizes from '../utils/useFieldSizes';
import mockTasks from '@/Database Models/Task - Model.json';
import ResourceMock from '@/Database Models/Resource - Model.json';
import { SimpleTooltip } from '@/shared-ui';

interface GlobalSearchFieldProps extends BaseFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  showSearchButton?: boolean;
  validateExact?: (value: string) => boolean;
  enableValidation?: boolean;
  searchTooltip?: string;
}

const GlobalSearchField = React.forwardRef<HTMLInputElement, GlobalSearchFieldProps>(function GlobalSearchField(props, ref) {
  const {
    value,
    onChange,
    onKeyPress,
    onSearch,
    placeholder = "Search tasks...",
    showSearchButton = false,
    validateExact,
    enableValidation = true,
    searchTooltip,
    label,
    sx,
    error: externalError,
    ...baseFieldProps
  } = props;

  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();
  const [internalError, setInternalError] = React.useState<boolean>(false);

  // Combine internal and external error states
  const hasError = internalError || externalError;

  // Default validation function for exact matches
  const defaultValidateExact = (v: string) => {
    const q = String(v || '').trim().toLowerCase();
    if (!q) return false;

    const tasks = mockTasks as any[];
    const resources = (ResourceMock as any[]) || [];

    const foundInTasks = tasks.some((t) => {
      return (
        (t.taskId && String(t.taskId).toLowerCase() === q) ||
        (t.workId && String(t.workId).toLowerCase() === q) ||
        (t.estimateNumber && String(t.estimateNumber).toLowerCase() === q) ||
        (t.employeeId && String(t.employeeId).toLowerCase() === q)
      );
    });
    if (foundInTasks) return true;

    const foundInResources = resources.some((r) => r.resourceId && String(r.resourceId).toLowerCase() === q);
    return foundInResources;
  };

  // Use provided validation function or default if enableValidation is true
  const validationFunction = validateExact || (enableValidation ? defaultValidateExact : undefined);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      if (validationFunction && !validationFunction(value)) {
        setInternalError(true);
        return;
      }
      onSearch();
    }
    onKeyPress?.(e);
  };

  const endAdornment = (
    <InputAdornment position="end">
      {showSearchButton && onSearch && (
        <SimpleTooltip title={searchTooltip}>
          <IconButton
            size="small"
            onClick={() => {
              if (validationFunction && !validationFunction(value)) {
                setInternalError(true);
                return;
              }
              onSearch?.();
            }}
            sx={{ mr: 0.5 }}
            aria-label="search"
          >
            <SearchIcon style={{ fontSize: 16 }} />
          </IconButton>
        </SimpleTooltip>
      )}
    </InputAdornment>
  );

  return (
    <BaseField
      label={label}
      sx={{
        minWidth: '28ch',
        width: 'fit-content',
        maxWidth: { xs: '100%', sm: '90ch' },
        ...sx
      }}
      error={hasError}
      {...baseFieldProps}
    >
      <TextField
        name="taskSearch"
        value={value}
        onChange={(e) => {
          onChange(e);
          if (internalError) setInternalError(false);
        }}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        size="small"
        sx={{
          minWidth: '28ch',
          width: 'fit-content',
          '& input::placeholder': { color: 'text.secondary' },
          '& .MuiInputBase-input': {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: 13,
            lineHeight: `${CHIP_SIZE}px`
          },
          height: INPUT_HEIGHT,
          maxWidth: { xs: '100%', sm: '90ch' }
        }}
        error={hasError}
        InputProps={{
          // Avoid duplicate icons when an explicit search button exists
          startAdornment: showSearchButton ? undefined : (
            <InputAdornment position="start">
              <SearchIcon style={{ fontSize: 16 }} />
            </InputAdornment>
          ),
          endAdornment,
          style: { height: INPUT_HEIGHT }
        }}
        inputRef={ref}
      />
    </BaseField>
  );
});

export default GlobalSearchField;
