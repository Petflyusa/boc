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

  function selectStatementTransactions(transactions, from, to) {
    var start = from || '';
    var end = to || '';
    return (transactions || []).filter(function (item) {
      return (!start || item.date >= start) && (!end || item.date <= end);
    }).sort(function (a, b) {
      return (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''));
    });
  }

  function reconcileTransactionBalances(transactions, currentBalance) {
    var balance = Math.round(Number(currentBalance || 0) * 100);
    var ordered = (transactions || []).map(function (item, index) {
      return { item: item, index: index };
    }).sort(function (a, b) {
      return (a.item.date + (a.item.time || '')).localeCompare(b.item.date + (b.item.time || '')) || a.index - b.index;
    });
    var balances = new Array(ordered.length);
    for (var index = ordered.length - 1; index >= 0; index -= 1) {
      var item = ordered[index].item;
      balances[index] = balance / 100;
      var amount = Math.round(Number(item.amount || 0) * 100);
      balance += item.direction === 'in' ? -amount : amount;
    }
    return ordered.reduce(function (result, entry, index) {
      result[entry.index] = Object.assign({}, entry.item, { balance: balances[index] });
      return result;
    }, new Array((transactions || []).length));
  }

  function createTransactionPdf(transactions, options) {
    var settings = options || {};
    var rows = (transactions || []).slice().sort(function (a, b) {
      return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
    });
    var pageSize = 15;
    var pages = Math.max(1, Math.ceil(rows.length / pageSize));
    var objects = [];
    var addObject = function (value) { objects.push(value); return objects.length; };
    var safe = function (value) { return String(value === undefined || value === null ? '' : value); };
    var pdfText = function (value) {
      return Array.from(String(value)).map(function (char) {
        return char.charCodeAt(0).toString(16).padStart(4, '0');
      }).join('');
    };
    var money = function (value) { return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var compactDate = function (value) { return safe(value).replace(/-/g, ''); };
    var shorten = function (value, limit) { var text = safe(value); return text.length > limit ? text.slice(0, limit - 3) + '...' : text; };
    var rightAlignedX = function (right, value, size) { return Math.max(0, right - 4 - safe(value).length * size); };
    var pageRefs = [];
    var fontRef = addObject('<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [DESCENDANT 0 R] >>');
    var descendantRef = addObject('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /DW 1000 >>');
    objects[fontRef - 1] = objects[fontRef - 1].replace('DESCENDANT', String(descendantRef));
    for (var page = 0; page < pages; page += 1) {
      var content = [];
      var text = function (x, y, size, value, font, color) {
        content.push((color || '0 0 0') + ' rg BT /' + (font || 'F1') + ' ' + size + ' Tf ' + x + ' ' + y + ' Td <' + pdfText(value) + '> Tj ET');
      };
      var pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);
      var first = pageRows[0];
      var previousBalance = first ? first.balance + (first.direction === 'in' ? -first.amount : first.amount) : Number(settings.currentBalance || 0);
      var debitTotal = pageRows.filter(function (item) { return item.direction === 'out'; }).reduce(function (sum, item) { return sum + item.amount; }, 0);
      var creditTotal = pageRows.filter(function (item) { return item.direction === 'in'; }).reduce(function (sum, item) { return sum + item.amount; }, 0);
      var currentPageBalance = pageRows.length ? pageRows[pageRows.length - 1].balance : previousBalance;

      text(650, 560, 10, '中国银行股份有限公司', 'F1');
      text(30, 510, 8, '账号  ' + safe(settings.account || ACCOUNT_NUMBER), 'F1');
      text(30, 499, 5.5, 'Account No.', 'F1', '0.3 0.3 0.3');
      text(190, 510, 8, '账户名称  ' + safe(settings.accountName || '成都万格大集酒店管理有限责任公司'), 'F1');
      text(190, 499, 5.5, 'Account Name', 'F1', '0.3 0.3 0.3');
      text(465, 510, 7.5, '开户行  ' + safe(settings.bankName || '中国银行成都东大街支行'), 'F1');
      text(465, 499, 5.5, 'Bank Name', 'F1', '0.3 0.3 0.3');
      text(650, 510, 6.5, '起始日期 ' + compactDate(settings.from) + '  第 ' + (page + 1) + '/' + pages + ' 页', 'F1');
      text(650, 499, 5, 'From(YYYYMMDD)  Page ' + (page + 1) + ' of ' + pages, 'F1', '0.3 0.3 0.3');
      text(30, 475, 8, '币种  人民币(CNY)', 'F1'); text(30, 464, 5.5, 'Currency', 'F1', '0.3 0.3 0.3');
      text(190, 475, 8, '账户类型  单位人民币活期基本账户存款', 'F1'); text(190, 464, 5.5, 'Account Type', 'F1', '0.3 0.3 0.3');
      text(465, 475, 7.5, '承前页余额  ' + money(previousBalance), 'F1'); text(465, 464, 5.5, 'Previous Page Balance', 'F1', '0.3 0.3 0.3');
      text(650, 475, 6.5, '截止日期 ' + compactDate(settings.to) + '  周期 自定义', 'F1');
      text(650, 464, 5, 'To(YYYYMMDD)  Custom Period', 'F1', '0.3 0.3 0.3');

      var columns = [24, 50, 100, 150, 200, 232, 437, 512, 587, 667, 757, 818];
      content.push('0.15 0.15 0.15 RG 0.7 w 24 444 m 818 444 l S 24 410 m 818 410 l S');
      columns.forEach(function (x) { content.push('0.55 0.55 0.55 RG 0.35 w ' + x + ' 444 m ' + x + ' 410 l S'); });
      [['序号', 'No.'], ['记账日', 'Bk.D.'], ['起息日', 'Val.D.'], ['交易类型', 'Type'], ['凭证', 'Vou.'], ['凭证号码/业务编号/用途/摘要', 'Vou. No./Trans. No./Details'], ['借方发生额', 'Debit Amount'], ['贷方发生额', 'Credit Amount'], ['余额', 'Balance'], ['机构/柜员/流水', 'Reference No.'], ['备注', 'Notes']].forEach(function (label, index) {
        text(columns[index] + 3, 430, index === 5 ? 6 : 5.5, label[0], 'F1');
        text(columns[index] + 3, 417, 5, label[1], 'F1', '0.3 0.3 0.3');
      });
      pageRows.forEach(function (item, index) {
        var top = 410 - index * 20;
        var y = top - 13;
        if (index % 2 === 1) content.push('0.975 0.975 0.975 rg 24 ' + (top - 20) + ' 794 20 re f');
        content.push('0.76 0.76 0.76 RG 0.3 w 24 ' + (top - 20) + ' m 818 ' + (top - 20) + ' l S');
        text(29, y, 5.5, String(page * pageSize + index + 1), 'F1');
        text(53, y, 5.5, compactDate(item.date).slice(4), 'F1');
        text(103, y, 5.5, compactDate(item.date).slice(4), 'F1');
        text(153, y, 5.5, shorten(item.type, 7), 'F1');
        text(207, y, 5.5, item.type === '手续费' ? '收费' : '转账', 'F1');
        text(235, y, 5.3, shorten(safe(item.counterparty) + ' / ' + safe(item.note) + (item.bank ? ' / ' + item.bank : ''), 35), 'F1');
        var amountText = money(item.amount);
        var balanceText = money(item.balance);
        if (item.direction === 'out') text(rightAlignedX(512, amountText, 5.5), y, 5.5, amountText, 'F1');
        if (item.direction === 'in') text(rightAlignedX(587, amountText, 5.5), y, 5.5, amountText, 'F1');
        text(rightAlignedX(667, balanceText, 5.5), y, 5.5, balanceText, 'F1');
        text(672, y, 5.2, 'BOC' + compactDate(item.date).slice(2) + safe(item.id).replace(/\D/g, '').slice(-4), 'F1');
        text(762, y, 5.2, shorten(item.note, 9), 'F1');
      });
      var totalY = 410 - pageRows.length * 20 - 20;
      content.push('0.15 0.15 0.15 RG 0.7 w 24 ' + (totalY + 16) + ' m 818 ' + (totalY + 16) + ' l S');
      text(35, totalY + 4, 6, '借方合计 ' + money(debitTotal), 'F1');
      text(215, totalY + 4, 6, '贷方合计 ' + money(creditTotal), 'F1');
      text(420, totalY + 4, 6, '本页余额 ' + money(currentPageBalance), 'F1');
      text(610, totalY + 4, 6, '本对账期末余额 ' + money(rows.length ? rows[rows.length - 1].balance : previousBalance), 'F1');
      text(26, 32, 9, '预览非正式', 'F1', '0.3 0.3 0.3');
      var stream = content.join('\n');
      var streamRef = addObject('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      var pageRef = addObject('<< /Type /Page /Parent PAGES /MediaBox [0 0 842 595] /Resources << /Font << /F1 ' + fontRef + ' 0 R /F2 ' + fontRef + ' 0 R >> >> /Contents ' + streamRef + ' 0 R >>');
      pageRefs.push(pageRef);
    }
    var pagesRef = addObject('<< /Type /Pages /Kids [' + pageRefs.map(function (ref) { return ref + ' 0 R'; }).join(' ') + '] /Count ' + pageRefs.length + ' >>');
    objects = objects.map(function (object) { return object.replace(/PAGES/g, pagesRef + ' 0 R'); });
    var catalogRef = addObject('<< /Type /Catalog /Pages ' + pagesRef + ' 0 R >>');
    var pdf = '%PDF-1.4\n% LAYOUT PREVIEW | NOT AN OFFICIAL BANK STATEMENT\n';
    var offsets = [0];
    objects.forEach(function (object, index) { offsets[index + 1] = pdf.length; pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n'; });
    var xref = pdf.length;
    pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
    offsets.slice(1).forEach(function (offset) { pdf += String(offset).padStart(10, '0') + ' 00000 n \n'; });
    pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogRef + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return pdf;
  }

  var DEFAULT_ANNUAL_RATE = 0.0005;
  var DEMO_AS_OF_DATE = '2026-09-12';
  var ACCOUNT_NUMBER = '115863604036';
  var OPENING_BALANCE = 730000;
  var CURRENT_ACCOUNT_BALANCE = OPENING_BALANCE;
  var transactionEntryMarkup = '<svg data-v-69c61d62="" data-v-10506728="" aria-hidden="true" class="iconSvg svg-icon" width="40" height="40" viewBox="0 0 40 40"><use xlink:href="#icon-query-center"></use></svg><div data-v-10506728="" data-v-dffe8856="" class="icon_text">交易记录</div>';

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
    var lastBalance = balances.reduce(function (balance, item) {
      return item.date < from ? Number(item.balance) || 0 : balance;
    }, firstBalance);
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
    var source = (transactions || []).filter(function (item) { return item.type !== '季度结息' && item.type !== '月度结息'; });
    if (!source.length) return [];
    var from = settings.from || source.reduce(function (min, item) { return item.date < min ? item.date : min; }, source[0].date);
    var to = settings.to || source.reduce(function (max, item) { return item.date > max ? item.date : max; }, source[0].date);
    var asOf = settings.asOf || DEMO_AS_OF_DATE;
    if (to > asOf) to = asOf;
    var rate = toNumber(settings.annualRate);
    if (rate === null) rate = DEFAULT_ANNUAL_RATE;
    var start = new Date(from + 'T00:00:00Z');
    start.setUTCDate(1);
    start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3);
    var periodStart = from;
    var end = new Date(to + 'T00:00:00Z');
    var records = [];
    var dailySource = source.slice();
    if (settings.openingBalance !== undefined) {
      dailySource.unshift({ date: from, balance: Number(settings.openingBalance) || 0 });
    }
    while (start <= end) {
      var settlement = new Date(start.getTime());
      settlement.setUTCMonth(settlement.getUTCMonth() + 2);
      settlement.setUTCDate(21);
      var periodEnd = new Date(settlement.getTime());
      periodEnd.setUTCDate(20);
      var settlementDate = dateToIso(settlement);
      if (settlementDate >= from && settlementDate <= to && settlementDate <= asOf && start <= end) {
        var amount = calculateInterestForPeriod(dailySource, periodStart, dateToIso(periodEnd), rate);
        records.push({
          id: 'INT-' + settlementDate.replace(/-/g, ''),
          date: settlementDate,
          time: '09:00',
          type: '季度结息',
          direction: 'in',
          counterparty: '中国银行股份有限公司',
          account: source[0].account || ACCOUNT_NUMBER,
          amount: amount,
          balance: source[source.length - 1].balance || 0,
          status: '交易成功',
          note: '人民币活期存款季度结息',
        });
      }
      if (settlementDate >= from) periodStart = settlementDate;
      start.setUTCMonth(start.getUTCMonth() + 3, 1);
    }
    return records;
  }

  var RAW_TRANSACTIONS = [
    ['2026-01-02', '货款收款', 'in', '成都万创科技股份有限公司', 6800, '酒店系统服务回款'],
    ['2026-01-07', '转账汇款', 'out', '成都依能科技股份有限公司', 3200, '软件服务费'],
    ['2026-01-13', '费用报销', 'out', '成都中科大旗软件股份有限公司', 1850, '会议服务费'],
    ['2026-01-18', '货款收款', 'in', '成都德芯数字科技股份有限公司', 9200, '场地服务收入'],
    ['2026-01-26', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 25, '网银转账手续费'],
    ['2026-02-03', '转账汇款', 'out', '成都数联铭品科技有限公司', 5600, '数据服务费'],
    ['2026-02-08', '货款收款', 'in', '成都佳发安泰教育科技股份有限公司', 7850, '会务接待收入'],
    ['2026-02-14', '费用报销', 'out', '成都优博创通信技术股份有限公司', 980, '通信服务费'],
    ['2026-02-19', '货款收款', 'in', '成都四方伟业软件股份有限公司', 4300, '住宿服务收入'],
    ['2026-02-27', '转账汇款', 'out', '成都索贝数码科技股份有限公司', 6900, '设备维护费'],
    ['2026-03-04', '货款收款', 'in', '成都唐源电气股份有限公司', 8900, '会务服务收入'],
    ['2026-03-09', '转账汇款', 'out', '成都成电光信科技股份有限公司', 2750, '技术服务费'],
    ['2026-03-15', '费用报销', 'out', '成都智元汇信息技术股份有限公司', 1280, '办公服务费'],
    ['2026-03-20', '货款收款', 'in', '成都纵横自动化技术股份有限公司', 9600, '住宿服务收入'],
    ['2026-03-28', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 30, '跨行转账手续费'],
    ['2026-04-02', '货款收款', 'in', '成都理想境界科技有限公司', 7500, '餐饮服务收入'],
    ['2026-04-08', '转账汇款', 'out', '成都国星通信有限公司', 4600, '网络服务费'],
    ['2026-04-13', '费用报销', 'out', '成都英黎科技有限公司', 950, '耗材采购'],
    ['2026-04-19', '货款收款', 'in', '成都万创科技股份有限公司', 8200, '会议接待收入'],
    ['2026-04-26', '转账汇款', 'out', '成都依能科技股份有限公司', 3100, '软件维护费'],
    ['2026-05-05', '货款收款', 'in', '成都德芯数字科技股份有限公司', 6300, '住宿服务收入'],
    ['2026-05-09', '转账汇款', 'out', '成都中科大旗软件股份有限公司', 2400, '平台服务费'],
    ['2026-05-14', '费用报销', 'out', '成都数联铭品科技有限公司', 1750, '数据服务费'],
    ['2026-05-20', '货款收款', 'in', '成都佳发安泰教育科技股份有限公司', 9800, '会务接待收入'],
    ['2026-05-27', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 25, '网银转账手续费'],
    ['2026-06-03', '转账汇款', 'out', '成都四方伟业软件股份有限公司', 5200, '系统服务费'],
    ['2026-06-08', '货款收款', 'in', '成都优博创通信技术股份有限公司', 7600, '住宿服务收入'],
    ['2026-06-14', '费用报销', 'out', '成都索贝数码科技股份有限公司', 2100, '设备租赁费'],
    ['2026-06-19', '货款收款', 'in', '成都唐源电气股份有限公司', 8450, '会议服务收入'],
    ['2026-06-25', '投资款入账', 'in', '刘佳', 30000000, '项目期投资款项', '中国银行'],
    ['2026-06-29', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 50, '大额入账服务费'],
    ['2026-07-02', '货款收款', 'in', '成都成电光信科技股份有限公司', 5900, '住宿服务收入'],
    ['2026-07-07', '转账汇款', 'out', '成都智元汇信息技术股份有限公司', 3800, '信息服务费'],
    ['2026-07-13', '费用报销', 'out', '成都纵横自动化技术股份有限公司', 1450, '设备维护费'],
    ['2026-07-19', '货款收款', 'in', '成都理想境界科技有限公司', 8700, '会议接待收入'],
    ['2026-07-27', '转账汇款', 'out', '成都国星通信有限公司', 6200, '通信设备款'],
    ['2026-08-04', '货款收款', 'in', '成都英黎科技有限公司', 7100, '住宿服务收入'],
    ['2026-08-09', '转账汇款', 'out', '成都万创科技股份有限公司', 2950, '技术服务费'],
    ['2026-08-15', '费用报销', 'out', '成都依能科技股份有限公司', 1680, '软件服务费'],
    ['2026-08-20', '货款收款', 'in', '成都德芯数字科技股份有限公司', 9400, '会务服务收入'],
    ['2026-08-28', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 25, '网银转账手续费'],
    ['2026-09-02', '货款收款', 'in', '成都中科大旗软件股份有限公司', 6500, '住宿服务收入'],
    ['2026-09-05', '转账汇款', 'out', '成都数联铭品科技有限公司', 3400, '数据服务费'],
    ['2026-09-08', '费用报销', 'out', '成都佳发安泰教育科技股份有限公司', 1250, '会议物料费'],
    ['2026-09-10', '货款收款', 'in', '成都四方伟业软件股份有限公司', 8800, '会议接待收入'],
    ['2026-09-12', '手续费', 'out', '中国银行股份有限公司成都东大街支行', 25, '网银转账手续费'],
  ];

  function buildDemoLedger(rows, openingBalance, asOfDate) {
    var events = rows.map(function (row, index) {
      return {
        id: 'TX' + String(index + 1).padStart(4, '0'), date: row[0], time: index % 3 === 0 ? '09:18' : index % 3 === 1 ? '14:06' : '16:42',
        type: row[1], direction: row[2], counterparty: row[3], account: ACCOUNT_NUMBER,
        amount: row[4], status: '交易成功', note: row[5], bank: row[6] || '',
      };
    }).filter(function (item) { return item.date <= asOfDate; });
    for (var month = 3; month <= 12; month += 3) {
      var settlementDate = '2026-' + String(month).padStart(2, '0') + '-21';
      if (settlementDate > asOfDate) break;
      events.push({ id: 'INT-' + settlementDate.replace(/-/g, ''), date: settlementDate, time: '09:00', type: '季度结息', direction: 'in', counterparty: '中国银行股份有限公司', account: ACCOUNT_NUMBER, amount: 0, status: '交易成功', note: '人民币活期存款季度结息', bank: '中国银行' });
    }
    events.sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var balance = Number(openingBalance);
    var balanceHistory = [{ date: '2026-01-01', balance: balance }];
    var periodStart = '2026-01-01';
    events.forEach(function (item) {
      if (item.type === '季度结息') {
        var periodEnd = item.date.slice(0, 8) + '20';
        item.amount = calculateInterestForPeriod(balanceHistory, periodStart, periodEnd, DEFAULT_ANNUAL_RATE);
        periodStart = item.date;
      }
      balance += item.direction === 'in' ? item.amount : -item.amount;
      item.balance = Math.round(balance * 100) / 100;
      balanceHistory.push({ date: item.date, balance: item.balance });
    });
    return events.sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
  }

  var TRANSACTIONS = buildDemoLedger(RAW_TRANSACTIONS, OPENING_BALANCE, DEMO_AS_OF_DATE);
  CURRENT_ACCOUNT_BALANCE = TRANSACTIONS.length ? TRANSACTIONS[0].balance : OPENING_BALANCE;

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
    entry.setAttribute('data-v-10506728', '');
    entry.setAttribute('data-v-dffe8856', '');
    entry.title = '交易记录';
    entry.innerHTML = transactionEntryMarkup;
    entry.addEventListener('click', openModal);
    anchor.parentNode.insertBefore(entry, anchor.nextSibling);
    addStyles();
    return true;
  }

  function addStyles() {
    if (document.getElementById('bocTransactionStyles')) return;
    var style = document.createElement('style');
    style.id = 'bocTransactionStyles';
    style.textContent = '#bocTransactionEntry{cursor:pointer!important}.boc-transaction-entry-icon{display:block;width:38px;height:38px;margin:0 auto 6px;border-radius:50%;background:#fff1f0;color:#c1282c;text-align:center;line-height:38px;font-size:22px}.boc-tx-modal{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.boc-tx-panel{width:min(1080px,100%);max-height:calc(100vh - 48px);overflow:auto;background:#fff;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.2);font-family:"PingFang SC","Microsoft YaHei",Arial,sans-serif;color:#262626}.boc-tx-head{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f0f0f0}.boc-tx-title{font-size:18px;font-weight:600}.boc-tx-close{border:0;background:transparent;color:#999;font-size:24px;line-height:1;cursor:pointer}.boc-tx-filters{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:14px;padding:18px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0}.boc-tx-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#666}.boc-tx-field input,.boc-tx-field select{height:34px;border:1px solid #d9d9d9;border-radius:3px;padding:0 9px;background:#fff;color:#262626;box-sizing:border-box}.boc-tx-actions{display:flex;align-items:end;gap:8px}.boc-tx-btn{height:34px;padding:0 16px;border-radius:3px;border:1px solid #d9d9d9;background:#fff;color:#555;cursor:pointer}.boc-tx-btn.primary{background:#c1282c;border-color:#c1282c;color:#fff}.boc-tx-summary{display:flex;gap:28px;padding:16px 24px 10px;font-size:13px;color:#666}.boc-tx-summary strong{color:#c1282c;font-size:16px}.boc-tx-table-wrap{padding:0 24px 18px;overflow-x:auto}.boc-tx-table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}.boc-tx-table th{background:#fafafa;color:#666;font-weight:500;text-align:left}.boc-tx-table th,.boc-tx-table td{padding:12px 10px;border-bottom:1px solid #f0f0f0}.boc-tx-table td.amount-in{color:#c1282c}.boc-tx-table td.amount-out{color:#388e3c}.boc-tx-status{color:#52a157}.boc-tx-empty{text-align:center;color:#999;padding:48px 0!important}.boc-tx-pagination{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:0 24px 22px;color:#666;font-size:13px}.boc-tx-page-btn{border:1px solid #d9d9d9;background:#fff;border-radius:3px;padding:5px 10px;cursor:pointer}.boc-tx-page-btn:disabled{color:#ccc;cursor:not-allowed}.boc-tx-download{color:#c1282c;text-decoration:none;font-size:13px;margin-left:8px}.boc-tx-download:hover{text-decoration:underline}.boc-pdf-modal{position:fixed;inset:0;z-index:100002;background:rgba(14,20,29,.68);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}.boc-pdf-panel{width:min(980px,100%);height:min(92vh,900px);background:#fff;border-radius:6px;display:flex;flex-direction:column;box-shadow:0 16px 50px rgba(0,0,0,.3)}.boc-pdf-toolbar{display:flex;align-items:end;gap:10px;padding:14px 18px;border-bottom:1px solid #e5e7eb;flex-wrap:wrap}.boc-pdf-toolbar .boc-tx-field{min-width:150px}.boc-pdf-frame{flex:1;border:0;background:#6b7280;min-height:360px}.boc-pdf-actions{display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:12px 18px;border-top:1px solid #e5e7eb}.boc-pdf-count{margin-right:auto;color:#4b5563;font-size:13px}.boc-pdf-error{color:#b42318;font-size:13px;min-height:18px}@media(max-width:760px){.boc-tx-filters{grid-template-columns:repeat(2,minmax(120px,1fr));padding:14px}.boc-tx-head,.boc-tx-summary,.boc-tx-table-wrap,.boc-tx-pagination{padding-left:14px;padding-right:14px}.boc-tx-actions{grid-column:1/-1}.boc-pdf-toolbar{padding:12px}.boc-pdf-panel{height:96vh}.boc-pdf-actions{padding:10px 12px}}';
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
      '<label class="boc-tx-field">交易类型<select id="bocTxType"><option value="all">全部类型</option><option>转账汇款</option><option>货款收款</option><option>投资款入账</option><option>费用报销</option><option>手续费</option><option>季度结息</option></select></label>' +
      '<label class="boc-tx-field">收支方向<select id="bocTxDirection"><option value="all">全部</option><option value="in">收入</option><option value="out">支出</option></select></label>' +
      '<label class="boc-tx-field">最低金额<input id="bocTxMin" type="number" min="0" step="0.01" placeholder="不限"></label>' +
      '<label class="boc-tx-field">最高金额<input id="bocTxMax" type="number" min="0" step="0.01" placeholder="不限"></label>' +
      '<label class="boc-tx-field">关键词<input id="bocTxKeyword" type="search" placeholder="类型、对方或用途"></label>' +
      '<div class="boc-tx-actions"><button id="bocTxReset" class="boc-tx-btn" type="button">重置</button><button id="bocTxSearch" class="boc-tx-btn primary" type="button">查询</button></div>' +
      '</div><div class="boc-tx-summary" id="bocTxSummary"></div><div class="boc-tx-table-wrap"><table class="boc-tx-table"><thead><tr><th>交易时间</th><th>交易类型</th><th>对方户名</th><th>账号尾号</th><th>收支金额（元）</th><th>余额（元）</th><th>状态</th></tr></thead><tbody id="bocTxRows"></tbody></table></div>' +
      '<div class="boc-tx-pagination"><button id="bocTxPrev" class="boc-tx-page-btn" type="button">上一页</button><span id="bocTxPage"></span><button id="bocTxNext" class="boc-tx-page-btn" type="button">下一页</button><a id="bocTxDownload" class="boc-tx-download" href="#">预览并下载中文 PDF</a></div></section>';
    document.body.appendChild(modal);

    var state = { page: 1, pageSize: 10, filters: { type: 'all', direction: 'all' } };
    var query = function (id) { return document.getElementById(id); };
    var previewUrl = '';
    var previewRows = [];
    var openStatementPreview = function () {
      var baseFilters = Object.assign({}, state.filters, { from: '', to: '' });
      var baseRows = filterTransactions(TRANSACTIONS, baseFilters);
      previewRows = baseRows;
      var dates = baseRows.map(function (item) { return item.date; }).sort();
      var preview = document.getElementById('bocPdfModal');
      if (!preview) {
        preview = document.createElement('div');
        preview.id = 'bocPdfModal';
        preview.className = 'boc-pdf-modal';
        preview.innerHTML = '<section class="boc-pdf-panel" role="dialog" aria-modal="true" aria-label="交易明细 PDF 预览"><div class="boc-pdf-toolbar"><label class="boc-tx-field">下载开始日期<input id="bocPdfFrom" type="date"></label><label class="boc-tx-field">下载结束日期<input id="bocPdfTo" type="date"></label><button id="bocPdfGenerate" class="boc-tx-btn primary" type="button">生成预览</button><button id="bocPdfClose" class="boc-tx-btn" type="button">关闭</button><div id="bocPdfError" class="boc-pdf-error" role="alert"></div></div><iframe id="bocPdfFrame" class="boc-pdf-frame" title="中文交易明细 PDF 预览"></iframe><div class="boc-pdf-actions"><span id="bocPdfCount" class="boc-pdf-count">请选择日期区间</span><button id="bocPdfDownload" class="boc-tx-btn primary" type="button" disabled>确认下载 PDF</button></div></section>';
        document.body.appendChild(preview);
        document.getElementById('bocPdfClose').onclick = function () { preview.style.display = 'none'; };
        document.getElementById('bocPdfGenerate').onclick = function () {
          var from = document.getElementById('bocPdfFrom').value;
          var to = document.getElementById('bocPdfTo').value;
          var error = document.getElementById('bocPdfError');
          if (!from || !to || from > to) { error.textContent = '请选择有效的开始和结束日期'; return; }
          var selected = selectStatementTransactions(previewRows, from, to);
          error.textContent = '';
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          var pdf = createTransactionPdf(selected, { account: ACCOUNT_NUMBER, accountName: '成都万格大集酒店管理有限责任公司', bankName: '中国银行成都东大街支行', currentBalance: CURRENT_ACCOUNT_BALANCE, asOfDate: DEMO_AS_OF_DATE, from: from, to: to });
          previewUrl = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
          document.getElementById('bocPdfFrame').src = previewUrl;
          document.getElementById('bocPdfCount').textContent = '预览 ' + selected.length + ' 笔交易，区间：' + from + ' 至 ' + to;
          document.getElementById('bocPdfDownload').disabled = false;
          document.getElementById('bocPdfDownload').onclick = function () {
            var anchor = document.createElement('a');
            anchor.href = previewUrl;
            anchor.download = 'BOC-transaction-statement-' + from + '-' + to + '.pdf';
            anchor.click();
          };
        };
      }
      document.getElementById('bocPdfFrom').value = state.filters.from || '2026-01-01';
      document.getElementById('bocPdfTo').value = state.filters.to || dates[dates.length - 1] || DEMO_AS_OF_DATE;
      document.getElementById('bocPdfGenerate').click();
      preview.style.display = 'flex';
    };
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
      query('bocTxDownload').onclick = function (event) { event.preventDefault(); openStatementPreview(); };
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
    selectStatementTransactions: selectStatementTransactions,
    calculateInterestForPeriod: calculateInterestForPeriod,
    createInterestTransactions: createInterestTransactions,
    reconcileTransactionBalances: reconcileTransactionBalances,
    createTransactionPdf: createTransactionPdf,
    accountNumber: ACCOUNT_NUMBER,
    openingBalance: OPENING_BALANCE,
    currentAccountBalance: CURRENT_ACCOUNT_BALANCE,
    asOfDate: DEMO_AS_OF_DATE,
    transactionEntryMarkup: transactionEntryMarkup,
    transactions: TRANSACTIONS,
  };
});
