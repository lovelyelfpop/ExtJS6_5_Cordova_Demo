const PLUGIN_NAME         = "cordova-android-support-gradle-release";

try{
    var fs = require('fs');
    var path = require('path');
    var parser = require('xml2js');
}catch(e){
    throw PLUGIN_NAME + ": Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.message;
}

const MANIFEST_FILENAME     = path.resolve(process.cwd(), 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const CORDOVA_PROPERTIES_FILENAME     = path.resolve(process.cwd(), 'platforms', 'android', 'CordovaLib', 'project.properties');
const PROJECT_PROPERTIES_FILENAME     = path.resolve(process.cwd(), 'platforms', 'android', 'project.properties');
const GRADLE_FILENAME     = path.resolve(process.cwd(), 'platforms', 'android', PLUGIN_NAME, 'properties.gradle');
const GRADLE_FILENAME2     = path.resolve(process.cwd(), 'platforms', 'android', 'app', PLUGIN_NAME, 'properties.gradle');
const PROPERTIES_TEMPLATE = 'ext {ANDROID_SUPPORT_VERSION = "<VERSION>"}'

// 1. Parse cordova.xml file and fetch this plugin's <variable name="ANDROID_SUPPORT_VERSION" />
fs.readFile(path.resolve(process.cwd(), 'config.xml'), function(err, data) {
  var json = parser.parseString(data, function(err, result) {
    if (err) {
      return console.log(PLUGIN_NAME, " ERROR: ", err);
    }
    var plugins = result.widget.plugin;
    if(!plugins || plugins.length === 0) return;
    for (var n=0,len=plugins.length;n<len;n++) {
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
            else if(x.$.name == 'ANDROID_TARGET_VERSION') {
                setTargetVersion(x.$.value);
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
  console.log(PLUGIN_NAME, " ANDROID_SUPPORT_VERSION: ", version);
  fs.writeFile(GRADLE_FILENAME, PROPERTIES_TEMPLATE.replace(/<VERSION>/, version), 'utf8', function (err) {
     if (err) return console.log(PLUGIN_NAME, " FAILED TO WRITE ", GRADLE_FILENAME, " > ", version, err);
  });
  fs.writeFile(GRADLE_FILENAME2, PROPERTIES_TEMPLATE.replace(/<VERSION>/, version), 'utf8', function (err) {
     if (err) return console.log(PLUGIN_NAME, " FAILED TO WRITE ", GRADLE_FILENAME2, " > ", version, err);
  });
}


function setTargetVersion(version) {
    fs.readFile(PROJECT_PROPERTIES_FILENAME, function (err, contents) {
        if (err) {
            return console.log(PLUGIN_NAME, " ERROR: ", err);
        }
        contents = contents.toString();
        fs.writeFile(PROJECT_PROPERTIES_FILENAME, contents.replace(/(target=android-)(\d+)/, "$1" + version), 'utf8', function (err) {
            if (err) return console.log(PLUGIN_NAME, ": FAILED TO WRITE ", PROJECT_PROPERTIES_FILENAME, " > ", version, err);
            console.log(PLUGIN_NAME, ": WROTE ", PROJECT_PROPERTIES_FILENAME, " > ", version);
        });
    });
    
    fs.readFile(CORDOVA_PROPERTIES_FILENAME, function (err, contents) {
        if (err) {
            return console.log(PLUGIN_NAME, " ERROR: ", err);
        }
        contents = contents.toString();
        fs.writeFile(CORDOVA_PROPERTIES_FILENAME, contents.replace(/(target=android-)(\d+)/, "$1" + version), 'utf8', function (err) {
            if (err) return console.log(PLUGIN_NAME, ": FAILED TO WRITE ", CORDOVA_PROPERTIES_FILENAME, " > ", version, err);
            console.log(PLUGIN_NAME, ": WROTE ", CORDOVA_PROPERTIES_FILENAME, " > ", version);
        });
    });
    
    fs.readFile(MANIFEST_FILENAME, function (err, contents) {
        if (err) {
            return console.log(PLUGIN_NAME, " ERROR: ", err);
        }
        contents = contents.toString();
        fs.writeFile(MANIFEST_FILENAME, contents.replace(/(android:targetSdkVersion=")(\d+)"/, "$1" + version + '"'), 'utf8', function (err) {
            if (err) return console.log(PLUGIN_NAME, ": FAILED TO WRITE ", MANIFEST_FILENAME, " > ", version, err);
            console.log(PLUGIN_NAME, ": WROTE ", MANIFEST_FILENAME, " > ", version);
        });
    });
}




