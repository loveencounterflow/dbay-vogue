
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
pluck                     = GUY.obj.pluck_with_fallback.bind GUY.obj
module.exports            = Object.assign       \
  module.exports,                               \
  ( require './vogue-db'        ),              \
  ( require './vogue-scraper'   ),              \
  ( require './vogue-scheduler' ),              \
  ( require './vogue-server'    )


#===========================================================================================================
class @Vogue extends Vogue_common_mixin()

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    #.......................................................................................................
    @cfg            = { @defaults.vogue_hub_constructor_cfg..., cfg..., }
    @cfg.vdb       ?= new module.exports.Vogue_db()
    @cfg.scrapers  ?= new module.exports.Vogue_scrapers()
    @cfg.scheduler ?= new module.exports.Vogue_scheduler()
    @cfg.server    ?= new module.exports.Vogue_server()
    @types.validate.vogue_hub_constructor_cfg @cfg
    { vdb,        } = pluck @cfg, null, 'vdb';        GUY.props.hide @, 'vdb',       vdb
    { scrapers,   } = pluck @cfg, null, 'scrapers';   GUY.props.hide @, 'scrapers',  scrapers
    { scheduler,  } = pluck @cfg, null, 'scheduler';  GUY.props.hide @, 'scheduler', scheduler
    { server,     } = pluck @cfg, null, 'server';     GUY.props.hide @, 'server',    server
    @cfg            = GUY.lft.freeze @cfg
    @vdb._set_hub       @
    @scrapers._set_hub  @
    @scheduler._set_hub @
    @server._set_hub    @
    return undefined


