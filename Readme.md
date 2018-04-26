# ExtJS 6.5 + Cordova Examples

## FileDemo

Include wrappers of FileTransfer and File API, it makes file/directory creation-deletion, red/write. download very simple. you will need the cordova file plugins:
```
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-file-transfer
```

## 附
cordova file插件 提供了一些常量，直接指向可用的一些路径，详细请看：
https://github.com/apache/cordova-plugin-file#where-to-store-files


cordova 常量：cordova.file.dataDirectory
在 ios 中表示该路径：file:///var/mobile/Applications/<UUID>/Library/NoCloud/
在 android 中表示该路径：file:///data/data/<包名>/files/ 或者高版本安卓是 file:///data/user/0/<包名>/files/
这个路径是永久存储的路径，需要应用自己提供清理存储空间的功能


cordova 常量: cordova.file.tempDirectory
在 ios 中表示该路径：file:///var/mobile/Applications/<UUID>/tmp/
在 android 中没有这个路径
这个路径是临时目录，里面的文件会被系统随时清理(比如设备存储容量不足时)

ios 使用 Cordova + WKWebview 时，图片必须在 cordova.file.tempDirectory 下，<img src> 才能展示出来


综上，所有的图片和文件，本地都存放在 cordova.file.dataDirectory 下。（images、files、avatars、thumbnails 可以再具体分目录）
对于 ios，在显示图片 <img src> 的时候，需要
1、先检查 cordova.file.tempDirectory 目录下有没有该图片文件，有就赋值给 src，没有就转2
2、检查 cordova.file.dataDirectory 下有没有该图片文件，有就复制到 cordova.file.tempDirectory， 然后把 tmp 路径赋值给 src，没有就转3
3、从服务器下载文件到 cordova.file.dataDirectory，然后复制一份到 cordova.file.tempDirectory， 最后把 tmp 路径赋值给 src