/**
 * 去除 tabPanel 的切换动画
 */
Ext.define(null, { //'MX.overrides.tab.Panel'
    override: 'Ext.tab.Panel',

    config: {
        layout: {
            type: 'card',
            animation: false
        }
    }
});