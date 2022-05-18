(function() {
  'use strict';
  var CND, GUY, PATH, badge, debug, echo, help, info, rpr, urge, warn, whisper,
    indexOf = [].indexOf;

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
  this.types.declare('vogue_sid', {
    tests: {
      "@isa.positive_integer x": function(x) {
        return this.isa.positive_integer(x);
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
      favicon: PATH.resolve(__dirname, '../public/favicon.png'),
      src: PATH.resolve(__dirname, '../src')
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
    prefix: 'vogue'
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
  this.types.declare('vogue_scraper__XXX_get_details_chart_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_dsk x.dsk": function(x) {
        return this.isa.vogue_dsk(x.dsk);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scraper__XXX_get_details_chart_cfg = {
    dsk: null
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scraper__XXX_get_details_table_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_dsk x.dsk": function(x) {
        return this.isa.vogue_dsk(x.dsk);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scraper__XXX_get_details_table_cfg = {
    dsk: null
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
  this.types.declare('vogue_scheduler_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scheduler_constructor_cfg = {};

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scheduler_abs_duration', {
    tests: {
      "@isa.nonempty_text x": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x matches float, unit regex": function(x) {
        var match, pattern, ref, units;
        pattern = (require('./vogue-scheduler')).Vogue_scheduler.C.abs_duration_pattern;
        units = (require('./vogue-scheduler')).Vogue_scheduler.C.duration_units;
        if ((match = x.match(pattern)) == null) {
          return false;
        }
        if (ref = match.groups.unit, indexOf.call(units, ref) < 0) {
          return false;
        }
        return true;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scheduler_rel_duration', {
    tests: {
      "@isa.nonempty_text x": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x matches precentage pattern": function(x) {
        var match, pattern;
        pattern = (require('./vogue-scheduler')).Vogue_scheduler.C.percentage_pattern;
        return (match = x.match(pattern)) != null;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scheduler_absrel_duration', function(x) {
    if (this.isa.vogue_scheduler_abs_duration(x)) {
      return true;
    }
    if (this.isa.vogue_scheduler_rel_duration(x)) {
      return true;
    }
    return false;
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scheduler_task', function(x) {
    if (this.isa.function(x)) {
      return true;
    }
    if (this.isa.asyncfunction(x)) {
      return true;
    }
    return false;
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_scheduler_add_interval_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_scheduler_task x.task": function(x) {
        return this.isa.vogue_scheduler_task(x.task);
      },
      "@isa.vogue_scheduler_abs_duration x.repeat": function(x) {
        return this.isa.vogue_scheduler_abs_duration(x.repeat);
      },
      "@isa.vogue_scheduler_absrel_duration x.jitter": function(x) {
        return this.isa.vogue_scheduler_absrel_duration(x.jitter);
      },
      // "@isa.vogue_scheduler_absrel_duration x.timeout":   ( x ) -> @isa.vogue_scheduler_abs_duration x.timeout
      "@isa.vogue_scheduler_absrel_duration x.pause": function(x) {
        return this.isa.vogue_scheduler_absrel_duration(x.pause);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_scheduler_add_interval_cfg = {
    task: null,
    repeat: null,
    jitter: '0 seconds',
    pause: '0 seconds'
  };

  // timeout:          null

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_html_or_buffer', {
    tests: {
      "@type_of x in [ 'text', 'buffer', ]": function(x) {
        return this.type_of(x === 'text' || x === 'buffer');
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_db_trends_data_json_from_dsk_sid_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.vogue_dsk x.dsk": function(x) {
        return this.isa.vogue_dsk(x.dsk);
      },
      "@isa_optional.vogue_sid x.sid": function(x) {
        return this.isa_optional.vogue_sid(x.sid);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_db_trends_data_json_from_dsk_sid_cfg = {
    dsk: null,
    sid: null
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_db_as_html_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.table": function(x) {
        return this.isa.nonempty_text(x.table);
      },
      "@isa_optional.vogue_db_fieldset_cfg x.fields": function(x) {
        return this.isa_optional.vogue_db_fieldset_cfg(x.fields);
      }
    }
  });

  //...........................................................................................................
  this.defaults.vogue_db_as_html_cfg = {
    table: null,
    fields: GUY.lft.freeze({})
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_db_fieldset_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "each value is a vogue_db_field_description": function(x) {
        var _, value;
        for (_ in x) {
          value = x[_];
          if (!this.isa.vogue_db_field_description(value)) {
            return false;
          }
        }
        return true;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('vogue_db_field_description', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa_optional.function x.format": function(x) {
        return this.isa_optional.function(x.format);
      },
      "@isa_optional.function x.html": function(x) {
        return this.isa_optional.function(x.html);
      },
      "@isa_optional.text x.title": function(x) {
        return this.isa_optional.text(x.title);
      },
      "@isa_optional.boolean x.display": function(x) {
        return this.isa_optional.boolean(x.display);
      }
    }
  });

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

}).call(this);

//# sourceMappingURL=types.js.map