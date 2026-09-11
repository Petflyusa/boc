(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BocTransactions = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function toNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function filterTransactions(transactions, filters) {
    var options = filters || {};
    var from = options.from || '';
    var to = options.to || '';
    var minAmount = toNumber(options.minAmount);
    var maxAmount = toNumber(options.maxAmount);
    var keyword = String(options.keyword || '').trim().toLowerCase();

    return transactions
      .filter(function (item) {
        if (from && item.date < from) return false;
        if (to && item.date > to) return false;
        if (options.type && options.type !== 'all' && item.type !== options.type) return false;
        if (options.direction && options.direction !== 'all' && item.direction !== options.direction) return false;
        if (minAmount !== null && item.amount < minAmount) return false;
        if (maxAmount !== null && item.amount > maxAmount) return false;
        if (keyword) {
          var searchable = [item.type, item.counterparty, item.account, item.note]
            .join(' ')
            .toLowerCase();
          if (searchable.indexOf(keyword) === -1) return false;
        }
        return true;
      })
      .sort(function (a, b) {
        return (b.date + b.time).localeCompare(a.date + a.time);
      });
  }

  function paginateTransactions(transactions, page, pageSize) {
    var size = Math.max(1, Number(pageSize) || 10);
    var total = transactions.length;
    var totalPages = Math.max(1, Math.ceil(total / size));
    var currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    var start = (currentPage - 1) * size;
    return {
      items: transactions.slice(start, start + size),
      page: currentPage,
      pageSize: size,
      total: total,
      totalPages: totalPages,
    };
  }

  var DEFAULT_ANNUAL_RATE = 0.0005;
  var DEMO_AS_OF_DATE = '2026-09-11';

  function dateToIso(date) {
    return date.toISOString().slice(0, 10);
  }

  function calculateInterestForPeriod(dailyBalances, from, to, annualRate) {
    var rate = toNumber(annualRate);
    if (rate === null) rate = DEFAULT_ANNUAL_RATE;
    var balances = (dailyBalances || []).slice().sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
    var balanceByDate = new Map();
    balances.forEach(function (item) { balanceByDate.set(item.date, Number(item.balance) || 0); });
    var firstBalance = balances.length ? Number(balances[0].balance) || 0 : 0;
    var cursor = new Date(from + 'T00:00:00Z');
    var end = new Date(to + 'T00:00:00Z');
    var total = 0;
    var lastBalance = firstBalance;
    while (cursor <= end) {
      var date = dateToIso(cursor);
      if (balanceByDate.has(date)) lastBalance = balanceByDate.get(date);
      total += lastBalance * rate / 360;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return Math.round(total * 100) / 100;
  }

  function createInterestTransactions(transactions, options) {
    var settings = options || {};
    var source = (transactions || []).filter(function (item) { return item.type !== '季度结息'; });
    if (!source.length) return [];
    var from = settings.from || source.reduce(function (min, item) { return item.date < min ? item.date : min; }, source[0].date);
    var to = settings.to || source.reduce(function (max, item) { return item.date > max ? item.date : max; }, source[0].date);
    var asOf = settings.asOf || DEMO_AS_OF_DATE;
    if (to > asOf) to = asOf;
    var rate = toNumber(settings.annualRate);
    if (rate === null) rate = DEFAULT_ANNUAL_RATE;
    var start = new Date(from + 'T00:00:00Z');
    start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3, 1);
    var end = new Date(to + 'T00:00:00Z');
    var records = [];
    while (start <= end) {
      var settlement = new Date(start.getTime());
      settlement.setUTCMonth(start.getUTCMonth() + 2, 20);
      var periodEnd = new Date(settlement.getTime());
      periodEnd.setUTCDate(19);
      var settlementDate = dateToIso(settlement);
      if (settlementDate >= from && settlementDate <= asOf && start <= end) {
        var amount = calculateInterestForPeriod(source, dateToIso(start), dateToIso(periodEnd), rate);
        records.push({
          id: 'INT-' + settlementDate.replace(/-/g, ''),
          date: settlementDate,
          time: '09:00',
          type: '季度结息',
          direction: 'in',
          counterparty: '中国银行',
          account: source[0].account || '621700001234',
          amount: amount,
          balance: source[source.length - 1].balance || 0,
          status: '交易成功',
          note: '人民币活期存款季度结息',
        });
      }
      start.setUTCMonth(start.getUTCMonth() + 3, 1);
    }
    return records;
  }

  var TRANSACTIONS = [
    ['2026-09-10', '转账汇款', 'out', '上海示例科技有限公司', 128000, '采购合同款'],
    ['2026-09-09', '工资发放', 'out', '本行代发工资', 86000, '9月工资'],
    ['2026-09-08', '货款收款', 'in', '华东客户有限公司', 238500, '销售回款'],
    ['2026-09-07', '费用报销', 'out', '深圳服务中心', 3680, '差旅报销'],
    ['2026-09-05', '资金归集', 'in', '集团资金池', 500000, '资金归集'],
    ['2026-09-04', '结汇入账', 'in', 'BOC FX Settlement', 42680, '美元结汇'],
    ['2026-09-03', '转账汇款', 'out', '北京云启供应链', 75600, '供应商付款'],
    ['2026-09-02', '手续费', 'out', '中国银行', 36, '网银服务费'],
    ['2026-08-30', '货款收款', 'in', '广州南方贸易', 169800, '销售回款'],
    ['2026-08-29', '费用报销', 'out', '上海示例科技有限公司', 1290, '办公用品'],
    ['2026-08-28', '转账汇款', 'out', '杭州智造设备', 315000, '设备采购'],
    ['2026-08-27', '工资发放', 'out', '本行代发工资', 84200, '8月工资'],
    ['2026-08-25', '资金归集', 'in', '集团资金池', 420000, '资金归集'],
    ['2026-08-23', '货款收款', 'in', '华南客户有限公司', 198600, '销售回款'],
    ['2026-08-22', '转账汇款', 'out', '成都远景物流', 42800, '物流结算'],
    ['2026-08-20', '费用报销', 'out', '财务共享中心', 5200, '咨询服务费'],
    ['2026-08-18', '结汇入账', 'in', 'BOC FX Settlement', 58760, '欧元结汇'],
    ['2026-08-16', '货款收款', 'in', '宁波海联实业', 226400, '销售回款'],
    ['2026-08-14', '转账汇款', 'out', '天津港联物流', 67200, '仓储费用'],
    ['2026-08-12', '手续费', 'out', '中国银行', 48, '跨行转账手续费'],
    ['2026-08-10', '资金归集', 'in', '集团资金池', 380000, '资金归集'],
    ['2026-08-08', '货款收款', 'in', '华北客户有限公司', 176900, '销售回款'],
    ['2026-08-06', '费用报销', 'out', '行政管理部', 2480, '办公费用'],
    ['2026-08-04', '转账汇款', 'out', '苏州精工制造', 93500, '原材料采购'],
    ['2026-07-30', '货款收款', 'in', '华中客户有限公司', 154800, '销售回款'],
    ['2026-07-25', '转账汇款', 'out', '武汉供应链服务', 46800, '供应商付款'],
    ['2026-07-18', '费用报销', 'out', '行政管理部', 1860, '办公费用'],
    ['2026-07-12', '资金归集', 'in', '集团资金池', 310000, '资金归集'],
    ['2026-07-05', '工资发放', 'out', '本行代发工资', 83500, '7月工资'],
    ['2026-06-28', '货款收款', 'in', '华南客户有限公司', 187600, '销售回款'],
    ['2026-06-20', '转账汇款', 'out', '广州仓储中心', 52200, '仓储结算'],
    ['2026-06-15', '结汇入账', 'in', 'BOC FX Settlement', 39820, '港币结汇'],
    ['2026-06-08', '费用报销', 'out', '深圳服务中心', 3120, '差旅报销'],
    ['2026-06-03', '资金归集', 'in', '集团资金池', 295000, '资金归集'],
    ['2026-05-28', '货款收款', 'in', '华东客户有限公司', 162400, '销售回款'],
    ['2026-05-20', '工资发放', 'out', '本行代发工资', 82100, '5月工资'],
    ['2026-05-12', '转账汇款', 'out', '宁波海联实业', 73400, '原材料采购'],
    ['2026-05-06', '手续费', 'out', '中国银行', 52, '跨行转账手续费'],
    ['2026-04-26', '资金归集', 'in', '集团资金池', 280000, '资金归集'],
    ['2026-04-18', '货款收款', 'in', '华北客户有限公司', 143900, '销售回款'],
    ['2026-04-10', '费用报销', 'out', '财务共享中心', 4180, '咨询服务费'],
    ['2026-04-02', '转账汇款', 'out', '北京云启供应链', 68900, '供应商付款'],
    ['2026-03-20', '工资发放', 'out', '本行代发工资', 81800, '3月工资'],
    ['2026-03-08', '货款收款', 'in', '华中客户有限公司', 132500, '销售回款'],
    ['2026-02-21', '转账汇款', 'out', '天津港联物流', 46200, '物流结算'],
    ['2026-02-12', '资金归集', 'in', '集团资金池', 265000, '资金归集'],
    ['2026-01-20', '费用报销', 'out', '行政管理部', 2250, '办公费用'],
    ['2026-01-08', '货款收款', 'in', '华东客户有限公司', 121800, '销售回款'],
  ].map(function (row, index) {
    return {
      id: 'TX' + String(index + 1).padStart(4, '0'),
      date: row[0],
      time: index % 3 === 0 ? '09:18' : index % 3 === 1 ? '14:06' : '16:42',
      type: row[1],
      direction: row[2],
      counterparty: row[3],
      account: '62170000' + String(1234 + index * 173),
      amount: row[4],
      balance: 30000000 - index * 18200,
      status: '交易成功',
      note: row[5],
    };
  });

  TRANSACTIONS = TRANSACTIONS.concat(createInterestTransactions(TRANSACTIONS, {
    from: '2025-10-01',
    to: '2026-09-10',
    asOf: DEMO_AS_OF_DATE,
    annualRate: DEFAULT_ANNUAL_RATE,
  }));
  TRANSACTIONS = TRANSACTIONS.filter(function (item) { return item.date <= DEMO_AS_OF_DATE; });

  function formatMoney(value) {
    return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function init() {
    if (!document.body || document.getElementById('bocTransactionEntry')) return;
    var anchor = document.querySelector('[cardtitle="常用功能"] .menu-added_wrapper');
    if (!anchor) return false;

    var entry = document.createElement('div');
    entry.id = 'bocTransactionEntry';
    entry.className = 'menu-added_tip menu-added_wrapper col-xs-4 background-color';
    entry.title = '交易记录';
    entry.innerHTML = '<span class="boc-transaction-entry-icon">▤</span><div class="icon_text">交易记录</div>';
    entry.addEventListener('click', openModal);
    anchor.parentNode.insertBefore(entry, anchor.nextSibling);
    addStyles();
    return true;
  }

  function addStyles() {
    if (document.getElementById('bocTransactionStyles')) return;
    var style = document.createElement('style');
    style.id = 'bocTransactionStyles';
    style.textContent = '#bocTransactionEntry{cursor:pointer!important}.boc-transaction-entry-icon{display:block;width:38px;height:38px;margin:0 auto 6px;border-radius:50%;background:#fff1f0;color:#c1282c;text-align:center;line-height:38px;font-size:22px}.boc-tx-modal{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.boc-tx-panel{width:min(1080px,100%);max-height:calc(100vh - 48px);overflow:auto;background:#fff;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.2);font-family:"PingFang SC","Microsoft YaHei",Arial,sans-serif;color:#262626}.boc-tx-head{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f0f0f0}.boc-tx-title{font-size:18px;font-weight:600}.boc-tx-close{border:0;background:transparent;color:#999;font-size:24px;line-height:1;cursor:pointer}.boc-tx-filters{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:14px;padding:18px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0}.boc-tx-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#666}.boc-tx-field input,.boc-tx-field select{height:34px;border:1px solid #d9d9d9;border-radius:3px;padding:0 9px;background:#fff;color:#262626;box-sizing:border-box}.boc-tx-actions{display:flex;align-items:end;gap:8px}.boc-tx-btn{height:34px;padding:0 16px;border-radius:3px;border:1px solid #d9d9d9;background:#fff;color:#555;cursor:pointer}.boc-tx-btn.primary{background:#c1282c;border-color:#c1282c;color:#fff}.boc-tx-summary{display:flex;gap:28px;padding:16px 24px 10px;font-size:13px;color:#666}.boc-tx-summary strong{color:#c1282c;font-size:16px}.boc-tx-table-wrap{padding:0 24px 18px;overflow-x:auto}.boc-tx-table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}.boc-tx-table th{background:#fafafa;color:#666;font-weight:500;text-align:left}.boc-tx-table th,.boc-tx-table td{padding:12px 10px;border-bottom:1px solid #f0f0f0}.boc-tx-table td.amount-in{color:#c1282c}.boc-tx-table td.amount-out{color:#388e3c}.boc-tx-status{color:#52a157}.boc-tx-empty{text-align:center;color:#999;padding:48px 0!important}.boc-tx-pagination{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:0 24px 22px;color:#666;font-size:13px}.boc-tx-page-btn{border:1px solid #d9d9d9;background:#fff;border-radius:3px;padding:5px 10px;cursor:pointer}.boc-tx-page-btn:disabled{color:#ccc;cursor:not-allowed}@media(max-width:760px){.boc-tx-filters{grid-template-columns:repeat(2,minmax(120px,1fr));padding:14px}.boc-tx-head,.boc-tx-summary,.boc-tx-table-wrap,.boc-tx-pagination{padding-left:14px;padding-right:14px}.boc-tx-actions{grid-column:1/-1}}';
    document.head.appendChild(style);
  }

  function openModal() {
    var existing = document.getElementById('bocTxModal');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }
    var modal = document.createElement('div');
    modal.id = 'bocTxModal';
    modal.className = 'boc-tx-modal';
    modal.innerHTML = '<section class="boc-tx-panel" role="dialog" aria-modal="true" aria-label="交易记录查询">' +
      '<header class="boc-tx-head"><div class="boc-tx-title">交易记录查询</div><button class="boc-tx-close" type="button" aria-label="关闭">&times;</button></header>' +
      '<div class="boc-tx-filters">' +
      '<label class="boc-tx-field">开始日期<input id="bocTxFrom" type="date"></label>' +
      '<label class="boc-tx-field">结束日期<input id="bocTxTo" type="date"></label>' +
      '<label class="boc-tx-field">交易类型<select id="bocTxType"><option value="all">全部类型</option><option>转账汇款</option><option>工资发放</option><option>货款收款</option><option>费用报销</option><option>资金归集</option><option>结汇入账</option><option>手续费</option><option>季度结息</option></select></label>' +
      '<label class="boc-tx-field">收支方向<select id="bocTxDirection"><option value="all">全部</option><option value="in">收入</option><option value="out">支出</option></select></label>' +
      '<label class="boc-tx-field">最低金额<input id="bocTxMin" type="number" min="0" step="0.01" placeholder="不限"></label>' +
      '<label class="boc-tx-field">最高金额<input id="bocTxMax" type="number" min="0" step="0.01" placeholder="不限"></label>' +
      '<label class="boc-tx-field">关键词<input id="bocTxKeyword" type="search" placeholder="类型、对方或用途"></label>' +
      '<div class="boc-tx-actions"><button id="bocTxReset" class="boc-tx-btn" type="button">重置</button><button id="bocTxSearch" class="boc-tx-btn primary" type="button">查询</button></div>' +
      '</div><div class="boc-tx-summary" id="bocTxSummary"></div><div class="boc-tx-table-wrap"><table class="boc-tx-table"><thead><tr><th>交易时间</th><th>交易类型</th><th>对方户名</th><th>账号尾号</th><th>收支金额（元）</th><th>余额（元）</th><th>状态</th></tr></thead><tbody id="bocTxRows"></tbody></table></div>' +
      '<div class="boc-tx-pagination"><button id="bocTxPrev" class="boc-tx-page-btn" type="button">上一页</button><span id="bocTxPage"></span><button id="bocTxNext" class="boc-tx-page-btn" type="button">下一页</button></div></section>';
    document.body.appendChild(modal);

    var state = { page: 1, pageSize: 10, filters: { type: 'all', direction: 'all' } };
    var query = function (id) { return document.getElementById(id); };
    var render = function () {
      var filtered = filterTransactions(TRANSACTIONS, state.filters);
      var result = paginateTransactions(filtered, state.page, state.pageSize);
      state.page = result.page;
      query('bocTxSummary').innerHTML = '共 <strong>' + result.total + '</strong> 笔交易&nbsp;&nbsp;收入 <strong>' + formatMoney(filtered.filter(function (item) { return item.direction === 'in'; }).reduce(function (sum, item) { return sum + item.amount; }, 0)) + '</strong> 元&nbsp;&nbsp;支出 <strong>' + formatMoney(filtered.filter(function (item) { return item.direction === 'out'; }).reduce(function (sum, item) { return sum + item.amount; }, 0)) + '</strong> 元';
      query('bocTxRows').innerHTML = result.items.length ? result.items.map(function (item) {
        var sign = item.direction === 'in' ? '+' : '-';
        return '<tr><td>' + escapeHtml(item.date + ' ' + item.time) + '</td><td>' + escapeHtml(item.type) + '</td><td>' + escapeHtml(item.counterparty) + '</td><td>****' + escapeHtml(item.account.slice(-4)) + '</td><td class="amount-' + item.direction + '">' + sign + formatMoney(item.amount) + '</td><td>' + formatMoney(item.balance) + '</td><td class="boc-tx-status">' + escapeHtml(item.status) + '</td></tr>';
      }).join('') : '<tr><td class="boc-tx-empty" colspan="7">未找到符合条件的交易记录</td></tr>';
      query('bocTxPage').textContent = result.page + ' / ' + result.totalPages;
      query('bocTxPrev').disabled = result.page <= 1;
      query('bocTxNext').disabled = result.page >= result.totalPages;
    };
    var readFilters = function () {
      state.filters = {
        from: query('bocTxFrom').value,
        to: query('bocTxTo').value,
        type: query('bocTxType').value,
        direction: query('bocTxDirection').value,
        minAmount: query('bocTxMin').value,
        maxAmount: query('bocTxMax').value,
        keyword: query('bocTxKeyword').value,
      };
    };
    query('bocTxSearch').addEventListener('click', function () { readFilters(); state.page = 1; render(); });
    query('bocTxReset').addEventListener('click', function () {
      ['bocTxFrom', 'bocTxTo', 'bocTxMin', 'bocTxMax', 'bocTxKeyword'].forEach(function (id) { query(id).value = ''; });
      query('bocTxType').value = 'all';
      query('bocTxDirection').value = 'all';
      readFilters(); state.page = 1; render();
    });
    query('bocTxPrev').addEventListener('click', function () { state.page -= 1; render(); });
    query('bocTxNext').addEventListener('click', function () { state.page += 1; render(); });
    query('bocTxModal').addEventListener('click', function (event) { if (event.target === modal || event.target.classList.contains('boc-tx-close')) modal.remove(); });
    render();
  }

  if (typeof document !== 'undefined') {
    var boot = function () {
      if (init()) return;
      var observer = new MutationObserver(function () {
        if (init()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  return {
    filterTransactions: filterTransactions,
    paginateTransactions: paginateTransactions,
    calculateInterestForPeriod: calculateInterestForPeriod,
    createInterestTransactions: createInterestTransactions,
    asOfDate: DEMO_AS_OF_DATE,
    transactions: TRANSACTIONS,
  };
});
