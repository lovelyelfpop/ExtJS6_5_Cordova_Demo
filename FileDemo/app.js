/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'FileDemo.Application',

    name: 'FileDemo',

    requires: [
        // This will automatically load all classes in the FileDemo namespace
        // so that application classes do not need to require each other.
        'FileDemo.*'
    ],

    // The name of the initial view to create.
    mainView: 'FileDemo.view.main.Main'
});
