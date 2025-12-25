import React, { useState, forwardRef } from 'react';
import { TextField, InputAdornment, IconButton, Menu, MenuItem } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BaseField from '../base/BaseField';
import { BaseFieldProps } from '../types';
import useFieldSizes from '../utils/useFieldSizes';

interface CombinedLocationFieldProps extends BaseFieldProps {
  /** Location type (postCode, location, groupCode) */
  locationType: string;
  /** Location value */
  locationValue: string;
  /** Type change handler */
  onTypeChange: (value: string) => void;
  /** Value change handler */
  onValueChange: (value: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'postCode', label: 'Postcode' },
  { value: 'location', label: 'Location' },
  { value: 'groupCode', label: 'Group Code' },
];

const CombinedLocationField = forwardRef<HTMLInputElement, CombinedLocationFieldProps>(({
  locationType,
  locationValue,
  onTypeChange,
  onValueChange,
  ...baseProps
}, ref) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { MAX_WIDTH, MIN_WIDTH, INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();

  const handleIconClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTypeSelect = (value: string) => {
    onTypeChange(value);
    setAnchorEl(null);
  };

  return (
    <>
      <BaseField {...baseProps}>
        <TextField
          ref={ref}
          size="small"
          value={locationValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder=""
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton size="small" onClick={handleIconClick} sx={{ p: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: { height: INPUT_HEIGHT }
          }}
          sx={{ '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, fontSize: 13, lineHeight: `${CHIP_SIZE}px` }, height: INPUT_HEIGHT, maxWidth: MAX_WIDTH, minWidth: MIN_WIDTH }}
        />
      </BaseField>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{ zIndex: 13000 }}
      >
        {TYPE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === locationType}
            onClick={() => handleTypeSelect(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

CombinedLocationField.displayName = 'CombinedLocationField';

export default CombinedLocationField;