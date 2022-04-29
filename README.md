


# Web Site Scraper

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Web Site Scraper](#web-site-scraper)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Web Site Scraper

* Vogue
  * `Vogue_server`
  * `Vogue_scraper`
    * `Vogue_kaiju` (shim over [Playwright](https://playwright.dev)) for in-browser scraping of dynamic HTML
      pages
  * `Vogue_db`
  * `Vogue_ops` slim on-page script (renders trendlines &c)
    * `Vogue_telegraph` for websocket-based client/server communication
      * based on [Datom XEmitter](https://github.com/loveencounterflow/datom#the-xemitter-xe-sub-module)


## To Do

* **[–]** name
* **[–]** documentation
* **[–]** repurpose `posts` table to only contain unique posts with primary key `( pid, version )` where
  `version` is a small integer that allows to store updated `details` for a given post.
  * **[–]** versioned `posts` would e.g. allow pricing fluctions to be linked to constant articles; IOW with
    versions, a constant 'article'/'product' can now have a varying `price` detail
  * **[–]** old `posts` becomes `posts_and_sessions` (?) which details occurrences of `posts` in completed
    `sessions` ('sightings').
* **[–]** introduce tagging in its simplest form (only value-less, affirmative tags such as `+interesting`,
  `+seen`, `+hide`, `pin-to-top`). Tags are linked to unversioned `posts` via `pid`.
  * **[–]** consider to allow to tie tags to *versioned* posts with the additional rule that a 'version' may
    be a wildcard like `*` that applies to all versions of a post. Tying a tag to the version that I see in
    this listing then means 'OK not interested in this case but do show again if any details should have
    changed', tying a tag to symbolic version `*` communicates 'I've seen this and am not interested in
    being alerted to any changes'.
  * **[–]** Some tags may be given systematic behavior:
    * `+seen`—de-emphasize/grey-out post where it appears
    * `+watch`—the opposite of `+seen`, hilite post where it appears
    * `+pin-to-top`—always show post near top of listings even when its position in the data source's
      listing is further down
    * other tags may be added at user request and be associated with a certain style / color / theme (maybe
      associate arbitrary CSS with each tag)
* **[–]** allow to specify a list of keys into `details` containing facts that are to be writ large, such as
  the price of a product. Maybe also allow to track specific facets with a sparkline?
* **[–]** allow to specify from which key to derive `rank` from? In that case it would be best to keep *all*
  the data in `details` including № in the original listing and have a mapping like `{ rank: 'nr', }`, `{
  rank: 'price', }` to determine how to derive which aspect from which field.
  * **[–]** problem with this: if the № becomes part of `details` then change in position of item in listing
    would in itself be treated as an update to the *details* of an item, which is not what we want
    * i.e. change in rank is categorically different from change in other details
* **[–]** consider to either wrap `cheerio` handling (or make it optional), or use a library with a more
  transparent API

## Is Done

* **[+]** POC
* **[+]** rename `round` -> `session`
* **[+]** rename `seq` -> `rank`
* **[+]** rename `progress` -> `trends`?
* **[+]** use [D3](https://github.com/d3/d3), [plot](https://github.com/observablehq/plot) to produce
  sparklines (MVP)



