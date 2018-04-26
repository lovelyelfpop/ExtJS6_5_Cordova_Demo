const PLUGIN_NAME         = "cordova-android-support-gradle-release";

try{
    var fs = require('fs');
    var path = require('path');
    var parser = require('xml2js');
}catch(e){
    throw PLUGIN_NAME + ": Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.message;
}

const GRADLE_FILENAME = path.resolve(process.cwd(), 'platforms', 'android', 'build.gradle');
const GRADLE_FILENAME2 = path.resolve(process.cwd(), 'platforms', 'android', 'app', 'build.gradle');
const PACKAGE_PATTERN = /(compile "com.android.support:[^:]+:)([^"]+)"/;

// 1. Parse cordova.xml file and fetch this plugin's <variable name="ANDROID_SUPPORT_VERSION" />
fs.readFile(path.resolve(process.cwd(), 'config.xml'), function (err, data) {
    var json = parser.parseString(data, function (err, result) {
        if (err) {
            return console.log(PLUGIN_NAME, ": ERROR: ", err);
        }
        var plugins = result.widget.plugin;
        if(!plugins || plugins.length === 0) return;
        for (var n = 0, len = plugins.length; n < len; n++) {
            var plugin = plugins[n];
            if (plugin.$.name === PLUGIN_NAME) {
                if (!plugin.variable || plugin.variable.length === 0) {
                    return console.log(PLUGIN_NAME, ' Failed to find <variable name="ANDROID_SUPPORT_VERSION" /> in config.xml');
                }
                // 2.  Update .gradle file.
                plugin.variable.forEach(x => {
                    if(x.$.name == 'ANDROID_SUPPORT_VERSION') {
                        setGradleVersion(x.$.value);
                    }
                });
                break;
            }
        }
    });
});

/**
 * Write properties.gradle with:
 *
 ext {
  ANDROID_SUPPORT_VERSION = '<VERSION>'
}
 *
 */
function setGradleVersion(version) {
    fs.readFile(GRADLE_FILENAME, function (err, contents) {
        if (err) {
            return console.log(PLUGIN_NAME, " ERROR: ", err);
        }
        contents = contents.toString();
        fs.writeFile(GRADLE_FILENAME, contents.replace(PACKAGE_PATTERN, "$1" + version + '"'), 'utf8', function (err) {
            if (err) return console.log(PLUGIN_NAME, ": FAILED TO WRITE ", GRADLE_FILENAME, " > ", version, err);
            console.log(PLUGIN_NAME, ": WROTE ", GRADLE_FILENAME, " > ", version);
        });
    });
    
    fs.readFile(GRADLE_FILENAME2, function (err, contents) {
        if (err) {
            return console.log(PLUGIN_NAME, " ERROR: ", err);
        }
        contents = contents.toString();
        fs.writeFile(GRADLE_FILENAME2, contents.replace(PACKAGE_PATTERN, "$1" + version + '"'), 'utf8', function (err) {
            if (err) return console.log(PLUGIN_NAME, ": FAILED TO WRITE ", GRADLE_FILENAME2, " > ", version, err);
            console.log(PLUGIN_NAME, ": WROTE ", GRADLE_FILENAME2, " > ", version);
        });
    });
}





