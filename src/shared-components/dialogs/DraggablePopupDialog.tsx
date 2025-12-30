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

interface DraggablePopupDialogProps {
  open: boolean;
  data: PopupData | null;
  onClose: () => void;
  // optional minimize control forwarded from layout
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

  // If the popup is minimized to the header, don't render the dialog body.
  if (externalMinimized) return null;

  if (!data) {
    return (
      <DraggableDialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth={false}
        PaperProps={{
          sx: {
            height: '400px',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          id="draggable-dialog-title"
          sx={{
            cursor: 'move',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
          }}
        >
          <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
            Loading...
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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

        <DialogContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Loading popup data...
          </Box>
        </DialogContent>
      </DraggableDialog>
    );
  }

  const isTaskMode = data.mode === "tasks";
  const tasks = isTaskMode ? data.tasks : [];
  const resource = !isTaskMode ? data.resource : null;
  const resourceHistory = !isTaskMode ? data.history ?? [] : [];

  // Calculate dialog size based on content
  const getDialogSize = () => {
    if (isTaskMode) {
      if (tasks.length === 1) {
        return { maxWidth: 'lg' as const, fullWidth: false };
      } else if (tasks.length <= 3) {
        return { maxWidth: 'xl' as const, fullWidth: false };
      } else {
        return { maxWidth: 'xl' as const, fullWidth: true };
      }
    } else {
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
          // Let content dictate dimensions
          height: 'auto',
          width: 'auto',
          minWidth: 700,
          minHeight: 300,
          maxHeight: '60vh',
          p: 0,
        },
      }}
    >
      <DialogTitle
        id="draggable-dialog-title"
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
          {isTaskMode
            ? `Task Details${tasks.length > 1 ? ` (${tasks.length})` : ''}`
            : 'Resource Details'
          }
        </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', transform: 'translateZ(0)', willChange: 'transform, opacity', transition: 'opacity 200ms ease' }}>
          {isTaskMode && (
          <TaskPopoutPanel
            open={true}
            tasks={tasks}
            onClose={onClose}
            editing={isEditing}
            onEditToggle={() => setIsEditing((s) => !s)}
            onRequestSave={async (updates) => {
              try {
                // send to local dev server
                const activeTask = tasks[0];
                const taskId = activeTask?.taskId || null;
                if (!taskId) {
                  console.warn('No taskId available to save');
                  setIsEditing(false);
                  return;
                }

                const resp = await fetch('http://localhost:4000/save-task', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ taskId, updates }),
                });

                if (!resp.ok) {
                  const err = await resp.text();
                  console.error('Save failed:', err);
                } else {
                  const json = await resp.json();
                  console.log('Save successful:', json);
                }
              } catch (e) {
                console.error('Error saving task:', e);
              } finally {
                setIsEditing(false);
              }
            }}
            externalMinimized={externalMinimized}
            setExternalMinimized={setExternalMinimized}
            onCreateNew={onCreateNew}
          />
        )}

        {!isTaskMode && resource && (
          <ResourcePopoutPanel
            open={true}
            resource={resource}
            history={resourceHistory}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </DraggableDialog>
  );
}