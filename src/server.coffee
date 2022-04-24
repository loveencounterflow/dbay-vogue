
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE/SERVER'
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
GUY                       = require 'guy'
Koa                       = require 'koa'
Router                    = require '@koa/router'
{ Server: Socket_server } = require 'socket.io'
file_server               = require 'koa-files'
mount                     = require 'koa-mount'
_types                    = require './types'


# #-----------------------------------------------------------------------------------------------------------
# app.use ( ctx, next ) =>
#   debug "^dbay-vogue/server@1^ dt-1 before"
#   await next()
#   debug "^dbay-vogue/server@2^ dt-1 after"
#   rt = ctx.response.get 'X-Response-Time'
#   help "^dbay-vogue/server@3^ #{ctx.method} #{ctx.url}; dt: #{rt}"
#   help "^dbay-vogue/server@4^", ctx.state
#   return null
# #...........................................................................................................
# app.use ( ctx, next ) =>
#   debug "^dbay-vogue/server@5^ dt-2 before"
#   start = Date.now()
#   await next()
#   debug "^dbay-vogue/server@6^ dt-2 after"
#   ms    = Date.now() - start
#   ctx.set 'X-Response-Time', "#{ms} ms"
#   ( ctx.state.greetings ?= [] ).push "helo from X-Response-Time setter"
#   return null

# #-----------------------------------------------------------------------------------------------------------
# file_server_cfg =
#   # Enable or disable accepting ranged requests. Disabling this will not send Accept-Ranges and ignore the
#   # contents of the Range request header. defaults to true.
#   acceptRanges:     true
#   # Set Cache-Control response header, defaults to undefined, see docs: Cache-Control in MDN.
#   cacheControl:     undefined
#   # Enable or disable etag generation, defaults to true.
#   etag:             true
#   # Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
#   # defaults to true.
#   lastModified:     true
#   # Set ignore rules. defaults to undefined. ( path ) => boolean
#   ignore:           undefined
#   # If true, serves after await next(), allowing any downstream middleware to respond first. defaults to false.
#   defer:            false

# #-----------------------------------------------------------------------------------------------------------
# paths =
#   public:   PATH.resolve __dirname, '../public'
# ### thx to https://stackoverflow.com/a/66377342/7568091 ###
# app.use mount '/public', file_server paths.public, file_server_cfg





#===========================================================================================================
class @Vogue_server

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    GUY.props.hide @, 'types',    _types.types
    GUY.props.hide @, 'defaults', _types.defaults
    #.......................................................................................................
    @cfg        = { @defaults.vogue_server_constructor_cfg..., cfg..., }
    @types.validate.vogue_server_constructor_cfg @cfg
    { client, } = GUY.obj.pluck_with_fallback @cfg, null, 'client'
    @cfg        = GUY.lft.freeze @cfg
    #.......................................................................................................
    GUY.props.hide @, 'client', client
    GUY.props.hide @, 'app',    new Koa()
    GUY.props.hide @, 'router', new Router()
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  start: => new Promise ( resolve, reject ) =>
    { host
      port  } = @cfg
    @_create_app()
    #.......................................................................................................
    GUY.props.hide @, 'http_server',  HTTP.createServer @app.callback()
    GUY.props.hide @, 'io',           new Socket_server @http_server
    #.......................................................................................................
    @io.on 'connection', ( socket ) =>
      help "^dbay-vogue/server@8^ user connected to socket"
      return null
    #.......................................................................................................
    @http_server.listen { host, port, }, ->
      debug "^dbay-vogue/server@9^ listening"
      resolve { host, port, }
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _create_app: =>
    @app.use                                  @_s_log
    @router.get   'home',       '/',          @_r_home
    @router.get   'trends',     '/trends',    @_r_trends
    #.......................................................................................................
    @app.use @router.routes()
    @app.use @_s_default
    @app.use @router.allowedMethods()
    return null


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  _s_log: ( ctx, next ) =>
    { method
      url
      originalUrl
      origin
      href
      path
      query
      querystring
      host
      hostname
      protocol }  = ctx
    querystring  ?= ''
    querystring   = "?#{querystring}" if querystring.length > 1
    # help "^dbay-vogue/server@7^", { method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol, }
    help "^dbay-vogue/server@7^", "#{method} #{origin}#{path}#{querystring}"
    next()
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_home: ( ctx ) =>
    ctx.body = "DBay Vogue App"
    # help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_trends: ( ctx ) =>
    urge "^dbay-vogue/server@7^", ctx.router.url 'trends', { query: { foo: 'bar', }, }
    debug '^34346^', @client
    R = []
    R.push "<!DOCTYPE html>"
    R.push """
      <style>
        td {
          background-color: #ddd;
          white-space: nowrap; }
      </style>"""
    R.push "<h3>DBay Vogue App / Trends</h3>"
    R.push "<table>"
    for row from @client.scr.db """select * from scr_trends_html order by nr;"""
      R.push row.html
    R.push "</table>"
    #.......................................................................................................
    ctx.response.type   = 'html'
    ctx.body            = R.join '\n'
    return null

  #---------------------------------------------------------------------------------------------------------
  _s_default: ( ctx ) =>
    ctx.response.status = 404
    ctx.response.type   = 'html'
    ctx.body            = """<!DOCTYPE html>
      <h3>DBay Vogue App / 404 / Not Found</h3>
      """
    # ctx.throw 404, "no content under #{ctx.url}"
    # ( ctx.state.greetings ?= [] ).push "helo from content handler"
    return null
