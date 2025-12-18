import React from 'react';
import GlobalSearchField from './GlobalSearchField';
import mockTasks from '@/data/mockTasks.json';
import ResourceMock from '@/data/ResourceMock.json';
import type { TextFieldProps } from '@mui/material/TextField';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  size?: 'small' | 'medium';
  sx?: any;
  name?: string;
  showSearchButton?: boolean;
} & Partial<TextFieldProps>;

const ExactGlobalSearchField = React.forwardRef<HTMLInputElement, Props>(function ExactGlobalSearchField(props, ref) {
  const validateExact = (v: string) => {
    const q = String(v || '').trim().toLowerCase();
    if (!q) return false;

    const tasks = mockTasks as any[];
    const resources = (ResourceMock as any[]) || [];

    const foundInTasks = tasks.some((t) => {
      return (
        (t.taskId && String(t.taskId).toLowerCase() === q) ||
        (t.workId && String(t.workId).toLowerCase() === q) ||
        (t.estimateNumber && String(t.estimateNumber).toLowerCase() === q) ||
        (t.employeeId && String(t.employeeId).toLowerCase() === q)
      );
    });
    if (foundInTasks) return true;

    const foundInResources = resources.some((r) => r.resourceId && String(r.resourceId).toLowerCase() === q);
    return foundInResources;
  };

  return <GlobalSearchField {...props} validateExact={validateExact} ref={ref} />;
});

export default ExactGlobalSearchField;
