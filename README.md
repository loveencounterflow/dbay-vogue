


# Web Site Scraper

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Web Site Scraper](#web-site-scraper)
  - [Vogue Scraper](#vogue-scraper)
    - [Scraped Data Format](#scraped-data-format)
  - [Vogue Scheduler](#vogue-scheduler)
    - [Construction](#construction)
    - [Concurrent Writes](#concurrent-writes)
    - [Relevant Data Types](#relevant-data-types)
    - [Async Primitives](#async-primitives)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Web Site Scraper

* Vogue
  * `v:` `Vogue` is the so-called 'hub'; the main object to be instantiated
  * `v.scrapers:` `Vogue_scrapers`
    * `v.scrapers.d:` `{ [dsk]: Vogue_scraper, }`
  * `v.vdb:` `Vogue_db`
  * `v.server:` `Vogue_server`
  * `v.scheduler:` `Vogue_scheduler`

  * `Vogue_ops` slim on-page script (renders trendlines &c)
    * `Vogue_telegraph` for websocket-based client/server communication
      * based on [Datom XEmitter](https://github.com/loveencounterflow/datom#the-xemitter-xe-sub-module)

## Vogue Scraper

### Scraped Data Format

* Mandatory and Standard Items

* Freeform Items
  * field `details` must be a JSONifiable object (preferably a flat one)
  * can contain further items as seen fit
  * will be rendered as a list of named entries in a format determined by CSS
  * `Vogue_scraper` has prototype method `html_from_details()` to turn
    contents of `details` field into HTML; can be overridden for individual purposes

## Vogue Scheduler

### Construction

* `schedular.add_interval: ( cfg ) ->`
  * Mandatory properties of `cfg`:
    * `task: function | asyncfunction`: the task to run. It will be called without arguments.
    * `repeat: duration`: how often to repeat a task.
  * Optional properties of `cfg`:
    * `jitter: duration | percentage` (default `null` meaning `0 seconds`): how much to randomly vary the
      repetition rate. *Example:* when `repetition` is `1 hour`, `jitter` is `5 minutes` and the task has
      been first started at `00:00`, then it will be repeated somewhere between `00:55` and `01:05`. A
      jitter of `25%` would equal `15 minutes` in this case.

    * <del>`timeout: duration` (default: `null` meaning no timeout): how long to wait for a task to finish. When
      a task has been stopped because of timeout, the next session will be started following the same rules
      as if it finished normally.</del>

    * `pause: duration` (default: `null` meaning `0 seconds`): specifies the minim time between the
      finishing of one session and the earliest allowed start of the next one, taking jitter into account.
      *Example:* When a task has been scheduled with `{ repeat: '10 minutes', jitter: '3 minutes', pause: '5
      minutes', }`, is first run at `00:00` and took 9 minutes until `00:09` to finish, it would—without
      `pause` or `jitter`—be scheduled to run next at `00:09` (i.e. immediately). However, we have to wait
      at least until `00:09 + 5 minutes` to account for the pause, and because a non-zero `jitter` could
      cause the start to be that much earlier, we have to postpone until `00:09 + 5 minutes + 3 minutes =
      00:17`.

      Note that for simplicity, we have only used minutes and hours in the above, which in reality could
      have the undesirable effect that a task scheduled to have a pause of `1 minute` finishes at `00:59:59`
      only to be run again at `01:00:00`—just a second later. To avoid this, durations are internally
      reckoned in milliseconds, so `1 minute` really means `60,000 milliseconds` and `1 hour` equals
      `3,600,000 milliseconds`.

    * In case a session runs longer than its `repeat` duration,


```
0|0———0|1———0|2———0|3———0|4———0|5———0|6———0|7———0|8———0|9———1|0———1|1———1|2———1|3———1|4———1|5———1|6———1|7———1|8———1|9

  session                                               pause                         jitter
 |—————————————————————————————————————————————————————|=============================|~~~~~~~~~~~~~~~~~|
 |:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::|~~~~~~~~~~~~~~~~~|
  repeat                                                      jitter                  interval for start of next session
                                                                                     |+++++++++++++++++|+++++++++++++++|

  session           pause                         jitter
 |—————————————————|=============================|~~~~~~~~~~~~~~~~~|     jitter
 |:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::|~~~~~~~~~~~~~~~~~|
  repeat                                                      interval for start of next session
                                                             |+++++++++++++++++|+++++++++++++++|

  session pause                         jitter
 |—————|=============================|~~~~~~~~~~~~~~~~~|                 jitter
 |:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::|~~~~~~~~~~~~~~~~~|
  repeat                                                      interval for start of next session
                                                             |+++++++++++++++++|+++++++++++++++|

```

### Concurrent Writes

* any number of sessions may be active at any given point in time
* for a number of reasons, it would be nice if no partial results from any session would appear in DB
* the solution for this would usually be to wrap each session into a DB transaction
* however, SQLite does not allow concurrent writes and sessions can take a long time (e.g. because the
  network is slow); this risks transaction timeouts which in turn call for logic to handle this failure mode
* on the other hand the expected number of rows to be inserted by any session is low (not more than a few
  dozens up to hundreds of rows), so at least the performance gain from a transaction-per-session model
  should be negligible
* another alternative is to queue rows in memory and pass them to a single writer method that does an
  atomic insert
* yet another possibility is to use implicit (or explicit, but short-duration) transactions and allow
  partial results
* in case each session also registers its start and finish timestamps we can always detect incomplete
  sessions and treat them accordingly (hide them or add notification)
* the 'random inserts with implicit short transactions' (RIWIST) model then seems to be the simplest way to
  deal with concurrent sessions
* we won't get consecutive row numbers with RIWIST, but that should not pose a problem
* since each insert is done immediately instead of being deferred, we get a chance to grab the (possibly
  updated) row with `insert ... returning *;` statements, so that is a plus over a deferred model should we
  ever need that data.

### Relevant Data Types

* `(absolute) duration`: a string spelling out a duration using a float literal and a unit, separated by a
  space. Allowed units are `week`, `day`, `hour`, `minute`, `second`, all in singular and plural. Examples:
  `'1.5 seconds'`, `'1e2 minutes'`, `'1 week'`.
* `percentage (for relative durations)`: a string spelling out a percentage with a float literal immediately
  followed by a percent sign, `%`. Examples: `'4.2%'`, `0%`. The amount must be between `0` and `100`.

### Async Primitives

These 'five letter' methods are available both on the `Vogue_scheduler` class and its instances; for many
people, the most strightforward way to understand what these methods do will be to read the very simple
definitions and recognize they are very thin shims over the somewhat less convenient JavaScript methods:

* `every: ( dts, f ) ->                         setInterval f,    dts * 1000`
* `after: ( dts, f ) ->                         setTimeout  f,    dts * 1000`
* `cease: ( toutid ) -> clearTimeout toutid`
* `sleep: ( dts    ) -> new Promise ( done ) => setTimeout  done, dts * 1000`
* `defer: ( f = -> ) -> await sleep 0; return await f()`

In each case, `dts` denotes an interval (delta time) measured in *seconds* (not milliseconds) and `f`
denotes a function. `every()` and `after()` return so-called timeout IDs (`toutid`s), i.e. values that are
recognized by `cease()` (`clearTimeout()`, `clearInterval()`) to stop a one-off or repetetive timed function
call. `sleep()` returns a promise that should be awaited as in `await sleep 3`, which will allow another
task on the event loop to return and resume execution no sooner than after 3000 milliseconds have elapsed.
Finally, there is `defer()`, which should also be `await`ed. It is a special use-case of `sleep()` where the
timeout is set to zero, so the remaining effect is that other tasks on the event loop get a chance to run.
It accepts an optional function argument whose (synchronous or asynchronous) result will be returned.

## To Do

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
* **[–]** `Vogue_kaiju` (shim over [Playwright](https://playwright.dev)) for in-browser scraping of dynamic
  HTML pages
* **[–]** see https://github.com/kudla/promise-status-async, https://stackoverflow.com/a/53328182/7568091 on
  how to check for promise status;
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race on how to
  implement session timeout; https://github.com/dondevi/promise-abortable for cancelling promise

## Is Done

* **[+]** name
* **[+]** POC
* **[+]** rename `round` -> `session`
* **[+]** rename `seq` -> `rank`
* **[+]** rename `progress` -> `trends`?
* **[+]** use [D3](https://github.com/d3/d3), [plot](https://github.com/observablehq/plot) to produce
  sparklines (MVP)
* **[+]** `Vogue_scraper` -> `Vogue_scraper_ABC`


<!--

ideas for scraping

* exchange rates
* new SQLite downloads


 -->


