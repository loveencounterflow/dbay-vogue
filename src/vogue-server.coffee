
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
FS                        = require 'fs'
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
{ HDML, }                 = require 'hdml'


#===========================================================================================================
class @Vogue_server extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_server_constructor_cfg..., cfg..., }
    @types.validate.vogue_server_constructor_cfg @cfg
    @_add_layout()
    @cfg        = GUY.lft.freeze @cfg
    @hub        = H.property_pending
    #.......................................................................................................
    GUY.props.hide @, 'app',    new Koa()
    GUY.props.hide @, 'router', new Router()
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _add_layout: ->
    @cfg.layout ?= {}
    return null if @cfg.layout.top? and @cfg.layout.bottom?
    path    = PATH.resolve PATH.join __dirname, '../assets/layout.html'
    layout  = FS.readFileSync path, { encoding: 'utf-8', }
    [ layout_top
      layout_bottom   ] = layout.split '<%content%>'
    @cfg.layout.top    ?= layout_top
    @cfg.layout.bottom ?= layout_bottom
    return null

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
    ###
    `_r_*`: managed by router
    `_s_*`: managed by server
    ###
    @app.use                                          @_s_log
    @app.use                                          @_s_layout
    #.......................................................................................................
    @router.get   'home',           '/',              @_r_home
    @router.get   'trends',         '/trends',        @_r_trends
    @router.get   'table_by_name',  '/table/:table',  @_r_table_by_name
    #.......................................................................................................
    @app.use @router.routes()
    #.......................................................................................................
    ### thx to https://stackoverflow.com/a/66377342/7568091 ###
    debug '^4345^', @cfg.paths.public
    debug '^4345^', @cfg.file_server
    # @app.use mount '/favicon.ico', file_server @cfg.paths.favicon, @cfg.file_server
    @app.use mount '/public', file_server @cfg.paths.public, @cfg.file_server
    @app.use mount '/src',    file_server @cfg.paths.src,    @cfg.file_server
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
  _s_layout: ( ctx, next ) =>
    await next()
    if ( ctx.type is 'text/html' ) and ( not ctx.body?.startswith? "<!DOCTYPE html>" )
      ctx.body = @cfg.layout.top + ctx.body + @cfg.layout.bottom
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_home: ( ctx ) =>
    ctx.body = "DBay Vogue App"
    # help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_trends: ( ctx ) =>
    ### TAINT iterate or use stream ###
    ### TAINT chart is per-DSK but trends table is global ###
    R     = []
    for { dsk, scraper, } from @hub.scrapers._XXX_walk_scrapers()
      R.push scraper._XXX_get_details_chart { dsk, }
      # R.push scraper._XXX_get_details_table { dsk, }
    table = @hub_get_table_name 'trends'
    R.push @hub.vdb.as_html { table, }
    #.......................................................................................................
    ctx.response.type   = 'html'
    ctx.body            = R.join '\n'
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_table_by_name: ( ctx ) =>
    ### TAINT iterate or use stream ###
    ctx.response.type   = 'html'
    { table }           = ctx.params
    table              ?= "NO SUCH TABLE"
    #.......................................................................................................
    ### TAINT use API call to get actual table name ###
    { prefix }          = @hub.vdb.cfg
    ### TAINT this functionality probably misplaced; done here for POC ###
    table_cfgs          =
      "#{prefix}_trends":
        fields:
          #.................................................................................................
          dsk:
            display: false
          #.................................................................................................
          ts:
            format: ( ts ) => @hub.vdb.db.dt_format ts, 'YYYY-MM-DD HH:mm UTC'
          #.................................................................................................
          raw_trend:
            title:  "Trend"
            html:   ( raw_trend ) =>
              return HDML.pair 'td.trend.sparkline', { 'data-trend': raw_trend, }
          #.................................................................................................
          details:
            title:  "Trend"
            html:   ( details ) =>
              try d = JSON.parse details catch error
                return HDML.pair 'div.error', HDML.text error.message
              R = []
              R.push HDML.open 'table.details'
              for k, v of d
                R.push HDML.open 'tr'
                R.push HDML.pair 'th', HDML.text k
                R.push HDML.pair 'td', HDML.text v
                R.push HDML.close 'tr'
              R.push HDML.close 'table'
              return HDML.pair 'td.details', R.join ''
    table_cfg           = table_cfgs[ table ] ? null
    #.......................................................................................................
    ctx.body            = "<h1>Table #{table}</h1>\n" + @hub.vdb.as_html { table, table_cfg..., }
    return null

  #---------------------------------------------------------------------------------------------------------
  _s_default: ( ctx ) =>
    ctx.response.status = 404
    ctx.response.type   = 'html'
    ctx.body            = "<h3>DBay Vogue App / 404 / Not Found</h3>"
    # ctx.throw 404, "no content under #{ctx.url}"
    # ( ctx.state.greetings ?= [] ).push "helo from content handler"
    return null
