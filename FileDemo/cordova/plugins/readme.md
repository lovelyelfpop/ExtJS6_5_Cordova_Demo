此处的几个插件在原版之上做了一些变动


## 内置浏览器 插件
cordova-plugin-inappbrowser
注释掉三个按钮的`setPadding`(android)


## cordova-plugin-splashscreen
android代码改成了全屏，即注释掉下面的判断
```
//if ((cordova.getActivity().getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_FULLSCREEN)
//        == WindowManager.LayoutParams.FLAG_FULLSCREEN) {
    splashDialog.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN);
//}
```


## ios wkwebview 插件 全屏问题
cordova-plugin-wkwebview-engine\src\ios\CDVWKWebViewEngine.m  
```
// re-create WKWebView, since we need to update configuration
WKWebView* wkWebView = [[WKWebView alloc] initWithFrame:self.engineWebView.frame configuration:configuration];
//added begin
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000
if (@available(iOS 11.0, *)) {
  [wkWebView.scrollView setContentInsetAdjustmentBehavior:UIScrollViewContentInsetAdjustmentNever];
}
#endif
//added end
wkWebView.UIDelegate = self.uiDelegate;
self.engineWebView = wkWebView;
```
