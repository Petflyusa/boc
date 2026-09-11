const test = require('node:test');
const assert = require('node:assert/strict');

const {
  filterTransactions,
  paginateTransactions,
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
