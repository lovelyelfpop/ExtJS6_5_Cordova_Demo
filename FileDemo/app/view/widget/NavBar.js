Ext.define('FileDemo.Navbar', {
    extend: 'Ext.TitleBar',
    xtype: 'navbar',
    config: {
        /**
         * 顶栏是否显示"返回"按钮
         */
        backBtn: true
    },

    backBtnVisibleMode: true,

    constructor(config) {
        config = config || {};
        if (Ext.isEmpty(config.docked)) {
            config.docked = 'top';
        }

        if (!config.items) {
            config.items = [];
        }
        this.callParent(arguments);
    },
    applyBackBtn(config) {
        var me = this;
        if (config === true) {
            config = {};
        }
        if (config) {
            Ext.applyIf(config, {
                itemId: 'back',
                align: 'left',
                ui: 'back',
                text: '返回',
                $initParent: me,
                handler(btn) {
                    if (me.parent && me.parent.onBack) {
                        me.parent.onBack();
                    } else {
                        history.back();
                    }

                    return false;
                }
            });
        }

        return Ext.factory(config, Ext.Button, me.getBackBtn());
    },
    updateBackBtn(b) {
        var me = this;
        if (b) {
            me.insert(0, b);
        }
    },
    initialize() {
        this.callParent(arguments);
        this.addCls(['navbar', 'topinset']);
    }
});