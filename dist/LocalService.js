(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.LocalService = factory());
})(this, (function () { 'use strict';

    /*
        ## Utilities
    */
    var Util = {};

    Util.extend = function extend() {
        var target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            options, name, src, copy, clone;

        if (length === 1) {
            target = this;
            i = 0;
        }

        for (; i < length; i++) {
            options = arguments[i];
            if (!options) continue

            for (name in options) {
                src = target[name];
                copy = options[name];

                if (target === copy) continue
                if (copy === undefined) continue

                if (Util.isArray(copy) || Util.isObject(copy)) {
                    if (Util.isArray(copy)) clone = src && Util.isArray(src) ? src : [];
                    if (Util.isObject(copy)) clone = src && Util.isObject(src) ? src : {};

                    target[name] = Util.extend(clone, copy);
                } else {
                    target[name] = copy;
                }
            }
        }

        return target
    };

    Util.each = function each(obj, iterator, context) {
        var i, key;
        if (this.type(obj) === 'number') {
            for (i = 0; i < obj; i++) {
                iterator(i, i);
            }
        } else if (obj.length === +obj.length) {
            for (i = 0; i < obj.length; i++) {
                if (iterator.call(context, obj[i], i, obj) === false) break
            }
        } else {
            for (key in obj) {
                if (iterator.call(context, obj[key], key, obj) === false) break
            }
        }
    };

    Util.type = function type(obj) {
        return (obj === null || obj === undefined) ? String(obj) : Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase()
    };

    Util.each('String Object Array RegExp Function'.split(' '), function(value) {
        Util['is' + value] = function(obj) {
            return Util.type(obj) === value.toLowerCase()
        };
    });

    Util.isObjectOrArray = function(value) {
        return Util.isObject(value) || Util.isArray(value)
    };

    Util.isNumeric = function(value) {
        return !isNaN(parseFloat(value)) && isFinite(value)
    };

    Util.keys = function(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) keys.push(key);
        }
        return keys;
    };
    Util.values = function(obj) {
        var values = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) values.push(obj[key]);
        }
        return values;
    };

    /*
        ### Mock.heredoc(fn)

        * Mock.heredoc(fn)

        ?????????????????????????????????????????????HTML ?????????

        **????????????**???????????????

            var tpl = Mock.heredoc(function() {
                /*!
            {{email}}{{age}}
            <!-- Mock { 
                email: '@EMAIL',
                age: '@INT(1,100)'
            } -->
                *\/
            })
        
        **????????????**
        * [Creating multiline strings in JavaScript](http://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript)???
    */
    Util.heredoc = function heredoc(fn) {
        // 1. ??????????????? function(){ /*!
        // 2. ??????????????? */ }
        // 3. ??????????????????????????????
        return fn.toString()
            .replace(/^[^\/]+\/\*!?/, '')
            .replace(/\*\/[^\/]+$/, '')
            .replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '') // .trim()
    };

    Util.noop = function() {};

    /* global globalThis, document, location, Event, setTimeout */

    // ???????????? XMLHttpRequest
    globalThis._XMLHttpRequest = globalThis.XMLHttpRequest;
    globalThis._ActiveXObject = globalThis.ActiveXObject;

    /*
        PhantomJS
        TypeError: '[object EventConstructor]' is not a constructor (evaluating 'new Event("readystatechange")')

        https://github.com/bluerail/twitter-bootstrap-rails-confirm/issues/18
        https://github.com/ariya/phantomjs/issues/11289
    */
    try {
        new globalThis.Event('custom');
    } catch (exception) {
        globalThis.Event = function (type, bubbles, cancelable, detail) {
            var event = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
            event.initCustomEvent(type, bubbles, cancelable, detail);
            return event
        };
    }

    var XHR_STATES = {
        // The object has been constructed.
        UNSENT: 0,
        // The open() method has been successfully invoked.
        OPENED: 1,
        // All redirects (if any) have been followed and all HTTP headers of the response have been received.
        HEADERS_RECEIVED: 2,
        // The response's body is being received.
        LOADING: 3,
        // The data transfer has been completed or something went wrong during the transfer (e.g. infinite redirects).
        DONE: 4
    };

    var XHR_EVENTS = 'readystatechange loadstart progress abort error load timeout loadend'.split(' ');
    var XHR_REQUEST_PROPERTIES = 'timeout withCredentials'.split(' ');
    var XHR_RESPONSE_PROPERTIES = 'readyState responseURL status statusText responseType response responseText responseXML'.split(' ');

    // https://github.com/trek/FakeXMLHttpRequest/blob/master/fake_xml_http_request.js#L32
    var HTTP_STATUS_CODES = {
        100: "Continue",
        101: "Switching Protocols",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        300: "Multiple Choice",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported"
    };

    /*
        MockXMLHttpRequest
    */

    function MockXMLHttpRequest() {
        // ????????? custom ????????????????????????????????????
        this.custom = {
            events: {},
            requestHeaders: {},
            responseHeaders: {}
        };
    }

    MockXMLHttpRequest._settings = {
        timeout: '10-100',
        noError: false
        /*
            timeout: 50,
            timeout: '10-100',
            noError: ??????????????????????????????????????????200????????????code?????????????????????????????????????????????code
         */
    };

    MockXMLHttpRequest.setup = function (settings) {
        Util.extend(MockXMLHttpRequest._settings, settings);
        return MockXMLHttpRequest._settings
    };

    Util.extend(MockXMLHttpRequest, XHR_STATES);
    Util.extend(MockXMLHttpRequest.prototype, XHR_STATES);

    // ????????????????????? MockXMLHttpRequest
    MockXMLHttpRequest.prototype.mock = true;

    // ???????????? Ajax ??????
    MockXMLHttpRequest.prototype.match = false;

    // ????????? Request ????????????????????????
    Util.extend(MockXMLHttpRequest.prototype, {
        // https://xhr.spec.whatwg.org/#the-open()-method
        // Sets the request method, request URL, and synchronous flag.
        open: function (method, url, async, username, password) {
            var that = this;

            Util.extend(this.custom, {
                method: method,
                url: url,
                async: typeof async ==='boolean' ? async :true,
                username: username,
                password: password,
                options: {
                    url: url,
                    type: method
                }
            });

            this.custom.timeout = function (timeout) {
                if (typeof timeout === 'number') return timeout
                if (typeof timeout === 'string' && !~timeout.indexOf('-')) return parseInt(timeout, 10)
                if (typeof timeout === 'string' && ~timeout.indexOf('-')) {
                    var tmp = timeout.split('-');
                    var min = parseInt(tmp[0], 10);
                    var max = parseInt(tmp[1], 10);
                    return Math.round(Math.random() * (max - min)) + min
                }
            }(MockXMLHttpRequest._settings.timeout);
            // ??????????????????????????????????????????
            var item = find(this.custom.options);

            function handle(event) {
                // ???????????? NativeXMLHttpRequest => MockXMLHttpRequest
                for (var i = 0; i < XHR_RESPONSE_PROPERTIES.length; i++) {
                    try {
                        that[XHR_RESPONSE_PROPERTIES[i]] = xhr[XHR_RESPONSE_PROPERTIES[i]];
                    } catch (e) {}
                }
                // ?????? MockXMLHttpRequest ??????????????????
                that.dispatchEvent(new Event(event.type /*, false, false, that*/ ));
            }

            // ?????????????????????????????????????????????????????? XHR ???????????????
            if (!item) {
                // ???????????? XHR ????????????????????? open()???????????????????????????
                var xhr = createNativeXMLHttpRequest();
                this.custom.xhr = xhr;

                // ?????????????????????????????????????????? XHR ???????????????
                for (var i = 0; i < XHR_EVENTS.length; i++) {
                    xhr.addEventListener(XHR_EVENTS[i], handle);
                }

                // xhr.open()
                if (username) xhr.open(method, url, async, username, password);
                else xhr.open(method, url, async);

                // ???????????? MockXMLHttpRequest => NativeXMLHttpRequest
                for (var j = 0; j < XHR_REQUEST_PROPERTIES.length; j++) {
                    try {
                        xhr[XHR_REQUEST_PROPERTIES[j]] = that[XHR_REQUEST_PROPERTIES[j]];
                    } catch (e) {}
                }

                return
            }

            // ????????????????????????????????????????????? XHR ??????
            this.match = true;
            this.custom.template = item;
            this.readyState = MockXMLHttpRequest.OPENED;
            this.dispatchEvent(new Event('readystatechange' /*, false, false, this*/ ));
        },
        // https://xhr.spec.whatwg.org/#the-setrequestheader()-method
        // Combines a header in author request headers.
        setRequestHeader: function (name, value) {
            // ?????? XHR
            if (!this.match) {
                this.custom.xhr.setRequestHeader(name, value);
                return
            }

            // ?????? XHR
            var requestHeaders = this.custom.requestHeaders;
            if (requestHeaders[name]) requestHeaders[name] += ',' + value;
            else requestHeaders[name] = value;
        },
        timeout: 0,
        noError: false,
        withCredentials: false,
        upload: {},
        // https://xhr.spec.whatwg.org/#the-send()-method
        // Initiates the request.
        send: function send(data) {
            var that = this;
            this.custom.options.body = data;
            // ?????? XHR
            if (!this.match) {
                this.custom.xhr.send(data);
                return
            }

            // ?????? XHR

            // X-Requested-With header
            this.setRequestHeader('X-Requested-With', 'MockXMLHttpRequest');

            // loadstart The fetch initiates.
            this.dispatchEvent(new Event('loadstart' /*, false, false, this*/ ));

            if (this.custom.async) {
                if (this.custom.template.service) {
                    //??????template??????????????????????????????resolve???????????????????????????????????????????????????????????????
                    // {status:xxx,response:{}}
                    new Promise((resolve, reject) => {
                        this.custom.template.service(this.custom.options, resolve, reject);
                    }).then((req) => {
                        this.custom.options['local_data'] = req['response'];
                        this.custom.options['status'] = req['status'];
                        done();
                    }).catch((error) => {
                        this.custom.options['local_data'] = error['response'];
                        let status = error['status'] || 400;
                        this.noError ? done() : done_error(status);
                    });
                } else {
                    setTimeout(() => {
                        done();
                    }, this.custom.timeout);
                }
            } else done(); // ??????

            function done() {
                that.readyState = MockXMLHttpRequest.HEADERS_RECEIVED;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));
                that.readyState = MockXMLHttpRequest.LOADING;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));

                that.status = that.custom.options['status'] || 200;
                that.statusText = that.custom.options['status'] ? HTTP_STATUS_CODES[that.custom.options['status']] : HTTP_STATUS_CODES[200];
                that.custom.template.template = ()=>{return that.custom.options['local_data']};
                // fix #92 #93 by @qddegtya
                that.response = that.responseText = JSON.stringify(
                    convert(that.custom.template, that.custom.options),
                    null, 4
                );
                that.readyState = MockXMLHttpRequest.DONE;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));
                that.dispatchEvent(new Event('load' /*, false, false, that*/ ));
                that.dispatchEvent(new Event('loadend' /*, false, false, that*/ ));
            }

            function done_error(status_code) {
                console.log('status', status_code);
                that.readyState = MockXMLHttpRequest.HEADERS_RECEIVED;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));
                that.readyState = MockXMLHttpRequest.LOADING;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));

                that.status = status_code;
                that.statusText = HTTP_STATUS_CODES[status_code];
                console.log('error,options', that.custom.options);
                that.custom.template.error_template = ()=>{return that.custom.options['local_data']};
                // fix #92 #93 by @qddegtya
                that.response = that.responseText = JSON.stringify(
                    convert(that.custom.template, that.custom.options, 'error'),
                    null, 4
                );
                that.readyState = MockXMLHttpRequest.DONE;
                that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/ ));
                that.dispatchEvent(new Event('load' /*, false, false, that*/ ));
                that.dispatchEvent(new Event('loadend' /*, false, false, that*/ ));
            }
        },
        // https://xhr.spec.whatwg.org/#the-abort()-method
        // Cancels any network activity.
        abort: function abort() {
            // ?????? XHR
            if (!this.match) {
                this.custom.xhr.abort();
                return
            }

            // ?????? XHR
            this.readyState = MockXMLHttpRequest.UNSENT;
            this.dispatchEvent(new Event('abort', false, false, this));
            this.dispatchEvent(new Event('error', false, false, this));
        }
    });

    // ????????? Response ????????????????????????
    Util.extend(MockXMLHttpRequest.prototype, {
        responseURL: '',
        status: MockXMLHttpRequest.UNSENT,
        statusText: '',
        // https://xhr.spec.whatwg.org/#the-getresponseheader()-method
        getResponseHeader: function (name) {
            // ?????? XHR
            if (!this.match) {
                return this.custom.xhr.getResponseHeader(name)
            }

            // ?????? XHR
            return this.custom.responseHeaders[name.toLowerCase()]
        },
        // https://xhr.spec.whatwg.org/#the-getallresponseheaders()-method
        // http://www.utf8-chartable.de/
        getAllResponseHeaders: function () {
            // ?????? XHR
            if (!this.match) {
                return this.custom.xhr.getAllResponseHeaders()
            }

            // ?????? XHR
            var responseHeaders = this.custom.responseHeaders;
            var headers = '';
            for (var h in responseHeaders) {
                if (!responseHeaders.hasOwnProperty(h)) continue
                headers += h + ': ' + responseHeaders[h] + '\r\n';
            }
            return headers
        },
        overrideMimeType: function ( /*mime*/ ) {},
        responseType: '', // '', 'text', 'arraybuffer', 'blob', 'document', 'json'
        response: null,
        responseText: '',
        responseXML: null
    });

    // EventTarget
    Util.extend(MockXMLHttpRequest.prototype, {
        addEventListener: function addEventListener(type, handle) {
            var events = this.custom.events;
            if (!events[type]) events[type] = [];
            events[type].push(handle);
        },
        removeEventListener: function removeEventListener(type, handle) {
            var handles = this.custom.events[type] || [];
            for (var i = 0; i < handles.length; i++) {
                if (handles[i] === handle) {
                    handles.splice(i--, 1);
                }
            }
        },
        dispatchEvent: function dispatchEvent(event) {
            var handles = this.custom.events[event.type] || [];
            for (var i = 0; i < handles.length; i++) {
                handles[i].call(this, event);
            }

            var ontype = 'on' + event.type;
            if (this[ontype]) this[ontype](event);
        }
    });

    // Inspired by jQuery
    function createNativeXMLHttpRequest() {
        var isLocal = function () {
            var rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/;
            var rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/;
            var ajaxLocation = location.href;
            var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [];
            return rlocalProtocol.test(ajaxLocParts[1])
        }();

        return globalThis.ActiveXObject ?
            (!isLocal && createStandardXHR() || createActiveXHR()) : createStandardXHR()

        function createStandardXHR() {
            try {
                return new globalThis._XMLHttpRequest();
            } catch (e) {}
        }

        function createActiveXHR() {
            try {
                return new globalThis._ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {}
        }
    }


    // ?????????????????????????????????????????????URL???Type
    function find(options) {

        for (var sUrlType in MockXMLHttpRequest.LocalService._listener_listed) {
            var item = MockXMLHttpRequest.LocalService._listener_listed[sUrlType];

            if (
                (!item.rurl || match(item.rurl, options.url)) &&
                (!item.rtype || match(item.rtype.toLowerCase(), options.type.toLowerCase()))
            ) {
                // console.log('[mock]', options.url, '>', item.rurl)
                return item
            }
        }

        function match(expected, actual) {
            if (Util.type(expected) === 'string') {
                return expected === actual
            }
            if (Util.type(expected) === 'regexp') {
                return expected.test(actual)
            }
        }

    }

    // ???????????? ???> ????????????
    function convert(item, options, type) {
        if (type == 'error') {
            return Util.isFunction(item['error_template']) ?
                item.error_template(options) : MockXMLHttpRequest.LocalService.listener(item)
        } else {
            return Util.isFunction(item['template']) ?
                item.template(options) : MockXMLHttpRequest.LocalService.listener(item)
        }
    }

    /* global require, module, window */

    var LocalService = {
        XHR: MockXMLHttpRequest,
        setup: function (settings) {
            return MockXMLHttpRequest.setup(settings)
        },
        _listener_listed: {}
    };

    // ??????????????????
    if (MockXMLHttpRequest) MockXMLHttpRequest.LocalService = LocalService;

    LocalService.listener = function (rurl, rtype, service) {
        // ?????? XHR
        if (MockXMLHttpRequest) globalThis.XMLHttpRequest = MockXMLHttpRequest;
        LocalService._listener_listed[rurl + (rtype || '')] = {
            rurl: rurl,
            rtype: rtype,
            service: service
        };

        return LocalService
    };

    return LocalService;

}));
