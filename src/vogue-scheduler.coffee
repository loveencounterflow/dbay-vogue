
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
  @C: GUY.lft.freeze
    duration_pattern: /^(?<amount>[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)\s(?<unit>.+)$/
    duration_units: [
      'week',   'weeks',
      'day',    'days',
      'hour',   'hours',
      'minute', 'minutes',
      'second', 'seconds', ]

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
  stop: ->

  #---------------------------------------------------------------------------------------------------------
  add_interval: ( cfg ) ->
    cfg         = { @defaults.vogue_scheduler_add_interval_cfg..., cfg..., }
    dayjs       = @hub.vdb.db._dayjs
    @types.validate.vogue_scheduler_add_interval_cfg cfg
    { callee
      repeat  } = cfg
    repeat      = { ( repeat.match @constructor.C.duration_pattern ).groups..., }
    d           = { running: false, }
    delta_t_ms  = ( dayjs.duration repeat.amount, repeat.unit ).asMilliseconds()
    # debug '^342-1^', { cfg, repeat, delta_t_ms, }
    #.......................................................................................................
    task = =>
      return null if d.running
      #.....................................................................................................
      d.running   = true
      t0_ms       = Date.now()
      #.....................................................................................................
      return null if ( await callee() ) is false
      #.....................................................................................................
      d.running   = false
      t1_ms       = Date.now()
      run_dt_ms   = t1_ms - t0_ms
      ### TAINT what to do when extra_dt is zero, negative? ###
      extra_dt_ms = ( delta_t_ms - run_dt_ms )
      extra_dt_s  = ( dayjs.duration extra_dt_ms, 'milliseconds' ).asSeconds()
      d.ref       = @after extra_dt_s, task
      # debug '^342-2^', extra_dt_s
      #.....................................................................................................
      return null
    #.......................................................................................................
    task()
    return null

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  every: ( dts, f ) ->                         setInterval f,    dts * 1000
  after: ( dts, f ) ->                         setTimeout  f,    dts * 1000
  sleep: ( dts    ) -> new Promise ( done ) => setTimeout  done, dts * 1000



