import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface ApplicationCardProperties {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function ApplicationCard({
  icon,
  title,
  description
}: ApplicationCardProperties) {
  return (
    <Paper variant="outlined" sx={{ height: "100%", p: 3 }}>
      <Stack spacing={2}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "primary.main",
            borderRadius: 2,
            color: "primary.contrastText",
            display: "flex",
            height: 44,
            justifyContent: "center",
            width: 44
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={750} gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
