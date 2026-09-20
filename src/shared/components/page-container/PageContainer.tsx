import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";

/** The only owner of page gutters. Children own their internal spacing. */
export default function PageContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: 1600,
        mx: "auto",
        px: { xs: 4, sm: 6, lg: 10 },
        py: { xs: 6, lg: 10 },
      }}
    >
      {children}
    </Box>
  );
}
