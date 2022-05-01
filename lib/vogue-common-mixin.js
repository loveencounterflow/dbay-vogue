(function() {
  'use strict';
  var CND, GUY, H, _types, badge, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/DB';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  GUY = require('guy');

  _types = require('./types');

  H = require('./helpers');

  //===========================================================================================================
  this.Vogue_common_mixin = (clasz = Object) => {
    return class extends clasz {
      //---------------------------------------------------------------------------------------------------------
      constructor() {
        super();
        GUY.props.hide(this, 'types', _types.types);
        GUY.props.hide(this, 'defaults', _types.defaults);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _set_hub(hub) {
        if (this.hub !== H.property_pending) {
          throw new Error(`^Vogue_common_mixin@1^ unable to set hub on a ${this.types.type_of(this)}`);
        }
        GUY.props.hide(this, 'hub', hub);
        return null;
      }

    };
  };

}).call(this);

//# sourceMappingURL=vogue-common-mixin.js.map