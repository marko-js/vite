import { t, v as vElement, r, a as renderer, d as defineComponent, c as components } from "./vendor.69023bd2.js";
var template_marko = "\n  div { color: green }\n";
const _marko_componentType = "1BSUdNzk", _marko_template = t(_marko_componentType);
const _marko_node = vElement("div", {
  "id": "class"
}, "0", null, 0, 1);
r(_marko_componentType, () => _marko_template);
const _marko_component = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template._ = renderer(function(input, out, _componentDef, _component, state) {
  out.n(_marko_node, _component);
}, {
  t: _marko_componentType
}, _marko_component);
_marko_template.Component = defineComponent(_marko_component, _marko_template._);
components.init();
