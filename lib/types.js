(function() {
  'use strict';
  var CND, GUY, badge, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/TYPES';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  GUY = require('guy');

  this.types = new (require('intertype')).Intertype();

  this.defaults = {};

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_host', {
    tests: {
      "@isa.nonempty_text x": function(x) {
        return this.isa.nonempty_text(x);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_port', {
    tests: {
      "@isa.positive_integer x": function(x) {
        return this.isa.positive_integer(x);
      },
      "1024 <= x <= 65535": function(x) {
        return (1024 <= x && x <= 65535);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_server_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      // "( @isa.object x.db ) or ( @isa.function x.db ":  ( x ) -> ( @isa.object x.db ) or ( @isa.function x.db )
      "@isa.vogue_host x.host": function(x) {
        return this.isa.vogue_host(x.host);
      },
      "@isa.vogue_port x.port": function(x) {
        return this.isa.vogue_port(x.port);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_server_constructor_cfg = {
    client: null,
    host: 'localhost',
    port: 3456
  };

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

}).call(this);

//# sourceMappingURL=types.js.map