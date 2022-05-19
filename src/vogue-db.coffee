
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
{ HDML, }                 = require 'hdml'
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
    debug '^5343^', @cfg
    debug '^5343^', @db.cfg
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
  _procure_infrastructure: ->
    ### TAINT skip if tables found ###
    { prefix } = @cfg
    @db.set_foreign_keys_state false
    @db SQL"""
      drop table  if exists #{prefix}_datasources;
      drop table  if exists #{prefix}_sessions;
      drop table  if exists #{prefix}_posts;
      drop view   if exists #{prefix}_XXX_ranks;
      drop view   if exists #{prefix}_XXX_grouped_ranks;
      drop view   if exists #{prefix}_trends;"""
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
      create view #{prefix}_XXX_ranks as select
          session.dsk                                           as dsk,
          post.sid                                              as sid,
          post.pid                                              as pid,
          post.rank                                             as rank,
          coalesce( post.pid != lag(  post.pid ) over w, true ) as first,
          coalesce( post.pid != lead( post.pid ) over w, true ) as last
        from #{prefix}_posts    as post
        join #{prefix}_sessions as session using ( sid )
        window w as (
          partition by pid
          order by sid )
        order by sid, pid;"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_XXX_grouped_ranks as select distinct
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
        from #{prefix}_XXX_ranks
        window w as (
          partition by pid
          order by sid
          range between unbounded preceding and unbounded following )
        order by pid;"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_trends as select
          sessions.dsk                                        as dsk,
          trends.sid_min                                      as sid_min, -- 'first seen' in session SID_*min*
          trends.sid_max                                      as sid_max, -- 'last  seen' in session SID_*max*
          sessions.ts                                         as ts,
          posts.pid                                           as pid,
          posts.rank                                          as rank,
          trends.xxx_trend                                    as raw_trend,
          posts.details                                       as details
        from #{prefix}_posts              as posts
        join #{prefix}_sessions           as sessions     using ( sid )
        join #{prefix}_XXX_grouped_ranks  as trends       using ( pid )
        where true
          and ( sessions.sid = trends.sid_max )
        order by
          sid   desc,
          rank  asc;"""
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
      trend_from_sid_pid: @db.prepare SQL"""
        select
            raw_trend
          from #{prefix}_trends
          where true
            and ( $sid between sid_min and sid_max )
            and ( pid = $pid );"""
      #.......................................................................................................
      trends_from_dsk_sid: @db.prepare SQL"""
        select
            raw_trend
          from #{prefix}_trends where true
            and ( dsk = $dsk )
            -- and ( sid = $sid );
            """
      #.......................................................................................................
      ### Given a datasource (identified as DSK), return the last session (identified as SID) for that
      datasource ###
      sid_max_from_dsk: @db.prepare SQL"""
        select
            max( sid_max ) as sid_max
          from #{prefix}_trends where true
            and ( dsk = $dsk );"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  new_session:  ( dsk     ) -> @db.first_row @queries.insert_session, { dsk, }

  #---------------------------------------------------------------------------------------------------------
  new_post: ( fields ) ->
    ### TAINT validate fields is { dsk, sid, pid, details, } ###
    { dsk
      sid
      pid
      session
      details }     = fields
    { ts }          = session
    post            = @db.first_row @queries.insert_post, { sid, pid, details: ( JSON.stringify details ), }
    { rank }        = post
    trend           = @db.single_value @queries.trend_from_sid_pid, { sid, pid, }
    # html            = @_html_from_purpose 'details', { dsk, sid, pid, ts, rank, trend, details, }
    # ignore          = @db.single_row @queries.insert_trends_html, { post..., trend, html, }
    return post

  #---------------------------------------------------------------------------------------------------------
  _html_from_purpose: ( purpose, row ) =>
    @types.validate.nonempty_text purpose
    @types.validate.object row
    #...................................................................................................
    ### TAINT use caching method, hide implementation details ###
    unless ( method = @cache.get_html_for[ purpose ] )?
      scraper     = @hub.scrapers._scraper_from_dsk row.dsk
      method_name = "html_from_#{purpose}"
      unless ( method = scraper[ method_name ] )?
        throw new Error "^dbay-scraper@1^ scraper has no method #{rpr method_name}"
      @cache.get_html_for[ method_name ] = method
    #...................................................................................................
    return method.call scraper, row

  #---------------------------------------------------------------------------------------------------------
  trends_data_json_from_dsk_sid: ( cfg ) ->
    cfg         = { @defaults.vogue_db_trends_data_json_from_dsk_sid_cfg..., cfg..., }
    @types.validate.vogue_db_trends_data_json_from_dsk_sid_cfg cfg
    { dsk
      sid     } = cfg
    R           = []
    { prefix  } = @cfg
    sid        ?= @db.single_value @queries.sid_max_from_dsk, { dsk, }
    for row from @db @queries.trends_from_dsk_sid, { dsk, sid, }
      R.push JSON.parse row.raw_trend
    return JSON.stringify R

  #---------------------------------------------------------------------------------------------------------
  as_html: ( cfg ) ->
    ### TAINT iterate or use stream ###
    cfg         = { @defaults.vogue_db_as_html_cfg..., cfg..., }
    @types.validate.vogue_db_as_html_cfg cfg
    return @_table_as_html cfg
    # try return @_table_as_html cfg catch error then null
    # return error.message

  #---------------------------------------------------------------------------------------------------------
  _table_as_html: ( cfg ) ->
    ### TAINT use SQL generation facility from DBay (TBW) ###
    { table
      fields  } = cfg
    keys        = null
    R           = []
    table_i     = @db.sql.I table
    statement   = @db.prepare SQL"""select * from #{table_i};"""
    row_nr      = 0
    #.......................................................................................................
    R.push HDML.open 'table', { class: table, }
    #.......................................................................................................
    for row from @db statement
      row_nr++
      #.....................................................................................................
      if row_nr is 1
        keys = Object.keys switch cfg.keys
          when 'row,cfg'  then { row..., fields..., }
          when 'cfg,row'  then { fields..., row..., }
          when 'row'      then row
          when 'cfg'      then fields
        R.push HDML.open 'tr'
        for key in keys
          if ( field = fields[ key ] )?
            continue if field.display is false
            title = field.title ? key
          else
            title = key
          R.push HDML.pair 'th', { class: key, }, HDML.text title
        R.push HDML.close 'tr'
      #.....................................................................................................
      R.push HDML.open 'tr'
      for key in keys
        raw_value   = row[ key ]
        value       = raw_value
        field       = fields[ key ] ? null
        is_done     = false
        inner_html  = null
        if field?
          continue if field.display is false
          details = { key, raw_value, row_nr, row, }
          if ( format = field.format ? null )?
            value = format value, details
          if ( as_html = field.outer_html ? null )?
            is_done = true
            R.push as_html value, details
          else if ( as_html = field.inner_html ? null )?
            inner_html = as_html value, details
        unless is_done
          if inner_html?
            R.push HDML.pair 'td', { class: key, }, inner_html
          else
            value = rpr value unless @types.isa.text value
            R.push HDML.pair 'td', { class: key, }, HDML.text value
      R.push HDML.close 'tr'
    #.......................................................................................................
    R.push HDML.close 'table'
    return R.join '\n'

  #---------------------------------------------------------------------------------------------------------
  _columns_from_statement: ( statement ) ->
    ### TAINT refactor to DBay ###
    R = {}
    for d in statement.columns()
      throw new Error "^vogue-db@1^ duplicate column names not allowed" if R[ d.name ]?
      R[ d.name ] = d
    return R

  #---------------------------------------------------------------------------------------------------------
  _get_table_name: ( name ) ->
    @types.validate.nonempty_text name
    return "_#{@cfg.prefix}_#{name[1..]}" if name.startsWith '_'
    return "#{@cfg.prefix}_#{name}"

