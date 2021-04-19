import {v as vElement, r as renderer, d as defineComponent, t, a as r, b as renderTag} from "./vendor.cca7bcb5.js";
const p = function polyfill(modulePath = ".", importFunctionName = "__import__") {
  try {
    self[importFunctionName] = new Function("u", `return import(u)`);
  } catch (error) {
    const baseURL = new URL(modulePath, location);
    const cleanup = (script) => {
      URL.revokeObjectURL(script.src);
      script.remove();
    };
    self[importFunctionName] = (url) => new Promise((resolve, reject) => {
      const absURL = new URL(url, baseURL);
      if (self[importFunctionName].moduleMap[absURL]) {
        return resolve(self[importFunctionName].moduleMap[absURL]);
      }
      const moduleBlob = new Blob([
        `import * as m from '${absURL}';`,
        `${importFunctionName}.moduleMap['${absURL}']=m;`
      ], {type: "text/javascript"});
      const script = Object.assign(document.createElement("script"), {
        type: "module",
        src: URL.createObjectURL(moduleBlob),
        onerror() {
          reject(new Error(`Failed to import: ${url}`));
          cleanup(script);
        },
        onload() {
          resolve(self[importFunctionName].moduleMap[absURL]);
          cleanup(script);
        }
      });
      document.head.appendChild(script);
    });
    self[importFunctionName].moduleMap = {};
  }
};
p("/assets/");
var index_marko = "\n  div { color: green }\n";
const _marko_template$2 = t();
const _marko_node = vElement("div", {
  id: "implicit"
}, "0", null, 0, 1);
const _marko_componentType$2 = r("jNoSojxo", () => _marko_template$2), _marko_component$2 = {};
_marko_template$2._ = renderer(function(input, out, _component, component, state) {
  out.n(_marko_node, component);
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
const _marko_template$1 = t();
const _marko_componentType$1 = r("iKnY83y7", () => _marko_split_component), _marko_component$1 = {};
_marko_template$1._ = renderer(function(input, out, _component, component, state) {
  out.be("div", {
    id: "split"
  }, "0", component, null, 1);
  renderTag(_marko_template$2, {}, out, _component, "1");
  out.ee();
}, {
  t: _marko_componentType$1,
  s: true
}, _marko_component$1);
_marko_template$1.Component = defineComponent(_marko_component$1, _marko_template$1._);
const _marko_template = t();
const _marko_componentType = r("pWXzc6jh", () => _marko_template), _marko_component = {};
_marko_template._ = renderer(function(input, out, _component, component, state) {
  out.be("div", {
    id: "page"
  }, "0", component, null, 1);
  renderTag(_marko_template$1, {}, out, _component, "1");
  out.ee();
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);
_marko_template.Component = defineComponent(_marko_component, _marko_template._);
