/**
 * Session-item lookups are keyed by food_items.id, a NUMBER. A JSON body may carry
 * food_item_id as a string ("53"), and Map.has("53") misses a numeric key — which
 * surfaced as a misleading "session items not found" 404. Normalize once at the
 * request boundary rather than coercing at every lookup site.
 *
 * A non-numeric id becomes NaN, which is falsy, so the callers' existing
 * `if (!foodItemId || ...)` guard still rejects it as not-found.
 */
function normalizeItems(items) {
  return Array.isArray(items)
    ? items.map((it) => ({ ...it, food_item_id: Number(it.food_item_id) }))
    : items;
}

module.exports = { normalizeItems };
