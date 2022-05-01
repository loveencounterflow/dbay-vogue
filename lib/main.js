(function() {
  'use strict';
  var CND, DBay, GUY, PATH, SQL, Vogue_common_mixin, _types, badge, debug, echo, help, info, pluck, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  (require('mixa/lib/check-package-versions'))(require('../pinned-package-versions.json'));

  PATH = require('path');

  GUY = require('guy');

  // { HTMLISH: ITXH }         = require 'intertext'
  // URL                       = require 'url'
  // { Html }                  = require './html'
  ({DBay} = require('dbay'));

  ({SQL} = DBay);

  _types = require('./types');

  ({Vogue_common_mixin} = require('./vogue-common-mixin'));

  pluck = GUY.obj.pluck_with_fallback.bind(GUY.obj);

  module.exports = Object.assign(module.exports, require('./vogue-db'), require('./vogue-scraper'), require('./vogue-scheduler'), require('./vogue-server'));

  //===========================================================================================================
  this.Vogue = class Vogue extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var base, base1, base2, base3, scheduler, scrapers, server, vdb;
      super();
      //.......................................................................................................
      this.cfg = {...this.defaults.vogue_hub_constructor_cfg, ...cfg};
      if ((base = this.cfg).vdb == null) {
        base.vdb = new module.exports.Vogue_db();
      }
      if ((base1 = this.cfg).scrapers == null) {
        base1.scrapers = new module.exports.Vogue_scrapers();
      }
      if ((base2 = this.cfg).scheduler == null) {
        base2.scheduler = new module.exports.Vogue_scheduler();
      }
      if ((base3 = this.cfg).server == null) {
        base3.server = new module.exports.Vogue_server();
      }
      this.types.validate.vogue_hub_constructor_cfg(this.cfg);
      ({vdb} = pluck(this.cfg, null, 'vdb'));
      GUY.props.hide(this, 'vdb', vdb);
      ({scrapers} = pluck(this.cfg, null, 'scrapers'));
      GUY.props.hide(this, 'scrapers', scrapers);
      ({scheduler} = pluck(this.cfg, null, 'scheduler'));
      GUY.props.hide(this, 'scheduler', scheduler);
      ({server} = pluck(this.cfg, null, 'server'));
      GUY.props.hide(this, 'server', server);
      this.cfg = GUY.lft.freeze(this.cfg);
      this.vdb._set_hub(this);
      this.scrapers._set_hub(this);
      this.scheduler._set_hub(this);
      this.server._set_hub(this);
      return void 0;
    }

  };

}).call(this);

//# sourceMappingURL=main.js.map