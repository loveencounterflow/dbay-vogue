
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE/DB'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
PATH                      = require 'path'
GUY                       = require 'guy'
# { HTMLISH: ITXH }         = require 'intertext'
# URL                       = require 'url'
# { Html }                  = require './html'
{ DBay }                  = require 'dbay'
{ SQL }                   = DBay
{ Vogue_common_mixin }    = require './vogue-common-mixin'
H                         = require './helpers'
XXX_cfg_replacement =
  chart_history_length: 20


#===========================================================================================================
class @Vogue_db extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { @defaults.vogue_db_constructor_cfg..., cfg..., }
    @cfg.db    ?= new DBay()
    @types.validate.vogue_db_constructor_cfg @cfg
    { db,     } = GUY.obj.pluck_with_fallback @cfg, null, 'db';     GUY.props.hide @, 'db',     db
    @cfg        = GUY.lft.freeze @cfg
    #.......................................................................................................
    @db.create_stdlib()
    @_set_variables?()
    @_create_sql_functions?()
    @_procure_infrastructure?()
    @_compile_sql?()
    GUY.props.hide @, 'cache', { get_html_for: {}, }
    @hub = H.property_pending
    #.......................................................................................................
    return undefined


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  # _set_variables: ->
  #   @db.setv 'allow_change_on_mirror', 0

  #---------------------------------------------------------------------------------------------------------
  _create_sql_functions: ->
    { prefix } = @cfg
    #-------------------------------------------------------------------------------------------------------
    @db.create_function
      name:           prefix + '_get_html_from_purpose'
      deterministic:  true
      varargs:        false
      call:           ( purpose, dsk, fields ) =>
        @types.validate.nonempty_text purpose
        @types.validate_optional.text fields
        #...................................................................................................
        ### TAINT use caching method, hide implementation details ###
        unless ( method = @cache.get_html_for[ purpose ] )?
          scraper     = @hub.scrapers._scraper_from_dsk dsk
          method_name = "html_from_#{purpose}"
          unless ( method = scraper[ method_name ] )?
            throw new Error "^dbay-scraper@1^ scraper has no method #{rpr method_name}"
          @cache.get_html_for[ method_name ] = method
        #...................................................................................................
        fields = JSON.parse fields if fields?
        return method.call scraper, fields
    # #-------------------------------------------------------------------------------------------------------
    # XXX_count = 0
    # @db.create_function
    #   name:           prefix + '_sparkline_data_from_raw_trend'
    #   deterministic:  true
    #   varargs:        false
    #   call:           ( trend_json, sid_min, sid_max ) =>
    #     ###
    #     `sid`: Session ID
    #     `sid_min`: earliest session ID in DB for the current datasource

    #     ###
    #     trend               = JSON.parse trend_json
    #     R                   = []
    #     dense_trend         = []
    #     csid_min            = Math.max 0, ( sid_min - sid_max ) + XXX_cfg_replacement.chart_history_length
    #     csid_max            = XXX_cfg_replacement.chart_history_length
    #     first_csid          = null
    #     last_csid           = null
    #     for [ sid, rank, ] in trend
    #       csid = ( sid - sid_max ) + csid_max
    #       continue if csid < 0
    #       dense_trend[ csid ]  = rank
    #     last_sid            = sid
    #     status_prv          = 'missing'
    #     status_now          = 'first'
    #     for rank, csid in dense_trend
    #       unless rank?
    #         rank        = null
    #         status_now  = 'missing'
    #         # if sid > 1
    #         #   R[ sid - 1 ]
    #         # if status_prv
    #       R.push { csid, rank, } # if rank?
    #       status_prv = status_now
    #     # debug '^435345^', R
    #     #.......................................................................................................
    #     # process.exit 111 if ++XXX_count > 90
    #     return JSON.stringify R
    #-------------------------------------------------------------------------------------------------------
    @db.create_function
      name:           prefix + '_sparkline_data_from_raw_trend'
      deterministic:  true
      varargs:        false
      call:           ( trend_json, _1, _2 ) =>
        trend               = JSON.parse trend_json
        dense_trend         = []
        dense_trend[ sid ]  = rank for [ sid, rank, ] in trend
        #.......................................................................................................
        return JSON.stringify ( { sid, rank, } for rank, sid in dense_trend )
    #-------------------------------------------------------------------------------------------------------
    return null

  #---------------------------------------------------------------------------------------------------------
  _procure_infrastructure: ->
    ### TAINT skip if tables found ###
    { prefix } = @cfg
    @db.set_foreign_keys_state false
    @db SQL"""
      drop table    if exists #{prefix}_datasources;
      drop table    if exists #{prefix}_posts;
      drop table    if exists #{prefix}_sessions;
      drop table    if exists #{prefix}_minmax_sids;
      drop table    if exists #{prefix}_states;
      drop table    if exists #{prefix}_tagged_posts;
      drop table    if exists #{prefix}_tags;
      drop table    if exists #{prefix}_trends_html;
      drop trigger  if exists #{prefix}_on_insert_into_posts;
      drop view     if exists #{prefix}_latest_trends;
      drop view     if exists #{prefix}_latest_trends_html;
      drop view     if exists #{prefix}_ordered_trends;
      drop view     if exists #{prefix}_trends;
      drop view     if exists _#{prefix}_trends;"""
    @db.set_foreign_keys_state true
    #-------------------------------------------------------------------------------------------------------
    # TABLES
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_datasources (
          dsk     text not null,
          url     text not null,
        primary key ( dsk ) );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_sessions (
          sid     integer not null,
          dsk     text    not null,
          ts      dt      not null,
        primary key ( sid ),
        foreign key ( dsk ) references #{prefix}_datasources );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_posts (
          sid     integer not null,
          pid     text    not null,
          rank    integer not null,
          details json    not null,
        primary key ( sid, pid ),
        foreign key ( sid ) references #{prefix}_sessions );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_states (
          state   text    not null,
        primary key ( state ) );
      insert into #{prefix}_states ( state ) values
        ( 'first' ), ( 'first cont' ), ( 'mid' ), ( 'last cont' ), ( 'last' );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_tags (
          tag     text    not null,
        primary key ( tag ) );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_tagged_posts (
          pid     text    not null,
          tag     text    not null,
        primary key ( pid, tag ),
        -- foreign key ( pid ) references #{prefix}_posts,
        foreign key ( tag ) references #{prefix}_tags );"""
    # #.......................................................................................................
    # @db SQL"""
    #   create view #{prefix}_minmax_sids as select
    #       sessions.dsk      as dsk,
    #       min( sid ) over w as sid_min,
    #       max( sid ) over w as sid_max
    #     from #{prefix}_posts    as posts
    #     join #{prefix}_sessions as sessions using ( sid )
    #     window w as ( partition by dsk );"""
    #.......................................................................................................
    @db SQL"""
      create view _#{prefix}_trends as
        select distinct
          sid                                                     as sid,
          pid                                                     as pid,
          #{prefix}_sparkline_data_from_raw_trend(
            json_group_array( json_array( sid, rank ) ) over w,
            0, /* sid_min, */
            20 /* sid_max  */ )                                             as trend
        from #{prefix}_posts
        -- join #{prefix}_minmax_sids using ( sid )
        window w as (
          partition by ( pid )
          order by rank
          range between unbounded preceding and current row );"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_trends as select
          sessions.dsk                                        as dsk,
          sessions.sid                                        as sid,
          sessions.ts                                         as ts,
          posts.pid                                           as pid,
          posts.rank                                          as rank,
          trends.trend                                        as trend,
          posts.details                                       as details
        from #{prefix}_posts        as posts
        join #{prefix}_sessions     as sessions     using ( sid )
        join _#{prefix}_trends      as trends       using ( sid, pid )
        order by
          sid   desc,
          rank  asc;"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_trends_html (
          nr        integer not null primary key,
          sid       integer not null,
          pid       integer not null,
          html      text    not null,
        foreign key ( sid ) references #{prefix}_sessions );"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_ordered_trends as select
          row_number() over w as rnr, -- 'reverse number' b/c most recent appearances get to be number one
          *
        from #{prefix}_trends
        window w as ( partition by pid order by sid desc )
        order by
          sid   desc,
          rank  asc,
          rnr   asc;"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_latest_trends as select
          *
        from #{prefix}_ordered_trends
        where rnr = 1
        order by
          sid   desc,
          rank  asc,
          rnr   asc;"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_latest_trends_html as select
          *
        from #{prefix}_trends_html as trends_html
        join #{prefix}_latest_trends using ( sid, pid )
        order by
          sid   desc,
          rank  asc,
          nr    asc;"""
    #.......................................................................................................
    @db SQL"""
      create trigger #{prefix}_on_insert_into_posts after insert on #{prefix}_posts
        for each row begin
          insert into #{prefix}_trends_html ( sid, pid, html )
            select
                sid,
                pid,
                #{prefix}_get_html_from_purpose( 'details', dsk, json_object(
                  'dsk',      dsk,
                  'sid',      sid,
                  'ts',       ts,
                  'pid',      pid,
                  'rank',     rank,
                  'trend',    trend,
                  'details',  new.details ) )
              from #{prefix}_trends as trends
              where ( trends.sid = new.sid ) and ( trends.pid = new.pid );
          end;"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _compile_sql: ->
    { prefix } = @cfg
    #.......................................................................................................
    GUY.props.hide @, 'queries',
      # #.....................................................................................................
      # get_db_object_count: @db.prepare SQL"""
      #   select count(*) as count from sqlite_schema where starts_with( $name, $prefix || '_' );"""
      #.....................................................................................................
      insert_datasource:  @db.prepare_insert { into: "#{prefix}_datasources", }
      #.....................................................................................................
      insert_session:       @db.prepare SQL"""
        with next_free as ( select
            coalesce( max( sid ), 0 ) + 1 as sid
          from #{prefix}_sessions )
        insert into #{prefix}_sessions ( sid, dsk, ts )
          select sid, $dsk, std_dt_now() from next_free
          returning *;"""
      #.....................................................................................................
      insert_post:        @db.prepare SQL"""
        with next_free as ( select
            coalesce( max( rank ), 0 ) + 1 as rank
          from #{prefix}_posts
          where true
            and ( sid = $sid ) )
        insert into #{prefix}_posts ( sid, pid, rank, details )
          select $sid, $pid, next_free.rank, $details from next_free
          returning *;"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  new_session:  ( dsk     ) -> @db.first_row @queries.insert_session, { dsk, }
  new_post:     ( fields  ) -> @db.first_row @queries.insert_post, fields

  #---------------------------------------------------------------------------------------------------------
  get_latest_trends: ->
    ### TAINT not strictly needed to parse, then serialize again ###
    { prefix } = @cfg
    R = []
    for row from @db SQL"""select trend from #{prefix}_latest_trends;"""
      R.push JSON.parse row.trend
    return R




