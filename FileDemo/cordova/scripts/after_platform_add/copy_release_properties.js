#!/usr/bin/env node

module.exports = function(ctx) {
    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path'),
        shell = ctx.requireCordovaModule('shelljs');

    var platformRoot = path.join(ctx.opts.projectRoot, 'platforms', 'android'),
        releasePropertiesPath = path.join(__dirname, 'release-signing.properties'),
        debugPropertiesPath = path.join(__dirname, 'debug-signing.properties'),
        extraGradlePath = path.join(__dirname, 'build-extras.gradle'),
        gradlePath = path.join(__dirname, 'gradle.properties');
    shell.cp('-f', releasePropertiesPath, platformRoot);
    shell.cp('-f', debugPropertiesPath, platformRoot);
    shell.cp('-f', extraGradlePath, path.join(platformRoot, 'app'));
    shell.cp('-f', gradlePath, platformRoot);


    //copy java files
    var ConfigParser, XmlHelpers;
    try {
        // cordova-lib >= 5.3.4 doesn't contain ConfigParser and xml-helpers anymore
        ConfigParser = ctx.requireCordovaModule("cordova-common").ConfigParser;
        XmlHelpers = ctx.requireCordovaModule("cordova-common").xmlHelpers;
    } catch (e) {
        ConfigParser = ctx.requireCordovaModule("cordova-lib/src/configparser/ConfigParser");
        XmlHelpers = ctx.requireCordovaModule("cordova-lib/src/util/xml-helpers");
    }
    var projectConfigurationFile = path.join(ctx.opts.projectRoot, 'config.xml'),
        cfg = new ConfigParser(projectConfigurationFile),

        safe_activity_name = cfg.android_activityName() || 'MainActivity';
        package_name = cfg.packageName() || 'my.cordova.project',
        packagePath = package_name.replace(/\./g, path.sep),

        activity_dir = path.join(platformRoot, 'app', 'src', 'main', 'java', packagePath),
        activity_path = path.join(activity_dir, safe_activity_name + '.java');

    shell.cp('-f', path.join(__dirname, 'src', 'Activity.java'), activity_path);
    shell.sed('-i', /__ACTIVITY__/, safe_activity_name, activity_path);
    shell.sed('-i', /__ID__/, package_name, activity_path);


    var cordovaLibPath = path.join(platformRoot, 'CordovaLib', 'src', 'org', 'apache', 'cordova');
    shell.cp('-f', path.join(__dirname, 'src', 'CordovaActivity.java'), cordovaLibPath);
    shell.cp('-f', path.join(__dirname, 'src', 'CustomInsetsFrameLayout.java'), cordovaLibPath);
};