const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeItems } = require('./orderItems');

test('coerces a string food_item_id to a number', () => {
  // Regression: Map.has("53") missed the numeric session-item key, so a valid order
  // 404'd with "One or more session items not found for this session".
  assert.deepEqual(normalizeItems([{ food_item_id: '53', quantity: 2 }]), [
    { food_item_id: 53, quantity: 2 },
  ]);
});

test('leaves a numeric food_item_id alone and preserves other fields', () => {
  assert.deepEqual(normalizeItems([{ food_item_id: 53, quantity: 1, note: 'extra' }]), [
    { food_item_id: 53, quantity: 1, note: 'extra' },
  ]);
});

test('non-numeric ids become NaN, which the callers\' falsy guard rejects', () => {
  const [item] = normalizeItems([{ food_item_id: 'not-a-number', quantity: 1 }]);
  assert.ok(Number.isNaN(item.food_item_id));
  assert.ok(!item.food_item_id, 'NaN must stay falsy so the existing guard still 404s');
});

test('passes a non-array body straight through', () => {
  assert.equal(normalizeItems(undefined), undefined);
  assert.equal(normalizeItems(null), null);
});
