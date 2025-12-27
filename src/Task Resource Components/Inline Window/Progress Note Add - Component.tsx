import React, { useEffect, useState } from "react";
import { Alert, Stack, TextField, Typography, useTheme } from "@mui/material";
import AppButton from '@/shared-ui/button';
import type { ProgressNoteEntry } from "@/types";

const isBrowser = typeof window !== "undefined";

const draftKeyForNotes = (taskId: string) => `taskProgressNotes:${taskId}:draft`;

interface ProgressNoteAddProps {
  taskId: string;
  taskStatus?: string;
  onAdd: (entry: ProgressNoteEntry) => void;
}

export function ProgressNoteAdd({ taskId, taskStatus, onAdd }: ProgressNoteAddProps) {
  const theme = useTheme();
  const draftKey = draftKeyForNotes(taskId);
  const [text, setText] = useState<string>(() => {
    if (!isBrowser) return "";
    try {
      return window.localStorage.getItem(draftKey) || "";
    } catch {
      return "";
    }
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isBrowser) return;
    let mounted = true;
    fetch("http://localhost:5179/health")
      .then(() => mounted && setServerReachable(true))
      .catch(() => mounted && setServerReachable(false));
    return () => {
      mounted = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!isBrowser || !statusMessage) return;
    const timeout = window.setTimeout(() => setStatusMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const entry: ProgressNoteEntry = {
      ts: new Date().toISOString(),
      status: taskStatus || "",
      text: trimmed,
      source: "Agent",
    };

    setSaving(true);
    setError(null);
    onAdd(entry);

    try {
      const resp = await fetch("http://localhost:5179/progress-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, text: trimmed, taskStatus }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatusMessage("Saved & synced");
    } catch (err: any) {
      console.warn("Progress notes sync failed", err);
      setStatusMessage("Saved locally (offline)");
      setError(serverReachable === false ? null : err?.message || "Sync failed");
    } finally {
      setSaving(false);
      setText("");
      if (isBrowser) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (!isBrowser) return;
    try {
      if (value.trim()) {
        window.localStorage.setItem(draftKey, value);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="overline"
        sx={{ color: theme.palette.text.secondary, letterSpacing: 0.6 }}
      >
        Add Progress Note
      </Typography>
      <TextField
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Summarise field actions, blockers, or next steps…"
        multiline
        minRows={4}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            alignItems: "flex-start",
          },
        }}
      />
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <AppButton
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          variant="contained"
        >
          {saving ? "Saving…" : "Save Note"}
        </AppButton>
        <Stack spacing={1} direction="row" flexWrap="wrap" useFlexGap>
          {statusMessage && (
            <Alert severity="success" variant="outlined" sx={{ py: 0.5 }}>
              {statusMessage}
            </Alert>
          )}
          {error && !statusMessage && (
            <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
              {error}
            </Alert>
          )}
          {serverReachable === false && (
            <Typography variant="caption" color="text.secondary">
              Offline mode
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}