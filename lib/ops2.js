(function() {
  'use strict';
  var node, ref, ref1, sparkline_data, svg, trends;

  ref = µ.DOM.select_all('.sparkline');
  for (node of ref) {
    ({sparkline_data} = node.dataset);
    sparkline_data = JSON.parse(sparkline_data);
    svg = VOGUE.sparkline_from_trend(sparkline_data);
    µ.DOM.append(node, svg);
  }

  ref1 = µ.DOM.select_all('.trendchart');
  for (node of ref1) {
    ({trends} = node.dataset);
    trends = JSON.parse(trends);
    svg = VOGUE.chart_from_trends(trends);
    µ.DOM.append(node, svg);
  }

}).call(this);

//# sourceMappingURL=ops2.js.map