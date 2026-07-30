var BrowserUtils = {};
// Browser environment sniffing
BrowserUtils.inBrowser = typeof window !== 'undefined';
// eslint-disable-next-line no-undef
BrowserUtils.inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
// eslint-disable-next-line no-undef
BrowserUtils.weexPlatform = BrowserUtils.inWeex && WXEnvironment.platform.toLowerCase();
BrowserUtils.UA = BrowserUtils.inBrowser && window.navigator.userAgent.toLowerCase();
BrowserUtils.isIE = BrowserUtils.UA && /msie|trident/.test(BrowserUtils.UA);
BrowserUtils.isIE9 = BrowserUtils.UA && BrowserUtils.UA.indexOf('msie 9.0') > 0;
BrowserUtils.isIE10 = BrowserUtils.UA && BrowserUtils.UA.indexOf('msie 10.0') > 0;
BrowserUtils.isEdge = BrowserUtils.UA && BrowserUtils.UA.indexOf('edge/') > 0;
BrowserUtils.isAndroid = (BrowserUtils.UA && BrowserUtils.UA.indexOf('android') > 0) || (BrowserUtils.weexPlatform === 'android');
BrowserUtils.isIOS = (BrowserUtils.UA && /iphone|ipad|ipod|ios/.test(BrowserUtils.UA)) || (BrowserUtils.weexPlatform === 'ios');
BrowserUtils.isTapestry = BrowserUtils.UA && /chrome\/\d+/.test(BrowserUtils.UA) && !BrowserUtils.isEdge && BrowserUtils.UA.indexOf('tapestry') > 0;
let isQax = BrowserUtils.UA && BrowserUtils.UA.indexOf('qaxbrowser') > 0 && /linux/.test(BrowserUtils.UA);
let isLongxin = BrowserUtils.UA && BrowserUtils.UA.indexOf('loongarch64') > 0 && /linux/.test(BrowserUtils.UA) && !(BrowserUtils.UA.indexOf('uos') > 0); // 龙芯：'mozilla/5.0 (x11; linux loongarch64) applewebkit/537.36 (khtml, like gecko) chrome/114.0.5735.358 safari/537.36'
let isUOS = BrowserUtils.UA && BrowserUtils.UA.indexOf('uos') > 0 && /linux/.test(BrowserUtils.UA); // UOS：'mozilla/5.0 (x11; linux loongarch64) applewebkit/537.36 (khtml, like gecko) chrome/108.0.5359.125 safari/537.36 uos professional'
BrowserUtils.isQax = isQax || isLongxin || isUOS;
BrowserUtils.isChrome = BrowserUtils.UA && /chrome\/\d+/.test(BrowserUtils.UA) && !BrowserUtils.isEdge && !BrowserUtils.isTapestry;
BrowserUtils.isFireFox = BrowserUtils.UA && BrowserUtils.UA.match(/firefox\/(\d+)/);
BrowserUtils.isPhantomJS = BrowserUtils.UA && /phantomjs/.test(BrowserUtils.UA);
BrowserUtils.isSafari = BrowserUtils.UA && BrowserUtils.UA.match(/safari\/([\d.]+)/) && !BrowserUtils.isChrome;
BrowserUtils.isEdgeChromium = BrowserUtils.UA && BrowserUtils.UA.match(/edg\/([\d.]+)/) && BrowserUtils.isChrome;
BrowserUtils.isNewEdge = BrowserUtils.UA && BrowserUtils.UA.indexOf('edg/') > 0 && !BrowserUtils.isEdge;

BrowserUtils.getBrowserVersion = function() {
  if(!BrowserUtils.inBrowser) {
    return null
  }
  if(BrowserUtils.isIE) {
    var ie = BrowserUtils.UA.match(/msie\s([\d]+)\./i) || BrowserUtils.UA.match(/trident.*rv\s*:\s*([\d]+)\./i)
    return ie[1]
  }
  if(BrowserUtils.isTapestry) {
    var tapestry = BrowserUtils.UA.match(/chrome\/([\d.]+)/)
    return tapestry[1]
  }
  if(BrowserUtils.isChrome) {
    var chrome = BrowserUtils.UA.match(/chrome\/([\d.]+)/)
    return chrome[1]
  }
  if(BrowserUtils.isFireFox) {
    var firefox = BrowserUtils.UA.match(/firefox\/([\d.]+)/i)
    return firefox[1]
  }
  if(BrowserUtils.isSafari) {
    var safari = /version\/([\d.]+)/i.exec(BrowserUtils.UA)
    return safari[1]
  }
  if(BrowserUtils.isEdge) {
    var edge = /edge\/([\d.]+)/i.exec(BrowserUtils.UA)
    return edge[1]
  }

}

var edgeExtension = "xxxxxxxxxx";
if(BrowserUtils.isEdgeChromium) {
  edgeExtension = "cpiogedigcbdifgefmkjpfnampochfca";
}
var chromeExtension = "nhhdpdhiemjpkaikglglhabjafffdjfo";
var productID = "com.cfca.cryptokit.boc";

var extensionName = productID + ".extension";
var reqEventName = productID + ".request";
var respEventName = productID + ".response";
var timerSafari = undefined;
var timeOutSafari = 10*1000;
var linkStateSafari = 0;

Browser = {
  IE: "Internet Explorer",
  Edge: "Edge",
  Chrome: "Chrome",
  Safari: "Safari",
  Firefox: "Firefox",
  EdgeChromium: "Edge(Chromium)"
};

function GenerateRandomId() {
  var charstring = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  var maxPos = charstring.length;
  var randomId = '';
  for (var i = 0; i < 10; i++) {
      randomId += charstring.charAt(Math.floor(Math.random() * maxPos));
  }
  return randomId;
}

function SendMessageforEdge(request) {
  return new Promise( function (resolve, reject) {
    chrome.runtime.sendMessage(edgeExtension, request, function (response) {
      if (response) {
        if(0 == response.errorcode){
          resolve(response);
        }
        else{
          reject(response);
        }
      }
      else {
        var result = new Object();
        result.errorcode = 1;
        result.result = chrome.runtime.lastError.message;
        reject(result);
      }
    });
  });
};

// Encapsulate Edge&Firefox event to Promise
function SendMessagebyEvent(request) {
  var event = new CustomEvent(reqEventName, {
    detail: request
  });
  document.dispatchEvent(event);
  return new Promise(function (resolve, reject) {
    var responseEventName = respEventName;
    if (request.funcInfo != undefined && request.funcInfo.randomId != undefined) {
      responseEventName += ("." + request.funcInfo.randomId);
    }
    document.addEventListener(responseEventName, function CallBack(e) {
      document.removeEventListener(e.type, CallBack);
      var eJson = JSON.parse(e.detail);
      if (null != eJson && 0 == eJson.errorcode) {
        resolve(eJson);
      } else {
        reject(eJson);
      }
    }, false);
  });
}

// Encapsulate Chrome sendMessage callback to Promise
function SendMessageforChrome(request) {
  return new Promise(function(resolve, reject) {
    chrome.runtime.sendMessage(chromeExtension, request, function(response) {
      if (response) {
        if(0 == response.errorcode) {
          resolve(response);
        } else{
          reject(response);
        }
      } else {
        var result = new Object();
        result.errorcode = 1;
        result.result = chrome.runtime.lastError.message;
        reject(result);
      }
    });
  });
}
function SendMessageforSafari(request) {
  var event = new CustomEvent(reqEventName, { detail: request });
  document.dispatchEvent(event);
  return new Promise( function (resolve, reject) {
    var timer = null;
    var responseEventName = respEventName;
    if(request.funcInfo != undefined && request.funcInfo.randomId != undefined) responseEventName += ("." + request.funcInfo.randomId);
    if(request.funcInfo != undefined ) {
      if(request.funcInfo.function == "getExtensionVersion") {
        timer = setTimeout(function() {
          var result = new Object();
          result.errorcode = 2;
          result.result = "Extension does not exist!";
          reject(result);
        }, 500);          // if extension not installed rejct this promise after 500ms
      }
      if(request.funcInfo.function == "keepAlive") {
        timer = setTimeout(function() {
          var result = new Object();
          result.errorcode = 5;
          result.result = "Extension exit!";
          reject(result);
        }, 500);          // if extension not installed rejct this promise after 500ms
      }
    }
    document.addEventListener(responseEventName, function CallBack(e) {
      if(timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      document.removeEventListener(e.type, CallBack);
      var eJson = JSON.parse(e.detail);
      if (null != eJson && 0 == eJson.errorcode) {
        resolve(eJson);
      } else {
        reject(eJson);
      }
    }, false);
  });
};
function SendMessage(browser, requestJSON) {
  if(Browser.EdgeChromium == browser) {
    return SendMessageforEdge(requestJSON);
  } else if(Browser.Chrome == browser) {
    return SendMessageforChrome(requestJSON);
  } else if(Browser.Safari == browser) {
    return SendMessageforSafari(requestJSON);
  } else {
    return SendMessagebyEvent(requestJSON);
  }
}

function checkExtension(browser, _this) {
  return new Promise(function(resolve, reject) {
    var result = new Object();
    if (Browser.EdgeChromium == browser || Browser.Chrome == browser) {
      // chrome.runtime.sendMessage() could check extension  existence.
      if (chrome.runtime) {
        _this.getExtensionVersion(browser).then(function (response) {
          resolve(browser);
        }, function (response) {
          reject(response);
        });
      } else {
        result.errorcode = 2;
        result.result = "Extension does not exist!";
        reject(result);
      }
    } else if ("Firefox" == browser) {
      if (document.getElementById(extensionName)) {
        resolve(browser);
      } else {
        result.errorcode = 2;
        result.result = "Extension does not exist!";
        reject(result);
      }
    } else if ("Safari" == browser) {
      _this.getExtensionVersion(browser)
        .then(function (response) {
          console.log("ca-checkExtension-safari", browser, response)
          resolve(browser);
        }, function (response) {
          result.errorcode = 2;
          result.result = "Extension does not exist!";
          reject(result);
        });
    } else {
      result.errorcode = 3;
      result.result = "Only support Firefox/ Edge(Chromium)/ Chrome/ Safari"; //"Only support Chrome Firefox and Edge";
      reject(result);
    }
  });
}

function nmCryptokit(browser) {

  this.browser = browser;
}
function setKeepAlive(browser) {

  if("Safari" == browser) {
    linkStateSafari = 1;
    timerSafari = setInterval(function() {
      console.log("ca-setKeepAlive-setInterval", browser)
      if(linkStateSafari == 1) {
        var request = new Object();
        var funcInfo = new Object();
        var randomId = GenerateRandomId();
        funcInfo.function = "keepAlive";
        funcInfo.params = null;
        funcInfo.randomId = randomId;
        request.action = "keepAlive";
        request.funcInfo = funcInfo;
        return SendMessage(browser, request)
          .catch(function (response) {
            console.log("ca-setKeepAlive-catch", browser)
            linkStateSafari = 0;
            clearInterval(timerSafari);
            timerSafari = undefined;
          });
      }
    }, timeOutSafari);
  }
}
nmCryptokit.prototype.init = function() {
  var browser = this.browser;
  var extensionState = 0;
  console.log("ca-init")
  return checkExtension(browser, this).then(function(browser) {
      console.log("ca-init-checkExtension-then", browser)
      extensionState = 1;
      var request = new Object();
      request.action = "connect";
      request.host = productID;
      return SendMessage(browser, request);
    }).then(function() {
      console.log("ca-init-checkExtension-then-then", browser)
      setKeepAlive(browser)
      var request = new Object();
      var funcInfo = new Object();
      var randomId = GenerateRandomId();
      funcInfo.function = "checkHost";
      funcInfo.params = null;
      funcInfo.randomId = randomId;
      request.action = "invoke";
      request.funcInfo = funcInfo;
      return SendMessage(browser, request);
    }).catch(async function (response) {
      return new Promise((resolve, reject) => {
        resolve;
        console.log("ca-init-checkExtension-catch", response)
        if (response.errorcode == 2 || response.errorcode == 3) {
          reject(response)
        } else if (extensionState == 1) {
          var result = new Object();
          result.errorcode = 4;
          result.result = "Host does not exist!";
          reject(result)
        } else {
          var result = new Object();
          result.errorcode = 2;
          result.result = "Extension does not exist!";
          reject(result)
        }
      })

  });
}

nmCryptokit.prototype.uninit = function() {
  if("Safari" == this.browser) {
    linkStateSafari = 0;
    if(timerSafari != undefined){
      clearInterval(timerSafari);
      timerSafari = undefined;
    }
  }
  var request = new Object();
  request.action = "disconnect";
  request.host = productID;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.SetAlgorithm = function(bstrSignType, bstrEncType) {

  console.log("ca-SetAlgorithm")
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrSignType);
  paramArr.push(bstrEncType);

  funcInfo.function = "SetAlgorithm";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.SetSM2CSPName = function(bstrCSPName) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrCSPName);

  funcInfo.function = "SetSM2CSPName";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.SetCert = function(bstrCertType, bstrDN, bstrSN, bstrEmail, bstrDNIssuer, bstrCertBase64) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrCertType);
  paramArr.push(bstrDN);
  paramArr.push(bstrSN);
  paramArr.push(bstrEmail);
  paramArr.push(bstrDNIssuer);
  paramArr.push(bstrCertBase64);

  funcInfo.function = "SetCert";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.GetCertCN = function() {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetCertCN";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.P1SignStr = function(bstrSrc) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrSrc);

  funcInfo.function = "P1SignStr";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.AttachSignStr = function(bstrDN, bstrSrc) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrDN);
  paramArr.push(bstrSrc);

  funcInfo.function = "AttachSignStr";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.DetachSignStr = function(bstrDN, bstrSrc) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrDN);
  paramArr.push(bstrSrc);

  funcInfo.function = "DetachSignStr";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.SignAndEncryptStr = function(bstrSrc, bstrBase64RecipientCert) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrSrc);
  paramArr.push(bstrBase64RecipientCert);

  funcInfo.function = "SignAndEncryptStr";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.SetCertChooseType = function(nType) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();

  paramArr.push(nType);

  funcInfo.function = "SetCertChooseType";
  funcInfo.params = paramArr;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.GetErrorCode = function() {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetErrorCode";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.GetErrorMessage = function(error) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(error);

  funcInfo.function = "GetErrorMessage";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.getExtensionVersion = function(browser) {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "getExtensionVersion";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "getExtensionVersion";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser ? this.browser : browser, request);
}

nmCryptokit.prototype.getHostVersion = function() {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetVersion";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

nmCryptokit.prototype.GetVersion = function() {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetVersion";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

//鸿蒙端获取mac地址
nmCryptokit.prototype.GetNetInfo = function() {
  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetNetInfo";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}

//鸿蒙端获取cpuinfo
nmCryptokit.prototype.GetCPUInfo = function() {
  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetCPUInfo";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
}
