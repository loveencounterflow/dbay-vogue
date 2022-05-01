(function() {
  'use strict';
  var CND, GUY, H, Vogue_common_mixin, after, badge, debug, echo, every, help, info, rpr, sleep, urge, warn, whisper;

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

  every = function(dts, f) {
    return setInterval(f, dts * 1000);
  };

  after = function(dts, f) {
    return setTimeout(f, dts * 1000);
  };

  sleep = function(dts) {
    return new Promise((done) => {
      return setTimeout(done, dts * 1000);
    });
  };

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

    //---------------------------------------------------------------------------------------------------------
    XXX_get_interval(f) {
      var d, g;
      d = {
        running: false
      };
      // every 0.1, => urge d
      g = async() => {
        if (d.running) {
          return null;
        }
        d.running = true;
        if (((await f())) === false) {
          return null;
        }
        d.running = false;
        d.ref = after(1, g);
        return null;
      };
      g();
      return null;
    }

  };

}).call(this);

//# sourceMappingURL=vogue-scheduler.js.map