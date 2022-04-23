
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
@types.declare 'vogue_server_constructor_cfg', tests:
  "@isa.object x":                                  ( x ) -> @isa.object x
  # "( @isa.object x.db ) or ( @isa.function x.db ":  ( x ) -> ( @isa.object x.db ) or ( @isa.function x.db )
  "@isa.vogue_host x.host":                    ( x ) -> @isa.vogue_host x.host
  "@isa.vogue_port x.port":                    ( x ) -> @isa.vogue_port x.port
#...........................................................................................................
@defaults.vogue_server_constructor_cfg =
  client:   null
  host:     'localhost'
  port:     3456


############################################################################################################
@defaults = GUY.lft.freeze @defaults

