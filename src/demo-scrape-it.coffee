
'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'ISOTERM/CLI'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
types                     = new ( require 'intertype' ).Intertype()
{ isa
  validate
  type_of }               = types.export()
#...........................................................................................................
( require 'mixa/lib/check-package-versions' ) require '../pinned-package-versions.json'
PATH                      = require 'path'
FS                        = require 'fs'
got                       = require 'got'
CHEERIO                   = require 'cheerio'
H                         = require './helpers'

#-----------------------------------------------------------------------------------------------------------
demo_1 = ->
  url       = 'https://ionicabizau.net'
  elements  =
    title:  ".header h1"
    desc:   ".header h2"
    avatar:
      selector: ".header img"
      attr:     "src"
  { data, response, } = await scrape_it url, elements
  info "Status Code: ${response.statusCode}"
  urge data
  return null

#-----------------------------------------------------------------------------------------------------------
demo_zvg_online_net = ->
  url       = 'https://www.zvg-online.net/1400/1101986118/ag_seite_001.php'
  elements  =
    # containers: '.container_vors a'
    containers:
      listItem: '.container_vors'
      data:
        listing:
          listItem: 'a'
  encoding  = 'latin1'
  #.........................................................................................................
  buffer    = await got url
  html      = buffer.rawBody.toString encoding
  d         = await scrape_it.scrapeHTML html, elements
  # info "Status Code: #{response.statusCode}"
  for container, idx in d.containers
    urge '^74443^', idx, rpr container.listing
    R = []
    for line in container.listing
      unless ( match = line.match /^(?<key>[^:]*):(?<value>.*)$/ )?
        help '^3453^', rpr line
        R.push { key: './.', value: line, }
        continue
      { key, value, } = match.groups
      key             = key.trim()
      value           = value.trim()
      R.push { key, value, }
    console.table R
  return null

#-----------------------------------------------------------------------------------------------------------
demo_zvg24_net = ->
  url       = 'https://www.zvg24.net/zwangsversteigerung/brandenburg'
  elements  =
    # containers: '.container_vors a'
    containers:
      listItem: 'article'
  #     data:
  #       listing:
  #         listItem: 'a'
  encoding  = 'utf8'
  #.........................................................................................................
  # buffer    = await got url
  # html      = buffer.rawBody.toString encoding
  buffer    = FS.readFileSync PATH.join __dirname, '../sample-data/www.zvg24.net_,_zwangsversteigerung_,_brandenburg.html'
  html      = buffer.toString encoding
  d         = await scrape_it.scrapeHTML html, elements
  # info "Status Code: #{response.statusCode}"
  for text, idx in d.containers
    lines = text.split /\s*\n\s*/
    # text = text.replace /\x20+/g, ' '
    # text = text.replace /\n\x20\n/g, '\n'
    # text = text.replace /\n+/g, '\n'
    # text = text.replace /Musterbild\n/g, ''
    lines = ( line for line in lines when line isnt 'Musterbild' )
    urge '^74443^', idx, rpr lines
    # urge '^74443^', idx, rpr container.replace /\n+/g, '\n'
    # R = []
    # for line in container.listing
    #   unless ( match = line.match /^(?<key>[^:]*):(?<value>.*)$/ )?
    #     help '^3453^', rpr line
    #     R.push { key: './.', value: line, }
    #     continue
    #   { key, value, } = match.groups
    #   key             = key.trim()
    #   value           = value.trim()
    #   R.push { key, value, }
    # console.table R
  return null

#-----------------------------------------------------------------------------------------------------------
remove_cdata = ( text ) -> text.replace /^<!\[CDATA\[(.*)\]\]>$/, '$1'
article_url_from_description = ( description ) ->
  debug '^342342^', rpr description
  if ( match = description.match /Article URL:\s*(?<article_url>[^\s]+)/ )?
    return match.groups.article_url
  return null

#-----------------------------------------------------------------------------------------------------------
demo_oanda_com = ->
  url       = 'https://www.zvg24.net/zwangsversteigerung/brandenburg'
  elements  =
    containers:
      listItem: '.rate_row'
  #     data:
  #       listing:
  #         listItem: 'a'
  encoding  = 'utf8'
  #.........................................................................................................
  # buffer    = await got url
  # html      = buffer.rawBody.toString encoding
  buffer    = FS.readFileSync PATH.join __dirname, '../sample-data/hnrss.org_,_newest.xml'
  html      = buffer.toString encoding
  #.........................................................................................................
  ### NOTE This is RSS XML, so `link` doesn't behave like HTML `link` and namespaces are not supported: ###
  html      = html.replace /<dc:creator>/g,   '<creator>'
  html      = html.replace /<\/dc:creator>/g, '</creator>'
  html      = html.replace /<link>/g,         '<reserved-link>'
  html      = html.replace /<\/link>/g,       '</reserved-link>'
  #.........................................................................................................
  $         = CHEERIO.load html
  R         = []
  # debug type_of $ 'item'
  # debug ( $ 'item' ).html()
  # debug ( $ 'item' ).each
  # debug ( $ 'item' ).forEach
  #.........................................................................................................
  for item in ( $ 'item' )
    item            = $ item
    #.......................................................................................................
    title           = item.find 'title'
    title           = title.text()
    title           = remove_cdata title
    title           = title.trim()
    #.......................................................................................................
    discussion_url  = item.find 'reserved-link'
    discussion_url  = discussion_url.text()
    #.......................................................................................................
    date            = item.find 'pubDate'
    date            = date.text()
    #.......................................................................................................
    creator         = item.find 'creator'
    creator         = creator.text()
    #.......................................................................................................
    description     = item.find 'description'
    description     = description.text()
    description     = remove_cdata description
    article_url     = article_url_from_description description
    #.......................................................................................................
    href    = null
    R.push { title, date, creator, discussion_url, article_url, }
  #.........................................................................................................
  H.tabulate "Hacker News", R
  return null


############################################################################################################
if module is require.main then do =>
  # await demo_zvg_online_net()
  # await demo_zvg24_net()
  await demo_oanda_com()
  # await demo_oanda_com_jsdom()
  # f()