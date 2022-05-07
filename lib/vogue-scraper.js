(function() {
  'use strict';
  var CND, GUY, H, HDML, PATH, Vogue_common_mixin, badge, debug, echo, help, info, rpr, urge, warn, whisper;

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

  ({HDML} = require('hdml'));

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
    * _XXX_walk_scrapers() {
      var dsk, ref, scraper;
      ref = this.d;
      for (dsk in ref) {
        scraper = ref[dsk];
        yield ({dsk, scraper});
      }
      return null;
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
  this.Vogue_scraper_ABC = class Vogue_scraper_ABC extends Vogue_common_mixin() {
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
    /* NOTE liable to change */
    _XXX_get_details_table() {
      var R, ref, row, tds;
      R = [];
      R.push(HDML.pair('h3', HDML.text("DBay Vogue App / Trends")));
      R.push(HDML.open('table#trends'));
      //.......................................................................................................
      tds = [
        HDML.pair('th',
        HDML.text("DSK")),
        HDML.pair('th',
        HDML.text("SID")),
        HDML.pair('th',
        HDML.text("ID")),
        HDML.pair('th',
        HDML.text("TS")),
        HDML.pair('th',
        HDML.text("Rank")),
        HDML.pair('th',
        HDML.text("Sparkline")),
        // HDML.pair 'th', HDML.text "Trend"
        HDML.pair('th',
        HDML.text("Title"))
      ];
      R.push(HDML.pair('tr', tds.join('')));
      ref = this.hub.vdb.db(`select * from scr_trends_html order by sid desc, nr asc;`);
      //.......................................................................................................
      for (row of ref) {
        R.push(row.html);
      }
      R.push(HDML.close('table'));
      return R.join('\n');
    }

    //---------------------------------------------------------------------------------------------------------
    html_from_details(row) {
      var details, dsk, dsk_html, id_html, pid, rank, rank_html, sid, sid_html, tds, title_html, trend, trend_json, ts, ts_html;
      ({dsk, sid, ts, pid, rank, trend, details} = row);
      //.......................................................................................................
      trend = JSON.parse(trend);
      details = JSON.parse(details);
      dsk_html = HDML.text(dsk);
      sid_html = HDML.text(`${sid}`);
      ts_html = HDML.text(ts);
      id_html = HDML.text(pid);
      rank_html = HDML.text(`${rank}`);
      trend_json = JSON.stringify(trend);
      title_html = HDML.pair('a', {
        href: details.title_url
      }, HDML.text(details.title));
      //.......................................................................................................
      tds = [
        HDML.pair('td.dsk',
        dsk_html),
        HDML.pair('td.sid',
        sid_html),
        HDML.pair('td.id',
        id_html),
        HDML.pair('td.ts',
        ts_html),
        HDML.pair('td.rank',
        rank_html),
        HDML.pair('td.sparkline',
        {
          'data-trend': trend_json
        }),
        // HDML.pair 'td.trend', trend_html
        HDML.pair('td.title',
        title_html)
      ];
      //.......................................................................................................
      return HDML.pair('tr', null, tds.join('\n'));
    }

  };

}).call(this);

//# sourceMappingURL=vogue-scraper.js.map