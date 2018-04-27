@echo off
title ���FileDemo
set currentpath=%~dp0
set apppath=%~dp0..
echo ��һ��ʹ��ǰ��򿪴�bat�ļ����޸�Ϊ�㱾����·��
set packagepath=E:\FileDemo-App-Packages

:start
IF NOT EXIST %packagepath% (md %packagepath%)
cd /d %currentpath%
echo r ����ΪRelease
echo d ����ΪDebug
echo rm �Ƴ��ɵ�android��Ŀ
echo 1 ���Android
echo 4 ���Production
echo 5 ���Testing
echo q �˳�
set /p c=��ѡ��: 
if "%c%"=="r" goto configrelease
if "%c%"=="d" goto configdebug
if "%c%"=="rm" goto rmandroid
if "%c%"=="1" goto pubandroid
if "%c%"=="4" goto pubprodution
if "%c%"=="5" goto pubtesting
if "%c%"=="q" goto end
goto start


:configrelease
call ant -buildfile configure_release.xml
echo -----------------------����Release���-----------------------

goto start

:configdebug
call ant -buildfile configure_debug.xml
echo -----------------------����Debug���-----------------------

goto start



:rmandroid
cd ..
cd cordova
call cordova platform rm android
cd ..

goto start




:pubandroid
call ant -buildfile replace_appversion.xml

cd ..
rmdir /s/q cordova\plugins\cordova-plugin-crosswalk-webview

sencha -info app build --clean android
echo -----------------------Build�ɹ�-----------------------

goto copyapk




:pubprodution
cd ..
sencha -info app build --clean
echo -----------------------������-----------------------

goto start


:pubtesting
cd ..
sencha -info app build --clean testing
echo -----------------------������-----------------------

goto start


:copyapk
set outputpath=%apppath%\cordova\platforms\android\app\build\outputs\apk\debug
for /f %%a in ('dir /b/a %outputpath%\^|findstr ".apk"') do (
echo.%%~na|findstr /v "unaligned" &&xcopy %outputpath%\%%a %packagepath%\ /e /Y
)
set outputpath=%apppath%\cordova\platforms\android\app\build\outputs\apk\release
for /f %%a in ('dir /b/a %outputpath%\^|findstr ".apk"') do (
echo.%%~na|findstr /v "unaligned" &&xcopy %outputpath%\%%a %packagepath%\ /e /Y
)
echo -----------------------����APK�ɹ�-----------------------
goto start


:end
exit