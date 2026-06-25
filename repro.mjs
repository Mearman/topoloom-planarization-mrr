// Minimal reproduction: `planarizationLayout` throws
// "Planarization graph should be planar" on a 20-node / 28-edge non-planar
// graph with multiple removed edges.
//
// Run: npm install && npm run repro
import { fromEdgeList } from "@khalidsaidi/topoloom/graph";
import { planarizationLayout } from "@khalidsaidi/topoloom/layout";

// A reduced subgraph (20 nodes, 28 edges) derived from a real document.
// It is non-planar and requires removing multiple edges to planarise, which
// is where planarizationLayout fails.
const edges = [
  ["REAL1", "ELEM4"], ["REAL5", "ELEM4"], ["DEC2", "ELEM4"], ["DEC2", "INV2"],
  ["DEC3", "INV1"], ["DEC4", "INV4"], ["DEC8", "REAL5"], ["DEC8", "REAL1"],
  ["DEC8", "INV21"], ["DEC8", "INV22"], ["DEC8", "POL20"], ["DEC9", "REAL5"],
  ["DEC9", "REAL1"], ["DEC9", "INV21"], ["DEC10", "REAL5"], ["DEC10", "INV22"],
  ["DEC15", "REAL1"], ["DEC15", "POL20"], ["DEC16", "INV4"], ["DEC16", "INV21"],
  ["DEC16", "INV22"], ["DEC41", "INV1"], ["DEC41", "INV2"], ["CHG2", "DEC3"],
  ["CHG2", "DEC4"], ["CHG4", "DEC8"], ["CHG4", "DEC4"], ["CHG4", "DEC2"],
];

const graph = fromEdgeList(edges);

try {
  const result = planarizationLayout(graph);
  console.log("OK — crossings:", result.layout.stats.crossings);
} catch (error) {
  console.error("THROWS:", error.message);
  console.error(
    "\nExpected: a LayoutResult with routes + crossings for the removed edges.",
  );
  console.error(
    "Actual:   planarizationLayout rebuilds the combined graph with dummy",
  );
  console.error(
    "          crossing vertices and rejects it as non-planar, because it",
  );
  console.error(
    "          routes every removed edge into the ORIGINAL base mesh without",
  );
  console.error(
    "          re-embedding after each insertion.",
  );
  process.exit(1);
}
