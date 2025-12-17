import React from "react";
import { Dialog, DialogTitle, DialogContent, Box, Stack, Typography, IconButton, Paper, FormControl, InputLabel, Select, MenuItem, Divider, Alert, TextField } from "@mui/material";
import AppButton from '@/shared-ui/button';
import Close from '@mui/icons-material/Close';
import ListAlt from '@mui/icons-material/ListAlt';
import { alpha, useTheme } from "@mui/material/styles";
import useFieldSizes from "../shared-ui/text-fields/useFieldSizes";

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
}

export default function ProgressTasksDialog({
  open,
  preview,
  tasksCount,
  targetStatus,
  setTargetStatus,
  targetResourceId,
  setTargetResourceId,
  progressNote,
  setProgressNote,
  onSave,
  onClose,
  progressError,
  progressSuccess,
  progressSaving,
  coreStatuses,
  additionalStatuses,
}: Props) {
  const theme = useTheme();
  const { INPUT_HEIGHT } = useFieldSizes();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT, borderRadius: "50%", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(8,58,97,0.35)" }}>
            <ListAlt style={{ fontSize: 22 }} />
          </Box>
          <div>
            <Typography variant="h6" fontWeight={600} color="text.primary">Progress Tasks</Typography>
            <Typography variant="body2" color="text.secondary">{tasksCount} task{tasksCount === 1 ? "" : "s"} selected</Typography>
          </div>
        </Stack>
        <IconButton onClick={onClose}><Close style={{ fontSize: 20 }} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "1.6fr 1fr", xs: "1fr" } }}>
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>Selected Tasks</Typography>
          <Paper variant="outlined" sx={{ maxHeight: 180, overflowY: "auto", borderRadius: 3, borderColor: alpha(theme.palette.primary.main, 0.12), bgcolor: alpha(theme.palette.primary.main, 0.03), p: 2 }}>
            <Stack spacing={1.5}>
              {preview.length === 0 ? (
                <Typography variant="caption" color="text.secondary">No task identifiers.</Typography>
              ) : (
                preview.map(({ id, currentStatus, nextStatus }, index) => (
                  <Stack key={id ?? `task-${index}`} direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, bgcolor: theme.palette.background.paper, px: 2, py: 1.25 }}>
                    <Typography variant="subtitle2" color="primary" noWrap>{id ?? "Unknown Task"}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{currentStatus ? currentStatus : "—"}<Typography component="span" sx={{ mx: 1, color: "text.disabled" }}>→</Typography>{nextStatus}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel id="target-status-label">Target Status</InputLabel>
            <Select labelId="target-status-label" label="Target Status" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
              <MenuItem disabled value="__CORE__"><Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Core progression</Typography></MenuItem>
              {coreStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              <Divider component="li" sx={{ my: 0.5 }} />
              <MenuItem disabled value="__ADDITIONAL__"><Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Additional statuses</Typography></MenuItem>
              {additionalStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>Selected tasks will be stamped with the note below and updated to <strong> {targetStatus} </strong> unless they already match.</Alert>
          {/* Assign to Resource ID removed — pins handled elsewhere */}
        </Stack>

        <Stack spacing={1.5} sx={{ gridColumn: "1 / -1" }}>
          <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>Quick Note</Typography>
          <TextField multiline minRows={4} value={progressNote} onChange={(e) => setProgressNote(e.target.value)} placeholder="Share the next steps, blockers, or field updates for these tasks…" />
        </Stack>

        {(progressError || progressSuccess) && (
          <Alert severity={progressError ? "error" : "success"} sx={{ gridColumn: "1 / -1" }}>{progressError || progressSuccess}</Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ gridColumn: "1 / -1" }}>
          <AppButton variant="outlined" size="small" onClick={onClose} sx={{ fontWeight: 600 }}>Cancel</AppButton>
          <AppButton variant="contained" size="small" onClick={() => onSave()} disabled={progressSaving} sx={{ fontWeight: 700 }}>Save</AppButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
