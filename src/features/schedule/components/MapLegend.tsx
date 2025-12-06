// src/SCH_Live/panels/MapLegend.tsx
import React from "react";
import {
  COMMIT_COLORS,
  STATUS_COLORS,
  createTaskSVG,
  createResourceSVG,
} from "@/shared/config/pins";

interface MapLegendProps {
  visible: boolean;
  onClose: () => void;
}

export default function MapLegend({ visible, onClose }: MapLegendProps) {
  if (!visible) return null;

  return (
    <div
      className="
        absolute top-14 right-4 z-[9999]
        bg-white border border-gray-200
        rounded-xl shadow-lg p-4 w-72 text-sm
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-800 text-sm">Map Legend</h2>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* ======================= RESOURCES ======================= */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Resources
        </h3>

        <div className="space-y-3">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-3">
              {/* Actual Resource SVG marker */}
              <div
                className="scale-75 origin-left"
                dangerouslySetInnerHTML={{
                  __html: createResourceSVG(status, false),
                }}
              />
              <span className="text-gray-700 text-xs">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================= TASKS ======================= */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Tasks
        </h3>

        <div className="space-y-3">
          {Object.entries(COMMIT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-3">
              {/* Actual Task SVG marker */}
              <div
                className="scale-75 origin-left"
                dangerouslySetInnerHTML={{
                  __html: createTaskSVG(color, false),
                }}
              />
              <span className="text-gray-700 text-xs">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
