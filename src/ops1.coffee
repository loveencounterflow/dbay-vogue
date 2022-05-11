

'use strict'
_console = console

#===========================================================================================================
class Intercepted_console

  # #---------------------------------------------------------------------------------------------------------
  # constructor: ( target ) ->
  #   @target = target
  #   return undefined

  #---------------------------------------------------------------------------------------------------------
  get: ( target, key ) ->
    _console.log '^334-1^', key
    return target[ key ]
    # return Reflect.get arguments...

  #---------------------------------------------------------------------------------------------------------
  log: ( P... ) ->
    _console.log '^334-2^', P
    return _console.log P...

  # debug:            ƒ debug()
  # error:            ƒ error()
  # info:             ƒ info()
  # warn:             ƒ warn()

  #---------------------------------------------------------------------------------------------------------
  # assert:           ƒ assert()
  # clear:            ƒ clear()
  # context:          ƒ context()
  # count:            ƒ count()
  # countReset:       ƒ countReset()
  # dir:              ƒ dir()
  # dirxml:           ƒ dirxml()
  # group:            ƒ group()
  # groupCollapsed:   ƒ groupCollapsed()
  # groupEnd:         ƒ groupEnd()
  # memory:           MemoryInfo {totalJSHeapSize: 19300000, usedJSHeapSize: 19300000, jsHeapSizeLimit: 2190000000}
  # profile:          ƒ profile()
  # profileEnd:       ƒ profileEnd()
  # table:            ƒ table()
  # time:             ƒ time()
  # timeEnd:          ƒ timeEnd()
  # timeLog:          ƒ timeLog()
  # timeStamp:        ƒ timeStamp()
  # trace:            ƒ trace()

# globalThis.console  = new Proxy console, new Intercepted_console()
globalThis.log      = console.log
globalThis.µ        = require 'mudom'
# globalThis.DATOM    = require 'datom'
# globalThis.GUY      = require 'guy'
# globalThis.XE       = DATOM.new_xemitter()
# globalThis.ISOTERM  = {}
µ.DOM.ready ->
  log "^65754^ ready"
  µ.body = µ.DOM.select_first 'body'
  return null


#===========================================================================================================
class Vogue_ops

  #---------------------------------------------------------------------------------------------------------
  _XXX_sparkline_get_thin_line: ( trend ) ->
    return Plot.line( trend, {
      x:            'sid',
      y:            'rank',
      stroke:       'red',
      ### TAINT do not use magic numbers ###
      strokeWidth:  1,
      curve:        'catmull-rom' } ) # !
      # curve:        'bump-x' } ) # !
      # curve:        'linear' } )
      # curve:        'cardinal' } )
      # curve:        'natural' } )
      # X curve:        'step' } )
      # X curve:        'basis' } )

  #---------------------------------------------------------------------------------------------------------
  _XXX_sparkline_get_small_dots: ( trend ) ->
    return Plot.dot( trend, {
      x:            'sid',
      y:            'rank',
      stroke:       'red',
      fill:         'transparent',
      ### TAINT do not use magic numbers ###
      strokeWidth:  1, } )

  #---------------------------------------------------------------------------------------------------------
  _sparkline_get_line: ( trend ) ->
    return Plot.line( trend, {
      x:            'sid',
      y:            'rank',
      stroke:       'red',
      ### TAINT do not use magic numbers ###
      strokeWidth:  4,
      curve:        'linear' } )
      # curve:        'step' } )
      # curve:        'cardinal' } )

  #---------------------------------------------------------------------------------------------------------
  _sparkline_get_dots: ( trend ) ->
    return Plot.dot( trend, {
      x:            'sid',
      y:            'rank',
      stroke:       'red',
      fill:         'red',
      ### TAINT do not use magic numbers ###
      strokeWidth:  4, } )

  #---------------------------------------------------------------------------------------------------------
  sparkline_from_trend: ( trend ) ->
    plot_cfg  =
      marks: [
        ( @_sparkline_get_line trend )
        ( @_sparkline_get_dots trend ) ],
      width:      500,
      height:     100,
      ### TAINT do not use magic numbers ###
      x:          { ticks: 12, domain: [ 0, 20, ], step: 1, },
      y:          { ticks: 4, domain: [ 0, 80, ], step: 1, reverse: true, },
      # background: 'green'
      marginLeft: 50
      style:
        backgroundColor: 'transparent'
      # color: {
      #   type: "linear",
      #   scheme: "cividis",
      #   legend: true,
      #   domain: [0, 20],
      #   range: [0, 1] },
      # color: {
      #   legend: true,
      #   width: 554,
      #   columns: '120px', } }
    return Plot.plot plot_cfg

  #---------------------------------------------------------------------------------------------------------
  chart_from_trends: ( trends ) ->
    marks = []
    for trend in trends
      marks.push @_XXX_sparkline_get_thin_line trend
      marks.push @_XXX_sparkline_get_small_dots trend
    plot_cfg  = {
      marks:      marks,
      width:      500,
      height:     500,
      ### TAINT do not use magic numbers ###
      x:          { ticks: 12, domain: [ 0, 20, ], step: 1, },
      y:          { ticks: 4, domain: [ 0, 20, ], step: 1, reverse: true, },
      marginLeft: 50
      style:
        backgroundColor: 'transparent'
      }
      # color: {
      #   type: "linear",
      #   scheme: "cividis",
      #   legend: true,
      #   domain: [0, 20],
      #   range: [0, 1] },
      # color: {
      #   legend: true,
      #   width: 554,
      #   columns: '120px', } }
    return Plot.plot plot_cfg


globalThis.VOGUE = new Vogue_ops()
# log '^ops-early@1^', { VOGUE, }



