
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
    @router.get   'layout-demo',    '/layout-demo',   @_r_layout_demo
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
  _s_default: ( ctx ) =>
    ctx.response.status = 404
    ctx.response.type   = 'html'
    ctx.body            = "<h3>DBay Vogue App / 404 / Not Found</h3>"
    # ctx.throw 404, "no content under #{ctx.url}"
    # ( ctx.state.greetings ?= [] ).push "helo from content handler"
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
    debug '^32423^', ctx.query
    R     = []
    R.push @_dsks_as_html ctx.query.dsk ? ''
    #.......................................................................................................
    for { dsk, scraper, } from @hub.scrapers._XXX_walk_scrapers()
      R.push scraper._XXX_get_details_chart { dsk, }
      # R.push scraper._XXX_get_details_table { dsk, }
    R.push @_table_as_html @hub.vdb._get_table_name 'trends'
    #.......................................................................................................
    ctx.response.type   = 'html'
    ctx.body            = R.join '\n'
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_table_by_name: ( ctx ) =>
    public_table_name   = ctx.params.table
    table               = @hub.vdb._get_table_name public_table_name
    R                   = []
    R.push HDML.pair 'h1', HDML.text public_table_name
    R.push @_table_as_html table
    #.......................................................................................................
    ctx.response.type   = 'html'
    ctx.body            =  R.join '\n'
    return null

  #---------------------------------------------------------------------------------------------------------
  _get_dsk_form: ( selected = '' ) =>
    R                   = []
    #.......................................................................................................
    R.push HDML.open  'nav'
    R.push HDML.open  'form', { method: 'GET', action: '/trends', }
    R.push HDML.pair  'label', { for: 'dsk', }, "Data Source:"
    R.push HDML.open  'select', { name: 'dsk', id: 'dsk', onchange: "this.form.submit();", }
    R.push HDML.pair  'option', { value: '', }, HDML.text "Select a Data Source"
    for { dsk, url, } from @hub.vdb._walk_datasources()
      label           = "#{dsk} (#{url})"
      atrs            = { value: dsk, }
      atrs.selected   = 'true' if selected is dsk
      R.push HDML.pair  'option', atrs, HDML.text label
    R.push HDML.close 'select'
    R.push HDML.pair 'button', { type: 'submit', }, HDML.text "submit"
    R.push HDML.close 'form'
    R.push HDML.close 'nav'
    return R.join '\n'

  #---------------------------------------------------------------------------------------------------------
  _table_as_html: ( table ) =>
    table_cfg = @_get_table_cfg table
    return @hub.vdb.as_html { table, table_cfg..., }

  #---------------------------------------------------------------------------------------------------------
  _get_table_cfg: ( table ) =>
    @_set_table_cfgs() unless @table_cfgs?
    return @table_cfgs[ table ] ? null

  #---------------------------------------------------------------------------------------------------------
  _set_table_cfgs: =>
    GUY.props.hide @, 'table_cfgs', {}
    #.......................................................................................................
    @table_cfgs[ @hub.vdb._get_table_name 'trends' ] =
      fields:
        #...................................................................................................
        dsk:
          display: false
        #...................................................................................................
        sid_min:
          display: false
        sid_max:
          title:  "SIDs"
          format: ( _, d ) =>
            { sid_min
              sid_max } = d.row
            return sid_min if sid_min is sid_max
            return "#{sid_min}—#{sid_max}"
        #...................................................................................................
        ts:
          format: ( ts ) => @hub.vdb.db.dt_format ts, 'YYYY-MM-DD HH:mm UTC'
        #...................................................................................................
        raw_trend:
          title:  "Trend"
          outer_html:   ( raw_trend ) =>
            return HDML.pair 'td.trend.sparkline', { 'data-trend': raw_trend, }
        #...................................................................................................
        details:
          outer_html:   ( details ) =>
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
    return null

  #---------------------------------------------------------------------------------------------------------
  _r_layout_demo: ( ctx ) =>
    R                   = []
    #.......................................................................................................
    R.push HDML.open  'nav'
    R.push HDML.open  'menu'
    R.push HDML.pair  'li', HDML.pair 'a', { href: '#', }, HDML.text "one"
    R.push HDML.pair  'li', HDML.pair 'a', { href: '#', }, HDML.text "two"
    R.push HDML.pair  'li', HDML.pair 'a', { href: '#', }, HDML.text "three"
    R.push HDML.close 'menu'
    R.push HDML.close 'nav'
    #.......................................................................................................
    R.push HDML.pair  'header', HDML.text "header"
    #.......................................................................................................
    R.push HDML.open  'main'
    R.push HDML.open  'article'
    R.push HDML.text  "article"
    R.push HDML.close 'article'
    R.push HDML.close 'main'
    #.......................................................................................................
    R.push HDML.pair  'footer', HDML.text "footer"
    #.......................................................................................................
    ctx.response.type   = 'html'
    ctx.body            =  R.join '\n'
    return null
