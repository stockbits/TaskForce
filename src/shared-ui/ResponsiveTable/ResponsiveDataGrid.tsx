import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import { Box } from '@mui/material';
import { DataGrid, DataGridProps } from '@mui/x-data-grid';

type ResponsiveProps = Omit<DataGridProps, 'autoHeight'> & {
  reserveBottom?: number; // pixels to reserve at bottom (footer)
  minHeight?: number;
  containerRef?: MutableRefObject<HTMLElement | null>;
  autoReserveBottom?: boolean; // if true, detect footer space below container and include it
  debug?: boolean; // enable console debug logs
} & Record<string, any>;

export default function ResponsiveDataGrid(props: ResponsiveProps) {
  const { reserveBottom = 140, minHeight = 220, containerRef, autoReserveBottom = true, debug = false, sx, ...rest } = props;
  const innerRef = useRef<HTMLDivElement | null>(null);
  const hostRef = (containerRef as any) ?? innerRef;
  const [height, setHeight] = useState<number>(minHeight);

  useEffect(() => {
    function compute() {
      try {
        const node = (hostRef && (hostRef as any).current) || innerRef.current;
        if (!node) {
          setHeight(minHeight);
          return;
        }
        const rect = node.getBoundingClientRect();
        const top = rect.top;
        // detect footer / leftover space below container (if any)
        const footerSpace = Math.max(0, window.innerHeight - rect.bottom);
        const effectiveReserve = reserveBottom + (autoReserveBottom ? Math.round(footerSpace) : 0);
        const available = Math.max(minHeight, window.innerHeight - top - effectiveReserve);
        const computed = Math.round(available);
        if (debug) {
          // eslint-disable-next-line no-console
          console.debug('ResponsiveDataGrid.compute', {
            top,
            bottom: rect.bottom,
            windowInnerHeight: window.innerHeight,
            reserveBottom,
            footerSpace,
            effectiveReserve,
            computed,
          });
        }
        setHeight(computed);
      } catch (e) {
        setHeight(minHeight);
      }
    }

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(document.body);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [reserveBottom, minHeight, hostRef]);

  return (
    <Box ref={innerRef} sx={{ width: '100%', height, position: 'relative', ...((sx as any) || {}) }}>
      <DataGrid
        {...(rest as any)}
        autoHeight={false}
        sx={{ height: '100%', '& .MuiDataGrid-viewport': { height: '100%' }, ...(((rest as any).sx) || {}) }}
      />
    </Box>
  );
}
