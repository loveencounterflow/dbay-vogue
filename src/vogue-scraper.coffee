
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
  get_sparkline: ( trend ) ->
    # # values = [ { sid: -1, rank: -1,  }, ]
    # values = []
    # for [ sid, rank, ] in trend
    #   values.push { sid, rank: -rank, }
    # values.unshift { sid: -1, rank: -1, } if values.length < 2
    #.......................................................................................................
    dense_trend         = []
    dense_trend[ sid ]  = rank for [ sid, rank, ] in trend
    # for rank, sid in dense_trend
    #   dense_trend[ sid ] = 21 unless rank?
    # dense_trend.unshift 21 while dense_trend.length < 12
    values              = []
    values.push { sid, rank, } for rank, sid in dense_trend
    #.......................................................................................................
    values_json = JSON.stringify values
    #.......................................................................................................
    R = """<script>
      document.body.append( VOGUE.sparkline_from_trend( #{values_json} ) );
      </script>"""
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  html_from_details: ( row ) ->
    { dsk
      sid
      ts
      pid
      rank
      trend
      details } = row
    #.......................................................................................................
    trend       = JSON.parse trend
    details     = JSON.parse details
    dsk_html    = HDML.text dsk
    sid_html    = HDML.text "#{sid}"
    ts_html     = HDML.text ts
    id_html     = HDML.text pid
    rank_html   = HDML.text "#{rank}"
    trend_html  = HDML.text JSON.stringify trend
    title_html  = HDML.pair 'a', { href: details.title_url, }, HDML.text details.title
    #.......................................................................................................
    tds         = [
      HDML.insert 'td', @get_sparkline trend
      HDML.pair 'td.dsk', dsk_html
      HDML.pair 'td.sid', sid_html
      HDML.pair 'td.id', id_html
      HDML.pair 'td.ts', ts_html
      HDML.pair 'td.rank', rank_html
      HDML.pair 'td.title', title_html
      ]
    #.......................................................................................................
    return HDML.pair 'tr', null, tds.join '\n'




