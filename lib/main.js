(function() {
  'use strict';
  var CND, DBay, GUY, PATH, SQL, badge, debug, echo, help, info, isa, rpr, type_of, types, urge, validate, validate_list_of, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-SCRAPER';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  PATH = require('path');

  types = new (require('intertype')).Intertype();

  ({isa, type_of, validate, validate_list_of} = types.export());

  GUY = require('guy');

  // { HTMLISH: ITXH }         = require 'intertext'
  // URL                       = require 'url'
  // { Html }                  = require './html'
  ({DBay} = require('dbay'));

  ({SQL} = DBay);

  //===========================================================================================================
  types.declare('constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "( @isa.object x.db ) or ( @isa.function x.db ": function(x) {
        return (this.isa.object(x.db)) || (this.isa.function(x.db));
      }
    }
  });

  //===========================================================================================================
  this.Scraper = (function() {
    class Scraper {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var db;
        this.cfg = {...this.constructor.C.defaults.constructor_cfg, ...cfg};
        GUY.props.hide(this, 'types', types);
        this.types.validate.constructor_cfg(this.cfg);
        ({db} = GUY.obj.pluck_with_fallback(this.cfg, null, 'db'));
        GUY.props.hide(this, 'db', db);
        this.cfg = GUY.lft.freeze(this.cfg);
        this.db.create_stdlib();
        if (typeof this._set_variables === "function") {
          this._set_variables();
        }
        if (typeof this._create_sql_functions === "function") {
          this._create_sql_functions();
        }
        if (typeof this._compile_sql === "function") {
          this._compile_sql();
        }
        if (typeof this._procure_infrastructure === "function") {
          this._procure_infrastructure();
        }
        GUY.props.hide(this, 'html', new Html({
          mrg: this,
          prefix: this.cfg.prefix
        }));
        return void 0;
      }

      // #---------------------------------------------------------------------------------------------------------
      // _set_variables: ->
      //   @db.setv 'allow_change_on_mirror', 0

        // #---------------------------------------------------------------------------------------------------------
      // _create_sql_functions: ->
      //   { prefix } = @cfg
      //   # #-------------------------------------------------------------------------------------------------------
      //   # @db.create_function
      //   #   name:           prefix + '_re_is_blank'
      //   #   deterministic:  true
      //   #   varargs:        false
      //   #   call:           ( txt ) -> if ( /^\s*$/.test txt ) then 1 else 0
      //   #-------------------------------------------------------------------------------------------------------
      //   return null

        //---------------------------------------------------------------------------------------------------------
      _procure_infrastructure() {
        /* TAINT skip if tables found */
        var prefix;
        ({prefix} = this.cfg);
        this.db.set_foreign_keys_state(false);
        this.db(SQL`drop table  if exists ${prefix}_datasources;`);
        this.db.set_foreign_keys_state(true);
        //-------------------------------------------------------------------------------------------------------
        // TABLES
        //.......................................................................................................
        this.db(SQL`create table ${prefix}_datasources (
    dsk     text not null,
    path    text,
    url     text,
    digest  text default null,
  primary key ( dsk ) );`);
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _compile_sql() {
        var prefix;
        ({prefix} = this.cfg);
        //.......................................................................................................
        GUY.props.hide(this, 'sql', {
          //.....................................................................................................
          get_db_object_count: SQL`select count(*) as count from sqlite_schema where starts_with( $name, $prefix || '_' );`
        });
        //.......................................................................................................
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Scraper.C = GUY.lft.freeze({
      /* NOTE may become configurable per instance, per datasource */
      trim_line_ends: true,
      defaults: {
        //.....................................................................................................
        constructor_cfg: {
          db: null,
          prefix: 'scr'
        }
      }
    });

    return Scraper;

  }).call(this);

}).call(this);

//# sourceMappingURL=main.js.map