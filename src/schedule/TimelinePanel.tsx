import React from "react";
import { Paper } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function TimelinePanel() {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        px: 3,
        py: 2.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        boxShadow: "0 18px 46px rgba(8,58,97,0.18)",
        backgroundImage: "none",
      }}
    />
  );
}
