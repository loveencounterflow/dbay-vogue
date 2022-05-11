
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
{ Vogue_common_mixin }    = require './vogue-common-mixin'
H                         = require './helpers'


#===========================================================================================================
class @Vogue_server extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_server_constructor_cfg..., cfg..., }
    @types.validate.vogue_server_constructor_cfg @cfg
    @cfg        = GUY.lft.freeze @cfg
    @hub        = H.property_pending
    #.......................................................................................................
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
    #.......................................................................................................
    @router.get   'home',       '/',          @_r_home
    @router.get   'trends',     '/trends',    @_r_trends
    #.......................................................................................................
    @app.use @router.routes()
    #.......................................................................................................
    ### thx to https://stackoverflow.com/a/66377342/7568091 ###
    debug '^4345^', @cfg.paths.public
    debug '^4345^', @cfg.file_server
    # @app.use mount '/favicon.ico', file_server @cfg.paths.favicon, @cfg.file_server
    @app.use mount '/public', file_server @cfg.paths.public, @cfg.file_server
    #.......................................................................................................
    @app.use @_s_default
    @app.use @router.allowedMethods()
    return null


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  _s_log: ( ctx, next ) =>
    await next()
    querystring   = if ctx.querystring?.length > 1 then "?#{ctx.querystring}" else ''
    # help "^dbay-vogue/server@7^", { method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol, }
    color = if ctx.status < 400 then 'lime' else 'red'
    line  = "#{ctx.method} #{ctx.origin}#{ctx.path}#{querystring} -> #{ctx.status} #{ctx.message}"
    echo ( CND.grey "^dbay-vogue/server@7^" ), ( CND[ color ] line )
    # warn "^dbay-vogue/server@7^", "#{ctx.status} #{ctx.message}"
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_home: ( ctx ) =>
    ctx.body = "DBay Vogue App"
    # help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_trends: ( ctx ) =>
    R = []
    R.push "<!DOCTYPE html>"
    R.push """
      <script src='/public/browserified/mudom.js'></script>
      <script src='/public/ops1.js'></script>
      <script src='/public/d3@7.js'></script>
      <script src='/public/plot@0.4.js'></script>
      <link rel='icon' type='image/x-icon' href='/public/favicon.ico'>
      <link rel=stylesheet href='/public/vogue.css'></script>
      """
    for { dsk, scraper, } from @hub.scrapers._XXX_walk_scrapers()
      R.push scraper._XXX_get_details_chart()
      R.push scraper._XXX_get_details_table()
    R.push "<script src='/public/ops2.js'></script>"
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
