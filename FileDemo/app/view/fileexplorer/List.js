Ext.define('FileDemo.fileexplorer.List', {
    extend: 'Ext.List',
    requires: ['FileDemo.model.Entry'],
    xtype: 'file_explorer',

    defaultListenerScope: true,

    config: {
        /**
         * 显示文件
         */
        showFiles: true
    },

    cls: 'file-explorer',
    loadingText: null,

    items: [{
        xtype: 'navbar',
        backBtn: false,
        title: '文件浏览'
    }],

    itemContentCls: 'x-layout-box fullwidth x-align-center',
    itemTpl: [
        '<div class="list-icon {[values.isParent ? \'x-fa fa-level-up\' : (values.isDirectory ? \'x-fa fa-folder\' : (values.isFile ? FileUtil.getMIMEIcon(FileUtil.getExtension(values.name)) : \'\'))]}"></div>',
        '{name}'
    ].join(''),
    store: {
        model: 'FileDemo.model.Entry',
        autoDestroy: true,
        sorters: [{
            property: 'isParent',
            direction: 'DESC'
        }, {
            property: 'isDirectory',
            direction: 'DESC'
        }, {
            property: 'name',
            direction: 'ASC'
        }]
    },

    plugins: {
        type: 'listoptions',
        filter: function (list, record) {
            return !record.get('isParent');
        },
        items: [{
            action: 'rename',
            text: '重命名',
            color: 'bg-soft-blue'
        }, {
            action: 'delete',
            text: '删除',
            color: 'bg-soft-red'
        }]
    },
    listeners: {
        listoptiontap: 'onListOptTap',
        childtap: 'goTo'
    },

    successDir(dirEntry, isParent, parentEntry) {
        var me = this,
            stack = me.parentStack,
            store = me.getStore(),
            dirReader = dirEntry.createReader();

        if (!stack) {
            stack = me.parentStack = [];
        }

        dirReader.readEntries(entries => {
            var arr = [];
            var root = dirEntry.filesystem.root;
            if (root.name !== dirEntry.name || root.fullPath !== dirEntry.fullPath) { // 非根目录
                arr.push({
                    name: '上一级',
                    isDirectory: dirEntry.isDirectory,
                    isFile: dirEntry.isFile,
                    entry: parentEntry,
                    parentEntry: stack.length > 1 ? stack[stack.length - 1] : null,
                    isParent: true
                });
            }
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isDirectory) {
                    arr.push({
                        name: entries[i].name,
                        isDirectory: entries[i].isDirectory,
                        isFile: entries[i].isFile,
                        entry: entries[i],
                        parentEntry: dirEntry
                    });
                } else if (entries[i].isFile && me.getShowFiles()) {
                    arr.push({
                        name: entries[i].name,
                        isDirectory: entries[i].isDirectory,
                        isFile: entries[i].isFile,
                        entry: entries[i],
                        parentEntry: dirEntry
                    });
                }
            }
            if (isParent) {
                stack.pop();
            } else {
                stack.push(parentEntry);
            }
            me.currentDir = dirEntry;
            store.setData(arr);
        }, err2 => {
            console.log('err2', err2);
        });
    },

    initialize() {
        var me = this;
        me.callParent(arguments);

        if (Ext.browser.is.Cordova || window.cefMain) {
            FSUtil.load1().then(fs => {
                me.successDir(fs.root, false, null);
            }).catch(err1 => {
                console.log('err1', err1);
            });
        }
    },

    onListOptTap(list, record, action) {
        const me = this,
            store = list.getStore(),
            isFile = record.get('isFile'),
            isDir = record.get('isDirectory'),
            entryURL = record.get('entry').toURL(),
            parentDirURL = record.get('parentEntry').toURL();

        if (action == 'rename') {
            Utils.prompt('请输入新文件名:', text => {

                if (isDir) {
                    /* me.currentDir.getDirectory(name, {
                        create: false
                    }, entry => {
                        entry.moveTo(me.currentDir, value, function () {
                            record.set();
                        }, fileFailHandler);
                    }, fileFailHandler);*/
                    DirMgr.moveTo(null, entryURL, null, parentDirURL + text).then(url => {
                        record.set('name', text);
                    }).catch(err => {
                        Utils.alert(err);
                    });
                } else if (isFile) {
                    /* me.currentDir.getFile(name, {
                        create: false
                    }, entry => {
                        entry.moveTo(me.currentDir, value, function () {
                            nameEl.html(value);
                        }, fileFailHandler);
                    }, fileFailHandler);*/
                    FileMgr.moveTo(null, entryURL, null, parentDirURL + text).then(url => {
                        record.set('name', text);
                    }).catch(err => {
                        Utils.alert(err);
                    });
                }
            });
        } else if (action == 'delete') {
            Utils.confirm('确定要删除吗?', () => {

                if (isDir) {
                    DirMgr.remove(null, entryURL).then(() => {
                        store.remove(record);
                    }).catch(err => {
                        Utils.alert(err);
                    });
                } else if (isFile) {
                    FileMgr.remove(null, entryURL).then(() => {
                        store.remove(record);
                    }).catch(err => {
                        Utils.alert(err);
                    });
                }
            });
        }
    },

    /**
     * 跳转目录 或者 打开文件
     * @param {Ext.List} list
     * @param {Object} info
     */
    goTo(list, info) {
        const record = info.record,
            entry = record.get('entry');

        if (record.get('isDirectory')) {
            const parent = record.get('parentEntry');
            this.successDir(entry, record.get('isParent'), parent);
        } else if (record.get('isFile')) {
            // 用第三方 App 打开
            FileMgr.open(entry);
        }
    }
});