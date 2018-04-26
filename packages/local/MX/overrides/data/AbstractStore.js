/**
 * 全局设置所有 store 随所属控件销毁而销毁
 */
Ext.define(null, { //'Ext.overrides.data.AbstractStore'
    override: 'Ext.data.AbstractStore',

    config: {
        autoDestroy: true
    }
});