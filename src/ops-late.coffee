

'use strict'


#===========================================================================================================
class Vogue_ops

  #---------------------------------------------------------------------------------------------------------
  sparkline_from_trend: ( trend ) ->
    plot_cfg  = {
      marks: [
        Plot.line( trend, {
          x:            'sid',
          y:            'rank',
          stroke:       'red',
          strokeWidth:  4,
          # curve:        'step' } ),
          curve:        'linear' } ),
          # curve:        'cardinal' } ),
        Plot.dot( trend, {
          x:            'sid',
          y:            'rank',
          stroke:       'red',
          fill:         'red',
          strokeWidth:  4, } ),
        ],
      width:      500,
      height:     100,
      x:          { ticks: 12, domain: [ 0, 12, ], step: 1, },
      y:          { ticks: 4, domain: [ 0, 80, ], step: 1, reverse: true, },
      marginLeft: 50 }
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

VOGUE = new Vogue_ops()

