if ((-1 !== navigator.userAgent.indexOf("Mac", 0))) {
  console.log("safari 证书更新")
  function wsCertEnroll() {
    _this = this;
    _this.portArr = new Array();
    _this.portArr[0] = 7681;
    _this.portArr[1] = 27682;
    _this.portArr[2] = 57679;
    _this.arrSize = 3;
    _this.preIp = "wss://127.0.0.1:";
    _this.protocol = "cryptokit-boc-protocol";
    _this.wslink = null;
    var serverCallback = function (response) {};
    var errorCallback = function (response) {};
    var closeCallback = function (response) {};

    _this.CreateLink = function (ip, protocol) {
      var self = this;
      return new Promise(function (resolve, reject) {
        self.wslink = new WebSocket(ip, protocol);
        self.wslink.onopen = function (event) {
          resolve()
        };

        self.wslink.onclose = function (event) {
          var result = new Object();
          result.errorcode = 1;
          result.result = event.type;
          closeCallback(result)
        };

        self.wslink.onerror = function (event) {
          reject(event)
        };

        self.wslink.onmessage = function (event) {
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

    _this.SendMsg = function (wslink, msg) {
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

    _this.init = function (resovle) {
      var self = this;
      return self.CreateLink(self.preIp + self.portArr[0], self.protocol)
        .then(resovle, function () {
          return self.CreateLink(self.preIp + self.portArr[1], self.protocol);
        })
        .then(resovle, function () {
          return self.CreateLink(self.preIp + self.portArr[2], self.protocol);
        })
        .then(function (response) {
          return self.CheckHost();
        });
    };

    _this.uninit = function () {
      var self = this;
      return new Promise(function (resolve, reject) {
        self.wslink.close();
      });
    };

    _this.CheckHost = function (bstrKeyID) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "checkHost";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_InitDevice = function (bstrKeyID) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      var keyID = new Object();
      keyID.param = bstrKeyID;
      paramArr.push(keyID);

      msgJSON.function = "CFCA_InitDevice";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_GetCSPInfo = function () {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_GetCSPInfo";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_SetCSPInfo = function (keyLen, bstrCSPName) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_SetCSPInfo";
      msgJSON.params = paramArr;

      var keyLength = new Object();
      keyLength.param = keyLen;
      paramArr.push(keyLength);

      var cspName = new Object();
      cspName.param = bstrCSPName;
      paramArr.push(cspName);
      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_SetKeyAlgorithm = function (bstrAlg) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_SetKeyAlgorithm";
      msgJSON.params = paramArr;

      var alg = new Object();
      alg.param = bstrAlg;
      paramArr.push(alg);

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_PKCS10CertRequisition = function (bstrDN, lCertType, lkeyFlags) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_PKCS10CertRequisition";
      msgJSON.params = paramArr;

      var dn = new Object();
      dn.param = bstrDN;
      paramArr.push(dn);

      var certType = new Object();
      certType.param = lCertType;
      paramArr.push(certType);

      var keyFlag = new Object();
      keyFlag.param = lkeyFlags;
      paramArr.push(keyFlag);

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_BOCPKCS10CertRequestion = function (bstrDN, lCustomerType, lCertType, lkeyFlags) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_BOCPKCS10CertRequestion";
      msgJSON.params = paramArr;

      var dn = new Object();
      dn.param = bstrDN;
      paramArr.push(dn);

      var customerType = new Object();
      customerType.param = lCustomerType;
      paramArr.push(customerType);

      var certType = new Object();
      certType.param = lCertType;
      paramArr.push(certType);

      var keyFlag = new Object();
      keyFlag.param = lkeyFlags;
      paramArr.push(keyFlag);

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_GetContainer = function () {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_GetContainer";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_ImportSignCert = function (lCertType, bstrSignCert, bstrContainer) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_ImportSignCert";
      msgJSON.params = paramArr;

      var certType = new Object();
      certType.param = lCertType;
      paramArr.push(certType);

      var signCert = new Object();
      signCert.param = bstrSignCert;
      paramArr.push(signCert);

      var container = new Object();
      container.param = bstrContainer;
      paramArr.push(container);

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_ImportEncryptCert = function (bstrPrivateKey, bstrEncryptCert, bstrContainer, lFlags) {
      console.warn("进入CFCA_ImportEncryptCert")
      console.warn("bstrPrivateKey: " + bstrPrivateKey)
      console.warn("bstrEncryptCert: " + bstrEncryptCert)
      console.warn("bstrContainer: " + bstrContainer)
      console.warn("lFlags: " + lFlags)
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "CFCA_ImportEncryptCert";
      msgJSON.params = paramArr;

      var privateKey = new Object();
      privateKey.param = bstrPrivateKey;
      paramArr.push(privateKey);

      var encryptCert = new Object();
      encryptCert.param = bstrEncryptCert;
      paramArr.push(encryptCert);

      var container = new Object();
      container.param = bstrContainer;
      paramArr.push(container);

      var flags = new Object();
      flags.param = lFlags;
      paramArr.push(flags);

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_SetSM2CSPName = function (bstrCSPName) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      var cspName = new Object();
      cspName.param = bstrCSPName;
      paramArr.push(cspName);

      msgJSON.function = "CFCA_SetSM2CSPName";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_SelectCert = function (bstrSubjectDNFilter, bstrIssuerDNFilter) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      var dnFilter = new Object();
      dnFilter.param = bstrSubjectDNFilter;
      paramArr.push(dnFilter);

      var issuerDNFilter = new Object();
      issuerDNFilter.param = bstrIssuerDNFilter;
      paramArr.push(issuerDNFilter);

      msgJSON.function = "CFCA_SelectCertificate";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.CFCA_SignData = function (bstrSrc, lAlg) {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      var src = new Object();
      src.param = bstrSrc;
      paramArr.push(src);

      var alg = new Object();
      alg.param = lAlg;
      paramArr.push(alg);

      msgJSON.function = "CFCA_SignData";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };

    _this.GetLastErrorDesc = function () {
      var self = this;
      var msgJSON = new Object();
      var paramArr = new Array();

      msgJSON.function = "GetLastErrorDesc";
      msgJSON.params = paramArr;

      return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
    };
  }
}
