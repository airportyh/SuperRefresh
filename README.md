SuperRefresh Bookmarklet
========================
What is it?
-----------
A bookmarklet that automatically refreshes your page as you are designing it.
Usage: 

1. Navigate to the page that you are developing in your browser - this can be either a local file or a served file.
2. Click on the bookmarklet - your page will be replaced with the SuperRefresh page, which will contain an iframe pointed back at your page.
3. Edit your page and save. The changes will almost immediately update within the iframe.

How to build it?
----------------
1. Install python if you don't have it.
2. Get [yui-compressor] [1] and put it in your PATH.
3. run the build script and the output will be printed to the console. You may
redirect it to a file or pbcopy on Mac to put it on the clipboard.

Browser Support
---------------
As far as I know, it only works on Safari, Chrome and Firefox now.

Credits
-------
Sha1 Algorithm from [http://www.movable-type.co.uk/scripts/sha1.html] [2].

[1]: http://developer.yahoo.com/yui/compressor/
[2]: http://www.movable-type.co.uk/scripts/sha1.html