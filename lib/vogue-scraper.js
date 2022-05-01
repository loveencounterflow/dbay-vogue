(function() {
  'use strict';
  var CND, GUY, H, PATH, Vogue_common_mixin, badge, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/SCRAPER';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  PATH = require('path');

  GUY = require('guy');

  H = require('./helpers');

  ({Vogue_common_mixin} = require('./vogue-common-mixin'));

  //===========================================================================================================
  /* Collection of scrapers */
  this.Vogue_scrapers = class Vogue_scrapers extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      super();
      this.cfg = {...this.defaults.vogue_scrapers_constructor_cfg, ...cfg};
      this.types.validate.vogue_scrapers_constructor_cfg(this.cfg);
      this.cfg = GUY.lft.freeze(this.cfg);
      this.d = {};
      this.hub = H.property_pending;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _scraper_from_dsk(dsk) {
      var R;
      if ((R = this.d[dsk]) == null) {
        throw new Error(`^Vogue_scrapers@1^ no such DSK: ${rpr(dsk)}`);
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    add(cfg) {
      var dsk, scraper;
      cfg = {...this.defaults.vogue_scrapers_add_cfg, ...cfg};
      this.types.validate.vogue_scrapers_add_cfg(cfg);
      ({dsk, scraper} = cfg);
      if (this.d[dsk] != null) {
        throw new Error(`^Vogue_scrapers@1^ DSK already in use: ${rpr(dsk)}`);
      }
      this.d[dsk] = scraper;
      scraper._set_hub(this.hub);
      return null;
    }

  };

  //===========================================================================================================
  /* Individual scraper */
  this.Vogue_scraper = class Vogue_scraper extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      super();
      this.cfg = {...this.defaults.vogue_scraper_constructor_cfg, ...cfg};
      this.types.validate.vogue_scraper_constructor_cfg(this.cfg);
      this.cfg = GUY.lft.freeze(this.cfg);
      this.hub = H.property_pending;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _html_from_html_or_buffer(html_or_buffer) {
      this.types.validate.vogue_html_or_buffer(html_or_buffer);
      if ((this.types.type_of(html_or_buffer)) === 'buffer') {
        return html_or_buffer.toString(this.cfg.encoding);
      }
      return html_or_buffer;
    }

    //---------------------------------------------------------------------------------------------------------
    get_sparkline(trend) {
      var R, dense_trend, i, j, len, len1, rank, sid, values, values_json;
      // # values = [ { sid: -1, rank: -1,  }, ]
      // values = []
      // for [ sid, rank, ] in trend
      //   values.push { sid, rank: -rank, }
      // values.unshift { sid: -1, rank: -1, } if values.length < 2
      //.......................................................................................................
      dense_trend = [];
      for (i = 0, len = trend.length; i < len; i++) {
        [sid, rank] = trend[i];
        dense_trend[sid] = rank;
      }
      // for rank, sid in dense_trend
      //   dense_trend[ sid ] = 21 unless rank?
      // dense_trend.unshift 21 while dense_trend.length < 12
      values = [];
      for (sid = j = 0, len1 = dense_trend.length; j < len1; sid = ++j) {
        rank = dense_trend[sid];
        values.push({sid, rank});
      }
      //.......................................................................................................
      values_json = JSON.stringify(values);
      //.......................................................................................................
      R = `<script>
document.body.append( VOGUE.sparkline_from_trend( ${values_json} ) );
</script>`;
      //.......................................................................................................
      return R;
    }

  };

}).call(this);

//# sourceMappingURL=vogue-scraper.js.map