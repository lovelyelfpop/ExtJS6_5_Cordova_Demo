/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */
Ext.define('FileDemo.Application', {
    extend: 'Ext.app.Application',
    requires: [
        'Ext.util.CSS',
        'MX.util.Utils',
        'MX.util.FileMgr',
        'MX.plugin.ListOptions',
        'FileDemo.Navbar'
    ],

    name: 'FileDemo',

    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },

    launch() {
        // android 模拟ios WKwebview 的情况
        // android 没有 cordova.file.tempDirectory，此处用 cordova.file.cacheDirectory 模拟
        /* if (Ext.browser.is.Cordova && Ext.os.is.Android) {
            cordova.file.tempDirectory = cordova.file.cacheDirectory;
        }*/

        const me = this;
        if (!Ext.browser.is.Cordova) { // 非cordova环境
            me.onDeviceReady();
        } else {
            document.addEventListener('deviceready', Ext.bind(me.onDeviceReady, me), false);
        }
    },

    onDeviceReady() {
        var me = this;
        me.pluginReady(); // 由Cordova插件获取一些信息
        me.getVersion(version => {
            me.versionCode = version.code; // 当前App版本号
            me.versionName = version.name; // 当前App版本号

            if (Ext.isFunction(me.onAppReady)) {
                me.onAppReady();
            }

            Ext.fly('appLoadingIndicator').destroy();
            if (navigator.splashscreen) navigator.splashscreen.hide(); // 隐藏app启动界面
        });
    },

    pluginReady: function () {
        var me = this,
            isCordova = Ext.browser.is.Cordova;
        if (!isCordova) {
            if (Ext.isEmpty(Utils.getLsItem('deviceuuid'))) {
                Utils.setLsItem('deviceuuid', Utils.uuid('web_')); // 浏览器访问网页版的话，用这个模拟 deviceId
            }

            return;
        }

        // 透明状态栏，顶部下移20px(ios 7+)/25px(android 4.4+)，为状态栏留下空间
        me.statusBarHeight = 0;
        if (isCordova &&
            (Ext.os.is.iOS && Ext.os.version.major >= 7 || // ios7+(除了iPhone X)
                Ext.os.is.Android && Ext.os.version.major * 10 + Ext.os.version.minor >= 44)) { // android 4.4+
            var statusH = 20;
            if (Ext.os.is.Android) statusH = 25;
            me.statusBarHeight = statusH;
            Ext.util.CSS.createStyleSheet([
                '.topinset { ',
                `padding-top: ${statusH}px; `,
                'padding-top: constant(safe-area-inset-top); ',
                'padding-top: env(safe-area-inset-top); ',
                '}'
            ].join(''), 'InsetStyle');

            // 安卓4.4 ~ 5.1长按弹出action bar(cut/copy/paste)时，取消顶部下移的20/25px
            // 安卓6.0已经不是action bar了，类似iOS的popup menu
            if (Ext.os.is.Android && Ext.os.version.major * 10 + Ext.os.version.minor < 60) {
                window.addEventListener('native.actionmodeshow', function (r) {
                    Ext.Viewport.element.addCls('actionmode');
                }, false);
                window.addEventListener('native.actionmodehide', function (r) {
                    Ext.Viewport.element.removeCls('actionmode');
                }, false);
            }
        }
    },

    /**
     * 获取当前app的版本号
     * @param {Function} success 成功回调
     */
    getVersion(success) {
        if (window.BuildInfo) { // cordova-plugin-buildInfo
            success({
                code: BuildInfo.versionCode,
                name: BuildInfo.version
            });
        } else {
            Ext.Ajax.request({
                url: Ext.getResourcePath('appversion.txt', null),
                success(resp) {
                    var txt = resp.responseText.trim(),
                        ps = txt.split('\n'),
                        result = {};
                    for (var i = 0; i < ps.length; i++) {
                        var p = ps[i].trim().split('=');
                        if (p[0].trim() == 'version.name') {
                            result.name = p[1].trim();
                        } else if (p[0].trim() == 'version.code') {
                            result.code = p[1].trim();
                        }
                    }
                    success(result);
                },
                failure() {}
            });
        }
    },

    /**
     * 获取客户端一些信息，这些信息在每次请求后台时(Utils.ajax)，追加到请求参数中
     * @return {Object}
     */
    getClientInfo() {
        var me = this,
            isCdv = !!Ext.browser.is.Cordova,
            //user = User.getUser(),
            isDebug = Utils.isDebug();
        var result = {
            '_appid': 'FileDemo',
            '_os': Ext.os.name, //系统类型
            '_version': me.versionCode || 0, //app版本
            '_cordova': isCdv, //是否cordova
            '_deviceid': isCdv ? device.uuid : Utils.getLsItem('deviceuuid') //设备编号
        };
        /*if (user) {
            if (!Ext.isEmpty(user.UserID)) {
                result['_userid'] = user.UserID; //用户编号
            }
            var token = Utils.getLsItem('token');
            if (!Ext.isEmpty(token)) {
                result['_token'] = token; //用户令牌
            }
        }*/
        if (isDebug) result['_isdebug'] = true;

        return result;
    },

    onAppUpdate() {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});