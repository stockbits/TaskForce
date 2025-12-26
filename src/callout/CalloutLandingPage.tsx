import React, { useEffect, useMemo, useRef, useState } from "react";
// framer-motion removed — render static Box/Paper
import { Box, Paper, Stack, Typography } from "@mui/material";
import AppButton from '@/shared-ui/button';
import { alpha, useTheme } from "@mui/material/styles";
import Users from '@mui/icons-material/People';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { ResourceRecord } from "./CalloutIncidentPanel";
import { SingleSelectField } from '@/shared-ui';

// use Box and Paper directly

/* ------------------------------------------------------------------
   TYPES
------------------------------------------------------------------ */

interface CalloutLandingPageProps {
  allResources: ResourceRecord[];
  calloutGroups: string[];
  onStart: (group: string) => void;
  onDismiss: () => void;
}

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const CalloutLandingPage: React.FC<CalloutLandingPageProps> = ({
  allResources,
  calloutGroups,
  onStart,
  onDismiss,
}) => {
  const theme = useTheme();
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-filter resources for selected group
  const resourcesForGroup: ResourceRecord[] = selectedGroup
    ? allResources.filter((r) => r.calloutGroup === selectedGroup)
    : [];

  const resourceCountByGroup = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const resource of allResources) {
      const key = resource.calloutGroup ?? "";
      if (!key) continue;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return countMap;
  }, [allResources]);

  useEffect(() => {
    if (!selectedGroup) {
      setQuery("");
      return;
    }

    setQuery(selectedGroup);
  }, [selectedGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      onDismiss();
    };

    document.addEventListener("mousedown", handleClickOutside);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  const startDisabled = !selectedGroup;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(5,20,40,0.6)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onDismiss}
    >
      <Paper
        ref={containerRef}
        elevation={18}
        onClick={(event) => event.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', md: theme.spacing(160) }, // 1280px at md+
          mx: 2,
          borderRadius: 4,
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          boxShadow: "0 24px 55px rgba(10,74,122,0.28)",
          backgroundImage: "none",
        }}
      >
        <Stack spacing={6}>
          {/* Header */}
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                height: theme.spacing(5.5), // 44px
                width: theme.spacing(5.5),
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                boxShadow: "0 12px 28px rgba(10,74,122,0.35)",
              }}
            >
              <Users style={{ fontSize: 20 }} />
            </Box>

            <Stack spacing={0.75}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Select Callout List
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a callout group to begin the workflow.
              </Typography>
            </Stack>
          </Stack>

          {/* Group selector */}
          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.2,
                color: alpha(theme.palette.primary.main, 0.8),
              }}
            >
              Callout Group
            </Typography>

            <SingleSelectField
              label="Callout Group"
              options={calloutGroups}
              value={selectedGroup || null}
              inputValue={query}
              onInputChange={(v) => {
                setQuery(v);
                if (!v) setSelectedGroup("");
              }}
              onChange={(newValue) => {
                const next = newValue ?? "";
                setSelectedGroup(next);
                setQuery(next);
                if (next) onStart(next);
              }}
              renderOption={(props, option) => {
                const label = typeof option === 'string' ? option : option.label;
                const resourceCount = resourceCountByGroup.get(label) ?? 0;
                return (
                  <li {...props} key={label}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: '100%' }}
                    >
                      <Typography variant="body2" color="text.primary">
                        {label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
                      </Typography>
                    </Stack>
                  </li>
                );
              }}
            />
          </Stack>

          {/* Resource count preview */}
          <Box sx={{ minHeight: 0 }}>
            {selectedGroup ? null : null}
          </Box>

          {/* Continue Button */}
          <Stack direction="row" justifyContent="flex-end">
              <AppButton
                onClick={() => {
                  onStart(selectedGroup);
                }}
                disabled={startDisabled}
                variant="contained"
                endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 600,
                }}
              >
                Continue
              </AppButton>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
