"use strict";
var __defProp = Object.defineProperty;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
var __assign = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var http = require("http");
var html = require("marko/dist/runtime/html");
var _marko_renderer = require("marko/dist/runtime/components/renderer");
var _marko_tag = require("marko/dist/runtime/helpers/render-tag");
var _marko_to_string = require("marko/dist/runtime/helpers/to-string");
var _flush_here_and_after__ = require("marko/dist/core-tags/core/__flush_here_and_after__.js");
var _marko_dynamic_tag = require("marko/dist/runtime/helpers/dynamic-tag");
var _initComponents = require("marko/dist/core-tags/components/init-components-tag.js");
var _awaitReorderer = require("marko/dist/core-tags/core/await/reorderer-renderer.js");
var _preferredScriptLocation = require("marko/dist/core-tags/components/preferred-script-location-tag.js");
function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : {default: e};
}
var http__default = /* @__PURE__ */ _interopDefaultLegacy(http);
var _marko_renderer__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_renderer);
var _marko_tag__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_tag);
var _marko_to_string__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_to_string);
var _flush_here_and_after____default = /* @__PURE__ */ _interopDefaultLegacy(_flush_here_and_after__);
var _marko_dynamic_tag__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_dynamic_tag);
var _initComponents__default = /* @__PURE__ */ _interopDefaultLegacy(_initComponents);
var _awaitReorderer__default = /* @__PURE__ */ _interopDefaultLegacy(_awaitReorderer);
var _preferredScriptLocation__default = /* @__PURE__ */ _interopDefaultLegacy(_preferredScriptLocation);
const _marko_template$5 = html.t();
const _marko_componentType$5 = "1BSUdNzk", _marko_component$5 = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template$5._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<div id=class></div>");
}, {
  t: _marko_componentType$5
}, _marko_component$5);
const _marko_template$4 = html.t();
const _marko_componentType$4 = "9/pH0cjn", _marko_component$4 = {};
_marko_template$4._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<div id=implicit>");
  _marko_tag__default["default"](_marko_template$5, {}, out, _component, "1");
  out.w("</div>");
}, {
  t: _marko_componentType$4,
  i: true
}, _marko_component$4);
const _marko_template$3 = html.t();
function buildHTML(parts, attrsLookup) {
  const last = parts.length - 1;
  let result = parts[last];
  for (let i = last; i--; ) {
    const part = parts[i];
    result = parts[--i] + attrsLookup[part] + result;
  }
  return result;
}
function attrsToString(attrs) {
  let result = "";
  for (const name in attrs) {
    const value = attrs[name];
    if (value === false || value == null) {
      continue;
    }
    result += ` ${value === "" || value === true ? name : `${name}="${value.replace(/"/g, "&#39;")}"`}`;
  }
  return result;
}
const _marko_componentType$3 = "Zzp70RF5", _marko_component$3 = {};
_marko_template$3._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  const $global = out.global;
  const entries = $global.___viteEntries || ($global.___viteEntries = []);
  let writtenEntries = 0;
  let {
    scriptAttrs,
    inlineScriptAttrs,
    externalScriptAttrs,
    styleAttrs,
    inlineStyleAttrs,
    externalStyleAttrs
  } = input;
  if (scriptAttrs) {
    inlineScriptAttrs = inlineScriptAttrs ? __assign(__assign({}, scriptAttrs), inlineScriptAttrs) : scriptAttrs;
    externalScriptAttrs = externalScriptAttrs ? __assign(__assign({}, scriptAttrs), externalScriptAttrs) : scriptAttrs;
  }
  if (styleAttrs) {
    inlineStyleAttrs = inlineStyleAttrs ? __assign(__assign({}, styleAttrs), inlineStyleAttrs) : styleAttrs;
    externalStyleAttrs = externalStyleAttrs ? __assign(__assign({}, styleAttrs), externalStyleAttrs) : styleAttrs;
  }
  const attrsLookup = [attrsToString(inlineScriptAttrs), attrsToString(externalScriptAttrs), attrsToString(inlineStyleAttrs), attrsToString(externalStyleAttrs)];
  _marko_tag__default["default"](_flush_here_and_after____default["default"], {
    renderBody: (out2) => {
      const lastWrittenEntry = writtenEntries;
      writtenEntries = entries.length;
      for (let _steps = (writtenEntries - 1 - lastWrittenEntry) / 1, _step = 0; _step <= _steps; _step++) {
        const i = lastWrittenEntry + _step * 1;
        const manifest = __MARKO_MANIFEST__[entries[i]];
        const parts = manifest[input.slot];
        if (parts) {
          out2.w(_marko_to_string__default["default"](buildHTML(parts, attrsLookup)));
        } else if (parts !== null) {
          throw new Error(`@marko/vite: Invalid slot requested "${input.slot}". Expected one of ${Object.keys(manifest).join(", ")}`);
        }
      }
    }
  }, out, _component, "0");
}, {
  t: _marko_componentType$3,
  i: true
}, _marko_component$3);
const _marko_template$2 = html.t();
const _marko_componentType$2 = "EBjOWFdJ", _marko_component$2 = {};
_marko_template$2._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<!DOCTYPE html><html lang=en><head>");
  _marko_tag__default["default"](_marko_template$3, {
    slot: "head-prepend"
  }, out, _component, "2");
  out.w("<title>Hello World</title>");
  _marko_tag__default["default"](_marko_template$3, {
    slot: "head"
  }, out, _component, "4");
  out.w("</head><body>");
  _marko_tag__default["default"](_marko_template$3, {
    slot: "body-prepend"
  }, out, _component, "6");
  _marko_dynamic_tag__default["default"](out, input.renderBody, null, null, null, null, _component, "7");
  _marko_tag__default["default"](_marko_template$3, {
    slot: "body"
  }, out, _component, "8");
  _marko_tag__default["default"](_initComponents__default["default"], {}, out, _component, "9");
  _marko_tag__default["default"](_awaitReorderer__default["default"], {}, out, _component, "10");
  _marko_tag__default["default"](_preferredScriptLocation__default["default"], {}, out, _component, "11");
  out.w("</body></html>");
}, {
  t: _marko_componentType$2,
  i: true
}, _marko_component$2);
const _marko_template$1 = html.t();
const _marko_componentType$1 = "NgVTgNMO", _marko_component$1 = {};
_marko_template$1._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  _marko_tag__default["default"](_marko_template$2, {
    renderBody: (out2) => {
      out2.w("<div id=page>");
      _marko_tag__default["default"](_marko_template$4, {}, out2, _component, "2");
      out2.w("</div>");
    }
  }, out, _component, "0");
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);
const _marko_template = html.t();
const _marko_componentType = "NgVTgNMO", _marko_component = {};
_marko_template._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  const $global = out.global;
  ($global.___viteEntries || ($global.___viteEntries = [])).push("src/template.marko.html");
  _marko_tag__default["default"](_marko_template$1, input, out, _component, "0");
  _marko_tag__default["default"](_initComponents__default["default"], {}, out, _component, "1");
  _marko_tag__default["default"](_awaitReorderer__default["default"], {}, out, _component, "2");
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);
http__default["default"].createServer((req, res) => {
  _marko_template.render({}, res);
}).listen();
