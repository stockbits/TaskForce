import React from "react";
import { Box, Paper, Stack, Typography, Chip } from "@mui/material";
import Users from '@mui/icons-material/People';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Engineering from '@mui/icons-material/Engineering';
import { useTheme } from "@mui/material/styles";
import { SingleSelectField } from '@/shared-components';

interface Step1Props {
  task: Record<string, any> | null | undefined;
  calloutGroups: string[];
  resourceCountByGroup: Map<string, number>;
  selectedGroup: string;
  query: string;
  isStarting: boolean;
  onQueryChange: (v: string) => void;
  onGroupSelect: (group: string) => void;
}

export const Step1: React.FC<Step1Props> = ({
  task,
  calloutGroups,
  resourceCountByGroup,
  selectedGroup,
  query,
  isStarting,
  onQueryChange,
  onGroupSelect,
}) => {
  const theme = useTheme();

  const filteredGroups = calloutGroups.filter(group =>
    group.toLowerCase().includes(query.toLowerCase())
  );

  const handleGroupSelect = (value: string | null) => {
    onGroupSelect(value || "");
  };

  return (
    <Stack spacing={4}>
      {/* Task Details */}
      {task && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="overline">
              Task Details
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Progress:
              </Typography>
              <Chip
                label={task.taskId || task.TaskID || task.id || 'Unknown'}
                size="small"
                color={theme.palette.mode === 'dark' ? 'secondary' : 'primary'}
                variant="outlined"
              />

              <ChevronRight sx={{ color: 'text.secondary', fontSize: 18 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Users sx={{ fontSize: 18, color: 'success.main' }} />
                <Stack spacing={0} sx={{ lineHeight: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.main' }}>
                    {selectedGroup ? `Selected: ${selectedGroup}` : 'No group selected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resourceCountByGroup.get(selectedGroup) ?? 0} engineers available
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            {task.taskDescription && (
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Description:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {task.taskDescription}
                </Typography>
              </Stack>
            )}
            {task.customerName && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Customer:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {task.customerName}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Callout Group Selection */}
      <Stack spacing={2}>
        <Typography variant="overline">
          Callout Group
        </Typography>

        <SingleSelectField
          disablePortal
          label="Select callout group to start recording outcomes"
          options={filteredGroups}
          value={selectedGroup || null}
          inputValue={query}
          disabled={isStarting}
          onInputChange={(v: any) => {
            onQueryChange(v);
            if (!v) onGroupSelect("");
          }}
          onChange={handleGroupSelect}
          wrapperSx={{
            maxWidth: '100%',
            minWidth: '100%',
            px: 0,
          }}
          renderOption={(props: any, option: any) => {
            const label = typeof option === 'string' ? option : option.label;
            const resourceCount = resourceCountByGroup.get(label) ?? 0;
            return (
              <li {...props} key={label}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: '100%', py: 0.5 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Engineering sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      {label}
                    </Typography>
                  </Stack>
                  <Chip
                    label={`${resourceCount} engineer${resourceCount !== 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                </Stack>
              </li>
            );
          }}
        />
      </Stack>
    </Stack>
  );
};