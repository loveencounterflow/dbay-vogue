
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE/SCRAPER'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
PATH                      = require 'path'
GUY                       = require 'guy'
H                         = require './helpers'
{ Vogue_common_mixin }    = require './vogue-common-mixin'
{ HDML, }                 = require 'hdml'


#===========================================================================================================
### Collection of scrapers ###
class @Vogue_scrapers extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_scrapers_constructor_cfg..., cfg..., }
    @types.validate.vogue_scrapers_constructor_cfg @cfg
    @cfg        = GUY.lft.freeze @cfg
    @d          = {}
    @hub        = H.property_pending
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _XXX_walk_scrapers: ->
    yield { dsk, scraper, } for dsk, scraper of @d
    return null

  #---------------------------------------------------------------------------------------------------------
  _scraper_from_dsk: ( dsk ) ->
    unless ( R = @d[ dsk ] )?
      throw new Error "^Vogue_scrapers@1^ no such DSK: #{rpr dsk}"
    return R

  #---------------------------------------------------------------------------------------------------------
  add: ( cfg ) ->
    cfg         = { @defaults.vogue_scrapers_add_cfg..., cfg..., }
    @types.validate.vogue_scrapers_add_cfg cfg
    { dsk
      scraper } = cfg
    if @d[ dsk ]?
      throw new Error "^Vogue_scrapers@1^ DSK already in use: #{rpr dsk}"
    @d[ dsk ]   = scraper
    scraper._set_hub @hub
    return null


#===========================================================================================================
### Individual scraper ###
class @Vogue_scraper_ABC extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_scraper_constructor_cfg..., cfg..., }
    @types.validate.vogue_scraper_constructor_cfg @cfg
    @cfg        = GUY.lft.freeze @cfg
    @hub        = H.property_pending
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _html_from_html_or_buffer: ( html_or_buffer ) ->
    @types.validate.vogue_html_or_buffer html_or_buffer
    if ( @types.type_of html_or_buffer ) is 'buffer'
      return html_or_buffer.toString @cfg.encoding
    return html_or_buffer

  #---------------------------------------------------------------------------------------------------------
  html_from_details: ( row ) ->
    { sid
      dsk
      ts
      pid
      rank
      trend
      details } = row
    #.......................................................................................................
    trend       = JSON.parse trend
    details     = JSON.parse details
    sid_html    = HDML.text "#{sid}"
    dsk_html    = HDML.text dsk
    pid_html    = HDML.text "#{pid}"
    ts_html     = HDML.text ts
    rank_html   = HDML.text "#{rank}"
    trend_json  = JSON.stringify trend
    title_html  = HDML.pair 'a', { href: details.title_url, }, HDML.text details.title
    #.......................................................................................................
    tds         = [
      HDML.pair 'td.sid', sid_html
      HDML.pair 'td.dsk', dsk_html
      HDML.pair 'td.pid', pid_html
      HDML.pair 'td.ts', ts_html
      HDML.pair 'td.rank', rank_html
      HDML.pair 'td.sparkline', { 'data-trend': trend_json, }
      # HDML.pair 'td.trend', trend_html
      HDML.pair 'td.title', title_html
      ]
    #.......................................................................................................
    return HDML.pair 'tr', null, tds.join '\n'

  #---------------------------------------------------------------------------------------------------------
  ### NOTE liable to change ###
  _XXX_get_details_chart: ->
    R           = []
    trends      = @hub.vdb.get_latest_trends()
    trends_json = JSON.stringify trends
    # debug '^335^', rpr JSON.stringify trend for trend in JSON.parse trends
    R.push HDML.pair 'div.trendchart', { 'data-trends': trends_json, }
    return R.join '\n'

  #---------------------------------------------------------------------------------------------------------
  ### TAINT use more generic way to display tabular data ###
  ### NOTE liable to change ###
  _XXX_get_details_table: ->
    R = []
    R.push HDML.pair 'h3', HDML.text "DBay Vogue App / Trends"
    R.push HDML.open 'table#trends'
    #.......................................................................................................
    tds         = [
      HDML.pair 'th', HDML.text "SID"
      HDML.pair 'th', HDML.text "DSK"
      HDML.pair 'th', HDML.text "PID"
      HDML.pair 'th', HDML.text "TS"
      HDML.pair 'th', HDML.text "Rank"
      HDML.pair 'th', HDML.text "Sparkline"
      # HDML.pair 'th', HDML.text "Trend"
      HDML.pair 'th', HDML.text "Title"
      ]
    R.push HDML.pair 'tr', tds.join ''
    #.......................................................................................................
    # H = require '/home/flow/jzr/hengist/lib/helpers'
    # H.tabulate 'scr_trends_ordered', @hub.vdb.db """select
    #   rnr,
    #   dsk,
    #   sid,
    #   ts,
    #   pid,
    #   rank
    #   from scr_latest_trends;"""
    for row from @hub.vdb.db """select * from scr_latest_trends_html;"""
      R.push row.html
    R.push HDML.close 'table'
    return R.join '\n'



