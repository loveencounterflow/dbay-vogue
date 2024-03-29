
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
    abs_duration_pattern:   /^(?<amount>(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)\s(?<unit>.+)$/
    percentage_pattern:     /^(?<percentage>(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)%$/
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
  _parse_abs_duration: ( duration_txt ) ->
    ### TAINT use `require` instead ###
    dayjs = @hub.vdb.db._dayjs
    match = duration_txt.match @constructor.C.abs_duration_pattern
    return ( dayjs.duration match.groups.amount, match.groups.unit ).asMilliseconds()

  #---------------------------------------------------------------------------------------------------------
  _parse_absrel_duration: ( jitter_txt, reference_ms ) ->
    if ( match = jitter_txt.match @constructor.C.percentage_pattern )?
      percentage = parseFloat match.groups.percentage
      return reference_ms * percentage / 100
    return @_parse_abs_duration jitter_txt

  #---------------------------------------------------------------------------------------------------------
  add_interval: ( cfg ) ->
    cfg         = { @defaults.vogue_scheduler_add_interval_cfg..., cfg..., }
    ### TAINT use `require` instead ###
    dayjs       = @hub.vdb.db._dayjs
    @types.validate.vogue_scheduler_add_interval_cfg cfg
    { task
      repeat
      jitter
      pause   } = cfg
    repeat_ms   = @_parse_abs_duration            repeat
    jitter_ms   = @_parse_absrel_duration jitter, repeat_ms
    pause_ms    = @_parse_absrel_duration pause,  repeat_ms
    d           = { running: false, toutid: null, }
    #.......................................................................................................
    instrumented_task = =>
      return null if d.running
      #.....................................................................................................
      d.running       = true
      t0_ms           = Date.now()
      #.....................................................................................................
      return null if ( await task() ) is false
      #.....................................................................................................
      d.running       = false
      t1_ms           = Date.now()
      run_dt_ms       = t1_ms - t0_ms
      extra_dt_ms     = ( repeat_ms - run_dt_ms )
      earliest_dt_ms  = ( t1_ms + pause_ms + jitter_ms ) - t0_ms
      eff_dt_ms       = Math.max extra_dt_ms, earliest_dt_ms
      abberation_ms   = ( Math.random() * jitter_ms * 2 ) - jitter_ms
      eff_dt_ms      += abberation_ms
      d.toutid        = @after eff_dt_ms / 1000, instrumented_task
      #.....................................................................................................
      return null
    #.......................................................................................................
    instrumented_task()
    return null

  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  @every: GUY.async.every
  @after: GUY.async.after
  @sleep: GUY.async.sleep
  @defer: GUY.async.defer
  @cease: GUY.async.cease
  every:  GUY.async.every
  after:  GUY.async.after
  sleep:  GUY.async.sleep
  defer:  GUY.async.defer
  cease:  GUY.async.cease



