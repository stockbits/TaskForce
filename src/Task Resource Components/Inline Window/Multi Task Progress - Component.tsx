import React from "react";
import { Dialog, DialogTitle, DialogContent, Box, Stack, Typography, IconButton, Paper, FormControl, InputLabel, Select, MenuItem, Divider, Alert, Button, TextField } from "@mui/material";
import Close from '@mui/icons-material/Close';
import ListAlt from '@mui/icons-material/ListAlt';
import { alpha, useTheme } from "@mui/material/styles";
import { FreeTypeSelectField } from "@/shared-components/inputs/form-fields/text-fields";
import { useTheme as useAppTheme } from '@/System Settings/Dark Mode Handler - Component';

export type ProgressPreview = {
  id: string | null | undefined;
  currentStatus: string | null | undefined;
  nextStatus: string | null | undefined;
};

interface Props {
  open: boolean;
  preview: ProgressPreview[];
  tasksCount: number;
  targetStatus: string;
  setTargetStatus: (s: string) => void;
  targetResourceId: string;
  setTargetResourceId: (s: string) => void;
  progressNote: string;
  setProgressNote: (s: string) => void;
  onSave: () => Promise<void> | void;
  onClose: () => void;
  progressError?: string | null;
  progressSuccess?: string | null;
  progressSaving?: boolean;
  coreStatuses: string[];
  additionalStatuses: string[];
  resources?: Array<{ resourceId: string; name: string }>;
}

export default function ProgressTasksDialog({
  open,
  preview,
  tasksCount,
  targetStatus,
  setTargetStatus,
  targetResourceId: _targetResourceId,
  setTargetResourceId: _setTargetResourceId,
  progressNote,
  setProgressNote,
  onSave,
  onClose,
  progressError,
  progressSuccess,
  progressSaving,
  coreStatuses,
  additionalStatuses,
  resources = [],
}: Props) {
  const theme = useTheme();
  const { mode } = useAppTheme();

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Only close on escape key, not on backdrop click
        if (reason === 'escapeKeyDown') {
          onClose();
        }
      }} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ height: 40, width: 40, borderRadius: "50%", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(8,58,97,0.35)" }}>
            <ListAlt style={{ fontSize: 22 }} />
          </Box>
          <div>
            <Typography variant="h6" fontWeight={600} color="text.primary">Progress Tasks</Typography>
            <Typography variant="body2" color="text.secondary">{tasksCount} task{tasksCount === 1 ? "" : "s"} selected</Typography>
          </div>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.text.primary, 0.9), bgcolor: 'transparent', '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.text.primary, 0.06) } }}>
          <Close style={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "1.6fr 1fr", xs: "1fr" } }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>Selected Tasks</Typography>
          <Paper sx={{ maxHeight: 180, overflowY: "auto", borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), p: 2 }}>
            <Stack spacing={1.5}>
              {preview.length === 0 ? (
                <Typography variant="caption" color="text.secondary">No task identifiers.</Typography>
              ) : (
                preview.map(({ id, currentStatus, nextStatus }, index) => (
                  <Stack key={id ?? `task-${index}`} direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="subtitle2" color="text.primary">{id ?? "Unknown Task"}</Typography>
                    <Typography variant="caption" color="text.secondary">{currentStatus ? currentStatus : "—"}<Typography component="span" sx={{ mx: 1, color: "text.disabled" }}>→</Typography>{nextStatus}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2.5}>
          <FormControl fullWidth size="small" required>
            <InputLabel 
              id="target-status-label"
              sx={{
                color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
                '&.Mui-focused': {
                  color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                }
              }}
            >
              Target Status
            </InputLabel>
            <Select 
              labelId="target-status-label" 
              label="Target Status" 
              value={targetStatus} 
              onChange={(e) => setTargetStatus(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : alpha(theme.palette.common.black, 0.23),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.4) : alpha(theme.palette.common.black, 0.4),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                },
                '& .MuiSelect-select': {
                  color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
                },
                '& .MuiSelect-icon': {
                  color: mode === 'dark' ? alpha(theme.palette.common.white, 0.7) : alpha(theme.palette.text.primary, 0.7),
                },
                backgroundColor: mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper,
              }}
            >
              <MenuItem disabled value="__CORE__"><Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Core progression</Typography></MenuItem>
              {coreStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              <Divider component="li" sx={{ my: 0.5 }} />
              <MenuItem disabled value="__ADDITIONAL__"><Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Additional statuses</Typography></MenuItem>
              {additionalStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>

          <FreeTypeSelectField
            label="Assign to Employee/Resource ID"
            placeholder="Enter employee ID or resource pin..."
            value={_targetResourceId}
            onChange={_setTargetResourceId}
            options={resources.map(resource => ({
              label: `${resource.resourceId} - ${resource.name}`,
              value: resource.resourceId
            }))}
            helperText="Required: Assign tasks to a specific employee or resource"
            required
          />
        </Stack>

        <Stack spacing={1.5} sx={{ gridColumn: "1 / -1" }}>
          <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>Quick Note</Typography>
          <TextField 
            multiline 
            minRows={4} 
            value={progressNote} 
            onChange={(e) => setProgressNote(e.target.value)} 
            placeholder="Share the next steps, blockers, or field updates for these tasks…" 
            size="small" 
            fullWidth 
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper,
                '& fieldset': {
                  borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : alpha(theme.palette.common.black, 0.23),
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.4) : alpha(theme.palette.common.black, 0.4),
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                },
              },
              '& .MuiInputBase-input': {
                color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
              },
              '& .MuiInputBase-input::placeholder': {
                color: mode === 'dark' ? alpha(theme.palette.common.white, 0.5) : alpha(theme.palette.text.primary, 0.5),
                opacity: 1,
              },
            }}
          />
        </Stack>

        {(progressError || progressSuccess) && (
          <Alert severity={progressError ? "error" : "success"} sx={{ gridColumn: "1 / -1" }}>{progressError || progressSuccess}</Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ gridColumn: "1 / -1" }}>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ fontWeight: 600, color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary, borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.12) : alpha(theme.palette.primary.main, 0.12), '&:hover': { backgroundColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.primary.main, 0.04) } }}>Cancel</Button>
          <Button variant="contained" size="small" onClick={() => onSave()} disabled={progressSaving || !progressNote.trim() || !targetStatus.trim()} sx={{ fontWeight: 700 }}>Save</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
