
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
misfit                    = Symbol.for 'misfit'


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
  _scraper_from_dsk: ( dsk, fallback = misfit ) ->
    unless ( R = @d[ dsk ] )?
      throw new Error "^Vogue_scrapers@1^ no such DSK: #{rpr dsk}" if fallback is misfit
      return fallback
    return R

  #---------------------------------------------------------------------------------------------------------
  add: ( cfg ) ->
    cfg         = { @defaults.vogue_scrapers_add_cfg..., cfg..., }
    @types.validate.vogue_scrapers_add_cfg cfg
    { scraper }       = cfg
    { dsk }           = scraper.cfg
    if @d[ dsk ]?
      throw new Error "^Vogue_scrapers@1^ DSK already in use: #{rpr dsk}"
    @d[ dsk ]         = scraper
    scraper._set_hub @hub
    return null


#===========================================================================================================
### Individual scraper ###
class @Vogue_scraper_ABC extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super cfg
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
      details }         = row
    #.......................................................................................................
    sid_html            = HDML.text "#{sid}"
    dsk_html            = HDML.text dsk
    pid_html            = HDML.text "#{pid}"
    ts_html             = HDML.text ts
    rank_html           = HDML.text "#{rank}"
    title_html          = HDML.pair 'a', { href: details.title_url, }, HDML.text details.title
    #.......................................................................................................
    tds                 = [
      HDML.pair 'td.sid', sid_html
      HDML.pair 'td.dsk', dsk_html
      HDML.pair 'td.pid', pid_html
      HDML.pair 'td.ts', ts_html
      HDML.pair 'td.rank', rank_html
      HDML.pair 'td.sparkline', { 'data-dsk': dsk, 'data-pid': pid, 'data-trend': trend, }
      HDML.pair 'td.title', title_html
      ]
    #.......................................................................................................
    return HDML.pair 'tr', null, tds.join '\n'
#
  #---------------------------------------------------------------------------------------------------------
  ### NOTE liable to change ###
  _XXX_get_details_chart: ( cfg ) ->
    cfg                 = { @defaults.vogue_scraper__XXX_get_details_chart_cfg..., cfg..., }
    @types.validate.vogue_scraper__XXX_get_details_chart_cfg cfg
    { dsk             } = cfg
    R                   = []
    trends_data_json    = @hub.vdb.trends_data_json_from_dsk_sid { dsk, sid: null, }
    R.push HDML.pair 'div.trendchart', { 'data-trends': trends_data_json, }
    return R.join '\n'

  #---------------------------------------------------------------------------------------------------------
  ### TAINT use more generic way to display tabular data ###
  ### NOTE liable to change ###
  _XXX_get_details_table: ( cfg ) ->
    cfg                 = { @defaults.vogue_scraper__XXX_get_details_table_cfg..., cfg..., }
    @types.validate.vogue_scraper__XXX_get_details_table_cfg cfg
    { dsk             } = cfg
    R                   = []
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
    prefix = @hub.vdb.cfg.prefix
    for row from @hub.vdb.db """select * from #{prefix}_latest_trends_html;"""
      R.push row.html
    R.push HDML.close 'table'
    return R.join '\n'



