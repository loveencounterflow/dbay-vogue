


# Web Site Scraper

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Web Site Scraper](#web-site-scraper)
  - [Vogue Scheduler](#vogue-scheduler)
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

## Vogue Scheduler

* `schedular.add_interval: ( cfg ) ->`
  * `cfg` must have properties:
    * `task: function | asyncfunction`: the task to run. It will be called without arguments.
    * `repeat: duration`: how often to repeat a task.
  * Optional properties of `cfg`:
    * `jitter: duration | percentage` (default `null` meaning `0 seconds`): how much to randomly vary the
      repetition rate. For example, when `repetition` is `1 hour`, `jitter` is `5 minutes` and the task has
      been first started at `00:00`, then it will be repeated somewhere between `00:55` and `01:05`. A
      jitter of `25%` would equal `15 minutes` in this case.

    <del>* `timeout: duration` (default: `null` meaning no timeout): how long to wait for a task to finish. When
      a task has been stopped because of timeout, the next session will be started following the same rules
      as if it finished normally.</del>

    * `pause: duration` (default: `null` meaning `0 seconds`): specifies the minim time between the
      finishing of one session and the start of the next one, taking account of jitter. Example: When a task
      has been scheduled with `{ repeat: '10 minutes', jitter: '3 minutes', pause: '2 minutes', }`, is first
      run at `00:00` and took 9 minutes until `00:09` to finish, it would without `pause` be scheduled to run next at
      `00:10`. But because `jitter` is `3 minutes` we have to postpone until

      `minutes`, it could have run as early as `00:55`, which it couldn't because it hadn't yet finished by
      then. Therefore, the next session gets scheduled at `01:06` because `00:59 + 2min + 5min = 00:66 =
      01:06`.

      Note that for simplicity, we have only used minutes and hours in the above, which in reality could
      have the undesirable effect that a task scheduled to have a pause of `1 minute` finishes at `00:59:59`
      only to be run again at `01:00:00`—just a second later. To avoid this, durations are internally
      reckoned in milliseconds, so `1 minute` really means `60,000 milliseconds` and `1 hour` equals
      `3,600,000 milliseconds`.

* `duration`: a string spelling out a duration using a float literal and a unit, separated by a space.
  Allowed units are `week`, `day`, `hour`, `minute`, `second`, all in singular and plural. Examples: `'1.5
  seconds'`, `'1e2 minutes'`, `'1 week'`.
* `percentage`: a string speeling out a percentage with a float literal immediately followed by a percent
  sign, `%`. Examples: `'4.2%'`, `0%`. The amount must be between `0` and `100`.

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
  implement session timeout

## Is Done

* **[+]** name
* **[+]** POC
* **[+]** rename `round` -> `session`
* **[+]** rename `seq` -> `rank`
* **[+]** rename `progress` -> `trends`?
* **[+]** use [D3](https://github.com/d3/d3), [plot](https://github.com/observablehq/plot) to produce
  sparklines (MVP)



