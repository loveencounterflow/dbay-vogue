(function() {
  'use strict';
  var CND, _HDML, badge, debug, echo, help, info, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'SCRAPER/HDML2';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  types = new (require('intertype')).Intertype();

  ({
    HDML: _HDML
  } = require('hdml'));

  //-----------------------------------------------------------------------------------------------------------
  this.HDML = {
    open: function(tag, atrs) {
      return _HDML.create_tag('<', tag, atrs);
    },
    close: function(tag) {
      return _HDML.create_tag('>', tag);
    },
    single: function(tag, atrs) {
      return _HDML.create_tag('^', tag, atrs);
    },
    pair: function(tag, atrs) {
      return (this.open(tag, atrs)) + (this.close(tag));
    },
    text: function(text) {
      return _HDML.escape_text(text);
    },
    embrace: function(tag, atrs, content) {
      return (this.open(tag, atrs)) + content + (this.close(tag));
    }
  };

  //###########################################################################################################
  if (module === require.main) {
    (() => {
      debug('^4354^', this.HDML.single('path', {
        id: 'c1',
        d: 'M100,100L200,200'
      }));
      debug('^4354^', this.HDML.open('div', {
        id: 'c1',
        class: 'foo bar'
      }));
      debug('^4354^', this.HDML.text("<helo>"));
      debug('^4354^', this.HDML.close('div'));
      debug('^4354^', this.HDML.pair('div'));
      debug('^4354^', this.HDML.single('mrg:loc#baselines'));
      debug('^4354^', this.HDML.pair('mrg:loc#baselines'));
      debug('^4354^', this.HDML.embrace('div', {
        id: 'c1',
        class: 'foo bar'
      }, this.HDML.text("<helo>")));
      return debug('^4354^', this.HDML.embrace('div', {
        id: 'c1',
        class: 'foo bar'
      }, this.HDML.single('path', {
        id: 'c1',
        d: 'M100,100L200,200'
      })));
    })();
  }

}).call(this);

//# sourceMappingURL=hdml2.js.map