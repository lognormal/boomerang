1. Add random sampling
   This needs to be a little intelligent because plugins may have different
   criteria for sampling.  For example, the RT plugin requires two pages --
   one for tstart and one for tend.  Since tstart is a relatively inexpensive
   operation, it makes sense for us to set tstart on all pages, but only set
   tend based on the random sample.

2. Measure time from page start to page_load
   Since we may not always have control over the exact moment the user
   initiated a request for our page, the next best thing would be to measure
   the time from the first byte to reach the user to the time the page loaded.

   Note that comparing with server time is not a good idea since the user's
   system clock may not actually be correct.

   See use-case #1c & #1d.

3. Rewrite bandwidth testing code to be pretty and clean

4. Create a yui-gallery module
