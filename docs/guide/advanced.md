# Advanced

## Headers & Footers

To insert a header or footer, use the file menu: `Insert > Headers & Footers > Header` or `Insert > Headers & Footers > Footer`.

Headers and footers may also be turned on and off in the page setup dialog, whih is accessed through the main menu: `File > Page Setup`.

![Header Settings Dialog](./images/guide-header-settings-dialog.png)

In the page setup dialog, you can control whether the first page has a different header and footer than the rest of the document, as well as whether odd and even pages have different headers.

### Page Numbers

To insert a page number in the header, type `$p`. When the document is printed, the token `$p` will be replaced with the correct page number in the header/footer of each page.

![Header Settings Page Number Example](./images/guide-header-page-number-example-1.png)

### Other Tokens

Several other tokens are available. Below is a list of currently supported tokens.

| Token | Description                   |
| ----- | ----------------------------- |
| `$p`  | Page Number                   |
| `$n`  | Number of Pages               |
| `$f`  | File Name (without extension) |
| `$F`  | File Path                     |
