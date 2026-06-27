#import <Cocoa/Cocoa.h>
#include <signal.h>
#include <stdio.h>

static volatile sig_atomic_t MineradioKeepRunning = 1;

static void MineradioStop(int signalValue) {
  (void)signalValue;
  MineradioKeepRunning = 0;
  CFRunLoopStop(CFRunLoopGetMain());
}

int main(void) {
  @autoreleasepool {
    signal(SIGINT, MineradioStop);
    signal(SIGTERM, MineradioStop);

    id monitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskOtherMouseDown
                                                     handler:^(NSEvent *event) {
      if (event.buttonNumber == 2) {
        fputs("MMB\n", stdout);
        fflush(stdout);
      }
    }];

    if (monitor == nil) {
      fputs("无法注册全局鼠标监听；请检查输入监控/辅助功能权限。\n", stderr);
      fflush(stderr);
      return 2;
    }

    while (MineradioKeepRunning) {
      @autoreleasepool {
        [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode
                                 beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.5]];
      }
    }

    [NSEvent removeMonitor:monitor];
  }
  return 0;
}
