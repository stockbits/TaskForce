import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { SxProps, Theme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import useFieldSizes from './useFieldSizes';
import mockTasks from '@/data/mockTasks.json';
import ResourceMock from '@/data/ResourceMock.json';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearch?: () => void;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  name?: string;
  showSearchButton?: boolean;
  validateExact?: (value: string) => boolean;
  enableValidation?: boolean;
  searchTooltip?: string;
} & Partial<TextFieldProps>;

const GlobalSearchField = React.forwardRef<HTMLInputElement, Props>(function GlobalSearchField(props, ref) {
  const {
    value,
    onChange,
    onKeyPress,
    onSearch,
    size = 'small',
    sx = {},
    name = 'taskSearch',
    showSearchButton = false,
    validateExact,
    enableValidation = true,
    searchTooltip,
    ...rest
  } = props;

  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();
  const [error, setError] = React.useState<boolean>(false);

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
        setError(true);
        return;
      }
      onSearch();
    }
    onKeyPress?.(e);
  };

  const endAdornment = (
    <InputAdornment position="end">
      {showSearchButton && onSearch && (
        <Tooltip title={searchTooltip} arrow>
          <IconButton
            size="small"
            onClick={() => {
              if (validationFunction && !validationFunction(value)) {
                setError(true);
                return;
              }
              onSearch?.();
            }}
            sx={{ mr: 0.5 }}
            aria-label="search"
          >
            <SearchIcon style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </InputAdornment>
  );

  return (
    <Box
      sx={{
        minWidth: '28ch',
        width: 'fit-content',
        maxWidth: { xs: '100%', sm: '90ch' },
        ...sx
      }}
    >
      <TextField
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e);
          if (error) setError(false);
        }}
        onKeyPress={handleKeyPress}
        placeholder="Search tasks..."
        size={size}
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
        error={error}
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
        {...rest}
      />
    </Box>
  );
});

export default GlobalSearchField;
