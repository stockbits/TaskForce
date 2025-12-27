import React, { useEffect, useRef, useState, MutableRefObject, memo } from 'react';
import { Box } from '@mui/material';
import { DataGrid, DataGridProps, useGridApiRef } from '@mui/x-data-grid';

type ResponsiveProps = Omit<DataGridProps, 'autoHeight'> & {
  reserveBottom?: number; // pixels to reserve at bottom (footer)
  minHeight?: number;
  containerRef?: MutableRefObject<HTMLElement | null>;
  autoReserveBottom?: boolean; // if true, detect footer space below container and include it
} & Record<string, any>;

const ResponsiveDataGridComponent = memo(function ResponsiveDataGrid(props: ResponsiveProps) {
  const { reserveBottom = 140, minHeight = 220, containerRef, autoReserveBottom = true, sx, ...rest } = props;
  const innerRef = useRef<HTMLDivElement | null>(null);
  const hostRef = (containerRef as any) ?? innerRef;
  const [height, setHeight] = useState<number>(minHeight);
  const apiRef = useGridApiRef();

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
        const footerSpace = Math.max(0, window.innerHeight - rect.bottom);
        const effectiveReserve = reserveBottom + (autoReserveBottom ? Math.round(footerSpace) : 0);
        const available = Math.max(minHeight, window.innerHeight - top - effectiveReserve);
        const computed = Math.round(available);
        // compute available height
        setHeight(computed);
      } catch {
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
  }, [reserveBottom, minHeight, hostRef, autoReserveBottom]);

  return (
    <Box ref={innerRef} sx={{ width: '100%', height, position: 'relative', ...((sx as any) || {}) }}>
      <DataGrid
        {...(rest as any)}
        apiRef={apiRef}
        autoHeight={false}
        sx={{ height: '100%', '& .MuiDataGrid-viewport': { height: '100%' }, ...(((rest as any).sx) || {}) }}
      />
      {/* dev pointer inspector removed */}
    </Box>
  );
});

ResponsiveDataGridComponent.displayName = "ResponsiveDataGrid";

export default ResponsiveDataGridComponent;
