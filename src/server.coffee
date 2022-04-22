
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-SCRAPER'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
( require 'mixa/lib/check-package-versions' ) require '../pinned-package-versions.json'
PATH                      = require 'path'
HTTP                      = require 'http'
Koa                       = require 'koa'
Router                    = require '@koa/router'
app                       = new Koa()
router                    = new Router()
{ Server: Socket_server } = require 'socket.io'
file_server               = require 'koa-files'
mount                     = require 'koa-mount'


#-----------------------------------------------------------------------------------------------------------
app.use ( ctx, next ) =>
  debug "^dbay-scr/server@1^ dt-1 before"
  await next()
  debug "^dbay-scr/server@2^ dt-1 after"
  rt = ctx.response.get 'X-Response-Time'
  help "^dbay-scr/server@3^ #{ctx.method} #{ctx.url}; dt: #{rt}"
  help "^dbay-scr/server@4^", ctx.state
  return null
#...........................................................................................................
app.use ( ctx, next ) =>
  debug "^dbay-scr/server@5^ dt-2 before"
  start = Date.now()
  await next()
  debug "^dbay-scr/server@6^ dt-2 after"
  ms    = Date.now() - start
  ctx.set 'X-Response-Time', "#{ms} ms"
  ( ctx.state.greetings ?= [] ).push "helo from X-Response-Time setter"
  return null

#-----------------------------------------------------------------------------------------------------------
file_server_cfg =
  # Enable or disable accepting ranged requests. Disabling this will not send Accept-Ranges and ignore the
  # contents of the Range request header. defaults to true.
  acceptRanges:     true
  # Set Cache-Control response header, defaults to undefined, see docs: Cache-Control in MDN.
  cacheControl:     undefined
  # Enable or disable etag generation, defaults to true.
  etag:             true
  # Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
  # defaults to true.
  lastModified:     true
  # Set ignore rules. defaults to undefined. ( path ) => boolean
  ignore:           undefined
  # If true, serves after await next(), allowing any downstream middleware to respond first. defaults to false.
  defer:            false

#-----------------------------------------------------------------------------------------------------------
paths =
  public:   PATH.resolve __dirname, '../public'
### thx to https://stackoverflow.com/a/66377342/7568091 ###
app.use mount '/public', file_server paths.public, file_server_cfg

#-----------------------------------------------------------------------------------------------------------
router.get 'home', '/', ( ctx ) ->
  ctx.body = "a routed response"
  help "^dbay-scr/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
  return null

#-----------------------------------------------------------------------------------------------------------
app.use router.routes()
app.use router.allowedMethods()

#-----------------------------------------------------------------------------------------------------------
# default response
app.use ( ctx ) =>
  # ctx.body = 'Hello World'
  ctx.throw 404, "no content under #{ctx.url}"
  ( ctx.state.greetings ?= [] ).push "helo from content handler"
  return null

#-----------------------------------------------------------------------------------------------------------
server_cfg  =
  host:       'localhost'
  port:       3456
http_server = HTTP.createServer app.callback()

#-----------------------------------------------------------------------------------------------------------
io          = new Socket_server http_server
io.on 'connection', ( socket ) =>
  help "^dbay-scr/server@8^ user connected to scket"
  return null

#-----------------------------------------------------------------------------------------------------------
http_server.listen server_cfg, ->
  debug "^dbay-scr/server@9^ listening"
  return null



