(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  var uuid = function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  };

  var _Object = function _Object(obj) {
    this._obj = obj;
  };
  _Object.prototype = {
    _each: function _each(process) {
      var _obj = this._obj;

      for (var k in _obj) {
        if (_obj.hasOwnProperty(k)) {
          process(k, _obj[k]);
        }
      }

      return this;
    }
  };
  var _assign = function _assign(target) {
    if (typeof Object.assign === 'function') {
      return Object.assign.apply(Object, arguments);
    }

    if (target == null) {
      throw new Error('Cannot convert undefined or null to object');
    }

    var newTarget = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index];

      if (source !== null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            newTarget[key] = source[key];
          }
        }
      }
    }

    return newTarget;
  };

  var getBrowserLanguage = function getBrowserLanguage() {
    var type = navigator.appName;
    var lang = 'zh';

    if (type === 'Netscape') {
      lang = navigator.language; // 获取浏览器配置语言，支持非IE浏览器
    } else {
      lang = navigator.userLanguage; // 获取浏览器配置语言，支持IE5+ == navigator.systemLanguage
    }

    return lang.substr(0, 2); // 获取浏览器配置语言前两位
  }; // 判断是否支持IE

  function getType(map) {
    var maps = {};
    return function (type) {
      return maps[type] != null ? maps[type] : function () {
        // eslint-disable-next-line guard-for-in
        for (var names in map) {
          var namesArray = names.split('|');

          for (var i = 0, length = namesArray.length; i < length; i++) {
            maps[namesArray[i]] = map[names];
          }
        }

        return maps[type] != null ? maps[type] : '';
      }();
    };
  } // 对语言进行处理


  function resolveLanguage(language) {
    if (!language) {
      return 'zh';
    }

    var lang = language.toLowerCase(); // 语言-地区资源库

    var languageMap = {
      'zh|zh-cn|zh-hans-cn|zh-hans-hk|zh-hans-mo|zh-hans-tw|zho': 'zho',
      'zh-hk|zh-mo|zh-hant-cn|zh-hant-hk|zh-hant-mo|zho-hk': 'zho-hk',
      'zh-tw|zh-hant-tw|zho-tw': 'zho-tw',
      'en|en-us|en-gb|en-cn|en-us|en-gb|eng': 'eng',
      'ja|ja-cn|ja-jp|jpn': 'jpn',
      'id|in|ind': 'ind',
      'ko|kor': 'kor',
      'ru|rus': 'rus',
      'ar|ara': 'ara',
      'es|spa': 'spa',
      'fr|fra': 'fra',
      'de|deu': 'deu',
      'ug|udm': 'udm',
      'pt|pon': 'pon',
      'pt-pt|por': 'por',
      'es-us|spa-us': 'spa-us',
      'az|az-az|aym': 'aym',
      'be|bej': 'bej',
      'bn|bem': 'bem',
      'bs|bos': 'bos',
      'bg|bug': 'bug',
      'ca|car': 'car',
      'hr|hrv': 'hrv',
      'cs|ces': 'ces',
      'da|dak': 'dak',
      'nl|nld': 'nld',
      'et|est': 'est',
      'fa|fas': 'fas',
      'fi|fin': 'fin',
      'ka|ka-ge|kat': 'kat',
      'el|ell': 'ell',
      'gu|guj': 'guj',
      'iw|haw': 'haw',
      'hi|him': 'him',
      'hu|hun': 'hun',
      'it|isl': 'isl',
      'kk|kk-kz|kaw': 'kaw',
      'km|km-kh|khm': 'khm',
      'lo|lo-la|lao': 'lao',
      'lv|lat': 'lat',
      'lt|lit': 'lit',
      'mk|mkd': 'mkd',
      'ms|msa': 'msa',
      'mr|mar': 'mar',
      'mn|mon': 'mon',
      'ne|nep': 'nep',
      'nb|nob': 'nob',
      'pl|pol': 'pol',
      'ro|ron': 'ron',
      'sr|srp': 'srp',
      'si|si-lk|sin': 'sin',
      'sk|slk': 'slk',
      'sl|slv': 'slv',
      'sw|swa': 'swa',
      'sv|swe': 'swe',
      'tl|fil': 'fil',
      'ta|tam': 'tam',
      'th|tha': 'tha',
      'bo|bo-cn|bod': 'bod',
      'tr|tur': 'tur',
      'uk|ukr': 'ukr',
      'ur|urd': 'urd',
      'uz|uz-uz|uzb': 'uzb',
      'vi|vie': 'vie',
      'am|amh': 'amh',
      'eu|eu-es|eus': 'eus',
      'gl|gl-es|glg': 'glg',
      'kn|kan': 'kan',
      'pa|pan': 'pan',
      'te|tel': 'tel',
      'jv|jav': 'jav',
      'as|asm': 'asm',
      'ml|mal': 'mal',
      'or|ori': 'ori',
      'mi|mri': 'mri',
      'mai|mai': 'mai',
      'my|my-zg|mya': 'mya'
    };
    var getLang = getType(languageMap); // 语言容错机制

    var correctLang = function correctLang(langs) {
      if (langs.indexOf('-') > 0) {
        return getLang(langs) ? getLang(langs) : correctLang(langs.substring(0, langs.lastIndexOf('-')));
      }

      return getLang(langs) ? getLang(langs) : 'zho';
    }; // 检查语言是否支持


    if (!languageMap[lang]) {
      return correctLang(lang);
    }

    return getLang(lang);
  }

  var isNumber = function isNumber(value) {
    return typeof value === 'number';
  };

  function _Array(arr) {
    this._arr = arr || [];
  }

  _Array.prototype = {
    _get: function _get(i) {
      return this._arr[i];
    },
    _getLen: function _getLen() {
      return this._arr.length;
    },
    _slice: function _slice(start, end) {
      var self = this;
      var newArr;

      if (isNumber(end)) {
        newArr = self._arr.slice(start, end);
      } else {
        newArr = self._arr.slice(start);
      }

      return new _Array(newArr);
    },
    _push: function _push(ele) {
      var o = this;

      o._arr.push(ele);

      return o;
    },
    _splice: function _splice(at, count) {
      return this._arr.splice(at, count || 1);
    },
    _join: function _join(str) {
      return this._arr.join(str);
    },
    _concat: function _concat(arr) {
      var newArr = this._arr.concat(arr);

      return new _Array(newArr);
    },
    _map: function _map(process) {
      var arr = this;
      var _arr = arr._arr;

      if (_arr.map) {
        return new _Array(_arr.map(process));
      }

      var res = [];

      for (var i = 0, len = _arr.length; i < len; i += 1) {
        res[i] = process(_arr[i], i, arr);
      }

      return new _Array(res);
    },
    _filter: function _filter(prec) {
      var _Arr = this;

      var arr = _Arr._arr;

      if (arr.filter) {
        return new _Array(arr.filter(prec));
      }

      var res = [];

      for (var i = 0, len = arr.length; i < len; i += 1) {
        if (prec(arr[i], i, _Arr)) {
          res.push(arr[i]);
        }
      }

      return new _Array(res);
    },
    _indexOf: function _indexOf(ele) {
      var o = this;
      var _arr = o._arr;

      if (!_arr.indexOf) {
        for (var i = 0, len = _arr.length; i < len; i += 1) {
          if (_arr[i] === ele) {
            return i;
          }
        }

        return -1;
      }

      return _arr.indexOf(ele);
    },
    _forEach: function _forEach(callback) {
      var o = this;
      var _arr = o._arr;

      if (!_arr.forEach) {
        var thisArg = arguments[1];

        for (var i = 0; i < _arr.length; i++) {
          if (i in _arr) {
            callback.call(thisArg, _arr[i], i, o);
          }
        }
      }

      return _arr.forEach(callback);
    }
  };

  _Array._isArray = function (arr) {
    if (Array.isArray) {
      return Array.isArray(arr);
    }

    return Object.prototype.toString.call(arr) === '[object Array]';
  };

  var toString = Object.prototype.toString;

  var _isFunction = function _isFunction(obj) {
    return typeof obj === 'function';
  };

  var _isObject = function _isObject(obj) {
    return obj === Object(obj);
  };

  var _isArray = function _isArray(obj) {
    return toString.call(obj) === '[object Array]';
  };

  var _isDate = function _isDate(obj) {
    return toString.call(obj) === '[object Date]';
  };

  var _isRegExp = function _isRegExp(obj) {
    return toString.call(obj) === '[object RegExp]';
  };

  var _isBoolean = function _isBoolean(obj) {
    return toString.call(obj) === '[object Boolean]';
  };

  function resolveKey(input) {
    return input.replace(/(\S)(_([a-zA-Z]))/g, function (match, $1, $2, $3) {
      return $1 + $3.toUpperCase() || '';
    });
  }

  function camelizeKeys(input, convert) {
    if (!_isObject(input) || _isDate(input) || _isRegExp(input) || _isBoolean(input) || _isFunction(input)) {
      return convert ? resolveKey(input) : input;
    }

    var temp = null;

    if (_isArray(input)) {
      temp = [];

      for (var i = 0; i < input.length; i++) {
        temp.push(camelizeKeys(input[i]));
      }
    } else {
      temp = {};

      for (var prop in input) {
        if (Object.prototype.hasOwnProperty.call(input, prop)) {
          temp[camelizeKeys(prop, true)] = camelizeKeys(input[prop]);
        }
      }
    }

    return temp;
  }

  if (typeof window === 'undefined') {
    throw new Error('Geetest requires browser environment');
  }

  var _window = window,
      console = _window.console;
  var _window2 = window,
      document = _window2.document;
  var _window3 = window,
      Math$1 = _window3.Math;
  var head = document.getElementsByTagName('head')[0];

  function Config(config) {
    var self = this;
    this.showSuccessTip = true;

    new _Object(config)._each(function (key, value) {
      self[key] = value;
    });
  }

  Config.prototype = {
    showSuccessTip: true,
    protocol: '//',
    fallback_config: {},
    _get_fallback_config: function _get_fallback_config(config) {
      return {
        data: {
          js: 'offline.1.0.0.js',
          staticServers: config.staticServers,
          offline: true
        }
      };
    },
    _extend: function _extend(obj) {
      var self = this;

      new _Object(obj)._each(function (key, value) {
        self[key] = value;
      });
    }
  };

  var getErrorType = function getErrorType(code) {
    var errorTypes = {
      neterror: ['60200', '60100', '60101', '60201', '60202', '111', '2222'],
      configerror: ['60001', '60002', '60003']
    };

    for (var p in errorTypes) {
      if (Object.prototype.hasOwnProperty.call(errorTypes, p)) {
        var errorType = errorTypes[p];

        if (new _Array(errorType)._indexOf(code) > -1) {
          return p;
        }
      }
    }

    return '';
  };

  var isNumber$1 = function isNumber(value) {
    return typeof value === 'number';
  };

  var isString = function isString(value) {
    return typeof value === 'string';
  };

  var isBoolean = function isBoolean(value) {
    return typeof value === 'boolean';
  };

  var isFunction = function isFunction(value) {
    return typeof value === 'function';
  };

  var callbacks = {};

  var random = function random() {
    return parseInt(Math$1.random() * 10000) + new Date().valueOf();
  };

  var loadScript = function loadScript(url, cb, timeout) {
    // FIXME: IE8
    var script = document.createElement('script');
    script.charset = 'UTF-8';
    script.async = true;
    var loaded = false;

    script.onerror = function () {
      cb(true);
      loaded = true;
    };

    script.onload = script.onreadystatechange = function () {
      if (!loaded && (!script.readyState || script.readyState === 'loaded' || script.readyState === 'complete')) {
        loaded = true;
        cb(false);
      }
    };

    script.src = url;
    head.appendChild(script);
    setTimeout(function () {
      if (!loaded) {
        cb(true);
        script.onload = script.onreadystatechange = script.onerror = null;
      }
    }, timeout || 1000 * 60 * 0.5);
  };

  var normalizeDomain = function normalizeDomain(domain) {
    return domain.replace(/^https?:\/\/|\/$/g, '');
  };

  var normalizePath = function normalizePath(path) {
    path = path.replace(/\/+/g, '/');

    if (path.indexOf('/') !== 0) {
      path = "/" + path;
    }

    return path;
  };

  var normalizeQuery = function normalizeQuery(query) {
    // FIXME: 无法处理Object和 Array类型
    if (!query) {
      return '';
    }

    var q = '?';

    new _Object(query)._each(function (key, value) {
      if (isString(value) || isNumber$1(value) || isBoolean(value)) {
        q = q + encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
      }
    });

    if (q === '?') {
      q = '';
    }

    return q.replace(/&$/, '');
  };

  var makeURL = function makeURL(protocol, domain, path, query) {
    domain = normalizeDomain(domain);
    var url = normalizePath(path) + normalizeQuery(query);

    if (domain) {
      url = protocol + domain + url;
    }

    return url;
  };

  var load = function load(protocol, domains, path, query, cb, fn, timeout) {
    if (!path) {
      return;
    }

    var tryRequest = function tryRequest(at) {
      if (query) {
        var callback = "geetest_" + random();
        query.callback = callback;

        window[callback] = function (data) {
          fn(data);
          window[callback] = undefined;

          try {
            delete window[callback];
          } catch (e) {}
        };
      }

      var url = makeURL(protocol, domains[at], path, query); // 失败 err = true

      loadScript(url, function (err) {
        if (err) {
          if (at >= domains.length - 1) {
            cb(true);
          } else {
            // 在tryRequest之前改写callback的逻辑，但是如果没有返回成功，这里的全局的callback将一直存着
            try {
              if (callback) {
                window[callback] = function () {
                  try {
                    delete window[callback];
                  } catch (e) {}
                };
              }
            } catch (e) {}

            tryRequest(at + 1);
          }
        } else {
          cb(false);
        }
      }, timeout);
    };

    tryRequest(0);
  };

  var jsonp = function jsonp(domains, path, config, callback) {
    load(config.protocol, domains, path, {
      captcha_id: config.captchaId,
      risk_type: config.riskType,
      challenge: config.challenge,
      client_type: config.clientType,
      phone_number: config.phoneNumber,
      language: config.language,
      encryption: config.encryption,
      ext: config.ext ? JSON.stringify(config.ext) : undefined
    }, function (err) {
      if (err && typeof config.offlineCb === 'function') {
        // 执行自己的宕机
        config.offlineCb();
        return;
      }

      if (err) {
        callback(config._get_fallback_config(config));
      }
    }, callback, config.timeout);
  };

  var getError = function getError(errorName, language) {
    var _errorName = errorName;
    var errors = {
      js_unload: {
        detail: '验证的js地址无法加载',
        endetail: 'js address could not be loaded',
        code: '111'
      },
      url_load: {
        detail: '/load请求报错：1.请保持网络畅通；2.检查初始化时传入的配置参数captcha_id和challenge',
        endetail: '/load Request error: 1. Please keep the network open; Check the configuration parameters captcha_id and challenge passed during initialization',
        code: '60100'
      },
      gct_unload: {
        detail: 'gct地址无法加载',
        endetail: 'gct address could not be loaded',
        code: '2222'
      },
      api_servers: {
        detail: 'apiServers参数为空或者不是数组类型',
        endetail: 'apiServers The argument is empty or not of type array',
        code: '60002'
      },
      captcha_id: {
        detail: 'captchaId参数为空',
        endetail: 'captchaId Parameter is empty',
        code: '60003'
      }
    };

    if (typeof errorName === 'string') {
      if (!errors[_errorName]) {
        _errorName = 'unknown';
      }

      var error = errors[_errorName];

      if (language === 'zho') {
        var tempError = {
          msg: getErrorText(error.code, language),
          code: error.code,
          desc: {
            detail: error.detail
          }
        };
      } else {
        var tempError = {
          msg: getErrorText(error.code, language),
          code: error.code,
          desc: {
            detail: error.endetail
          }
        };
      }
    } else {
      var tempError = {
        msg: errorName.msg,
        code: errorName.code,
        desc: {
          detail: errorName.desc
        }
      };
    }

    return tempError;
  };

  var getErrorText = function getErrorText(code, language) {
    var errorText = {
      neterror: {
        zho: '网络不给力',
        eng: 'Network failure',
        'zho-tw': '網絡不給力'
      },
      configerror: {
        zho: '配置错误',
        eng: 'Configuration Error',
        'zho-tw': '配置錯誤'
      }
    };
    var type = getErrorType(code);
    return errorText[type] && errorText[type][language] || errorText[type].en;
  };

  var throwError = function throwError(config, error) {
    if (typeof config.onError === 'function') {
      config.onError(error);
    } else if (error && console && typeof console.error === 'function') {
      console.error(error);
    }
  };

  var callbacks = [];

  function checkParamsError(config) {
    if (!config.apiServers || !(config.apiServers instanceof Array)) {
      throwError(config, getError('api_servers', config.language));
      return true;
    }

    if (!config.captchaId) {
      throwError(config, getError('captcha_id', config.language));
      return true;
    }
  }

  var initGeetest = function initGeetest(userConfig, callback) {
    var s = 'init';
    var languge = userConfig.language || getBrowserLanguage();
    userConfig.language = resolveLanguage(languge);

    if (checkParamsError(userConfig)) {
      return;
    }

    var cloneConfig = _assign({
      encryption: 'SM4_SM2'
    }, userConfig);

    var config = new Config(cloneConfig);

    if (!config.ext) {
      config.ext = {
        ua: window.navigator.userAgent
      };
    }

    config.challenge = uuid();
    jsonp(config.apiServers, 'load', config, function (newconfig) {
      if (newconfig.status === 'error') {
        throwError(config, getError(newconfig, config.language));
      } else {
        var translateData = camelizeKeys(newconfig.data);

        config._extend(translateData);

        if (!config.offline) {
          if (config.debug) {
            config._extend(config.debug);
          }
        }

        var init = function init() {
          callback(new window.Geetest(config));
        };

        if (s === 'init' || s === 'loaded') {
          s = 'loading';
          load(config.protocol, config.staticServers || config.domains, config.js, null, function (err) {
            if (err) {
              s = 'fail';
              throwError(config, getError('js_unload', config.language));
            } else {
              s = 'loaded';
              init(config);

              for (var i = 0, len = callbacks.length; i < len; i += 1) {
                var cb = callbacks[i];

                if (isFunction(cb)) {
                  cb(config);
                }
              }

              callbacks = [];
            }
          }, null, config.timeout);
          load(config.protocol, config.staticServers || config.domains, config.gct, null, function (err) {
            if (err) {
              throwError(config, getError('gct_unload', config.language));
            }
          }, null, config.timeout);
        } else {
          callbacks.push(init);
        }
      }
    });
  };

  window.initGeetest = initGeetest;

})));
