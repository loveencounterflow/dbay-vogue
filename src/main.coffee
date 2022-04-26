
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
( require 'mixa/lib/check-package-versions' ) require '../pinned-package-versions.json'
PATH                      = require 'path'
GUY                       = require 'guy'
# { HTMLISH: ITXH }         = require 'intertext'
# URL                       = require 'url'
# { Html }                  = require './html'
{ DBay }                  = require 'dbay'
{ SQL }                   = DBay
_types                    = require './types'


#===========================================================================================================
class @Vogue

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    GUY.props.hide @, 'types',    _types.types
    GUY.props.hide @, 'defaults', _types.defaults
    #.......................................................................................................
    @cfg        = { @defaults.vogue_constructor_cfg..., cfg..., }
    @cfg.db    ?= new DBay()
    @types.validate.vogue_constructor_cfg @cfg
    { db,     } = GUY.obj.pluck_with_fallback @cfg, null, 'db';     GUY.props.hide @, 'db',     db
    { client, } = GUY.obj.pluck_with_fallback @cfg, null, 'client'; GUY.props.hide @, 'client', client
    @cfg        = GUY.lft.freeze @cfg
    #.......................................................................................................
    @db.create_stdlib()
    @_set_variables?()
    @_create_sql_functions?()
    @_procure_infrastructure?()
    @_compile_sql?()
    GUY.props.hide @, 'cache', { get_html_for: {}, }
    #.......................................................................................................
    return undefined

  # #---------------------------------------------------------------------------------------------------------
  # constructor: ( cfg ) ->
  #   @cfg        = { @constructor.C.defaults.vogue_constructor_cfg..., cfg..., }
  #   GUY.props.hide @, 'types', types
  #   @types.validate.vogue_constructor_cfg @cfg
  #   { db,     } = GUY.obj.pluck_with_fallback @cfg, null, 'db';     GUY.props.hide @, 'db',     db
  #   { client, } = GUY.obj.pluck_with_fallback @cfg, null, 'client'; GUY.props.hide @, 'client', client
  #   @cfg        = GUY.lft.freeze @cfg
  #   @db.create_stdlib()
  #   @_set_variables?()
  #   @_create_sql_functions?()
  #   @_procure_infrastructure?()
  #   @_compile_sql?()
  #   GUY.props.hide @, 'cache', { get_html_for: {}, }
  #   return undefined

  # #---------------------------------------------------------------------------------------------------------
  # _set_variables: ->
  #   @db.setv 'allow_change_on_mirror', 0

  #---------------------------------------------------------------------------------------------------------
  _create_sql_functions: ->
    { prefix } = @cfg
    #-------------------------------------------------------------------------------------------------------
    @db.create_function
      name:           prefix + '_get_html_for'
      deterministic:  true
      varargs:        false
      call:           ( table_name, fields ) =>
        @types.validate.nonempty_text table_name
        @types.validate_optional.text fields
        #...................................................................................................
        ### TAINT use caching method, hide implementation details ###
        unless ( method = @cache.get_html_for[ table_name ] )?
          method_name = "get_html_for_#{table_name}"
          unless ( method = @client[ method_name ] )?
            throw new Error "^dbay-scraper@1^ client has no method #{rpr method_name}"
          @cache.get_html_for[ method_name ] = method
        #...................................................................................................
        fields = JSON.parse fields if fields?
        return method.call @client, fields
    #-------------------------------------------------------------------------------------------------------
    return null

  #---------------------------------------------------------------------------------------------------------
  _procure_infrastructure: ->
    ### TAINT skip if tables found ###
    { prefix } = @cfg
    @db.set_foreign_keys_state false
    @db SQL"""
      drop table    if exists #{prefix}_datasources;
      drop table    if exists #{prefix}_sessions;
      drop table    if exists #{prefix}_posts;
      drop view     if exists _#{prefix}_trends;
      drop view     if exists #{prefix}_trends;
      drop table    if exists #{prefix}_trends_html;
      drop trigger  if exists #{prefix}_on_insert_into_posts;"""
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
      create table #{prefix}_tags (
          tag     text    not null,
        primary key ( tag ) );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_tagged_posts (
          pid     text    not null,
          tag     text    not null,
        primary key ( pid, tag ),
        -- foreign key ( pid ) references #{prefix}_posts ),
        foreign key ( tag ) references #{prefix}_tags );"""
    #.......................................................................................................
    @db SQL"""
      create view _#{prefix}_trends as select distinct
          sid                                                 as sid,
          pid                                                 as pid,
          json_group_array( json_array( sid, rank ) ) over w  as trend
        from #{prefix}_posts
        window w as (
          partition by ( pid )
          order by rank
          range between unbounded preceding and current row
          );"""
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
          html      text    not null,
        foreign key ( sid ) references #{prefix}_sessions );"""
    #.......................................................................................................
    @db SQL"""
      create trigger #{prefix}_on_insert_into_posts after insert on #{prefix}_posts
        for each row begin
          insert into #{prefix}_trends_html ( sid, html )
            select
                sid,
                #{prefix}_get_html_for( 'trends', json_object(
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



#===========================================================================================================
class @Vogue_scraper

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    GUY.props.hide @, 'types',    _types.types
    GUY.props.hide @, 'defaults', _types.defaults
    #.......................................................................................................
    @cfg        = { @defaults.vogue_scraper_constructor_cfg..., cfg..., }
    @cfg.vogue ?= new Vogue { client: @, }
    @types.validate.vogue_scraper_constructor_cfg @cfg
    { vogue, }  = GUY.obj.pluck_with_fallback @cfg, null, 'vogue'; GUY.props.hide @, 'vogue', vogue
    @cfg        = GUY.lft.freeze @cfg
    return undefined

############################################################################################################
Vogue = @Vogue









