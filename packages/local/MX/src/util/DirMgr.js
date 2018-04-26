/**
 * @author 神秘博士
 * date 20170409
 * 目录管理类
 *
 * 以下说到的相对路径，都指的是 相对于 cordova.file.dataDirectory 目录
 */
Ext.define('MX.util.DirMgr', {
    requires: [
        'MX.util.FileSystemUtil'
    ],
    alternateClassName: 'DirMgr',
    singleton: true,

    privates: {
        thumbDir: 'thumbs/',
        avatarDir: 'avatars/',
        imgDir: 'images/',
        fileDir: 'files/',

        /**
         * 多次调用create创建同一个临时存储目录，会进入此队列，这样只需要调用一次create_r
         */
        queues0: {}, // tempDirectory
        /**
         * 多次调用create创建同一个持久化存储目录，会进入此队列，这样只需要调用一次create_r
         */
        queues1: {}, // dataDirectory

        /**
         * 级联创建目录，比如 xxx/yyy/zzz/，就需要级联三次分别创建 xxx,yyy,zzz
         *
         * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
         * @param {String} relativeDir 要创建的目录，相对路径
         * @param {Function} success 成功回调
         * @param {Function} fail 失败回调
         * @param {int} position 位置，比如0就从xxx开始创建，1就是从yyy开始创建
         */
        create_r(root, relativeDir, success, fail, position) {
            position = typeof position == 'undefined' ? 0 : position;

            var me = this,
                pathSplit = relativeDir.split('/'),
                newPosition = position + 1,
                subPath = pathSplit.slice(0, newPosition).join('/');

            var innerCallback = (args, scope) => {
                return function () {
                    scope.create_r.apply(scope, args);
                };
            };

            if (newPosition == pathSplit.length || /\/$/.test(subPath)) {
                me.create_one(root, subPath, success, fail);
            } else {
                me.create_one(root, subPath, innerCallback([root, relativeDir, success, fail, newPosition], me), fail);
            }
        },
        /**
         * 单独创建一层子目录
         *
         * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
         * @param {String} relativeDir 要创建的目录，相对路径
         * @param {Function} callback 成功回调
         * @param {Function} fail 失败回调
         */
        create_one(root, relativeDir, success, fail) {
            FSUtil[`load${root}`]().then(fs => {
                // 单独使用 exclusive: true 这个设置，没什么作用.
                // 但是和 create: true 一起使用, 如果目标路径已存在，那么 getFile 和 getDirectory 就会执行失败.
                // 此处 我们不想它执行失败，所以设为 false
                fs.root.getDirectory(relativeDir, {
                        create: true, // 如果不存在，就创建目录
                        exclusive: false
                    },
                    dirEntry => {
                        if (success) success(dirEntry);
                    },
                    err => {
                        // <debug>
                        console.error('DirMgr', 'create directory failed', FSUtil.FILEERROR[err.code]);
                        // </debug>
                        if (fail) fail(err);
                    }
                );
            }).catch(fail);
        }
    },

    /**
     * 创建目录
     * 多次创建同一个目录，多个任务进队列，实际只会创建一次。
     *
     * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
     * @param {String} dir 要创建的目录，相对路径或者完整 file uri(支持多层级)
     * @returns {Ext.Promise}
     */
    create(root, dir) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            var o = FSUtil.parse(root, dir), // 有可能 root，没有传入值，有可能 dir 是完整 file uri。此处解析成 相对路径 和 正确的 root
                relativeDir = o.relative,
                queueName = `queues${o.root}`,
                queue = me[queueName][relativeDir];

            // 任务队列不存在
            if (!queue) {
                queue = me[queueName][relativeDir] = []; // 创建队列

                // 只有第一个任务加入队列的时候，才会执行逻辑。其它任务进来都直接进队列
                var success = entry => {
                    var q = me[queueName][relativeDir];
                    if (q) {
                        while (q.length) {
                            var obj = q.shift();
                            if (obj.resolve) obj.resolve(entry);
                        }
                        delete me[queueName][relativeDir];
                    }
                };
                var fail = err => {
                    var q = me[queueName][relativeDir];
                    if (q) {
                        while (q.length) {
                            var obj = q.shift();
                            if (obj.reject) obj.reject(err);
                        }
                        delete me[queueName][relativeDir];
                    }
                };

                // 检查是否已经存在这个多级目录
                FSUtil[`load${o.root}`]().then(fs => {
                    fs.root.getDirectory(relativeDir, {
                            create: false
                        },
                        success, // 已经存在这个多级目录，直接使用
                        err => {
                            if (err.code == 1) { // 不存在，才级联创建目录
                                me.create_r(o.root, relativeDir, success, fail);
                            } else { // 其他异常
                                fail(err);
                            }
                        });
                }).catch(fail);
            }

            // 任务加入队列
            queue.push({
                resolve,
                reject
            });
        });
    },
    /**
     * 复制一个文件
     *
     * @param {Number} fromRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} fromPath 源目录路径，完整 file uri 或 相对路径
     * @param {Number} toRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} toPath 目标目录路径，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    moveTo(fromRoot, fromPath, toRoot, toPath) {
        return new Ext.Promise((resolve, reject) => {
            FSUtil.copyOrMove(fromRoot, fromPath, toRoot, toPath, 2, true, resolve, reject);
        });
    },
    /**
     * 剪切一个文件
     *
     * @param {Number} fromRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} fromPath 源目录路径，完整 file uri 或 相对路径
     * @param {Number} toRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} toPath 目标目录路径，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    copyTo(fromRoot, fromPath, toRoot, toPath) {
        return new Ext.Promise((resolve, reject) => {
            FSUtil.copyOrMove(fromRoot, fromPath, toRoot, toPath, 2, false, resolve, reject);
        });
    },
    /**
     * 删除一个目录(级联删除)
     *
     * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
     * @param {String} dir 要删除的目录，相对路径或者完整 file uri
     * @returns {Ext.Promise}
     */
    remove(root, dir) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            var o = FSUtil.parse(root, dir), // 有可能 root，没有传入值，有可能 dir 是完整 file uri。此处解析成 相对路径 和 正确的 root
                relativeDir = o.relative;

            FSUtil[`load${o.root}`]().then(fs => {
                fs.root.getDirectory(relativeDir, {
                        create: false // 如果不存在，不创建目录
                    },
                    dirEntry => { // 找到目录，执行级联删除
                        dirEntry.removeRecursively(resolve, reject);
                    },
                    err => {
                        if (err.code != 1) {
                            reject(err);
                        }
                    }
                );
            }).catch(reject);
        });
    }

});