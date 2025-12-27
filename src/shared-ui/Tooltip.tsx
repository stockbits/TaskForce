import React from 'react';
import { Tooltip, TooltipProps } from '@mui/material';

export interface TooltipConfig {
  fontSize?: string;
  maxWidth?: number;
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
  marginBottom?: string;
  zIndex?: number;
  placement?: TooltipProps['placement'];
  enterDelay?: number;
  enterNextDelay?: number;
}

const DEFAULT_CONFIG: Required<TooltipConfig> = {
  fontSize: '12px',
  maxWidth: 300,
  whiteSpace: 'pre-line',
  marginBottom: '8px',
  zIndex: 1500,
  placement: 'top-start',
  enterDelay: 300,
  enterNextDelay: 300,
};

export function createTooltipConfig(overrides: Partial<TooltipConfig> = {}): TooltipConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

interface AppTooltipProps extends Omit<TooltipProps, 'componentsProps' | 'slotProps'> {
  config?: Partial<TooltipConfig>;
}

export const AppTooltip: React.FC<AppTooltipProps> = ({
  children,
  config = {},
  ...tooltipProps
}) => {
  const finalConfig = createTooltipConfig(config);

  return (
    <Tooltip
      disableInteractive
      componentsProps={{
        tooltip: {
          sx: {
            fontSize: finalConfig.fontSize,
            maxWidth: finalConfig.maxWidth,
            whiteSpace: finalConfig.whiteSpace,
            marginBottom: `${finalConfig.marginBottom} !important`,
          }
        },
        popper: {
          sx: {
            zIndex: finalConfig.zIndex,
          },
          container: document.body,
        }
      }}
      enterDelay={finalConfig.enterDelay}
      enterNextDelay={finalConfig.enterNextDelay}
      placement={finalConfig.placement}
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  );
};

// Pre-configured tooltip variants for common use cases
export const TaskTooltip: React.FC<Omit<AppTooltipProps, 'config'>> = (props) => (
  <AppTooltip {...props} />
);

export const SimpleTooltip: React.FC<Omit<AppTooltipProps, 'config'>> = (props) => (
  <AppTooltip
    config={{
      whiteSpace: 'normal',
      maxWidth: 200,
      marginBottom: '4px'
    }}
    {...props}
  />
);

export const TimeTooltip: React.FC<Omit<AppTooltipProps, 'config'>> = (props) => (
  <AppTooltip
    config={{
      whiteSpace: 'nowrap',
      maxWidth: 150,
      marginBottom: '4px'
    }}
    {...props}
  />
);