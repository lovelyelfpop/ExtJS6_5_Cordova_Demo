/**
 * 单个图片预览+上传
 */
Ext.define('MX.ImgUp', {
    extend: 'MX.Img',
    xtype: 'mx_imgup',

    uploadConfig: null, // 上传的相关参数 { url, fileKey, params }
    fromCamera: true, // 是否支持拍照
    fromLibrary: true, // 是否支持从图库选图
    canClear: true, // 是否可以清除图像
    targetWidth: 200, // 选图图片大小
    targetHeight: 200,

    initialize() {
        var me = this;

        me.callParent(arguments);

        // cordova
        if (!Ext.browser.is.Cordova) {
            me._imgInput = Ext.Element.create({
                tag: 'input',
                type: 'file',
                accept: '.jpg,.jpeg,.png,.bmp,.gif',
                style: 'display:none'
            });
            me.element.append(me._imgInput);
            me.referenceList.push('_imgInput');
            me._imgInput.on({
                change: 'inputFileChosen',
                scope: me
            });

            me.element.dom.addEventListener('click', function (e) {
                if (!me.uploading) me.getPicture(0);
            }, false);
        } else { // 浏览器 弹出 菜单 选图还是拍照
            me.element.onBefore('tap', function () {
                return !me.uploading;
            });
            me.element.on({
                tap: 'onTapShowMenu',
                scope: me
            });
        }
    },

    getMenu() {
        const me = this;
        let menu = me.menu;
        if (!menu) {
            var btns = [];
            if (me.fromCamera) {
                btns.push({
                    itemId: 'Camera',
                    text: '拍照',
                    handler: 'onTapCamera',
                    scope: me
                });
            }
            if (me.fromLibrary) {
                btns.push({
                    itemId: 'PhotoLibrary',
                    text: '从手机相册选择',
                    handler: 'onTapChoosePhoto',
                    scope: me
                });
            }
            if (me.canClear) {
                btns.push({
                    itemId: 'Clear',
                    text: '清除',
                    ui: 'decline',
                    handler: 'onTapClear',
                    scope: me
                });
            }
            menu = me.menu = Ext.create('Ext.ActionSheet', {
                items: btns
            });

            /**
             * 点击 actionsheet 里面的按钮后，actionsheet 隐藏
             */
            menu.on({
                delegate: ' > button',
                tap() {
                    menu.hide();
                }
            });

            Ext.Viewport.add(menu);
            me.referenceList.push('menu'); // 随本控件一起销毁
        }

        return menu;
    },

    onTapShowMenu(e) {
        this.getMenu().show();
    },

    /**
     * 拍照
     * @param {Ext.Button} btn
     */
    onTapCamera(btn) {
        this.getPicture(1);
    },
    /**
     * 选图
     * @param {Ext.Button} btn
     */
    onTapChoosePhoto(btn) {
        this.getPicture(0);
    },
    /**
     * 清除图片
     * @param {Ext.Button} btn
     */
    onTapClear(btn) {
        const me = this;
        me.setValue(null);
        me.fireEvent('clear', me);
    },


    /**
     * [getPicture 选择图片]
     * @param  {[Number]} sourceType 0 PHOTOLIBRARY, 1 CAMERA
     */
    getPicture(sourceType) { // 选择图片
        if (!Ext.browser.is.Cordova) {
            this._imgInput.dom.click();
        } else {
            var isCamera = sourceType == 1;
            navigator.camera.getPicture(Ext.bind(this.getPicSucceed, this), Utils.err('Camera', 'getPicture'), {
                quality: isCamera ? 50 : 100,
                targetWidth: this.targetWidth,
                targetHeight: this.targetHeight,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType[isCamera ? 'CAMERA' : 'PHOTOLIBRARY'],
                correctOrientation: true,
                saveToPhotoAlbum: isCamera
            });
        }
    },

    /**
     * cordova 选择图片回调
     *
     * @param {String} uri
     */
    getPicSucceed(uri) {
        if (Ext.isEmpty(uri)) return;

        var me = this;
        me.setValue(uri);
    },
    /**
     * html5 file input 选择图片回调
     *
     * @param {event} e
     * @param {HTMLElement} el
     */
    inputFileChosen(e, el) {
        var me = this,
            files = el.files;
        if (files.length) {
            me.setValue(files[0]);

            Utils.clearFileInput(el);
        }
    },

    canUpload(v) {
        if (v === undefined) {
            v = this.getValue();
        }
        if (Ext.isEmpty(v)) return false;
        if (Ext.browser.is.Cordova) {
            if (!Ext.isString(v) || /^https?:\/\/.*/i.test(v)) {
                return false;
            }
        } else {
            if (!(v instanceof File)) {
                return false;
            }
        }

        return true;
    },

    upload(success, failure, uploading, scope) {
        var me = this,
            v = me.getValue(),
            upCfg = me.uploadConfig;
        if (!upCfg || !me.canUpload(v)) return;

        if (Ext.isString(v)) {
            v = Utils.stripQueryStr(v); // 去除路径问号?后面的字符串
        }

        var url = Utils.getFullUrl(upCfg.url),
            fileKey = upCfg.fileKey || 'file',
            app = Utils.getApp(),
            clientInfo = app.getClientInfo ? app.getClientInfo() : null, // 带上客户端信息
            params = Ext.isFunction(upCfg.params) ? upCfg.params() : upCfg.params,
            ps = Ext.applyIf(clientInfo, params);

        var uploadSuccess = function (response) {
            // <debug>
            console.log('uploadSuccess', response);
            // </debug>
            me.progress.setStyle('height', 0);
            me.desc.setHtml('上传成功');
            delete me.uploading;

            var parsed = me.parseResponse(response),
                succeed = parsed.success,
                result = parsed.result;

            if (succeed) {
                // <debug>
                console.log('uploadSuccess success callback', result);
                // </debug>
                me.fireEvent('uploaded', me, result);
                if (Ext.isFunction(success)) {
                    success.call(scope || me, me, result);
                }
            } else {
                // <debug>
                console.log('uploadFailed failure callback', result);
                // </debug>
                me.fireEvent('uploadfailed', me, result);
                if (Ext.isFunction(failure)) {
                    failure.call(scope || me, me, result);
                }
            }
        };
        var uploadFailed = function (response) {
            // <debug>
            console.log('uploadFailed', response);
            // </debug>
            me.progress.setStyle('height', 0);
            me.desc.setHtml('上传失败');
            delete me.uploading;

            var respText = response.response || response.responseText,
                obj;
            if (!Ext.isEmpty(respText)) {
                try {
                    obj = Ext.decode(respText);
                } catch (e) {
                    obj = respText;
                }
            } else {
                obj = response;
            }
            // <debug>
            console.log('uploadFailed failure callback', obj);
            // </debug>
            me.fireEvent('uploadfailed', me, obj);
            if (Ext.isFunction(failure)) {
                failure.call(scope || me, me, obj);
            }
        };
        var uploadProcessing = function (result) {
            if (result.lengthComputable) {
                var percent = (result.loaded / result.total * 100).toFixed(2);
                me.progress.setStyle('height', `${percent}%`);
                me.desc.setHtml(`上传中${percent}%`);
                me.fireEvent('uploading', me, percent);
                if (Ext.isFunction(uploading)) {
                    uploading.call(scope || me, me, percent);
                }
            }
        };

        // cordova 上传
        if (Ext.browser.is.Cordova) {
            var options = new FileUploadOptions();
            options.fileKey = fileKey || 'file';
            options.fileName = FileUtil.getFileName(v);
            options.mimeType = 'multipart/form-data';
            options.params = ps;

            var ft = new FileTransfer();
            ft.onprogress = uploadProcessing;

            // 上传
            ft.upload(v, url, uploadSuccess, uploadFailed, options);
            me.uploading = true;

            return ft;
        }

        // html 上传
        var form = new FormData();
        form.append(fileKey, v);
        for (var i in ps) {
            form.append(i, ps[i]);
        }

        var xhr = new XMLHttpRequest();
        xhr.open('post', url, true);

        xhr.upload.addEventListener('progress', uploadProcessing, false);
        xhr.addEventListener('readystatechange', function () {
            var result = xhr;
            if (result.status != 200) { // error
                // <debug>
                console.log('onreadystatechange', result, result.readyState, result.status, result.response, result.statusText);
                // </debug>
                uploadFailed(result);

            } else if (result.readyState == 4) { // finished
                uploadSuccess(result);
            }
            delete me.uploading;
        });
        xhr.send(form); // 上传
        me.uploading = true;

        return xhr;
    },

    /**
     * 解析 response 得到结果 { success: true/false, result: 结果 }
     */
    parseResponse(response) {
        var respText = response.response || response.responseText,
            isJson = response.getResponseHeader ? /json/i.test(response.getResponseHeader('content-type')) : true,
            obj = null,
            succeed = true; //请求成功

        if (!Ext.isEmpty(respText)) {
            if (Ext.isString(respText) && isJson) {
                try {
                    obj = Ext.decode(respText);
                } catch (e) {
                    obj = respText;
                }
            } else {
                obj = respText;
            }
        }

        if (obj && obj.hasOwnProperty('success')) { //或者 obj有success属性且为true时
            succeed = obj.success;
        }

        return {
            success: succeed,
            result: obj
        };
    }
});