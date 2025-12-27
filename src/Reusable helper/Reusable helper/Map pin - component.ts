// src/config/Pins.ts

/* ============================================================
   SHARED COLOUR MAPS
============================================================ */
export type CommitType =
  | "Appointment"
  | "Start By"
  | "Complete By"
  | "Future"
  | "Tail"
  | string;

export const COMMIT_COLORS: Record<CommitType, string> = {
  Appointment: "#F59E0B",
  "Start By": "#EC4899",
  "Complete By": "#3B82F6",
  Future: "#10B981",
  Tail: "#6B7280",
};

export const STATUS_COLORS: Record<string, string> = {
  Available: "#10B981",
  Unavailable: "#EF4444",
  "On Task": "#3B82F6",
  Default: "#6B7280",
};

/* ============================================================
   SHARED SIZING (matches Leaflet icon 36x50)
============================================================ */
// Use theme.spacing(4.5) for 36px in MUI components
const PIN_WIDTH = 36;
// Use theme.spacing(6.25) for 50px in MUI components
const PIN_HEIGHT = 50;

/* ============================================================
   TASK PIN SVG
   - Teardrop filled with commitment colour
   - Optional red selection frame
============================================================ */
export function createTaskSVG(color: string, isSelected: boolean): string {
  const stroke = darkenHex(color, 0.35);

  return `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 40 56">
      ${
        isSelected
          ? `
        <rect x="1.5" y="1.5" width="37" height="53"
              rx="8" ry="8"
              fill="none"
              stroke="#DC2626"
              stroke-width="3" />`
          : ""
      }

      <!-- Outer teardrop -->
      <path
        d="M20 2 C 11 2, 4 9, 4 18 C 4 29, 20 52, 20 52 C 20 52, 36 29, 36 18 C 36 9, 29 2, 20 2 Z"
        fill="#FFFFFF"
        stroke="#1F2937"
        stroke-width="2.5"
      />

      <!-- Inner coloured area (task commitment colour) -->
      <path
        d="M20 10 C 14 10, 9 15, 9 21 C 9 29, 20 44, 20 44 C 20 44, 31 29, 31 21 C 31 15, 26 10, 20 10 Z"
        fill="${color}"
        stroke="${stroke}"
        stroke-width="2.5"
      />
    </svg>
  `;
}

/* ============================================================
   RESOURCE PIN SVG
   - Same teardrop size
   - White inner area
   - Person icon
   - Status dot at bottom
============================================================ */
export function createResourceSVG(status: string, isSelected: boolean): string {
  const dotColor = STATUS_COLORS[status] || STATUS_COLORS.Default;

  return `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 40 56">
      ${
        isSelected
          ? `
        <rect x="1.5" y="1.5" width="37" height="53"
              rx="8" ry="8"
              fill="none"
              stroke="#DC2626"
              stroke-width="3" />`
          : ""
      }

      <!-- Outer teardrop -->
      <path
        d="M20 2 C 11 2, 4 9, 4 18 C 4 29, 20 52, 20 52 C 20 52, 36 29, 36 18 C 36 9, 29 2, 20 2 Z"
        fill="#FFFFFF"
        stroke="#1F2937"
        stroke-width="2.5"
      />

      <!-- Inner panel (light grey) to give contrast for the person icon -->
      <path
        d="M20 10 C 14 10, 9 15, 9 21 C 9 29, 20 44, 20 44 C 20 44, 31 29, 31 21 C 31 15, 26 10, 20 10 Z"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        stroke-width="2"
      />

      <!-- Person / engineer silhouette -->
      <g transform="translate(8,6)" fill="#111827">
        <circle cx="12" cy="8" r="5.2" />
        <path d="M4.5 24.5c0-4.6 3.8-8.2 7.5-8.2s7.5 3.6 7.5 8.2v5.5H4.5v-5.5z" />
      </g>

      <!-- Status dot -->
      <circle
        cx="20"
        cy="39"
        r="5"
        fill="${dotColor}"
        stroke="#FFFFFF"
        stroke-width="2"
      />
    </svg>
  `;
}

/* ============================================================
   DARKEN HELPER
============================================================ */
function darkenHex(hex: string, factor = 0.35): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);

  return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(
    g * (1 - factor)
  )}, ${Math.floor(b * (1 - factor))})`;
}
