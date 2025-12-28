import React from "react";
import { Dialog, DialogTitle, DialogContent, Box, Stack, Typography, IconButton, Paper, Alert, Button, TextField } from "@mui/material";
import Close from '@mui/icons-material/Close';
import ListAlt from '@mui/icons-material/ListAlt';
import { alpha, useTheme } from "@mui/material/styles";

export type ProgressPreview = {
  id: string | null | undefined;
  currentStatus: string | null | undefined;
  nextStatus: string | null | undefined;
};

interface Props {
  open: boolean;
  preview: ProgressPreview[];
  tasksCount: number;
  progressNote: string;
  setProgressNote: (s: string) => void;
  onSave: () => Promise<void> | void;
  onClose: () => void;
  progressError?: string | null;
  progressSuccess?: string | null;
  progressSaving?: boolean;
}

export default function ProgressNotesDialog({
  open,
  preview,
  tasksCount,
  progressNote,
  setProgressNote,
  onSave,
  onClose,
  progressError,
  progressSuccess,
  progressSaving,
}: Props) {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ height: 40, width: 40, borderRadius: "50%", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(8,58,97,0.35)" }}>
            <ListAlt style={{ fontSize: 22 }} />
          </Box>
          <div>
            <Typography variant="h6" fontWeight={600} color="text.primary">Add Progress Notes</Typography>
            <Typography variant="body2" color="text.secondary">{tasksCount} task{tasksCount === 1 ? "" : "s"} selected</Typography>
          </div>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.text.primary, 0.9), bgcolor: 'transparent', '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.text.primary, 0.06) } }}>
          <Close style={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "1fr", xs: "1fr" } }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>Selected Tasks</Typography>
          <Paper sx={{ maxHeight: 180, overflowY: "auto", borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), p: 2 }}>
            <Stack spacing={1.5}>
              {preview.length === 0 ? (
                <Typography variant="caption" color="text.secondary">No task identifiers.</Typography>
              ) : (
                preview.map(({ id, currentStatus }, index) => (
                  <Stack key={id ?? `task-${index}`} direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="subtitle2" color="text.primary" noWrap>{id ?? "Unknown Task"}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{currentStatus ?? "—"}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={1.5} sx={{ gridColumn: "1 / -1" }}>
          <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>Progress Note</Typography>
          <TextField multiline minRows={4} value={progressNote} onChange={(e) => setProgressNote(e.target.value)} placeholder="Share the next steps, blockers, or field updates for these tasks…" size="small" fullWidth />
        </Stack>

        {(progressError || progressSuccess) && (
          <Alert severity={progressError ? "error" : "success"} sx={{ gridColumn: "1 / -1" }}>{progressError || progressSuccess}</Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ gridColumn: "1 / -1" }}>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary, borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.12) : alpha(theme.palette.primary.main, 0.12), '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.primary.main, 0.04) } }}>Cancel</Button>
          <Button variant="contained" size="small" onClick={() => onSave()} disabled={progressSaving || !progressNote.trim()} sx={{ fontWeight: 700 }}>Save Notes</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}