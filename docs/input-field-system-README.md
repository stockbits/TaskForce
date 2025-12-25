# Input Field System - TaskForce

A comprehensive, unified input field system for the TaskForce application built on React, TypeScript, and Material-UI.

## 🎯 Overview

The Input Field System provides consistent, accessible, and maintainable form components with a unified API. All field types share common behavior, styling, and accessibility features while maintaining specialized functionality where needed.

## 📦 Quick Start

```bash
# Import from centralized location
import {
  TextInputField,
  SelectField,
  MultiSelectField,
  GlobalSearchField
} from '@/shared-ui'

# Use in your components
<TextInputField
  label="Task Name"
  value={taskName}
  onChange={setTaskName}
  required
/>
```

## 🏗️ Architecture

### Core Components

- **`BaseField`**: Abstract foundation providing layout, state management, and accessibility
- **`TextInputField`**: Basic text input with validation
- **`SelectField`**: Single-selection dropdown
- **`MultiSelectField`**: Multi-selection dropdown
- **`FreeTypeSelectField`**: Autocomplete with free text input
- **`CombinedLocationField`**: Complex location input with type selection
- **`ImpScoreField`**: Numeric input with cycling operators
- **`GlobalSearchField`**: Advanced search with validation

### Key Features

- ✅ **Consistent UI**: Unified appearance and behavior
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Performance**: Optimized rendering and bundle size
- ✅ **Maintainable**: Centralized styling and logic

## 📚 Documentation

- **[API Reference](./input-field-system-api.md)**: Complete component documentation
- **[Usage Examples](./input-field-system-examples.md)**: Practical implementation patterns
- **[Migration Guide](./input-field-system-migration.md)**: Transition from legacy components
- **[Performance Report](./input-field-system-performance.md)**: Benchmarks and metrics

## 🚀 Usage Examples

### Basic Form
```tsx
import { TextInputField, SelectField } from '@/shared-ui'

function TaskForm() {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('')

  return (
    <div>
      <TextInputField
        label="Task Title"
        value={title}
        onChange={setTitle}
        required
      />
      <SelectField
        label="Priority"
        options={['Low', 'Medium', 'High']}
        value={priority}
        onChange={setPriority}
      />
    </div>
  )
}
```

### Advanced Search
```tsx
import { GlobalSearchField } from '@/shared-ui'

function SearchPanel() {
  return (
    <GlobalSearchField
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onSearch={handleSearch}
      placeholder="Search tasks and resources"
      showSearchButton={true}
    />
  )
}
```

## 🔧 Development

### Project Structure

```
src/shared-ui/text-fields/
├── base/
│   ├── BaseField.tsx          # Foundation component
│   ├── FieldContainer.tsx     # Layout wrapper
│   ├── FieldLabel.tsx         # Label component
│   └── index.ts              # Base exports
├── TextInputField.tsx        # Basic text input
├── SelectField.tsx           # Single select
├── MultiSelectField.tsx      # Multi select
├── FreeTypeSelectField.tsx   # Autocomplete
├── CombinedLocationField.tsx # Complex location field
├── ImpScoreField.tsx         # Numeric with operators
├── GlobalSearchField.tsx     # Advanced search
├── types.ts                  # TypeScript interfaces
├── useFieldSizes.ts          # Sizing utilities
└── index.ts                  # Component exports
```

### Building

```bash
npm run build    # Production build
npm run lint     # Code quality check
```

### Testing

```bash
npm run test     # Run test suite
npm run test:ui  # Interactive test UI
```

## 📊 Performance

- **Bundle Size**: ~15-20 KB (all components)
- **Render Time**: <3ms per component
- **Accessibility**: WCAG 2.1 AA compliant
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🤝 Contributing

1. Follow the established patterns in existing components
2. Maintain TypeScript strict mode compliance
3. Ensure accessibility standards are met
4. Add comprehensive documentation
5. Test across supported browsers

## 📄 License

This project is part of the TaskForce application. See main project license for details.

## 🙋 Support

- Check the [API Documentation](./input-field-system-api.md)
- Review [Usage Examples](./input-field-system-examples.md)
- See [Migration Guide](./input-field-system-migration.md) for transition help

---

**Built with ❤️ for the TaskForce team**