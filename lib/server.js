(function() {
  'use strict';
  var CND, GUY, HTTP, Koa, PATH, Router, Socket_server, _types, badge, debug, echo, file_server, help, info, mount, rpr, urge, warn, whisper;

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

  _types = require('./types');

  //===========================================================================================================
  this.Vogue_server = class Vogue_server {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var client;
      //---------------------------------------------------------------------------------------------------------
      this.start = this.start.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._create_app = this._create_app.bind(this);
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      this._s_log = this._s_log.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_home = this._r_home.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._r_trends = this._r_trends.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._s_default = this._s_default.bind(this);
      GUY.props.hide(this, 'types', _types.types);
      GUY.props.hide(this, 'defaults', _types.defaults);
      //.......................................................................................................
      this.cfg = {...this.defaults.vogue_server_constructor_cfg, ...cfg};
      this.types.validate.vogue_server_constructor_cfg(this.cfg);
      ({client} = GUY.obj.pluck_with_fallback(this.cfg, null, 'client'));
      this.cfg = GUY.lft.freeze(this.cfg);
      //.......................................................................................................
      GUY.props.hide(this, 'client', client);
      GUY.props.hide(this, 'app', new Koa());
      GUY.props.hide(this, 'router', new Router());
      //.......................................................................................................
      return void 0;
    }

    start() {
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
      this.app.use(this._s_log);
      //.......................................................................................................
      this.router.get('home', '/', this._r_home);
      this.router.get('trends', '/trends', this._r_trends);
      //.......................................................................................................
      this.app.use(this.router.routes());
      //.......................................................................................................
      /* thx to https://stackoverflow.com/a/66377342/7568091 */
      debug('^4345^', this.cfg.paths.public);
      debug('^4345^', this.cfg.file_server);
      // @app.use mount '/favicon.ico', file_server @cfg.paths.favicon, @cfg.file_server
      this.app.use(mount('/public', file_server(this.cfg.paths.public, this.cfg.file_server)));
      //.......................................................................................................
      this.app.use(this._s_default);
      this.app.use(this.router.allowedMethods());
      return null;
    }

    async _s_log(ctx, next) {
      var color, line, querystring, ref;
      await next();
      querystring = ((ref = ctx.querystring) != null ? ref.length : void 0) > 1 ? `?${ctx.querystring}` : '';
      // help "^dbay-vogue/server@7^", { method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol, }
      color = ctx.status < 400 ? 'lime' : 'red';
      line = `${ctx.method} ${ctx.origin}${ctx.path}${querystring} -> ${ctx.status} ${ctx.message}`;
      echo(CND.grey("^dbay-vogue/server@7^"), CND[color](line));
      // warn "^dbay-vogue/server@7^", "#{ctx.status} #{ctx.message}"
      return null;
    }

    _r_home(ctx) {
      ctx.body = "DBay Vogue App";
      // help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
      return null;
    }

    _r_trends(ctx) {
      var R, ref, row;
      // urge "^dbay-vogue/server@7^", ctx.router.url 'trends', { query: { foo: 'bar', }, }
      // debug '^34346^', @client
      R = [];
      R.push("<!DOCTYPE html>");
      R.push(`<script src='/public/browserified/mudom.js'></script>
<script src='/public/ops-early.js'></script>
<script src='/public/d3@7.js'></script>
<script src='/public/plot@0.4.js'></script>
<style>
  svg {
    outline: 1px dotted red; }
  td {
    background-color: #ddd;
    white-space: nowrap; }
</style>`);
      R.push("<h3>DBay Vogue App / Trends</h3>");
      R.push("<table>");
      ref = this.client.vogue.db(`select * from scr_trends_html order by sid desc, nr asc;`);
      for (row of ref) {
        R.push(row.html);
      }
      R.push("</table>");
      R.push("<script src='/public/ops-late.js'></script>");
      //.......................................................................................................
      ctx.response.type = 'html';
      ctx.body = R.join('\n');
      return null;
    }

    _s_default(ctx) {
      ctx.response.status = 404;
      ctx.response.type = 'html';
      ctx.body = `<!DOCTYPE html>
<h3>DBay Vogue App / 404 / Not Found</h3>`;
      // ctx.throw 404, "no content under #{ctx.url}"
      // ( ctx.state.greetings ?= [] ).push "helo from content handler"
      return null;
    }

  };

}).call(this);

//# sourceMappingURL=server.js.map