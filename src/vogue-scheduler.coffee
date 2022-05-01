
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE/SCHEDULER'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
( require 'mixa/lib/check-package-versions' ) require '../pinned-package-versions.json'
GUY                       = require 'guy'
{ Vogue_common_mixin }    = require './vogue-common-mixin'
#...........................................................................................................
H                         = require './helpers'


#===========================================================================================================
class @Vogue_scheduler extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_scheduler_constructor_cfg..., cfg..., }
    @types.validate.vogue_scheduler_constructor_cfg @cfg
    @cfg        = GUY.lft.freeze @cfg
    @hub        = H.property_pending
    @rules      = []
    return undefined

  #---------------------------------------------------------------------------------------------------------
  start: ->

  #---------------------------------------------------------------------------------------------------------
  XXX_get_interval: ( f ) ->
    d = { running: false, }
    # every 0.1, => urge d
    g = =>
      return null if d.running
      d.running = true
      return null if ( await f() ) is false
      d.running = false
      d.ref     = @after 1, g
      return null
    g()
    return null

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  every: ( dts, f ) ->                         setInterval f,    dts * 1000
  after: ( dts, f ) ->                         setTimeout  f,    dts * 1000
  sleep: ( dts    ) -> new Promise ( done ) => setTimeout  done, dts * 1000



