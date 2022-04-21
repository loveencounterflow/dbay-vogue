
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
    # #-------------------------------------------------------------------------------------------------------
    # @db.create_function
    #   name:           prefix + '_get_rskey'
    #   deterministic:  true
    #   varargs:        false
    #   call:           ( sid, seq ) -> "#{sid}:#{seq}"
    #-------------------------------------------------------------------------------------------------------
    return null

  #---------------------------------------------------------------------------------------------------------
  _procure_infrastructure: ->
    ### TAINT skip if tables found ###
    { prefix } = @cfg
    @db.set_foreign_keys_state false
    @db SQL"""
      drop table  if exists #{prefix}_datasources;
      drop table  if exists #{prefix}_sessions;
      drop table  if exists #{prefix}_posts;
      drop view   if exists #{prefix}_progressions;
      drop view   if exists #{prefix}_posts_and_progressions;"""
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
          ts      dt      not null,
        primary key ( sid ) );"""
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_posts (
          dsk     text    not null,
          id      text    not null,
          sid     integer not null,
          seq     integer not null,
          d       json    not null,
        primary key ( dsk, id, sid ),
        foreign key ( dsk ) references #{prefix}_datasources );"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_progressions as select distinct
          id                                                  as id,
          json_group_array( json_array( sid, seq ) ) over w as seqs
        from #{prefix}_posts
        window w as (
          partition by ( id )
          order by seq
          range between unbounded preceding and unbounded following );"""
    #.......................................................................................................
    @db SQL"""
      create view #{prefix}_posts_and_progressions as select
          posts.dsk                                           as dsk,
          posts.id                                            as id,
          posts.sid                                           as sid,
          posts.seq                                           as seq,
          progressions.seqs                                   as seqs,
          posts.d                                             as d
        from #{prefix}_posts        as posts
        join #{prefix}_progressions as progressions using ( id )
      ;"""
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
        insert into #{prefix}_sessions ( sid, ts )
          select sid, std_dt_now() from next_free
          returning *;"""
      #.....................................................................................................
      insert_post:        @db.prepare SQL"""
        with next_free as ( select
            coalesce( max( seq ), 0 ) + 1 as seq
          from #{prefix}_posts
          where true
            and ( dsk   = $dsk    )
            and ( sid = $sid  ) )
        insert into #{prefix}_posts ( dsk, id, sid, seq, d )
          select $dsk, $id, $sid, next_free.seq, $d from next_free
          returning *;"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  new_session:            -> @db.first_row @queries.insert_session
  new_post: ( fields )  -> @db.first_row @queries.insert_post, fields















