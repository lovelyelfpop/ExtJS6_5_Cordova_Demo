/**
 * This class is the main view for the application. It is specified in app.js as the
 * "mainView" property. That setting causes an instance of this class to be created and
 * added to the Viewport container.
 */
Ext.define('FileDemo.view.main.Main', {
    extend: 'Ext.tab.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.MessageBox',
        'Ext.layout.Fit'
    ],

    controller: 'main',
    viewModel: 'main',

    defaults: {
        tab: {
            iconAlign: 'top'
        }
    },

    tabBarPosition: 'bottom',

    items: [{
        xtype: 'images_view',
        title: '图片',
        iconCls: 'x-fa fa-image'
    }, {
        xtype: 'upload_view',
        title: '上传',
        iconCls: 'x-fa fa-upload'
    }, {
        xtype: 'download_view',
        title: '下载',
        iconCls: 'x-fa fa-download'
    }, {
        xtype: 'file_explorer',
        title: '文件浏览',
        iconCls: 'x-fa fa-folder'
    }/* , {
        xtype: 'list',
        title: '列表',
        store: {
            data: [{
                value: '0',
                text: '王五'
            }, {
                value: '1',
                text: '钱六'
            }, {
                value: '2',
                text: '张三'
            }, {
                value: '3',
                text: '李四'
            }, {
                value: '4',
                text: '小明'
            }]
        },
        plugins: {
            type: 'listoptions',
            filter: function (list, record) {
                return ['1', '4'].indexOf(record.get('value')) >= 0; // 1 4 才能左划出菜单
            },
            itemFilter: function (list, action, record) {
                if (action == 'edit') {
                    return ['1'].indexOf(record.get('value')) >= 0; // 1 才能编辑
                }
                if (action == 'delete') {
                    return ['4'].indexOf(record.get('value')) >= 0; // 4 才能删除
                }
            },
            items: [{
                action: 'edit',
                text: '编辑',
                color: 'bg-soft-blue'
            }, {
                action: 'delete',
                text: '删除',
                color: 'bg-soft-red'
            }]
        }
    }*/]
});