import { t, v as vElement, r, a as renderer, d as defineComponent, c as components } from "./vendor.js";
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
var index_marko = "";
const _marko_componentType = "n16FFHyL", _marko_template = t(_marko_componentType);
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
