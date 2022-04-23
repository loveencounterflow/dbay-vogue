
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-SCRAPER'
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
types                     = new ( require 'intertype' ).Intertype()
{ isa
  type_of
  validate
  validate_list_of }      = types.export()
GUY                       = require 'guy'
# { HTMLISH: ITXH }         = require 'intertext'
# URL                       = require 'url'
# { Html }                  = require './html'
{ DBay }                  = require 'dbay'
{ SQL }                   = DBay


#===========================================================================================================
types.declare 'constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  "( @isa.object x.db ) or ( @isa.function x.db ":  ( x ) -> ( @isa.object x.db ) or ( @isa.function x.db )
  "@isa.nonempty_text x.prefix":                    ( x ) -> @isa.nonempty_text x.prefix



#===========================================================================================================
class @Scraper

  #---------------------------------------------------------------------------------------------------------
  @C: GUY.lft.freeze
    defaults:
      #.....................................................................................................
      constructor_cfg:
        db:               null
        prefix:           'scr'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg      = { @constructor.C.defaults.constructor_cfg..., cfg..., }
    @cfg.db  ?= new DBay()
    GUY.props.hide @, 'types', types
    @types.validate.constructor_cfg @cfg
    { db, } = GUY.obj.pluck_with_fallback @cfg, null, 'db'
    GUY.props.hide @, 'db', db
    @cfg    = GUY.lft.freeze @cfg
    @db.create_stdlib()
    @_set_variables?()
    @_create_sql_functions?()
    @_procure_infrastructure?()
    @_compile_sql?()
    return undefined

  # #---------------------------------------------------------------------------------------------------------
  # _set_variables: ->
  #   @db.setv 'allow_change_on_mirror', 0

  #---------------------------------------------------------------------------------------------------------
  _create_sql_functions: ->
    { prefix } = @cfg
    #-------------------------------------------------------------------------------------------------------
    @db.create_function
      name:           prefix + '_get_html'
      deterministic:  true
      varargs:        false
      call:           ( dsk, sid, ts, id, rank, trend ) ->
        return "<div>#{dsk} #{sid} #{ts} #{id} #{rank} #{trend}</div>"
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
          id      text    not null,
          rank    integer not null,
          d       json    not null,
        primary key ( sid, id ),
        foreign key ( sid ) references #{prefix}_sessions );"""
    #.......................................................................................................
    @db SQL"""
      create view _#{prefix}_trends as select distinct
          sid                                                 as sid,
          id                                                  as id,
          json_group_array( json_array( sid, rank ) ) over w  as trend
        from #{prefix}_posts
        window w as (
          partition by ( id )
          order by rank
          range between unbounded preceding and current row
          );"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_trends as select
          sessions.dsk                                        as dsk,
          sessions.sid                                        as sid,
          sessions.ts                                         as ts,
          posts.id                                            as id,
          posts.rank                                          as rank,
          trends.trend                                        as trend,
          posts.d                                             as d
        from #{prefix}_posts        as posts
        join #{prefix}_sessions     as sessions     using ( sid )
        join _#{prefix}_trends      as trends       using ( sid, id )
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
                #{prefix}_get_html( dsk, sid, ts, id, rank, trend )
              from #{prefix}_trends as trends
              where ( trends.sid = new.sid ) and ( trends.id = new.id );
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
        insert into #{prefix}_posts ( sid, id, rank, d )
          select $sid, $id, next_free.rank, $d from next_free
          returning *;"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  new_session:  ( dsk     ) -> @db.first_row @queries.insert_session, { dsk, }
  new_post:     ( fields  ) -> @db.first_row @queries.insert_post, fields















