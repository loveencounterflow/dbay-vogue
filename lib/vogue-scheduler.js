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
  this.Vogue_scheduler = class Vogue_scheduler extends Vogue_common_mixin() {
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
      var amount, callee, d, g, unit;
      cfg = {...this.defaults.vogue_scheduler_add_interval_cfg, ...cfg};
      this.types.validate.vogue_scheduler_add_interval_cfg(cfg);
      ({callee, amount, unit} = cfg);
      d = {
        running: false
      };
      //.......................................................................................................
      g = async() => {
        if (d.running) {
          return null;
        }
        d.running = true;
        if (((await callee())) === false) {
          return null;
        }
        d.running = false;
        d.ref = this.after(1, g);
        return null;
      };
      //.......................................................................................................
      g();
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

}).call(this);

//# sourceMappingURL=vogue-scheduler.js.map