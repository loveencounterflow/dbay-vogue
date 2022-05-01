(function() {
  'use strict';
  var CND, DBay, GUY, PATH, SQL, Vogue_common_mixin, _types, badge, debug, echo, help, info, rpr, urge, warn, whisper;

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

  module.exports = Object.assign(module.exports, require('./vogue-db'), require('./vogue-scraper'), require('./vogue-server'));

  //===========================================================================================================
  this.Vogue = class Vogue extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var base, base1, base2, scrapers, server, vdb;
      super();
      //.......................................................................................................
      this.cfg = {...this.defaults.vogue_hub_constructor_cfg, ...cfg};
      if ((base = this.cfg).vdb == null) {
        base.vdb = new module.exports.Vogue_db();
      }
      if ((base1 = this.cfg).server == null) {
        base1.server = new module.exports.Vogue_server();
      }
      if ((base2 = this.cfg).scrapers == null) {
        base2.scrapers = new module.exports.Vogue_scrapers();
      }
      this.types.validate.vogue_hub_constructor_cfg(this.cfg);
      ({vdb} = GUY.obj.pluck_with_fallback(this.cfg, null, 'vdb'));
      GUY.props.hide(this, 'vdb', vdb);
      ({server} = GUY.obj.pluck_with_fallback(this.cfg, null, 'server'));
      GUY.props.hide(this, 'server', server);
      ({scrapers} = GUY.obj.pluck_with_fallback(this.cfg, null, 'scrapers'));
      GUY.props.hide(this, 'scrapers', scrapers);
      this.cfg = GUY.lft.freeze(this.cfg);
      this.vdb._set_hub(this);
      return void 0;
    }

  };

}).call(this);

//# sourceMappingURL=main.js.map