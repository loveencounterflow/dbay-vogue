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
  (require('mixa/lib/check-package-versions'))(require('../pinned-package-versions.json'));

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
      },
      "@isa.nonempty_text x.prefix": function(x) {
        return this.isa.nonempty_text(x.prefix);
      }
    }
  });

  //===========================================================================================================
  this.Scraper = (function() {
    class Scraper {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var base, db;
        this.cfg = {...this.constructor.C.defaults.constructor_cfg, ...cfg};
        if ((base = this.cfg).db == null) {
          base.db = new DBay();
        }
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
        if (typeof this._procure_infrastructure === "function") {
          this._procure_infrastructure();
        }
        if (typeof this._compile_sql === "function") {
          this._compile_sql();
        }
        return void 0;
      }

      // #---------------------------------------------------------------------------------------------------------
      // _set_variables: ->
      //   @db.setv 'allow_change_on_mirror', 0

        //---------------------------------------------------------------------------------------------------------
      _create_sql_functions() {
        var prefix;
        ({prefix} = this.cfg);
        // #-------------------------------------------------------------------------------------------------------
        // @db.create_function
        //   name:           prefix + '_get_rskey'
        //   deterministic:  true
        //   varargs:        false
        //   call:           ( sid, seq ) -> "#{sid}:#{seq}"
        //-------------------------------------------------------------------------------------------------------
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _procure_infrastructure() {
        /* TAINT skip if tables found */
        var prefix;
        ({prefix} = this.cfg);
        this.db.set_foreign_keys_state(false);
        this.db(SQL`drop table  if exists ${prefix}_datasources;
drop table  if exists ${prefix}_sessions;
drop table  if exists ${prefix}_posts;
drop view   if exists ${prefix}_progressions;
drop view   if exists ${prefix}_posts_and_progressions;`);
        this.db.set_foreign_keys_state(true);
        //-------------------------------------------------------------------------------------------------------
        // TABLES
        //.......................................................................................................
        this.db(SQL`create table ${prefix}_datasources (
    dsk     text not null,
    url     text not null,
  primary key ( dsk ) );`);
        //.......................................................................................................
        this.db(SQL`create table ${prefix}_sessions (
    sid     integer not null,
    ts      dt      not null,
  primary key ( sid ) );`);
        //.......................................................................................................
        this.db(SQL`create table ${prefix}_posts (
    dsk     text    not null,
    id      text    not null,
    sid     integer not null,
    seq     integer not null,
    d       json    not null,
  primary key ( dsk, id, sid ),
  foreign key ( dsk ) references ${prefix}_datasources );`);
        //.......................................................................................................
        this.db(SQL`create view ${prefix}_progressions as select distinct
    id                                                  as id,
    json_group_array( json_array( sid, seq ) ) over w as seqs
  from ${prefix}_posts
  window w as (
    partition by ( id )
    order by seq
    range between unbounded preceding and unbounded following );`);
        //.......................................................................................................
        this.db(SQL`create view ${prefix}_posts_and_progressions as select
    posts.dsk                                           as dsk,
    posts.id                                            as id,
    posts.sid                                           as sid,
    posts.seq                                           as seq,
    progressions.seqs                                   as seqs,
    posts.d                                             as d
  from ${prefix}_posts        as posts
  join ${prefix}_progressions as progressions using ( id )
;`);
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _compile_sql() {
        var prefix;
        ({prefix} = this.cfg);
        //.......................................................................................................
        GUY.props.hide(this, 'queries', {
          // #.....................................................................................................
          // get_db_object_count: @db.prepare SQL"""
          //   select count(*) as count from sqlite_schema where starts_with( $name, $prefix || '_' );"""
          //.....................................................................................................
          insert_datasource: this.db.prepare_insert({
            into: `${prefix}_datasources`
          }),
          //.....................................................................................................
          insert_session: this.db.prepare(SQL`with next_free as ( select
    coalesce( max( sid ), 0 ) + 1 as sid
  from ${prefix}_sessions )
insert into ${prefix}_sessions ( sid, ts )
  select sid, std_dt_now() from next_free
  returning *;`),
          //.....................................................................................................
          insert_post: this.db.prepare(SQL`with next_free as ( select
    coalesce( max( seq ), 0 ) + 1 as seq
  from ${prefix}_posts
  where true
    and ( dsk   = $dsk    )
    and ( sid = $sid  ) )
insert into ${prefix}_posts ( dsk, id, sid, seq, d )
  select $dsk, $id, $sid, next_free.seq, $d from next_free
  returning *;`)
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      new_session() {
        return this.db.first_row(this.queries.insert_session);
      }

      new_post(fields) {
        return this.db.first_row(this.queries.insert_post, fields);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Scraper.C = GUY.lft.freeze({
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