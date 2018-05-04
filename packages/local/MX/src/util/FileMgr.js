/**
 * @author 神秘博士
 * date 20170409
 * 文件管理类
 *
 * 以下说到的
 * 相对路径，都指的是 相对于 cordova.file.dataDirectory 目录
 * 完整 file uri，都指的是 file:// 开头的路径
 */
Ext.define('MX.util.FileMgr', {
    requires: [
        'MX.util.FileSystemUtil',
        'MX.util.DirMgr',
        'MX.util.FileUtil'
    ],
    alternateClassName: 'FileMgr',
    singleton: true,

    /**
     * 下载一个文件，
     * 该函数利用了已经下载的文件缓存(比如用于下载并缓存图片，节省流量和时间)：
     * 如果 saveDir 目录下已经有了 saveName 这个文件，那么就不下载而直接使用此文件
     *
     * @param {String} url 文件下载地址，比如 http://......
     * @param {Number} saveRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} savePath 保存到的路径(含文件名，目录存不存在都可以，此方法会自动创建目录)，完整 file uri或者相对路径
     * @param {Object} options 可选项，结构如下
     * {
     *  downloading: function(percent){}, // 下载中 回调(参数是进度)
     *  force: true/false // 是否强制下载? 如果想忽略文件缓存，强制重新下载一遍，可以设置为 true
     * }
     * @returns {Ext.Promise}
     */
    downFile(url, saveRoot, savePath, options) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            var force = !!(options && options.force), // 强制重新下载，不管文件是否存在
                o = FSUtil.parse(saveRoot, savePath), // 有可能 root，没有传入值，有可能 dir 是完整 file uri。此处解析成 相对路径 和 正确的 root
                relativePath = o.relative, // 下载到的相对路径
                arr = FileUtil.splitPath(relativePath),
                saveDir = arr[0], // 要下载到的目录的相对路径
                saveName = arr[1], // 要保存的文件名

                queueName = `queues${o.root}`,
                key = relativePath,
                queue = me[queueName][key];

            if (!queue) {
                queue = me[queueName][key] = [];

                var success = entry => {
                    // <debug>
                    console.log('file download succeed', entry);
                    // </debug>
                    var q = me[queueName][key];
                    if (q) {
                        while (q.length) {
                            var obj = q.shift();
                            if (obj.resolve) obj.resolve(entry.toURL());
                        }
                        delete me[queueName][key];
                    }
                };
                var fail = error => {
                    // <debug>
                    console.log('file download failed', error);
                    // </debug>
                    var q = me[queueName][key];
                    if (q) {
                        while (q.length) {
                            var obj = q.shift();
                            if (obj.reject) obj.reject(error);
                        }
                        delete me[queueName][key];
                    }
                };

                var doDownload = function (path) {
                    var ft = new FileTransfer();
                    ft.onprogress = result => {
                        if (result.lengthComputable) {
                            var percent = (result.loaded / result.total * 100).toFixed(2); // 下载百分比

                            var q = me[queueName][key];
                            if (q && q.length) {
                                q.forEach(x => {
                                    if (x.downloading) {
                                        x.downloading(percent);
                                    }
                                });
                            }
                        }
                    };
                    ft.download(url, path, success, fail);
                };

                DirMgr.create(o.root, saveDir).then(dirEntry => {
                    var saveFullURI = dirEntry.toURL() + encodeURIComponent(saveName);

                    if (force) { // 强制重新下载，不管文件是否存在
                        doDownload(saveFullURI);
                    } else {
                        // 先检查文件是否已经存在
                        dirEntry.getFile(saveName, {
                            create: false
                        }, fileEntry => {
                            // <debug>
                            console.log('file found', fileEntry);
                            // </debug>
                            success(fileEntry, true); // 文件已存在，直接返回此文件路径
                        }, err => {
                            if (err.code == 1) {
                                // 否则就到网络下载文件!
                                doDownload(saveFullURI);
                            } else {
                                fail(err);
                            }
                        });
                    }
                }).catch(fail);
            }

            queue.push({
                resolve,
                reject,
                downloading: options && Ext.isFunction(options.downloading) ? options.downloading : null
            });
        });
    },

    /**
     * 和上面方法差不多，只不过用于下载图片在 ios 的 <img src> 中显示
     */
    downFileForSrc(url, saveRoot, savePath, options) {
        const me = this,
            args = arguments,
            o = FSUtil.parse(saveRoot, savePath);

        // iOS + Cordova + WKWebview + 图片必须在 tmp 目录，才能显示在 <img src> 中
        // window.indexedDB 存在 则认为是 WKWebview
        if (Ext.browser.is.Cordova && Ext.os.is.iOS && window.indexedDB && o.root !== 0) {
            return new Ext.Promise((resolve, reject) => {
                var queueName = `srcQueues${o.root}`,
                    key = o.relative,
                    queue = me[queueName][key];

                if (!queue) {
                    queue = me[queueName][key] = [];

                    var success = fileURL => {
                        // <debug>
                        console.log('file download succeed', fileURL);
                        // </debug>
                        var q = me[queueName][key];
                        if (q) {
                            while (q.length) {
                                var obj = q.shift();
                                if (obj.resolve) obj.resolve(fileURL);
                            }
                            delete me[queueName][key];
                        }
                    };
                    var fail = error => {
                        // <debug>
                        console.log('file download failed', error);
                        // </debug>
                        var q = me[queueName][key];
                        if (q) {
                            while (q.length) {
                                var obj = q.shift();
                                if (obj.reject) obj.reject(error);
                            }
                            delete me[queueName][key];
                        }
                    };

                    var force = !!(options && options.force);
                    // 下载后拷贝到 tmp
                    var downAndCopy = () => {
                        me.downFile(url, o.root, o.relative, { // 先下载
                                force: force,
                                downloading(percent) {
                                    var q = me[queueName][key];
                                    if (q && q.length) {
                                        q.forEach(x => {
                                            if (x.downloading) {
                                                x.downloading(percent);
                                            }
                                        });
                                    }
                                }
                            }).then(filePath => {
                                return me.copyTo(o.root, filePath, 0, o.relative) // 拷贝一份到 tmp 目录
                                    .then(tmpFileURL => {
                                        success(tmpFileURL);
                                    });
                            })
                            .catch(fail);
                    };

                    if (force) {
                        downAndCopy();
                    } else {
                        // 先检查 tmp 下有没有该文件
                        me.exists(0, o.relative).then(fileEntry => {
                            if (fileEntry) { // 如果有
                                var fileURL = fileEntry.toURL();
                                success(fileURL);

                                me.exists(1, o.relative)
                                    .then(exists => {
                                        if (!exists) { // 如果 dataDirectory 下没有这个文件，就将其拷贝到 dataDirectory 下
                                            return me.copyTo(0, fileURL, o.root, o.relative); // 拷贝一份到 dataDirectory 目录
                                        }
                                    });
                            } else {
                                // 没有就下载
                                downAndCopy();
                            }
                        }).catch(fail);
                    }
                }

                queue.push({
                    resolve,
                    reject,
                    downloading: options && Ext.isFunction(options.downloading) ? options.downloading : null
                });
            });
        }

        return me.downFile.apply(me, args);
    },

    /**
     * 删除一个文件
     *
     * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
     * @param {String} path 文件路径，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    remove(root, path) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            var fail = err => {
                // <debug>
                console.error('FileMgr', 'remove failed', err.code ? FSUtil.FILEERROR[err.code] : err);
                // </debug>
                reject(err);
            };

            if (Ext.isEmpty(path)) fail('路径为空');

            if (FileUtil.isFileUri(path)) { // 完整 file uri
                window.resolveLocalFileSystemURL(path, file => {
                    file.remove(resolve, fail);
                }, fail);
            } else { // 相对路径
                var o = FSUtil.parse(root, path), // 有可能 root，没有传入值，有可能 dir 是完整 file uri。此处解析成 相对路径 和 正确的 root
                    relativePath = o.relative;

                FSUtil[`load${o.root}`]().then(fs => {
                    fs.root.getFile(relativePath, {
                        create: false,
                        exclusive: false
                    }, file => {
                        file.remove(resolve, fail);
                    }, fail);
                }).catch(fail);
            }
        });
    },
    /**
     * 判断文件是否存在
     *
     * @param {Number} root 0 tempDirectory / 1 dataDirectory / null
     * @param {String} filePath 文件路径(带文件名)，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    exists(root, filePath) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {
            var fail = err => {
                // <debug>
                console.error('FileMgr', 'check exists failed', err.code ? FSUtil.FILEERROR[err.code] : err);
                // </debug>
                reject(err);
            };

            if (Ext.isEmpty(filePath)) fail('路径为空');

            var o = FSUtil.parse(root, filePath),
                relativePath = o.relative;

            FSUtil[`load${o.root}`]().then(fs => {
                fs.root.getFile(relativePath, {
                    create: false
                }, resolve, err => {
                    if (err.code == 1) { // 未找到
                        resolve(null);
                    } else {
                        reject(err);
                    }
                });
            }).catch(fail);
        });
    },
    /**
     * 复制一个文件
     *
     * @param {Number} fromRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} fromPath 源文件路径(带文件名)，完整 file uri 或 相对路径
     * @param {Number} toRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} toPath 目标文件路径(带文件名)，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    moveTo(fromRoot, fromPath, toRoot, toPath) {
        return new Ext.Promise((resolve, reject) => {
            FSUtil.copyOrMove(fromRoot, fromPath, toRoot, toPath, 1, true, resolve, reject);
        });
    },
    /**
     * 剪切一个文件
     *
     * @param {Number} fromRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} fromPath 源文件路径(带文件名)，完整 file uri 或 相对路径
     * @param {Number} toRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} toPath 目标文件路径(带文件名)，完整 file uri 或 相对路径
     * @returns {Ext.Promise}
     */
    copyTo(fromRoot, fromPath, toRoot, toPath) {
        return new Ext.Promise((resolve, reject) => {
            FSUtil.copyOrMove(fromRoot, fromPath, toRoot, toPath, 1, false, resolve, reject);
        });
    },

    /**
     * 解决命名冲突
     * 场景：多次下载同名文件到某个目录下，为了不覆盖已有文件，就需要先使用此方法获取一个不冲突的文件名
     * 比如：下载1.txt到file/目录下，但是原本已经存在了一个1.txt，那么使用该方法获取一个可用文件名1 (1).txt
     *
     * @param {Number} saveRoot 0 tempDirectory / 1 dataDirectory / null
     * @param {String} saveDir 目标目录(此目录必须已存在)，完整 file uri或相对路径
     * @param {String} saveName 目标文件名，如1.txt
     */
    solveDup(saveRoot, saveDir, saveName) {
        var me = this;

        return new Ext.Promise((resolve, reject) => {

            var fail = err => {
                // <debug>
                console.error('FileMgr', 'solveDup failed', err.code ? FSUtil.FILEERROR[err.code] : err);
                // </debug>
                reject(err);
            };

            if (FileUtil.isFileUri(saveDir)) { // 完整 file uri
                window.resolveLocalFileSystemURL(saveDir, dir => {
                    var name = FileUtil.getFileNameWoExt(saveName),
                        ext = FileUtil.getExtension(saveName);
                    me._solveDup(dir, name, ext, 0, resolve);
                }, fail);
            } else {
                var o = FSUtil.parse(saveRoot, saveDir),
                    relativeDir = o.relative;

                FSUtil[`load${o.root}`]().then(fs => {
                    fs.root.getDirectory(relativeDir, {
                        create: false
                    }, dir => {
                        var name = FileUtil.getFileNameWoExt(saveName),
                            ext = FileUtil.getExtension(saveName);
                        me._solveDup(dir, name, ext, 0, resolve);
                    }, fail);
                }).catch(fail);
            }
        });
    },

    /**
     * 打开文件
     * @param {String/FileEntry} file 文件Entry 或者 fileUri
     */
    open(file) {
        const me = this;

        return new Ext.Promise((resolve, reject) => {
            let url = file;
            if (window.FileEntry && file instanceof window.FileEntry) {
                url = file.toURL();
            }
            url = decodeURIComponent(url);

            if (window.plugins && plugins.fileOpener) {
                plugins.fileOpener.open(url, resolve, err => {
                    reject(err);
                    Utils.toastShort(err.message || '');
                });
            } else if (window.cefMain) {
                cefMain.open(url, resolve, err => {
                    reject(err);
                    Utils.toastShort(err.message || '');
                });
            }
        });
    },

    privates: {
        /*
        存储 被下载的目标文件名 和 下载任务 的映射，
        因为下载一个文件 可能 被多个地方用（也就是被多个地方回调），比如下载头像的时候，一个view有多个地方下载同一头像

        map 里面存储的键值对如下：
        'images/****': [{
            success: xx,
            fail: yy,
            downloading: zz,
            scope: ww
        }]
        */
        queues0: {},
        queues1: {},

        /**
         * 和上面一样，用于 downFileForSrc
         */
        srcQueues0: {},
        srcQueues1: {},

        _solveDup(dirEntry, saveName, saveExtension, times, success) {
            var me = this,
                newName = saveName + (times == 0 ? '.' : ` (${times}).`) + saveExtension;
            dirEntry.getFile(newName, {
                create: false
            }, file => {
                me._solveDup(dirEntry, saveName, saveExtension, times + 1, success);
            }, () => {
                success(newName);
            });
        }
    }

});