import { t, v as vElement, r, a as renderer, d as defineComponent, b as renderTag } from "./vendor.d0fc20d1.js";
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
var index_marko = "\n  div { color: green }\n";
const _marko_componentType$2 = "jNoSojxo", _marko_template$2 = t(_marko_componentType$2);
const _marko_node = vElement("div", {
  "id": "implicit"
}, "0", null, 0, 1);
r(_marko_componentType$2, () => _marko_template$2);
const _marko_component$2 = {};
_marko_template$2._ = renderer(function(input, out, _componentDef, _component, state) {
  out.n(_marko_node, _component);
}, {
  t: _marko_componentType$2,
  i: true
}, _marko_component$2);
_marko_template$2.Component = defineComponent(_marko_component$2, _marko_template$2._);
var _marko_split_component = {
  onMount() {
    console.log("mounted");
  }
};
const _marko_componentType$1 = "iKnY83y7", _marko_template$1 = t(_marko_componentType$1);
r(_marko_componentType$1, () => _marko_split_component);
const _marko_component$1 = {};
_marko_template$1._ = renderer(function(input, out, _componentDef, _component, state) {
  out.be("div", {
    "id": "split"
  }, "0", _component, null, 1);
  renderTag(_marko_template$2, {}, out, _componentDef, "1");
  out.ee();
}, {
  t: _marko_componentType$1,
  s: true
}, _marko_component$1);
_marko_template$1.Component = defineComponent(_marko_component$1, _marko_template$1._);
const _marko_componentType = "pWXzc6jh", _marko_template = t(_marko_componentType);
r(_marko_componentType, () => _marko_template);
const _marko_component = {};
_marko_template._ = renderer(function(input, out, _componentDef, _component, state) {
  out.be("div", {
    "id": "page"
  }, "0", _component, null, 1);
  renderTag(_marko_template$1, {}, out, _componentDef, "1");
  out.ee();
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);
_marko_template.Component = defineComponent(_marko_component, _marko_template._);
