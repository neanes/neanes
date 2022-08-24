/*
To compile: 
gcc -framework Cocoa fontlist.m -o fontlist
*/

#import <Cocoa/Cocoa.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        for (NSString* font in [[NSFontManager sharedFontManager] availableFonts]) {
            printf("%s\n", [font UTF8String]);
        }
    }
    return 0;
}