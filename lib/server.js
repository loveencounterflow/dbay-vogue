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

  // #-----------------------------------------------------------------------------------------------------------
  // app.use ( ctx, next ) =>
  //   debug "^dbay-vogue/server@1^ dt-1 before"
  //   await next()
  //   debug "^dbay-vogue/server@2^ dt-1 after"
  //   rt = ctx.response.get 'X-Response-Time'
  //   help "^dbay-vogue/server@3^ #{ctx.method} #{ctx.url}; dt: #{rt}"
  //   help "^dbay-vogue/server@4^", ctx.state
  //   return null
  // #...........................................................................................................
  // app.use ( ctx, next ) =>
  //   debug "^dbay-vogue/server@5^ dt-2 before"
  //   start = Date.now()
  //   await next()
  //   debug "^dbay-vogue/server@6^ dt-2 after"
  //   ms    = Date.now() - start
  //   ctx.set 'X-Response-Time', "#{ms} ms"
  //   ( ctx.state.greetings ?= [] ).push "helo from X-Response-Time setter"
  //   return null

  // #-----------------------------------------------------------------------------------------------------------
  // file_server_cfg =
  //   # Enable or disable accepting ranged requests. Disabling this will not send Accept-Ranges and ignore the
  //   # contents of the Range request header. defaults to true.
  //   acceptRanges:     true
  //   # Set Cache-Control response header, defaults to undefined, see docs: Cache-Control in MDN.
  //   cacheControl:     undefined
  //   # Enable or disable etag generation, defaults to true.
  //   etag:             true
  //   # Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
  //   # defaults to true.
  //   lastModified:     true
  //   # Set ignore rules. defaults to undefined. ( path ) => boolean
  //   ignore:           undefined
  //   # If true, serves after await next(), allowing any downstream middleware to respond first. defaults to false.
  //   defer:            false

  // #-----------------------------------------------------------------------------------------------------------
  // paths =
  //   public:   PATH.resolve __dirname, '../public'
  // ### thx to https://stackoverflow.com/a/66377342/7568091 ###
  // app.use mount '/public', file_server paths.public, file_server_cfg

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
      this.router.get('home', '/', this._r_home);
      this.router.get('trends', '/', this._r_trends);
      //.......................................................................................................
      this.app.use(this.router.routes());
      this.app.use(this._s_default);
      this.app.use(this.router.allowedMethods());
      return null;
    }

    _s_log(ctx, next) {
      var host, hostname, href, method, origin, originalUrl, path, protocol, query, querystring, url;
      ({method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol} = ctx);
      if (querystring == null) {
        querystring = '';
      }
      if (querystring.length > 1) {
        querystring = `?${querystring}`;
      }
      // help "^dbay-vogue/server@7^", { method, url, originalUrl, origin, href, path, query, querystring, host, hostname, protocol, }
      help("^dbay-vogue/server@7^", `${method} ${origin}${path}${querystring}`);
      next();
      return null;
    }

    _r_home(ctx) {
      ctx.body = "DBay Vogue App";
      // help "^dbay-vogue/server@7^", ctx.router.url 'home', { query: { foo: 'bar', }, }
      return null;
    }

    _r_trends(ctx) {
      ctx.body = "DBay Vogue App / Trends";
      urge("^dbay-vogue/server@7^", ctx.router.url('trends', {
        query: {
          foo: 'bar'
        }
      }));
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