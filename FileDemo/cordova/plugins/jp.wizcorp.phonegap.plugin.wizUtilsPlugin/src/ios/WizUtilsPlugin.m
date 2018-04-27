/* WizUtils - For all your wizarding needs!
 *
 * @author Wizcorp Inc. [ Incorporated Wizards ]
 * @copyright 2014
 * @file WizUtilsPlugin.m for PhoneGap
 *
 */ 

#import "WizUtilsPlugin.h"
#import "WizDebugLog.h"

@interface WizUtilsPlugin ()
@property (nonatomic, readwrite, assign) UIWebView *theWebView;
@end

@implementation WizUtilsPlugin

- (void)dealloc {
    self.theWebView = nil;
    [super dealloc];
}

-(CDVPlugin *)initWithWebView:(UIWebView *)theWebView {
    self = (WizUtilsPlugin *)[super initWithWebView:theWebView];
    self.theWebView = theWebView;
    
    return self;
}

- (void)getDeviceHeight:(CDVInvokedUrlCommand *)command {
    WizLog(@"[WizUtilsPlugin] ******* getDeviceHeight ");
    
    CGRect screenRect = [[UIScreen mainScreen] bounds];
    int _height = screenRect.size.height;
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:_height];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getDeviceWidth:(CDVInvokedUrlCommand *)command {
    WizLog(@"[WizUtilsPlugin] ******* getDeviceWidth ");
    
    CGRect screenRect = [[UIScreen mainScreen] bounds];
    int _width = screenRect.size.width;
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:_width];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getAppFileName:(CDVInvokedUrlCommand *)command {
    WizLog(@"[WizUtilsPlugin] ******* getAppFileName ");
    
    // Get the main bundle for the app.
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    
    // Get app string
    NSString *appName = [NSString stringWithFormat:@"%@.app", [infoDict objectForKey:@"CFBundleExecutable"]];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:appName];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getVersionCode:(CDVInvokedUrlCommand*)command {
    WizLog(@"[WizUtilsPlugin] ******* getVersionCode ");
    
    // Get the main bundle for the app.
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    
    // Get version string
    NSString *ver = [infoDict objectForKey:@"CFBundleVersion"];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:ver];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getVersionName:(CDVInvokedUrlCommand*)command {
    WizLog(@"[WizUtilsPlugin] ******* getVersionName ");
    
    // Get the main bundle for the app.
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    
    // Get version string
    NSString *ver = [infoDict objectForKey:@"CFBundleShortVersionString"];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:ver];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getVersion:(CDVInvokedUrlCommand*)command {
    WizLog(@"[WizUtilsPlugin] ******* getVersion ");
    
    // Get the main bundle for the app.
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    
    // Get version
    NSString *verCode = [infoDict objectForKey:@"CFBundleVersion"];
    NSString *verName = [infoDict objectForKey:@"CFBundleShortVersionString"];
    
    NSMutableDictionary* resultDict = [[[NSMutableDictionary alloc] init] autorelease];
    [resultDict setObject:verCode forKey:@"code"];
    [resultDict setObject:verName forKey:@"name"];
    
    CDVPluginResult* pluginResult = [CDVPluginResult
                               resultWithStatus: CDVCommandStatus_OK
                               messageAsDictionary:resultDict
                               ];
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getBundleIdentifier:(CDVInvokedUrlCommand *)command {
    WizLog(@"[WizUtilsPlugin] ******* getBundleIdentifier ");
    
    // Get bundle identifier string
    NSString *bundleIdent = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:bundleIdent];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getBundleDisplayName:(CDVInvokedUrlCommand *)command {
    WizLog(@"[WizUtilsPlugin] ******* getBundleDisplayName ");
    
    // Get display name string
    NSString *dispName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:dispName];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


-(void)setText:(CDVInvokedUrlCommand *)command {
	
    // get text parameter
    NSString *text = [command.arguments objectAtIndex:0];
    
    // store the text
	[[UIPasteboard generalPasteboard] setValue:text forPasteboardType:@"public.utf8-plain-text"];
    
    // keep open the callback
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:text];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

-(void)getText:(CDVInvokedUrlCommand *)command {
    
    // get the text from pasteboard
	NSString *text = [[UIPasteboard generalPasteboard] valueForPasteboardType:@"public.utf8-plain-text"];
    
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:text];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


- (void) getFolderSize:(CDVInvokedUrlCommand*)command {
    NSString* path = [command.arguments objectAtIndex:0];
    if ([path hasPrefix:@"file:"]) {
        path = [[NSURL URLWithString:path] path];
    }
    
    float size = [self folderSizeAtPath:path];
    
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDouble:size];
    [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    //[self writeJavascript: [result toSuccessCallbackString:command.callbackId]];
}

-(float)folderSizeAtPath:(NSString *)folderPath
{
    NSFileManager *fileManager=[NSFileManager defaultManager];
    if(![fileManager fileExistsAtPath:folderPath])
        return 0;
    NSEnumerator *childFilesEnumerator=[[fileManager subpathsAtPath:folderPath] objectEnumerator];
    NSString *fileName;
    long long folderSize=0;
    while (nil!=(fileName=[childFilesEnumerator nextObject]))
    {
        NSString *fileAbsolutePath=[folderPath stringByAppendingPathComponent:fileName];
        folderSize+=[self fileSizeAtPath:fileAbsolutePath];
    }
    
    return folderSize;
}

-(float)fileSizeAtPath:(NSString *)path
{
    NSFileManager *fileManager=[NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:path])
    {
        return [[fileManager attributesOfItemAtPath:path error:nil] fileSize];
    }
    return 0;
}

- (void) saveToAlbum:(CDVInvokedUrlCommand*)command {
    NSString* path = [command.arguments objectAtIndex:0];
    
    NSURL *url = [NSURL URLWithString:path];
    NSString *p = [url path];
    
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:p];
    
    if(image == nil){
        CDVPluginResult * pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"invalid image path"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];                      
        return;
    }
    
    //Now it will do this for each photo in the array
    UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end