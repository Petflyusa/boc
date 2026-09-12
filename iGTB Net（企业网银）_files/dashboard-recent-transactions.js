(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BocRecentTransactions = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var asOfDate = '2026-09-11';
  var marker = 'boc-recent-transactions';

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function getRecentTransactions(transactions, asOf, days) {
    var end = new Date((asOf || asOfDate) + 'T23:59:59Z');
    var start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - (Math.max(1, Number(days) || 7) - 1));
    return (transactions || []).filter(function (item) {
      var timestamp = new Date(item.date + 'T' + (item.time || '00:00') + ':00Z');
      return timestamp >= start && timestamp <= end;
    }).sort(function (a, b) {
      return (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''));
    });
  }

  function buildRecentTransactionsTable(transactions) {
    var rows = (transactions || []).map(function (item) {
      var incoming = item.direction === 'in';
      var amount = Number(item.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return '<tr><td>' + escapeHtml(item.date + ' ' + (item.time || '')) + '</td><td><span class="boc-recent-type">' + escapeHtml(item.type) + '</span><span class="boc-recent-counterparty">' + escapeHtml(item.counterparty || '') + '</span></td><td class="' + (incoming ? 'boc-recent-income' : 'boc-recent-expense') + '">' + (incoming ? '+' : '-') + amount + '</td><td class="boc-recent-balance">' + Number(item.balance || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>';
    }).join('');
    return '<div class="' + marker + '"><div class="boc-recent-heading"><strong>最近7天交易明细</strong><span>共 ' + (transactions || []).length + ' 笔</span></div><div class="boc-recent-table-wrap"><table><thead><tr><th>交易时间</th><th>交易类型 / 对方</th><th>收支金额（元）</th><th>余额（元）</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="boc-recent-empty">最近7天暂无交易</td></tr>') + '</tbody></table></div></div>';
  }

  function render() {
    var scope = typeof window !== 'undefined' ? window : globalThis;
    if (typeof document === 'undefined' || !scope.BocTransactions) return false;
    var card = document.querySelector('[cardtitle="余额变动视图"]');
    var target = card && card.querySelector('.errBox');
    if (!target) return false;
    if (!target.querySelector('.' + marker)) target.innerHTML = buildRecentTransactionsTable(getRecentTransactions(scope.BocTransactions.transactions, scope.BocTransactions.asOfDate, 7));
    if (!document.getElementById('bocRecentTransactionsStyles')) {
      var style = document.createElement('style');
      style.id = 'bocRecentTransactionsStyles';
      style.textContent = '.boc-recent-transactions{padding:12px 14px 14px}.boc-recent-heading{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;color:#333;font-size:13px}.boc-recent-heading span{font-size:11px;color:#999;font-weight:400}.boc-recent-table-wrap{width:100%;overflow:auto;border:1px solid #eee;border-radius:3px}.boc-recent-table-wrap table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px}.boc-recent-table-wrap th{height:34px;padding:0 10px;background:#fafafa;color:#777;text-align:left;font-weight:500;white-space:nowrap}.boc-recent-table-wrap td{height:42px;padding:5px 10px;border-top:1px solid #f0f0f0;white-space:nowrap}.boc-recent-table-wrap th:nth-child(n+3),.boc-recent-table-wrap td:nth-child(n+3){text-align:right}.boc-recent-type{display:block;color:#444;font-weight:500}.boc-recent-counterparty{display:block;margin-top:3px;color:#999;font-size:11px}.boc-recent-income{color:#c1282c;font-weight:600}.boc-recent-expense{color:#388e3c;font-weight:600}.boc-recent-balance{color:#555}.boc-recent-empty{text-align:center!important;color:#999;height:72px!important}@media(max-width:760px){.boc-recent-transactions{padding:10px}.boc-recent-table-wrap table{min-width:620px}}';
      document.head.appendChild(style);
    }
    return true;
  }

  if (typeof document !== 'undefined') {
    var boot = function () {
      render();
      var card = document.querySelector('[cardtitle="余额变动视图"]');
      if (!card) return;
      var observer = new MutationObserver(render);
      observer.observe(card, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  return { getRecentTransactions: getRecentTransactions, buildRecentTransactionsTable: buildRecentTransactionsTable, render: render };
});
