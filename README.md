# topoloom `planarizationLayout` — minimal reproduction

`@khalidsaidi/topoloom@0.2.7`'s `planarizationLayout(graph)` throws
`"Planarization graph should be planar"` on a 20-node / 28-edge non-planar
graph that needs several edges removed to planarise.

## Run

```sh
npm install
npm run repro
```

Output:

```
THROWS: Planarization graph should be planar
```

Single-obstruction graphs (K5, K3,3) work fine — `planarizationLayout`
returns `crossings: 1`. The bug only appears when **multiple** removed edges
are routed, because their accumulated dummy insertions conflict.

## Root cause

In `planarizationLayout` (dist `chunk-LHPISHQ4.js`), the routing loop passes
the **same static** `baseMesh` to `routeEdgeFixedEmbedding` for every removed
edge:

```js
for (const edgeId of remaining) {
  const edge = graph.edge(edgeId);
  const route = routeEdgeFixedEmbedding(baseMesh, edge.u, edge.v); // static mesh
  // ... accumulate crossings into edgePaths/insertedEdges ...
}
// then build the combined graph and:
if (!planarEmbedding.planar) throw new Error("Planarization graph should be planar");
```

Routing every removed edge into the original (un-modified) embedding, then
combining all the dummy insertions at the end, produces a graph that is not
planar — because each route was computed ignoring the dummies the previous
routes introduced.

## Correct behaviour

Edge insertion must be incremental: route one edge, insert its dummy crossing
vertices into the mesh, **re-embed**, then route the next edge in the updated
embedding. After each step the graph stays planar by construction, so the final
`testPlanarity` never fails.

```js
let mesh = buildHalfEdgeMesh(baseGraph, baseEmbedding.embedding);
let current = baseGraph;     // grows with dummies each step
let currentMesh = mesh;
for (const edgeId of remaining) {
  const { u, v } = graph.edge(edgeId);
  const route = routeEdgeFixedEmbedding(currentMesh, u, v); // UPDATED mesh
  // insert dummies on route.crossedPrimalEdges, split edges, chain u -> dummies -> v
  current = rebuildWithDummies(current, route);
  const emb = testPlanarity(current);             // re-embed
  currentMesh = buildHalfEdgeMesh(current, emb.embedding);
}
```

With the incremental loop, this same 20-node graph planarises cleanly (the
sample it was reduced from yields ~104 crossings total).

## Environment

- `@khalidsaidi/topoloom@0.2.7`
- Node 26.x (also reproduces on the WASM path in the browser via Vite)
