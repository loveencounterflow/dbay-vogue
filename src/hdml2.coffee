
'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'SCRAPER/HDML2'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
types                     = new ( require 'intertype' ).Intertype()
{ HDML: _HDML, }          = require 'hdml'


#-----------------------------------------------------------------------------------------------------------
@HDML =
  open:     ( tag, atrs           ) -> _HDML.create_tag '<', tag, atrs
  close:    ( tag                 ) -> _HDML.create_tag '>', tag
  single:   ( tag, atrs           ) -> _HDML.create_tag '^', tag, atrs
  pair:     ( tag, atrs           ) -> ( @open tag, atrs ) + ( @close tag )
  text:     ( text                ) -> _HDML.escape_text text
  insert:   ( tag, atrs, content  ) ->
    switch arity = arguments.length
      when 2 then [ tag, atrs, content, ] = [ tag, null, atrs, ]
      when 3 then null
      else throw new Error "^hdml2@1^ expected 2 or 3 arguments, got #{arity}"
    types.validate.nonempty_text tag
    types.validate.text content
    return ( @open tag, atrs ) + content + ( @close tag )


############################################################################################################
if module is require.main then do =>
  debug '^4354^', @HDML.single  'path', { id: 'c1', d: 'M100,100L200,200', }
  debug '^4354^', @HDML.open    'div', { id: 'c1', class: 'foo bar', }
  debug '^4354^', @HDML.text    "<helo>"
  debug '^4354^', @HDML.close   'div'
  debug '^4354^', @HDML.pair    'div'
  debug '^4354^', @HDML.single  'mrg:loc#baselines'
  debug '^4354^', @HDML.pair    'mrg:loc#baselines'
  debug '^4354^', @HDML.insert 'div', { id: 'c1', class: 'foo bar', }, @HDML.text "<helo>"
  debug '^4354^', @HDML.insert 'div', { id: 'c1', class: 'foo bar', }, @HDML.single 'path', { id: 'c1', d: 'M100,100L200,200', }
