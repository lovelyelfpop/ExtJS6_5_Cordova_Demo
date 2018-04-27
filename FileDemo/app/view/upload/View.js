// 上传
Ext.define('FileDemo.view.upload.View', {
    extend: 'Ext.Container',
    requires: [
        'MX.ImgUp', // 图片预览 + 上传
        'FileDemo.view.upload.ViewController'
    ],
    xtype: 'upload_view',
    controller: 'upload_view',

    layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },

    scrollable: true,

    items: [{
        xtype: 'navbar',
        backBtn: false,
        title: '上传'
    }, {
        xtype: 'mx_imgup',
        reference: 'img',
        uploadConfig: {
            url: 'https://www.script-tutorials.com/demos/199/upload.php', // 上传地址
            fileKey: 'image_file' // 后台接受文件的 key
        },
        saveDir: 'images/', // 预览过的图片，缓存到 cordova.file.dataDirectory 下的 images 目录
        width: 200,
        height: 200,
        targetWidth: 800, // 选图或拍照大小
        targetHeight: 800
    }, {
        xtype: 'button',
        text: '开始上传',
        handler: 'onTapUpload'
    }]
});