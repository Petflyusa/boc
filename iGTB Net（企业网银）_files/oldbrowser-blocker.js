(function() {
  var ibContainer = document.createElement('div');
  ibContainer.setAttribute('id', 'ibContainer');
  var html = [
    // '<div class="ib-modal">',
    // '    <div class="ib-header">',
    // '        <h1>您的浏览器需要更新<\/h1>',
    // '        <p>为了保证页面的正常显示并保护您的个人信息，',
    // '            <br><strong>请使用以下新版浏览器<\/strong>',
    // '        <\/p>',
    // '    <\/div>',
    // '    <ul class="ib-browsers">',
    // '        <li>',
    // // '            <a href="https:\/\/support.microsoft.com\/zh-cn\/help\/18520\/download-internet-explorer-11-offline-installer" target="_blank">',
    // '                <div class="ib-browser-name">IE9或更高<\/div>',
    // '                <div class="ib-browser-description">由微软公司推出的网页浏览器<\/div>',
    // '            <\/a>',
    // '        <\/li>',
    // '        <li>',
    // // '            <a href="http:\/\/www.google.cn\/chrome\/browser\/desktop\/index.html">',
    // '                <div class="ib-browser-name">Chrome(推荐)<\/div>',
    // '                <div class="ib-browser-description">快速，简单，安全 - 由谷歌开发<\/div>',
    // '            <\/a>',
    // '        <\/li>',
    // '        <li>',
    // // '            <a href="http:\/\/www.firefox.com.cn\" target="_blank">',
    // '                <div class="ib-browser-name">Firefox<\/div>',
    // '                <div class="ib-browser-description">快速，安全，免费，开源的浏览器<\/div>',
    // '            <\/a>',
    // '        <\/li>',
    // '    <\/ul>',
    // '<\/div>',
    // '<div class="ib-mask"><\/div>'
    '<div class="nonsupport-content">',
    '  <div class="col-xs-12 nonsupport-header">',
    '    <div class="login-header-logo"><\/div>',
    '  <\/div>',
    '  <div class="nonsupport-body">',
    '    <div class="icon-nonsupport"><\/div>',
    '    <div class="suggest-hint">',
    '      <span>推荐使用IE9-11、Safari11-14、Chrome41、Firefox51-73、Edge84及以下浏览器登录中国银行网上银行。<\/span>',
    '      <span>If you log into BOC Online Banking，we recommend using IE 9-11, Safari 11-14, Chrome 41, Firefox 51-73, Edge 84 and below.<\/span>',
    '    <\/div>',
    '  <\/div>',
    '<\/div>'
  ].join('\n');

  ibContainer.innerHTML = html;

  window.onload = function() {
    document.body.appendChild(ibContainer);
    ibContainer.style.display = 'block';
  }
})()
