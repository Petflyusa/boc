const test = require('node:test');
const assert = require('node:assert/strict');

const {
  filterTransactions,
  paginateTransactions,
  calculateInterestForPeriod,
  createInterestTransactions,
} = require('../iGTB Net（企业网银）_files/dashboard-transactions.js');

const transactions = [
  {
    id: '1', date: '2026-09-10', type: '转账汇款', direction: 'out',
    counterparty: '上海示例科技有限公司', account: '621700001234', amount: 1200,
  },
  {
    id: '2', date: '2026-09-09', type: '工资发放', direction: 'in',
    counterparty: '华东客户', account: '621700005678', amount: 6800,
  },
  {
    id: '3', date: '2026-08-28', type: '费用报销', direction: 'out',
    counterparty: '深圳服务中心', account: '621700009999', amount: 300,
  },
];

test('combines date, direction, amount, and keyword filters', () => {
  const result = filterTransactions(transactions, {
    from: '2026-09-01',
    to: '2026-09-30',
    direction: 'out',
    minAmount: '1000',
    maxAmount: '2000',
    keyword: '上海',
  });

  assert.deepEqual(result.map((item) => item.id), ['1']);
});

test('paginates filtered results with stable metadata', () => {
  const result = paginateTransactions(transactions, 2, 2);

  assert.deepEqual(result.items.map((item) => item.id), ['3']);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 2);
  assert.equal(result.total, 3);
  assert.equal(result.totalPages, 2);
});

test('calculates interest from each daily balance using a 360-day basis', () => {
  const dailyBalances = [
    { date: '2026-09-01', balance: 100000 },
    { date: '2026-09-02', balance: 120000 },
    { date: '2026-09-03', balance: 120000 },
  ];

  assert.equal(calculateInterestForPeriod(dailyBalances, '2026-09-01', '2026-09-03', 0.0005), 0.47);
});

test('creates quarterly interest entries on the 20th of quarter-end months', () => {
  const records = createInterestTransactions([
    { date: '2026-08-04', balance: 1000000 },
    { date: '2026-09-10', balance: 1200000 },
  ], {
    from: '2026-07-01',
    to: '2026-09-10',
    annualRate: 0.0005,
  });

  assert.deepEqual(records.map((item) => item.date), ['2026-09-20']);
  assert.equal(records[0].type, '季度结息');
  assert.equal(records[0].direction, 'in');
  assert.equal(records[0].note, '人民币活期存款季度结息');
  assert.ok(records[0].amount > 0);
});
