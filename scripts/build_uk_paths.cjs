const fs = require("fs");

// --- minimal topojson decoder ---
function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}
function arcRing(arcs, indices) {
  const ring = [];
  for (const idx of indices) {
    const rev = idx < 0;
    const arc = arcs[rev ? ~idx : idx];
    const pts = rev ? arc.slice().reverse() : arc;
    for (let i = 0; i < pts.length; i++) {
      if (i === 0 && ring.length) continue; // dedupe shared vertex
      ring.push(pts[i]);
    }
  }
  return ring;
}
// returns array of polygons; each polygon is array of rings (lon/lat)
function geomPolygons(geom, arcs) {
  if (geom.type === "Polygon") return [geom.arcs.map((r) => arcRing(arcs, r))];
  if (geom.type === "MultiPolygon") return geom.arcs.map((poly) => poly.map((r) => arcRing(arcs, r)));
  return [];
}

const gb = JSON.parse(fs.readFileSync("/tmp/uk_nuts1.json"));
const ni = JSON.parse(fs.readFileSync("/tmp/ni.json"));
const gbArcs = decodeArcs(gb);
const niArcs = decodeArcs(ni);

const NAME2ID = {
  "North East": "NE", "North West": "NW", "Yorkshire and The Humber": "YH",
  "East Midlands": "EM", "West Midlands": "WM", "Eastern": "EE", "London": "LON",
  "South East": "SE", "South West": "SW", "Scotland": "SCO", "Wales": "WAL",
};

const regions = {}; // id -> array of polygons(lon/lat)
for (const g of gb.objects.eer.geometries) {
  const id = NAME2ID[g.properties.EER13NM];
  if (id) regions[id] = geomPolygons(g, gbArcs);
}
const niGeom = ni.objects.NI_Outline.geometries[0];
regions["NI"] = geomPolygons(niGeom, niArcs);

// --- projection: equirectangular w/ latitude correction, fit to viewBox ---
const lat0 = 54.5 * Math.PI / 180;
const k = Math.cos(lat0);
const project = ([lon, lat]) => [lon * k, lat];

// bounds
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const id in regions)
  for (const poly of regions[id]) for (const ring of poly) for (const pt of ring) {
    const [x, y] = project(pt);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }

const PAD = 12, W = 560;
const sx = (W - PAD * 2) / (maxX - minX);
const H = (maxY - minY) * sx + PAD * 2;
const tx = (x) => PAD + (x - minX) * sx;
const ty = (y) => PAD + (maxY - y) * sx; // flip vertical

// Douglas-Peucker simplify (in projected px space)
function rdp(points, eps) {
  if (points.length < 3) return points;
  let dmax = 0, idx = 0;
  const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
// RDP assumes an open polyline; a closed ring's coincident endpoints collapse
// it to a degenerate zero-length baseline. Split the ring at its farthest
// vertex into two open arcs, simplify each, then re-close.
function simplifyRing(ring, eps) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  if (open.length < 4) return ring;
  let far = 0, fd = -1;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  const a = rdp(open.slice(0, far + 1), eps);
  const b = rdp(open.slice(far).concat([open[0]]), eps);
  const merged = a.slice(0, -1).concat(b.slice(0, -1));
  merged.push(merged[0]);
  return merged;
}

const round = (n) => Math.round(n * 10) / 10;
const paths = {};
const labels = {};
for (const id in regions) {
  let d = "";
  let cx = 0, cy = 0, cn = 0, bestArea = 0, bestCentroid = null;
  for (const poly of regions[id]) {
    for (let ri = 0; ri < poly.length; ri++) {
      let ring = poly[ri].map((pt) => { const [x, y] = project(pt); return [tx(x), ty(y)]; });
      // drop tiny islands (rings with small bbox) to keep paths clean
      let rminx=Infinity,rminy=Infinity,rmaxx=-Infinity,rmaxy=-Infinity;
      for (const [x,y] of ring){if(x<rminx)rminx=x;if(x>rmaxx)rmaxx=x;if(y<rminy)rminy=y;if(y>rmaxy)rmaxy=y;}
      if (Math.max(rmaxx-rminx, rmaxy-rminy) < 4) continue;
      ring = simplifyRing(ring, 0.5);
      if (ring.length < 4) continue;
      d += "M" + ring.map(([x, y]) => `${round(x)},${round(y)}`).join("L") + "Z";
      // shoelace area + centroid for outer rings (label placement)
      let area = 0, accx = 0, accy = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
        const cross = x1 * y2 - x2 * y1;
        area += cross; accx += (x1 + x2) * cross; accy += (y1 + y2) * cross;
      }
      area = Math.abs(area / 2);
      if (area > bestArea) {
        bestArea = area;
        const a6 = (ring.reduce((s,_,i)=>{ if(i===ring.length-1)return s; const[x1,y1]=ring[i],[x2,y2]=ring[i+1];return s+(x1*y2-x2*y1);},0));
        bestCentroid = [accx / (3 * a6), accy / (3 * a6)];
      }
    }
  }
  paths[id] = d;
  labels[id] = bestCentroid ? [round(bestCentroid[0]), round(bestCentroid[1])] : [W/2, H/2];
}

// emit TS
let out = `// AUTO-GENERATED from real UK boundary data (ITL1/EER statistical regions +\n`;
out += `// Northern Ireland outline), source: martinjc/UK-GeoJSON (ONS-derived).\n`;
out += `// Equirectangular projection (lat-corrected), Douglas-Peucker simplified.\n`;
out += `// Regenerate with scripts/build_uk_paths.cjs. Do not hand-edit.\n\n`;
out += `export const UK_VIEWBOX = "0 0 ${W} ${Math.round(H)}";\n\n`;
out += `export interface RegionShape {\n  d: string;\n  label: [number, number];\n}\n\n`;
out += `export const REGION_PATHS: Record<string, RegionShape> = {\n`;
for (const id of ["SCO","NI","NE","NW","YH","EM","WM","EE","WAL","LON","SE","SW"]) {
  out += `  ${id}: { d: "${paths[id]}", label: [${labels[id][0]}, ${labels[id][1]}] },\n`;
}
out += `};\n`;
fs.writeFileSync("src/content/uk/regionPaths.ts", out);
console.log("viewBox H =", Math.round(H));
for (const id in paths) console.log(id, "pts~", (paths[id].match(/L/g)||[]).length, "label", labels[id]);
