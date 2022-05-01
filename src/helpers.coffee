

'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'HELPERS'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
{ jr
  assign }                = CND
#...........................................................................................................
PATH                      = require 'path'
{ width_of
  to_width }              = require 'to-width'
{ Tbl, }                  = require 'icql-dba-tabulate'
dtab                      = new Tbl { dba: {}, }


#===========================================================================================================
#
# #-----------------------------------------------------------------------------------------------------------
# @cwd_abspath              = CND.cwd_abspath
# @cwd_relpath              = CND.cwd_relpath
# @here_abspath             = CND.here_abspath
# @_drop_extension          = ( path ) => path[ ... path.length - ( PATH.extname path ).length ]
# @project_abspath          = ( P... ) => CND.here_abspath __dirname, '..', P...

# #-----------------------------------------------------------------------------------------------------------
# @badge_from_filename = ( filename ) ->
#   basename  = PATH.basename filename
#   return 'BENCHMARKS/' + ( basename .replace /^(.*?)\.[^.]+$/, '$1' ).toUpperCase()

#-----------------------------------------------------------------------------------------------------------
@banner = ( title ) ->
  echo CND.reverse CND.steel to_width ( ' ' + title + ' ' ), 108
  return null

#-----------------------------------------------------------------------------------------------------------
@tabulate = ( title, query ) ->
  @banner title if title?
  echo dtab._tabulate query
  return null

#-----------------------------------------------------------------------------------------------------------
@property_pending = Symbol 'property_pending'




