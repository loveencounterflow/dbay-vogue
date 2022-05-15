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
    sessions.sid                                        as sid,
    sessions.ts                                         as ts,
    posts.pid                                           as pid,
    posts.rank                                          as rank,
    trends.xxx_trend                                    as raw_trend,
    posts.details                                       as details
  from ${prefix}_posts              as posts
  join ${prefix}_sessions           as sessions     using ( sid )
  join ${prefix}_XXX_grouped_ranks  as trends       using ( pid )
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
        trend_from_sid_pid: this.db.prepare(SQL`select
    raw_trend
  from ${prefix}_trends
  where true
    and ( sid = $sid )
    and ( pid = $pid );`),
        //.......................................................................................................
        trends_from_dsk: this.db.prepare(SQL`select
    raw_trend
  from ${prefix}_trends where true
    and ( dsk = $dsk );`)
      });
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    new_session(dsk) {
      return this.db.first_row(this.queries.insert_session, {dsk});
    }

    //---------------------------------------------------------------------------------------------------------
    new_post(fields) {
      /* TAINT validate fields is { dsk, sid, pid, details, } */
      var details, dsk, html, pid, post, rank, session, sid, trend, ts;
      ({dsk, sid, pid, session, details} = fields);
      ({ts} = session);
      post = this.db.first_row(this.queries.insert_post, {
        sid,
        pid,
        details: JSON.stringify(details)
      });
      ({rank} = post);
      trend = this.db.single_value(this.queries.trend_from_sid_pid, {sid, pid});
      html = this._html_from_purpose('details', {dsk, sid, pid, ts, rank, trend, details});
      // ignore          = @db.single_row @queries.insert_trends_html, { post..., trend, html, }
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
    /* TAINT must be per DSK so needs `dsk` argument */
    trends_data_json_from_dsk(dsk) {
      var R, prefix, ref1, row;
      R = [];
      ({prefix} = this.cfg);
      ref1 = this.db(this.queries.trends_from_dsk, {dsk});
      for (row of ref1) {
        R.push(JSON.parse(row.raw_trend));
      }
      return JSON.stringify(R);
    }

  };

}).call(this);

//# sourceMappingURL=vogue-db.js.map