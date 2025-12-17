import { useTheme } from '@mui/material/styles';

export default function useFieldSizes() {
  const theme: any = useTheme();
  const inputHeight = theme?.custom?.inputHeight ?? 40;
  const chipSize = theme?.custom?.chipSize ?? 28;
  return { INPUT_HEIGHT: inputHeight, CHIP_SIZE: chipSize };
}
