/**
 * 单个图片预览
 */
Ext.define('MX.Img', {
    extend: 'Ext.Component',
    xtype: 'mx_img',

    baseCls: `${Ext.baseCSSPrefix}img`,

    config: {
        value: null, // 取值/赋值 用这个 getValue()/setValue()

        cls: 'mx-img x-layout-box x-pack-center x-align-center',
        src: null,

        blankImg: '<@MX>img_blank.jpg' // 如果是应用程序resources里的资源，写法如'<>img_blank.jpg'
    },
    saveDir: null, // 保存下载的图片到哪个目录(cordova 缓存图片)

    getTemplate() {
        return [{
            reference: 'imageElement',
            tag: 'img',
            cls: `${Ext.baseCSSPrefix}img-image`
        }, {
            reference: 'progress',
            cls: 'progress'
        }, {
            reference: 'desc',
            cls: 'desc x-layout-box x-pack-center x-align-center'
        }];
    },
    applyBlankImg(src) {
        return src ? Ext.resolveResource(src) : ImgUtil.onePxImg;
    },
    updateSrc(newSrc) {
        var me = this,
            dom = me.imageElement.dom;
        if (dom) {
            dom.setAttribute('src', Ext.isString(newSrc) ? newSrc : '');
        }
    },

    updateValue(src, oldSrc) {
        var me = this;
        if (Ext.isEmpty(src)) {
            me.setSrc(me.getBlankImg());
            me.desc.setHtml('');
            me.removeCls('has-img');
        } else {
            me.desc.setHtml('加载中');
            if ((Ext.browser.is.Cordova || window.cefMain) && me.canDownload(src)) {
                var picName = FileUtil.getFileName(src);
                FileMgr.downFileForSrc(src, null, Utils.joinPath(me.saveDir, picName))
                    .then(path => {
                        if (me.getValue() === src) { // 因为是异步过程，me.getValue()可能有变化
                            me.setSrc(path);
                            me.onLoad();
                        }
                    })
                    .catch(error => {
                        if (me.getValue() === src) {
                            Utils.err('ImgUp', 'downFile')(error);
                            me.onError();
                        }
                    });
            } else if (src instanceof File) { // input 选择的文件
                var height = me.element.getHeight();
                ImgUtil.getImageDataURL(src, height, r => { // 获取缩略图
                    if (me.getValue() === src) {
                        me.attachListeners();
                        me.setSrc(r);
                    }
                });
            } else {
                me.attachListeners();
                me.setSrc(src);
            }
            me.addCls('has-img');
        }
        me.fireEvent('change', me, src, oldSrc);
    },

    constructor(config) {
        const me = this;

        me.onLoad = function (e) {
            me.desc.setHtml('');
            me.detachListeners();
            me.fireEvent('load', me, e);
        };
        me.onError = function (e) {
            me.desc.setHtml('图片加载失败');
            me.detachListeners();
            me.setSrc(ImgUtil.onePxImg);
            me.fireEvent('error', me, e);
        };

        me.callParent(arguments);
    },

    initialize() {
        var me = this;

        me.callParent(arguments);

        if (!me.getValue() && !me.getSrc()) {
            me.setSrc(me.getBlankImg());
        }
    },

    attachListeners() {
        var dom = this.imageElement.dom;
        if (dom) {
            dom.addEventListener('load', this.onLoad, false);
            dom.addEventListener('error', this.onError, false);
        }
    },
    detachListeners() {
        var dom = this.imageElement.dom;
        if (dom) {
            dom.removeEventListener('load', this.onLoad, false);
            dom.removeEventListener('error', this.onError, false);
        }
    },

    canDownload(v) {
        if (!Ext.isEmpty(v) && Ext.isString(v) && /^https?:\/\/.*/i.test(v)) {
            return true;
        }

        return false;
    }
});