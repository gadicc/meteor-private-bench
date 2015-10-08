Each build contains 500 files in "site/private".
"Small" builds contain 1 line each.
"Big" builds contain 500 lines each.
To trigger the rebuild, a single file is modified in the APP.

Results:

*    js-small: 3897.7 ms
*      js-big: 3969.7 ms
*   css-small: 3342.9 ms
*     css-big: 3467.4 ms
*   txt-small: 3586.6 ms
*     txt-big: 7445.6 ms

