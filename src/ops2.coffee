

'use strict'

for node from µ.DOM.select_all '.sparkline'
  svg = VOGUE.sparkline_from_trend JSON.parse node.dataset.trend
  µ.DOM.append node, svg
