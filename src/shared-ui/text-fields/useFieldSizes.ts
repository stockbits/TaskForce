import { useTheme } from '@mui/material/styles';

export default function useFieldSizes() {
  const theme: any = useTheme();
  const inputHeight = theme?.custom?.inputHeight ?? 40;
  const chipSize = theme?.custom?.chipSize ?? 28;
  const maxWidth = { xs: '100%', sm: '90ch' };
  const minWidth = '28ch';
  const fieldGap = 0.5;
  return { INPUT_HEIGHT: inputHeight, CHIP_SIZE: chipSize, MAX_WIDTH: maxWidth, MIN_WIDTH: minWidth, FIELD_GAP: fieldGap };
}
