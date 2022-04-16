


```
const Apify = require('apify');

// Apify.main is a helper function, you don't need to use it.
Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    // Choose the first URL to open.
    await requestQueue.addRequest({ url: 'https://example.com/' });

    const crawler = new Apify.PlaywrightCrawler({
        requestQueue,
        handlePageFunction: async ({ request, page }) => {
            // Extract HTML title of the page.
            const title = await page.title();
            console.log(`Title of ${request.url}: ${title}`);
            process.exit( 111 );
            // Add URLs that match the provided pattern.
            // await Apify.utils.enqueueLinks({
            //     page,
            //     requestQueue,
            //     pseudoUrls: ['https://www.iana.org/[.*]'],
            // });
        },
    });

    await crawler.run();
});
```