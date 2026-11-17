// Small helpers shared by all cards: HTML escaping and the hold-ring graphics.

export const RING_IB = '<svg class="hring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>';

export const RING_TILE = '<svg class="hring big" viewBox="0 0 60 60"><circle cx="30" cy="30" r="27"/></svg>';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
