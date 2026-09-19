import { ConstructionIcon } from "@shared/icons/applicationIcons";
import { Box, Paper, Typography } from "@mui/material";

interface FeaturePlaceholderProperties {
  title: string;
  description: string;
}

export default function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProperties) {
  return (
    <Paper
      variant="outlined"
      sx={{
        alignItems: "center",
        borderStyle: "dashed",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 360,
        minWidth: 0,
        overflowWrap: "anywhere",
        p: { xs: 4, sm: 8 },
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "action.hover",
          borderRadius: "50%",
          color: "primary.main",
          display: "flex",
          height: 64,
          justifyContent: "center",
          mb: 2,
          width: 64,
        }}
      >
        <ConstructionIcon fontSize="large" />
      </Box>
      <Typography variant="h5" fontWeight={750} gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" maxWidth={560}>
        {description}
      </Typography>
    </Paper>
  );
}
