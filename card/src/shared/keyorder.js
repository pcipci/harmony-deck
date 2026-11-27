// Own key order per device (0.27): keys move one place left or right inside their block of the device page.
// Stored as one list per device; only the order of the keys of one block among each other counts, so a block keeps
// its keys, and keys the device learns later come last.

// The keys of a block in the stored order; keys not in it keep their place among each other, after the others.
export function applyOrder(cmds, order) {
  if (!order?.length) return [...cmds];
  const at = new Map(order.map((c, i) => [c, i]));
  return cmds.map((c, i) => [c, at.has(c) ? at.get(c) : order.length + i]).sort((a, b) => a[1] - b[1]).map(([c]) => c);
}

// The block with `cmd` moved one place (dir -1 = left, 1 = right); unchanged at the edge.
export function moveKey(block, cmd, dir) {
  const out = [...block];
  const i = out.indexOf(cmd);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= out.length) return out;
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

// Stored order after a block got its new order (the other keys keep theirs).
export function mergeOrder(order, block) {
  return [...block, ...(order || []).filter((c) => !block.includes(c))];
}
