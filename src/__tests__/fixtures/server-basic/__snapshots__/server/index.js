"use strict";
var http = require("http");
var html = require("marko/dist/runtime/html");
var _marko_renderer = require("marko/dist/runtime/components/renderer");
var _marko_tag = require("marko/dist/runtime/helpers/render-tag");
function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : {default: e};
}
var http__default = /* @__PURE__ */ _interopDefaultLegacy(http);
var _marko_renderer__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_renderer);
var _marko_tag__default = /* @__PURE__ */ _interopDefaultLegacy(_marko_tag);
const _marko_componentType$2 = "71MAcDxK", _marko_template$2 = html.t(_marko_componentType$2);
const _marko_component$2 = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template$2._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<div id=class></div>");
}, {
  t: _marko_componentType$2
}, _marko_component$2);
const _marko_componentType$1 = "c1uTHRl3", _marko_template$1 = html.t(_marko_componentType$1);
const _marko_component$1 = {};
_marko_template$1._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<div id=implicit>");
  _marko_tag__default["default"](_marko_template$2, {}, out, _component, "1");
  out.w("</div>");
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);
const _marko_componentType = "gaG2ehQw", _marko_template = html.t(_marko_componentType);
const _marko_component = {};
_marko_template._ = _marko_renderer__default["default"](function(input, out, _component, component, state) {
  out.w("<div id=page>");
  _marko_tag__default["default"](_marko_template$1, {}, out, _component, "1");
  out.w("</div>");
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);
http__default["default"].createServer((req, res) => {
  _marko_template.render({}, res);
}).listen();
