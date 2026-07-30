var edgeExtension = "cpiogedigcbdifgefmkjpfnampochfca";
var chromeExtension = "nhhdpdhiemjpkaikglglhabjafffdjfo";
var productID = "com.cfca.cryptokit.boc";
var extensionName = productID + ".extension";
var reqEventName = productID + ".request";
var respEventName = productID + ".response";
var browser = "";
var timerNMCertEnroll = undefined;
var timeOutNMCertEnroll = 10*1000;
var linkStateNMCertEnroll = 0;

function GenerateRandomId() {
  var charstring = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  var maxPos = charstring.length;
  var randomId = '';
  for (var i = 0; i < 10; i++) {
    randomId += charstring.charAt(Math.floor(Math.random() * maxPos));
  }
  return randomId;
};

function SendMessageforEdge(request) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(edgeExtension, request, function (response) {
      console.log("sendMessageForEdge: ", response, request)
      if (response) {
        if (0 == response.errorcode) {
          console.log("sendMessageForEdge-resolve: ", response, request)
          resolve(response);
        } else {
          console.log("sendMessageForEdge-reject: ", response, request)
          reject(response);
        }
      } else {
        var result = new Object();
        result.errorcode = 1;
        result.result = chrome.runtime.lastError.message;
        reject(result);
        console.log("sendMessageForEdge-else: ", result, request)
      }
    });
  });
};

function SendMessageforChrome(request) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(chromeExtension, request, function (response) {
      if (response) {
        if(0 == response.errorcode) {
          resolve(response);
        } else {
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
};

function SendMessageforSafari(request) {
  var event = new CustomEvent(reqEventName, { detail: request });
  document.dispatchEvent(event);
  return new Promise(function (resolve, reject) {
    var timer = null;
    var responseEventName = respEventName;
    console.log("SendMessageforSafari", responseEventName)
    if(request.funcInfo != undefined && request.funcInfo.randomId != undefined) responseEventName += ("." + request.funcInfo.randomId);
    console.log("SendMessageforSafari-funcInfo", responseEventName)
    if(request.funcInfo != undefined) {
      if(request.funcInfo.function == "getExtensionVersion") {
        console.log("SendMessageforSafari-getExtensionVersion", responseEventName)
        timer = setTimeout(function() {
          var result = new Object();
          result.errorcode = 2;
          result.result = "Extension does not exist!";
          reject(result);
        }, 500);          // if extension not installed rejct this promise after 500ms
      }
      if(request.funcInfo.function == "keepAlive") {
        console.log("SendMessageforSafari-keepAlive", responseEventName)
        timer = setTimeout(function() {
          var result = new Object();
          result.errorcode = 5;
          result.result = "Extension exit!";
          reject(result);
        }, 500);          // if extension not installed rejct this promise after 500ms
      }
    }
    document.addEventListener(responseEventName, function CallBack(e) {
      console.log("SendMessageforSafari-addEventListener", responseEventName, e)
      if(timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      document.removeEventListener(e.type, CallBack);
      var eJson = JSON.parse(e.detail);
      if(null != eJson && 0 == eJson.errorcode) {
        resolve(eJson);
      } else {
        reject(eJson);
      }
    }, false);
  });
};

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
      console.log("SendMessagebyEvent: ", responseEventName, request, e)
      document.removeEventListener(e.type, CallBack);
      var eJson = JSON.parse(e.detail);
      console.log("SendMessagebyEvent-eJson: ", eJson)
      if (null != eJson && 0 == eJson.errorcode) {
        console.log("SendMessagebyEvent-eJson-resolve: ", eJson)
        resolve(eJson);
      } else {
        console.log("SendMessagebyEvent-eJson-reject: ", eJson)
        reject(eJson);
      }
    }, false);
  });
};

function SendMessage(browser, requestJSON) {
  console.log("sendMessage: ", browser, requestJSON)
  if ("Edge(Chromium)" == browser) {
    return SendMessageforEdge(requestJSON);
  } else if("Chrome" == browser) {
    return SendMessageforChrome(requestJSON);
  } else if("Safari" == browser) {
    console.log("sendMessage-safari", browser)
    return SendMessageforSafari(requestJSON);
  } else {
    return SendMessagebyEvent(requestJSON);
  }
};

function checkExtension(browser, _this) {
  return new Promise(function (resolve, reject) {
    var result = new Object();
    console.log("checkExtension: ")
    if ("Edge(Chromium)" == browser || "Chrome"== browser) {
      console.log("checkExtension-edge: ", browser)
      // chrome.runtime.sendMessage() could check extension  existence.
      // if (chrome.runtime) {
      //   resolve(browser);
      // }
      if(chrome.runtime) {
        console.log("checkExtension-edge-runtime: ", chrome.runtime)
        _this.getExtensionVersion(browser)
          .then(function (response) {
            console.log("checkExtension-edge-resolve: ", response)
            resolve(browser);
          }, function (response) {
            console.log("checkExtension-edge-reject: ", response)
            reject(response);
          });
      } else {
        result.errorcode = 2;
        result.result = "Extension does not exist!";
        reject(result);
        console.log("checkExtension-edge-else", result)
      }
    } else if ("Firefox" == browser) {
      console.log("checkExtension-firefox: ")
      if (document.getElementById(extensionName)) {
        console.log("checkExtension-firefox-resolve: ")
        resolve(browser);
      } else {
        result.errorcode = 2;
        result.result = "Extension does not exist!";
        reject(result);
        console.log("checkExtension-firefox-else: ", result)
      }
    } else if ("Safari" == browser ) {
      console.log("checkExtension-Safari: ")
      _this.getExtensionVersion(browser)
        .then(function (response) {
          console.log("checkExtension-safari", browser, response)
          resolve(browser);
        }, function (response) {
          result.errorcode = 2;
          result.result = "Extension does not exist!";
          reject(result);
          console.log("checkExtension-Safari: ", browser, result)
        });
    } else {
      result.errorcode = 3;
      result.result = "Only support Firefox/ Edge(Chromium)/ Chrome/ Safari"; //"Only support Chrome Firefox and Edge";
      reject(result);
      console.log("checkExtension-else", result)
    }
  });
};

function setKeepAlive(browser) {
  if("Safari" == browser) {
    console.log("setKeepAlive-safari", browser)
    linkStateNMCertEnroll = 1;
    timerNMCertEnroll = setInterval(function() {
      if(linkStateNMCertEnroll == 1) {
        var request = new Object();
        var funcInfo = new Object();
        var randomId = GenerateRandomId();

        funcInfo.function = "keepAlive";
        funcInfo.params = null;
        funcInfo.randomId = randomId;

        request.action = "keepAlive";
        request.funcInfo = funcInfo;
        console.log("setKeepAlive-safari-setInterval", browser)
        return SendMessage(browser, request)
          .catch(function (response) {
            console.log("setKeepAlive-safari-setInterval", response)
            linkStateNMCertEnroll = 0;
            clearInterval(timerNMCertEnroll);
            timerNMCertEnroll = undefined;
          });
      }
    }, timeOutNMCertEnroll);
  }
}

function nmCertEnroll(browser) {
  this.browser = browser;
}

nmCertEnroll.prototype.init = function () {
  var browser = this.browser;
  var extensionState = 0;
  console.log("nmCE-init", browser)
  return checkExtension(browser, this)
    .then(function (browser) {
      console.log("nmCE-init-checkextension-then", browser)
      extensionState = 1;
      var request = new Object();
      request.action = "connect";
      request.host = productID;
      return SendMessage(browser, request);
    }).then(function () {
      console.log("nmCE-init-checkextension-then-then", browser)
      setKeepAlive(browser);
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
        console.log("nmCE-init-checkextension-catch", response)
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

nmCertEnroll.prototype.uninit = function () {
  if("Safari" == this.browser) {
    linkStateNMCertEnroll = 0;
    if(timerNMCertEnroll != undefined) {
      clearInterval(timerNMCertEnroll);
      timerNMCertEnroll = undefined;
    }
  }

  var request = new Object();
  request.action = "disconnect";
  request.host = productID;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.getExtensionVersion = function (browser) {
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

nmCertEnroll.prototype.CFCA_InitDevice = function (bstrKeyID) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrKeyID);

  funcInfo.function = "CFCA_InitDevice";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_GetCSPInfo = function () {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  funcInfo.function = "CFCA_GetCSPInfo";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_SetCSPInfo = function (keyLen, bstrCSPName) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(keyLen);
  paramArr.push(bstrCSPName);

  funcInfo.function = "CFCA_SetCSPInfo";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_SetKeyAlgorithm = function (bstrAlg) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrAlg);

  funcInfo.function = "CFCA_SetKeyAlgorithm";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_PKCS10CertRequisition = function (bstrDN, lCertType, lkeyFlags) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrDN);
  paramArr.push(lCertType);
  paramArr.push(lkeyFlags);

  funcInfo.function = "CFCA_PKCS10CertRequisition";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_BOCPKCS10CertRequestion = function (bstrDN, lCustomerType, lCertType, lkeyFlags) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrDN);
  paramArr.push(lCustomerType);
  paramArr.push(lCertType);
  paramArr.push(lkeyFlags);

  funcInfo.function = "CFCA_BOCPKCS10CertRequestion";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_GetContainer = function () {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "CFCA_GetContainer";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_ImportSignCert = function (lCertType, bstrSignCert, bstrContainer) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(lCertType);
  paramArr.push(bstrSignCert);
  paramArr.push(bstrContainer);

  funcInfo.function = "CFCA_ImportSignCert";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_ImportEncryptCert = function (bstrPrivateKey, bstrEncryptCert, bstrContainer, lFlags) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrPrivateKey);
  paramArr.push(bstrEncryptCert);
  paramArr.push(bstrContainer);
  paramArr.push(lFlags);

  funcInfo.function = "CFCA_ImportEncryptCert";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_SetSM2CSPName = function (bstrCSPName) {
  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrCSPName);

  funcInfo.function = "CFCA_SetSM2CSPName";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_SelectCert = function (bstrSubjectDNFilter, bstrIssuerDNFilter) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrSubjectDNFilter);
  paramArr.push(bstrIssuerDNFilter);

  funcInfo.function = "CFCA_SelectCertificate";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_SignData = function (bstrSrc, lAlg) {

  var request = new Object();
  var funcInfo = new Object();
  var paramArr = new Array();
  var randomId = GenerateRandomId();

  paramArr.push(bstrSrc);
  paramArr.push(lAlg);

  funcInfo.function = "CFCA_SignData";
  funcInfo.params = paramArr;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.GetLastErrorDesc = function () {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetLastErrorDesc";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.GetVersion = function () {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetVersion";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};

nmCertEnroll.prototype.CFCA_GetVersion = function () {

  var request = new Object();
  var funcInfo = new Object();
  var randomId = GenerateRandomId();

  funcInfo.function = "GetVersion";
  funcInfo.params = null;
  funcInfo.randomId = randomId;

  request.action = "invoke";
  request.funcInfo = funcInfo;

  return SendMessage(this.browser, request);
};
