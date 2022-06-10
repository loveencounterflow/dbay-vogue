(function() {
  'use strict';
  var CND, DBay, GUY, H, HDML, PATH, SQL, Vogue_common_mixin, XXX_cfg_replacement, badge, debug, echo, help, info, rpr, urge, warn, whisper;

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

  ({HDML} = require('hdml'));

  XXX_cfg_replacement = {
    chart_history_length: 20
  };

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
    _procure_infrastructure() {
      /* TAINT skip if tables found */
      var prefix;
      ({prefix} = this.cfg);
      this.db.set_foreign_keys_state(false);
      this.db(SQL`drop table  if exists ${prefix}_datasources;
drop table  if exists ${prefix}_sessions;
drop table  if exists ${prefix}_posts;
drop view   if exists ${prefix}_XXX_ranks;
drop view   if exists ${prefix}_XXX_grouped_ranks;
drop view   if exists ${prefix}_trends;`);
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
      this.db(SQL`create view ${prefix}_XXX_ranks as select
    session.dsk                                           as dsk,
    post.sid                                              as sid,
    post.pid                                              as pid,
    post.rank                                             as rank,
    coalesce( post.pid != lag(  post.pid ) over w, true ) as first,
    coalesce( post.pid != lead( post.pid ) over w, true ) as last
  from ${prefix}_posts    as post
  join ${prefix}_sessions as session using ( sid )
  window w as (
    partition by pid
    order by sid )
  order by sid, pid;`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_XXX_grouped_ranks as select distinct
    pid                                       as pid,
    min( sid ) over w                         as sid_min,
    max( sid ) over w                         as sid_max,
    json_group_array( json_object(
      'dsk',    dsk,
      'pid',    pid,
      'sid',    sid,
      'rank',   rank,
      'first',  first,
      'last',   last ) ) over w               as xxx_trend
  from ${prefix}_XXX_ranks
  window w as (
    partition by pid
    order by sid
    range between unbounded preceding and unbounded following )
  order by pid;`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_trends as select
    sessions.dsk                                        as dsk,
    trends.sid_min                                      as sid_min, -- 'first seen' in session SID_*min*
    trends.sid_max                                      as sid_max, -- 'last  seen' in session SID_*max*
    sessions.ts                                         as ts,
    posts.pid                                           as pid,
    posts.rank                                          as rank,
    trends.xxx_trend                                    as raw_trend,
    posts.details                                       as details
  from ${prefix}_posts              as posts
  join ${prefix}_sessions           as sessions     using ( sid )
  join ${prefix}_XXX_grouped_ranks  as trends       using ( pid )
  where true
    and ( sessions.sid = trends.sid_max )
  order by
    sid   desc,
    rank  asc;`);
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
  select sid, $dsk, $ts from next_free
  returning *;`),
        //.....................................................................................................
        insert_post: this.db.prepare(SQL`with next_free as ( select
    coalesce( max( rank ), 0 ) + 1 as rank
  from ${prefix}_posts
  where true
    and ( sid = $sid ) )
insert into ${prefix}_posts ( sid, pid, rank, details )
  select $sid, $pid, next_free.rank, $details from next_free
  returning *;`),
        //.......................................................................................................
        trend_from_sid_pid: this.db.prepare(SQL`select
    raw_trend
  from ${prefix}_trends
  where true
    and ( $sid between sid_min and sid_max )
    and ( pid = $pid );`),
        //.......................................................................................................
        trends_from_dsk_sid: this.db.prepare(SQL`select
    raw_trend
  from ${prefix}_trends where true
    and ( dsk = $dsk )
    -- and ( sid = $sid );`),
        //.......................................................................................................
        /* Given a datasource (identified as DSK), return the last session (identified as SID) for that
             datasource */
        sid_max_from_dsk: this.db.prepare(SQL`select
    max( sid_max ) as sid_max
  from ${prefix}_trends where true
    and ( dsk = $dsk );`)
      });
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    new_session(dsk) {
      /* TAINT validate */
      /* TAINT use `cfg` API convention */
      var ts;
      ts = this.db.dt_now();
      return this.db.first_row(this.queries.insert_session, {dsk, ts});
    }

    //---------------------------------------------------------------------------------------------------------
    new_post(fields) {
      /* TAINT validate fields is { dsk, sid, pid, details, } */
      var details, dsk, pid, post, rank, session, sid, trend, ts;
      ({dsk, sid, pid, session, details} = fields);
      ({ts} = session);
      post = this.db.first_row(this.queries.insert_post, {
        sid,
        pid,
        details: JSON.stringify(details)
      });
      ({rank} = post);
      trend = this.db.single_value(this.queries.trend_from_sid_pid, {sid, pid});
      return post;
    }

    //---------------------------------------------------------------------------------------------------------
    trends_data_json_from_dsk_sid(cfg) {
      var R, dsk, prefix, ref, row, sid;
      cfg = {...this.defaults.vogue_db_trends_data_json_from_dsk_sid_cfg, ...cfg};
      this.types.validate.vogue_db_trends_data_json_from_dsk_sid_cfg(cfg);
      ({dsk, sid} = cfg);
      R = [];
      ({prefix} = this.cfg);
      if (sid == null) {
        sid = this.db.single_value(this.queries.sid_max_from_dsk, {dsk});
      }
      ref = this.db(this.queries.trends_from_dsk_sid, {dsk, sid});
      for (row of ref) {
        R.push(JSON.parse(row.raw_trend));
      }
      return JSON.stringify(R);
    }

    //---------------------------------------------------------------------------------------------------------
    _walk_datasources() {
      return this.db(SQL`select * from ${this.cfg.prefix}_datasources order by dsk;`);
    }

    //---------------------------------------------------------------------------------------------------------
    _get_table_name(name) {
      this.types.validate.nonempty_text(name);
      if (name.startsWith('_')) {
        return `_${this.cfg.prefix}_${name.slice(1)}`;
      }
      return `${this.cfg.prefix}_${name}`;
    }

  };

}).call(this);

//# sourceMappingURL=vogue-db.js.map