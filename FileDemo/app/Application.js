/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */
Ext.define('FileDemo.Application', {
    extend: 'Ext.app.Application',
    requires: [
        'MX.util.Utils',
        'MX.util.FileMgr',
        'MX.plugin.ListOptions'
    ],

    name: 'FileDemo',

    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },

    launch() {
        if (Ext.browser.is.Cordova && Ext.os.is.Android) {
            cordova.file.tempDirectory = cordova.file.cacheDirectory;
        }
        Ext.fly('appLoadingIndicator').destroy();
    },

    onAppUpdate() {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});