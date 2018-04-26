/**
 * 通用 文件 帮助类
 * @author jiangwei
 */
Ext.define('MX.util.FileUtil', {
    alternateClassName: 'FileUtil',
    requires: [
        'MX.util.Utils'
    ],
    singleton: true,

    imageFilter: {
        title: '图片文件',
        extensions: 'jpg,jpeg,gif,png,bmp,webp'
    },
    videoFilter: {
        title: '适配文件',
        extensions: 'mp4,mpg,mpeg,avi,mov,ogv,webm'
    },
    archiveFilter: {
        title: '压缩文件',
        extensions: 'rar,zip,7z'
    },
    docFilter: {
        title: '文档',
        extensions: 'doc,docx,ppt,pptx,xls,xlsx,txt,rtf,pdf'
    },
    otherFilter: {
        title: '其它文件',
        extensions: 'xsd,cer,pi,chm,xml,sql'
    },

    /**
     * 是否是图片后缀
     * @param {String} ext 后缀, 不带.
     * @return {Boolean}
     */
    isImgExtension(ext) {
        if (!ext) return false;

        return this.imageFilter.extensions.indexOf(ext.toLowerCase()) >= 0;
    },

    /**
     * 是否是文档后缀
     * @param {String} ext 后缀, 不带.
     * @return {Boolean}
     */
    isDocExtension(ext) {
        if (!ext) return false;

        return 'doc,docx,ppt,pptx,xls,xlsx,pdf'.indexOf(ext.toLowerCase()) >= 0;
    },

    /**
     * 是否是压缩文件后缀
     * @param {String} ext 后缀, 不带.
     * @return {Boolean}
     */
    isArchiveExtension(ext) {
        if (!ext) return false;

        return this.archiveFilter.extensions.indexOf(ext.toLowerCase()) >= 0;
    },

    /**
     * 判断路径是否为完整 file uri
     * @param {String} path
     */
    isFileUri(path) {
        if (Ext.isEmpty(path)) return false;

        return path.substr(0, 7).toLowerCase() == 'file://';
    },

    /**
     * 分割文件路径为 [文件夹路径, 文件名]
     * @param {String} path 文件路径或者文件名或者文件url
     * @return {String[]}
     */
    splitPath(path) {
        var dirName = '',
            fileName = '',
            idx = path.lastIndexOf('/');
        if (idx == -1) {
            fileName = path;
        } else {
            dirName = path.substr(0, idx);
            fileName = path.substr(idx + 1);
        }
        idx = fileName.indexOf('?'); // modified.jpg?1408426399534
        if (idx >= 0) {
            fileName = fileName.substr(0, idx);
        }

        return [dirName, this.stripIllegalChars(fileName)];
    },

    /**
     * 从文件路径提取文件名
     * @param {String} path 文件路径或者文件名或者文件url
     * @return {String}
     */
    getFileName(path) {
        if (!path) return '';

        return this.splitPath(path)[1];
    },

    /**
     * 获取文件名，不包括后缀
     * @param {String} fullName 文件名
     * @return {String}
     */
    getFileNameWoExt(fullName) {
        if (!fullName) return '';
        const arr = this.splitPath(fullName),
            idx = arr[1].lastIndexOf('.');
        if (idx < 0) return arr[1];

        return arr[1].substr(0, idx);
    },

    /**
     * 获取后缀，不包括.
     * @param {String} fullName 文件名
     * @param {Boolean} lowerCase 是否返回小写
     * @return {String} 后缀，不包括.
     */
    getExtension(fullName, lowerCase) {
        if (!fullName) return '';
        const arr = this.splitPath(fullName),
            idx = arr[1].lastIndexOf('.');
        if (idx < 0) return '';

        const ext = arr[1].substr(idx + 1);

        return lowerCase ? ext.toLowerCase() : ext;
    },

    /**
     * 去除文件名中不合法的字符
     * @param {String} s
     */
    stripIllegalChars(s) {
        if (Ext.isEmpty(s)) return s;

        return s.replace(/[\\\\/:*?"<>|]/g, '_');
    },

    /**
     * 获取后缀对应的图标
     * @param {String} ext 文件后缀,不包括.
     * @return {String}
     */
    getMIMEIcon(ext) {
        const me = this;
        ext = (ext || '').toLowerCase();
        if (['rtf', 'doc', 'docx'].indexOf(ext) >= 0) return 'x-fa fa-file-word-o';
        if (['xls', 'xlsx'].indexOf(ext) >= 0) return 'x-fa fa-file-excel-o';
        if (['ppt', 'pptx'].indexOf(ext) >= 0) return 'x-fa fa-file-powerpoint-o';
        if (['wav', 'mp3', 'wma', 'acc', 'ogg'].indexOf(ext) >= 0) return 'x-fa fa-file-sound-o';
        if (['avi', 'mp4', 'avi', 'mkv', 'mov', 'flv'].indexOf(ext) >= 0) return 'x-fa fa-file-movie-o';
        if (me.isImgExtension(ext)) return 'x-fa fa-file-photo-o';
        if (me.isArchiveExtension(ext)) return 'x-fa fa-file-zip-o';
        if (ext == 'pdf') return 'x-fa fa-file-pdf-o';
        if (ext == 'txt') return 'x-fa fa-file-text-o';

        return 'x-fa fa-file-o';
    }
});