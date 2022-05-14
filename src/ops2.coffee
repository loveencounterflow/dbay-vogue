

'use strict'

for node from µ.DOM.select_all '.sparkline'
  { sparkline_data  } = node.dataset
  sparkline_data      = JSON.parse sparkline_data
  svg                 = VOGUE.sparkline_from_trend sparkline_data
  µ.DOM.append node, svg
for node from µ.DOM.select_all '.trendchart'
  { trends          } = node.dataset
  trends              = JSON.parse trends
  svg                 = VOGUE.chart_from_trends trends
  µ.DOM.append node, svg
