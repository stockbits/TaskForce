import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Paper, Stack, TextField, Typography } from "@mui/material";
import AppButton from '@/shared-ui/button';
import { alpha, useTheme } from "@mui/material/styles";
import { Users, ChevronRight } from "lucide-react";
import { ResourceRecord } from "./CalloutIncidentPanel";
import SingleSelectField from '@/shared-ui/text-fields/SingleSelectField';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-filter resources for selected group
  const resourcesForGroup: ResourceRecord[] = selectedGroup
    ? allResources.filter((r) => r.calloutGroup === selectedGroup)
    : [];

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return calloutGroups;
    const q = query.toLowerCase();
    return calloutGroups.filter((group) =>
      group.toLowerCase().includes(q)
    );
  }, [calloutGroups, query]);

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
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
      <MotionPaper
        ref={containerRef}
        elevation={18}
        onClick={(event) => event.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', md: theme.spacing(120) }, // 960px at md+
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
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                boxShadow: "0 12px 28px rgba(10,74,122,0.35)",
              }}
            >
              <Users size={20} />
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
                setIsOpen(false);
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
          <Box sx={{ minHeight: 64 }}>
            <AnimatePresence mode="wait">
              {selectedGroup && (
                <MotionPaper
                  key={selectedGroup}
                  elevation={0}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 3,
                    py: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  <Typography variant="body2" color="inherit">
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {resourcesForGroup.length}
                    </Box>{" "}
                    {resourcesForGroup.length === 1 ? "resource" : "resources"} in this callout group.
                  </Typography>
                </MotionPaper>
              )}
            </AnimatePresence>
          </Box>

          {/* Continue Button */}
          <Stack direction="row" justifyContent="flex-end">
              <AppButton
                onClick={() => {
                  setIsOpen(false);
                  onStart(selectedGroup);
                }}
                disabled={startDisabled}
                variant="contained"
                endIcon={<ChevronRight size={16} />}
                sx={{
                  fontWeight: 600,
                }}
              >
                Continue
              </AppButton>
          </Stack>
        </Stack>
      </MotionPaper>
    </MotionBox>
  );
};
