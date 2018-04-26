/**
 * 文件 或 目录 Entry
 */
Ext.define('FileDemo.model.Entry', {
    extend: 'Ext.data.Model',
    config: {
        fields: [
            'name',
            { name: 'isFile', type: 'boolean' },
            { name: 'isDirectory', type: 'boolean' },
            { name: 'entry', type: 'auto' },
            { name: 'parentEntry', type: 'auto' },

            { name: 'isParent', type: 'boolean', defaultValue: false }
        ]
    }
});