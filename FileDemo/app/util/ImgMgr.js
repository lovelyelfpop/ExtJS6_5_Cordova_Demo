/**
 * 图片管理类
 * @author jiangwei
 */
Ext.define('FileDemo.util.ImgMgr', {
    singleton: true,
    requires: [
        'MX.ImgViewer'
    ],
    alternateClassName: 'ImgMgr',

    prefix: 'node-', // 节点 id 前缀

    getDom(id) {
        return document.getElementById(id);
    },

    /**
     * 节点是否在 document.body 中
     * @param {HTMLElement} node
     */
    isInBody(node) {
        if (!node) return false;

        if (node.baseURI !== undefined) {
            return !Ext.isEmpty(node.baseURI);
        }

        return Ext.getBody().isAncestor(node);
    },

    // 自动检测
    loadAutomatic(node) {
        if (Ext.isEmpty(node)) return;

        if (Ext.isString(node)) {
            node = this.getDom(node);
        }
        if (node) {
            if (node.hasAttribute('data-thumb') || node.hasAttribute('data-img')) {
                this.loadPic(node);
            }
            /*
            else if(node.hasAttribute('data-src')){ // 其它图片
                this.loadRemote(node);
            }*/
        }
    },

    _setNodeSrc(node, src, errTip) {
        if (Ext.isString(node) && !Ext.isEmpty(node)) {
            node = this.getDom(node);
        }
        if (!node) return;

        if (errTip === undefined) errTip = true;

        var me = this;
        var imgLoaded = function (e) {
            var n = e.target;
            n.className += ' loaded';
            n.style.removeProperty('background-color');
            n.removeAttribute('width');
            n.removeAttribute('height');
            if (n.hasAttribute('_width')) {
                n.setAttribute('width', n.getAttribute('_width'));
                n.removeAttribute('_width');
            }
            if (n.hasAttribute('_height')) {
                n.setAttribute('height', n.getAttribute('_height'));
                n.removeAttribute('_height');
            }
            n.removeEventListener('load', imgLoaded, false);
            me._removeNodeTip(n);
        };
        var imgLoadErr = function (e) {
            var n = e.target;
            n.className += ' err';
            n.removeEventListener('load', imgLoaded, false);
            n.removeEventListener('error', imgLoadErr, false);

            n.src = ImgUtil.onePxImg;

            if (errTip) {
                // "加载失败"提示
                me._setNodeTipText(n, n.getAttribute('data-errtip') || '加载失败');
            }
        };
        node.addEventListener('load', imgLoaded, false);
        node.addEventListener('error', imgLoadErr, false);

        node.src = src;
    },

    _setNodeTipText(n, text) {
        if (!n || !n.parentNode) return;
        var tip = n.parentNode.querySelector('.img-tip');
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'img-tip';
            n.parentNode.insertBefore(tip, null);
        }
        tip.innerHTML = text;
    },
    _removeNodeTip(n) {
        if (!n || !n.parentNode) return;
        var tip = n.parentNode.querySelector('.img-tip');
        if (tip) {
            n.parentNode.removeChild(tip);
        }
    },

    /**
     * 如果只有一个图片guid，那就在此处拼接完整 url
     */
    getFullPicUrl(url) {
        /* if(!Ext.isEmpty(url) && !/^http/i .test(url)) {
            url = Utils.joinPath(Config.origin, url);
        }*/
        return url;
    },

    /**
     * 加载图片
     */
    loadPic(node) {
        var me = this;
        if (!node || !me.isInBody(node)) return;

        var isThumb = node.hasAttribute('data-showthumb'), // 本 node 是否显示缩略图
            showProgress = node.hasAttribute('data-showprogress'), // 显示下载进度
            thumbUrl = node.getAttribute('data-thumb'), // 缩略图 url
            imgUrl = node.getAttribute('data-img'), // 大图 url, 点击缩略图后显示大图
            url = me.getFullPicUrl(isThumb ? thumbUrl : imgUrl),
            saveDir = isThumb ? 'thumbs/' : 'images/',
            picName = FileUtil.getFileName(url); // 要保存的文件名

        node.removeAttribute('onload');
        me._setNodeTipText(node, '加载中');

        if (Ext.browser.is.Cordova || window.cefMain) {
            var nodeId = Ext.id(node, me.prefix);

            FileMgr.downFileForSrc(url, 1, saveDir + picName, {
                downloading(percent) {
                    if (showProgress) {
                        me._setNodeTipText(node, `${percent}%`);
                    }
                }
            }).then(path => {
                ImgMgr._setNodeSrc(nodeId, path);
            }).catch(err => {
                console.error('ImgMgr', 'loadPic failed', err);
                ImgMgr._setNodeSrc(nodeId, '!error');
            });
        } else {
            ImgMgr._setNodeSrc(node, url);
        }
    },


    /**
     * 点击查看大图 事件
     */
    addViewerListener (container) {
        (container.innerElement || container.element).on({
            delegate: 'img',
            tap: 'showViewerOnTapImg',
            scope: this
        });
    },
    showViewerOnTapImg (e) {
        this.showViewerOfDom(e.target);
    },
    showViewerOfDom (node) {
        if (node.hasAttribute('data-img')) {
            var src = this.getFullPicUrl(node.getAttribute('data-img')),
                isThumb = node.hasAttribute('data-showthumb'),
                loaded = node.className.indexOf('loaded') >= 0,
                previewSrc = isThumb && loaded ? node.src : null,
                name = FileUtil.getFileName(src);

            Ext.Viewport.add({
                xtype: 'imgviewer',
                imgName: name,
                saveDir: 'images/',
                previewSrc: previewSrc,
                originNodeId: isThumb ? null : Ext.id(node, this.prefix),
                src: src
            });
        }
    }
});