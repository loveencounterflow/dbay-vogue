
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



#===========================================================================================================
class @Scraper

  #---------------------------------------------------------------------------------------------------------
  @C: GUY.lft.freeze
    ### NOTE may become configurable per instance, per datasource ###
    trim_line_ends: true
    defaults:
      #.....................................................................................................
      constructor_cfg:
        db:               null
        prefix:           'scr'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg    = { @constructor.C.defaults.constructor_cfg..., cfg..., }
    GUY.props.hide @, 'types', types
    @types.validate.constructor_cfg @cfg
    { db, } = GUY.obj.pluck_with_fallback @cfg, null, 'db'
    GUY.props.hide @, 'db', db
    @cfg    = GUY.lft.freeze @cfg
    @db.create_stdlib()
    @_set_variables?()
    @_create_sql_functions?()
    @_compile_sql?()
    @_procure_infrastructure?()
    GUY.props.hide @, 'html', new Html { mrg: @, prefix: @cfg.prefix, }
    return undefined

  # #---------------------------------------------------------------------------------------------------------
  # _set_variables: ->
  #   @db.setv 'allow_change_on_mirror', 0

  # #---------------------------------------------------------------------------------------------------------
  # _create_sql_functions: ->
  #   { prefix } = @cfg
  #   # #-------------------------------------------------------------------------------------------------------
  #   # @db.create_function
  #   #   name:           prefix + '_re_is_blank'
  #   #   deterministic:  true
  #   #   varargs:        false
  #   #   call:           ( txt ) -> if ( /^\s*$/.test txt ) then 1 else 0
  #   #-------------------------------------------------------------------------------------------------------
  #   return null

  #---------------------------------------------------------------------------------------------------------
  _procure_infrastructure: ->
    ### TAINT skip if tables found ###
    { prefix } = @cfg
    @db.set_foreign_keys_state false
    @db SQL"""
      drop table  if exists #{prefix}_datasources;"""
    @db.set_foreign_keys_state true
    #-------------------------------------------------------------------------------------------------------
    # TABLES
    #.......................................................................................................
    @db SQL"""
      create table #{prefix}_datasources (
          dsk     text not null,
          path    text,
          url     text,
          digest  text default null,
        primary key ( dsk ) );"""
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _compile_sql: ->
    { prefix } = @cfg
    #.......................................................................................................
    GUY.props.hide @, 'sql',
      #.....................................................................................................
      get_db_object_count:  SQL"""
        select count(*) as count from sqlite_schema where starts_with( $name, $prefix || '_' );"""
    #.......................................................................................................
    return null















