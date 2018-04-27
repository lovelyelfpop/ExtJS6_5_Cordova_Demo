@echo off
title 打包FileDemo
set currentpath=%~dp0
set apppath=%~dp0..
echo 第一次使用前请打开此bat文件，修改为你本机的路径
set packagepath=E:\FileDemo-App-Packages

:start
IF NOT EXIST %packagepath% (md %packagepath%)
cd /d %currentpath%
echo r 配置为Release
echo d 配置为Debug
echo rm 移除旧的android项目
echo 1 打包Android
echo 4 打包Production
echo 5 打包Testing
echo q 退出
set /p c=请选择: 
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
echo -----------------------配置Release完毕-----------------------

goto start

:configdebug
call ant -buildfile configure_debug.xml
echo -----------------------配置Debug完毕-----------------------

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
echo -----------------------Build成功-----------------------

goto copyapk




:pubprodution
cd ..
sencha -info app build --clean
echo -----------------------打包完成-----------------------

goto start


:pubtesting
cd ..
sencha -info app build --clean testing
echo -----------------------打包完成-----------------------

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
echo -----------------------复制APK成功-----------------------
goto start


:end
exit