
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
{ Vogue_common_mixin }    = require './vogue-common-mixin'
module.exports            = Object.assign       \
  module.exports,                               \
  ( require './vogue-db'     ),                 \
  ( require './vogue-scraper'),                 \
  ( require './vogue-server' )


#===========================================================================================================
class @Vogue extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    #.......................................................................................................
    @cfg          = { @defaults.vogue_hub_constructor_cfg..., cfg..., }
    @cfg.vdb     ?= new ( require './vogue-db'      ).Vogue_db()
    @cfg.server  ?= new ( require './vogue-server'  ).Vogue_server()
    @types.validate.vogue_hub_constructor_cfg @cfg
    { vdb,    }   = GUY.obj.pluck_with_fallback @cfg, null, 'vdb'; GUY.props.hide @, 'vdb', vdb
    { server, }   = GUY.obj.pluck_with_fallback @cfg, null, 'server'; GUY.props.hide @, 'server', server
    @cfg          = GUY.lft.freeze @cfg
    @vdb._set_hub @
    return undefined


