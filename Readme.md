# ExtJS 6.5 + Cordova Examples

## FileDemo

Include wrappers of FileTransfer and File API, it makes file/directory creation-deletion, red/write. download very simple. you will need the cordova file plugins:
```
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-file-transfer
```

## ��
cordova file��� �ṩ��һЩ������ֱ��ָ����õ�һЩ·������ϸ�뿴��
https://github.com/apache/cordova-plugin-file#where-to-store-files


cordova ������cordova.file.dataDirectory
�� ios �б�ʾ��·����file:///var/mobile/Applications/<UUID>/Library/NoCloud/
�� android �б�ʾ��·����file:///data/data/<����>/files/ ���߸߰汾��׿�� file:///data/user/0/<����>/files/
���·�������ô洢��·������ҪӦ���Լ��ṩ����洢�ռ�Ĺ���


cordova ����: cordova.file.tempDirectory
�� ios �б�ʾ��·����file:///var/mobile/Applications/<UUID>/tmp/
�� android ��û�����·��
���·������ʱĿ¼��������ļ��ᱻϵͳ��ʱ����(�����豸�洢��������ʱ)

ios ʹ�� Cordova + WKWebview ʱ��ͼƬ������ cordova.file.tempDirectory �£�<img src> ����չʾ����


���ϣ����е�ͼƬ���ļ������ض������ cordova.file.dataDirectory �¡���images��files��avatars��thumbnails �����پ����Ŀ¼��
���� ios������ʾͼƬ <img src> ��ʱ����Ҫ
1���ȼ�� cordova.file.tempDirectory Ŀ¼����û�и�ͼƬ�ļ����о͸�ֵ�� src��û�о�ת2
2����� cordova.file.dataDirectory ����û�и�ͼƬ�ļ����о͸��Ƶ� cordova.file.tempDirectory�� Ȼ��� tmp ·����ֵ�� src��û�о�ת3
3���ӷ����������ļ��� cordova.file.dataDirectory��Ȼ����һ�ݵ� cordova.file.tempDirectory�� ���� tmp ·����ֵ�� src