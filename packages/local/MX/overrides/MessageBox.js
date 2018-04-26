/**
 * bug fix: Ext.Msg.prompt/show 如果 prompt 参数有 xtype
 * 旧的控件 被 destroy 2次 导致 会报错
 * Ext.Msg.prompt('提示', '请输入', function(){}, null, false, '默认', { xtype: 'textfield' })
 */
Ext.define(null, {
    override: 'Ext.MessageBox',

    updatePrompt: function (newPrompt, oldPrompt) {
        if (newPrompt) {
            this.add(newPrompt);
        }
        if (oldPrompt && !oldPrompt.isDestroyed && !oldPrompt.isDestroying) {
            this.remove(oldPrompt);
        }
    }
});