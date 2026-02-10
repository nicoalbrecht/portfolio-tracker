"use client";

import { ReactNode, useState, useCallback } from "react";
import { 
  ResponsiveGridLayout, 
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import type { LayoutItem, Layout, ResponsiveLayouts } from "react-grid-layout";
import { useStore } from "@/stores";
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

export function WidgetGrid({ children }: WidgetGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const { layouts, updateLayouts } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: ResponsiveLayouts<string>) => {
      const convertedLayouts = {
        lg: allLayouts.lg?.map(convertLayout) ?? layouts.lg,
        md: allLayouts.md?.map(convertLayout) ?? layouts.md,
        sm: allLayouts.sm?.map(convertLayout) ?? layouts.sm,
      };
      updateLayouts(convertedLayouts);
    },
    [layouts, updateLayouts]
  );

  return (
    <div ref={containerRef} className={isDragging ? "cursor-grabbing" : ""}>
      {mounted && width > 0 && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={{
            lg: layouts.lg,
            md: layouts.md,
            sm: layouts.sm,
          }}
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
