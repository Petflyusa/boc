if ((-1 !== navigator.userAgent.indexOf("Mac", 0))) {
  var portArr = new Array();
  portArr[0] = 7681;
  portArr[1] = 27682;
  portArr[2] = 57679;
  var arrSize = 3;
  var preIp = "wss://127.0.0.1:";
  var protocol = "cryptokit-boc-protocol";
  var wslink = null;
  var serverCallback = function (response) {};
  var errorCallback = function (response) {};
  var closeCallback = function (response) {};

  function wsCryptokit() {
    //
  }

  function CreateLink(ip, protocol) {
    return new Promise(function (resolve, reject) {
      wslink = new WebSocket(ip, protocol);
      wslink.onopen = function (event) {
        resolve()
      };

      wslink.onclose = function (event) {
        var result = new Object();
        result.errorcode = 1;
        result.result = event.type;
        closeCallback(result)
      };

      wslink.onerror = function (event) {
        reject(event)
      };

      wslink.onmessage = function (event) {
        var result = new Object();
        result.errorcode = JSON.parse(event.data).errorcode;
        result.result = JSON.parse(event.data).result;
        if (0 == result.errorcode)
          serverCallback(result);
        else
          errorCallback(result);
      };
    });
  };

  function SendMsg(wslink, msg) {
    return new Promise(function (resolve, reject) {
      serverCallback = resolve;
      errorCallback = reject;
      closeCallback = reject;
      wslink.onerror = function (event) {
        reject(event)
      };
      wslink.send(msg);
    });
  };

  wsCryptokit.prototype.init = function (resovle) {
    return CreateLink(preIp + portArr[0], protocol)
      .then(resovle, function () {
        return CreateLink(preIp + portArr[1], protocol);
      })
      .then(resovle, function () {
        return CreateLink(preIp + portArr[2], protocol);
      })
      .then(function (response) {
        return wsCryptokit.prototype.CheckHost();
      });
  };

  wsCryptokit.prototype.uninit = function () {
    return new Promise(function (resolve, reject) {
      wslink.close();
    });
  };

  wsCryptokit.prototype.CheckHost = function (bstrKeyID) {
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "checkHost";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.SetAlgorithm = function (bstrSignType, bstrEncType) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var signType = new Object();
    signType.param = bstrSignType;
    paramArr.push(signType);

    var encType = new Object();
    encType.param = bstrEncType;
    paramArr.push(encType);

    msgJSON.function = "SetAlgorithm";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.SetSM2CSPName = function (bstrCSPName) {

    var msgJSON = new Object();
    var paramArr = new Array();

    var cspName = new Object();
    cspName.param = bstrCSPName;
    paramArr.push(cspName);

    msgJSON.function = "SetSM2CSPName";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.SetCert = function (bstrCertType, bstrSubjectDNFilter, serialNo, bstrEmailFilter, bstrIssuerDNFilter, bstrCert) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var certType = new Object();
    certType.param = bstrCertType;
    paramArr.push(certType);

    var dnFilter = new Object();
    dnFilter.param = bstrSubjectDNFilter;
    paramArr.push(dnFilter);

    var snFilter = new Object();
    snFilter.param = serialNo;
    paramArr.push(snFilter);

    var issuerDNFilter = new Object();
    issuerDNFilter.param = bstrEmailFilter;
    paramArr.push(issuerDNFilter);

    var emailFilter = new Object();
    emailFilter.param = bstrIssuerDNFilter;
    paramArr.push(emailFilter);

    var certFilter = new Object();
    certFilter.param = bstrCert;
    paramArr.push(certFilter);

    msgJSON.function = "SetCert";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.GetCertCN = function () {
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "GetCertCN";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.P1SignStr = function (bstrSrc) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var src = new Object();
    src.param = bstrSrc;
    paramArr.push(src);

    msgJSON.function = "P1SignStr";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.AttachSignStr = function (bstrDN, bstSrc) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var certDN = new Object();
    certDN.param = bstrDN;
    paramArr.push(certDN);

    var src = new Object();
    src.param = bstSrc;
    paramArr.push(src);

    msgJSON.function = "AttachSignStr";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.DetachSignStr = function (bstrDN, bstSrc) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var certDN = new Object();
    certDN.param = bstrDN;
    paramArr.push(certDN);

    var src = new Object();
    src.param = bstSrc;
    paramArr.push(src);

    msgJSON.function = "DetachSignStr";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.SignAndEncryptStr = function (bstrSrc, bstrCert) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var source = new Object();
    source.param = bstrSrc;
    paramArr.push(source);

    var recipientCert = new Object();
    recipientCert.param = bstrCert;
    paramArr.push(recipientCert);

    msgJSON.function = "SignAndEncryptStr";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.GetErrorCode = function () {
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "GetErrorCode";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };

  wsCryptokit.prototype.GetErrorMessage = function (error) {
    var msgJSON = new Object();
    var paramArr = new Array();

    var errorCode = new Object();
    errorCode.param = error;
    paramArr.push(errorCode);

    msgJSON.function = "GetErrorMessage";
    msgJSON.params = paramArr;

    return SendMsg(wslink, JSON.stringify(msgJSON));
  };
}
