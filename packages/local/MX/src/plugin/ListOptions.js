Ext.define('MX.plugin.ListOptions', {
    alias: 'plugin.listoptions',
    config: {

        list: null,

        /**
         * An array of objects to be applied to the 'optionsTpl' to create the
         * menu
         */
        items: [],

        /**
         * Selector to use to get individual List Options within the created Ext.Element
         * This is used when attaching event handlers to the menu options
         */
        optionSelector: 'option-button',

        /**
         * XTemplate to use to create the List Options view
         */
        optionsTpl: [
            '<tpl for=".">',
            '<div class="option-button {color}" data-action="{action}">{text}</div>',
            '</tpl>'
        ].join(''),

        /**
         * Set to a function that takes in 2 arguments - your initial 'options' config option and the current
         * item's Model instance
         * The function must return either the original 'options' variable or a revised one
         */
        itemFilter: null, // 决定某个按钮是否显示的验证方法
        filter: null // 决定是否可滑动显示整个menu的验证方法
    },

    constructor(config) {
        this.initConfig(config);
    },

    applyOptionsTpl(tpl) {
        if (Ext.isString(tpl)) {
            return Ext.create('Ext.XTemplate', tpl);
        }

        return tpl;
    },

    init(list) {
        var me = this;
        me.setList(list);

        list.addCls('x-list-options-plugin');

        var scroller = list.getScrollable();
        if (scroller) {
            scroller.setX(false);
        }

        list.el.on({
            scope: me,
            dragstart: 'onDragStart'
        });

        var wrapperCfg = {
            cls: 'item-options-wrapper',
            children: [{
                cls: 'item-options',
                html: me.getOptionsTpl().apply(me.getItems())
            }]
        };
        me.optionsWrapper1 = Ext.Element.create(wrapperCfg);
        me.optionsWrapper1.options = me.optionsWrapper1.child('.item-options');

        me.optionsWrapper2 = Ext.Element.create(wrapperCfg);
        me.optionsWrapper2.options = me.optionsWrapper2.child('.item-options');

        var swipeListener = {
            swipe: 'onOptionsSwipe',
            scope: me
        };
        me.optionsWrapper1.on(swipeListener);
        me.optionsWrapper2.on(swipeListener);

        var delegateListener = {
            delegate: `.${this.getOptionSelector()}`,
            touchstart: 'onOptionTouchStart',
            touchend: 'onOptionTouchEnd',
            touchcancel: 'onOptionTouchEnd',
            tap: 'onOptionTap',
            scope: me
        };
        me.optionsWrapper1.options.on(delegateListener);
        me.optionsWrapper2.options.on(delegateListener);
    },
    destroy() {
        this.optionsWrapper1.destroy();
        this.optionsWrapper2.destroy();
        this.callParent(arguments);
    },
    onOptionsSwipe(e, target) {
        if (e.direction == 'right') {
            var row = Ext.get(e.getTarget())._row;
            if (row) {
                this.moveRow(row, 0);
            }
        }
    },

    getAvailOptionsWrapper(row) {
        if (row._isOptionsOpened && row._optionsWrapper) {
            return row._optionsWrapper;
        }
        if (this.optionsWrapper1._animating) {
            return this.optionsWrapper2;
        }

        return this.optionsWrapper1;

    },

    onDragStart(e) {
        var me = this,
            list = me.cmp,
            record = list.mapToRecord(e);
        if (e.absDeltaX < e.absDeltaY) {
            return;
        }

        if (record) {
            var row = list.mapToItem(record),
                filter = me.getFilter();
            // 是否可以划出菜单
            if (Ext.isFunction(filter) && !filter.call(me, list, record)) {
                return false;
            }

            if (e.deltaX > 0 && !row._isOptionsOpened || e.deltaX < 0 && row._isOptionsOpened) {
                return false;
            }

            if (me.animateRow) me.moveRow(me.animateRow, 0);

            row._optionsWrapper = me.getAvailOptionsWrapper(row);

            // 决定按钮的隐藏和显示
            var itemFilter = me.getItemFilter();
            if (Ext.isFunction(itemFilter)) {
                row._optionsWrapper.select(`.${me.getOptionSelector()}`).each(function (btnEl) {
                    if (itemFilter.call(this, list, btnEl.getAttribute('data-action'), record)) {
                        btnEl.show();
                    } else {
                        btnEl.hide();
                    }
                }, me);
            }

            row._optionsWrapper._row = row;

            list.el.on({
                scope: me,
                drag: 'onDrag',
                dragend: 'onDragEnd'
            });

            me.dragRow = row;
            me.dragRecord = row.getRecord();

            var rowHeight = Math.round(row.element.getHeight()),
                positionY = 0; // optionsWrapper位置Y

            if (list.getInfinite()) {
                row._startTranslateY = row.$position;

                positionY = row._startTranslateY;
            } else {
                row._startTranslateY = 0;

                positionY = -rowHeight;
            }

            row._startOffsetX = row._offsetX || 0;

            row._optionsWrapper.insertAfter(row.element);
            row._optionsWrapper.optionsWidth = row._optionsWrapper.options.getWidth();

            var offsetX = row._startOffsetX + e.deltaX;
            offsetX = Math.min(Math.max(-row._optionsWrapper.optionsWidth, offsetX), 0);
            row.translate(offsetX, row._startTranslateY);
            row._optionsWrapper.options.translate(offsetX, 0);
            row._optionsWrapper.options.setHeight(rowHeight);
            row._optionsWrapper.translate(0, positionY);

            row._offsetX = offsetX;

            e.stopPropagation();

            // row.addCls(Ext.baseCSSPrefix + 'list-item-dragging');
        }
    },

    onDrag(e) {
        var row = this.dragRow,
            record = row.getRecord();
        if (!record) return;

        if (Math.abs(row._offsetX) <= row._optionsWrapper.optionsWidth && row._offsetX <= 0) {
            var offsetX = row._startOffsetX + e.deltaX;
            offsetX = Math.min(Math.max(-row._optionsWrapper.optionsWidth, offsetX), 0);
            row.translate(offsetX, row._startTranslateY);
            row._optionsWrapper.options.translate(offsetX, 0);

            row._offsetX = offsetX;
        }
    },
    onAnimationFrame(t, x, y) {
        var row = Ext.getCmp(t.getElement().getId());
        row._optionsWrapper.options.translate(x, 0);
        row._offsetX = x;
    },
    onAnimationEnd(t, x, y) {
        var row = Ext.getCmp(t.getElement().getId());
        if (this.animateRow === row) {
            delete this.animateRow;
        }

        // row.removeCls(Ext.baseCSSPrefix + 'list-item-dragging');
        row._offsetX = x;

        if (row._animateClosing) {
            var wrapperDom = row._optionsWrapper.dom;
            if (wrapperDom.parentNode) {
                wrapperDom.parentNode.removeChild(wrapperDom);
            }
            delete row._optionsWrapper._row;
        }

        delete row._animateClosing;
        delete row._animateOpening;
        delete row._optionsWrapper._animating;

        row.getTranslatable().un({
            animationframe: 'onAnimationFrame',
            animationend: 'onAnimationEnd',
            scope: this
        });

        if (x != 0) { // opened
            this.addViewportListener(row);
        }
    },

    onDragEnd(e) {
        var me = this,
            row = me.dragRow,
            list = me.getList();

        list.el.un({
            drag: 'onDrag',
            dragend: 'onDragEnd',
            scope: me
        });

        delete me.dragRow;
        me.animateRow = row;

        var velocity = Math.abs(e.flick.velocity.x),
            direction = e.deltaX > 0 ? 'right' : 'left',
            offsetX = Math.abs(row._offsetX),
            threshold = 0,
            width = 0;

        if (offsetX > 0) {
            width = row._optionsWrapper.optionsWidth;
            threshold = parseInt(width * .3, 10);

            switch (direction) {
                case 'right':
                    offsetX = velocity > .3 || width - offsetX > threshold ? 0 : -width;
                    break;

                case 'left':
                    offsetX = velocity > .3 || offsetX > threshold ? -width : 0;
                    break;

                default:
                    break;
            }
        }

        me.moveRow(row, offsetX);
    },
    moveRow(row, offsetX, duration) {

        if (offsetX == 0) {
            row._animateClosing = true;
        } else {
            row._animateOpening = true;
        }
        row._optionsWrapper._animating = true;

        row._isOptionsOpened = offsetX != 0;
        row.element[offsetX == 0 ? 'removeCls' : 'addCls']('opened');

        var translatable = row.getTranslatable();
        translatable.on({
            animationframe: 'onAnimationFrame',
            animationend: 'onAnimationEnd',
            scope: this
        });

        translatable.translateAnimated(offsetX, row._startTranslateY, {
            duration: duration || 150,
            easing: 'ease-out'
        });
    },

    addViewportListener(row) {
        var me = this;
        if (!me._viewportTouchStart) {
            me._viewportTouchStart = function (ev) {
                me.viewportTouchStart(ev, row);
            };
        }

        Ext.Viewport.element.dom.addEventListener('touchstart', me._viewportTouchStart, true);
        /* Ext.Viewport.element.on({
            touchstart: 'viewportTouchStart',
            tap: 'viewportTap',
            scope: this,
            args: [row]
        });*/
    },

    removeViewportListener(row) {
        var me = this;
        if (me._viewportTouchStart) {
            Ext.Viewport.element.dom.removeEventListener('touchstart', me._viewportTouchStart, true);
            delete me._viewportTouchStart;
        }
        /* Ext.Viewport.element.un({
            touchstart: 'viewportTouchStart',
            //tap: 'viewportTap',
            scope: this,
            args: [row]
        });*/
    },

    // viewportTouchStart: function(row, e, target) {
    viewportTouchStart(e, row) {
        var me = this,
            target = e.target || e.srcElement;
        if (row.isDestroyed) {
            me.removeViewportListener(row);

            return;
        }

        if (!Ext.fly(target).hasCls(me.getOptionSelector())) {

            me.moveRow(row, 0);

            /* Ext.Viewport.element.un({
                touchstart: 'viewportTouchStart',
                scope: me,
                args: [row]
            });*/

            me.removeViewportListener(row);
            e.stopPropagation();
        }
    },

    /* viewportTap: function(row, e, target) {
        if(row.isDestroyed){
            this.removeViewportListener(row);
            return;
        }
        //!row._animateClosing && !(!row._isOptionsOpened && Utils.isDomInsideCmp(target, row))
        if (e.getTarget('.x-list-item') && !Ext.fly(e.target).hasCls(this.getOptionSelector())){

            this.moveRow(row, 0);

            this.removeViewportListener(row);

            e.stopPropagation();
        }
        else{
            this.removeViewportListener(row);
        }
    },*/

    /**
     * Handler for 'touchstart' event to add the Pressed class
     * @param {Object} e
     * @param {Object} el
     */
    onOptionTouchStart(e, el) {
        this.pressedTimeout = Ext.defer(this.addPressedClass, 100, this, [e]);
    },

    /**
     * Handler for the 'tap' event of the individual List Option menu items
     * @param {Object} e
     */
    onOptionTouchEnd(e, el) {
        if (this.pressedTimeout) {
            clearTimeout(this.pressedTimeout);
            delete this.pressedTimeout;
        }
        this.removePressedClass(e);
    },

    onOptionTap(e, el) {
        var me = this,
            t = e.getTarget(),
            action = t.getAttribute('data-action'),
            wrapper = Ext.fly(t).up('.item-options-wrapper');
        this.moveRow(wrapper._row, 0);
        me.removeViewportListener(wrapper._row);

        this.getList().fireEvent('listoptiontap', this.getList(), wrapper._row.getRecord(), action);
    },

    /**
     * Adds the Pressed class on the Menu Option
     * @param {Object} e
     */
    addPressedClass(e) {
        Ext.fly(e.getTarget()).addCls('pressed');
    },

    /**
     * Removes the Pressed class on the Menu Option
     * @param {Object} e
     */
    removePressedClass(e) {
        Ext.fly(e.getTarget()).removeCls('pressed');
    }
});