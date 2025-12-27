# Input Field System API Documentation

## Overview

The Input Field System provides a unified, consistent interface for all form input components in the TaskForce application. Built on Material-UI with TypeScript, it ensures consistent styling, behavior, and accessibility across all input fields.

## Architecture

### BaseField Component

The `BaseField` component serves as the foundation for all input field components, providing:

- **Consistent Layout**: Standardized spacing, sizing, and positioning
- **State Management**: Error, disabled, and focus states
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Theming**: Material-UI theme integration
- **Validation**: Built-in validation support

### Component Hierarchy

```
BaseField (abstract base)
├── TextInputField
├── SelectField
├── MultiSelectField
├── FreeTypeSelectField
├── CombinedLocationField
├── ImpScoreField
└── GlobalSearchField
```

## Component APIs

### Shared Props (BaseFieldProps)

All input field components inherit these common props:

```typescript
interface BaseFieldProps {
  // Identification
  id?: string
  name?: string

  // Display
  label?: string
  helperText?: string

  // State
  error?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean

  // Styling
  size?: 'small' | 'medium' | 'large'
  variant?: 'outlined' | 'filled' | 'standard'
  sx?: SxProps<Theme>
  className?: string

  // Testing
  'data-testid'?: string
}
```

### TextInputField

Basic text input component with validation and formatting support.

```typescript
interface TextInputFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string, event?: ChangeEvent) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url'
  maxLength?: number
  minLength?: number
  pattern?: string
}
```

**Usage:**
```tsx
<TextInputField
  label="Email Address"
  value={email}
  onChange={setEmail}
  type="email"
  required
  helperText="We'll never share your email"
/>
```

### SelectField

Dropdown selection component with single value support.

```typescript
interface SelectFieldProps extends BaseFieldProps {
  options: string[]
  value: string
  onChange: (value: string, event?: SelectChangeEvent) => void
  placeholder?: string
  clearable?: boolean
}
```

**Usage:**
```tsx
<SelectField
  label="Priority"
  options={['Low', 'Medium', 'High', 'Critical']}
  value={priority}
  onChange={setPriority}
  required
/>
```

### MultiSelectField

Multi-selection dropdown component.

```typescript
interface MultiSelectFieldProps extends BaseFieldProps {
  options: string[]
  value: string[]
  onChange: (value: string[], event?: any) => void
  placeholder?: string
  maxSelections?: number
  renderOption?: (props: any, option: string) => ReactNode
}
```

**Usage:**
```tsx
<MultiSelectField
  label="Tags"
  options={availableTags}
  value={selectedTags}
  onChange={setSelectedTags}
  placeholder="Select tags..."
  maxSelections={5}
/>
```

### FreeTypeSelectField

Autocomplete component allowing both selection from options and free text input.

```typescript
interface FreeTypeSelectFieldProps extends BaseFieldProps {
  options: string[]
  value: string
  onChange: (value: string, event?: any) => void
  placeholder?: string
  renderOption?: (props: any, option: string) => ReactNode
}
```

**Usage:**
```tsx
<FreeTypeSelectField
  label="Task Name"
  options={taskNames}
  value={taskName}
  onChange={setTaskName}
  placeholder="Type or select task name"
/>
```

### CombinedLocationField

Complex field combining location text input with type selection.

```typescript
interface CombinedLocationFieldProps extends BaseFieldProps {
  locationValue: string
  locationType: 'address' | 'coordinates' | 'landmark'
  onLocationValueChange: (value: string) => void
  onLocationTypeChange: (type: string) => void
}
```

**Usage:**
```tsx
<CombinedLocationField
  label="Location"
  locationValue={location}
  locationType={locationType}
  onLocationValueChange={setLocation}
  onLocationTypeChange={setLocationType}
/>
```

### ImpScoreField

Specialized numeric input for importance scores with cycling operators.

```typescript
interface ImpScoreFieldProps extends BaseFieldProps {
  condition: 'greater' | 'less' | 'equal'
  value: string
  onConditionChange: (condition: string) => void
  onValueChange: (value: string) => void
}
```

**Usage:**
```tsx
<ImpScoreField
  label="Importance Score"
  condition={condition}
  value={score}
  onConditionChange={setCondition}
  onValueChange={setScore}
/>
```

### GlobalSearchField

Advanced search field with validation and optional search button.

```typescript
interface GlobalSearchFieldProps extends BaseFieldProps {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyPress?: (event: KeyboardEvent) => void
  onSearch?: () => void
  placeholder?: string
  showSearchButton?: boolean
  validateExact?: (value: string) => boolean
  enableValidation?: boolean
  searchTooltip?: string
}
```

**Usage:**
```tsx
<GlobalSearchField
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onSearch={handleSearch}
  placeholder="Search tasks, resources, or IDs"
  showSearchButton={true}
  searchTooltip="Search across all data"
/>
```

## Import Patterns

### Centralized Imports (Recommended)

```typescript
// Import from central hub
import {
  TextInputField,
  SelectField,
  MultiSelectField,
  GlobalSearchField
} from '@/shared-ui'

// Or import specific utilities
import { useFieldSizes } from '@/shared-ui'
```

### Legacy Direct Imports (Deprecated)

```typescript
// These still work but are not recommended
import TextInputField from '@/shared-ui/text-fields/TextInputField'
import { SelectField } from '@/shared-ui/text-fields'
```

## Styling & Theming

### Consistent Sizing

All components use the `useFieldSizes` hook for consistent dimensions:

```typescript
const { INPUT_HEIGHT, MAX_WIDTH, MIN_WIDTH, FIELD_GAP } = useFieldSizes()
```

### Custom Styling

Components accept `sx` prop for custom styling:

```tsx
<TextInputField
  label="Custom Styled"
  value={value}
  onChange={setValue}
  sx={{
    '& .MuiInputBase-root': {
      backgroundColor: 'grey.100'
    }
  }}
/>
```

### Theme Integration

Components automatically respect the Material-UI theme:

```typescript
const theme = useTheme()
// Components use theme.palette, theme.spacing, etc.
```

## Accessibility

### ARIA Support

- Proper `aria-label`, `aria-describedby`, and `aria-invalid` attributes
- Screen reader announcements for errors and helper text
- Keyboard navigation support

### Focus Management

- Visible focus indicators
- Logical tab order
- Focus trapping in modals/dropdowns

### Error Handling

- Clear error messages
- Visual error indicators
- Accessible error announcements

## Best Practices

### Form Structure

```tsx
// Good: Use consistent field spacing
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  <TextInputField label="Name" value={name} onChange={setName} required />
  <SelectField label="Type" options={types} value={type} onChange={setType} />
  <GlobalSearchField
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onSearch={handleSearch}
  />
</Box>
```

### Validation

```tsx
// Good: Use built-in error states
<TextInputField
  label="Email"
  value={email}
  onChange={setEmail}
  error={!!emailError}
  helperText={emailError || "Enter your email address"}
  required
/>
```

### Performance

```tsx
// Good: Memoize expensive operations
const filteredOptions = useMemo(() =>
  options.filter(option => option.includes(searchTerm)),
  [options, searchTerm]
)

<SelectField
  label="Filtered Options"
  options={filteredOptions}
  value={value}
  onChange={setValue}
/>
```

## Migration Guide

### From Legacy Components

**Before:**
```tsx
import TextField from '@mui/material/TextField'

<TextField
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  variant="outlined"
  size="small"
/>
```

**After:**
```tsx
import { TextInputField } from '@/shared-ui'

<TextInputField
  label="Name"
  value={name}
  onChange={setName}
/>
```

### Benefits of Migration

- **Consistency**: All fields look and behave the same
- **Maintainability**: Centralized styling and behavior
- **Accessibility**: Built-in accessibility features
- **Type Safety**: Full TypeScript support
- **Performance**: Optimized rendering and state management

## Troubleshooting

### Common Issues

**Field not rendering correctly:**
- Check that required props are provided
- Ensure proper theme provider setup
- Verify import paths

**Styling not applying:**
- Use `sx` prop instead of `style`
- Check theme overrides
- Verify CSS specificity

**TypeScript errors:**
- Ensure all required props are provided
- Check prop types in component documentation
- Use proper event handler types

### Debug Mode

Enable debug mode by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm run dev
```

This provides additional console warnings and validation.