#import <Cordova/CDV.h>

@interface FileOpener : CDVPlugin <UIDocumentInteractionControllerDelegate> {
    NSString *localFile;
}

@property(nonatomic, strong) UIDocumentInteractionController *controller;

- (void) open: (CDVInvokedUrlCommand*)command;

@end