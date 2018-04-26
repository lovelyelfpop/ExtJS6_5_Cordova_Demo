/**
 * bug fix: 解决路由处理函数内的异常被吞，无法抛出
 * 改进：增加 afterroute 全局事件
 */
Ext.define(null, { // 'MX.override.route.Route'
    override: 'Ext.route.Route',

    execute: function (token, argConfig) {
        var me = this,
            promise = this.callParent([token, argConfig]);

        return promise
            .then(function (p) {
                Ext.fireEvent('afterroute', me, token);

                return p;
            })
            .catch(Ext.bind(this.onRouteReject, this));
    },

    onRouteReject: function (error) {
        Ext.fireEvent('routereject', this);

        if (error instanceof Error) {
            console.error(error);
        }
    },

    /**
     * 如果controller 被销毁，routes 处理函数也被取消注册了
     * 但是 route url 还在 Ext.route.Router 对象里面(key)，导致不会触发 unmatchedroute 事件
     * 这里判断如果 处理函数 为空，则删除 Ext.route.Router 对象里面的 url key
     * @param {Object} scope
     * @param {Object} config
     */
    removeHandler(scope, config) {
        const me = this;
        me.callParent(arguments);

        const h = me.getHandlers();
        if (h && !h.length) {
            const name = me.getName() || me.getUrl();
            delete Ext.route.Router.routes[name];
        }

        return me;
    }
});