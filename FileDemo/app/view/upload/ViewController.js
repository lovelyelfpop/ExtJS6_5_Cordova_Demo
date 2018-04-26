Ext.define('FileDemo.view.upload.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.upload_view',

    onTapUpload(btn) {
        const me = this,
            img = me.lookup('img'),
            progress = me.lookup('progress');

        if(!img.canUpload()) {
            return Utils.toastShort('请选择图片');
        }

        btn.setDisabled(true);
        img.upload(function(img, result) {
            Utils.toastShort('上传成功');
            btn.setDisabled(false);
        }, function(img, error) {
            Utils.toastShort('上传失败');
            btn.setDisabled(false);
        }, function(img, percent) {
            console.log(`上传中${percent}%`);
        });
    }

});