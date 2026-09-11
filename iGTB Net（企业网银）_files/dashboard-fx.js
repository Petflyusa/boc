(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BocFxRates = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var FX_DATA_DATE = '2026-09-11';
  var FX_OVERLAY_SELECTORS = ['.loading', '.loadingP', '.loadingErr', '.noData'];
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
    body.innerHTML = '<div class="list col-xs-12 boc-fx-static"><div class="title" style="padding:0 16px"><span class="redLine4">现汇</span><span class="boc-fx-source">数据日期：' + FX_DATA_DATE + '（仅供展示）</span></div><div class="content"><div class="boc-fx-table"><div class="subTittle clearfix"><div class="col-xs-5"><span>货币</span></div><div class="col-xs-4"><span>银行买入价</span></div><div class="col-xs-3"><span>银行卖出价</span></div></div>' + buildFxRows(FX_RATES) + '</div></div></div>';
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
      style.textContent = '.boc-fx-static{width:100%!important}.boc-fx-source{float:right;color:#999;font-size:11px;line-height:22px}.boc-fx-table{max-height:284px;overflow:auto}.boc-fx-row{min-height:38px;display:flex;align-items:center}.boc-fx-row .moneyType{display:inline-block;margin-left:6px;color:#888;font-size:11px}.boc-fx-row .num{color:#c1282c!important;font-weight:600}.boc-fx-row .numCenter{color:#388e3c!important}.boc-fx-static .subTittle{color:#888;font-size:12px}.boc-fx-static .content{padding-bottom:8px}';
      document.head.appendChild(style);
    }
    return true;
  }

  if (typeof document !== 'undefined') {
    var boot = function () {
      if (renderFxCard()) return;
      var observer = new MutationObserver(function () {
        if (renderFxCard()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  return { FX_DATA_DATE: FX_DATA_DATE, FX_RATES: FX_RATES, FX_OVERLAY_SELECTORS: FX_OVERLAY_SELECTORS, formatFxRate: formatFxRate, buildFxRows: buildFxRows, renderFxCard: renderFxCard };
});
