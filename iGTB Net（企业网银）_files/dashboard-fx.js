(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BocFxRates = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var FX_DATA_DATE = '2026-09-11';
  var FX_CARD_MARKER = 'boc-fx-static';
  var FX_OVERLAY_SELECTORS = ['.dashboard-card__Loading', '.loading', '.loadingP', '.loadingErr', '.noData'];
  var FX_RATES = [
    { name: '美元', code: 'USD', buy: 669.82, sell: 671.83 },
    { name: '欧元', code: 'EUR', buy: 776.44, sell: 778.77 },
    { name: '港币', code: 'HKD', buy: 85.41, sell: 85.67 },
    { name: '英镑', code: 'GBP', buy: 904.77, sell: 907.48 },
    { name: '日元', code: 'JPY', buy: 4.3485, sell: 4.3615 },
    { name: '澳元', code: 'AUD', buy: 480.44, sell: 481.88 },
    { name: '加元', code: 'CAD', buy: 483.35, sell: 484.80 },
    { name: '瑞士法郎', code: 'CHF', buy: 821.54, sell: 824.01 },
    { name: '新加坡元', code: 'SGD', buy: 528.31, sell: 529.90 },
    { name: '韩元', code: 'KRW', buy: 0.4988, sell: 0.5003 },
  ];

  function formatFxRate(value) {
    return Number(value).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function buildFxRows(rates) {
    return (rates || []).map(function (item) {
      return '<div class="list-item boc-fx-row"><div class="col-xs-5"><span>' + escapeHtml(item.name) + '</span><span class="moneyType">' + escapeHtml(item.code) + '</span></div><div class="col-xs-4"><span class="num">' + formatFxRate(item.buy) + '</span></div><div class="col-xs-3"><span class="num numCenter">' + formatFxRate(item.sell) + '</span></div></div>';
    }).join('');
  }

  function buildFxTable(rates) {
    return '<table class="boc-fx-rate-table"><thead><tr><th>货币</th><th>银行买入价</th><th>银行卖出价</th></tr></thead><tbody>' + (rates || []).map(function (item) {
      return '<tr><td><span class="boc-fx-currency">' + escapeHtml(item.name) + '</span><span class="boc-fx-code">' + escapeHtml(item.code) + '</span></td><td class="boc-fx-rate--buy">' + formatFxRate(item.buy) + '</td><td class="boc-fx-rate--sell">' + formatFxRate(item.sell) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }

  function renderFxCard() {
    if (typeof document === 'undefined') return false;
    var card = document.querySelector('[cardtitle="外汇牌价"]');
    if (!card) return false;
    var timestamp = card.querySelector('#fxTimeStamp');
    if (timestamp) timestamp.textContent = FX_DATA_DATE.replace(/-/g, '/') + ' 15:55:00';
    var body = card.querySelector('[data-cy="foreign-body"]') || card.querySelector('.body');
    if (!body) return false;
    FX_OVERLAY_SELECTORS.forEach(function (selector) {
      card.querySelectorAll(selector).forEach(function (overlay) {
        overlay.style.display = 'none';
      });
    });
    if (!body.querySelector('.' + FX_CARD_MARKER)) {
      body.innerHTML = '<div class="' + FX_CARD_MARKER + '"><div class="boc-fx-toolbar"><span class="boc-fx-market">现汇牌价</span><span class="boc-fx-source">数据日期：' + FX_DATA_DATE + ' · 仅供展示</span></div><div class="boc-fx-table-wrap">' + buildFxTable(FX_RATES) + '</div></div>';
    }
    var refresh = card.querySelector('.refresh');
    if (refresh && !refresh.getAttribute('data-boc-fx-bound')) {
      refresh.setAttribute('data-boc-fx-bound', 'true');
      refresh.addEventListener('click', function (event) {
        event.preventDefault();
        renderFxCard();
      });
    }
    if (!document.getElementById('bocFxStyles')) {
      var style = document.createElement('style');
      style.id = 'bocFxStyles';
      style.textContent = '.boc-fx-static{width:100%!important;height:100%;box-sizing:border-box;padding:16px 20px 12px;background:#fff}.boc-fx-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.boc-fx-market{font-size:14px;font-weight:600;color:#262626;border-left:3px solid #c1282c;padding-left:8px}.boc-fx-source{color:#999;font-size:11px;white-space:nowrap}.boc-fx-table-wrap{height:260px;overflow:auto;border:1px solid #f0f0f0;border-radius:2px}.boc-fx-rate-table{width:100%;min-width:440px;border-collapse:collapse;table-layout:fixed;font-size:13px}.boc-fx-rate-table th{height:34px;background:#fafafa;color:#777;text-align:right;font-size:12px;font-weight:500;padding:0 16px;border-bottom:1px solid #eee}.boc-fx-rate-table th:first-child,.boc-fx-rate-table td:first-child{text-align:left;width:42%}.boc-fx-rate-table td{height:38px;padding:0 16px;text-align:right;border-bottom:1px solid #f4f4f4;color:#333}.boc-fx-rate-table tbody tr:nth-child(even){background:#fdfdfd}.boc-fx-rate--buy{color:#c1282c!important;font-weight:600}.boc-fx-rate--sell{color:#388e3c!important;font-weight:600}.boc-fx-currency{display:inline-block}.boc-fx-code{display:inline-block;margin-left:8px;color:#999;font-size:11px}@media(max-width:760px){[cardtitle="外汇牌价"]{width:100vw!important;max-width:100vw!important;height:376px!important;box-sizing:border-box}[cardtitle="外汇牌价"]:is(.card-content){width:100%!important;max-width:100%!important;float:none!important;box-sizing:border-box}.boc-fx-static{padding:14px 10px}.boc-fx-toolbar{align-items:flex-start;gap:8px}.boc-fx-source{white-space:normal;text-align:right}.boc-fx-table-wrap{height:260px}.boc-fx-rate-table{min-width:0;font-size:12px}.boc-fx-rate-table th{padding:0 7px;font-size:10px}.boc-fx-rate-table th:first-child,.boc-fx-rate-table td:first-child{width:40%}.boc-fx-rate-table td{padding:0 7px;font-size:12px}.boc-fx-code{margin-left:3px;font-size:10px}}';
      document.head.appendChild(style);
    }
    return true;
  }

  if (typeof document !== 'undefined') {
    var boot = function () {
      if (renderFxCard()) return;
      var observer = new MutationObserver(function () {
      renderFxCard();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  return { FX_DATA_DATE: FX_DATA_DATE, FX_RATES: FX_RATES, FX_OVERLAY_SELECTORS: FX_OVERLAY_SELECTORS, FX_CARD_MARKER: FX_CARD_MARKER, formatFxRate: formatFxRate, buildFxRows: buildFxRows, buildFxTable: buildFxTable, renderFxCard: renderFxCard };
});
