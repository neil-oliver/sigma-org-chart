import React, { useRef, useState, useCallback, useEffect } from 'react';

interface PanZoomContainerProps {
  children: React.ReactNode;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

interface Position {
  x: number;
  y: number;
}

const PanZoomContainer: React.FC<PanZoomContainerProps> = ({
  children,
  zoom,
  onZoomChange,
  className = '',
  minZoom = 0.25,
  maxZoom = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
      onZoomChange?.(newZoom);
    }
  }, [zoom, minZoom, maxZoom, onZoomChange]);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Center content on mount
  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();
      
      // Center horizontally, start near top vertically
      setPosition({
        x: (container.width - content.width * zoom) / 2,
        y: 20,
      });
    }
  }, [zoom]);

  // Reset position handler (can be called from parent)
  const resetPosition = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      setPosition({
        x: container.width / 2,
        y: 20,
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        ref={contentRef}
        className="inline-block"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
      
      {/* Pan hint */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none">
        Drag to pan • Ctrl+scroll to zoom
      </div>
    </div>
  );
};

export default PanZoomContainer;

