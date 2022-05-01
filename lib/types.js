(function() {
  'use strict';
  var CND, GUY, PATH, badge, debug, echo, help, info, rpr, urge, warn, whisper;

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
  PATH = require('path');

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
  this.types.declare('vogue_dsk', {
    tests: {
      "@isa.nonempty_text x": function(x) {
        return this.isa.nonempty_text(x);
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
    host: 'localhost',
    port: 3456,
    paths: {
      public: PATH.resolve(__dirname, '../public'),
      favicon: PATH.resolve(__dirname, '../public/favicon.png')
    },
    file_server: {
      // Enable or disable accepting ranged requests. Disabling this will not send Accept-Ranges and ignore the
      // contents of the Range request header. defaults to true.
      acceptRanges: true,
      // Set Cache-Control response header, defaults to undefined, see docs: Cache-Control in MDN.
      cacheControl: void 0,
      // Enable or disable etag generation, defaults to true.
      etag: true,
      // Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
      // defaults to true.
      lastModified: true,
      // Set ignore rules. defaults to undefined. ( path ) => boolean
      ignore: void 0,
      // If true, serves after await next(), allowing any downstream middleware to respond first. defaults to false.
      defer: false
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_db_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "( @isa.object x.db ) or ( @isa.function x.db ": function(x) {
        return (this.isa.object(x.db)) || (this.isa.function(x.db));
      },
      "@isa.nonempty_text x.prefix": function(x) {
        return this.isa.nonempty_text(x.prefix);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_db_constructor_cfg = {
    db: null,
    prefix: 'scr'
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scrapers_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scrapers_constructor_cfg = {};

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scrapers_add_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_dsk x.dsk": function(x) {
        return this.isa.vogue_dsk(x.dsk);
      },
      "@isa.object x.scraper": function(x) {
        return this.isa.object(x.scraper);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scrapers_add_cfg = {
    dsk: null,
    scraper: null
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scraper_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.encoding": function(x) {
        return this.isa.nonempty_text(x.encoding);
      },
      "@isa_optional.nonempty_text x.url": function(x) {
        return this.isa_optional.nonempty_text(x.url);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scraper_constructor_cfg = {
    encoding: 'utf-8',
    url: null
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_hub_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_db x.vdb": function(x) {
        return this.isa.vogue_db(x.vdb);
      },
      "@isa.vogue_server x.server": function(x) {
        return this.isa.vogue_server(x.server);
      },
      "@isa.vogue_scrapers x.scrapers": function(x) {
        return this.isa.vogue_scrapers(x.scrapers);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_hub_constructor_cfg = {
    vdb: null,
    server: null,
    scrapers: null
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_html_or_buffer', {
    tests: {
      "@type_of x in [ 'text', 'buffer', ]": function(x) {
        return this.type_of(x === 'text' || x === 'buffer');
      }
    }
  });

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

}).call(this);

//# sourceMappingURL=types.js.map