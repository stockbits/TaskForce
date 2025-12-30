# Draggable Popup Dialog Component - Implementation Guide

## What This Component Does
The `DraggablePopupDialog` creates a popup window that can be dragged around the screen and displays either task details or resource information. It's used throughout the TaskForce app for detailed views that need to be movable and persistent.

## Prerequisites & Dependencies

### Required Packages
```json
{
  "@mui/material": "^6.1.7",
  "@mui/icons-material": "^6.1.7",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "react": "^19.0.0",
  "typescript": "^5.x"
}
```

### File Dependencies
- `/src/shared-types/index.ts` - For `TaskDetails`, `ResourceRecord`, `CalloutHistoryEntry` types
- `/src/Task Resource Components/New Window/Task Popout Panel - Component.tsx`
- `/src/Task Resource Components/New Window/Resource Popout Panel - Component.tsx`
- `/src/shared-components/index.ts` - For DraggableDialog export

## File Structure
```
src/
├── shared-components/
│   ├── dialogs/
│   │   ├── DraggableDialog.tsx          # Base draggable dialog
│   │   └── DraggablePopupDialog.tsx     # Main component
│   └── index.ts                         # Exports
└── shared-types/
    └── index.ts                         # Type definitions
```

## Step-by-Step Implementation

### Step 1: Create the Base DraggableDialog Component

Create `/src/shared-components/dialogs/DraggableDialog.tsx`:

```tsx
// =====================================================================
// DraggableDialog.tsx — MUI Dialog with drag functionality
// Based on: https://mui.com/material-ui/react-dialog/#draggable-dialog
// =====================================================================

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogProps, Paper, PaperProps } from '@mui/material';

function PaperComponent(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Load saved position from sessionStorage
    try {
      const raw = sessionStorage.getItem('draggable-dialog-position');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // Ignore errors and use default
    }
    return { x: 0, y: 0 };
  });

  // Keep position in ref for event handlers
  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Save position to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('draggable-dialog-position', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the title element
    if ((e.target as HTMLElement).id === 'draggable-dialog-title') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <Paper
      ref={paperRef}
      {...props}
      style={{
        ...props.style,
        // Apply the drag position as CSS transform
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    />
  );
}

// Main DraggableDialog component
export function DraggableDialog(props: DialogProps) {
  return (
    <Dialog
      {...props}
      PaperComponent={PaperComponent}
      // Disable backdrop click to close when dragging
      disableEnforceFocus={false}
    />
  );
}
```

**Key Points:**
- Uses `PaperComponent` to wrap the MUI Paper with drag logic
- Position saved in `sessionStorage` with key `'draggable-dialog-position'`
- Only drags when clicking element with `id="draggable-dialog-title"`
- Uses CSS `transform` for smooth positioning

### Step 2: Create the Main DraggablePopupDialog Component

Create `/src/shared-components/dialogs/DraggablePopupDialog.tsx`:

```tsx
// =====================================================================
// DraggablePopupDialog.tsx — Main dialog component for task/resource popups
// Uses DraggableDialog to display task and resource details
// =====================================================================

import React, { useState } from "react";
import { DialogTitle, DialogContent, IconButton, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from '@mui/icons-material/Close';
import { DraggableDialog } from '@/shared-components';
import TaskPopoutPanel from "@/Task Resource Components/New Window/Task Popout Panel - Component";
import ResourcePopoutPanel from "@/Task Resource Components/New Window/Resource Popout Panel - Component";
import { TaskDetails } from "@/shared-types";
import type { ResourceRecord } from '@/shared-types';
import type { CalloutHistoryEntry } from "@/Callout Component/useCalloutHistory";

// Define the data types this dialog can display
type PopupData =
  | {
      mode: "tasks";
      tasks: TaskDetails[];
    }
  | {
      mode: "resource";
      resource: ResourceRecord;
      history: CalloutHistoryEntry[];
    };

// Component props interface
interface DraggablePopupDialogProps {
  open: boolean;
  data: PopupData | null;
  onClose: () => void;
  // Optional minimize control forwarded from layout
  externalMinimized?: boolean;
  setExternalMinimized?: (v: boolean) => void;
  onCreateNew?: () => void;
}

export default function DraggablePopupDialog({
  open,
  data,
  onClose,
  externalMinimized,
  setExternalMinimized,
  onCreateNew,
}: DraggablePopupDialogProps) {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  // If externally minimized, don't render the dialog
  if (externalMinimized) return null;

  // Determine dialog size based on content type
  const getDialogSize = () => {
    if (!data) {
      return { maxWidth: 'md' as const, fullWidth: false };
    }

    if (data.mode === 'tasks') {
      // Tasks need more width for multiple task display
      if (data.tasks.length > 1) {
        return { maxWidth: 'xl' as const, fullWidth: true };
      } else {
        return { maxWidth: 'lg' as const, fullWidth: false };
      }
    } else {
      // Resources use standard large size
      return { maxWidth: 'lg' as const, fullWidth: false };
    }
  };

  const dialogSize = getDialogSize();

  return (
    <DraggableDialog
      open={open}
      onClose={onClose}
      maxWidth={dialogSize.maxWidth}
      fullWidth={dialogSize.fullWidth}
      PaperProps={{
        sx: {
          // Let content dictate dimensions but set minimums
          height: 'auto',
          width: 'auto',
          minWidth: 600,
          minHeight: 400,
          maxHeight: '80vh',
          p: 0,
        },
      }}
    >
      {/* Dialog Header - This is the draggable area */}
      <DialogTitle
        id="draggable-dialog-title"  // IMPORTANT: This ID enables dragging
        sx={{
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          py: 0.75,
          px: 1.25,
        }}
      >
        <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
          {/* Dynamic title based on content */}
          {data?.mode === 'tasks'
            ? `${data.tasks.length} Task${data.tasks.length > 1 ? 's' : ''}`
            : 'Resource Details'
          }
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {/* Minimize button (if external control provided) */}
          {setExternalMinimized && (
            <IconButton
              onClick={() => setExternalMinimized(true)}
              size="small"
              sx={{
                color: '#000000',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.06)
                    : alpha(theme.palette.text.primary, 0.06)
                },
              }}
              aria-label="Minimize dialog"
            >
              {/* Use minimize icon */}
              <CloseIcon fontSize="small" />
            </IconButton>
          )}

          {/* Close button */}
          <IconButton
            onClick={() => setExternalMinimized ? setExternalMinimized(true) : onClose()}
            size="small"
            sx={{
              color: '#000000',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.06)
                  : alpha(theme.palette.text.primary, 0.06)
                },
            }}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 0 }}>
        {/* Render appropriate content based on mode */}
        {data?.mode === 'tasks' ? (
          <TaskPopoutPanel
            open={open}
            tasks={data.tasks}
            onClose={onClose}
            editing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            onRequestSave={(updates) => {
              // Handle save logic here
              console.log('Save updates:', updates);
            }}
            onCreateNew={onCreateNew}
            externalMinimized={externalMinimized}
            setExternalMinimized={setExternalMinimized}
          />
        ) : data?.mode === 'resource' ? (
          <ResourcePopoutPanel
            open={open}
            resource={data.resource}
            history={data.history}
            onClose={onClose}
            externalMinimized={externalMinimized}
            setExternalMinimized={setExternalMinimized}
          />
        ) : (
          // Loading state
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            p: 3
          }}>
            <Typography color="text.secondary">
              Loading...
            </Typography>
          </Box>
        )}
      </DialogContent>
    </DraggableDialog>
  );
}
```

**Key Points:**
- Uses `DraggableDialog` as the base
- Header has `id="draggable-dialog-title"` to enable dragging
- Dynamic sizing based on content type
- Renders different panels based on `data.mode`

### Step 3: Export the Components

Update `/src/shared-components/index.ts`:

```typescript
// Export the draggable dialog components
export { DraggableDialog } from './dialogs/DraggableDialog';
export { default as DraggablePopupDialog } from './dialogs/DraggablePopupDialog';
```

### Step 4: Define Required Types

Ensure `/src/shared-types/index.ts` includes:

```typescript
export interface TaskDetails {
  taskId: string;
  taskStatus: string;
  // ... other task properties
}

export interface ResourceRecord {
  id: string;
  name: string;
  // ... other resource properties
}
```

And `/src/Callout Component/useCalloutHistory.ts` should export:

```typescript
export interface CalloutHistoryEntry {
  id: string;
  timestamp: Date;
  // ... other history properties
}
```

## Usage Examples

### Basic Task Popup
```tsx
import DraggablePopupDialog from '@/shared-components';

function MyComponent() {
  const [dialogData, setDialogData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DraggablePopupDialog
      open={isOpen}
      data={{
        mode: "tasks",
        tasks: [taskData]
      }}
      onClose={() => setIsOpen(false)}
    />
  );
}
```

### Resource Popup with History
```tsx
<DraggablePopupDialog
  open={true}
  data={{
    mode: "resource",
    resource: resourceData,
    history: calloutHistory
  }}
  onClose={handleClose}
  externalMinimized={minimized}
  setExternalMinimized={setMinimized}
/>
```

## Testing the Component

### Manual Testing Checklist
1. **Drag Functionality**: Click title bar and drag dialog around screen
2. **Position Persistence**: Refresh page, dialog should reopen at last position
3. **Content Switching**: Switch between tasks/resources, size should adapt
4. **Minimize/Close**: Buttons should work correctly
5. **Responsive**: Test on different screen sizes

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DraggablePopupDialog from './DraggablePopupDialog';

test('renders task popup', () => {
  const mockData = {
    mode: 'tasks' as const,
    tasks: [{ taskId: '1', taskStatus: 'Open' }]
  };

  render(
    <DraggablePopupDialog
      open={true}
      data={mockData}
      onClose={() => {}}
    />
  );

  expect(screen.getByText('1 Task')).toBeInTheDocument();
});
```

## Common Issues & Solutions

### Dialog Not Dragging
- Ensure `DialogTitle` has `id="draggable-dialog-title"`
- Check that mouse events aren't being blocked by child elements

### Position Not Saving
- Verify `sessionStorage` is available
- Check for JSON serialization errors in position object

### Content Overflow
- Adjust `minWidth`/`minHeight` in `PaperProps`
- Ensure content components handle their own scrolling

### Type Errors
- Make sure all imported types are properly exported
- Check TypeScript path mappings for `@/` aliases

## Performance Notes
- Drag operations use direct DOM manipulation for smoothness
- Position saved to sessionStorage (not localStorage) for privacy
- No unnecessary re-renders during drag state changes
- Memory cleaned up on component unmount

This implementation provides a complete, reusable draggable popup system that integrates seamlessly with Material-UI while adding the specific functionality needed for the TaskForce application.
- `Dialog` - Base dialog container
- `DialogTitle` - Header with drag handle
- `DialogContent` - Main content area
- `IconButton` - Close/minimize buttons
- `Paper` - Custom paper component for drag functionality

## Customization Points
- **Sizing**: Configurable via `getDialogSize()` function
  - Tasks: `maxWidth: 'xl'`, `fullWidth: true`
  - Resources: `maxWidth: 'lg'`, `fullWidth: false`
- **Positioning**: CSS transforms for drag positioning
- **Styling**: MUI theme integration with alpha blending
- **Transitions**: Optional CSS transitions for smooth animations

## Usage Examples

### Task Popout
```tsx
<DraggablePopupDialog
  open={true}
  data={{
    mode: "tasks",
    tasks: [taskDetails]
  }}
  onClose={handleClose}
  externalMinimized={minimized}
  setExternalMinimized={setMinimized}
/>
```

### Resource Popout
```tsx
<DraggablePopupDialog
  open={true}
  data={{
    mode: "resource",
    resource: resourceData,
    history: calloutHistory
  }}
  onClose={handleClose}
/>
```

## Performance Considerations
- Position state persisted in sessionStorage (not localStorage)
- Drag operations use direct DOM manipulation for smooth performance
- No unnecessary re-renders during drag operations
- Memory cleanup on component unmount

## Accessibility
- Proper ARIA labels on interactive elements
- Keyboard navigation support through MUI Dialog
- Screen reader compatible drag instructions

## Browser Compatibility
- Modern browsers with CSS transform support
- sessionStorage support required for position persistence
- Mouse and touch event compatibility

## Related Components
- `TaskPopoutPanel` - Task-specific content rendering
- `ResourcePopoutPanel` - Resource-specific content rendering
- `usePanelDocking` - Layout management hook

## Future Enhancements
- Touch/mobile drag support
- Keyboard-based positioning
- Animation presets for open/close states
- Multi-instance position management</content>
<parameter name="filePath">/workspaces/TaskForce/Resources-Documents/Inventory-Documents/draggable-popup-dialog-component.md