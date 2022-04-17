
  const scrapeIt = require("scrape-it")
f = ->
  ```

  // Promise interface
  scrapeIt("https://www.zvg-online.net/1400/1101986118/ag_seite_001.php", {
      title: ".header h1"
    , desc: ".header h2"
    , avatar: {
          selector: ".header img"
        , attr: "src"
      }
  }).then(({ data, response }) => {
      console.log(`Status Code: ${response.statusCode}`)
      console.log(data)
  })
```

demo = ->
  elements =
    containit: '.container_vors'
  debug '^4353^', await scrapeIt url, elements


############################################################################################################
if module is require.main then do =>
  await demo()
