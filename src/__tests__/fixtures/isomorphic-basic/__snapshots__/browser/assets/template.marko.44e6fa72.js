import {v as vElement, r as renderer, d as defineComponent, t, a as r, c as components} from "./vendor.6c097f0e.js";
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
var template_marko = "\n  div { color: green }\n";
const _marko_componentType = "1BSUdNzk", _marko_template = t(_marko_componentType);
const _marko_node = vElement("div", {
  id: "class"
}, "0", null, 0, 1);
r(_marko_componentType, () => _marko_template);
const _marko_component = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template._ = renderer(function(input, out, _component, component, state) {
  out.n(_marko_node, component);
}, {
  t: _marko_componentType
}, _marko_component);
_marko_template.Component = defineComponent(_marko_component, _marko_template._);
components.init();
