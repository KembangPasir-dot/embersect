export const WAYPOINTS = [
  { x: -20, y: 360 },
  { x: 180, y: 360 },
  { x: 180, y: 160 },
  { x: 480, y: 160 },
  { x: 480, y: 560 },
  { x: 820, y: 560 },
  { x: 820, y: 360 },
  { x: 1050, y: 360 } // Hearth center
];

export const HEARTH_POS = { x: 1080, y: 360 };

export const TILE_SIZE = 40;
export const COLS = 32; // 32 * 40 = 1280
export const ROWS = 18; // 18 * 40 = 720

// Build initial map grid
export function createMapGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE_SIZE + TILE_SIZE / 2;
      const y = r * TILE_SIZE + TILE_SIZE / 2;

      let type = 'grass';

      // Check distance to hearth
      const distHearth = Math.hypot(x - HEARTH_POS.x, y - HEARTH_POS.y);
      if (distHearth < 75) {
        type = 'hearth';
      } else {
        // Check distance to path segments
        for (let i = 0; i < WAYPOINTS.length - 1; i++) {
          const p1 = WAYPOINTS[i];
          const p2 = WAYPOINTS[i + 1];
          const d = distToSegment({ x, y }, p1, p2);
          if (d < 35) {
            type = 'path';
            break;
          }
        }
      }

      row.push({
        col: c,
        row: r,
        x,
        y,
        type, // 'grass', 'path', 'hearth'
        tower: null
      });
    }
    grid.push(row);
  }
  return grid;
}

function distToSegment(p, p1, p2) {
  const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
  let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (p1.x + t * (p2.x - p1.x)), p.y - (p1.y + t * (p2.y - p1.y)));
}

// Total path length computation for enemy movement
export function getPathTotalLength() {
  let len = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    len += Math.hypot(WAYPOINTS[i+1].x - WAYPOINTS[i].x, WAYPOINTS[i+1].y - WAYPOINTS[i].y);
  }
  return len;
}

const PATH_TOTAL_LENGTH = getPathTotalLength();

export function pointOnPath(distance) {
  let currentDist = Math.max(0, Math.min(distance, PATH_TOTAL_LENGTH));
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const p1 = WAYPOINTS[i];
    const p2 = WAYPOINTS[i + 1];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (currentDist <= segLen) {
      const t = segLen === 0 ? 0 : currentDist / segLen;
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        angle: Math.atan2(p2.y - p1.y, p2.x - p1.x)
      };
    }
    currentDist -= segLen;
  }
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

export function tileAt(grid, x, y) {
  const c = Math.floor(x / TILE_SIZE);
  const r = Math.floor(y / TILE_SIZE);
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    return grid[r][c];
  }
  return null;
}

export function isBuildable(tile) {
  return tile && tile.type === 'grass' && !tile.cultivator && !tile.tower;
}
