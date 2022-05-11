(function() {
  'use strict';
  var node, ref, ref1, svg;

  ref = µ.DOM.select_all('.sparkline');
  for (node of ref) {
    svg = VOGUE.sparkline_from_trend(JSON.parse(node.dataset.sparkline_data));
    µ.DOM.append(node, svg);
  }

  ref1 = µ.DOM.select_all('.trendchart');
  for (node of ref1) {
    svg = VOGUE.chart_from_trends(JSON.parse(node.dataset.trends));
    µ.DOM.append(node, svg);
  }

}).call(this);

//# sourceMappingURL=ops2.js.map