/*
 * UX.ImageViewer
 *
 * A zoom-able Image Viewer Class for the Sencha Touch 2.0 Framework.
 *
 * Initial work by Perdiga with thanks to Armode for the help, publicated at Sencha Forum:
 * http://www.sencha.com/forum/showthread.php?197903-Pinch-Image-with-carousel-and-working-fine
 * 
 * Based on work by themightychris:
 * http://www.sencha.com/forum/showthread.php?137632-mostly-working-pinch-zoom-image-carousel-help-perfect-it!
 *
 * @updated till 2012-08 Many enhancements and BugFixes by users of the Sencha Forum
 * @updated 2012-08-24   by Dipl.-Ing. (FH) André Fiedler (https://twitter.com/sonnenkiste)
 * Collected Enhancements from the Forum, Code Cleanup and Formating, Demos
 */
Ext.define('MX.ImgViewer', {

    extend: 'Ext.Container',
    alias: 'widget.imgviewer',

    config: {
        imgName: null,
        saveDir: '',
        src: false,
        originNodeId: null,

        doubleTapScale: 1,
        maxScale: 4,
        previewSrc: false,
        resizeOnLoad: true,

        hideOnTap: true,

        //modal: null,
        centered: true,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        stretchX: true,
        stretchY: true,
        cls: 'imgviewer',
        style: 'background-color:#fff',
        scrollable: 'both',
        html: [
            '<div class="radial-progress x-hidden">',
            '<div class="mask full">',
            '<div class="fill"></div>',
            '</div>',
            '<div class="mask half">',
            '<div class="fill"></div>',
            '</div>',
            '</div>',
            '<div class="tip-wrapper flexbox box-align-center box-pack-center">',
            '<div class="tip x-hidden"></div>',
            '</div>',
            '<figure>',
            '<img>',
            '</figure>'
        ].join('')
    },
    destroyOnHide: true,

    applySaveDir(dir) {
        if (Ext.isEmpty(dir)) dir = 'images/';

        return dir;
    },

    initialize() {
        var me = this;

        me.on({
            painted: 'initViewer',
            scope: me,
            delay: 10,
            single: true
        });
        me.element.on({
            singletap: 'tapImg',
            scope: me
        });
        /*me.on({
            hide: 'onMeHide',
            scope: me
        });*/

        me.btnDown = Ext.Element.create({
            cls: 'down',
            style: {
                display: 'none'
            }
        });
        me.referenceList.push('btnDown');
        me.element.appendChild(me.btnDown);
    },
    tapImg(e, target) {
        if (Ext.fly(target).hasCls('down')) {
            //保存图片
            var src = this.imgEl.dom.src;
            if (!Ext.isEmpty(src) && window.plugins && plugins.wizUtils) {
                plugins.wizUtils.saveToAlbum(function () {
                    Utils.toastShort('成功保存到相册');
                }, function (msg) {
                    Utils.toastShort('保存失败: ' + msg);
                }, src);
            }
        } else if (this.getHideOnTap()) {
            this.hide();
        }
    },
    /*onMeHide: function() {
        if(this.getDestroyOnHide()) {
            this.destroy();
        }
    },*/

    initViewer() {
        var me = this,
            scroller = me.getScrollable(),
            element = me.element;

        //disable scroller
        //scroller.setDisabled(true);

        // retrieve DOM els
        me.figEl = element.down('figure');
        me.imgEl = me.figEl.down('img');

        // apply required styles
        me.figEl.setStyle({
            overflow: 'hidden',
            display: 'block',
            margin: 0
        });

        me.imgEl.setStyle({
            '-webkit-user-drag': 'none',
            'visibility': 'hidden'
        });
        me.setOrigin(0, 0);

        // show preview
        if (me.getPreviewSrc()) {
            element.setStyle({
                backgroundImage: 'url(' + me.getPreviewSrc() + ')',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                webkitBackgroundSize: 'contain'
            });
        }

        me.imgEl.on({
            scope: me,
            doubletap: me.onDoubleTap,
            pinchstart: me.onImagePinchStart,
            pinch: me.onImagePinch,
            pinchend: me.onImagePinchEnd
        });

        // load image
        if (me.getSrc()) {
            me.loadImage(me.getSrc());
        }
    },

    loadImage(src) {
        var me = this;
        if (me.imgEl) {
            var down = me.btnDown,
                pb = me.element.down('.radial-progress'),
                tip = me.element.down('.tip'),
                pb1 = pb.down('div.mask.full'),
                pb2 = pb.select('div.fill'),
                imgName = me.getImgName();
            tip.addCls('x-hidden');
            down.hide();

            if (Ext.browser.is.Cordova && Ext.isString(src) && /^https?:\/\/.*/.test(src) && !Ext.isEmpty(imgName)) {
                pb.removeCls('x-hidden');

                //var path = me.getSaveDir() + '/' + imgName;
                FileMgr.downFileForSrc(src, 1, me.getSaveDir() + imgName, {
                    downloading(percent) {
                        var deg = (percent * 1.8).toFixed(2) + 'deg',
                            style = {
                                '-webkit-transform': 'rotate(' + deg + ')',
                                '-ms-transform': 'rotate(' + deg + ')',
                                'transform': 'rotate(' + deg + ')'
                            };
                        pb1.setStyle(style);
                        pb2.setStyle(style);
                    }
                }).then(savePath => {
                    me.getImage(savePath);
                    pb.addCls('x-hidden');
                }).catch(err => {
                    pb.addCls('x-hidden');
                    me.onImageError(err);
                });
            } else {
                me.getImage(src);
            }
        } else {
            me.setSrc(src);
        }
    },

    getImage(src) {
        var cb = function (data) {
            var imgDom = this.imgEl.dom;
            imgDom.src = data;

            imgDom.onload = Ext.bind(this.onImageLoad, this);
            imgDom.onerror = Ext.bind(this.onImageError, this);

            var nId = this.getOriginNodeId();
            ImgMgr.loadAutomatic(nId);
        };
        if (src instanceof File) {
            ImgMgr.getImageDataURL(src, -1, cb, this);
        } else {
            cb.call(this, src);
        }
    },

    /*
    unloadImage: function() {  
        var me = this;
    
        if (me.imgEl) {
            me.imgEl.dom.src = '';
            me.imgEl.setStyle({ visibility: 'hidden' });
        } else {
            me.setSrc('');
            me.imgEl.setStyle({ visibility: 'hidden' });
        }
    },
    */

    onImageLoad() {
        var me = this;
        if (!me.parent) return;
        var parentElement = me.parent.element;

        // get viewport size
        me.viewportWidth = me.viewportWidth || me.getWidth() || parentElement.getWidth();
        me.viewportHeight = me.viewportHeight || me.getHeight() || parentElement.getHeight();

        // grab image size
        me.imgWidth = me.imgEl.dom.width;
        me.imgHeight = me.imgEl.dom.height;

        // calculate and apply initial scale to fit image to screen
        if (me.getResizeOnLoad()) {
            me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgWidth, me.viewportHeight / me.imgHeight);
            me.setMaxScale(me.scale * 4);
        } else {
            me.scale = me.baseScale = 1;
        }

        // calc initial translation
        var tmpTranslateX = (me.viewportWidth - me.baseScale * me.imgWidth) / 2,
            tmpTranslateY = (me.viewportHeight - me.baseScale * me.imgHeight) / 2;

        // set initial translation to center
        me.setTranslation(tmpTranslateX, tmpTranslateY);
        me.translateBaseX = me.translateX;
        me.translateBaseY = me.translateY;

        // apply initial scale and translation
        me.applyTransform();

        // initialize scroller configuration
        me.adjustScroller();

        // show image and remove mask
        me.imgEl.setStyle({
            visibility: 'visible'
        });

        // remove preview
        if (me.getPreviewSrc()) {
            me.element.setStyle({
                backgroundImage: 'none'
            });
        }

        me.fireEvent('imageLoaded', me);

        if (Ext.browser.is.Cordova)
            me.btnDown.show();

        me.getScrollable().refresh();
    },

    onImageError() {
        var tip = this.element.down('.tip');
        tip.removeCls('x-hidden');
        tip.setHtml('出错了');
    },

    onImagePinchStart(ev) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            touches = ev.touches,
            element = me.element,
            scale = me.scale;

        // disable scrolling during pinch
        //scroller.stopAnimation();
        //scroller.setDisabled(true);

        // store beginning scale
        me.startScale = scale;

        // calculate touch midpoint relative to image viewport
        me.originViewportX = (touches[0].pageX + touches[1].pageX) / 2 - element.getX();
        me.originViewportY = (touches[0].pageY + touches[1].pageY) / 2 - element.getY();

        // translate viewport origin to position on scaled image
        me.originScaledImgX = me.originViewportX + scrollPosition.x - me.translateX;
        me.originScaledImgY = me.originViewportY + scrollPosition.y - me.translateY;

        // unscale to find origin on full size image
        me.originFullImgX = me.originScaledImgX / scale;
        me.originFullImgY = me.originScaledImgY / scale;

        // calculate translation needed to counteract new origin and keep image in same position on screen
        me.translateX += (-1 * ((me.imgWidth * (1 - scale)) * (me.originFullImgX / me.imgWidth)));
        me.translateY += (-1 * ((me.imgHeight * (1 - scale)) * (me.originFullImgY / me.imgHeight)));

        // apply new origin
        me.setOrigin(me.originFullImgX, me.originFullImgY);

        // apply translate and scale CSS
        me.applyTransform();
    },

    onImagePinch(ev) {
        var me = this;

        // prevent scaling to smaller than screen size
        me.scale = Ext.Number.constrain(ev.scale * me.startScale, me.baseScale - 2, me.getMaxScale());
        me.applyTransform();
    },

    onImagePinchEnd(ev) {
        var me = this;

        // set new translation
        if (me.scale == me.baseScale) {
            // move to center
            me.setTranslation(me.translateBaseX, me.translateBaseY);
        } else {
            //Resize to init size like ios
            if (me.scale < me.baseScale && me.getResizeOnLoad()) {
                me.resetZoom();
                return;
            }
            // calculate rescaled origin
            me.originReScaledImgX = me.originScaledImgX * (me.scale / me.startScale);
            me.originReScaledImgY = me.originScaledImgY * (me.scale / me.startScale);

            // maintain zoom position
            me.setTranslation(me.originViewportX - me.originReScaledImgX, me.originViewportY - me.originReScaledImgY);
        }
        // reset origin and update transform with new translation
        me.setOrigin(0, 0);
        me.applyTransform();

        // adjust scroll container
        me.adjustScroller();
    },

    /*
    onZoomIn: function() {
        var me = this,
            ev = {
                pageX: 0,
                pageY: 0
            },
            myScale = me.scale;
            
        if (myScale < me.getMaxScale()) {
            myScale = me.scale + 0.05;
        }
        
        if (myScale >= me.getMaxScale()) {
            myScale = me.getMaxScale();
        }

        ev.pageX = me.viewportWidth / 2;
        ev.pageY = me.viewportHeight / 2;
        
        me.zoomImage(ev, myScale);
    },

    onZoomOut: function() {
        var me = this,
            ev = {
                pageX: 0,
                pageY: 0
            },
            myScale = me.scale;
            
        if (myScale > me.baseScale) {
            myScale = me.scale - 0.05;
        }
        
        if (myScale <= me.baseScale) {
            myScale = me.baseScale;
        }

        ev.pageX = me.viewportWidth / 2;
        ev.pageY = me.viewportHeight / 2;
        
        me.zoomImage(ev, myScale);
    },

    zoomImage: function(ev, scale, scope) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            element = me.element;

        // zoom in toward tap position
        var oldScale = me.scale,
            newScale = scale,
            originViewportX = ev ? (ev.pageX - element.getX()) : 0,
            originViewportY = ev ? (ev.pageY - element.getY()) : 0,
            originScaledImgX = originViewportX + scrollPosition.x - me.translateX,
            originScaledImgY = originViewportY + scrollPosition.y - me.translateY,
            originReScaledImgX = originScaledImgX * (newScale / oldScale),
            originReScaledImgY = originScaledImgY * (newScale / oldScale);

        me.scale = newScale;
        setTimeout(function() {
            me.setTranslation(originViewportX - originReScaledImgX, originViewportY - originReScaledImgY);
            // reset origin and update transform with new translation
            //that.setOrigin(0, 0);

            // reset origin and update transform with new translation
            me.applyTransform();

            // adjust scroll container
            me.adjustScroller();

            // force repaint to solve occasional iOS rendering delay
            //Ext.repaint();
        }, 50);
    },
    */

    onDoubleTap(ev, t) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            element = me.element;

        if (!me.getDoubleTapScale()) {
            return false;
        }

        // set scale and translation
        if (me.scale > me.baseScale) {
            // zoom out to base view
            me.scale = me.baseScale;
            me.setTranslation(me.translateBaseX, me.translateBaseY);
            // reset origin and update transform with new translation
            me.applyTransform();

            // adjust scroll container
            me.adjustScroller();

            // force repaint to solve occasional iOS rendering delay
            //Ext.repaint();
        } else {
            // zoom in toward tap position
            var oldScale = me.scale,
                newScale = me.baseScale * 4,

                originViewportX = ev ? (ev.pageX - element.getX()) : 0,
                originViewportY = ev ? (ev.pageY - element.getY()) : 0,

                originScaledImgX = originViewportX + scrollPosition.x - me.translateX,
                originScaledImgY = originViewportY + scrollPosition.y - me.translateY,

                originReScaledImgX = originScaledImgX * (newScale / oldScale),
                originReScaledImgY = originScaledImgY * (newScale / oldScale);

            me.scale = newScale;

            //smoothes the transition
            setTimeout(function () {
                me.setTranslation(originViewportX - originReScaledImgX, originViewportY - originReScaledImgY);
                // reset origin and update transform with new translation
                me.applyTransform();

                // adjust scroll container
                me.adjustScroller();

                // force repaint to solve occasional iOS rendering delay
                //Ext.repaint();
            }, 50);
        }
    },

    setOrigin(x, y) {
        var dom = this.imgEl.dom,
            s = x + 'px ' + y + 'px';
        dom.style.webkitTransformOrigin = s;
        dom.style.transformOrigin = s;
    },

    setTranslation(translateX, translateY) {
        var me = this;

        me.translateX = translateX;
        me.translateY = translateY;

        // transfer negative translations to scroll offset
        me.scrollX = me.scrollY = 0;

        if (me.translateX < 0) {
            me.scrollX = me.translateX;
            me.translateX = 0;
        }
        if (me.translateY < 0) {
            me.scrollY = me.translateY;
            me.translateY = 0;
        }
    },

    resetZoom() {
        var me = this;

        if (me.isDestroying || me.isDestroyed) {
            return;
        }

        //Resize to init size like ios
        me.scale = me.baseScale;

        me.setTranslation(me.translateBaseX, me.translateBaseY);

        // reset origin and update transform with new translation
        me.setOrigin(0, 0);
        me.applyTransform();

        // adjust scroll container
        me.adjustScroller();

    },

    /*
    resize: function() {
        var me = this;
        
        // get viewport size
        me.viewportWidth = me.parent.element.getWidth() || me.viewportWidth || me.getWidth();
        me.viewportHeight = me.parent.element.getHeight() || me.viewportHeight || me.getHeight();

        // grab image size
        me.imgWidth = me.imgEl.dom.width;
        me.imgHeight = me.imgEl.dom.height;

        // calculate and apply initial scale to fit image to screen
        if (me.getResizeOnLoad()) {
            me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgWidth, me.viewportHeight / me.imgHeight);
            me.setMaxScale(me.scale * 4);
        } else {
            me.scale = me.baseScale = 1;
        }

        // set initial translation to center
        me.translateX = me.translateBaseX = (me.viewportWidth - me.baseScale * me.imgWidth) / 2;
        me.translateY = me.translateBaseY = (me.viewportHeight - me.baseScale * me.imgHeight) / 2;

        // apply initial scale and translation
        me.applyTransform();

        // initialize scroller configuration
        me.adjustScroller();
    },
    */

    applyTransform() {
        var me = this,
            dom = me.imgEl.dom,
            fixedX = Ext.Number.toFixed(me.translateX, 5),
            fixedY = Ext.Number.toFixed(me.translateY, 5),
            fixedScale = Ext.Number.toFixed(me.scale, 8),
            s;
        if (Ext.os.is.Android) {
            s = 'matrix(' + fixedScale + ',0,0,' + fixedScale + ',' + fixedX + ',' + fixedY + ')';
        } else {
            s = 'translate3d(' + fixedX + 'px, ' + fixedY + 'px, 0)' + ' scale3d(' + fixedScale + ',' + fixedScale + ',1)';
        }
        dom.style.webkitTransform = s;
        dom.style.transform = s;
    },

    adjustScroller() {
        var me = this,
            scroller = me.getScrollable(),
            scale = me.scale;

        // disable scrolling if zoomed out completely, else enable it
        //scroller.setDisabled(scale == me.baseScale);

        // size container to final image size
        var boundWidth = Math.max(me.imgWidth * scale + 2 * me.translateX, me.viewportWidth),
            boundHeight = Math.max(me.imgHeight * scale + 2 * me.translateY, me.viewportHeight);

        me.figEl.setStyle({
            width: boundWidth + 'px',
            height: boundHeight + 'px'
        });

        // update scroller to new content size
        scroller.refresh();

        // apply scroll
        var x = 0,
            y = 0;
        if (me.scrollX) {
            x = me.scrollX;
        }
        if (me.scrollY) {
            y = me.scrollY;
        }

        scroller.scrollTo(x * -1, y * -1);
    }
});