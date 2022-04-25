


# Web Site Scraper

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Web Site Scraper](#web-site-scraper)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Web Site Scraper

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
  * **[–]** Some tags may be given systematic behavior:
    * `+seen`—de-emphasize/grey-out post where it appears
    * `+watch`—the opposite of `+seen`, hilite post where it appears
    * `+pin-to-top`—always show post near top of listings even when its position in the data source's
      listing is further down
    * other tags may be added at user request and be associated with a certain style / color / theme (maybe
      associate arbitrary CSS with each tag)

## Is Done

* **[+]** POC
* **[+]** rename `round` -> `session`
* **[+]** rename `seq` -> `rank`
* **[+]** rename `progress` -> `trends`?



