

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
GUY                       = require 'guy'
_types                    = require './types'



#===========================================================================================================
@Vogue_common_mixin = ( clasz = Object ) => class extends clasz

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super()
    GUY.props.hide @, 'types',    _types.types
    GUY.props.hide @, 'defaults', _types.defaults
    return undefined


  #---------------------------------------------------------------------------------------------------------
  _set_hub: ( hub ) ->
    unless @hub is null
      throw new Error "^Vogue_common_mixin@1^ unable to set hub on a #{@types.type_of @}"
    GUY.props.hide @, 'hub', hub
    return null


