const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FX_RATES,
  formatFxRate,
  buildFxRows,
} = require('../iGTB Net（企业网银）_files/dashboard-fx.js');

test('provides the current-day FX display currencies with buy and sell rates', () => {
  assert.equal(FX_RATES.length, 10);
  assert.deepEqual(FX_RATES.slice(0, 3).map((item) => item.code), ['USD', 'EUR', 'HKD']);
  assert.ok(FX_RATES.every((item) => item.buy > 0 && item.sell > 0));
  assert.ok(FX_RATES.every((item) => item.sell >= item.buy));
});

test('formats rates and builds escaped table rows', () => {
  assert.equal(formatFxRate(7.2485), '7.2485');
  const rows = buildFxRows(FX_RATES.slice(0, 1));
  assert.match(rows, /美元/);
  assert.match(rows, /USD/);
  assert.match(rows, /724\.85/);
  assert.match(rows, /723\.35/);
});
