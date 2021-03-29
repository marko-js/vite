var FLAG_WILL_RERENDER_IN_BROWSER = 1;
function nextComponentIdProvider$1(out) {
  var prefix = out.global.componentIdPrefix || out.global.widgetIdPrefix || "s";
  var nextId = 0;
  return function nextComponentId() {
    return prefix + nextId++;
  };
}
function attachBubblingEvent(componentDef, handlerMethodName, isOnce, extraArgs) {
  if (handlerMethodName) {
    if (extraArgs) {
      var component = componentDef.h_;
      var eventIndex = component._W_++;
      if (!(componentDef._I_ & FLAG_WILL_RERENDER_IN_BROWSER)) {
        if (eventIndex === 0) {
          component.N_ = [extraArgs];
        } else {
          component.N_.push(extraArgs);
        }
      }
      return handlerMethodName + " " + componentDef.id + " " + isOnce + " " + eventIndex;
    } else {
      return handlerMethodName + " " + componentDef.id + " " + isOnce;
    }
  }
}
var _T_ = nextComponentIdProvider$1;
var av_$1 = true;
var _C_ = attachBubblingEvent;
var aB_ = function noop() {
};
var D_ = function noop2() {
};
var util = {
  _T_,
  av_: av_$1,
  _C_,
  aB_,
  D_
};
var initComponents$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var copyProps = function copyProps2(from, to) {
  Object.getOwnPropertyNames(from).forEach(function(name) {
    var descriptor = Object.getOwnPropertyDescriptor(from, name);
    Object.defineProperty(to, name, descriptor);
  });
};
class ServerComponent {
  constructor(id, input, out, typeName, customEvents, scope) {
    this.id = id;
    this.O_ = customEvents;
    this.G_ = scope;
    this.typeName = typeName;
    this.N_ = void 0;
    this._W_ = 0;
    this.onCreate(input, out);
    this._X_ = this.onInput(input, out) || input;
    if (this.Q_ === void 0) {
      this.Q_ = this._X_;
    }
    this.onRender(out);
  }
  set input(newInput) {
    this.Q_ = newInput;
  }
  get input() {
    return this.Q_;
  }
  set state(newState) {
    this.J_ = newState;
  }
  get state() {
    return this.J_;
  }
  get _t_() {
    return this.J_;
  }
  elId(nestedId) {
    var id = this.id;
    if (nestedId == null) {
      return id;
    } else {
      if (typeof nestedId !== "string") {
        nestedId = String(nestedId);
      }
      if (nestedId.indexOf("#") === 0) {
        id = "#" + id;
        nestedId = nestedId.substring(1);
      }
      return id + "-" + nestedId;
    }
  }
  onCreate() {
  }
  onInput() {
  }
  onRender() {
  }
}
ServerComponent.prototype.getElId = ServerComponent.prototype.elId;
var ServerComponent_1 = ServerComponent;
const constructorCache = new Map();
function createServerComponentClass(renderingLogic) {
  var renderingLogicProps = typeof renderingLogic === "function" ? renderingLogic.prototype : renderingLogic;
  class ServerComponent2 extends ServerComponent_1 {
  }
  copyProps(renderingLogicProps, ServerComponent2.prototype);
  return ServerComponent2;
}
function createComponent(renderingLogic, id, input, out, typeName, customEvents, scope) {
  let ServerComponent2;
  if (renderingLogic) {
    ServerComponent2 = constructorCache.get(renderingLogic);
    if (!ServerComponent2) {
      ServerComponent2 = createServerComponentClass(renderingLogic);
      constructorCache.set(renderingLogic, ServerComponent2);
    }
  } else {
    ServerComponent2 = ServerComponent_1;
  }
  return new ServerComponent2(id, input, out, typeName, customEvents, scope);
}
var av_ = true;
var _P_ = createComponent;
var registry = {
  av_,
  _P_
};
function getAugmentedNamespace(n) {
  if (n.__esModule)
    return n;
  var a = Object.defineProperty({}, "__esModule", {value: true});
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
function createCommonjsModule(fn) {
  var module = {exports: {}};
  return fn(module, module.exports), module.exports;
}
var nextComponentIdProvider = util._T_;
function GlobalComponentsContext(out) {
  this._U_ = {};
  this._q_ = void 0;
  this._M_ = nextComponentIdProvider(out);
}
var GlobalComponentsContext_1 = GlobalComponentsContext;
var ComponentsContext_1 = createCommonjsModule(function(module, exports) {
  function ComponentsContext(out, parentComponentsContext) {
    var globalComponentsContext;
    var componentDef;
    if (parentComponentsContext) {
      globalComponentsContext = parentComponentsContext.e_;
      componentDef = parentComponentsContext.j_;
      var nestedContextsForParent;
      if (!(nestedContextsForParent = parentComponentsContext._Q_)) {
        nestedContextsForParent = parentComponentsContext._Q_ = [];
      }
      nestedContextsForParent.push(this);
    } else {
      globalComponentsContext = out.global.b_;
      if (globalComponentsContext === void 0) {
        out.global.b_ = globalComponentsContext = new GlobalComponentsContext_1(out);
      }
    }
    this.e_ = globalComponentsContext;
    this.b_ = [];
    this.y_ = out;
    this.j_ = componentDef;
    this._Q_ = void 0;
    this.p_ = parentComponentsContext && parentComponentsContext.p_;
  }
  ComponentsContext.prototype = {
    z_: function(doc) {
      var componentDefs = this.b_;
      ComponentsContext._R_(componentDefs, doc);
      this.y_.emit("_S_");
      this.y_.global.b_ = void 0;
      return componentDefs;
    }
  };
  function getComponentsContext(out) {
    return out.b_ || (out.b_ = new ComponentsContext(out));
  }
  module.exports = exports = ComponentsContext;
  exports.o_ = getComponentsContext;
});
var initComponents = /* @__PURE__ */ getAugmentedNamespace(initComponents$1);
ComponentsContext_1._R_ = initComponents._R_;
var init = window.$initComponents = initComponents.al_;
var register = function(id, component) {
  registry.r(id, function() {
    return component;
  });
};
export {init as i, register as r};
