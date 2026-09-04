#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppleCalendarModule, NSObject)

RCT_EXTERN_METHOD(presentEventEditor:(NSDictionary *)eventData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
