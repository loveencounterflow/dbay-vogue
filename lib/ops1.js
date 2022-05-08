(function() {
  'use strict';
  var Intercepted_console, Vogue_ops, _console;

  _console = console;

  //===========================================================================================================
  Intercepted_console = class Intercepted_console {
    // #---------------------------------------------------------------------------------------------------------
    // constructor: ( target ) ->
    //   @target = target
    //   return undefined

      //---------------------------------------------------------------------------------------------------------
    get(target, key) {
      _console.log('^334-1^', key);
      return target[key];
    }

    // return Reflect.get arguments...

      //---------------------------------------------------------------------------------------------------------
    log(...P) {
      _console.log('^334-2^', P);
      return _console.log(...P);
    }

  };

  // debug:            ƒ debug()
  // error:            ƒ error()
  // info:             ƒ info()
  // warn:             ƒ warn()

  //---------------------------------------------------------------------------------------------------------
  // assert:           ƒ assert()
  // clear:            ƒ clear()
  // context:          ƒ context()
  // count:            ƒ count()
  // countReset:       ƒ countReset()
  // dir:              ƒ dir()
  // dirxml:           ƒ dirxml()
  // group:            ƒ group()
  // groupCollapsed:   ƒ groupCollapsed()
  // groupEnd:         ƒ groupEnd()
  // memory:           MemoryInfo {totalJSHeapSize: 19300000, usedJSHeapSize: 19300000, jsHeapSizeLimit: 2190000000}
  // profile:          ƒ profile()
  // profileEnd:       ƒ profileEnd()
  // table:            ƒ table()
  // time:             ƒ time()
  // timeEnd:          ƒ timeEnd()
  // timeLog:          ƒ timeLog()
  // timeStamp:        ƒ timeStamp()
  // trace:            ƒ trace()

  // globalThis.console  = new Proxy console, new Intercepted_console()
  globalThis.log = console.log;

  globalThis.µ = require('mudom');

  // globalThis.DATOM    = require 'datom'
  // globalThis.GUY      = require 'guy'
  // globalThis.XE       = DATOM.new_xemitter()
  // globalThis.ISOTERM  = {}
  µ.DOM.ready(function() {
    log("^65754^ ready");
    µ.body = µ.DOM.select_first('body');
    return null;
  });

  //===========================================================================================================
  Vogue_ops = class Vogue_ops {
    //---------------------------------------------------------------------------------------------------------
    _XXX_sparkline_get_thin_line(trend) {
      return Plot.line(trend, {
        x: 'sid',
        y: 'rank',
        stroke: 'red',
        strokeWidth: 1,
        curve: 'linear'
      });
    }

    // curve:        'step' } )
    // curve:        'cardinal' } )

      //---------------------------------------------------------------------------------------------------------
    _sparkline_get_line(trend) {
      return Plot.line(trend, {
        x: 'sid',
        y: 'rank',
        stroke: 'red',
        strokeWidth: 4,
        curve: 'linear'
      });
    }

    // curve:        'step' } )
    // curve:        'cardinal' } )

      //---------------------------------------------------------------------------------------------------------
    _sparkline_get_dots(trend) {
      return Plot.dot(trend, {
        x: 'sid',
        y: 'rank',
        stroke: 'red',
        fill: 'red',
        strokeWidth: 4
      });
    }

    //---------------------------------------------------------------------------------------------------------
    sparkline_from_trend(trend) {
      var plot_cfg;
      plot_cfg = {
        marks: [this._sparkline_get_line(trend), this._sparkline_get_dots(trend)],
        width: 500,
        height: 100,
        x: {
          ticks: 12,
          domain: [0, 20],
          step: 1
        },
        y: {
          ticks: 4,
          domain: [0, 80],
          step: 1,
          reverse: true
        },
        marginLeft: 50
      };
      // color: {
      //   type: "linear",
      //   scheme: "cividis",
      //   legend: true,
      //   domain: [0, 20],
      //   range: [0, 1] },
      // color: {
      //   legend: true,
      //   width: 554,
      //   columns: '120px', } }
      return Plot.plot(plot_cfg);
    }

    //---------------------------------------------------------------------------------------------------------
    chart_from_trends(trends) {
      var i, len, marks, plot_cfg, trend;
      marks = [];
      for (i = 0, len = trends.length; i < len; i++) {
        trend = trends[i];
        marks.push(this._XXX_sparkline_get_thin_line(trend));
        marks.push(this._sparkline_get_dots(trend));
      }
      plot_cfg = {
        marks: marks,
        width: 500,
        height: 500,
        x: {
          ticks: 12,
          domain: [0, 20],
          step: 1
        },
        y: {
          ticks: 4,
          domain: [0, 20],
          step: 1,
          reverse: true
        },
        marginLeft: 50
      };
      // color: {
      //   type: "linear",
      //   scheme: "cividis",
      //   legend: true,
      //   domain: [0, 20],
      //   range: [0, 1] },
      // color: {
      //   legend: true,
      //   width: 554,
      //   columns: '120px', } }
      return Plot.plot(plot_cfg);
    }

  };

  globalThis.VOGUE = new Vogue_ops();

  // log '^ops-early@1^', { VOGUE, }

}).call(this);

//# sourceMappingURL=ops1.js.map