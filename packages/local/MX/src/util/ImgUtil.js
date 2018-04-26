/**
 * 通用 图片帮助类
 * @author jiangwei
 */
Ext.define('MX.util.ImgUtil', {
    singleton: true,
    alternateClassName: 'ImgUtil',

    // 1×1像素透明图片base64
    onePxImg: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',

    /**
     * 是否是图片后缀
     * @param {String} ext 后缀，不带.
     * @return {Boolean}
     */
    isImgExtension(ext) {
        return FileUtil.isImgExtension(ext);
    },

    /**
     * 从input type="file"读取image DataURL
     *
     * @param {any} imgFile file对象
     * @param {Number} maxHeight 最大高度
     * @param {Function} callback 回调
     * @param {Object} scope 作用域this
     * @returns
     */
    getImageDataURL: function (imgFile, maxHeight, callback, scope) {
        if (!imgFile.type.match(/image.+/)) {
            Utils.toastShort('只能选择图片文件');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            if (maxHeight > 0) { //缩放
                var image = new Image();
                image.onload = function () {
                    var canvas = document.createElement('canvas');
                    if (image.height > maxHeight) {
                        image.width *= maxHeight / image.height;
                        image.height = maxHeight;
                    }
                    var ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    canvas.width = image.width;
                    canvas.height = image.height;
                    ctx.drawImage(image, 0, 0, image.width, image.height);
                    callback.call(scope, canvas.toDataURL('image/jpeg', 0.7)); //0.3 图片质量
                };
                image.src = e.target.result;
            } else {
                callback.call(scope, e.target.result);
            }
        };
        reader.readAsDataURL(imgFile);
    }

});