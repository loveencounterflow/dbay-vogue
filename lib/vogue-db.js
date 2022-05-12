(function() {
  'use strict';
  var CND, DBay, GUY, H, PATH, SQL, Vogue_common_mixin, XXX_cfg_replacement, badge, debug, echo, help, info, ref, rpr, urge, warn, whisper,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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

  XXX_cfg_replacement = {
    chart_history_length: 20
  };

  //===========================================================================================================
  ref = this.Vogue_db = class Vogue_db extends Vogue_common_mixin() {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var base, db;
      super();
      //---------------------------------------------------------------------------------------------------------
      this._html_from_purpose = this._html_from_purpose.bind(this);
      this.cfg = {...this.defaults.vogue_db_constructor_cfg, ...cfg};
      if ((base = this.cfg).db == null) {
        base.db = new DBay();
      }
      this.types.validate.vogue_db_constructor_cfg(this.cfg);
      ({db} = GUY.obj.pluck_with_fallback(this.cfg, null, 'db'));
      GUY.props.hide(this, 'db', db);
      this.cfg = GUY.lft.freeze(this.cfg);
      debug('^5343^', this.cfg);
      debug('^5343^', this.db.cfg);
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
      this.db(SQL`drop table    if exists ${prefix}_datasources;
drop table    if exists ${prefix}_posts;
drop table    if exists ${prefix}_sessions;
drop view     if exists ${prefix}_minmax_sids;
drop table    if exists ${prefix}_states;
drop table    if exists ${prefix}_tagged_posts;
drop table    if exists ${prefix}_tags;
drop table    if exists ${prefix}_trends_html;
drop trigger  if exists ${prefix}_on_insert_into_posts;
drop view     if exists ${prefix}_latest_trends;
drop view     if exists ${prefix}_latest_trends_html;
drop view     if exists ${prefix}_ordered_trends;
drop view     if exists ${prefix}_trends;
drop view     if exists _${prefix}_trends_01;
drop view     if exists ${prefix}_XXX_ranks;
drop view     if exists ${prefix}_XXX_grouped_ranks;`);
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
    sid                                         as sid,
    pid                                         as pid,
    rank                                        as rank,
    coalesce( pid != lag(  pid ) over w, true ) as first,
    coalesce( pid != lead( pid ) over w, true ) as last
  from ${prefix}_posts
  window w as (
    partition by pid
    order by sid )
  order by sid, pid;`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_XXX_grouped_ranks as select distinct
    pid                                     as pid,
    json_group_array( json_object(
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
      // #.......................................................................................................
      // @db SQL"""
      //   create table #{prefix}_states (
      //       state   text    not null,
      //     primary key ( state ) );
      //   insert into #{prefix}_states ( state ) values
      //     ( 'first' ), ( 'first cont' ), ( 'mid' ), ( 'last cont' ), ( 'last' );"""
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
      this.db(SQL`create view ${prefix}_minmax_sids as select
    sessions.dsk      as dsk,
    min( sid ) over w as sid_min,
    max( sid ) over w as sid_max
  from ${prefix}_posts    as posts
  join ${prefix}_sessions as sessions using ( sid )
  window w as ( partition by dsk );`);
      //.......................................................................................................
      this.db(SQL`create view _${prefix}_trends_01 as
  select distinct
    sid                                                     as sid,
    pid                                                     as pid,
    json_group_array( json_array( sid, rank ) ) over w      as raw_trend
  from ${prefix}_posts
  -- join ${prefix}_minmax_sids using ( sid )
  window w as (
    partition by ( pid )
    order by rank
    range between unbounded preceding and current row );`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_trends as select
    sessions.dsk                                        as dsk,
    sessions.sid                                        as sid,
    sessions.ts                                         as ts,
    posts.pid                                           as pid,
    posts.rank                                          as rank,
    trends.raw_trend                                    as raw_trend,
    posts.details                                       as details
  from ${prefix}_posts        as posts
  join ${prefix}_sessions     as sessions     using ( sid )
  join _${prefix}_trends_01   as trends       using ( sid, pid )
  order by
    sid   desc,
    rank  asc;`);
      //.......................................................................................................
      this.db(SQL`create table ${prefix}_trends_html (
    sid             integer not null,
    pid             integer not null,
    sparkline_data  text    not null,
    html            text    not null,
  primary key ( sid, pid ),
  foreign key ( sid, pid ) references ${prefix}_posts );`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_ordered_trends as select
    row_number() over w as rnr, -- 'reverse number' b/c most recent appearances get to be number one
    dsk                 as dsk,
    sid                 as sid,
    ts                  as ts,
    pid                 as pid,
    rank                as rank,
    raw_trend           as raw_trend,
    details             as details
  from ${prefix}_trends
  window w as ( partition by pid order by sid desc )
  order by
    sid   desc,
    rank  asc,
    rnr   asc;`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_latest_trends as select
    rnr,
    dsk,
    sid,
    ts,
    pid,
    rank,
    raw_trend,
    details
  from ${prefix}_ordered_trends
  where rnr = 1
  order by
    sid   desc,
    rank  asc,
    rnr   asc;`);
      //.......................................................................................................
      this.db(SQL`create view ${prefix}_latest_trends_html as select
    *
  from ${prefix}_trends_html as trends_html
  join ${prefix}_latest_trends using ( sid, pid )
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
  returning *;`),
        //.......................................................................................................
        insert_trends_html: this.db.prepare_insert({
          into: `${prefix}_trends_html`,
          returning: '*'
        }),
        trend_from_sid_pid: this.db.prepare(SQL`select
    raw_trend
  from ${prefix}_trends
  where true
    and ( sid = $sid )
    and ( pid = $pid );`),
        //.......................................................................................................
        get_minmax_sids: this.db.prepare(SQL`select
    sid_min,
    sid_max
  from ${prefix}_minmax_sids
  where ( dsk = $dsk );`)
      });
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    new_session(dsk) {
      return this.db.first_row(this.queries.insert_session, {dsk});
    }

    //---------------------------------------------------------------------------------------------------------
    _sparkline_data_from_raw_trend(raw_trend) {
      var dense_trend, i, len, rank, sid;
      // #{prefix}_sparkline_data_from_raw_trend(
      //   ,
      //   0, /* sid_min, */
      //   20 /* sid_max  */ )                                             as trend
      dense_trend = [];
      for (i = 0, len = raw_trend.length; i < len; i++) {
        [sid, rank] = raw_trend[i];
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

    // #-------------------------------------------------------------------------------------------------------
    // XXX_count = 0
    // @db.create_function
    //   name:           prefix + '_sparkline_data_from_raw_trend'
    //   deterministic:  true
    //   varargs:        false
    //   call:           ( trend_json, sid_min, sid_max ) =>
    //     ###
    //     `sid`: Session ID
    //     `sid_min`: earliest session ID in DB for the current datasource

      //     ###
    //     trend               = JSON.parse trend_json
    //     R                   = []
    //     dense_trend         = []
    //     csid_min            = Math.max 0, ( sid_min - sid_max ) + XXX_cfg_replacement.chart_history_length
    //     csid_max            = XXX_cfg_replacement.chart_history_length
    //     first_csid          = null
    //     last_csid           = null
    //     for [ sid, rank, ] in trend
    //       csid = ( sid - sid_max ) + csid_max
    //       continue if csid < 0
    //       dense_trend[ csid ]  = rank
    //     last_sid            = sid
    //     status_prv          = 'missing'
    //     status_now          = 'first'
    //     for rank, csid in dense_trend
    //       unless rank?
    //         rank        = null
    //         status_now  = 'missing'
    //         # if sid > 1
    //         #   R[ sid - 1 ]
    //         # if status_prv
    //       R.push { csid, rank, } # if rank?
    //       status_prv = status_now
    //     # debug '^435345^', R
    //     #.......................................................................................................
    //     # process.exit 111 if ++XXX_count > 90
    //     return JSON.stringify R
    //-------------------------------------------------------------------------------------------------------

      //---------------------------------------------------------------------------------------------------------
    new_post(fields) {
      /* TAINT validate fields is { dsk, sid, pid, details, } */
      var details, dsk, html, ignore, pid, post, rank, raw_trend, session, sid, sparkline_data, ts;
      ({dsk, sid, pid, session, details} = fields);
      ({ts} = session);
      post = this.db.first_row(this.queries.insert_post, {
        sid,
        pid,
        details: JSON.stringify(details)
      });
      // debug '^1423^', @db.first_row @queries.get_minmax_sids, { dsk, }
      ({rank} = post);
      raw_trend = JSON.parse(this.db.single_value(this.queries.trend_from_sid_pid, {sid, pid}));
      sparkline_data = this._sparkline_data_from_raw_trend(raw_trend);
      // debug '^345345^', { sparkline_data, }
      /* TAINT rename trend -> sparkline_data */
      html = this._html_from_purpose('details', {dsk, sid, pid, ts, rank, sparkline_data, details});
      ignore = this.db.single_row(this.queries.insert_trends_html, {...post, sparkline_data, html});
      return post;
    }

    _html_from_purpose(purpose, row) {
      var method, method_name, scraper;
      boundMethodCheck(this, ref);
      this.types.validate.nonempty_text(purpose);
      this.types.validate.object(row);
      //...................................................................................................
      /* TAINT use caching method, hide implementation details */
      if ((method = this.cache.get_html_for[purpose]) == null) {
        scraper = this.hub.scrapers._scraper_from_dsk(row.dsk);
        method_name = `html_from_${purpose}`;
        if ((method = scraper[method_name]) == null) {
          throw new Error(`^dbay-scraper@1^ scraper has no method ${rpr(method_name)}`);
        }
        this.cache.get_html_for[method_name] = method;
      }
      //...................................................................................................
      return method.call(scraper, row);
    }

    //---------------------------------------------------------------------------------------------------------
    get_latest_sparkline_data_json() {
      var R, prefix, ref1, row;
      ({prefix} = this.cfg);
      R = [];
      ref1 = this.db(SQL`select sparkline_data from ${prefix}_latest_trends_html;`);
      // for row from @db SQL"""select sparkline_data from #{prefix}_trends_html;"""
      for (row of ref1) {
        R.push(JSON.parse(row.sparkline_data));
      }
      return JSON.stringify(R);
    }

  };

}).call(this);

//# sourceMappingURL=vogue-db.js.map