
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
_types                    = require './types'



#===========================================================================================================
class @Vogue_scraper

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    GUY.props.hide @, 'types',    _types.types
    GUY.props.hide @, 'defaults', _types.defaults
    #.......................................................................................................
    @cfg        = { @defaults.vogue_scraper_constructor_cfg..., cfg..., }
    # @cfg.vogue ?= new ( require './vogue-db' ).Vogue_db { client: @, }
    @types.validate.vogue_scraper_constructor_cfg @cfg
    { vogue, }  = GUY.obj.pluck_with_fallback @cfg, null, 'vogue'; GUY.props.hide @, 'vogue', vogue
    @cfg        = GUY.lft.freeze @cfg
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




