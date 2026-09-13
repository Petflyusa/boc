const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  filterTransactions,
  paginateTransactions,
  calculateInterestForPeriod,
  createInterestTransactions,
  reconcileTransactionBalances,
  transactions: demoTransactions,
  transactionEntryMarkup,
  createTransactionPdf,
  selectStatementTransactions,
  accountNumber,
  openingBalance,
  currentAccountBalance,
} = require('../iGTB Net（企业网银）_files/dashboard-transactions.js');
const {
  getRecentTransactions,
  buildRecentTransactionsTable,
} = require('../iGTB Net（企业网银）_files/dashboard-recent-transactions.js');

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

test('carries the prior closing balance into a new interest period', () => {
  const interest = calculateInterestForPeriod([
    { date: '2026-01-01', balance: 500 },
    { date: '2026-01-31', balance: 1000 },
  ], '2026-02-01', '2026-02-02', 0.36);

  assert.equal(interest, 2);
});

test('creates quarterly interest entries on the 21st of each quarter-end month', () => {
  const records = createInterestTransactions([
    { date: '2026-01-01', balance: 1000000 },
    { date: '2026-03-20', balance: 1200000 },
    { date: '2026-06-20', balance: 1500000 },
  ], {
    from: '2026-01-01',
    to: '2026-09-30',
    asOf: '2026-09-30',
    annualRate: 0.0005,
  });

  assert.deepEqual(records.map((item) => item.date), ['2026-03-21', '2026-06-21', '2026-09-21']);
  assert.equal(records[0].type, '季度结息');
  assert.equal(records[0].direction, 'in');
  assert.equal(records[0].note, '人民币活期存款季度结息');
  assert.ok(records[0].amount > 0);
});

test('does not create interest entries after the as-of date', () => {
  const records = createInterestTransactions([
    { date: '2026-01-01', balance: 1000000 },
    { date: '2026-09-10', balance: 1200000 },
  ], {
    from: '2026-01-01',
    to: '2026-09-10',
    asOf: '2026-09-11',
    annualRate: 0.0005,
  });

  assert.deepEqual(records.map((item) => item.date), ['2026-03-21', '2026-06-21']);
  assert.ok(records.every((item) => item.date <= '2026-09-11'));
});

test('accrues every day between quarterly settlements without dropping month-end days', () => {
  const records = createInterestTransactions([{ date: '2026-01-01', balance: 1000 }], {
    from: '2026-01-01', to: '2026-06-21', asOf: '2026-06-21', annualRate: 0.36,
  });
  assert.deepEqual(records.map((item) => item.amount), [79, 92]);
});

test('contains generated historical transactions without future dates', () => {
  assert.ok(demoTransactions.length > 24);
  assert.ok(demoTransactions.every((item) => item.date <= '2026-09-12'));
});

test('uses real-looking legal names for every transaction counterparty', () => {
  const placeholderNames = [
    '示例',
    '客户有限公司',
    '本行代发工资',
    '集团资金池',
    '服务中心',
    '行政管理部',
    'BOC FX Settlement',
  ];

  assert.ok(demoTransactions.every((item) => item.counterparty && item.counterparty.trim()));
  assert.ok(demoTransactions.every((item) => !placeholderNames.some((placeholder) => item.counterparty.includes(placeholder))));
});

test('uses the statement account number for every generated transaction', () => {
  assert.equal(accountNumber, '115863604036');
  assert.ok(demoTransactions.every((item) => item.account === accountNumber));
});

test('keeps the dashboard balance equal to the latest transaction balance', () => {
  const dashboard = fs.readFileSync(require.resolve('../iGTB Net（企业网银）_files/dashboard.html'), 'utf8');
  const formattedBalance = currentAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 });

  assert.equal(demoTransactions[0].balance, currentAccountBalance);
  assert.ok(dashboard.includes(formattedBalance));
});

test('starts the 2026 statement from the requested opening balance', () => {
  assert.equal(openingBalance, 730000);
  assert.equal(Math.min(...demoTransactions.map((item) => item.balance)) > 0, true);
  assert.equal(demoTransactions.map((item) => item.date).sort()[0], '2026-01-02');
});

test('generates five to ten transactions per completed month', () => {
  const counts = demoTransactions.reduce((result, item) => {
    if (item.type === '季度结息') return result;
    const month = item.date.slice(0, 7);
    result[month] = (result[month] || 0) + 1;
    return result;
  }, {});

  assert.ok(Object.keys(counts).length >= 9);
  assert.ok(Object.values(counts).every((count) => count >= 5 && count <= 10));
});

test('includes the June 25 investment transfer and only completed quarterly interest dates', () => {
  const investment = demoTransactions.find((item) => item.date === '2026-06-25' && item.amount === 30000000);
  assert.deepEqual({
    direction: investment.direction,
    counterparty: investment.counterparty,
    note: investment.note,
    bank: investment.bank,
  }, { direction: 'in', counterparty: '刘佳', note: '项目期投资款项', bank: '中国银行' });

  const interestDates = demoTransactions
    .filter((item) => item.type === '季度结息')
    .map((item) => item.date);
  assert.deepEqual(interestDates.sort(), ['2026-03-21', '2026-06-21']);
});

test('keeps ordinary amounts in range and counterparties local to Chengdu', () => {
  const ordinary = demoTransactions.filter((item) => !['季度结息', '手续费', '投资款入账'].includes(item.type));

  assert.ok(ordinary.every((item) => item.amount >= 500 && item.amount <= 10000));
  assert.ok(ordinary.every((item) => item.counterparty.startsWith('成都')));
});

test('reconciles the latest transaction balance with the current account balance', () => {
  const result = reconcileTransactionBalances([
    { id: 'older', date: '2026-09-09', time: '09:00', direction: 'in', amount: 100 },
    { id: 'latest', date: '2026-09-10', time: '09:00', direction: 'out', amount: 40 },
  ], 1000);

  assert.equal(result.find((item) => item.id === 'latest').balance, 1000);
  assert.equal(result.find((item) => item.id === 'older').balance, 1040);
});

test('creates a landscape statement preview without watermark, seal, or demo wording', () => {
  const pdf = createTransactionPdf([
    { date: '2026-09-10', time: '09:18', type: '转账汇款', counterparty: '上海寻梦信息技术有限公司', account: '621700001234', amount: 1200, direction: 'out', balance: 1000, status: '交易成功' },
  ], { account: '115863604036', accountName: '成都万格大集酒店管理有限责任公司', bankName: '中国银行成都东大街支行', currentBalance: 1000, from: '2026-09-01', to: '2026-09-10' });

  const utf16Hex = (value) => Array.from(value)
    .map((character) => character.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');

  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /\/MediaBox \[0 0 842 595\]/);
  assert.match(pdf, new RegExp(utf16Hex('中国银行成都东大街支行')));
  assert.match(pdf, new RegExp(utf16Hex('成都万格大集酒店管理有限责任公司')));
  assert.match(pdf, new RegExp(utf16Hex('借方发生额')));
  assert.match(pdf, new RegExp(utf16Hex('贷方发生额')));
  assert.match(pdf, new RegExp(utf16Hex('中国银行股份有限公司')));
  assert.match(pdf, new RegExp(utf16Hex('预览非正式')));
  assert.doesNotMatch(pdf, new RegExp(utf16Hex('演示')));
  assert.doesNotMatch(pdf, /0\.63 0\.03 0\.03 RG 1\.2 w 690 535 122 45 re S/);
  assert.match(pdf, new RegExp(utf16Hex('起始日期 20260901')));
  assert.match(pdf, new RegExp(utf16Hex('截止日期 20260910')));
  assert.match(pdf, new RegExp(utf16Hex('上海寻梦信息技术有限公司')));
  assert.match(pdf, /%%EOF/);
});

test('selects an inclusive date range for statement preview and download', () => {
  const selected = selectStatementTransactions(transactions, '2026-09-09', '2026-09-10');

  assert.deepEqual(selected.map((item) => item.id), ['1', '2']);
});

test('uses the dashboard SVG icon structure for the transaction entry', () => {
  assert.match(transactionEntryMarkup, /class="iconSvg svg-icon"/);
  assert.match(transactionEntryMarkup, /width="40" height="40"/);
  assert.match(transactionEntryMarkup, /data-v-10506728/);
  assert.match(transactionEntryMarkup, /data-v-dffe8856/);
  assert.match(transactionEntryMarkup, /<use[^>]+#icon-query-center/);
  assert.match(transactionEntryMarkup, /icon_text.*交易记录/);
});

test('selects and sorts transactions from the previous seven days', () => {
  const result = getRecentTransactions([
    { id: 'old', date: '2026-09-03', time: '10:00', amount: 1 },
    { id: 'newer', date: '2026-09-10', time: '12:00', amount: 2 },
    { id: 'latest', date: '2026-09-11', time: '09:00', amount: 3 },
  ], '2026-09-11', 7);
  assert.deepEqual(result.map((item) => item.id), ['latest', 'newer']);
});

test('builds a recent transaction table with income and expense classes', () => {
  const html = buildRecentTransactionsTable([
    { date: '2026-09-11', time: '09:00', type: '货款收款', counterparty: '客户', amount: 1200, direction: 'in', balance: 10000 },
  ]);
  assert.match(html, /最近7天交易明细/);
  assert.match(html, /boc-recent-income/);
  assert.match(html, /货款收款/);
});
