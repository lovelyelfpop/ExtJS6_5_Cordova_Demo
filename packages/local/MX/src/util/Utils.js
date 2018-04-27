/**
 * 通用 帮助类
 * @author jiangwei
 */
Ext.define('MX.util.Utils', {
    alternateClassName: 'Utils',
    singleton: true,
    requires: [
        'Ext.Toast',
        'Ext.MessageBox'
    ],

    /**
     * 常用正则
     */
    regex: {
        url: /^(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-/]))?$/i
    },

    /**
     * 常用正则, 字符串形式
     */
    regexStr: {
        query: '((\\?(?:&?[^=&]*=[^=&]*)*)?)', // 可以匹配 空字符串、?、?DocEntry=30000
        query2: '(\\?(?:&?[^=&]*=[^=&]*)*)' // 可以匹配 ?、?DocEntry=30000
    },

    /**
     * 当前是否是development模式
     * @property {Boolean}
     */
    isDev: Ext.manifest.env === 'development', // development/production

    /**
     * 当前是否是web访问
     * @property {Boolean}
     */
    isWeb: location.href.indexOf('http') == 0,

    /**
     * 是否 debug 打包(sencha app build development/cordova build)
     */
    isDebugBuild() {
        return this.isDev || window.BuildInfo && BuildInfo.debug;
    },

    /**
     * 是否手动开启 debug 模式（比如：点击 7 次版本号）
     */
    isDebugOpened() {
        return !!parseInt(this.getLsItem('debug') || 0, 10);
    },

    /**
     * 是否 debug 模式，控制服务端输出日志
     */
    isDebug() {
        return this.isDebugBuild() || this.isDebugOpened();
    },

    /**
     * 获取应用程序的实例
     * @return {Ext.app.Application}
     */
    getApp() {
        return Ext.getApplication() || Ext.route.Router.application;
    },

    /**
     * 获取应用程序的名称
     * @return {String}
     */
    getAppName() {
        return this.getApp().getName();
    },

    err(bucket, tag) {
        return function () {
            console.log(arguments.callee.caller);
            if (typeof bucket !== 'undefined') {
                console.log(` ${bucket}:`);
            }
            if (typeof tag !== 'undefined') {
                console.log(`  ${tag}:`);
            }
            console.error ? console.error(arguments) : console.log(arguments);
        };
    },
    /** **************************LocalStorage操作********************************/
    /**
     * 获取localStorage存储的key，前面加上<AppName>-
     * @param  {String} key 原始key
     * @return {String}     前面加了<AppName>-的key
     */
    getLsKey(key) {
        if (Ext.isEmpty(key)) return '';

        return `${this.getAppName()}-${key}`;
    },

    /**
     * 根据key获取localStorage的值
     * @param  {String} key 键
     * @return {String}     值
     */
    getLsItem(key) {
        return localStorage.getItem(this.getLsKey(key));
    },

    /**
     * 根据key获取localStorage的值
     * @param  {String} key 键
     * @param  {String} value 值
     */
    setLsItem(key, value) {
        localStorage.setItem(this.getLsKey(key), value);
    },

    /**
     * 根据key移除localStorage的值
     * @param  {String} key 键
     */
    removeLsItem(key) {
        localStorage.removeItem(this.getLsKey(key));
    },

    /** **************************路由跳转********************************/

    /**
     * url跳转
     */
    redirectTo() {
        const app = this.getApp();
        if (app) {
            app.redirectTo.apply(app, arguments);
        }
    },

    replaceState(hash) {
        if (history.replaceState) {
            history.replaceState(null, '', hash);
        }
    },

    /**
     * 静默转向 hash 地址， 不触发路由处理函数
     * @param {String} hash
     */
    redirectToSilently(hash) {
        if (history.pushState) {
            const me = this,
                oldToken = Ext.History.getToken(),
                token = me.hash2Token(hash);

            history.pushState(null, '', me.token2Hash(hash));

            // 必须要有下面2句，否则后退不能触发路由
            Ext.History.hash = token;
            Ext.route.Router.clearLastTokens(oldToken);

            Ext.fireEvent('afterroute', null, token, true);
        }
    },

    /**
     * 退出悬浮层的路由，比如编辑界面 dialog/window
     *
     * @param {Boolean} silent 是否静默退出，而不触发新的token的处理函数
     * @param {String} newToken 要转向的新的路由
     */
    exitRoute(silent, newToken) {
        const token = newToken || this.getApp().getDefaultToken();
        if (silent === true) {
            this.redirectToSilently(token);
        } else {
            this.redirectTo(token);
        }
    },

    /**
     * 根据 token 获取 路由对象
     * 如果提供了第二个参数(控制器 或 app 实例)，则 只获取 它里面 有的
     *
     * @param {String} token
     * @param {Ext.app.BaseController} instance 可选，控制器 或 app 实例
     * @return {Ext.route.Route}
     */
    getRouteByToken(token, instance) {
        const routes = Ext.route.Router.routes;

        let enumsObj = {},
            name,
            route;
        if (instance && instance.getRoutes) {
            const obj = instance.getRoutes();
            if (obj) enumsObj = obj;
        } else {
            enumsObj = routes;
        }

        for (name in enumsObj) {
            route = routes[name];
            if (token && route.recognize(token)) {
                return route;
            }
        }

        return null;
    },

    /**
     * '#login' -> 'login'
     *
     * @param {String} hash
     * @return {String}
     */
    hash2Token(hash) {
        return (hash || '').replace(Ext.History.hashRe, '');
    },

    /**
     * 'login' -> '#login'
     *
     * @param {String} token
     * @return {String}
     */
    token2Hash(token) {
        return (token || '').replace(Ext.History.hashRe, Ext.History.hashbang ? '#!' : '#');
    },

    /** **************************ajax方法调用********************************/
    _handleOptions(options) {
        const me = this;
        options = options || {};

        // 进度条
        /* if (options.loadTarget !== false) {
            if (Ext.isEmpty(options.loadTarget) || options.loadTarget === true) {
                options.loadTarget = Ext.Viewport;
            } else if (Ext.isString(options.loadTarget)) {
                options.loadTarget = Ext.getCmp(options.loadTarget);
            }
        }*/

        // 遮罩层
        if (options.maskTarget) {
            if (options.maskTarget == true) {
                options.maskTarget = Ext.Viewport;
            } else if (Ext.isString(options.maskTarget)) {
                options.maskTarget = Ext.getCmp(options.maskTarget);
            }
        }

        // 此ajax请求时需要禁用的按钮，可为空
        if (options.button) { // 也就是防止用户连续点击按钮
            const btns = [];
            let bs = options.button;
            bs = Ext.isArray(bs) ? bs : [bs];
            for (let i = 0; i < bs.length; i++) {
                const b = bs[i];
                if (Ext.isEmpty(b)) continue;
                btns.push(Ext.isString(b) ? Ext.getCmp(b) : b);
            }
            if (btns.length) {
                options.button = btns;
            } else {
                delete options.button;
            }
        }

        if (options.data) {
            options.params = Ext.apply({}, options.params, {
                data: Ext.encode(options.data)
            });
            delete options.data;
        }
        options.params = Ext.apply({}, options.params, this.getApp().getClientInfo());

        // 此ajax请求所关联的component控件，使得控件在destroy时可以abort终止该请求
        if (!options.ajaxHost || !options.ajaxHost.isComponent || options.ajaxHost.isDestroying) {
            delete options.ajaxHost;
        }

        return options;
    },

    /**
     * 累加多个字符串为路径，比如 joinPath('http:// aaa.bbb', 'ccc/ddd', 'eee', '/fff/')
     * @return {String} 最终路径
     */
    joinPath() {
        let result = '';
        Ext.each(Array.prototype.slice.call(arguments), function (str) {
            if (!Ext.isEmpty(str)) {
                while (!Ext.isEmpty(result) && result[result.length - 1] == '/') {
                    result = result.substr(0, result.length - 1);
                }
                while (str[0] == '/') {
                    str = str.substr(1);
                }
                if (!Ext.isEmpty(result)) result += '/';
                result += str;
            }
        });

        return result;
    },

    /**
     * 根据一个 url/path/路径 等得到完整的url
     *
     * @param {String} path
     * @return {String}
     */
    getFullUrl(path) {
        const me = this;
        if (!Ext.isEmpty(path)) {
            let url;
            if (Utils.isUrl(path) || /\.json$/i.test(path)) {
                url = path;
            } else {
                // 后台路由丢失session，所以 暂时 先fix
                if (/^(ajax|store)\/[^/]+\/[^/]+$/.test(path)) {
                    const arr = path.split('/');
                    url = Utils.joinPath(Config.httpUrl, 'ApiEntry', `${Ext.String.capitalize(arr[0])}.ashx?class=${arr[1]}&method=${arr[2]}`);
                } else {
                    url = Utils.joinPath(Config.httpUrl, path);
                }
            }

            return url;
        }

        return path;
    },

    /**
     * ajax请求统一入口
     * @param  {String} api     接口(不带http和域名), 比如shopController/saveShop.do
     * @param  {Object} options params、success、failure等
     * @return {Number}         此次请求的编号
     */
    ajax(api, options) {
        const me = this;
        // <debug>
        if (arguments.length == 0 || !Ext.isString(api) || !api) {
            Ext.Error.raise('ajax 参数不正确');
        }
        // </debug>

        const opt = me._handleOptions(options);
        /* if (opt.loadTarget) {
            me.loop(opt.loadTarget);
        }*/
        if (opt.maskTarget) {
            me.mask(opt.maskTarget);
        }
        const btnState = [];
        if (opt.button) {
            Ext.each(opt.button, function (b) {
                btnState.push(b.getDisabled());
                if (b.setCircularProgress) b.setCircularProgress(true); // 圆形进度条
                b.setDisabled(true);
            });
        }

        if (!/(ajax|store)\/.+/i.test(api)) {
            api = me.joinPath('ajax', api);
        }
        const request = Ext.Ajax.request(Ext.applyIf({
            url: me.getFullUrl(api),
            method: 'POST',
            useDefaultXhrHeader: false, // 跨域
            withCredentials: true, // 跨域时带上cookies

            success(r, op) {
                const contentType = r.getResponseHeader('content-type'),
                    isJson = /json/i.test(contentType);
                let result = r.responseText,
                    succeed = true, // 请求成功
                    data; // 数据
                if (!Ext.isEmpty(result) && isJson) {
                    try {
                        result = Ext.decode(result);
                    } catch (e) {}
                }
                data = result;

                if (result) {
                    if (result.hasOwnProperty('success')) {
                        succeed = result.success;
                        if (result.hasOwnProperty('data')) {
                            data = result.data;
                        }
                    }
                }

                if (succeed) { // result返回结果中success=true
                    // 错误码<-1 显示警告
                    if (result.hasOwnProperty('code') && result.hasOwnProperty('message') && Ext.isNumber(result.code) && result.code < 0 && !Ext.isEmpty(result.message)) {
                        Ext.toast({
                            message: result.message,
                            userCls: 'alert',
                            timeout: 2000
                        });
                    }
                    if (opt.success) opt.success.call(this, data);
                } else {
                    const msg = result.message || '',
                        errcode = result.code;
                    if (opt.failure) {
                        opt.failure.call(this, msg, errcode);
                    } else if (!Ext.isEmpty(msg)) {
                        me.alert(msg);
                    }
                }
            },
            failure(r, op) {
                let err = r.responseText;
                if (!Ext.isEmpty(err)) {
                    try {
                        err = eval(`(${err})`);
                    } catch (e) {}
                } else {
                    err = r.statusText;
                }

                const msg = err.message || err;
                if (r.status == '0') {
                    me.toastShort(msg || 'communication failure');
                } else if (r.status == '-1') { // ajax被中止
                    // aborted
                } else if (me.isUnauthorized(r.status)) { // 未授权
                    Ext.route.Router.resume(true);
                    // 转到登录页
                    this.getApp().fireEvent('needlogin');
                    me.toastShort(msg);
                } else if (opt.failure) { // 普通异常
                    opt.failure.call(this, msg, r.status, err);
                } else {
                    me.alert(msg);
                }
                // <debug>
                console.log(r, op);
                // </debug>
            },
            callback(op, success, r) {
                if (opt.button) {
                    Ext.each(opt.button, function (b, i) {
                        if (!b.isDestroyed && !b.isDestroying) {
                            if (b.setCircularProgress) b.setCircularProgress(false);
                            b.setDisabled(btnState[i]);
                        }
                    });
                }

                if (opt.ajaxHost && opt.ajaxHost.ajaxRequests && !opt.ajaxHost.isDestroying) {
                    delete opt.ajaxHost.ajaxRequests[r.requestId];
                }

                /* if (opt.loadTarget) {
                    me.unLoop(opt.loadTarget);
                }*/
                if (opt.maskTarget) {
                    me.unMask(opt.maskTarget);
                }
                if (opt.callback) {
                    opt.callback.call(this, success, r);
                }
            },
            scope: opt.scope || me
        }, opt));

        // 与此component有关的ajax请求
        const h = opt.ajaxHost;
        if (h && !h.isDestroying) {
            if (!h.ajaxRequests) h.ajaxRequests = {};
            h.ajaxRequests[request.id] = request;
        }

        return request;
    },

    /**
     * 判断 状态码 是不是 未授权
     *
     * @param {String} status
     * @return {Boolean}
     */
    isUnauthorized(status) {
        return status == '440' || status == '401';
    },
    /** **************************消息提示********************************/

    /**
     * alert
     *
     * @param {String} msg 提示文字
     */
    alert(msg) {
        const m = (msg || '').replace(/(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)/ig, '');
        if (!Ext.isEmpty(m)) Ext.Msg.alert('系统提示', m);
    },

    /**
     * confirm
     *
     * @param {String} msg 提示文字
     * @param {Function} handle 回调
     */
    confirm(msg, handle) {
        Ext.Msg.confirm('系统提示', msg, function (btn) {
            if (btn == 'yes' && handle != null) {
                handle();
            }
        });
    },

    /**
     * prompt
     *
     * @param {Object/String} config 提示文字
     * @param {Function} callback 回调
     */
    prompt(config, callback) {
        this._prompt(false, config, callback);
    },

    /**
     * 多行 prompt
     * @param {Object/String} config 配置项 或者 message
     * @param {Function} callback 确定按钮的回调
     */
    multiLinePrompt(config, callback) {
        this._prompt(true, config, callback);
    },

    _prompt(multiLine, config, callback) {
        if (Ext.isString(config)) {
            config = {
                message: config
            };
        }

        const xtype = multiLine ? 'textareafield' : 'textfield';
        Ext.Msg.show(Ext.merge({
            title: '系统提示',
            width: null,
            height: null,
            buttons: Ext.MessageBox.OKCANCEL,
            multiLine,
            defaultFocus: xtype,
            prompt: {
                xtype
            },
            fn(btn, text) {
                if (btn == 'ok' && callback) {
                    callback(text);
                }
            }
        }, config));
    },

    /**
     * 显示 1.5s 的 toast 提示
     *
     * @param {String} msg 提示文字
     */
    toastShort(msg) {
        if (!Ext.isEmpty(msg)) Ext.toast(msg, 1500);
    },

    /**
     * 显示 3s 的 toast 提示
     *
     * @param {String} msg 提示文字
     */
    toastLong(msg) {
        if (!Ext.isEmpty(msg)) Ext.toast(msg, 3000);
    },

    // 使用 Ext.util.Format.fileSize(1024)
    /* formatSize(size) { // 格式化文件大小
        let SIZE_KB = 1024,
            SIZE_MB = SIZE_KB * 1024,
            SIZE_GB = SIZE_MB * 1024;

        if (size < SIZE_KB) {
            return size + ' B';
        } else if (size < SIZE_MB) {
            return (size / SIZE_KB).toFixed(2) + ' KB';
        } else if (size < SIZE_GB) {
            return (size / SIZE_MB).toFixed(2) + ' MB';
        } else {
            return (size / SIZE_GB).toFixed(2) + ' GB';
        }
    },*/

    /**
     * 按某种格式将值格式化成字符串
     * @param {Object} value    原值
     * @param {Number} digit    小数位数
     * @return {String}
     */
    formatNum(value, digit) {
        if (!Ext.isEmpty(value)) {
            let format = '0,000.';
            while (digit > 0) {
                format += '0';
                digit--;
            }
            let display = Ext.util.Format.number(value, format);

            while (display[display.length - 1] == '0') {
                display = display.substr(0, display.length - 1);
            }
            if (display[display.length - 1] == '.') {
                display = display.substr(0, display.length - 1);
            }

            return display;
        }

        return '';
    },

    /**
     * 加密为十六进制字符
     *
     * @param {String} str
     * @return {String}
     */
    toHex(str) {
        let result = '';
        if (str != null) {
            str = str.toString();
            for (let i = 0; i < str.length; i++) {
                let temp = str.charCodeAt(i).toString(16);
                if (temp.length == 1) temp = `0${temp}00`;
                else if (temp.length == 2) temp = `${temp}00`;
                else if (temp.length == 3) temp = `${temp.substring(1, 3)}0${temp.substring(0, 1)}`;
                else if (temp.length == 4) temp = temp.substring(2, 4) + temp.substring(0, 2);
                result += temp;
            }
        }

        return result.toUpperCase();
    },

    /**
     * 十六进制字符解密
     *
     * @param {String} str
     * @return {String}
     */
    fromHex(str) {
        let result = '';
        if (str != null) {
            str = str.toString();
            for (let i = 0; i < str.length; i += 4) {
                result = result + String.fromCharCode(`0x${str.substring(i + 2, i + 4)}${str.substring(i, i + 2)}`);
            }
        }

        return result;
    },

    /**
     * KeyString->key(类型是Object)
     * @param {String} keyStr     如'DocEntry=32003000320032003500'
     * @param {Boolean} hex         keyStr是否是16进制
     * @return {Object}             如{ DocEntry: '20225' }
     */
    toKey(keyStr, hex) {
        if (hex === undefined) hex = true;
        const idx = keyStr.indexOf('?'),
            hashIdx = keyStr.indexOf('#');
        if (idx >= 0) {
            if (hashIdx > idx) {
                keyStr = keyStr.substring(idx + 1, hashIdx);
            } else {
                keyStr = keyStr.substr(idx + 1);
            }
        }
        const me = this,
            key = {},
            pairs = keyStr.split('&');
        Ext.each(pairs, pair => {
            const arr = pair.split('=');
            key[arr[0]] = hex ? me.fromHex(arr[1]) : arr[1];
        });

        return key;
    },

    /**
     * KeyString->key(类型是Object)
     * 只取 keyNames 里面有的字段的值
     * @param {String} keyStr
     * @param {String[]} keyNames 字段列表
     * @param {Boolean} hex 是否是16进制?
     */
    toKeyByKeyNames(keyStr, keyNames, hex) {
        const keyObj = this.toKey(keyStr, hex),
            result = {};
        Ext.each(keyNames, n => {
            result[n] = keyObj[n];
        });

        return result;
    },

    /**
     * KeyString->key(类型是Object)
     * @param {String} keyStr     如'DocEntry=32003000320032003500'
     * @param {Boolean} hex         keyStr是否是16进制
     * @return {Object}             如{ k: ['DocEntry'], v: ['20225'] }
     */
    toKeyList(keyStr, hex) {
        if (hex === undefined) hex = true;
        const me = this,
            kv = {
                k: [],
                v: []
            };
        if (Ext.isString(keyStr)) {
            const pairs = keyStr.split('&');
            Ext.each(pairs, pair => {
                const arr = pair.split('=');
                kv.k.push(arr[0]);
                kv.v.push(hex ? me.fromHex(arr[1]) : arr[1]);
            });
        } else {
            for (const i in keyStr) {
                if (keyStr.hasOwnProperty(i)) {
                    kv.k.push(i);
                    kv.v.push(keyStr[i]);
                }
            }
        }

        return kv;
    },

    /**
     * key(类型是Object)->KeyString
     * @param {Object} keyStr     如{ DocEntry: '20225' }
     * @param {Boolean} hex         是否返回16进制形式
     * @return {String}             如'DocEntry=32003000320032003500'
     */
    toKeyStr(key, hex) {
        if (hex === undefined) hex = true;
        const me = this,
            array = [];
        for (const i in key) {
            if (!Ext.isEmpty(key[i])) {
                const value = hex ? me.toHex(key[i]) : key[i];
                array.push(`${i}=${value}`);
            }
        }

        return array.join('&');
    },

    /**
     * 比较2个 keystring 是否相等
     * 直接比较 keystring 有时候是不对的
     * 因为 a=1&b=2 和 b=2&a=1 其实是一样的
     * @param {String} keyStr1
     * @param {String} keyStr2
     * @return {Boolean}
     */
    isEqKeyStr(keyStr1, keyStr2) {
        if (!keyStr1 && !keyStr2) return true;
        if (!keyStr1 && keyStr2 || keyStr1 && !keyStr2) return false;

        const me = this,
            obj1 = me.toKey(keyStr1, false),
            obj2 = me.toKey(keyStr2, false);
        let k;
        for (k in obj1) {
            if (obj1.hasOwnProperty(k)) {
                if (obj2[k] !== obj1[k]) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * 日期Date或者整数int(如1130)或者字符串(如'1130')转为时间字符串(如'11:30')
     * @param {Date/Number/String} value 日期Date或者整数int(如1130)或者字符串(如'1130')
     * @param {Boolean} ampm  是否显示AM/PM
     * @return {String}
     */
    time2Str(value, ampm) {
        if (!Ext.isEmpty(value)) {
            if (Ext.isDate(value)) { // date类型->'11:30'
                return Ext.util.Format.date(value, 'H:i');
            }
            // 1130->'11:30'
            if (value.toString().indexOf(':', 0) >= 0) {
                if (value.toString().length == 4) {
                    return `0${value}`;
                }

                return value;
            }
            let time = `0000${value}`;
            time = time.substr(time.length - 4, 4);
            if (ampm) {
                const currentHours = parseInt(time.substr(0, 2), 10);
                let m = 'AM',
                    hour = currentHours;
                if (currentHours > 12) {
                    m = 'PM';
                    hour -= 12;
                } else if (currentHours == 12) {
                    ampm = 'PM';
                } else if (currentHours == 0) {
                    hour = 12;
                }

                return `${hour}:${time.substr(2, 2)} ${m}`;
            }

            return `${time.substr(0, 2)}:${time.substr(2, 2)}`;
        }

        return '';
    },

    /**
     * Date 类型 或者 '11:30' 转为 1130
     * @param {Date/String} value
     * @return {Number}
     */
    time2Int(value) {
        if (!Ext.isEmpty(value)) {
            if (Ext.isDate(value)) { // date类型->1130
                return value.getHours() * 100 + value.getMinutes();
            } else if (Ext.isString(value)) { // '11:30'->1130
                if (/^\d{1,2}:\d{2}$/.test(value)) {
                    return parseInt(value.replace(':', ''), 10);
                }
            }

            return value;
        }

        return null;
    },

    /**
     * 合并日期和时间
     * @param  {Date} date 日期
     * @param  {Date/Number/String} time 时间
     * @return {Date}      合并后的日期
     */
    joinDateTime(date, time) {
        if (!date) return null;

        let hour = 0,
            minute = 0;
        const result = Ext.Date.clone(date);
        if (Ext.isEmpty(time)) {
            return result;
        } else if (Ext.isNumber(time)) {
            hour = parseInt(time / 100, 10);
            minute = time % 100;
        } else {
            const timeStr = this.time2Str(time);
            hour = parseInt(timeStr.substr(0, 2), 10),
                minute = parseInt(timeStr.substr(3), 10);
        }
        result.setHours(hour);
        result.setMinutes(minute);
        result.setSeconds(0);

        return result;
    },

    /**
     * 日期时间格式化
     * @param {Date} date
     * @return {String}
     */
    datetime2Str(date) {
        if (!date) return '';
        if (!Ext.isDate(date)) date = new Date(date);

        return Ext.util.Format.date(date, `${Ext.Date.defaultFormat} ${Ext.Date.defaultTimeFormat}`);
    },

    /**
     * 日期格式化
     * @param {Date} date
     * @return {String}
     */
    date2Str(date) {
        if (!date) return '';
        if (!Ext.isDate(date)) date = new Date(date);

        return Ext.util.Format.date(date, Ext.Date.defaultFormat);
    },

    /**
     * 时间 转 刚刚、几分钟前、几小时前、今天 10:30、昨天 18:55 等
     * 太久就显示为 01-15 11:12、2017-10-05 15:47
     * @param {Date} date
     * @param {Boolean} withTime 带上时间?
     * @return {String}
     */
    datetime2Ago(date, withTime) {
        if (!date) return '';
        if (!Ext.isDate(date)) date = new Date(date);
        const now = new Date(),
            span = now - date,
            mins = parseInt(span / (1000 * 60), 10);
        if (mins <= 0) return '刚刚';
        if (mins <= 60) return `${mins} 分钟前`;

        const hours = parseInt(span / (1000 * 60 * 60), 10);
        if (hours <= 6) return `${hours} 小时前`;

        const timeStr = withTime ? Ext.util.Format.date(date, ' H:i') : '',
            isThisYear = now.getFullYear() == date.getFullYear(),
            isThisMonth = isThisYear && now.getMonth() == date.getMonth(),
            isToday = isThisMonth && now.getDate() == date.getDate();
        if (isToday) {
            return `今天${timeStr}`;
        }
        const yesterday = Ext.Date.add(now, Ext.Date.DAY, -1),
            isYtYear = yesterday.getFullYear() == date.getFullYear(),
            isYtMonth = isYtYear && yesterday.getMonth() == date.getMonth(),
            isYesterday = isYtMonth && yesterday.getDate() == date.getDate();
        if (isYesterday) {
            return `昨天${timeStr}`;
        }

        return Ext.util.Format.date(date, isThisYear ? 'm-d' : 'Y-m-d') + timeStr;
    },

    /**
     * 时间 转 消逝
     * 刚刚、几分钟前、几小时前、几天零几小时前、几周零几天前、几个月零几天前、几年零几个月前
     * @param {Number/Date} date 时间
     * @return {String}
     */
    datetime2Elapse(date) {
        if (!date) return '';
        const me = this,
            now = Date.now(),
            floor = Math.floor,
            part = me._elapsePart;

        var seconds = floor((now - date) / 1000),
            minutes = floor(seconds / 60),
            hours = floor(minutes / 60),
            days = floor(hours / 24),
            weeks = floor(days / 7),
            months = floor(days / 30),
            years = floor(days / 365),
            ret1, ret2;

        months %= 12;
        weeks %= 52;
        days %= 365;
        hours %= 24;
        minutes %= 60;
        seconds %= 60;

        if (years) {
            ret1 = part(years, '年');
            ret2 = part(months, '个月');
        } else if (months) {
            ret1 = part(months, '个月');
            ret2 = part(days, '天');
        } else if (weeks) {
            ret1 = part(weeks, '周');
            ret2 = part(days, '天');
        } else if (days) {
            ret1 = part(days, '天');
            ret2 = part(hours, '小时');
        } else if (hours) {
            ret1 = part(hours, '小时');
        } else if (minutes) {
            ret1 = part(minutes, '分钟');
        } else {
            return '刚刚';
        }

        if (!ret2) return `${ret1}前`;

        return `${ret1}零${ret2}前`;
    },
    _elapsePart(value, type, gap) {
        const ret = value ? `${(gap || '') + value}${type}` : '';

        return ret;
    },

    /**
     * 从container中移除所有子控件，满足 fn 函数的除外
     *
     * @param {Ext.Container} container
     * @param {Function} fn
     * @return
     */
    removeAllBut(container, fn) {
        if (!container) return;

        const items = container.items;
        let ln = items.length,
            i = 0,
            item;

        for (; i < ln; i++) {
            item = items.getAt(i);
            if (item && item.isInnerItem()) {
                if (fn && fn(item)) {
                    container.doRemove(item, i, true);
                    i--;
                    ln--;
                }
            }
        }
    },

    /**
     * 代理某个容器内按钮的事件，在controller中统一监听
     * @param  {Ext.Container} btnContainer 容器
     * @param  {Ext.Component} view 可以看做作用域scope，在哪个view上fireEvent
     */
    delegateButtonEvents(btnContainer, view) {
        if (view === undefined) view = btnContainer;
        btnContainer.on({
            delegate: 'button',
            tap(btn) {
                view.fireEvent(`tap${btn.config.action}`, view, btn);
            }
        });
    },

    // ****************************显示或隐藏 加载的菊花遮罩层****************************/

    /**
     * 显示'加载中...'的菊花
     * @param  {Ext.Component} view 视图或者控件
     * @param  {String} msg  提示信息
     */
    mask(view, msg) {
        const message = msg || ''; // || '请稍后';
        if (view /* && view.isPainted()*/ && !view.isDestroyed) {
            const mask = this.getLoadMask(message);
            /* if (mask && mask.getParent() !== view) {
                view.add(mask);
            }*/
            view.setMasked(mask);
        }
    },

    /**
     * 隐藏'加载中...'的菊花
     * @param  {Ext.Component} view 视图或者控件
     */
    unMask(view) {
        if (view /* && view.isPainted()*/ && !view.isDestroyed &&
            view._masked && !view._masked.isDestroyed) {
            view.setMasked(false);
        }
    },

    /**
     * 获取loadmask实例，重用已有的，防止不断创建
     * @param  {String} msg 提示信息
     * @return {Ext.Loadmask}     [description]
     */
    getLoadMask(msg) {
        let mask = this.getCmp('loadmask', true);
        if (mask) {
            mask.setMessage(msg);
        } else {
            mask = Ext.widget('loadmask', {
                message: msg
            });
            mask.on('tap', 'hide', mask);
        }

        return mask;
    },

    /**
     * 隐藏所有悬浮层
     *
     */
    backAllFloated() {
        // 如果有的悬浮层，不想在 url 改变时隐藏，那就加上这个样式类：not-backable
        Ext.each((Ext.floatRoot || Ext).query('.x-floated:not(.x-tooltip):not(.not-backable)'), function (el, idx) {
            const cmp = Ext.getCmp(el.id);
            if (cmp) {
                cmp.hide();
            }
        });
    },

    /**
     * 隐藏最顶层(z-index)悬浮的层
     * @return {Boolean} 是否成功隐藏某一个层
     */
    backOneFloating() {
        let done = false;
        Ext.each((Ext.floatRoot || Ext).query('.x-floated:not(.x-tooltip)'), function (el, idx) {
            const cmp = Ext.getCmp(el.id);
            if (cmp) {
                if (cmp.onBack) { // 如果弹出层有onBack成员函数(表示自己处理返回)，就调用它，而不隐藏弹出层
                    cmp.onBack();
                } else {
                    cmp.hide();
                }
                done = true;

                return false; // break
            }
        });

        return done;
    },

    /**
     * 是否注册有某个xtype
     * @param  {String} xtype
     * @return {Boolean}
     */
    hasXType(xtype) {
        return Ext.ClassManager.maps.aliasToName.hasOwnProperty(`widget.${xtype}`);
    },

    /**
     * 根据xtype找到组件
     * @param  {String} xtype
     * @param  {Boolean} exact 明确查找xtype。若为false，表示任何继承自xtype的组件都会被找到；否则，只找顶层类型为xtype的组件
     * @return {Ext.Component}
     */
    getCmp(xtype, exact) {
        if (exact === undefined) exact = true;
        const cmps = Ext.ComponentQuery.query(xtype + (exact ? '(true)' : ''));

        return cmps.length >= 1 ? cmps[0] : null;
    },

    /**
     * 寻找上级第一个满足constructor类型的控件
     * @param  {Ext.Component} cmp
     * @param  {Function} constructor 类名
     * @return {Ext.Component}
     */
    getAncestor(cmp, constructor) {
        let p = cmp;
        while (!(p instanceof constructor)) {
            if (p) p = p.getParent();
            else break;
        }

        return p;
    },

    /**
     * 判断字符串是不是 url
     * @param {String} url
     * @return {Boolean}
     */
    isUrl(url) {
        return this.regex.url.test(url);
    },

    /**
     * <转&lg;  >转&gt;  \r\n和\n转&nbsp;&nbsp;
     * @param {String} s html
     * @return {String} 转换后的文本
     */
    encodeHtml(s, len) {
        return Ext.isEmpty(s) ? '' : Ext.htmlEncode(s.substr(0, len)).replace(/\r?\n/g, '&nbsp;&nbsp;'); // 用于展示在list上面的html
    },

    /**
     * <转&lg;  >转&gt;  \r\n和\n转<br/>
     * @param {String} s html
     * @return {String} 转换后的文本
     */
    htmlEncode(s) {
        return Ext.isEmpty(s) ? '' : Ext.util.Format.nl2br(Ext.htmlEncode(s)); // 用于展示在component上面的html
    },

    /**
     * 带标签的html，转换文纯文本(去掉标签)
     * @param {String} html 带标签的html
     * @return {String} 去掉标签后的文本
     */
    htmlToText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const result = div.textContent;

        return result;
    },

    /**
     * 计算哈希值
     *
     * @param {String} s
     * @return {Number}
     */
    hashCode(s) {
        if (!s) return null;
        let hash = 0,
            i, chr, len;
        if (!s.length) return hash;
        for (i = 0, len = s.length; i < len; i++) {
            chr = s.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }

        return hash;
    },

    /**
     * 去除url中?后面的内容
     *
     * @param {String} url
     * @return {String}
     */
    stripQueryStr(url) {
        if (!Ext.isEmpty(url)) {
            var idx = url.lastIndexOf('?');
            if (idx >= 0) {
                return url.substring(0, idx);
            }
        }

        return url;
    },

    /**
     * 去除 开头的问号
     * 比如 ?a=b&c=d 变成 a=b&c=d
     * @param {String} query 如 ?a=b&c=d
     */
    stripQuestionMark(query) {
        if (!Ext.isEmpty(query)) {
            if (query[0] == '?') {
                return query.substr(1);
            }
        }

        return query;
    },

    /**
     * 把列表形式的数据（数组）组织成 树形数据
     * @param {Object[]} data
     * @param {String} idProp
     * @param {String} pIdProp
     * @param {Number} defaultExpandLevel 如果是父节点，是否默认展开? -1所有父节点都展开 0不展开 1只展开第1级节点 2展开到2级节点
     * @return {Object[]} 一级节点的数组集合
     */
    treeify(data, idProp, pIdProp, defaultExpandLevel) {
        if (!data || !data.length) return [];
        if (defaultExpandLevel === undefined) defaultExpandLevel = 0;

        const me = this,
            level1rst = [];
        let item;
        for (item of data) {
            const curId = item[idProp],
                curPId = item[pIdProp],
                nodes = me.findNodesBy(data, x => x[idProp] != curId && x[idProp] == curPId); // 找父节点

            if (!nodes.length) { // 没有父节点，说明是第一级节点
                item.expanded = defaultExpandLevel != 0;
                level1rst.push(item);
            }
        }
        for (item of level1rst) {
            me.doTreeify(item, 1, data, idProp, pIdProp, defaultExpandLevel);
        }

        return level1rst;
    },
    doTreeify(cur, curLevel, data, idProp, pIdProp, defaultExpandLevel) {
        const me = this,
            nodes = me.findNodesBy(data, x => x[idProp] != cur[idProp] && x[pIdProp] == cur[idProp]);

        if (nodes.length) {
            cur.children = nodes;
            cur.expanded = defaultExpandLevel == -1 || defaultExpandLevel >= curLevel;
        }
        cur.leaf = !nodes.length;

        let innerItem;
        for (innerItem of nodes) {
            me.doTreeify(innerItem, curLevel + 1, data, idProp, pIdProp, defaultExpandLevel);
        }
    },
    findNodesBy(data, fn) {
        const result = [];
        let item;
        for (item of data) {
            if (fn(item)) {
                result.push(item);
            }
        }

        return result;
    },

    /**
     * 验证表单, 并返回错误列表
     * @param {Boolean} fields
     * @param {Boolean} skipLazy
     * @return {Object[]} 错误列表
     */
    validateFields(fields, skipLazy) {
        const errors = [];

        let i, length, field, error;

        for (i = 0, length = fields.length; i < length; i++) {
            field = fields[i];
            if (!field.validate(skipLazy)) {
                error = field.getError();
                if (error) {
                    errors.push({
                        errors: error,
                        name: field.getLabel() || field.desc || field.getPlaceholder() || field.getName()
                    });
                }
            }
        }

        return errors;
    },

    /**
     * 清空input type="file"
     * @param {HTMLElement} fileInput
     */
    clearFileInput(fileInput) {
        var form = document.createElement('form');
        document.body.appendChild(form);
        // 记住file input的位置
        var next = fileInput.nextSibling,
            prev = fileInput.previousSibling,
            parent = fileInput.parentNode;
        form.appendChild(fileInput);
        form.reset();
        if (next) next.parentNode.insertBefore(fileInput, next);
        else if (prev) {
            var p = prev.parentNode;
            if (p.lastChild === prev) {
                p.appendChild(fileInput);
            } else {
                p.insertBefore(fileInput, prev.nextSibling);
            }
        } else if (parent) parent.appendChild(fileInput);
        document.body.removeChild(form);
    },

    /**
     * 生成一个uuid，99.99%不重复
     * @return {String} uuid
     */
    uuid: (function () {
        var counter = 0;

        return function (prefix) {
            var guid = new Date().getTime().toString(32),
                i;

            for (i = 0; i < 5; i++) {
                guid += Math.floor(Math.random() * 65535).toString(32);
            }

            return (prefix || '') + guid + (counter++).toString(32);
        };
    }())
});