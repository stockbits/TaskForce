// ============================================================================
// MapPanel.tsx — FIXED VERSION
// - Selection retention preserved
// - Drag does NOT clear selections
// - Auto resize fix for panel maximize/minimize using ResizeObserver
// ============================================================================

import React, { useMemo, useEffect } from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  createTaskSVG,
  createResourceSVG,
  COMMIT_COLORS,
} from "@/shared-config/pins";

import type { TaskRecord, ResourceRecord } from "@/hooks/useLiveSelectEngine";

/* ============================================================================
   MAP RESIZE AUTO-FIX
   Solves grey map area when the panel expands/maximizes.
   ============================================================================
*/
function AutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  return null;
}

/* ============================================================================
   MAP INTERACTION HANDLER
   Dragging the map must NOT clear selection.
   ============================================================================
*/
function MapInteractionHandler({
  onMapDragStart,
  onMapDragEnd,
}: {
  onMapDragStart: () => void;
  onMapDragEnd: () => void;
}) {
  useMapEvents({
    dragstart() {
      onMapDragStart();
    },
    dragend() {
      onMapDragEnd();
    },
    // Background map clicks should NOT clear selection; handle as no-op
    click() {
      // intentionally no selection changes on bare map click
    },
  });

  return null;
}

/* ============================================================================
   AUTO-ZOOM TO SELECTION
   ============================================================================
*/
function ZoomToSelection({
  selectedTask,
  selectedTasks,
  selectedResource,
  selectedResources,
  shouldZoom,
}: {
  selectedTask: TaskRecord | null;
  selectedTasks: TaskRecord[];
  selectedResource: ResourceRecord | null;
  selectedResources: ResourceRecord[];
  shouldZoom: boolean;
}) {
  const map = useMap();
  const lastKey = React.useRef("");

  useEffect(() => {
    if (!shouldZoom) return;

    const tasks = selectedTasks.length
      ? selectedTasks
      : selectedTask
      ? [selectedTask]
      : [];

    const resources = selectedResources.length
      ? selectedResources
      : selectedResource
      ? [selectedResource]
      : [];

    const combined = [
      ...tasks.filter((t) => t.lat && t.lng),
      ...resources.filter((r) => r.homeLat && r.homeLng),
    ];

    if (!combined.length) return;

    const key = combined
      .map((i) => (i.taskId ? i.taskId : i.resourceId))
      .join(",");

    if (key === lastKey.current) return;
    lastKey.current = key;

    if (combined.length === 1) {
      const one = combined[0];
      map.setView(
        [Number(one.lat ?? one.homeLat), Number(one.lng ?? one.homeLng)],
        15,
        { animate: false }
      );
      return;
    }

    const bounds = L.latLngBounds(
      combined.map((i) => [
        Number(i.lat ?? i.homeLat),
        Number(i.lng ?? i.homeLng),
      ])
    );

    map.fitBounds(bounds, { padding: [60, 60], animate: false });
  }, [
    selectedTask,
    selectedTasks,
    selectedResource,
    selectedResources,
    shouldZoom,
    map,
  ]);

  return null;
}

/* ============================================================================
   MAIN MAP PANEL
   ============================================================================
*/
export default function MapPanel({
  tasks,
  resources,
  selectedTask,
  selectedTasks,
  selectedResource,
  selectedResources,
  shouldZoom,
  handleTaskMapClick,
  handleResourceMapClick,
  notifyMapDragStart,
  notifyMapDragEnd,
  showMarkers = true,
}: {
  tasks: TaskRecord[];
  resources: ResourceRecord[];

  selectedTask: TaskRecord | null;
  selectedTasks: TaskRecord[];
  selectedResource: ResourceRecord | null;
  selectedResources: ResourceRecord[];

  shouldZoom: boolean;

  handleTaskMapClick: (task: TaskRecord, multi?: boolean) => void;
  handleResourceMapClick: (res: ResourceRecord, multi?: boolean) => void;

  notifyMapDragStart: () => void;
  notifyMapDragEnd: () => void;
  showMarkers?: boolean;
}) {
  const theme = useTheme();

  const markerTasks = useMemo(
    () => tasks.filter((t) => t.lat && t.lng),
    [tasks]
  );

  const markerResources = useMemo(
    () => resources.filter((r) => r.homeLat && r.homeLng),
    [resources]
  );

  const selectedTaskIds = new Set(selectedTasks.map((t) => t.taskId));
  const selectedResourceIds = new Set(
    selectedResources.map((r) => r.resourceId)
  );

  return (
    <Box
      data-map-root="true"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <MapContainer
          center={[51.713, -3.449]}
          zoom={12}
          style={{ width: '100%', height: '100%' }} // Already dynamic, but ensure MUI system props are used for parent containers
        >
          {/* Auto-fix for panel resizing */}
          <AutoResize />

          {/* Drag handling for selection retention */}
          <MapInteractionHandler
            onMapDragStart={notifyMapDragStart}
            onMapDragEnd={notifyMapDragEnd}
          />

          {/* Auto zoom */}
          <ZoomToSelection
            selectedTask={selectedTask}
            selectedTasks={selectedTasks}
            selectedResource={selectedResource}
            selectedResources={selectedResources}
            shouldZoom={shouldZoom}
          />

          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* TASK MARKERS */}
          {showMarkers && markerTasks.map((t) => {
            const isSelected = Boolean(
              selectedTaskIds.has(t.taskId) ||
                (selectedTask && selectedTask.taskId === t.taskId)
            );

            const icon = L.divIcon({
              className: "custom-pin",
              iconSize: [36, 50],
              iconAnchor: [18, 46],
              html: createTaskSVG(
                COMMIT_COLORS[t.commitmentType] ?? "#6B7280",
                isSelected
              ),
            });

            return (
              <Marker
                key={t.taskId}
                position={[t.lat!, t.lng!]}
                icon={icon}
                eventHandlers={{
                  click: (e) => {
                    const multi =
                      e.originalEvent?.ctrlKey ||
                      e.originalEvent?.metaKey ||
                      false;

                    handleTaskMapClick(t, multi);
                  },
                  mouseover: (e) => {
                    // prevent default hover show by closing if opened
                    const m: any = e.target;
                    m.closeTooltip?.();
                  },
                  dblclick: (e) => {
                    const m: any = e.target;
                    m.openTooltip?.();
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -36]}
                  permanent={false}
                  sticky={false}
                  opacity={1}
                  className="leaflet-tooltip-surface"
                >
                  <Box sx={{ fontSize: 12, lineHeight: 1.4, color: theme.palette.text.primary }}>
                    <Box component="span" sx={{ fontWeight: 700, display: "block" }}>
                      {t.taskId}
                    </Box>
                    <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                      {t.customerAddress}
                    </Box>
                  </Box>
                </Tooltip>
              </Marker>
            );
          })}

          {/* RESOURCE MARKERS */}
          {showMarkers && markerResources.map((r) => {
            const isSelected = Boolean(
              selectedResourceIds.has(r.resourceId) ||
                (selectedResource &&
                  selectedResource.resourceId === r.resourceId)
            );

            const icon = L.divIcon({
              className: "custom-pin",
              iconSize: [36, 50],
              iconAnchor: [18, 46],
              html: createResourceSVG(r.status, isSelected),
            });

            return (
              <Marker
                key={r.resourceId}
                position={[r.homeLat!, r.homeLng!]}
                icon={icon}
                eventHandlers={{
                  click: (e) => {
                    const multi =
                      e.originalEvent?.ctrlKey ||
                      e.originalEvent?.metaKey ||
                      false;

                    handleResourceMapClick(r, multi);
                  },
                  mouseover: (e) => {
                    const m: any = e.target;
                    m.closeTooltip?.();
                  },
                  dblclick: (e) => {
                    const m: any = e.target;
                    m.openTooltip?.();
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -36]}
                  permanent={false}
                  sticky={false}
                  opacity={1}
                  className="leaflet-tooltip-surface"
                >
                  <Box sx={{ fontSize: 12, lineHeight: 1.4, color: theme.palette.text.primary }}>
                    <Box component="span" sx={{ fontWeight: 700, display: "block" }}>
                      {r.name}
                    </Box>
                    <Box component="span" sx={{ display: "block", color: theme.palette.text.secondary }}>
                      {r.homePostCode}
                    </Box>
                    <Box component="span" sx={{ color: theme.palette.text.secondary }}>
                      Status: {r.status}
                    </Box>
                  </Box>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
}
