import ConstructionOutlined from "@mui/icons-material/ConstructionOutlined";
import { Box, Paper, Typography } from "@mui/material";

interface FeaturePlaceholderProperties {
  title: string;
  description: string;
}

export default function FeaturePlaceholder({
  title,
  description
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
        p: 4,
        textAlign: "center"
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
          width: 64
        }}
      >
        <ConstructionOutlined fontSize="large" />
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
