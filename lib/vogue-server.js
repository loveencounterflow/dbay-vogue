(function() {
  'use strict';
  var CND, FS, GUY, H, HDML, HTTP, Koa, PATH, Router, Socket_server, Vogue_common_mixin, badge, debug, echo, file_server, help, info, mount, ref, rpr, urge, warn, whisper,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/SERVER';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  (require('mixa/lib/check-package-versions'))(require('../pinned-package-versions.json'));

  FS = require('fs');

  PATH = require('path');

  HTTP = require('http');

  GUY = require('guy');

  Koa = require('koa');

  Router = require('@koa/router');

  ({
    Server: Socket_server
  } = require('socket.io'));

  file_server = require('koa-files');

  mount = require('koa-mount');

  ({Vogue_common_mixin} = require('./vogue-common-mixin'));

  H = require('./helpers');

  ({HDML} = require('hdml'));

  //===========================================================================================================
  ref = this.Vogue_server = class Vogue_server extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      super();
      //---------------------------------------------------------------------------------------------------------
      this.start = this.start.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._create_app = this._create_app.bind(this);
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      this._s_log = this._s_log.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._s_layout = this._s_layout.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_home = this._r_home.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_trends = this._r_trends.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_table_by_name = this._r_table_by_name.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._s_default = this._s_default.bind(this);
      this.cfg = {...this.defaults.vogue_server_constructor_cfg, ...cfg};
      this.types.validate.vogue_server_constructor_cfg(this.cfg);
      this._add_layout();
      this.cfg = GUY.lft.freeze(this.cfg);
      this.hub = H.property_pending;
      //.......................................................................................................
      GUY.props.hide(this, 'app', new Koa());
      GUY.props.hide(this, 'router', new Router());
      //.......................................................................................................
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _add_layout() {
      var base, base1, base2, layout, layout_bottom, layout_top, path;
      if ((base = this.cfg).layout == null) {
        base.layout = {};
      }
      if ((this.cfg.layout.top != null) && (this.cfg.layout.bottom != null)) {
        return null;
      }
      path = PATH.resolve(PATH.join(__dirname, '../assets/layout.html'));
      layout = FS.readFileSync(path, {
        encoding: 'utf-8'
      });
      [layout_top, layout_bottom] = layout.split('<%content%>');
      if ((base1 = this.cfg.layout).top == null) {
        base1.top = layout_top;
      }
      if ((base2 = this.cfg.layout).bottom == null) {
        base2.bottom = layout_bottom;
      }
      return null;
    }

    start() {
      boundMethodCheck(this, ref);
      return new Promise((resolve, reject) => {
        var host, port;
        ({host, port} = this.cfg);
        this._create_app();
        //.......................................................................................................
        GUY.props.hide(this, 'http_server', HTTP.createServer(this.app.callback()));
        GUY.props.hide(this, 'io', new Socket_server(this.http_server));
        //.......................................................................................................
        this.io.on('connection', (socket) => {
          help("^dbay-vogue/server@8^ user connected to socket");
          return null;
        });
        //.......................................................................................................
        this.http_server.listen({host, port}, function() {
          debug("^dbay-vogue/server@9^ listening");
          return resolve({host, port});
        });
        //.......................................................................................................
        return null;
      });
    }

    _create_app() {
      boundMethodCheck(this, ref);
      /*
      `_r_*`: managed by router
      `_s_*`: managed by server
      */
      this.app.use(this._s_log);
      this.app.use(this._s_layout);
      //.......................................................................................................
      this.router.get('home', '/', this._r_home);
      this.router.get('trends', '/trends', this._r_trends);
      this.router.get('table_by_name', '/table/:table', this._r_table_by_name);
      //.......................................................................................................
      this.app.use(this.router.routes());
      //.......................................................................................................
      /* thx to https://stackoverflow.com/a/66377342/7568091 */
      debug('^4345^', this.cfg.paths.public);
      debug('^4345^', this.cfg.file_server);
      // @app.use mount '/favicon.ico', file_server @cfg.paths.favicon, @cfg.file_server
      this.app.use(mount('/public', file_server(this.cfg.paths.public, this.cfg.file_server)));
      this.app.use(mount('/src', file_server(this.cfg.paths.src, this.cfg.file_server)));
      //.......................................................................................................
      this.app.use(this._s_default);
      this.app.use(this.router.allowedMethods());
      return null;
    }

    async _s_log(ctx, next) {
      var color, line, querystring, ref1;
      boundMethodCheck(this, ref);
      await next();
      querystring = ((ref1 = ctx.querystring) != null ? ref1.length : void 0) > 1 ? `?${ctx.querystring}` : '';
      // help "^dbay-vogue/server@7^", { method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol, }
      color = ctx.status < 400 ? 'lime' : 'red';
      line = `${ctx.method} ${ctx.origin}${ctx.path}${querystring} -> ${ctx.status} ${ctx.message}`;
      echo(CND.grey("^dbay-vogue/server@7^"), CND[color](line));
      // warn "^dbay-vogue/server@7^", "#{ctx.status} #{ctx.message}"
      return null;
    }

    async _s_layout(ctx, next) {
      var ref1;
      boundMethodCheck(this, ref);
      await next();
      if ((ctx.type === 'text/html') && (!((ref1 = ctx.body) != null ? typeof ref1.startswith === "function" ? ref1.startswith("<!DOCTYPE html>") : void 0 : void 0))) {
        ctx.body = this.cfg.layout.top + ctx.body + this.cfg.layout.bottom;
      }
      return null;
    }

    _r_home(ctx) {
      boundMethodCheck(this, ref);
      ctx.body = "DBay Vogue App";
      // help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
      return null;
    }

    _r_trends(ctx) {
      /* TAINT iterate or use stream */
      /* TAINT chart is per-DSK but trends table is global */
      var R, dsk, ref1, scraper, table, x;
      boundMethodCheck(this, ref);
      R = [];
      ref1 = this.hub.scrapers._XXX_walk_scrapers();
      for (x of ref1) {
        ({dsk, scraper} = x);
        R.push(scraper._XXX_get_details_chart({dsk}));
      }
      // R.push scraper._XXX_get_details_table { dsk, }
      table = this.hub_get_table_name('trends');
      R.push(this.hub.vdb.as_html({table}));
      //.......................................................................................................
      ctx.response.type = 'html';
      ctx.body = R.join('\n');
      return null;
    }

    _r_table_by_name(ctx) {
      /* TAINT this functionality probably misplaced; done here for POC */
      var prefix, ref1, table, table_cfg, table_cfgs;
      boundMethodCheck(this, ref);
      /* TAINT iterate or use stream */
      ctx.response.type = 'html';
      ({table} = ctx.params);
      if (table == null) {
        table = "NO SUCH TABLE";
      }
      //.......................................................................................................
      /* TAINT use API call to get actual table name */
      ({prefix} = this.hub.vdb.cfg);
      table_cfgs = {
        [`${prefix}_trends`]: {
          fields: {
            //.................................................................................................
            dsk: {
              display: false
            },
            //.................................................................................................
            ts: {
              format: (ts) => {
                return this.hub.vdb.db.dt_format(ts, 'YYYY-MM-DD HH:mm UTC');
              }
            },
            //.................................................................................................
            raw_trend: {
              title: "Trend",
              html: (raw_trend) => {
                return HDML.pair('td.trend.sparkline', {
                  'data-trend': raw_trend
                });
              }
            },
            //.................................................................................................
            details: {
              title: "Trend",
              html: (details) => {
                var R, d, error, k, v;
                try {
                  d = JSON.parse(details);
                } catch (error1) {
                  error = error1;
                  return HDML.pair('div.error', HDML.text(error.message));
                }
                R = [];
                R.push(HDML.open('table.details'));
                for (k in d) {
                  v = d[k];
                  R.push(HDML.open('tr'));
                  R.push(HDML.pair('th', HDML.text(k)));
                  R.push(HDML.pair('td', HDML.text(v)));
                  R.push(HDML.close('tr'));
                }
                R.push(HDML.close('table'));
                return HDML.pair('td.details', R.join(''));
              }
            }
          }
        }
      };
      table_cfg = (ref1 = table_cfgs[table]) != null ? ref1 : null;
      //.......................................................................................................
      ctx.body = `<h1>Table ${table}</h1>\n` + this.hub.vdb.as_html({table, ...table_cfg});
      return null;
    }

    _s_default(ctx) {
      boundMethodCheck(this, ref);
      ctx.response.status = 404;
      ctx.response.type = 'html';
      ctx.body = "<h3>DBay Vogue App / 404 / Not Found</h3>";
      // ctx.throw 404, "no content under #{ctx.url}"
      // ( ctx.state.greetings ?= [] ).push "helo from content handler"
      return null;
    }

  };

}).call(this);

//# sourceMappingURL=vogue-server.js.map