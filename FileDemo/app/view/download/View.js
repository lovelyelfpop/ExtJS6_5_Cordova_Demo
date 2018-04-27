Ext.define('FileDemo.view.download.View', {
    extend: 'Ext.Container',
    requires: [
        'FileDemo.view.download.ViewController'
    ],
    xtype: 'download_view',
    controller: 'download_view',

    layout: 'vbox',

    padding: 10,

    scrollable: true,

    items: [{
        xtype: 'navbar',
        backBtn: false,
        title: '下载'
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaultType: 'button',
        items: [{
            text: '下载图片',
            url: 'http://h.hiphotos.baidu.com/image/pic/item/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg',
            handler: 'onTapDown'
        }, {
            text: '下载文档',
            url: 'http://oqdxjvpc7.bkt.clouddn.com/SQL.doc',
            handler: 'onTapDown'
        }, {
            text: '下载视频',
            url: 'http://oqdxjvpc7.bkt.clouddn.com/ios1.mp4',
            handler: 'onTapDown'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaultType: 'button',
        items: [{
            text: '打开图片',
            handler: 'onTapOpen',
            name: '21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg'
        }, {
            text: '打开文档',
            handler: 'onTapOpen',
            name: 'SQL.doc'
        }, {
            text: '打开视频',
            handler: 'onTapOpen',
            name: 'ios1.mp4'
        }]
    }, {
        xtype: 'textareafield',
        reference: 'txtUrl',
        value: 'http://oqdxjvpc7.bkt.clouddn.com/Wikitude%20Augmented%20Reality%20Demo%202.mp4',
        label: '地址'
    }, {
        xtype: 'button',
        text: '开始下载',
        handler: 'onTapDownload'
    }, {
        xtype: 'component',
        reference: 'txtConsole'
    }]
});