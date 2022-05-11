

'use strict'

for node from µ.DOM.select_all '.sparkline'
  svg = VOGUE.sparkline_from_trend JSON.parse node.dataset.sparkline_data
  µ.DOM.append node, svg
for node from µ.DOM.select_all '.trendchart'
  svg = VOGUE.chart_from_trends JSON.parse node.dataset.trends
  µ.DOM.append node, svg
