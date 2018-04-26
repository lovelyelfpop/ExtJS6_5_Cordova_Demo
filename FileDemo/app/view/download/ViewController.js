Ext.define('FileDemo.view.download.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.download_view',

    init() {

    },

    onTapDown(btn) {
        if (!Ext.browser.is.Cordova) return;

        const me = this,
            url = btn.url;

        if (url) {
            btn.setDisabled(true);
            FileMgr.downFile(url, 1, `files/${FileUtil.getFileName(url)}`, {
                downloading(percent) {
                    me.appendLog(`下载中 ${percent}%`);
                }
            }).then(filePath => {
                me.appendLog(`文件路径：<br>${filePath}`);

                btn.setDisabled(false);
            }).catch(error => {
                me.appendLog('下载失败');

                btn.setDisabled(false);
            });
        }
    },

    onTapOpen(btn) {
        if (!Ext.browser.is.Cordova) return;

        const me = this,
            name = btn.name,
            path = `files/${name}`;

        FileMgr.exists(1, path).then(fileEntry => {
            if (fileEntry) { // 文件存在
                FileMgr.open(fileEntry);
            } else {
                me.appendLog('文件不存在，请先点击上面的下载按钮');
            }
        }).catch(err => {
            console.error(err);
        });
    },

    onTapDownload(btn) {
        if (!Ext.browser.is.Cordova) return;

        const me = this,
            txtUrl = me.lookup('txtUrl'),
            url = txtUrl.getValue();

        if (Ext.isEmpty(url) || !Utils.isUrl(url)) {
            return Utils.toastShort('请输入一个有效的 Url');
        }

        btn.setDisabled(true);
        FileMgr.downFile(url, 1, `files/${FileUtil.getFileName(url)}`, {
            downloading(percent) {
                me.appendLog(`下载中 ${percent}%`);
            }
        }).then(filePath => {
            me.appendLog(`文件路径：<br>${filePath}`);

            btn.setDisabled(false);
        }).catch(error => {
            me.appendLog('下载失败');

            btn.setDisabled(false);
        });
    },

    appendLog(log) {
        const me = this,
            txtConsole = me.lookup('txtConsole');

        // txtConsole.setHtml(`${log}<br>${txtConsole.getHtml() || ''}`);
        txtConsole.element.insertFirst({
            html: log
        });
    }
});