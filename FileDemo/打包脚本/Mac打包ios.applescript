tell application "Terminal"
	
	do script "cd /Users/pushsoft2/Desktop/ExtJS6_5_Cordova_Demo/FileDemo;
ant -buildfile ����ű�/configure_release.xml;
ant -buildfile ����ű�/replace_appversion.xml;
cd cordova
cordova platform rm ios
cd ..
PATH=/Users/pushsoft2/bin/Sencha/Cmd/6.5.3.6:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin;
sencha -info app build --clean ios;
open cordova/platforms/ios/FileDemo.xcodeproj;"
	
end tell