// Generates real-geography SVG map shape files for Canada, Germany, France and
// Australia (src/content/countries/paths/{ca,de,fr,au}.ts), following the UK
// pipeline in scripts/build_uk_paths.cjs:
//   source geo data -> (optional group union) -> equirectangular lat-corrected
//   projection -> Douglas-Peucker simplify -> viewBox fit -> TS emit.
//
// Sources (download to the scratchpad dir first, see SRC below):
//   CA/AU: Natural Earth ne_50m_admin_1_states_provinces.geojson
//          https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
//   DE:    isellsoap/deutschlandGeoJSON 2_bundeslaender/3_mittel.geo.json
//          https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/3_mittel.geo.json
//   FR:    gregoiredavid/france-geojson regions.geojson (post-2016 régions)
//          https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson
//
// Merged groups (CA NORTH, DE NORTH/NE/EAST/WEST) are geometrically unioned by
// edge cancellation: shared borders in these datasets carry identical vertex
// sequences, so interior edges appear twice (opposite directions) and are
// dropped, then the remaining boundary edges are stitched back into rings.
//
// Usage: node scripts/build_country_paths.cjs [srcDir]

const fs = require("fs");
const path = require("path");

const SRC_DIR = process.argv[2] || "/tmp/claude-0/-root/1bb8134f-b1af-4382-9ecf-16d0bbdddf08/scratchpad";
const OUT_DIR = path.join(__dirname, "..", "src", "content", "countries", "paths");

// ---------------------------------------------------------------- geo input
// Normalise a GeoJSON feature geometry to an array of polygons; each polygon
// is an array of rings; each ring an array of [lon, lat].
function featurePolygons(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates];
  if (geom.type === "MultiPolygon") return geom.coordinates;
  return [];
}

// ------------------------------------------------------- union of adjacency
// Union adjacent polygons that share identical border vertex sequences.
// Input: array of polygons (array of rings). Output: array of rings.
// Throws if any boundary chain fails to close (vertex mismatch => fall back).
function unionByEdgeCancellation(polygons) {
  const q = (n) => Math.round(n * 1e6);
  const pk = (p) => q(p[0]) + "," + q(p[1]);
  const ek = (a, b) => pk(a) + "|" + pk(b);
  const edges = new Map(); // key -> [a, b]
  for (const poly of polygons) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i], b = ring[i + 1];
        if (pk(a) === pk(b)) continue; // degenerate
        const rk = ek(b, a);
        if (edges.has(rk)) edges.delete(rk); // interior edge: cancel
        else edges.set(ek(a, b), [a, b]);
      }
    }
  }
  const byStart = new Map(); // point key -> [edge keys...]
  for (const [k, [a]] of edges) {
    const sk = pk(a);
    if (!byStart.has(sk)) byStart.set(sk, []);
    byStart.get(sk).push(k);
  }
  const used = new Set();
  const rings = [];
  for (const [k0, [a0, b0]] of edges) {
    if (used.has(k0)) continue;
    used.add(k0);
    const ring = [a0, b0];
    let cur = b0;
    let guard = edges.size + 2;
    while (pk(cur) !== pk(a0)) {
      if (--guard <= 0) throw new Error("union: unclosed boundary chain");
      const cands = (byStart.get(pk(cur)) || []).filter((k) => !used.has(k));
      if (!cands.length) throw new Error("union: dead-end boundary chain");
      const k = cands[0];
      used.add(k);
      cur = edges.get(k)[1];
      ring.push(cur);
    }
    rings.push(ring);
  }
  return rings;
}

// -------------------------------------------------------- simplify (px space)
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
// Split a closed ring at its farthest vertex into two open arcs (RDP degrades
// on closed rings whose endpoints coincide), simplify each, re-close.
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

// ------------------------------------------------------------ build country
// cfg: { name, constName, sourceNote, lat0, eps, minIslandPx, clip?, order,
//        regions: id -> array of polygons (lon/lat), labelNudge?: id -> [dx,dy] }
function buildCountry(cfg) {
  const k = Math.cos((cfg.lat0 * Math.PI) / 180);
  const project = ([lon, lat]) => [lon * k, lat];
  const inClip = ([lon, lat]) =>
    !cfg.clip || (lon >= cfg.clip[0] && lon <= cfg.clip[2] && lat >= cfg.clip[1] && lat <= cfg.clip[3]);

  // clip whole rings whose every vertex is outside the clip box (far islands)
  const regions = {};
  for (const id of cfg.order) {
    const polys = cfg.regions[id];
    if (!polys || !polys.length) throw new Error(`${cfg.name}: missing region ${id}`);
    regions[id] = polys
      .map((poly) => poly.filter((ring) => ring.some(inClip)))
      .filter((poly) => poly.length);
  }

  // projected bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of cfg.order)
    for (const poly of regions[id]) for (const ring of poly) for (const pt of ring) {
      const [x, y] = project(pt);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }

  const PAD = 8, W = 560;
  const sx = (W - PAD * 2) / (maxX - minX);
  const H = Math.round((maxY - minY) * sx + PAD * 2);
  const tx = (x) => PAD + (x - minX) * sx;
  const ty = (y) => PAD + (maxY - y) * sx; // flip vertical

  const round = (n) => Math.round(n * 10) / 10;
  const shapes = {};
  for (const id of cfg.order) {
    let d = "";
    let bestArea = 0, bestCentroid = null;
    for (const poly of regions[id]) {
      for (const rawRing of poly) {
        let ring = rawRing.map((pt) => { const [x, y] = project(pt); return [tx(x), ty(y)]; });
        // drop tiny islands to keep paths clean
        let rminx = Infinity, rminy = Infinity, rmaxx = -Infinity, rmaxy = -Infinity;
        for (const [x, y] of ring) {
          if (x < rminx) rminx = x; if (x > rmaxx) rmaxx = x;
          if (y < rminy) rminy = y; if (y > rmaxy) rmaxy = y;
        }
        if (Math.max(rmaxx - rminx, rmaxy - rminy) < cfg.minIslandPx) continue;
        ring = simplifyRing(ring, cfg.eps);
        if (ring.length < 4) continue;
        d += "M" + ring.map(([x, y]) => `${round(x)},${round(y)}`).join("L") + "Z";
        // shoelace area + centroid (largest ring wins the label)
        let a6 = 0, accx = 0, accy = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
          const cross = x1 * y2 - x2 * y1;
          a6 += cross; accx += (x1 + x2) * cross; accy += (y1 + y2) * cross;
        }
        const area = Math.abs(a6 / 2);
        if (area > bestArea) {
          bestArea = area;
          bestCentroid = [accx / (3 * a6), accy / (3 * a6)];
        }
      }
    }
    if (!d) throw new Error(`${cfg.name}: region ${id} produced an empty path`);
    const nudge = (cfg.labelNudge && cfg.labelNudge[id]) || [0, 0];
    shapes[id] = {
      d,
      label: bestCentroid
        ? [round(bestCentroid[0] + nudge[0]), round(bestCentroid[1] + nudge[1])]
        : [W / 2, H / 2],
    };
  }
  return { viewBox: `0 0 ${W} ${H}`, W, H, shapes, cfg };
}

// ------------------------------------------------------------------- emit TS
function emit(built, file) {
  const { cfg, viewBox, shapes } = built;
  let out = `// AUTO-GENERATED by scripts/build_country_paths.cjs from ${cfg.sourceNote}.\n`;
  out += `// Do not hand-edit — regenerate with: node scripts/build_country_paths.cjs\n`;
  out += `// Equirectangular projection (cos(${cfg.lat0}°) lat correction), Douglas-Peucker simplified.\n`;
  if (cfg.extraNote) out += `// ${cfg.extraNote}\n`;
  out += `\nimport type { CountryMapShapes } from "@engine/countryGame";\n\n`;
  out += `export const ${cfg.constName}: CountryMapShapes = {\n`;
  out += `  viewBox: "${viewBox}",\n`;
  out += `  shapes: {\n`;
  for (const id of cfg.order) {
    const s = shapes[id];
    out += `    ${id}: { d: "${s.d}", label: [${s.label[0]}, ${s.label[1]}] },\n`;
  }
  out += `  },\n};\n`;
  fs.writeFileSync(file, out);
  return out.length;
}

// -------------------------------------------------------------- load sources
const ne50 = JSON.parse(fs.readFileSync(path.join(SRC_DIR, "ne50_admin1.geojson")));
const deSrc = JSON.parse(fs.readFileSync(path.join(SRC_DIR, "de_laender.geojson")));
const frSrc = JSON.parse(fs.readFileSync(path.join(SRC_DIR, "fr_regions.geojson")));

function neCountry(a3) {
  const m = {};
  for (const f of ne50.features) {
    if (f.properties.adm0_a3 !== a3) continue;
    m[f.properties.name] = featurePolygons(f.geometry);
  }
  return m;
}

// Map region groups; single-member groups pass through, multi-member groups
// are unioned (fallback: plain concatenation if the union fails to close).
function groupRegions(byName, groups, countryLabel) {
  const out = {};
  for (const [id, members] of Object.entries(groups)) {
    const polys = [];
    for (const name of members) {
      if (!byName[name]) throw new Error(`${countryLabel}: source missing "${name}"`);
      polys.push(...byName[name]);
    }
    if (members.length === 1) { out[id] = polys; continue; }
    try {
      out[id] = [unionByEdgeCancellation(polys)]; // one polygon, many rings
      console.log(`${countryLabel} ${id}: union OK (${members.length} members -> ${out[id][0].length} rings)`);
    } catch (e) {
      console.warn(`${countryLabel} ${id}: union failed (${e.message}), concatenating members`);
      out[id] = polys;
    }
  }
  return out;
}

// --------------------------------------------------------------------- CA
const caNames = neCountry("CAN");
const CA = buildCountry({
  name: "Canada", constName: "CA_MAP",
  sourceNote: "Natural Earth ne_50m_admin_1_states_provinces (CAN)",
  extraNote: "NORTH = Yukon + Northwest Territories + Nunavut merged (arc-cancellation union).",
  lat0: 60, eps: 1.1, minIslandPx: 7,
  order: ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "NORTH"],
  regions: groupRegions(caNames, {
    BC: ["British Columbia"], AB: ["Alberta"], SK: ["Saskatchewan"], MB: ["Manitoba"],
    ON: ["Ontario"], QC: ["Québec"], NB: ["New Brunswick"], NS: ["Nova Scotia"],
    PE: ["Prince Edward Island"], NL: ["Newfoundland and Labrador"],
    NORTH: ["Yukon", "Northwest Territories", "Nunavut"],
  }, "CA"),
  // NORTH's largest ring is the merged mainland; nudge the label toward the
  // NWT/Nunavut mainland's visual middle if the centroid drifts.
  labelNudge: { NORTH: [0, 20] },
});

// --------------------------------------------------------------------- DE
const deNames = {};
for (const f of deSrc.features) deNames[f.properties.name] = featurePolygons(f.geometry);
const DE = buildCountry({
  name: "Germany", constName: "DE_MAP",
  sourceNote: "isellsoap/deutschlandGeoJSON 2_bundeslaender/3_mittel.geo.json",
  extraNote: "Grouped Länder (NORTH/NE/EAST/WEST) merged via arc-cancellation union.",
  lat0: 51, eps: 0.6, minIslandPx: 4,
  order: ["NORTH", "NE", "NRW", "EAST", "WEST", "BW", "BAV"],
  regions: groupRegions(deNames, {
    NORTH: ["Niedersachsen", "Schleswig-Holstein", "Hamburg", "Bremen"],
    NE: ["Berlin", "Brandenburg", "Mecklenburg-Vorpommern"],
    NRW: ["Nordrhein-Westfalen"],
    EAST: ["Sachsen", "Sachsen-Anhalt", "Thüringen"],
    WEST: ["Hessen", "Rheinland-Pfalz", "Saarland"],
    BW: ["Baden-Württemberg"],
    BAV: ["Bayern"],
  }, "DE"),
});

// --------------------------------------------------------------------- FR
const FR_CODE2ID = {
  32: "HDF", 28: "NOR", 44: "GE", 53: "BRE", 52: "PDL", 11: "IDF",
  27: "BFC", 24: "CVL", 75: "NAQ", 84: "ARA", 76: "OCC", 93: "PACA",
  94: "COM", // Corse stands in for the bundle's "Corse & Outre-mer" unit
};
const frRegions = {};
for (const f of frSrc.features) {
  const id = FR_CODE2ID[Number(f.properties.code)];
  if (id) frRegions[id] = featurePolygons(f.geometry);
}
const FR = buildCountry({
  name: "France", constName: "FR_MAP",
  sourceNote: "gregoiredavid/france-geojson regions.geojson (post-2016 régions)",
  extraNote: "COM = Corse shape standing in for the bundle's \"Corse & Outre-mer\" unit.",
  lat0: 46.5, eps: 0.6, minIslandPx: 3,
  order: ["HDF", "NOR", "GE", "BRE", "PDL", "IDF", "BFC", "CVL", "NAQ", "ARA", "OCC", "PACA", "COM"],
  regions: frRegions,
});

// --------------------------------------------------------------------- AU
const auNames = neCountry("AUS"); // includes Jervis Bay Territory (excluded below)
const AU = buildCountry({
  name: "Australia", constName: "AU_MAP",
  sourceNote: "Natural Earth ne_50m_admin_1_states_provinces (AUS)",
  extraNote: "Clipped to the mainland + Tasmania box (drops Macquarie, Lord Howe etc.); ACT drawn last so the enclave sits above NSW.",
  lat0: -25, eps: 1.0, minIslandPx: 5,
  clip: [111.5, -44.5, 155.5, -9.0], // lonMin, latMin, lonMax, latMax
  order: ["WA", "NT", "SA", "QLD", "NSW", "VIC", "TAS", "ACT"],
  regions: groupRegions(auNames, {
    NSW: ["New South Wales"], VIC: ["Victoria"], QLD: ["Queensland"],
    WA: ["Western Australia"], SA: ["South Australia"], TAS: ["Tasmania"],
    NT: ["Northern Territory"], ACT: ["Australian Capital Territory"],
  }, "AU"),
});

// ------------------------------------------------------------------- write
fs.mkdirSync(OUT_DIR, { recursive: true });
const files = [
  [CA, "ca.ts"], [DE, "de.ts"], [FR, "fr.ts"], [AU, "au.ts"],
];
for (const [built, name] of files) {
  const bytes = emit(built, path.join(OUT_DIR, name));
  console.log(`${name}: ${(bytes / 1024).toFixed(1)} KB, viewBox ${built.viewBox}`);
}

// -------------------------------------------------------------- assertions
function assertCountry(built, expectIds, aspectMin, aspectMax) {
  const { cfg, shapes, W, H } = built;
  const ids = Object.keys(shapes).sort();
  const want = expectIds.slice().sort();
  if (JSON.stringify(ids) !== JSON.stringify(want))
    throw new Error(`${cfg.name}: region ids ${ids} != expected ${want}`);
  const aspect = W / H;
  if (aspect < aspectMin || aspect > aspectMax)
    throw new Error(`${cfg.name}: aspect ${aspect.toFixed(2)} outside [${aspectMin}, ${aspectMax}]`);
  for (const [id, s] of Object.entries(shapes)) {
    if (!s.d || /NaN/.test(s.d)) throw new Error(`${cfg.name} ${id}: bad path data`);
    if (!/^M[-\d.,LMZ]+Z$/.test(s.d)) throw new Error(`${cfg.name} ${id}: malformed path`);
    const [lx, ly] = s.label;
    if (!Number.isFinite(lx) || !Number.isFinite(ly)) throw new Error(`${cfg.name} ${id}: NaN label`);
    if (lx < 0 || lx > W || ly < 0 || ly > H) throw new Error(`${cfg.name} ${id}: label [${lx},${ly}] outside viewBox 0 0 ${W} ${H}`);
    // every path coordinate inside the viewBox (with rounding slack)
    for (const m of s.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      if (x < -1 || x > W + 1 || y < -1 || y > H + 1)
        throw new Error(`${cfg.name} ${id}: point [${x},${y}] outside viewBox`);
    }
  }
}
assertCountry(CA, ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "NORTH"], 0.75, 1.6); // wide-ish
assertCountry(DE, ["NORTH", "NE", "NRW", "EAST", "WEST", "BW", "BAV"], 0.55, 0.95); // tall
assertCountry(FR, ["HDF", "NOR", "GE", "BRE", "PDL", "IDF", "BFC", "CVL", "NAQ", "ARA", "OCC", "PACA", "COM"], 0.8, 1.3); // squarish
assertCountry(AU, ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"], 1.0, 1.6); // wide
console.log("All assertions passed.");
