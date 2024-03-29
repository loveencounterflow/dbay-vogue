(function() {
  'use strict';
  var CND, FS, GUY, H, HDML, HTTP, Koa, PATH, Router, SQL, Socket_server, Vogue_common_mixin, badge, debug, echo, file_server, help, info, mount, ref, rpr, summarize, tabulate, urge, warn, whisper,
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

  ({SQL} = (require('dbay')).DBay);

  ({tabulate, summarize} = require('dbay-tabulator'));

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
      this._s_default = this._s_default.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_home = this._r_home.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_trends = this._r_trends.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_table_by_name = this._r_table_by_name.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._get_dsk_form = this._get_dsk_form.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._query_as_html = this._query_as_html.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._table_as_html = this._table_as_html.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._get_table_cfg = this._get_table_cfg.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._set_table_cfgs = this._set_table_cfgs.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_layout_demo = this._r_layout_demo.bind(this);
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
      this.router.get('layout-demo', '/layout-demo', this._r_layout_demo);
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

    _s_default(ctx) {
      boundMethodCheck(this, ref);
      ctx.response.status = 404;
      ctx.response.type = 'html';
      ctx.body = "<h3>DBay Vogue App / 404 / Not Found</h3>";
      // ctx.throw 404, "no content under #{ctx.url}"
      // ( ctx.state.greetings ?= [] ).push "helo from content handler"
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
      var R, dsk, parameters, query, ref1, ref2, ref3, scraper, table_name_i, trends_table_name, x;
      boundMethodCheck(this, ref);
      R = [];
      trends_table_name = this.hub.vdb._get_table_name('trends');
      R.push(this._get_dsk_form((ref1 = ctx.query.dsk) != null ? ref1 : ''));
      //.......................................................................................................
      if ((ref2 = ctx.query.dsk) === '' || ref2 === (void 0)) {
        ref3 = this.hub.scrapers._XXX_walk_scrapers();
        for (x of ref3) {
          ({dsk, scraper} = x);
          R.push(scraper._XXX_get_details_chart({dsk}));
        }
        // R.push scraper._XXX_get_details_table { dsk, }
        R.push(this._table_as_html(trends_table_name));
      } else if ((scraper = this.hub.scrapers._scraper_from_dsk(ctx.query.dsk, null)) != null) {
        table_name_i = this.hub.vdb.db.sql.I(trends_table_name);
        query = SQL`select * from ${table_name_i} where dsk = $dsk order by rank;`;
        parameters = {
          dsk: ctx.query.dsk
        };
        R.push(scraper._XXX_get_details_chart({
          dsk: ctx.query.dsk
        }));
        R.push(this._query_as_html(trends_table_name, query, parameters));
      } else {
        /* TAINT use correct error handling */
        R.push(HDML.pair('div.error', HDML.text(`no such data source: ${rpr(ctx.query.dsk)}`)));
      }
      //.......................................................................................................
      ctx.response.type = 'html';
      ctx.body = R.join('\n');
      return null;
    }

    _r_table_by_name(ctx) {
      var R, public_table_name, table;
      boundMethodCheck(this, ref);
      public_table_name = ctx.params.table;
      table = this.hub.vdb._get_table_name(public_table_name);
      R = [];
      R.push(HDML.pair('h1', HDML.text(public_table_name)));
      R.push(this._table_as_html(table));
      //.......................................................................................................
      ctx.response.type = 'html';
      ctx.body = R.join('\n');
      return null;
    }

    _get_dsk_form(selected = '') {
      var R, atrs, dsk, label, ref1, url, x;
      boundMethodCheck(this, ref);
      R = [];
      //.......................................................................................................
      R.push(HDML.open('nav'));
      R.push(HDML.open('form', {
        method: 'GET',
        action: '/trends'
      }));
      R.push(HDML.pair('label', {
        for: 'dsk'
      }, "Data Source:"));
      R.push(HDML.open('select', {
        name: 'dsk',
        id: 'dsk',
        onchange: "this.form.submit();"
      }));
      R.push(HDML.pair('option', {
        value: ''
      }, HDML.text("Select a Data Source")));
      ref1 = this.hub.vdb._walk_datasources();
      for (x of ref1) {
        ({dsk, url} = x);
        label = `${dsk} (${url})`;
        atrs = {
          value: dsk
        };
        if (selected === dsk) {
          atrs.selected = 'true';
        }
        R.push(HDML.pair('option', atrs, HDML.text(label)));
      }
      R.push(HDML.close('select'));
      R.push(HDML.pair('button', {
        type: 'submit'
      }, HDML.text("submit")));
      R.push(HDML.close('form'));
      R.push(HDML.close('nav'));
      return R.join('\n');
    }

    _query_as_html(table, query, parameters) {
      var rows, table_cfg;
      boundMethodCheck(this, ref);
      table_cfg = this._get_table_cfg(table);
      rows = this.hub.vdb.db(query, parameters);
      return tabulate({rows, ...table_cfg});
    }

    _table_as_html(table) {
      var query, rows, table_cfg;
      boundMethodCheck(this, ref);
      table_cfg = this._get_table_cfg(table);
      query = SQL`select * from ${this.hub.vdb.db.sql.I(table)};`;
      rows = this.hub.vdb.db(query);
      return tabulate({rows, ...table_cfg});
    }

    _get_table_cfg(table) {
      var ref1;
      boundMethodCheck(this, ref);
      if (this.table_cfgs == null) {
        this._set_table_cfgs();
      }
      return (ref1 = this.table_cfgs[table]) != null ? ref1 : null;
    }

    _set_table_cfgs() {
      boundMethodCheck(this, ref);
      GUY.props.hide(this, 'table_cfgs', {});
      //.......................................................................................................
      this.table_cfgs[this.hub.vdb._get_table_name('trends')] = {
        fields: {
          //...................................................................................................
          dsk: {
            hide: true
          },
          //...................................................................................................
          sid_min: {
            hide: true
          },
          sid_max: {
            title: "SIDs",
            inner_html: (d) => {
              var sid_max, sid_min;
              ({sid_min, sid_max} = d.row);
              if (sid_min === sid_max) {
                return sid_min;
              }
              return `${sid_min}—${sid_max}`;
            }
          },
          //...................................................................................................
          ts: {
            inner_html: (d) => {
              return this.hub.vdb.db.dt_format(d.value, 'YYYY-MM-DD HH:mm UTC');
            }
          },
          //...................................................................................................
          raw_trend: {
            title: "Trend",
            outer_html: ({
                value: raw_trend
              }) => {
              return HDML.pair('td.trend.sparkline', {
                'data-trend': raw_trend
              });
            }
          },
          //...................................................................................................
          details: {
            inner_html: (d) => {
              var cfg, error, row;
              try {
                row = JSON.parse(d.value);
              } catch (error1) {
                error = error1;
                return HDML.pair('div.error', HDML.text(error.message));
              }
              cfg = {
                row: row,
                fields: {
                  title: {
                    title: "Title",
                    inner_html: ({
                        value: title,
                        row
                      }) => {
                      return HDML.pair('a', {
                        href: row.title_url
                      }, HDML.text(title));
                    }
                  },
                  title_url: {
                    hide: true
                  },
                  article: {
                    title: "Article",
                    inner_html: ({
                        value: title,
                        row
                      }) => {
                      if (title == null) {
                        return Symbol.for('hide');
                      }
                      if (row.article_url == null) {
                        return Symbol.for('hide');
                      }
                      return HDML.pair('a', {
                        href: row.article_url
                      }, HDML.text(title));
                    }
                  },
                  article_url: {
                    hide: true
                  }
                }
              };
              return summarize(cfg);
            }
          }
        }
      };
      return null;
    }

    _r_layout_demo(ctx) {
      var R;
      boundMethodCheck(this, ref);
      R = [];
      //.......................................................................................................
      R.push(HDML.open('nav'));
      R.push(HDML.open('menu'));
      R.push(HDML.pair('li', HDML.pair('a', {
        href: '#'
      }, HDML.text("one"))));
      R.push(HDML.pair('li', HDML.pair('a', {
        href: '#'
      }, HDML.text("two"))));
      R.push(HDML.pair('li', HDML.pair('a', {
        href: '#'
      }, HDML.text("three"))));
      R.push(HDML.close('menu'));
      R.push(HDML.close('nav'));
      //.......................................................................................................
      R.push(HDML.pair('header', HDML.text("header")));
      //.......................................................................................................
      R.push(HDML.open('main'));
      R.push(HDML.open('article'));
      R.push(HDML.text("article"));
      R.push(HDML.close('article'));
      R.push(HDML.close('main'));
      //.......................................................................................................
      R.push(HDML.pair('footer', HDML.text("footer")));
      //.......................................................................................................
      ctx.response.type = 'html';
      ctx.body = R.join('\n');
      return null;
    }

  };

}).call(this);

//# sourceMappingURL=vogue-server.js.map