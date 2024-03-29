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
      _parse_abs_duration(duration_txt) {
        /* TAINT use `require` instead */
        var dayjs, match;
        dayjs = this.hub.vdb.db._dayjs;
        match = duration_txt.match(this.constructor.C.abs_duration_pattern);
        return (dayjs.duration(match.groups.amount, match.groups.unit)).asMilliseconds();
      }

      //---------------------------------------------------------------------------------------------------------
      _parse_absrel_duration(jitter_txt, reference_ms) {
        var match, percentage;
        if ((match = jitter_txt.match(this.constructor.C.percentage_pattern)) != null) {
          percentage = parseFloat(match.groups.percentage);
          return reference_ms * percentage / 100;
        }
        return this._parse_abs_duration(jitter_txt);
      }

      //---------------------------------------------------------------------------------------------------------
      add_interval(cfg) {
        /* TAINT use `require` instead */
        var d, dayjs, instrumented_task, jitter, jitter_ms, pause, pause_ms, repeat, repeat_ms, task;
        cfg = {...this.defaults.vogue_scheduler_add_interval_cfg, ...cfg};
        dayjs = this.hub.vdb.db._dayjs;
        this.types.validate.vogue_scheduler_add_interval_cfg(cfg);
        ({task, repeat, jitter, pause} = cfg);
        repeat_ms = this._parse_abs_duration(repeat);
        jitter_ms = this._parse_absrel_duration(jitter, repeat_ms);
        pause_ms = this._parse_absrel_duration(pause, repeat_ms);
        d = {
          running: false,
          toutid: null
        };
        //.......................................................................................................
        instrumented_task = async() => {
          var abberation_ms, earliest_dt_ms, eff_dt_ms, extra_dt_ms, run_dt_ms, t0_ms, t1_ms;
          if (d.running) {
            return null;
          }
          //.....................................................................................................
          d.running = true;
          t0_ms = Date.now();
          if (((await task())) === false) {
            //.....................................................................................................
            return null;
          }
          //.....................................................................................................
          d.running = false;
          t1_ms = Date.now();
          run_dt_ms = t1_ms - t0_ms;
          extra_dt_ms = repeat_ms - run_dt_ms;
          earliest_dt_ms = (t1_ms + pause_ms + jitter_ms) - t0_ms;
          eff_dt_ms = Math.max(extra_dt_ms, earliest_dt_ms);
          abberation_ms = (Math.random() * jitter_ms * 2) - jitter_ms;
          eff_dt_ms += abberation_ms;
          d.toutid = this.after(eff_dt_ms / 1000, instrumented_task);
          //.....................................................................................................
          return null;
        };
        //.......................................................................................................
        instrumented_task();
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Vogue_scheduler.C = GUY.lft.freeze({
      abs_duration_pattern: /^(?<amount>(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)\s(?<unit>.+)$/,
      percentage_pattern: /^(?<percentage>(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)%$/,
      duration_units: ['week', 'weeks', 'day', 'days', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds']
    });

    //=========================================================================================================

    //---------------------------------------------------------------------------------------------------------
    Vogue_scheduler.every = GUY.async.every;

    Vogue_scheduler.after = GUY.async.after;

    Vogue_scheduler.sleep = GUY.async.sleep;

    Vogue_scheduler.defer = GUY.async.defer;

    Vogue_scheduler.cease = GUY.async.cease;

    Vogue_scheduler.prototype.every = GUY.async.every;

    Vogue_scheduler.prototype.after = GUY.async.after;

    Vogue_scheduler.prototype.sleep = GUY.async.sleep;

    Vogue_scheduler.prototype.defer = GUY.async.defer;

    Vogue_scheduler.prototype.cease = GUY.async.cease;

    return Vogue_scheduler;

  }).call(this);

}).call(this);

//# sourceMappingURL=vogue-scheduler.js.map