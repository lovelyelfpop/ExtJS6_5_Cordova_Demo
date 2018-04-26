/**
 * @author jiangwei
 * date 20170409
 * 封装resolveLocalFileSystemURL
 */
(function () {
    if (window.LocalFileSystem === undefined && window.PERSISTENT !== undefined) {
        window.LocalFileSystem = {
            PERSISTENT: window.PERSISTENT,
            TEMPORARY: window.TEMPORARY
        };
    }
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
})();

/**
 * cordova file 插件 提供了一些常量，直接指向可用的一些路径，详细请看：
 * https://github.com/apache/cordova-plugin-file#where-to-store-files
 *
 * 比如：
 *
 * cordova.file.cacheDirectory
 * 缓存目录(设备存储容量不足时会自动删除这个目录下的文件)
 * ios实际目录是 file:///var/mobile/Applications/<UUID>/Library/Caches/
 * android实际目录是 file:///data/data/<app-id>/cache/
 *
 * cordova.file.tempDirectory
 * 临时目录(设备存储容量不足时会自动删除这个目录下的文件)
 * ios实际目录是 file:///var/mobile/Applications/<UUID>/tmp/
 * android 中没有这个路径
 *
 * cordova.file.dataDirectory
 * 持久化存储，也就是永久存储的目录，系统不会自动删除里面的文件
 * ios实际目录是 file:///var/mobile/Applications/<UUID>/Library/NoCloud/
 * android实际目录是 file:///data/data/<app-id>/files/
 */
Ext.define('MX.util.FileSystemUtil', {
    alternateClassName: 'FSUtil',
    singleton: true,

    /**
     * 错误编码 和 错误描述
     */
    FILEERROR: {
        1: 'NOT_FOUND_ERR',
        2: 'SECURITY_ERR',
        3: 'ABORT_ERR',
        4: 'NOT_READABLE_ERR',
        5: 'ENCODING_ERR',
        6: 'NO_MODIFICATION_ALLOWED_ERR',
        7: 'INVALID_STATE_ERR',
        8: 'SYNTAX_ERR',
        9: 'INVALID_MODIFICATION_ERR',
        10: 'QUOTA_EXCEEDED_ERR',
        11: 'TYPE_MISMATCH_ERR',
        12: 'PATH_EXISTS_ERR'
    },

    privates: {
        /**
         *
         * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
         * @param {String} path 完整 file uri 或者 相对路径
         */
        parse(root, path) {
            let relative = null,
                full = null;

            if (root === null || root === undefined) { // 如果 root 为空，则认为是 1 dataDirectory
                root = 1;
            }

            /**
             * file uri 一般是 encode 过的，如果要转成 目录uri 和 文件名（相对路径） 2部分，应该把文件名 decode
             * 比如，一个文件 uri 是 file:///data/user/0/com.pushsoft.filedemo/files/thumbs/u%3D3990585178%2C1387559702%26fm%3D27%26gp%3D0.jpg
             * 那么，目录 uri 是 file:///data/user/0/com.pushsoft.filedemo/files/thumbs/，
             * 文件名（相对路径）为 u=3990585178,1387559702&fm=27&gp=0.jpg
             *
             * 也就是说 resolveLocalFileSystemURL 的 参数一般都是 encode 过的 url, 不 encode 一般也可以
             * dirEntry.getFile 的参数应该是相对路径，是 decode 过的（或者说是真实的目录和文件名）
             */
            const tempDir = cordova.file.tempDirectory,
                dataDir = cordova.file.dataDirectory;
            if (FileUtil.isFileUri(path)) {
                full = path;
                if (tempDir && path.indexOf(tempDir) == 0) {
                    root = 0;
                    relative = decodeURIComponent(path.substr(tempDir.length));
                } else if (path.indexOf(dataDir) == 0) {
                    root = 1;
                    relative = decodeURIComponent(path.substr(dataDir.length));
                } else {
                    console.error('暂不支持的路径');
                }
            } else {
                relative = path;
                if (root == 0 && tempDir) full = tempDir + path;
                else if (root == 1) full = dataDir + path;
                else {
                    console.error('暂不支持的路径');
                }
            }

            return {
                root,
                relative,
                full
            };
        },

        /**
         * 把一个文件从一处 复制或剪切 到另一处
         *
         * @param {Number} fromRoot 0 tempDirectory / 1 dataDirectory / null
         * @param {String} fromPath 源文件路径(带文件名)，完整 file uri 或 相对路径
         * @param {Number} toRoot 0 tempDirectory / 1 dataDirectory / null
         * @param {String} toPath 目标文件路径(带文件名)，相对路径
         * @param {Number} type 1 File / 2 Directory
         * @param {Boolean} isMove 是否剪切? true剪切，false复制
         * @returns
         */
        copyOrMove(fromRoot, fromPath, toRoot, toPath, type, isMove, success, fail) {
            if (Ext.isEmpty(fromPath) || Ext.isEmpty(toPath)) return;

            var me = this;
            success = Ext.isFunction(success) ? success : Ext.emptyFn;
            var failure = err => {
                // <debug>
                console.error('FSUtil', 'copyOrMove failed', err.code ? me.FILEERROR[err.code] : err);
                // </debug>
                if (Ext.isFunction(fail)) fail(err);
            };

            var toO = FSUtil.parse(toRoot, toPath),
                toRelativePath = toO.relative,

                arr = FileUtil.splitPath(toRelativePath),
                toRelativeDir = arr[0],
                toName = arr[1];

            // 创建目标目录
            DirMgr.create(toRoot, toRelativeDir).then(dir => {

                if (FileUtil.isFileUri(fromPath)) { // 完整 file uri
                    window.resolveLocalFileSystemURL(fromPath, file => {
                        file[isMove ? 'moveTo' : 'copyTo'](dir, toName, f => {
                            success(f.toURL());
                        }, failure);
                    }, failure);
                } else {
                    var fromO = FSUtil.parse(fromRoot, fromPath),
                        fromRelativePath = fromO.relative;

                    FSUtil[`load${fromO.root}`]().then(fs => {
                        var method = '';
                        if (type == 1) {
                            method = 'getFile';
                        } else if (type == 2) {
                            method = 'getDirectory';
                        }
                        if(method) {
                            fs.root[method](fromRelativePath, {
                                create: false
                            }, file => {
                                file[isMove ? 'moveTo' : 'copyTo'](dir, toName, f => {
                                    success(f.toURL());
                                }, failure);
                            }, failure);
                        }
                        else {
                            failure('unknown exception');
                        }
                    }).catch(failure);
                }
            }).catch(failure);
        }
    },

    /**
     * 加载临时存储目录，获取其 filesystem
     * 只有 ios 有 tempDirectory
     * @returns {Ext.Promise}
     */
    load0() {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            if (me.tmpFileSystem) {
                return resolve(me.tmpFileSystem);
            }
            if (!window.requestFileSystem) {
                return reject('不支持 requestFileSystem');
            }

            window.resolveLocalFileSystemURL(
                cordova.file.tempDirectory, // 这里我们用 临时存储目录
                entry => {
                    me.tmpFileSystem = entry.filesystem;
                    resolve(me.tmpFileSystem);
                },
                err => {
                    // <debug>
                    console.error('FileSystem', 'load0 failed', me.FILEERROR[err.code]);
                    // </debug>
                    reject(err);
                }
            );
        });
    },

    /**
     * 加载持久化存储目录，获取其 filesystem
     * @returns {Ext.Promise}
     */
    load1() {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            if (me.fileSystem) {
                return resolve(me.fileSystem);
            }
            if (!window.requestFileSystem) {
                return reject('不支持 requestFileSystem');
            }

            window.resolveLocalFileSystemURL(
                cordova.file.dataDirectory, // 这里我们用 持久化存储目录
                entry => {
                    me.fileSystem = entry.filesystem;
                    resolve(me.fileSystem);
                },
                err => {
                    // <debug>
                    console.error('FileSystem', 'load1 failed', me.FILEERROR[err.code]);
                    // </debug>
                    reject(err);
                }
            );
        });
    }
});