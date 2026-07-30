function wsInfoSuite() {
  // var isQax = BrowserUtils.UA && BrowserUtils.UA.indexOf('qaxbrowser') > 0 && /linux/.test(BrowserUtils.UA);
  if (BrowserUtils.isIE || BrowserUtils.isQax || BrowserUtils.isTapestry) return;
  var _this = this;
  _this.portArr = new Array();
  _this.portArr[0] = 7819;
  _this.portArr[1] = 27758;
  _this.portArr[2] = 57641;
  _this.arrSize = 3;
  _this.preIp = "wss://127.0.0.1:";
  _this.protocol = "information-boc-protocol";
  _this.wslink = null;
  var serverCallback = function (response) { };
  var errorCallback = function (response) { };
  var closeCallback = function (response) { };

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
        if (event.data.length > 0) {
          result.errorcode = JSON.parse(event.data).errorcode;
          result.result = JSON.parse(event.data).result;
          if (0 == result.errorcode)
            serverCallback(result);
          else
            errorCallback(result);
        }
      };
    });
  };

  _this.SendMsg = function (wslink, msg) {
    return new Promise(function (resolve, reject) {
      serverCallback = resolve;
      errorCallback = reject;
      closeCallback = reject;
      wslink.onerror = function (event) { reject(event) };
      wslink.send(msg);
    });
  };


  _this.init = function (resovle) {
    var self = this;
    var current_domain = window.location.host;
    if ((current_domain.indexOf("boc.cn") != -1) ||
      (current_domain.indexOf("bankofchina.com") != -1)) {
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
    }
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

  _this.GetErrorCode = function () {
    var self = this;
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "GetErrorCode";
    msgJSON.params = paramArr;

    return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
  };

  _this.GetNetInfo = function () {
    var self = this;
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "GetNetInfo";
    msgJSON.params = paramArr;

    return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
  };

  _this.GetVersion = function () {
    var self = this;
    var msgJSON = new Object();
    var paramArr = new Array();

    msgJSON.function = "GetVersion";
    msgJSON.params = paramArr;

    return self.SendMsg(self.wslink, JSON.stringify(msgJSON));
  };
}
(function(){
  // var isQax = BrowserUtils.UA && BrowserUtils.UA.indexOf('qaxbrowser') > 0 && /linux/.test(BrowserUtils.UA);
  if (BrowserUtils.isIE || BrowserUtils.isQax || BrowserUtils.isTapestry) return;
  var current_domain = window.location.host;
  if ((current_domain.indexOf("boc.cn") != -1) || (current_domain.indexOf("bankofchina.com") != -1)) {
    var CryptoAgent = new wsInfoSuite();
    CryptoAgent.init()
      .then(function() {
        return CryptoAgent.GetNetInfo();
      })
      .then(function(response) {
        window.macAddress = response.result;
      })
      .catch(function(response) {
        if (response.result !== undefined && response.result.length > 0) {
          console.warn(response.result);
        }
      });
  }
})()
