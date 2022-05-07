(function() {
  'use strict';
  var CND, DBay, GUY, H, PATH, SQL, Vogue_common_mixin, badge, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DBAY-VOGUE/DB';

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

  // { HTMLISH: ITXH }         = require 'intertext'
  // URL                       = require 'url'
  // { Html }                  = require './html'
  ({DBay} = require('dbay'));

  ({SQL} = DBay);

  ({Vogue_common_mixin} = require('./vogue-common-mixin'));

  H = require('./helpers');

  //===========================================================================================================
  this.Vogue_db = class Vogue_db extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var base, db;
      super();
      this.cfg = {...this.defaults.vogue_db_constructor_cfg, ...cfg};
      if ((base = this.cfg).db == null) {
        base.db = new DBay();
      }
      this.types.validate.vogue_db_constructor_cfg(this.cfg);
      ({db} = GUY.obj.pluck_with_fallback(this.cfg, null, 'db'));
      GUY.props.hide(this, 'db', db);
      this.cfg = GUY.lft.freeze(this.cfg);
      //.......................................................................................................
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
      GUY.props.hide(this, 'cache', {
        get_html_for: {}
      });
      this.hub = H.property_pending;
      //.......................................................................................................
      return void 0;
    }

    //=========================================================================================================

    //---------------------------------------------------------------------------------------------------------
    // _set_variables: ->
    //   @db.setv 'allow_change_on_mirror', 0

      //---------------------------------------------------------------------------------------------------------
    _create_sql_functions() {
      var prefix;
      ({prefix} = this.cfg);
      //-------------------------------------------------------------------------------------------------------
      this.db.create_function({
        name: prefix + '_get_html_from_purpose',
        deterministic: true,
        varargs: false,
        call: (purpose, dsk, fields) => {
          var method, method_name, scraper;
          this.types.validate.nonempty_text(purpose);
          this.types.validate_optional.text(fields);
          //...................................................................................................
          /* TAINT use caching method, hide implementation details */
          if ((method = this.cache.get_html_for[purpose]) == null) {
            scraper = this.hub.scrapers._scraper_from_dsk(dsk);
            method_name = `html_from_${purpose}`;
            if ((method = scraper[method_name]) == null) {
              throw new Error(`^dbay-scraper@1^ scraper has no method ${rpr(method_name)}`);
            }
            this.cache.get_html_for[method_name] = method;
          }
          if (fields != null) {
            //...................................................................................................
            fields = JSON.parse(fields);
          }
          return method.call(scraper, fields);
        }
      });
      //-------------------------------------------------------------------------------------------------------
      this.db.create_function({
        name: prefix + '_sparkline_data_from_raw_trend',
        deterministic: true,
        varargs: false,
        call: (trend_json) => {
          var dense_trend, i, len, rank, sid, trend;
          trend = JSON.parse(trend_json);
          dense_trend = [];
          for (i = 0, len = trend.length; i < len; i++) {
            [sid, rank] = trend[i];
            dense_trend[sid] = rank;
          }
          //.......................................................................................................
          return JSON.stringify((function() {
            var j, len1, results;
            results = [];
            for (sid = j = 0, len1 = dense_trend.length; j < len1; sid = ++j) {
              rank = dense_trend[sid];
              results.push({sid, rank});
            }
            return results;
          })());
        }
      });
      //-------------------------------------------------------------------------------------------------------
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _procure_infrastructure() {
      /* TAINT skip if tables found */
      var prefix;
      ({prefix} = this.cfg);
      this.db.set_foreign_keys_state(false);
      this.db(SQL`drop table    if exists ${prefix}_datasources;
drop table    if exists ${prefix}_sessions;
drop table    if exists ${prefix}_posts;
drop view     if exists _${prefix}_trends;
drop view     if exists ${prefix}_trends;
drop table    if exists ${prefix}_trends_html;
drop trigger  if exists ${prefix}_on_insert_into_posts;`);
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
    dsk     text    not null,
    ts      dt      not null,
  primary key ( sid ),
  foreign key ( dsk ) references ${prefix}_datasources );`);
      //.......................................................................................................
      this.db(SQL`create table ${prefix}_posts (
    sid     integer not null,
    pid     text    not null,
    rank    integer not null,
    details json    not null,
  primary key ( sid, pid ),
  foreign key ( sid ) references ${prefix}_sessions );`);
      //.......................................................................................................
      this.db(SQL`create table ${prefix}_tags (
    tag     text    not null,
  primary key ( tag ) );`);
      //.......................................................................................................
      this.db(SQL`create table ${prefix}_tagged_posts (
    pid     text    not null,
    tag     text    not null,
  primary key ( pid, tag ),
  -- foreign key ( pid ) references ${prefix}_posts,
  foreign key ( tag ) references ${prefix}_tags );`);
      //.......................................................................................................
      this.db(SQL`create view _${prefix}_trends as select distinct
    sid                                                     as sid,
    pid                                                     as pid,
    ${prefix}_sparkline_data_from_raw_trend(
      json_group_array( json_array( sid, rank ) ) over w )  as trend
  from ${prefix}_posts
  window w as (
    partition by ( pid )
    order by rank
    range between unbounded preceding and current row
    );`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_trends as select
    sessions.dsk                                        as dsk,
    sessions.sid                                        as sid,
    sessions.ts                                         as ts,
    posts.pid                                           as pid,
    posts.rank                                          as rank,
    trends.trend                                        as trend,
    posts.details                                       as details
  from ${prefix}_posts        as posts
  join ${prefix}_sessions     as sessions     using ( sid )
  join _${prefix}_trends      as trends       using ( sid, pid )
  order by
    sid   desc,
    rank  asc;`);
      //.......................................................................................................
      this.db(SQL`create table ${prefix}_trends_html (
    nr        integer not null primary key,
    sid       integer not null,
    html      text    not null,
  foreign key ( sid ) references ${prefix}_sessions );`);
      //.......................................................................................................
      this.db(SQL`create trigger ${prefix}_on_insert_into_posts after insert on ${prefix}_posts
  for each row begin
    insert into ${prefix}_trends_html ( sid, html )
      select
          sid,
          ${prefix}_get_html_from_purpose( 'details', dsk, json_object(
            'dsk',      dsk,
            'sid',      sid,
            'ts',       ts,
            'pid',      pid,
            'rank',     rank,
            'trend',    trend,
            'details',  new.details ) )
        from ${prefix}_trends as trends
        where ( trends.sid = new.sid ) and ( trends.pid = new.pid );
    end;`);
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
insert into ${prefix}_sessions ( sid, dsk, ts )
  select sid, $dsk, std_dt_now() from next_free
  returning *;`),
        //.....................................................................................................
        insert_post: this.db.prepare(SQL`with next_free as ( select
    coalesce( max( rank ), 0 ) + 1 as rank
  from ${prefix}_posts
  where true
    and ( sid = $sid ) )
insert into ${prefix}_posts ( sid, pid, rank, details )
  select $sid, $pid, next_free.rank, $details from next_free
  returning *;`)
      });
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    new_session(dsk) {
      return this.db.first_row(this.queries.insert_session, {dsk});
    }

    new_post(fields) {
      return this.db.first_row(this.queries.insert_post, fields);
    }

  };

}).call(this);

//# sourceMappingURL=vogue-db.js.map