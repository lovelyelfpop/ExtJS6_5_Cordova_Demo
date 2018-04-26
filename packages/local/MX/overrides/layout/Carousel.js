/**
 * fix: destroy carousel -> 触发停止动画 -> 触发 orderItems -> 但是 items 已经销毁 -> 报错
 */
Ext.define(null, {
    override: 'Ext.layout.Carousel',

    privates: {
        orderItems: function(items) {
            var container = this.getContainer();
            if(container && !container.isDestroyed && !container.isDestroying) {
                this.callParent(arguments);
            }
        }
    }
});