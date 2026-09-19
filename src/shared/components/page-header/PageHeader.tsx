import { Box, Typography } from "@mui/material";

interface PageHeaderProperties {
  eyebrow: string;
  title: string;
  description: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description
}: PageHeaderProperties) {
  return (
    <Box sx={{ mb: 4, maxWidth: 820 }}>
      <Typography
        color="primary.main"
        fontWeight={800}
        letterSpacing="0.12em"
        textTransform="uppercase"
        variant="overline"
      >
        {eyebrow}
      </Typography>
      <Typography
        component="h1"
        variant="h3"
        fontWeight={800}
        letterSpacing="-0.045em"
        sx={{ mt: 0.5, mb: 1.5 }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary" fontSize="1.05rem">
        {description}
      </Typography>
    </Box>
  );
}
