(function() {
  'use strict';
  var node, ref, svg;

  ref = µ.DOM.select_all('.sparkline');
  for (node of ref) {
    svg = VOGUE.sparkline_from_trend(JSON.parse(node.dataset.trend));
    µ.DOM.append(node, svg);
  }

}).call(this);

//# sourceMappingURL=ops2.js.map