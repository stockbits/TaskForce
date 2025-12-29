// =====================================================================
// DraggableDialog.tsx — MUI Dialog with drag functionality
// Based on: https://mui.com/material-ui/react-dialog/#draggable-dialog
// =====================================================================

import React, { useRef, useState } from 'react';
import { Dialog, DialogProps, Paper, PaperProps } from '@mui/material';

function PaperComponent(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'draggable-dialog-title') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <Paper
      {...props}
      ref={paperRef}
      onMouseDown={handleMouseDown}
      style={{
        ...props.style,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    />
  );
}

interface DraggableDialogProps extends DialogProps {
  children: React.ReactNode;
}

export default function DraggableDialog({
  children,
  ...props
}: DraggableDialogProps) {
  return (
    <Dialog
      {...props}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      {children}
    </Dialog>
  );
}