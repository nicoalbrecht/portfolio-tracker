"use client";

import { ReactNode, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { 
  ResponsiveGridLayout, 
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import type { LayoutItem, Layout, ResponsiveLayouts } from "react-grid-layout";
import { useStore } from "@/stores";
import { useShallow } from "zustand/shallow";
import { WidgetLayout } from "@/types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface WidgetGridProps {
  children: ReactNode;
}

const convertLayout = (layout: LayoutItem): WidgetLayout => ({
  i: layout.i,
  x: layout.x,
  y: layout.y,
  w: layout.w,
  h: layout.h,
  minW: layout.minW,
  minH: layout.minH,
  static: layout.static,
});

const areLayoutsEqual = (a: WidgetLayout[], b: WidgetLayout[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, i) => {
    const other = b[i];
    if (!other) return false;
    return item.i === other.i && 
           item.x === other.x && 
           item.y === other.y && 
           item.w === other.w && 
           item.h === other.h;
  });
};

export function WidgetGrid({ children }: WidgetGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const layouts = useStore(useShallow((state) => state.layouts));
  const updateLayouts = useStore((state) => state.updateLayouts);
  const [isDragging, setIsDragging] = useState(false);
  
  const layoutsRef = useRef(layouts);
  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  const stableLayouts = useMemo(() => ({
    lg: layouts.lg,
    md: layouts.md,
    sm: layouts.sm,
  }), [layouts.lg, layouts.md, layouts.sm]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts<string>) => {
      const currentLayouts = layoutsRef.current;
      const convertedLayouts = {
        lg: allLayouts.lg?.map(convertLayout) ?? currentLayouts.lg,
        md: allLayouts.md?.map(convertLayout) ?? currentLayouts.md,
        sm: allLayouts.sm?.map(convertLayout) ?? currentLayouts.sm,
      };
      
      const hasChanged = 
        !areLayoutsEqual(convertedLayouts.lg, currentLayouts.lg) ||
        !areLayoutsEqual(convertedLayouts.md, currentLayouts.md) ||
        !areLayoutsEqual(convertedLayouts.sm, currentLayouts.sm);
      
      if (hasChanged) {
        updateLayouts(convertedLayouts);
      }
    },
    [updateLayouts]
  );

  return (
    <div ref={containerRef} className={isDragging ? "cursor-grabbing" : ""}>
      {mounted && width > 0 && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={stableLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={80}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor}
          dragConfig={{
            enabled: true,
            bounded: false,
            handle: ".widget-drag-handle",
            threshold: 3,
          }}
          resizeConfig={{
            enabled: true,
            handles: ["se"],
          }}
          onLayoutChange={handleLayoutChange}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          onResizeStart={() => setIsDragging(true)}
          onResizeStop={() => setIsDragging(false)}
        >
          {children}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
