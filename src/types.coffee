
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DBAY-VOGUE/TYPES'
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
@types                    = new ( require 'intertype' ).Intertype()
@defaults                 = {}



#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_host', tests:
  "@isa.nonempty_text x":     ( x ) -> @isa.nonempty_text x

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_port', tests:
  "@isa.positive_integer x":  ( x ) -> @isa.positive_integer x
  "1024 <= x <= 65535":       ( x ) -> 1024 <= x <= 65535

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_dsk', tests:
  "@isa.nonempty_text x":     ( x ) -> @isa.nonempty_text x

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_server_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  # "( @isa.object x.db ) or ( @isa.function x.db ":  ( x ) -> ( @isa.object x.db ) or ( @isa.function x.db )
  "@isa.vogue_host x.host":                    ( x ) -> @isa.vogue_host x.host
  "@isa.vogue_port x.port":                    ( x ) -> @isa.vogue_port x.port
#...........................................................................................................
@defaults.vogue_server_constructor_cfg =
  host:     'localhost'
  port:     3456
  paths:
    public:     PATH.resolve __dirname, '../public'
    favicon:    PATH.resolve __dirname, '../public/favicon.png'
  file_server:
    # Enable or disable accepting ranged requests. Disabling this will not send Accept-Ranges and ignore the
    # contents of the Range request header. defaults to true.
    acceptRanges:     true
    # Set Cache-Control response header, defaults to undefined, see docs: Cache-Control in MDN.
    cacheControl:     undefined
    # Enable or disable etag generation, defaults to true.
    etag:             true
    # Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
    # defaults to true.
    lastModified:     true
    # Set ignore rules. defaults to undefined. ( path ) => boolean
    ignore:           undefined
    # If true, serves after await next(), allowing any downstream middleware to respond first. defaults to false.
    defer:            false

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_db_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  "( @isa.object x.db ) or ( @isa.function x.db ":  ( x ) -> ( @isa.object x.db ) or ( @isa.function x.db )
  "@isa.nonempty_text x.prefix":                    ( x ) -> @isa.nonempty_text x.prefix
#...........................................................................................................
@defaults.vogue_db_constructor_cfg =
  db:               null
  prefix:           'scr'

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scrapers_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
#...........................................................................................................
@defaults.vogue_scrapers_constructor_cfg = {}

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scrapers_add_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  "@isa.vogue_dsk x.dsk":                           ( x ) -> @isa.vogue_dsk x.dsk
  "@isa.object x.scraper":                          ( x ) -> @isa.object x.scraper
#...........................................................................................................
@defaults.vogue_scrapers_add_cfg =
  dsk:              null
  scraper:          null

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scraper_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  "@isa.nonempty_text x.encoding":                  ( x ) -> @isa.nonempty_text x.encoding
  "@isa_optional.nonempty_text x.url":              ( x ) -> @isa_optional.nonempty_text x.url
#...........................................................................................................
@defaults.vogue_scraper_constructor_cfg =
  encoding:         'utf-8'
  url:              null

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_hub_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  "@isa.vogue_db x.vdb":                            ( x ) -> @isa.vogue_db x.vdb
  "@isa.vogue_server x.server":                     ( x ) -> @isa.vogue_server x.server
  "@isa.vogue_scrapers x.scrapers":                 ( x ) -> @isa.vogue_scrapers x.scrapers
#...........................................................................................................
@defaults.vogue_hub_constructor_cfg =
  vdb:                null
  server:             null
  scrapers:           null

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scheduler_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
#...........................................................................................................
@defaults.vogue_scheduler_constructor_cfg = {}

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scheduler_unit', tests:
  "@isa.nonempty_text x":   ( x ) -> @isa.object x
  "x is singular or plural week, day, hour, minute, second": ( x ) ->
    return true if x is 'week'
    return true if x is 'day'
    return true if x is 'hour'
    return true if x is 'minute'
    return true if x is 'second'
    return true if x is 'weeks'
    return true if x is 'days'
    return true if x is 'hours'
    return true if x is 'minutes'
    return true if x is 'seconds'
    return false

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_scheduler_add_interval_cfg', tests:
  "@isa.object x":                        ( x ) -> @isa.object x
  "( @isa.function x.callee ) or ( @isa.asyncfunction x.callee )": \
                                          ( x ) -> ( @isa.function x.callee ) or ( @isa.asyncfunction x.callee )
  "@isa.positive_float x.amount":         ( x ) -> @isa.positive_float x.amount
  "@isa.vogue_scheduler_unit":            ( x ) -> @isa.vogue_scheduler_unit
#...........................................................................................................
@defaults.vogue_scheduler_add_interval_cfg =
  callee:             null
  amount:             1
  unit:               'hour'

#-----------------------------------------------------------------------------------------------------------
@types.declare 'vogue_html_or_buffer', tests:
  "@type_of x in [ 'text', 'buffer', ]":  ( x ) -> @type_of x in [ 'text', 'buffer', ]




############################################################################################################
@defaults = GUY.lft.freeze @defaults

