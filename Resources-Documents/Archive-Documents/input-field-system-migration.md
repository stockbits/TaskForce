# Input Field System Migration Guide

## Overview

This guide helps you migrate from individual Material-UI components and legacy field implementations to the unified Input Field System. The migration provides better consistency, maintainability, and user experience.

## Migration Benefits

### ✅ What You Gain
- **Consistent UI**: All fields look and behave identically
- **Centralized Control**: Single source of truth for styling and behavior
- **Better Accessibility**: Built-in ARIA support and keyboard navigation
- **Type Safety**: Full TypeScript support with proper interfaces
- **Performance**: Optimized rendering and state management
- **Maintainability**: Easier updates and bug fixes

### ⚠️ Breaking Changes
- Import paths change from direct component imports to centralized imports
- Some prop names and behaviors may differ slightly
- Custom styling approaches need adjustment

## Migration Steps

### Step 1: Update Imports

**Before:**
```tsx
// Direct component imports
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'

// Legacy field imports
import CustomTextField from '@/components/CustomTextField'
import SearchField from '@/components/SearchField'
```

**After:**
```tsx
// Centralized imports (recommended)
import {
  TextInputField,
  SelectField,
  MultiSelectField,
  GlobalSearchField
} from '@/shared-ui'

// Or import with namespace
import { textFields } from '@/shared-ui'
const { TextInputField, SelectField } = textFields
```

### Step 2: Component Mapping

#### TextField → TextInputField

**Before:**
```tsx
<TextField
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  variant="outlined"
  size="small"
  required
  error={!!error}
  helperText={error}
/>
```

**After:**
```tsx
<TextInputField
  label="Name"
  value={name}
  onChange={setName}
  required
  error={!!error}
  helperText={error}
/>
```

**Key Changes:**
- `onChange` receives the value directly instead of the event
- `variant` and `size` are handled automatically
- All other props work the same way

#### Select + MenuItem → SelectField

**Before:**
```tsx
<FormControl fullWidth size="small">
  <InputLabel>Priority</InputLabel>
  <Select
    value={priority}
    onChange={(e) => setPriority(e.target.value)}
    label="Priority"
  >
    <MenuItem value="low">Low</MenuItem>
    <MenuItem value="medium">Medium</MenuItem>
    <MenuItem value="high">High</MenuItem>
  </Select>
</FormControl>
```

**After:**
```tsx
<SelectField
  label="Priority"
  options={['Low', 'Medium', 'High']}
  value={priority}
  onChange={setPriority}
/>
```

**Key Changes:**
- Options passed as string array instead of MenuItem components
- No need for FormControl wrapper
- Automatic sizing and styling

#### Autocomplete → MultiSelectField or FreeTypeSelectField

**Before:**
```tsx
<Autocomplete
  multiple
  options={tags}
  value={selectedTags}
  onChange={(e, value) => setSelectedTags(value)}
  renderInput={(params) => (
    <TextField {...params} label="Tags" size="small" />
  )}
/>
```

**After:**
```tsx
<MultiSelectField
  label="Tags"
  options={tags}
  value={selectedTags}
  onChange={setSelectedTags}
/>
```

**Key Changes:**
- Simplified API with automatic rendering
- Consistent styling with other fields

### Step 3: Handle Custom Components

#### Search Fields

**Before:**
```tsx
const CustomSearchField = ({ onSearch, ...props }) => (
  <TextField
    {...props}
    onKeyPress={(e) => {
      if (e.key === 'Enter') onSearch()
    }}
    InputProps={{
      endAdornment: (
        <IconButton onClick={onSearch}>
          <SearchIcon />
        </IconButton>
      )
    }}
  />
)
```

**After:**
```tsx
// Use GlobalSearchField directly
<GlobalSearchField
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onSearch={handleSearch}
  showSearchButton={true}
/>
```

#### Complex Fields

**Before:**
```tsx
const LocationField = () => {
  const [type, setType] = useState('address')
  const [value, setValue] = useState('')

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter location"
        size="small"
      />
      <Select
        value={type}
        onChange={(e) => setType(e.target.value)}
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="address">Address</MenuItem>
        <MenuItem value="coordinates">Coordinates</MenuItem>
      </Select>
    </Box>
  )
}
```

**After:**
```tsx
// Use CombinedLocationField
<CombinedLocationField
  label="Location"
  locationValue={locationValue}
  locationType={locationType}
  onLocationValueChange={setLocationValue}
  onLocationTypeChange={setLocationType}
/>
```

### Step 4: Update Styling

#### Custom Styles

**Before:**
```tsx
<TextField
  sx={{
    '& .MuiInputBase-root': {
      backgroundColor: 'grey.100'
    },
    width: 300
  }}
/>
```

**After:**
```tsx
<TextInputField
  sx={{
    '& .MuiInputBase-root': {
      backgroundColor: 'grey.100'
    },
    width: 300
  }}
/>
```

**Note:** Custom styles work the same way, but you may need to adjust selectors.

#### Size Overrides

**Before:**
```tsx
<TextField size="small" />
```

**After:**
```tsx
// Size is handled automatically, but you can override if needed
<TextInputField size="small" />
```

### Step 5: Update Event Handlers

#### onChange Handlers

**Before:**
```tsx
const handleChange = (e) => {
  setValue(e.target.value)
}
```

**After:**
```tsx
// For TextInputField, SelectField, etc.
const handleChange = (value) => {
  setValue(value)
}

// For GlobalSearchField (keeps event-based API)
const handleChange = (e) => {
  setValue(e.target.value)
}
```

#### Form Integration

**Before:**
```tsx
const handleSubmit = (e) => {
  e.preventDefault()
  const formData = {
    name: nameValue,
    email: emailValue,
    priority: priorityValue
  }
}
```

**After:**
```tsx
// No changes needed - components work the same in forms
const handleSubmit = (e) => {
  e.preventDefault()
  const formData = {
    name: nameValue,
    email: emailValue,
    priority: priorityValue
  }
}
```

## Common Migration Patterns

### Pattern 1: Simple Field Replacement

```tsx
// Before
<TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />

// After
<TextInputField label="Name" value={name} onChange={setName} />
```

### Pattern 2: Select Field Replacement

```tsx
// Before
<Select value={value} onChange={(e) => setValue(e.target.value)}>
  <MenuItem value="a">A</MenuItem>
  <MenuItem value="b">B</MenuItem>
</Select>

// After
<SelectField options={['A', 'B']} value={value} onChange={setValue} />
```

### Pattern 3: Form with Validation

```tsx
// Before
const [errors, setErrors] = useState({})
<TextField
  error={!!errors.name}
  helperText={errors.name}
  // ... other props
/>

// After
const [errors, setErrors] = useState({})
<TextInputField
  error={!!errors.name}
  helperText={errors.name}
  // ... other props (same as before)
/>
```

### Pattern 4: Search Functionality

```tsx
// Before
const [search, setSearch] = useState('')
<TextField
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
  InputProps={{
    endAdornment: <IconButton onClick={handleSearch}><Search /></IconButton>
  }}
/>

// After
const [search, setSearch] = useState('')
<GlobalSearchField
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onSearch={handleSearch}
  showSearchButton={true}
/>
```

## Testing Migration

### Update Test Imports

```tsx
// Before
import TextField from '@mui/material/TextField'

// After
import { TextInputField } from '@/shared-ui'
```

### Update Test Assertions

```tsx
// Before
expect(screen.getByRole('textbox')).toHaveValue('test')

// After
// Same assertions work - components render the same elements
expect(screen.getByRole('textbox')).toHaveValue('test')
```

## Troubleshooting

### Import Errors

**Problem:** `Module '"@/shared-ui"' has no exported member`

**Solution:** Check that the component is properly exported in `src/shared-ui/index.ts`

### Type Errors

**Problem:** Type mismatch in onChange handlers

**Solution:** Update handlers to match the new API:
- `TextInputField`, `SelectField`: `(value: string) => void`
- `GlobalSearchField`: `(event: ChangeEvent) => void`

### Styling Issues

**Problem:** Custom styles not applying

**Solution:** Use the `sx` prop and check CSS specificity. The component structure may have changed.

### Validation Issues

**Problem:** Form validation not working

**Solution:** The `error` and `helperText` props work the same way. Check your validation logic.

## Rollback Plan

If you need to rollback a migration:

1. Revert import changes
2. Restore original component usage
3. Test functionality
4. Plan smaller, incremental migrations

## Support

### Getting Help

- Check the [API Documentation](./input-field-system-api.md)
- Review [Usage Examples](./input-field-system-examples.md)
- Test components in isolation first
- Migrate one component type at a time

### Best Practices

1. **Test Thoroughly**: Each migrated component should be tested in its usage context
2. **Migrate Incrementally**: Don't migrate all components at once
3. **Update Tests**: Ensure test suites pass after migration
4. **Document Changes**: Keep track of any custom behavior that needs preservation

## Success Metrics

After migration, you should see:

- ✅ Consistent field appearance across the application
- ✅ Improved accessibility compliance
- ✅ Better TypeScript support
- ✅ Easier maintenance and updates
- ✅ Enhanced user experience

## Next Steps

1. Start with simple `TextInputField` replacements
2. Move to `SelectField` conversions
3. Tackle complex fields like `GlobalSearchField`
4. Update custom components to use the new system
5. Remove legacy component files once fully migrated