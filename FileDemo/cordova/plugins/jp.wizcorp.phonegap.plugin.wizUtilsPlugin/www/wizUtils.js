/* WizUtils for PhoneGap - For all your wizarding needs!
 *
 * @author Ally Ogilvie
 * @copyright Wizcorp Inc. [ Incorporated Wizards ] 2014
 * @file - wizUtils.js
 * @about - JavaScript PhoneGap bridge for extra utilities 
 *
 *
*/

var exec = require("cordova/exec");

var wizUtils = {

    getAppFileName: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getAppFileName", []);
    },

    getVersionCode: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getVersionCode", []);
    },

    getVersionName: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getVersionName", []);
    },

    getVersion: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getVersion", []);
    },

    getBundleDisplayName: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getBundleDisplayName", []);
    },

    getBundleIdentifier: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getBundleIdentifier", []);
    },

    getDeviceHeight: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getDeviceHeight", []);
    },

    getDeviceWidth: function(s) {
        cordova.exec(s, null, "WizUtilsPlugin", "getDeviceWidth", []);
    },

    setText: function(text, s, f) {
        cordova.exec(s, f, "WizUtilsPlugin", "setText", [text]);
    },
    
    getText: function(s, f) {
        cordova.exec(s, f, "WizUtilsPlugin", "getText", []);
    },

    getFolderSize: function(s, f, dirName) {
        if (!dirName || dirName == '') {
            if (typeof f === 'function') {
                f('Directory Name not provided');
            }
            return;
        }
        cordova.exec(s, f, "WizUtilsPlugin", "getFolderSize", [dirName]);
    },
    
    saveToAlbum: function(s, f, uri){
        if (!uri || uri == '') {
            if (typeof f === 'function') {
                f('uri not provided');
            }
            return;
        }
        exec(s, f, "WizUtilsPlugin", "saveToAlbum", [uri]);
    }

};

module.exports = wizUtils;
