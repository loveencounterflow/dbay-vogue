





```coffee
    html        = """
      <ul id="fruits">
        <li class="apple">Apple</li>
        <li class="orange">Orange</li>
        <li class="pear">Pear</li>
      </ul>
      <ul id="veggies">
        <li class="broccoli">Broccoli</li>
        <li class="asparagus">Asparagus</li>
        <li class="spinach">Spinach</li>
      </ul>
      """
    #.......................................................................................................
    $           = CHEERIO.load html
    R           = []
    #.......................................................................................................
    for ul in ( $ 'ul' )
      ul = $ ul
      urge '^434554^', @types.type_of ul
      for li in ul.find 'li'
        li = $ li
        info '^434554^', li.text()
        info '^434554^', li.html()
      break
```


## Namespaces

From

> You can select with XML Namespaces but due to the CSS specification, the colon (:) needs to be escaped for the selector to be valid.
>
> ```
> $('[xml\\:id="main"');
> ```






