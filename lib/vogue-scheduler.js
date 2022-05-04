(function() {
  'use strict';
  var CND, GUY, H, Vogue_common_mixin, badge, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/SCHEDULER';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  (require('mixa/lib/check-package-versions'))(require('../pinned-package-versions.json'));

  GUY = require('guy');

  ({Vogue_common_mixin} = require('./vogue-common-mixin'));

  //...........................................................................................................
  H = require('./helpers');

  //===========================================================================================================
  this.Vogue_scheduler = (function() {
    class Vogue_scheduler extends Vogue_common_mixin() {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        super();
        this.cfg = {...this.defaults.vogue_scheduler_constructor_cfg, ...cfg};
        this.types.validate.vogue_scheduler_constructor_cfg(this.cfg);
        this.cfg = GUY.lft.freeze(this.cfg);
        this.hub = H.property_pending;
        this.rules = [];
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      start() {}

      stop() {}

      //---------------------------------------------------------------------------------------------------------
      add_interval(cfg) {
        var callee, d, dayjs, delta_t_ms, repeat, task;
        cfg = {...this.defaults.vogue_scheduler_add_interval_cfg, ...cfg};
        dayjs = this.hub.vdb.db._dayjs;
        this.types.validate.vogue_scheduler_add_interval_cfg(cfg);
        ({callee, repeat} = cfg);
        repeat = {...(repeat.match(this.constructor.C.duration_pattern)).groups};
        d = {
          running: false
        };
        delta_t_ms = (dayjs.duration(repeat.amount, repeat.unit)).asMilliseconds();
        // debug '^342-1^', { cfg, repeat, delta_t_ms, }
        //.......................................................................................................
        task = async() => {
          /* TAINT what to do when extra_dt is zero, negative? */
          var extra_dt_ms, extra_dt_s, run_dt_ms, t0_ms, t1_ms;
          if (d.running) {
            return null;
          }
          //.....................................................................................................
          d.running = true;
          t0_ms = Date.now();
          if (((await callee())) === false) {
            //.....................................................................................................
            return null;
          }
          //.....................................................................................................
          d.running = false;
          t1_ms = Date.now();
          run_dt_ms = t1_ms - t0_ms;
          extra_dt_ms = delta_t_ms - run_dt_ms;
          extra_dt_s = (dayjs.duration(extra_dt_ms, 'milliseconds')).asSeconds();
          d.ref = this.after(extra_dt_s, task);
          // debug '^342-2^', extra_dt_s
          //.....................................................................................................
          return null;
        };
        //.......................................................................................................
        task();
        return null;
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      every(dts, f) {
        return setInterval(f, dts * 1000);
      }

      after(dts, f) {
        return setTimeout(f, dts * 1000);
      }

      sleep(dts) {
        return new Promise((done) => {
          return setTimeout(done, dts * 1000);
        });
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Vogue_scheduler.C = GUY.lft.freeze({
      duration_pattern: /^(?<amount>[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)\s(?<unit>.+)$/,
      duration_units: ['week', 'weeks', 'day', 'days', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds']
    });

    return Vogue_scheduler;

  }).call(this);

}).call(this);

//# sourceMappingURL=vogue-scheduler.js.map