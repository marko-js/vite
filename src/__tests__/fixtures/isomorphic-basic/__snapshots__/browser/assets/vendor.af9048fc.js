var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function createCommonjsModule(fn) {
  var module = {exports: {}};
  return fn(module, module.exports), module.exports;
}
var win$1 = typeof window !== "undefined" ? window : commonjsGlobal;
var NOOP = win$1.$W10NOOP = win$1.$W10NOOP || function() {
};
var constants$1 = {
  NOOP
};
var isArray = Array.isArray;
function resolve(object, path, len) {
  var current = object;
  for (var i = 0; i < len; i++) {
    current = current[path[i]];
  }
  return current;
}
function resolveType(info) {
  if (info.type === "Date") {
    return new Date(info.value);
  } else if (info.type === "NOOP") {
    return constants$1.NOOP;
  } else {
    throw new Error("Bad type");
  }
}
var finalize$1 = function finalize(outer) {
  if (!outer) {
    return outer;
  }
  var assignments = outer.$$;
  if (assignments) {
    var object = outer.o;
    var len;
    if (assignments && (len = assignments.length)) {
      for (var i = 0; i < len; i++) {
        var assignment = assignments[i];
        var rhs = assignment.r;
        var rhsValue;
        if (isArray(rhs)) {
          rhsValue = resolve(object, rhs, rhs.length);
        } else {
          rhsValue = resolveType(rhs);
        }
        var lhs = assignment.l;
        var lhsLast = lhs.length - 1;
        if (lhsLast === -1) {
          object = outer.o = rhsValue;
          break;
        } else {
          var lhsParent = resolve(object, lhs, lhsLast);
          lhsParent[lhs[lhsLast]] = rhsValue;
        }
      }
    }
    assignments.length = 0;
    return object == null ? null : object;
  } else {
    return outer;
  }
};
var finalize2 = finalize$1;
var domData = {
  ad_: new WeakMap(),
  ae_: new WeakMap(),
  E_: new WeakMap(),
  af_: new WeakMap(),
  ag_: new WeakMap(),
  F_: {}
};
var componentsByDOMNode$2 = domData.E_;
var keysByDOMNode$2 = domData.ag_;
var vElementsByDOMNode = domData.ae_;
var vPropsByDOMNode = domData.ad_;
var markoUID = window.$MUID || (window.$MUID = {i: 0});
var runtimeId$1 = markoUID.i++;
var componentLookup$4 = {};
var defaultDocument$3 = document;
var EMPTY_OBJECT$2 = {};
function getComponentForEl$1(el, doc) {
  var node = typeof el == "string" ? (doc || defaultDocument$3).getElementById(el) : el;
  var component;
  var vElement2;
  while (node) {
    if (node.fragment) {
      if (node.fragment.endNode === node) {
        node = node.fragment.startNode;
      } else {
        node = node.fragment;
        component = componentsByDOMNode$2.get(node);
      }
    } else if (vElement2 = vElementsByDOMNode.get(node)) {
      component = vElement2.aA_;
    }
    if (component) {
      return component;
    }
    node = node.previousSibling || node.parentNode;
  }
}
function destroyComponentForNode$1(node) {
  var componentToDestroy = componentsByDOMNode$2.get(node.fragment || node);
  if (componentToDestroy) {
    componentToDestroy.Z_();
    delete componentLookup$4[componentToDestroy.id];
  }
}
function destroyNodeRecursive$3(node, component) {
  destroyComponentForNode$1(node);
  if (node.nodeType === 1 || node.nodeType === 12) {
    var key;
    if (component && (key = keysByDOMNode$2.get(node))) {
      if (node === component.k_[key]) {
        if (componentsByDOMNode$2.get(node) && /\[\]$/.test(key)) {
          delete component.k_[key][componentsByDOMNode$2.get(node).id];
        } else {
          delete component.k_[key];
        }
      }
    }
    var curChild = node.firstChild;
    while (curChild && curChild !== node.endNode) {
      destroyNodeRecursive$3(curChild, component);
      curChild = curChild.nextSibling;
    }
  }
}
function nextComponentId() {
  return "c" + markoUID.i++;
}
function nextComponentIdProvider$1() {
  return nextComponentId;
}
function attachBubblingEvent$1(componentDef, handlerMethodName, isOnce, extraArgs) {
  if (handlerMethodName) {
    var componentId = componentDef.id;
    if (extraArgs) {
      return [handlerMethodName, componentId, isOnce, extraArgs];
    } else {
      return [handlerMethodName, componentId, isOnce];
    }
  }
}
function getMarkoPropsFromEl$1(el) {
  var vElement2 = vElementsByDOMNode.get(el);
  var virtualProps;
  if (vElement2) {
    virtualProps = vElement2.aB_;
  } else {
    virtualProps = vPropsByDOMNode.get(el);
    if (!virtualProps) {
      virtualProps = el.getAttribute("data-marko");
      vPropsByDOMNode.set(el, virtualProps = virtualProps ? JSON.parse(virtualProps) : EMPTY_OBJECT$2);
    }
  }
  return virtualProps;
}
function normalizeComponentKey$1(key, parentId) {
  if (key[0] === "#") {
    key = key.replace("#" + parentId + "-", "");
  }
  return key;
}
function addComponentRootToKeyedElements$2(keyedElements, key, rootNode, componentId) {
  if (/\[\]$/.test(key)) {
    var repeatedElementsForKey = keyedElements[key] = keyedElements[key] || {};
    repeatedElementsForKey[componentId] = rootNode;
  } else {
    keyedElements[key] = rootNode;
  }
}
var al_ = runtimeId$1;
var C_ = componentLookup$4;
var ah_ = getComponentForEl$1;
var aC_ = destroyComponentForNode$1;
var D_ = destroyNodeRecursive$3;
var _T_ = nextComponentIdProvider$1;
var _C_ = attachBubblingEvent$1;
var am_ = getMarkoPropsFromEl$1;
var ap_ = addComponentRootToKeyedElements$2;
var aD_ = normalizeComponentKey$1;
var indexBrowser$6 = {
  al_,
  C_,
  ah_,
  aC_,
  D_,
  _T_,
  _C_,
  am_,
  ap_,
  aD_
};
var runtimeId = indexBrowser$6.al_;
var componentLookup$3 = indexBrowser$6.C_;
var getMarkoPropsFromEl = indexBrowser$6.am_;
var TEXT_NODE$1 = 3;
var listenersAttachedKey = "$MDE" + runtimeId;
var delegatedEvents = {};
function getEventFromEl(el, eventName) {
  var virtualProps = getMarkoPropsFromEl(el);
  var eventInfo = virtualProps[eventName];
  if (typeof eventInfo === "string") {
    eventInfo = eventInfo.split(" ");
    if (eventInfo[2]) {
      eventInfo[2] = eventInfo[2] === "true";
    }
    if (eventInfo.length == 4) {
      eventInfo[3] = parseInt(eventInfo[3], 10);
    }
  }
  return eventInfo;
}
function delegateEvent(node, eventName, target, event) {
  var targetMethod = target[0];
  var targetComponentId = target[1];
  var isOnce = target[2];
  var extraArgs = target[3];
  if (isOnce) {
    var virtualProps = getMarkoPropsFromEl(node);
    delete virtualProps[eventName];
  }
  var targetComponent = componentLookup$3[targetComponentId];
  if (!targetComponent) {
    return;
  }
  var targetFunc = typeof targetMethod === "function" ? targetMethod : targetComponent[targetMethod];
  if (!targetFunc) {
    throw Error("Method not found: " + targetMethod);
  }
  if (extraArgs != null) {
    if (typeof extraArgs === "number") {
      extraArgs = targetComponent.N_[extraArgs];
    }
  }
  if (extraArgs) {
    targetFunc.apply(targetComponent, extraArgs.concat(event, node));
  } else {
    targetFunc.call(targetComponent, event, node);
  }
}
function addDelegatedEventHandler$1(eventType) {
  if (!delegatedEvents[eventType]) {
    delegatedEvents[eventType] = true;
  }
}
function addDelegatedEventHandlerToDoc(eventType, doc) {
  var body = doc.body || doc;
  var listeners = doc[listenersAttachedKey] = doc[listenersAttachedKey] || {};
  if (!listeners[eventType]) {
    body.addEventListener(eventType, listeners[eventType] = function(event) {
      var propagationStopped = false;
      var oldStopPropagation = event.stopPropagation;
      event.stopPropagation = function() {
        oldStopPropagation.call(event);
        propagationStopped = true;
      };
      var curNode = event.target;
      if (!curNode) {
        return;
      }
      curNode = curNode.correspondingUseElement || (curNode.nodeType === TEXT_NODE$1 ? curNode.parentNode : curNode);
      var propName = "on" + eventType;
      var target;
      do {
        if (target = getEventFromEl(curNode, propName)) {
          delegateEvent(curNode, propName, target, event);
          if (propagationStopped) {
            break;
          }
        }
      } while ((curNode = curNode.parentNode) && curNode.getAttribute);
    }, true);
  }
}
function noop() {
}
var ab_ = noop;
var ___ = noop;
var _Z_ = delegateEvent;
var a__ = getEventFromEl;
var _D_ = addDelegatedEventHandler$1;
var an_ = function(doc) {
  Object.keys(delegatedEvents).forEach(function(eventType) {
    addDelegatedEventHandlerToDoc(eventType, doc);
  });
};
var eventDelegation = {
  ab_,
  ___,
  _Z_,
  a__,
  _D_,
  an_
};
function insertBefore$3(node, referenceNode, parentNode) {
  if (node.insertInto) {
    return node.insertInto(parentNode, referenceNode);
  }
  return parentNode.insertBefore(node, referenceNode && referenceNode.startNode || referenceNode);
}
function insertAfter$2(node, referenceNode, parentNode) {
  return insertBefore$3(node, referenceNode && referenceNode.nextSibling, parentNode);
}
function nextSibling$1(node) {
  var next = node.nextSibling;
  var fragment2 = next && next.fragment;
  if (fragment2) {
    return next === fragment2.startNode ? fragment2 : null;
  }
  return next;
}
function firstChild$1(node) {
  var next = node.firstChild;
  return next && next.fragment || next;
}
function removeChild$2(node) {
  if (node.remove)
    node.remove();
  else
    node.parentNode.removeChild(node);
}
var aF_ = insertBefore$3;
var aG_ = insertAfter$2;
var bR_ = nextSibling$1;
var _r_ = firstChild$1;
var aH_ = removeChild$2;
var helpers = {
  aF_,
  aG_,
  bR_,
  _r_,
  aH_
};
var insertBefore$2 = helpers.aF_;
var fragmentPrototype = {
  nodeType: 12,
  get firstChild() {
    var firstChild2 = this.startNode.nextSibling;
    return firstChild2 === this.endNode ? void 0 : firstChild2;
  },
  get lastChild() {
    var lastChild = this.endNode.previousSibling;
    return lastChild === this.startNode ? void 0 : lastChild;
  },
  get parentNode() {
    var parentNode = this.startNode.parentNode;
    return parentNode === this.detachedContainer ? void 0 : parentNode;
  },
  get namespaceURI() {
    return this.startNode.parentNode.namespaceURI;
  },
  get nextSibling() {
    return this.endNode.nextSibling;
  },
  get nodes() {
    var nodes = [];
    var current = this.startNode;
    while (current !== this.endNode) {
      nodes.push(current);
      current = current.nextSibling;
    }
    nodes.push(current);
    return nodes;
  },
  insertBefore: function(newChildNode, referenceNode) {
    var actualReference = referenceNode == null ? this.endNode : referenceNode;
    return insertBefore$2(newChildNode, actualReference, this.startNode.parentNode);
  },
  insertInto: function(newParentNode, referenceNode) {
    this.nodes.forEach(function(node) {
      insertBefore$2(node, referenceNode, newParentNode);
    }, this);
    return this;
  },
  remove: function() {
    this.nodes.forEach(function(node) {
      this.detachedContainer.appendChild(node);
    }, this);
  }
};
function createFragmentNode$3(startNode, nextNode, parentNode) {
  var fragment2 = Object.create(fragmentPrototype);
  var isRoot = startNode && startNode.ownerDocument === startNode.parentNode;
  fragment2.startNode = isRoot ? document.createComment("") : document.createTextNode("");
  fragment2.endNode = isRoot ? document.createComment("") : document.createTextNode("");
  fragment2.startNode.fragment = fragment2;
  fragment2.endNode.fragment = fragment2;
  var detachedContainer = fragment2.detachedContainer = document.createDocumentFragment();
  parentNode = parentNode || startNode && startNode.parentNode || detachedContainer;
  insertBefore$2(fragment2.startNode, startNode, parentNode);
  insertBefore$2(fragment2.endNode, nextNode, parentNode);
  return fragment2;
}
function beginFragmentNode$1(startNode, parentNode) {
  var fragment2 = createFragmentNode$3(startNode, null, parentNode);
  fragment2.bX_ = function(nextNode) {
    fragment2.bX_ = null;
    insertBefore$2(fragment2.endNode, nextNode, parentNode || startNode.parentNode);
  };
  return fragment2;
}
var ao_ = createFragmentNode$3;
var bY_ = beginFragmentNode$1;
var fragment = {
  ao_,
  bY_
};
var constants = constants$1;
var extend = function extend2(target, source) {
  if (!target) {
    target = {};
  }
  if (source) {
    for (var propName in source) {
      if (source.hasOwnProperty(propName)) {
        target[propName] = source[propName];
      }
    }
  }
  return target;
};
function KeySequence() {
  this._V_ = Object.create(null);
}
KeySequence.prototype._L_ = function(key) {
  var lookup = this._V_;
  if (lookup[key]) {
    return key + "_" + lookup[key]++;
  }
  lookup[key] = 1;
  return key;
};
var KeySequence_1 = KeySequence;
var w10Noop = constants.NOOP;
var attachBubblingEvent = indexBrowser$6._C_;
var addDelegatedEventHandler = eventDelegation._D_;
var EMPTY_OBJECT$1 = {};
var FLAG_WILL_RERENDER_IN_BROWSER$1 = 1;
var FLAG_HAS_RENDER_BODY = 2;
function ComponentDef(component, componentId, componentsContext) {
  this._E_ = componentsContext;
  this.h_ = component;
  this.id = componentId;
  this._F_ = void 0;
  this._G_ = false;
  this._H_ = false;
  this._I_ = 0;
  this._J_ = 0;
  this._K_ = null;
}
ComponentDef.prototype = {
  _L_: function(key) {
    return (this._K_ || (this._K_ = new KeySequence_1()))._L_(key);
  },
  elId: function(nestedId) {
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
  },
  _M_: function() {
    return this.id + "-c" + this._J_++;
  },
  d: function(eventName, handlerMethodName, isOnce, extraArgs) {
    addDelegatedEventHandler(eventName);
    return attachBubblingEvent(this, handlerMethodName, isOnce, extraArgs);
  },
  get _N_() {
    return this.h_._N_;
  }
};
ComponentDef.prototype.nk = ComponentDef.prototype._L_;
ComponentDef._O_ = function(o, types, global2, registry) {
  var id = o[0];
  var typeName = types[o[1]];
  var input = o[2] || null;
  var extra = o[3] || EMPTY_OBJECT$1;
  var state = extra.s;
  var componentProps = extra.w;
  var flags = extra.f;
  var component = registry._P_(typeName, id);
  component.U_ = true;
  if (flags & FLAG_HAS_RENDER_BODY) {
    (input || (input = {})).renderBody = w10Noop;
  }
  if (flags & FLAG_WILL_RERENDER_IN_BROWSER$1) {
    if (component.onCreate) {
      component.onCreate(input, {global: global2});
    }
    if (component.onInput) {
      input = component.onInput(input, {global: global2}) || input;
    }
  } else {
    if (state) {
      var undefinedPropNames = extra.u;
      if (undefinedPropNames) {
        undefinedPropNames.forEach(function(undefinedPropName) {
          state[undefinedPropName] = void 0;
        });
      }
      component.state = state;
    }
    if (componentProps) {
      extend(component, componentProps);
    }
  }
  component.Q_ = input;
  if (extra.b) {
    component.N_ = extra.b;
  }
  var scope = extra.p;
  var customEvents = extra.e;
  if (customEvents) {
    component._v_(customEvents, scope);
  }
  component.S_ = global2;
  return {
    id,
    h_: component,
    _F_: extra.d,
    _I_: extra.f || 0
  };
};
var ComponentDef_1 = ComponentDef;
var promise;
var queueMicrotask_1 = typeof queueMicrotask === "function" ? queueMicrotask : typeof Promise === "function" && (promise = Promise.resolve()) ? function(cb) {
  promise.then(cb).catch(rethrow);
} : setTimeout;
function rethrow(err) {
  setTimeout(function() {
    throw err;
  });
}
function ensure(state, propertyName) {
  var proto2 = state.constructor.prototype;
  if (!(propertyName in proto2)) {
    Object.defineProperty(proto2, propertyName, {
      get: function() {
        return this._u_[propertyName];
      },
      set: function(value) {
        this._f_(propertyName, value, false);
      }
    });
  }
}
function State$1(component) {
  this.h_ = component;
  this._u_ = {};
  this.V_ = false;
  this._l_ = null;
  this._k_ = null;
  this._Y_ = null;
  Object.seal(this);
}
State$1.prototype = {
  I_: function() {
    var self2 = this;
    self2.V_ = false;
    self2._l_ = null;
    self2._k_ = null;
    self2._Y_ = null;
  },
  _d_: function(newState) {
    var state = this;
    var key;
    var rawState = this._u_;
    for (key in rawState) {
      if (!(key in newState)) {
        state._f_(key, void 0, false, false);
      }
    }
    for (key in newState) {
      state._f_(key, newState[key], true, false);
    }
  },
  _f_: function(name, value, shouldEnsure, forceDirty) {
    var rawState = this._u_;
    if (shouldEnsure) {
      ensure(this, name);
    }
    if (forceDirty) {
      var forcedDirtyState = this._Y_ || (this._Y_ = {});
      forcedDirtyState[name] = true;
    } else if (rawState[name] === value) {
      return;
    }
    if (!this.V_) {
      this.V_ = true;
      this._l_ = rawState;
      this._u_ = rawState = extend({}, rawState);
      this._k_ = {};
      this.h_._e_();
    }
    this._k_[name] = value;
    if (value === void 0) {
      delete rawState[name];
    } else {
      rawState[name] = value;
    }
  },
  toJSON: function() {
    return this._u_;
  }
};
var State_1 = State$1;
var destroyComponentForNode = indexBrowser$6.aC_;
var destroyNodeRecursive$2 = indexBrowser$6.D_;
var insertBefore$1 = helpers.aF_;
var insertAfter$1 = helpers.aG_;
var removeChild$1 = helpers.aH_;
function resolveEl(el) {
  if (typeof el == "string") {
    var elId = el;
    el = document.getElementById(elId);
    if (!el) {
      throw Error("Not found: " + elId);
    }
  }
  return el;
}
function beforeRemove(referenceEl) {
  destroyNodeRecursive$2(referenceEl);
  destroyComponentForNode(referenceEl);
}
var domInsert = function(target, getEl3, afterInsert3) {
  extend(target, {
    appendTo: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      insertBefore$1(el, null, referenceEl);
      return afterInsert3(this, referenceEl);
    },
    prependTo: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      insertBefore$1(el, referenceEl.firstChild || null, referenceEl);
      return afterInsert3(this, referenceEl);
    },
    replace: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      beforeRemove(referenceEl);
      insertBefore$1(el, referenceEl, referenceEl.parentNode);
      removeChild$1(referenceEl);
      return afterInsert3(this, referenceEl);
    },
    replaceChildrenOf: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      var curChild = referenceEl.firstChild;
      while (curChild) {
        var nextSibling2 = curChild.nextSibling;
        beforeRemove(curChild);
        curChild = nextSibling2;
      }
      referenceEl.innerHTML = "";
      insertBefore$1(el, null, referenceEl);
      return afterInsert3(this, referenceEl);
    },
    insertBefore: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      insertBefore$1(el, referenceEl, referenceEl.parentNode);
      return afterInsert3(this, referenceEl);
    },
    insertAfter: function(referenceEl) {
      referenceEl = resolveEl(referenceEl);
      var el = getEl3(this, referenceEl);
      insertAfter$1(el, referenceEl, referenceEl.parentNode);
      return afterInsert3(this, referenceEl);
    }
  });
};
var actualCreateOut;
function setCreateOut(createOutFunc) {
  actualCreateOut = createOutFunc;
}
function createOut(globalData) {
  return actualCreateOut(globalData);
}
createOut.aE_ = setCreateOut;
var createOut_1 = createOut;
var nextComponentIdProvider = indexBrowser$6._T_;
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
  function getComponentsContext2(out) {
    return out.b_ || (out.b_ = new ComponentsContext(out));
  }
  module.exports = exports = ComponentsContext;
  exports.o_ = getComponentsContext2;
});
var slice$1 = Array.prototype.slice;
function isFunction(arg) {
  return typeof arg === "function";
}
function checkListener(listener) {
  if (!isFunction(listener)) {
    throw TypeError("Invalid listener");
  }
}
function invokeListener(ee, listener, args) {
  switch (args.length) {
    case 1:
      listener.call(ee);
      break;
    case 2:
      listener.call(ee, args[1]);
      break;
    case 3:
      listener.call(ee, args[1], args[2]);
      break;
    default:
      listener.apply(ee, slice$1.call(args, 1));
  }
}
function addListener(eventEmitter, type, listener, prepend) {
  checkListener(listener);
  var events = eventEmitter.$e || (eventEmitter.$e = {});
  var listeners = events[type];
  if (listeners) {
    if (isFunction(listeners)) {
      events[type] = prepend ? [listener, listeners] : [listeners, listener];
    } else {
      if (prepend) {
        listeners.unshift(listener);
      } else {
        listeners.push(listener);
      }
    }
  } else {
    events[type] = listener;
  }
  return eventEmitter;
}
function EventEmitter() {
  this.$e = this.$e || {};
}
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype = {
  $e: null,
  emit: function(type) {
    var args = arguments;
    var events = this.$e;
    if (!events) {
      return;
    }
    var listeners = events && events[type];
    if (!listeners) {
      if (type === "error") {
        var error = args[1];
        if (!(error instanceof Error)) {
          var context = error;
          error = new Error("Error: " + context);
          error.context = context;
        }
        throw error;
      }
      return false;
    }
    if (isFunction(listeners)) {
      invokeListener(this, listeners, args);
    } else {
      listeners = slice$1.call(listeners);
      for (var i = 0, len = listeners.length; i < len; i++) {
        var listener = listeners[i];
        invokeListener(this, listener, args);
      }
    }
    return true;
  },
  on: function(type, listener) {
    return addListener(this, type, listener, false);
  },
  prependListener: function(type, listener) {
    return addListener(this, type, listener, true);
  },
  once: function(type, listener) {
    checkListener(listener);
    function g() {
      this.removeListener(type, g);
      if (listener) {
        listener.apply(this, arguments);
        listener = null;
      }
    }
    this.on(type, g);
    return this;
  },
  removeListener: function(type, listener) {
    checkListener(listener);
    var events = this.$e;
    var listeners;
    if (events && (listeners = events[type])) {
      if (isFunction(listeners)) {
        if (listeners === listener) {
          delete events[type];
        }
      } else {
        for (var i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i] === listener) {
            listeners.splice(i, 1);
          }
        }
      }
    }
    return this;
  },
  removeAllListeners: function(type) {
    var events = this.$e;
    if (events) {
      delete events[type];
    }
  },
  listenerCount: function(type) {
    var events = this.$e;
    var listeners = events && events[type];
    return listeners ? isFunction(listeners) ? 1 : listeners.length : 0;
  }
};
var src = EventEmitter;
function getComponentDefs(result) {
  var componentDefs = result.b_;
  if (!componentDefs) {
    throw Error("No component");
  }
  return componentDefs;
}
function RenderResult(out) {
  this.out = this.y_ = out;
  this.b_ = void 0;
}
var RenderResult_1 = RenderResult;
var proto$2 = RenderResult.prototype = {
  getComponent: function() {
    return this.getComponents()[0];
  },
  getComponents: function(selector) {
    if (this.b_ === void 0) {
      throw Error("Not added to DOM");
    }
    var componentDefs = getComponentDefs(this);
    var components2 = [];
    componentDefs.forEach(function(componentDef) {
      var component = componentDef.h_;
      if (!selector || selector(component)) {
        components2.push(component);
      }
    });
    return components2;
  },
  afterInsert: function(doc) {
    var out = this.y_;
    var componentsContext = out.b_;
    if (componentsContext) {
      this.b_ = componentsContext.z_(doc);
    } else {
      this.b_ = null;
    }
    return this;
  },
  getNode: function(doc) {
    return this.y_.A_(doc);
  },
  getOutput: function() {
    return this.y_.B_();
  },
  toString: function() {
    return this.y_.toString();
  },
  document: typeof document != "undefined" && document
};
Object.defineProperty(proto$2, "html", {
  get: function() {
    return this.toString();
  }
});
Object.defineProperty(proto$2, "context", {
  get: function() {
    return this.y_;
  }
});
domInsert(proto$2, function getEl(renderResult, referenceEl) {
  return renderResult.getNode(referenceEl.ownerDocument);
}, function afterInsert(renderResult, referenceEl) {
  var isShadow = typeof ShadowRoot === "function" && referenceEl instanceof ShadowRoot;
  return renderResult.afterInsert(isShadow ? referenceEl : referenceEl.ownerDocument);
});
var listenerTracker = createCommonjsModule(function(module, exports) {
  var INDEX_EVENT = 0;
  var INDEX_USER_LISTENER = 1;
  var INDEX_WRAPPED_LISTENER = 2;
  var DESTROY = "destroy";
  function isNonEventEmitter(target) {
    return !target.once;
  }
  function EventEmitterWrapper(target) {
    this.$__target = target;
    this.$__listeners = [];
    this.$__subscribeTo = null;
  }
  EventEmitterWrapper.prototype = {
    $__remove: function(test, testWrapped) {
      var target = this.$__target;
      var listeners = this.$__listeners;
      this.$__listeners = listeners.filter(function(curListener) {
        var curEvent = curListener[INDEX_EVENT];
        var curListenerFunc = curListener[INDEX_USER_LISTENER];
        var curWrappedListenerFunc = curListener[INDEX_WRAPPED_LISTENER];
        if (testWrapped) {
          if (curWrappedListenerFunc && test(curEvent, curWrappedListenerFunc)) {
            target.removeListener(curEvent, curWrappedListenerFunc);
            return false;
          }
        } else if (test(curEvent, curListenerFunc)) {
          target.removeListener(curEvent, curWrappedListenerFunc || curListenerFunc);
          return false;
        }
        return true;
      });
      var subscribeTo = this.$__subscribeTo;
      if (!this.$__listeners.length && subscribeTo) {
        var self2 = this;
        var subscribeToList = subscribeTo.$__subscribeToList;
        subscribeTo.$__subscribeToList = subscribeToList.filter(function(cur) {
          return cur !== self2;
        });
      }
    },
    on: function(event, listener) {
      this.$__target.on(event, listener);
      this.$__listeners.push([event, listener]);
      return this;
    },
    once: function(event, listener) {
      var self2 = this;
      var wrappedListener = function() {
        self2.$__remove(function(event2, listenerFunc) {
          return wrappedListener === listenerFunc;
        }, true);
        listener.apply(this, arguments);
      };
      this.$__target.once(event, wrappedListener);
      this.$__listeners.push([event, listener, wrappedListener]);
      return this;
    },
    removeListener: function(event, listener) {
      if (typeof event === "function") {
        listener = event;
        event = null;
      }
      if (listener && event) {
        this.$__remove(function(curEvent, curListener) {
          return event === curEvent && listener === curListener;
        });
      } else if (listener) {
        this.$__remove(function(curEvent, curListener) {
          return listener === curListener;
        });
      } else if (event) {
        this.removeAllListeners(event);
      }
      return this;
    },
    removeAllListeners: function(event) {
      var listeners = this.$__listeners;
      var target = this.$__target;
      if (event) {
        this.$__remove(function(curEvent, curListener) {
          return event === curEvent;
        });
      } else {
        for (var i = listeners.length - 1; i >= 0; i--) {
          var cur = listeners[i];
          target.removeListener(cur[INDEX_EVENT], cur[INDEX_USER_LISTENER]);
        }
        this.$__listeners.length = 0;
      }
      return this;
    }
  };
  function EventEmitterAdapter(target) {
    this.$__target = target;
  }
  EventEmitterAdapter.prototype = {
    on: function(event, listener) {
      this.$__target.addEventListener(event, listener);
      return this;
    },
    once: function(event, listener) {
      var self2 = this;
      var onceListener = function() {
        self2.$__target.removeEventListener(event, onceListener);
        listener();
      };
      this.$__target.addEventListener(event, onceListener);
      return this;
    },
    removeListener: function(event, listener) {
      this.$__target.removeEventListener(event, listener);
      return this;
    }
  };
  function SubscriptionTracker() {
    this.$__subscribeToList = [];
  }
  SubscriptionTracker.prototype = {
    subscribeTo: function(target, options) {
      var addDestroyListener = !options || options.addDestroyListener !== false;
      var wrapper;
      var nonEE;
      var subscribeToList = this.$__subscribeToList;
      for (var i = 0, len = subscribeToList.length; i < len; i++) {
        var cur = subscribeToList[i];
        if (cur.$__target === target) {
          wrapper = cur;
          break;
        }
      }
      if (!wrapper) {
        if (isNonEventEmitter(target)) {
          nonEE = new EventEmitterAdapter(target);
        }
        wrapper = new EventEmitterWrapper(nonEE || target);
        if (addDestroyListener && !nonEE) {
          wrapper.once(DESTROY, function() {
            wrapper.removeAllListeners();
            for (var i2 = subscribeToList.length - 1; i2 >= 0; i2--) {
              if (subscribeToList[i2].$__target === target) {
                subscribeToList.splice(i2, 1);
                break;
              }
            }
          });
        }
        wrapper.$__subscribeTo = this;
        subscribeToList.push(wrapper);
      }
      return wrapper;
    },
    removeAllListeners: function(target, event) {
      var subscribeToList = this.$__subscribeToList;
      var i;
      if (target) {
        for (i = subscribeToList.length - 1; i >= 0; i--) {
          var cur = subscribeToList[i];
          if (cur.$__target === target) {
            cur.removeAllListeners(event);
            if (!cur.$__listeners.length) {
              subscribeToList.splice(i, 1);
            }
            break;
          }
        }
      } else {
        for (i = subscribeToList.length - 1; i >= 0; i--) {
          subscribeToList[i].removeAllListeners();
        }
        subscribeToList.length = 0;
      }
    }
  };
  exports = module.exports = SubscriptionTracker;
  exports.wrap = function(targetEventEmitter) {
    var nonEE;
    var wrapper;
    if (isNonEventEmitter(targetEventEmitter)) {
      nonEE = new EventEmitterAdapter(targetEventEmitter);
    }
    wrapper = new EventEmitterWrapper(nonEE || targetEventEmitter);
    if (!nonEE) {
      targetEventEmitter.once(DESTROY, function() {
        wrapper.$__listeners.length = 0;
      });
    }
    return wrapper;
  };
  exports.createTracker = function() {
    return new SubscriptionTracker();
  };
});
var copyProps = function copyProps2(from, to) {
  Object.getOwnPropertyNames(from).forEach(function(name) {
    var descriptor = Object.getOwnPropertyDescriptor(from, name);
    Object.defineProperty(to, name, descriptor);
  });
};
function inherit(ctor, superCtor, shouldCopyProps) {
  var oldProto = ctor.prototype;
  var newProto = ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      writable: true,
      configurable: true
    }
  });
  if (oldProto && shouldCopyProps !== false) {
    copyProps(oldProto, newProto);
  }
  ctor.$super = superCtor;
  ctor.prototype = newProto;
  return ctor;
}
var inherit_1 = inherit;
inherit._inherit = inherit;
var queue = [];
var msg = "" + Math.random();
window.addEventListener("message", function(ev) {
  if (ev.data === msg) {
    var callbacks = queue;
    queue = [];
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
  }
});
var indexBrowser$5 = function(callback) {
  if (queue.push(callback) === 1) {
    window.postMessage(msg, "*");
  }
};
var updatesScheduled = false;
var batchStack = [];
var unbatchedQueue = [];
function updateUnbatchedComponents() {
  if (unbatchedQueue.length) {
    try {
      updateComponents(unbatchedQueue);
    } finally {
      updatesScheduled = false;
    }
  }
}
function scheduleUpdates() {
  if (updatesScheduled) {
    return;
  }
  updatesScheduled = true;
  indexBrowser$5(updateUnbatchedComponents);
}
function updateComponents(queue2) {
  for (var i = 0; i < queue2.length; i++) {
    var component = queue2[i];
    component._A_();
  }
  queue2.length = 0;
}
function batchUpdate(func) {
  var batch = {
    az_: null
  };
  batchStack.push(batch);
  try {
    func();
  } finally {
    try {
      if (batch.az_) {
        updateComponents(batch.az_);
      }
    } finally {
      batchStack.length--;
    }
  }
}
function queueComponentUpdate(component) {
  var batchStackLen = batchStack.length;
  if (batchStackLen) {
    var batch = batchStack[batchStackLen - 1];
    if (batch.az_) {
      batch.az_.push(component);
    } else {
      batch.az_ = [component];
    }
  } else {
    scheduleUpdates();
    unbatchedQueue.push(component);
  }
}
var _i_ = queueComponentUpdate;
var _o_ = batchUpdate;
var updateManager = {
  _i_,
  _o_
};
function syncBooleanAttrProp(fromEl, toEl, name) {
  if (fromEl[name] !== toEl[name]) {
    fromEl[name] = toEl[name];
    if (fromEl[name]) {
      fromEl.setAttribute(name, "");
    } else {
      fromEl.removeAttribute(name, "");
    }
  }
}
function forEachOption(el, fn, i) {
  var curChild = el._r_;
  while (curChild) {
    if (curChild.bG_ === "option") {
      fn(curChild, ++i);
    } else {
      i = forEachOption(curChild, fn, i);
    }
    curChild = curChild.bR_;
  }
  return i;
}
function SpecialElHandlers() {
}
SpecialElHandlers.prototype = {
  option: function(fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "selected");
  },
  button: function(fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "disabled");
  },
  input: function(fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "checked");
    syncBooleanAttrProp(fromEl, toEl, "disabled");
    if (fromEl.value != toEl.q_) {
      fromEl.value = toEl.q_;
    }
    if (fromEl.hasAttribute("value") && !toEl.bK_("value")) {
      fromEl.removeAttribute("value");
    }
  },
  textarea: function(fromEl, toEl) {
    if (toEl.bU_) {
      return;
    }
    var newValue = toEl.q_;
    if (fromEl.value != newValue) {
      fromEl.value = newValue;
    }
    var firstChild2 = fromEl.firstChild;
    if (firstChild2) {
      var oldValue = firstChild2.nodeValue;
      if (oldValue == newValue || !newValue && oldValue == fromEl.placeholder) {
        return;
      }
      firstChild2.nodeValue = newValue;
    }
  },
  select: function(fromEl, toEl) {
    if (!toEl.bK_("multiple")) {
      var selected = 0;
      forEachOption(toEl, function(option, i) {
        if (option.bK_("selected")) {
          selected = i;
        }
      }, -1);
      if (fromEl.selectedIndex !== selected) {
        fromEl.selectedIndex = selected;
      }
    }
  }
};
var specialElHandlers = new SpecialElHandlers();
function VNode() {
}
VNode.prototype = {
  by_: function(finalChildCount, ownerComponent) {
    this.bO_ = finalChildCount;
    this.bP_ = 0;
    this.bE_ = null;
    this.bQ_ = null;
    this.bB_ = null;
    this.bC_ = null;
    this.aA_ = ownerComponent;
  },
  get _r_() {
    var firstChild2 = this.bE_;
    if (firstChild2 && firstChild2.bD_) {
      var nestedFirstChild = firstChild2._r_;
      return nestedFirstChild || firstChild2.bR_;
    }
    return firstChild2;
  },
  get bR_() {
    var nextSibling2 = this.bC_;
    if (nextSibling2) {
      if (nextSibling2.bD_) {
        var firstChild2 = nextSibling2._r_;
        return firstChild2 || nextSibling2.bR_;
      }
    } else {
      var parentNode = this.bB_;
      if (parentNode && parentNode.bD_) {
        return parentNode.bR_;
      }
    }
    return nextSibling2;
  },
  bq_: function(child) {
    this.bP_++;
    if (this.bG_ === "textarea") {
      if (child.bS_) {
        var childValue = child.bT_;
        this.bH_ = (this.bH_ || "") + childValue;
      } else if (child.n_ || child.m_) {
        this.bU_ = true;
      } else {
        throw TypeError();
      }
    } else {
      var lastChild = this.bQ_;
      child.bB_ = this;
      if (lastChild) {
        lastChild.bC_ = child;
      } else {
        this.bE_ = child;
      }
      this.bQ_ = child;
    }
    return child;
  },
  bJ_: function finishChild() {
    if (this.bP_ === this.bO_ && this.bB_) {
      return this.bB_.bJ_();
    } else {
      return this;
    }
  }
};
var VNode_1 = VNode;
function VDocumentFragmentClone(other) {
  extend(this, other);
  this.bB_ = null;
  this.bC_ = null;
}
function VDocumentFragment$1(out) {
  this.by_(null);
  this.y_ = out;
}
VDocumentFragment$1.prototype = {
  bA_: 11,
  bD_: true,
  br_: function() {
    return new VDocumentFragmentClone(this);
  },
  bx_: function(doc) {
    return doc.createDocumentFragment();
  }
};
inherit_1(VDocumentFragment$1, VNode_1);
VDocumentFragmentClone.prototype = VDocumentFragment$1.prototype;
var VDocumentFragment_1 = VDocumentFragment$1;
var vElementByDOMNode$2 = domData.ae_;
var ATTR_XLINK_HREF = "xlink:href";
var xmlnsRegExp = /^xmlns(:|$)/;
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var NS_XLINK = "http://www.w3.org/1999/xlink";
var NS_HTML = "http://www.w3.org/1999/xhtml";
var NS_MATH = "http://www.w3.org/1998/Math/MathML";
var NS_SVG = "http://www.w3.org/2000/svg";
var DEFAULT_NS = {
  svg: NS_SVG,
  math: NS_MATH
};
var FLAG_SIMPLE_ATTRS = 1;
var FLAG_CUSTOM_ELEMENT = 2;
var FLAG_SPREAD_ATTRS = 4;
var defineProperty = Object.defineProperty;
var ATTR_HREF = "href";
var EMPTY_OBJECT = Object.freeze({});
function convertAttrValue(type, value) {
  if (value === true) {
    return "";
  } else if (type == "object") {
    if (value instanceof RegExp) {
      return value.source;
    }
  }
  return value + "";
}
function assign(a, b) {
  for (var key in b) {
    if (hasOwnProperty$1.call(b, key)) {
      a[key] = b[key];
    }
  }
}
function setAttribute(el, namespaceURI, name, value) {
  if (namespaceURI === null) {
    el.setAttribute(name, value);
  } else {
    el.setAttributeNS(namespaceURI, name, value);
  }
}
function removeAttribute(el, namespaceURI, name) {
  if (namespaceURI === null) {
    el.removeAttribute(name);
  } else {
    el.removeAttributeNS(namespaceURI, name);
  }
}
function VElementClone(other) {
  this.bE_ = other.bE_;
  this.bB_ = null;
  this.bC_ = null;
  this.bz_ = other.bz_;
  this.bF_ = other.bF_;
  this.aB_ = other.aB_;
  this.bG_ = other.bG_;
  this._I_ = other._I_;
  this.bH_ = other.bH_;
  this.bI_ = other.bI_;
}
function VElement$3(tagName, attrs2, key, ownerComponent, childCount, flags, props) {
  this.by_(childCount, ownerComponent);
  var constId;
  if (props) {
    constId = props.i;
  }
  this.bz_ = key;
  this._I_ = flags || 0;
  this.bF_ = attrs2 || EMPTY_OBJECT;
  this.aB_ = props || EMPTY_OBJECT;
  this.bG_ = tagName;
  this.bH_ = null;
  this.bI_ = constId;
  this.n_ = false;
  this.m_ = false;
}
VElement$3.prototype = {
  bA_: 1,
  br_: function() {
    return new VElementClone(this);
  },
  e: function(tagName, attrs2, key, ownerComponent, childCount, flags, props) {
    var child = this.bq_(new VElement$3(tagName, attrs2, key, ownerComponent, childCount, flags, props));
    if (childCount === 0) {
      return this.bJ_();
    } else {
      return child;
    }
  },
  n: function(node, ownerComponent) {
    node = node.br_();
    node.aA_ = ownerComponent;
    this.bq_(node);
    return this.bJ_();
  },
  bx_: function(doc, parentNamespaceURI) {
    var tagName = this.bG_;
    var attributes = this.bF_;
    var namespaceURI = DEFAULT_NS[tagName] || parentNamespaceURI || NS_HTML;
    var flags = this._I_;
    var el = doc.createElementNS(namespaceURI, tagName);
    if (flags & FLAG_CUSTOM_ELEMENT) {
      assign(el, attributes);
    } else {
      for (var attrName in attributes) {
        var attrValue = attributes[attrName];
        if (attrValue !== false && attrValue != null) {
          var type = typeof attrValue;
          if (type !== "string") {
            attrValue = convertAttrValue(type, attrValue);
          }
          if (attrName == ATTR_XLINK_HREF) {
            setAttribute(el, NS_XLINK, ATTR_HREF, attrValue);
          } else {
            el.setAttribute(attrName, attrValue);
          }
        }
      }
      if (tagName === "textarea") {
        el.defaultValue = el.value = this.q_;
      }
    }
    vElementByDOMNode$2.set(el, this);
    return el;
  },
  bK_: function(name) {
    var value = this.bF_[name];
    return value != null && value !== false;
  }
};
inherit_1(VElement$3, VNode_1);
var proto$1 = VElementClone.prototype = VElement$3.prototype;
["checked", "selected", "disabled"].forEach(function(name) {
  defineProperty(proto$1, name, {
    get: function() {
      var value = this.bF_[name];
      return value !== false && value != null;
    }
  });
});
defineProperty(proto$1, "q_", {
  get: function() {
    var value = this.bH_;
    if (value == null) {
      value = this.bF_.value;
    }
    return value != null && value !== false ? value + "" : this.bF_.type === "checkbox" || this.bF_.type === "radio" ? "on" : "";
  }
});
VElement$3.bL_ = function(attrs2) {
  return attrs2;
};
function virtualizeElement$1(node, virtualizeChildNodes2, ownerComponent) {
  var attributes = node.attributes;
  var attrCount = attributes.length;
  var attrs2 = null;
  var props = null;
  if (attrCount) {
    attrs2 = {};
    for (var i = 0; i < attrCount; i++) {
      var attr = attributes[i];
      var attrName = attr.name;
      if (!xmlnsRegExp.test(attrName)) {
        if (attrName === "data-marko") {
          props = indexBrowser$6.am_(node);
        } else if (attr.namespaceURI === NS_XLINK) {
          attrs2[ATTR_XLINK_HREF] = attr.value;
        } else {
          attrs2[attrName] = attr.value;
        }
      }
    }
  }
  var tagName = node.nodeName;
  if (node.namespaceURI === NS_HTML) {
    tagName = tagName.toLowerCase();
  }
  var vdomEl = new VElement$3(tagName, attrs2, null, ownerComponent, 0, 0, props);
  if (vdomEl.bG_ === "textarea") {
    vdomEl.bH_ = node.value;
  } else if (virtualizeChildNodes2) {
    virtualizeChildNodes2(node, vdomEl, ownerComponent);
  }
  return vdomEl;
}
VElement$3.bM_ = virtualizeElement$1;
VElement$3.bN_ = function(fromEl, vFromEl, toEl) {
  var removePreservedAttributes = VElement$3.bL_;
  var fromFlags = vFromEl._I_;
  var toFlags = toEl._I_;
  vElementByDOMNode$2.set(fromEl, toEl);
  var attrs2 = toEl.bF_;
  var props = toEl.aB_;
  if (toFlags & FLAG_CUSTOM_ELEMENT) {
    return assign(fromEl, attrs2);
  }
  var attrName;
  var oldAttrs = vFromEl.bF_;
  if (oldAttrs) {
    if (oldAttrs === attrs2) {
      return;
    } else {
      oldAttrs = removePreservedAttributes(oldAttrs, props);
    }
  }
  var attrValue;
  if (toFlags & FLAG_SIMPLE_ATTRS && fromFlags & FLAG_SIMPLE_ATTRS) {
    if (oldAttrs["class"] !== (attrValue = attrs2["class"])) {
      fromEl.className = attrValue;
    }
    if (oldAttrs.id !== (attrValue = attrs2.id)) {
      fromEl.id = attrValue;
    }
    if (oldAttrs.style !== (attrValue = attrs2.style)) {
      fromEl.style.cssText = attrValue;
    }
    return;
  }
  attrs2 = removePreservedAttributes(attrs2, props, true);
  var namespaceURI;
  for (attrName in attrs2) {
    attrValue = attrs2[attrName];
    namespaceURI = null;
    if (attrName === ATTR_XLINK_HREF) {
      namespaceURI = NS_XLINK;
      attrName = ATTR_HREF;
    }
    if (attrValue == null || attrValue === false) {
      removeAttribute(fromEl, namespaceURI, attrName);
    } else if (oldAttrs[attrName] !== attrValue) {
      var type = typeof attrValue;
      if (type !== "string") {
        attrValue = convertAttrValue(type, attrValue);
      }
      setAttribute(fromEl, namespaceURI, attrName, attrValue);
    }
  }
  if (toEl.bz_ === null || fromFlags & FLAG_SPREAD_ATTRS) {
    for (attrName in oldAttrs) {
      if (!(attrName in attrs2)) {
        if (attrName === ATTR_XLINK_HREF) {
          fromEl.removeAttributeNS(ATTR_XLINK_HREF, ATTR_HREF);
        } else {
          fromEl.removeAttribute(attrName);
        }
      }
    }
  }
};
var VElement_1 = VElement$3;
function VText$1(value, ownerComponent) {
  this.by_(-1, ownerComponent);
  this.bT_ = value;
}
VText$1.prototype = {
  bS_: true,
  bA_: 3,
  bx_: function(doc) {
    return doc.createTextNode(this.bT_);
  },
  br_: function() {
    return new VText$1(this.bT_);
  }
};
inherit_1(VText$1, VNode_1);
var VText_1 = VText$1;
function VComponent$1(component, key, ownerComponent, preserve) {
  this.by_(null, ownerComponent);
  this.bz_ = key;
  this.h_ = component;
  this.n_ = preserve;
}
VComponent$1.prototype = {
  bA_: 2
};
inherit_1(VComponent$1, VNode_1);
var VComponent_1 = VComponent$1;
var keysByDOMNode$1 = domData.ag_;
var vElementByDOMNode$1 = domData.ae_;
var createFragmentNode$2 = fragment.ao_;
function VFragment$1(key, ownerComponent, preserve) {
  this.by_(null, ownerComponent);
  this.bz_ = key;
  this.n_ = preserve;
}
VFragment$1.prototype = {
  bA_: 12,
  bx_: function() {
    var fragment2 = createFragmentNode$2();
    keysByDOMNode$1.set(fragment2, this.bz_);
    vElementByDOMNode$1.set(fragment2, this);
    return fragment2;
  }
};
inherit_1(VFragment$1, VNode_1);
var VFragment_1 = VFragment$1;
var parseHTML = function(html) {
  var container = document.createElement("template");
  parseHTML = container.content ? function(html2) {
    container.innerHTML = html2;
    return container.content;
  } : function(html2) {
    container.innerHTML = html2;
    return container;
  };
  return parseHTML(html);
};
var parseHtml = function(html) {
  return parseHTML(html).firstChild;
};
var defaultDocument$2 = typeof document != "undefined" && document;
var specialHtmlRegexp = /[&<]/;
function virtualizeChildNodes(node, vdomParent, ownerComponent) {
  var curChild = node.firstChild;
  while (curChild) {
    vdomParent.bq_(virtualize(curChild, ownerComponent));
    curChild = curChild.nextSibling;
  }
}
function virtualize(node, ownerComponent) {
  switch (node.nodeType) {
    case 1:
      return VElement_1.bM_(node, virtualizeChildNodes, ownerComponent);
    case 3:
      return new VText_1(node.nodeValue, ownerComponent);
    case 11:
      var vdomDocFragment = new VDocumentFragment_1();
      virtualizeChildNodes(node, vdomDocFragment, ownerComponent);
      return vdomDocFragment;
  }
}
function virtualizeHTML$1(html, doc, ownerComponent) {
  if (!specialHtmlRegexp.test(html)) {
    return new VText_1(html, ownerComponent);
  }
  var vdomFragment = new VDocumentFragment_1();
  var curChild = parseHtml(html);
  while (curChild) {
    vdomFragment.bq_(virtualize(curChild, ownerComponent));
    curChild = curChild.nextSibling;
  }
  return vdomFragment;
}
var Node_prototype = VNode_1.prototype;
Node_prototype.t = function(value) {
  var type = typeof value;
  var vdomNode;
  if (type !== "string") {
    if (value == null) {
      value = "";
    } else if (type === "object") {
      if (value.toHTML) {
        vdomNode = virtualizeHTML$1(value.toHTML());
      }
    }
  }
  this.bq_(vdomNode || new VText_1(value.toString()));
  return this.bJ_();
};
Node_prototype.bv_ = function() {
  return this.bq_(new VDocumentFragment_1());
};
var b__ = VDocumentFragment_1;
var aZ_ = VElement_1;
var ba_ = VText_1;
var bb_ = VComponent_1;
var bc_ = VFragment_1;
var bM_ = virtualize;
var bd_ = virtualizeHTML$1;
var be_ = defaultDocument$2;
var vdom = {
  b__,
  aZ_,
  ba_,
  bb_,
  bc_,
  bM_,
  bd_,
  be_
};
var existingComponentLookup = indexBrowser$6.C_;
var destroyNodeRecursive$1 = indexBrowser$6.D_;
var addComponentRootToKeyedElements$1 = indexBrowser$6.ap_;
var normalizeComponentKey = indexBrowser$6.aD_;
var VElement$2 = vdom.aZ_;
var virtualizeElement = VElement$2.bM_;
var morphAttrs = VElement$2.bN_;
var keysByDOMNode = domData.ag_;
var componentByDOMNode = domData.E_;
var vElementByDOMNode = domData.ae_;
var detachedByDOMNode = domData.af_;
var insertBefore = helpers.aF_;
var insertAfter = helpers.aG_;
var nextSibling = helpers.bR_;
var firstChild = helpers._r_;
var removeChild = helpers.aH_;
var createFragmentNode$1 = fragment.ao_;
var beginFragmentNode = fragment.bY_;
var ELEMENT_NODE$1 = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var COMPONENT_NODE = 2;
var FRAGMENT_NODE = 12;
var DOCTYPE_NODE = 10;
function isAutoKey(key) {
  return key[0] !== "@";
}
function compareNodeNames(fromEl, toEl) {
  return fromEl.bG_ === toEl.bG_;
}
function caseInsensitiveCompare(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}
function onNodeAdded(node, componentsContext) {
  if (node.nodeType === ELEMENT_NODE$1)
    ;
}
function morphdom(fromNode, toNode, doc, componentsContext) {
  var globalComponentsContext;
  var isHydrate = false;
  var keySequences = Object.create(null);
  if (componentsContext) {
    globalComponentsContext = componentsContext.e_;
    isHydrate = globalComponentsContext.f_;
  }
  function insertVirtualNodeBefore(vNode, key, referenceEl, parentEl, ownerComponent, parentComponent) {
    var realNode = vNode.bx_(doc, parentEl.namespaceURI);
    insertBefore(realNode, referenceEl, parentEl);
    if (vNode.bA_ === ELEMENT_NODE$1 || vNode.bA_ === FRAGMENT_NODE) {
      if (key) {
        keysByDOMNode.set(realNode, key);
        (isAutoKey(key) ? parentComponent : ownerComponent).k_[key] = realNode;
      }
      if (vNode.bG_ !== "textarea") {
        morphChildren(realNode, vNode, parentComponent);
      }
      onNodeAdded(realNode);
    }
  }
  function insertVirtualComponentBefore(vComponent, referenceNode, referenceNodeParentEl, component, key, ownerComponent, parentComponent) {
    var rootNode = component.K_ = insertBefore(createFragmentNode$1(), referenceNode, referenceNodeParentEl);
    componentByDOMNode.set(rootNode, component);
    if (key && ownerComponent) {
      key = normalizeComponentKey(key, parentComponent.id);
      addComponentRootToKeyedElements$1(ownerComponent.k_, key, rootNode, component.id);
      keysByDOMNode.set(rootNode, key);
    }
    morphComponent(component, vComponent);
  }
  function morphComponent(component, vComponent) {
    morphChildren(component.K_, vComponent, component);
  }
  var detachedNodes = [];
  function detachNode(node, parentNode, ownerComponent) {
    if (node.nodeType === ELEMENT_NODE$1 || node.nodeType === FRAGMENT_NODE) {
      detachedNodes.push(node);
      detachedByDOMNode.set(node, ownerComponent || true);
    } else {
      destroyNodeRecursive$1(node);
      removeChild(node);
    }
  }
  function destroyComponent(component) {
    component.destroy();
  }
  function morphChildren(fromNode2, toNode2, parentComponent) {
    var curFromNodeChild = firstChild(fromNode2);
    var curToNodeChild = toNode2._r_;
    var curToNodeKey;
    var curFromNodeKey;
    var curToNodeType;
    var fromNextSibling;
    var toNextSibling;
    var matchingFromEl;
    var matchingFromComponent;
    var curVFromNodeChild;
    var fromComponent;
    outer:
      while (curToNodeChild) {
        toNextSibling = curToNodeChild.bR_;
        curToNodeType = curToNodeChild.bA_;
        curToNodeKey = curToNodeChild.bz_;
        if (curFromNodeChild && curFromNodeChild.nodeType === DOCTYPE_NODE) {
          curFromNodeChild = nextSibling(curFromNodeChild);
        }
        var ownerComponent = curToNodeChild.aA_ || parentComponent;
        var referenceComponent;
        if (curToNodeType === COMPONENT_NODE) {
          var component = curToNodeChild.h_;
          if ((matchingFromComponent = existingComponentLookup[component.id]) === void 0) {
            if (isHydrate === true) {
              var rootNode = beginFragmentNode(curFromNodeChild, fromNode2);
              component.K_ = rootNode;
              componentByDOMNode.set(rootNode, component);
              if (ownerComponent && curToNodeKey) {
                curToNodeKey = normalizeComponentKey(curToNodeKey, parentComponent.id);
                addComponentRootToKeyedElements$1(ownerComponent.k_, curToNodeKey, rootNode, component.id);
                keysByDOMNode.set(rootNode, curToNodeKey);
              }
              morphComponent(component, curToNodeChild);
              curFromNodeChild = nextSibling(rootNode);
            } else {
              insertVirtualComponentBefore(curToNodeChild, curFromNodeChild, fromNode2, component, curToNodeKey, ownerComponent, parentComponent);
            }
          } else {
            if (matchingFromComponent.K_ !== curFromNodeChild) {
              if (curFromNodeChild && (fromComponent = componentByDOMNode.get(curFromNodeChild)) && globalComponentsContext._U_[fromComponent.id] === void 0) {
                curFromNodeChild = nextSibling(fromComponent.K_);
                destroyComponent(fromComponent);
                continue;
              }
              insertBefore(matchingFromComponent.K_, curFromNodeChild, fromNode2);
            } else {
              curFromNodeChild = curFromNodeChild && nextSibling(curFromNodeChild);
            }
            if (!curToNodeChild.n_) {
              morphComponent(component, curToNodeChild);
            }
          }
          curToNodeChild = toNextSibling;
          continue;
        } else if (curToNodeKey) {
          curVFromNodeChild = void 0;
          curFromNodeKey = void 0;
          var curToNodeKeyOriginal = curToNodeKey;
          if (isAutoKey(curToNodeKey)) {
            if (ownerComponent !== parentComponent) {
              curToNodeKey += ":" + ownerComponent.id;
            }
            referenceComponent = parentComponent;
          } else {
            referenceComponent = ownerComponent;
          }
          curToNodeKey = (keySequences[referenceComponent.id] || (keySequences[referenceComponent.id] = new KeySequence_1()))._L_(curToNodeKey);
          if (curFromNodeChild) {
            curFromNodeKey = keysByDOMNode.get(curFromNodeChild);
            curVFromNodeChild = vElementByDOMNode.get(curFromNodeChild);
            fromNextSibling = nextSibling(curFromNodeChild);
          }
          if (curFromNodeKey === curToNodeKey) {
            if (!curToNodeChild.n_) {
              if (compareNodeNames(curToNodeChild, curVFromNodeChild)) {
                morphEl(curFromNodeChild, curVFromNodeChild, curToNodeChild, parentComponent);
              } else {
                detachNode(curFromNodeChild, fromNode2, ownerComponent);
                insertVirtualNodeBefore(curToNodeChild, curToNodeKey, curFromNodeChild, fromNode2, ownerComponent, parentComponent);
              }
            }
          } else {
            matchingFromEl = referenceComponent.k_[curToNodeKey];
            if (matchingFromEl === void 0 || matchingFromEl === curFromNodeChild) {
              if (isHydrate === true && curFromNodeChild) {
                if (curFromNodeChild.nodeType === ELEMENT_NODE$1 && (curToNodeChild.n_ || caseInsensitiveCompare(curFromNodeChild.nodeName, curToNodeChild.bG_ || ""))) {
                  curVFromNodeChild = virtualizeElement(curFromNodeChild);
                  curVFromNodeChild.bG_ = curToNodeChild.bG_;
                  keysByDOMNode.set(curFromNodeChild, curToNodeKey);
                  referenceComponent.k_[curToNodeKey] = curFromNodeChild;
                  if (curToNodeChild.n_) {
                    vElementByDOMNode.set(curFromNodeChild, curVFromNodeChild);
                  } else {
                    morphEl(curFromNodeChild, curVFromNodeChild, curToNodeChild, parentComponent);
                  }
                  curToNodeChild = toNextSibling;
                  curFromNodeChild = fromNextSibling;
                  continue;
                } else if (curToNodeChild.bA_ === FRAGMENT_NODE && curFromNodeChild.nodeType === COMMENT_NODE) {
                  var content = curFromNodeChild.nodeValue;
                  if (content == "F#" + curToNodeKeyOriginal) {
                    var endNode = curFromNodeChild.nextSibling;
                    var depth = 0;
                    var nodeValue;
                    while (true) {
                      if (endNode.nodeType === COMMENT_NODE) {
                        nodeValue = endNode.nodeValue;
                        if (nodeValue === "F/") {
                          if (depth === 0) {
                            break;
                          } else {
                            depth--;
                          }
                        } else if (nodeValue.indexOf("F#") === 0) {
                          depth++;
                        }
                      }
                      endNode = endNode.nextSibling;
                    }
                    var fragment2 = createFragmentNode$1(curFromNodeChild, endNode.nextSibling, fromNode2);
                    keysByDOMNode.set(fragment2, curToNodeKey);
                    vElementByDOMNode.set(fragment2, curToNodeChild);
                    referenceComponent.k_[curToNodeKey] = fragment2;
                    removeChild(curFromNodeChild);
                    removeChild(endNode);
                    if (!curToNodeChild.n_) {
                      morphChildren(fragment2, curToNodeChild, parentComponent);
                    }
                    curToNodeChild = toNextSibling;
                    curFromNodeChild = fragment2.nextSibling;
                    continue;
                  }
                }
              }
              insertVirtualNodeBefore(curToNodeChild, curToNodeKey, curFromNodeChild, fromNode2, ownerComponent, parentComponent);
              fromNextSibling = curFromNodeChild;
            } else {
              if (detachedByDOMNode.get(matchingFromEl) !== void 0) {
                detachedByDOMNode.set(matchingFromEl, void 0);
              }
              if (!curToNodeChild.n_) {
                curVFromNodeChild = vElementByDOMNode.get(matchingFromEl);
                if (compareNodeNames(curVFromNodeChild, curToNodeChild)) {
                  if (fromNextSibling === matchingFromEl) {
                    if (toNextSibling && toNextSibling.bz_ === curFromNodeKey) {
                      fromNextSibling = curFromNodeChild;
                      insertBefore(matchingFromEl, curFromNodeChild, fromNode2);
                    } else {
                      fromNextSibling = nextSibling(fromNextSibling);
                      if (curFromNodeChild) {
                        detachNode(curFromNodeChild, fromNode2, ownerComponent);
                      }
                    }
                  } else {
                    insertAfter(matchingFromEl, curFromNodeChild, fromNode2);
                    if (curFromNodeChild) {
                      detachNode(curFromNodeChild, fromNode2, ownerComponent);
                    }
                  }
                  morphEl(matchingFromEl, curVFromNodeChild, curToNodeChild, parentComponent);
                } else {
                  insertVirtualNodeBefore(curToNodeChild, curToNodeKey, curFromNodeChild, fromNode2, ownerComponent, parentComponent);
                  detachNode(matchingFromEl, fromNode2, ownerComponent);
                }
              } else {
                insertBefore(matchingFromEl, curFromNodeChild, fromNode2);
                fromNextSibling = curFromNodeChild;
              }
            }
          }
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
          continue;
        }
        while (curFromNodeChild) {
          fromNextSibling = nextSibling(curFromNodeChild);
          if (fromComponent = componentByDOMNode.get(curFromNodeChild)) {
            curFromNodeChild = fromNextSibling;
            if (!globalComponentsContext._U_[fromComponent.id]) {
              destroyComponent(fromComponent);
            }
            continue;
          }
          var curFromNodeType = curFromNodeChild.nodeType;
          var isCompatible = void 0;
          if (curFromNodeType === curToNodeType) {
            if (curFromNodeType === ELEMENT_NODE$1) {
              curVFromNodeChild = vElementByDOMNode.get(curFromNodeChild);
              if (curVFromNodeChild === void 0) {
                if (isHydrate === true) {
                  curVFromNodeChild = virtualizeElement(curFromNodeChild);
                  if (caseInsensitiveCompare(curVFromNodeChild.bG_, curToNodeChild.bG_)) {
                    curVFromNodeChild.bG_ = curToNodeChild.bG_;
                  }
                } else {
                  curFromNodeChild = fromNextSibling;
                  continue;
                }
              } else if (curFromNodeKey = curVFromNodeChild.bz_) {
                isCompatible = false;
              }
              isCompatible = isCompatible !== false && compareNodeNames(curVFromNodeChild, curToNodeChild) === true;
              if (isCompatible === true) {
                morphEl(curFromNodeChild, curVFromNodeChild, curToNodeChild, parentComponent);
              }
            } else if (curFromNodeType === TEXT_NODE || curFromNodeType === COMMENT_NODE) {
              isCompatible = true;
              if (curFromNodeChild.nodeValue !== curToNodeChild.bT_) {
                curFromNodeChild.nodeValue = curToNodeChild.bT_;
              }
            }
          }
          if (isCompatible === true) {
            curToNodeChild = toNextSibling;
            curFromNodeChild = fromNextSibling;
            continue outer;
          }
          detachNode(curFromNodeChild, fromNode2, ownerComponent);
          curFromNodeChild = fromNextSibling;
        }
        insertVirtualNodeBefore(curToNodeChild, curToNodeKey, curFromNodeChild, fromNode2, ownerComponent, parentComponent);
        curToNodeChild = toNextSibling;
        curFromNodeChild = fromNextSibling;
      }
    if (fromNode2.bX_) {
      fromNode2.bX_(curFromNodeChild);
    } else {
      var fragmentBoundary = fromNode2.nodeType === FRAGMENT_NODE ? fromNode2.endNode : null;
      while (curFromNodeChild && curFromNodeChild !== fragmentBoundary) {
        fromNextSibling = nextSibling(curFromNodeChild);
        if (fromComponent = componentByDOMNode.get(curFromNodeChild)) {
          curFromNodeChild = fromNextSibling;
          if (!globalComponentsContext._U_[fromComponent.id]) {
            destroyComponent(fromComponent);
          }
          continue;
        }
        curVFromNodeChild = vElementByDOMNode.get(curFromNodeChild);
        curFromNodeKey = keysByDOMNode.get(fromNode2);
        if (!curFromNodeKey || isAutoKey(curFromNodeKey)) {
          referenceComponent = parentComponent;
        } else {
          referenceComponent = curVFromNodeChild && curVFromNodeChild.aA_;
        }
        detachNode(curFromNodeChild, fromNode2, referenceComponent);
        curFromNodeChild = fromNextSibling;
      }
    }
  }
  function morphEl(fromEl, vFromEl, toEl, parentComponent) {
    var nodeName = toEl.bG_;
    var constId = toEl.bI_;
    if (constId !== void 0 && vFromEl.bI_ === constId) {
      return;
    }
    morphAttrs(fromEl, vFromEl, toEl);
    if (toEl.m_) {
      return;
    }
    if (nodeName !== "textarea") {
      morphChildren(fromEl, toEl, parentComponent);
    }
    var specialElHandler = specialElHandlers[nodeName];
    if (specialElHandler !== void 0) {
      specialElHandler(fromEl, toEl);
    }
  }
  morphChildren(fromNode, toNode, toNode.h_);
  detachedNodes.forEach(function(node) {
    var detachedFromComponent = detachedByDOMNode.get(node);
    if (detachedFromComponent !== void 0) {
      detachedByDOMNode.set(node, void 0);
      var componentToDestroy = componentByDOMNode.get(node);
      if (componentToDestroy) {
        componentToDestroy.destroy();
      } else if (node.parentNode) {
        destroyNodeRecursive$1(node, detachedFromComponent !== true && detachedFromComponent);
        if (eventDelegation.___(node) != false) {
          removeChild(node);
        }
      }
    }
  });
}
var morphdom_1 = morphdom;
var getComponentsContext$1 = ComponentsContext_1.o_;
var componentLookup$2 = indexBrowser$6.C_;
var destroyNodeRecursive = indexBrowser$6.D_;
var componentsByDOMNode$1 = domData.E_;
var keyedElementsByComponentId$1 = domData.F_;
var CONTEXT_KEY = "__subtree_context__";
var hasOwnProperty = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;
var COMPONENT_SUBSCRIBE_TO_OPTIONS;
var NON_COMPONENT_SUBSCRIBE_TO_OPTIONS = {
  addDestroyListener: false
};
var emit = src.prototype.emit;
var ELEMENT_NODE = 1;
function removeListener(removeEventListenerHandle) {
  removeEventListenerHandle();
}
function walkFragments(fragment2) {
  var node;
  while (fragment2) {
    node = fragment2.firstChild;
    if (!node) {
      break;
    }
    fragment2 = node.fragment;
  }
  return node;
}
function handleCustomEventWithMethodListener(component, targetMethodName, args, extraArgs) {
  args.push(component);
  if (extraArgs) {
    args = extraArgs.concat(args);
  }
  var targetComponent = componentLookup$2[component.G_];
  var targetMethod = typeof targetMethodName === "function" ? targetMethodName : targetComponent[targetMethodName];
  if (!targetMethod) {
    throw Error("Method not found: " + targetMethodName);
  }
  targetMethod.apply(targetComponent, args);
}
function resolveKeyHelper(key, index) {
  return index ? key + "_" + index : key;
}
function resolveComponentIdHelper(component, key, index) {
  return component.id + "-" + resolveKeyHelper(key, index);
}
function processUpdateHandlers(component, stateChanges, oldState) {
  var handlerMethod;
  var handlers;
  for (var propName in stateChanges) {
    if (hasOwnProperty.call(stateChanges, propName)) {
      var handlerMethodName = "update_" + propName;
      handlerMethod = component[handlerMethodName];
      if (handlerMethod) {
        (handlers || (handlers = [])).push([propName, handlerMethod]);
      } else {
        return;
      }
    }
  }
  if (handlers) {
    handlers.forEach(function(handler) {
      var propertyName = handler[0];
      handlerMethod = handler[1];
      var newValue = stateChanges[propertyName];
      var oldValue = oldState[propertyName];
      handlerMethod.call(component, newValue, oldValue);
    });
    component.H_();
    component.I_();
  }
  return true;
}
function checkInputChanged(existingComponent, oldInput, newInput) {
  if (oldInput != newInput) {
    if (oldInput == null || newInput == null) {
      return true;
    }
    var oldKeys = Object.keys(oldInput);
    var newKeys = Object.keys(newInput);
    var len = oldKeys.length;
    if (len !== newKeys.length) {
      return true;
    }
    for (var i = len; i--; ) {
      var key = oldKeys[i];
      if (!(key in newInput && oldInput[key] === newInput[key])) {
        return true;
      }
    }
  }
  return false;
}
var componentProto;
function Component(id) {
  src.call(this);
  this.id = id;
  this.J_ = null;
  this.K_ = null;
  this.L_ = null;
  this.M_ = null;
  this.N_ = null;
  this.O_ = null;
  this.G_ = null;
  this.P_ = null;
  this.Q_ = void 0;
  this.R_ = false;
  this.S_ = void 0;
  this.T_ = false;
  this.U_ = false;
  this.V_ = false;
  this.W_ = false;
  this.X_ = void 0;
  var ssrKeyedElements = keyedElementsByComponentId$1[id];
  if (ssrKeyedElements) {
    this.k_ = ssrKeyedElements;
    delete keyedElementsByComponentId$1[id];
  } else {
    this.k_ = {};
  }
}
Component.prototype = componentProto = {
  Y_: true,
  subscribeTo: function(target) {
    if (!target) {
      throw TypeError();
    }
    var subscriptions = this.L_ || (this.L_ = new listenerTracker());
    var subscribeToOptions = target.Y_ ? COMPONENT_SUBSCRIBE_TO_OPTIONS : NON_COMPONENT_SUBSCRIBE_TO_OPTIONS;
    return subscriptions.subscribeTo(target, subscribeToOptions);
  },
  emit: function(eventType) {
    var customEvents = this.O_;
    var target;
    if (customEvents && (target = customEvents[eventType])) {
      var targetMethodName = target[0];
      var isOnce = target[1];
      var extraArgs = target[2];
      var args = slice.call(arguments, 1);
      handleCustomEventWithMethodListener(this, targetMethodName, args, extraArgs);
      if (isOnce) {
        delete customEvents[eventType];
      }
    }
    return emit.apply(this, arguments);
  },
  getElId: function(key, index) {
    if (!key) {
      return this.id;
    }
    return resolveComponentIdHelper(this, key, index);
  },
  getEl: function(key, index) {
    if (key) {
      var keyedElement = this.k_["@" + resolveKeyHelper(key, index)];
      return keyedElement;
    } else {
      return this.el;
    }
  },
  getEls: function(key) {
    key = key + "[]";
    var els = [];
    var i = 0;
    var el;
    while (el = this.getEl(key, i)) {
      els.push(el);
      i++;
    }
    return els;
  },
  getComponent: function(key, index) {
    var rootNode = this.k_["@" + resolveKeyHelper(key, index)];
    return rootNode && componentsByDOMNode$1.get(rootNode);
  },
  getComponents: function(key) {
    var lookup = this.k_["@" + key + "[]"];
    return lookup ? Object.keys(lookup).map(function(key2) {
      return componentsByDOMNode$1.get(lookup[key2]);
    }).filter(Boolean) : [];
  },
  destroy: function() {
    if (this.T_) {
      return;
    }
    var root = this.K_;
    this.Z_();
    var nodes = root.nodes;
    nodes.forEach(function(node) {
      destroyNodeRecursive(node);
      if (eventDelegation.___(node) !== false) {
        node.parentNode.removeChild(node);
      }
    });
    root.detached = true;
    delete componentLookup$2[this.id];
    this.k_ = {};
  },
  Z_: function() {
    if (this.T_) {
      return;
    }
    this._a_();
    this.T_ = true;
    componentsByDOMNode$1.set(this.K_, void 0);
    this.K_ = null;
    this._b_();
    var subscriptions = this.L_;
    if (subscriptions) {
      subscriptions.removeAllListeners();
      this.L_ = null;
    }
  },
  isDestroyed: function() {
    return this.T_;
  },
  get state() {
    return this.J_;
  },
  set state(newState) {
    var state = this.J_;
    if (!state && !newState) {
      return;
    }
    if (!state) {
      state = this.J_ = new this._c_(this);
    }
    state._d_(newState || {});
    if (state.V_) {
      this._e_();
    }
    if (!newState) {
      this.J_ = null;
    }
  },
  setState: function(name, value) {
    var state = this.J_;
    if (!state) {
      state = this.J_ = new this._c_(this);
    }
    if (typeof name == "object") {
      var newState = name;
      for (var k in newState) {
        if (hasOwnProperty.call(newState, k)) {
          state._f_(k, newState[k], true);
        }
      }
    } else {
      state._f_(name, value, true);
    }
  },
  setStateDirty: function(name, value) {
    var state = this.J_;
    if (arguments.length == 1) {
      value = state[name];
    }
    state._f_(name, value, true, true);
  },
  replaceState: function(newState) {
    this.J_._d_(newState);
  },
  get input() {
    return this.Q_;
  },
  set input(newInput) {
    if (this.W_) {
      this.Q_ = newInput;
    } else {
      this._g_(newInput);
    }
  },
  _g_: function(newInput, onInput, out) {
    onInput = onInput || this.onInput;
    var updatedInput;
    var oldInput = this.Q_;
    this.Q_ = void 0;
    this._h_ = out && out[CONTEXT_KEY] || this._h_;
    if (onInput) {
      this.W_ = true;
      updatedInput = onInput.call(this, newInput || {}, out);
      this.W_ = false;
    }
    newInput = this.P_ = updatedInput || newInput;
    if (this.V_ = checkInputChanged(this, oldInput, newInput)) {
      this._e_();
    }
    if (this.Q_ === void 0) {
      this.Q_ = newInput;
      if (newInput && newInput.$global) {
        this.S_ = newInput.$global;
      }
    }
    return newInput;
  },
  forceUpdate: function() {
    this.V_ = true;
    this._e_();
  },
  _e_: function() {
    if (!this.U_) {
      this.U_ = true;
      updateManager._i_(this);
    }
  },
  update: function() {
    if (this.T_ === true || this._j_ === false) {
      return;
    }
    var input = this.Q_;
    var state = this.J_;
    if (this.V_ === false && state !== null && state.V_ === true) {
      if (processUpdateHandlers(this, state._k_, state._l_)) {
        state.V_ = false;
      }
    }
    if (this._j_ === true) {
      if (this.shouldUpdate(input, state) !== false) {
        this._m_();
      }
    }
    this.I_();
  },
  get _j_() {
    return this.V_ === true || this.J_ !== null && this.J_.V_ === true;
  },
  I_: function() {
    this.V_ = false;
    this.U_ = false;
    this.P_ = null;
    var state = this.J_;
    if (state) {
      state.I_();
    }
  },
  shouldUpdate: function() {
    return true;
  },
  _m_: function() {
    var self2 = this;
    var renderer2 = self2._n_;
    if (!renderer2) {
      throw TypeError();
    }
    var input = this.P_ || this.Q_;
    updateManager._o_(function() {
      self2._p_(input, false).afterInsert(self2.X_);
    });
    this.I_();
  },
  _p_: function(input, isHydrate) {
    var doc = this.X_;
    var globalData = this.S_;
    var rootNode = this.K_;
    var renderer2 = this._n_;
    var createOut3 = renderer2.createOut || createOut_1;
    var out = createOut3(globalData);
    out.sync();
    out.X_ = this.X_;
    out[CONTEXT_KEY] = this._h_;
    var componentsContext = getComponentsContext$1(out);
    var globalComponentsContext = componentsContext.e_;
    globalComponentsContext._q_ = this;
    globalComponentsContext.f_ = isHydrate;
    renderer2(input, out);
    var result = new RenderResult_1(out);
    var targetNode = out.B_()._r_;
    morphdom_1(rootNode, targetNode, doc, componentsContext);
    return result;
  },
  _s_: function() {
    var root = this.K_;
    root.remove();
    return root;
  },
  _b_: function() {
    var eventListenerHandles = this.M_;
    if (eventListenerHandles) {
      eventListenerHandles.forEach(removeListener);
      this.M_ = null;
    }
  },
  get _t_() {
    var state = this.J_;
    return state && state._u_;
  },
  _v_: function(customEvents, scope) {
    var finalCustomEvents = this.O_ = {};
    this.G_ = scope;
    customEvents.forEach(function(customEvent) {
      var eventType = customEvent[0];
      var targetMethodName = customEvent[1];
      var isOnce = customEvent[2];
      var extraArgs = customEvent[3];
      finalCustomEvents[eventType] = [targetMethodName, isOnce, extraArgs];
    });
  },
  get el() {
    return walkFragments(this.K_);
  },
  get els() {
    return (this.K_ ? this.K_.nodes : []).filter(function(el) {
      return el.nodeType === ELEMENT_NODE;
    });
  },
  _w_: emit,
  _x_(input, out) {
    this.onCreate && this.onCreate(input, out);
    this._w_("create", input, out);
  },
  _y_(out) {
    this.onRender && this.onRender(out);
    this._w_("render", out);
  },
  H_() {
    this.onUpdate && this.onUpdate();
    this._w_("update");
  },
  _z_() {
    this.onMount && this.onMount();
    this._w_("mount");
  },
  _a_() {
    this.onDestroy && this.onDestroy();
    this._w_("destroy");
  }
};
componentProto.elId = componentProto.getElId;
componentProto._A_ = componentProto.update;
componentProto._B_ = componentProto.destroy;
domInsert(componentProto, function getEl2(component) {
  return component._s_();
}, function afterInsert2(component) {
  return component;
});
inherit_1(Component, src);
var Component_1 = Component;
var defineComponent = function defineComponent2(def, renderer2) {
  if (def.Y_) {
    return def;
  }
  var ComponentClass = function() {
  };
  var proto2;
  var type = typeof def;
  if (type == "function") {
    proto2 = def.prototype;
  } else if (type == "object") {
    proto2 = def;
  } else {
    throw TypeError();
  }
  ComponentClass.prototype = proto2;
  function Component2(id) {
    Component_1.call(this, id);
  }
  if (!proto2.Y_) {
    inherit_1(ComponentClass, Component_1);
  }
  proto2 = Component2.prototype = ComponentClass.prototype;
  Component2.Y_ = true;
  function State2(component) {
    State_1.call(this, component);
  }
  inherit_1(State2, State_1);
  proto2._c_ = State2;
  proto2._n_ = renderer2;
  return Component2;
};
var registered = {};
var loaded = {};
var componentTypes = {};
var pendingDefs;
function register$1(type, def) {
  var pendingForType;
  if (pendingDefs) {
    pendingForType = pendingDefs[type];
  }
  registered[type] = def;
  delete loaded[type];
  delete componentTypes[type];
  if (pendingForType) {
    delete pendingDefs[type];
    queueMicrotask_1(function() {
      pendingForType.forEach(function(args) {
        indexBrowser$3.au_(args[0], args[1], args[2], args[3])();
      });
    });
  }
  return type;
}
function addPendingDef(def, type, meta, doc, runtimeId2) {
  if (!pendingDefs) {
    pendingDefs = {};
  }
  (pendingDefs[type] = pendingDefs[type] || []).push([
    def,
    meta,
    doc,
    runtimeId2
  ]);
}
function isRegistered(type) {
  return Boolean(registered[type]);
}
function load(typeName) {
  var target = loaded[typeName];
  if (!target) {
    target = registered[typeName];
    if (target) {
      target = target();
    }
    if (!target) {
      throw Error("Component not found: " + typeName);
    }
    loaded[typeName] = target;
  }
  return target;
}
function getComponentClass(typeName) {
  var ComponentClass = componentTypes[typeName];
  if (ComponentClass) {
    return ComponentClass;
  }
  ComponentClass = load(typeName);
  ComponentClass = ComponentClass.Component || ComponentClass;
  if (!ComponentClass.Y_) {
    ComponentClass = defineComponent(ComponentClass, ComponentClass.renderer);
  }
  ComponentClass.prototype._N_ = typeName;
  componentTypes[typeName] = ComponentClass;
  return ComponentClass;
}
function createComponent(typeName, id) {
  var ComponentClass = getComponentClass(typeName);
  return new ComponentClass(id);
}
var r = register$1;
var av_ = getComponentClass;
var _P_ = createComponent;
var as_ = isRegistered;
var at_ = addPendingDef;
var indexBrowser$4 = {
  r,
  av_,
  _P_,
  as_,
  at_
};
var win = window;
var defaultDocument$1 = document;
var createFragmentNode = fragment.ao_;
var componentLookup$1 = indexBrowser$6.C_;
var addComponentRootToKeyedElements = indexBrowser$6.ap_;
var keyedElementsByComponentId = domData.F_;
var componentsByDOMNode = domData.E_;
var serverComponentRootNodes = {};
var serverRenderedMeta = {};
var DEFAULT_RUNTIME_ID = "M";
var FLAG_WILL_RERENDER_IN_BROWSER = 1;
var deferredDefs;
function indexServerComponentBoundaries(node, runtimeId2, stack) {
  var componentId;
  var ownerId;
  var ownerComponent;
  var keyedElements;
  var nextSibling2;
  var runtimeLength = runtimeId2.length;
  stack = stack || [];
  node = node.firstChild;
  while (node) {
    nextSibling2 = node.nextSibling;
    if (node.nodeType === 8) {
      var commentValue = node.nodeValue;
      if (commentValue.slice(0, runtimeLength) === runtimeId2) {
        var firstChar = commentValue[runtimeLength];
        if (firstChar === "^" || firstChar === "#") {
          stack.push(node);
        } else if (firstChar === "/") {
          var endNode = node;
          var startNode = stack.pop();
          var rootNode;
          if (startNode.parentNode === endNode.parentNode) {
            rootNode = createFragmentNode(startNode.nextSibling, endNode);
          } else {
            rootNode = createFragmentNode(endNode.parentNode.firstChild, endNode);
          }
          componentId = startNode.nodeValue.substring(runtimeLength + 1);
          firstChar = startNode.nodeValue[runtimeLength];
          if (firstChar === "^") {
            var parts = componentId.split(/ /g);
            var key = parts[2];
            ownerId = parts[1];
            componentId = parts[0];
            if (ownerComponent = componentLookup$1[ownerId]) {
              keyedElements = ownerComponent.k_;
            } else {
              keyedElements = keyedElementsByComponentId[ownerId] || (keyedElementsByComponentId[ownerId] = {});
            }
            addComponentRootToKeyedElements(keyedElements, key, rootNode, componentId);
          }
          serverComponentRootNodes[componentId] = rootNode;
          startNode.parentNode.removeChild(startNode);
          endNode.parentNode.removeChild(endNode);
        }
      }
    } else if (node.nodeType === 1) {
      var markoKey = node.getAttribute("data-marko-key");
      var markoProps = indexBrowser$6.am_(node);
      if (markoKey) {
        var separatorIndex = markoKey.indexOf(" ");
        ownerId = markoKey.substring(separatorIndex + 1);
        markoKey = markoKey.substring(0, separatorIndex);
        if (ownerComponent = componentLookup$1[ownerId]) {
          keyedElements = ownerComponent.k_;
        } else {
          keyedElements = keyedElementsByComponentId[ownerId] || (keyedElementsByComponentId[ownerId] = {});
        }
        keyedElements[markoKey] = node;
      }
      if (markoProps) {
        Object.keys(markoProps).forEach(function(key2) {
          if (key2.slice(0, 2) === "on") {
            eventDelegation._D_(key2.slice(2));
          }
        });
      }
      indexServerComponentBoundaries(node, runtimeId2, stack);
    }
    node = nextSibling2;
  }
}
function invokeComponentEventHandler(component, targetMethodName, args) {
  var method = component[targetMethodName];
  if (!method) {
    throw Error("Method not found: " + targetMethodName);
  }
  method.apply(component, args);
}
function addEventListenerHelper(el, eventType, isOnce, listener) {
  var eventListener = listener;
  if (isOnce) {
    eventListener = function(event) {
      listener(event);
      el.removeEventListener(eventType, eventListener);
    };
  }
  el.addEventListener(eventType, eventListener, false);
  return function remove() {
    el.removeEventListener(eventType, eventListener);
  };
}
function addDOMEventListeners(component, el, eventType, targetMethodName, isOnce, extraArgs, handles) {
  var removeListener2 = addEventListenerHelper(el, eventType, isOnce, function(event) {
    var args = [event, el];
    if (extraArgs) {
      args = extraArgs.concat(args);
    }
    invokeComponentEventHandler(component, targetMethodName, args);
  });
  handles.push(removeListener2);
}
function initComponent(componentDef, doc) {
  var component = componentDef.h_;
  component.I_();
  component.X_ = doc;
  var isExisting = componentDef._G_;
  if (isExisting) {
    component._b_();
  }
  var domEvents = componentDef._F_;
  if (domEvents) {
    var eventListenerHandles = [];
    domEvents.forEach(function(domEventArgs) {
      var eventType = domEventArgs[0];
      var targetMethodName = domEventArgs[1];
      var eventEl = component.k_[domEventArgs[2]];
      var isOnce = domEventArgs[3];
      var extraArgs = domEventArgs[4];
      addDOMEventListeners(component, eventEl, eventType, targetMethodName, isOnce, extraArgs, eventListenerHandles);
    });
    if (eventListenerHandles.length) {
      component.M_ = eventListenerHandles;
    }
  }
  if (component.R_) {
    component.H_();
  } else {
    component.R_ = true;
    component._z_();
  }
}
function initClientRendered(componentDefs, doc) {
  eventDelegation.an_(doc);
  doc = doc || defaultDocument$1;
  var len = componentDefs.length;
  var componentDef;
  var i;
  for (i = len; i--; ) {
    componentDef = componentDefs[i];
    trackComponent(componentDef);
  }
  for (i = len; i--; ) {
    componentDef = componentDefs[i];
    initComponent(componentDef, doc);
  }
}
function initServerRendered(renderedComponents, doc) {
  var type = typeof renderedComponents;
  var globalKey = "$";
  var runtimeId2;
  if (type !== "object") {
    if (type === "string") {
      runtimeId2 = renderedComponents;
      globalKey += runtimeId2 + "_C";
    } else {
      globalKey += (runtimeId2 = DEFAULT_RUNTIME_ID) + "C";
    }
    renderedComponents = win[globalKey];
    var fakeArray = win[globalKey] = {
      r: runtimeId2,
      concat: initServerRendered
    };
    if (renderedComponents && renderedComponents.forEach) {
      renderedComponents.forEach(function(renderedComponent) {
        fakeArray.concat(renderedComponent);
      });
    }
    return fakeArray;
  }
  var isFromSerializedGlobals = this.concat === initServerRendered;
  renderedComponents = finalize2(renderedComponents);
  if (isFromSerializedGlobals) {
    runtimeId2 = this.r;
    doc = defaultDocument$1;
  } else {
    runtimeId2 = renderedComponents.r || DEFAULT_RUNTIME_ID;
    doc = doc || defaultDocument$1;
  }
  var prefix = renderedComponents.p || "";
  var meta = serverRenderedMeta[prefix];
  var isLast = renderedComponents.l;
  if (meta) {
    if (isLast) {
      delete serverRenderedMeta[prefix];
    }
  } else {
    meta = {};
    if (!isLast) {
      serverRenderedMeta[prefix] = meta;
    }
  }
  indexServerComponentBoundaries(doc, runtimeId2);
  eventDelegation.an_(doc);
  if (renderedComponents.g) {
    meta.aq_ = renderedComponents.g;
  }
  if (renderedComponents.t) {
    meta.ar_ = meta.ar_ ? meta.ar_.concat(renderedComponents.t) : renderedComponents.t;
  }
  (renderedComponents.w || []).map(function(componentDef) {
    var typeName = meta.ar_[componentDef[1]];
    return indexBrowser$4.as_(typeName) ? tryHydrateComponent(componentDef, meta, doc, runtimeId2) : indexBrowser$4.at_(componentDef, typeName, meta, doc, runtimeId2);
  }).reverse().forEach(tryInvoke);
  return this;
}
function tryHydrateComponent(rawDef, meta, doc, runtimeId2) {
  var componentDef = ComponentDef_1._O_(rawDef, meta.ar_, meta.aq_, indexBrowser$4);
  var mount = hydrateComponentAndGetMount(componentDef, doc);
  if (!mount) {
    if (deferredDefs) {
      deferredDefs.push(componentDef);
    } else {
      deferredDefs = [componentDef];
      doc.addEventListener("DOMContentLoaded", function() {
        indexServerComponentBoundaries(doc, runtimeId2);
        deferredDefs.map(function(componentDef2) {
          return hydrateComponentAndGetMount(componentDef2, doc);
        }).reverse().forEach(tryInvoke);
        deferredDefs = void 0;
      });
    }
  }
  return mount;
}
function hydrateComponentAndGetMount(componentDef, doc) {
  var componentId = componentDef.id;
  var component = componentDef.h_;
  var rootNode = serverComponentRootNodes[componentId];
  var renderResult;
  if (rootNode) {
    delete serverComponentRootNodes[componentId];
    component.K_ = rootNode;
    componentsByDOMNode.set(rootNode, component);
    if (componentDef._I_ & FLAG_WILL_RERENDER_IN_BROWSER) {
      component.X_ = doc;
      renderResult = component._p_(component.Q_, true);
      trackComponent(componentDef);
      return function mount() {
        renderResult.afterInsert(doc);
      };
    } else {
      trackComponent(componentDef);
    }
    return function mount() {
      initComponent(componentDef, doc);
    };
  }
}
function trackComponent(componentDef) {
  var component = componentDef.h_;
  if (component) {
    componentLookup$1[component.id] = component;
  }
}
function tryInvoke(fn) {
  if (fn)
    fn();
}
var _R_ = initClientRendered;
var ai_ = initServerRendered;
var au_ = tryHydrateComponent;
var indexBrowser$3 = {
  _R_,
  ai_,
  au_
};
ComponentsContext_1._R_ = indexBrowser$3._R_;
var getComponentForEl = indexBrowser$6.ah_;
var init = window.$initComponents = indexBrowser$3.ai_;
var register = function(id, component) {
  indexBrowser$4.r(id, function() {
    return component;
  });
};
var indexBrowser$2 = {
  getComponentForEl,
  init,
  register
};
var components = indexBrowser$2;
var classValue = function classHelper(arg) {
  switch (typeof arg) {
    case "string":
      return arg || null;
    case "object":
      var result = "";
      var sep = "";
      if (Array.isArray(arg)) {
        for (var i = 0, len = arg.length; i < len; i++) {
          var value = classHelper(arg[i]);
          if (value) {
            result += sep + value;
            sep = " ";
          }
        }
      } else {
        for (var key in arg) {
          if (arg[key]) {
            result += sep + key;
            sep = " ";
          }
        }
      }
      return result || null;
    default:
      return null;
  }
};
var camelToDashLookup = Object.create(null);
var dashToCamelLookup = Object.create(null);
var aI_ = function camelToDashCase(name) {
  var nameDashed = camelToDashLookup[name];
  if (!nameDashed) {
    nameDashed = camelToDashLookup[name] = name.replace(/([A-Z])/g, "-$1").toLowerCase();
    if (nameDashed !== name) {
      dashToCamelLookup[nameDashed] = name;
    }
  }
  return nameDashed;
};
var aJ_ = function dashToCamelCase(name) {
  var nameCamel = dashToCamelLookup[name];
  if (!nameCamel) {
    nameCamel = dashToCamelLookup[name] = name.replace(/-([a-z])/g, matchToUpperCase);
    if (nameCamel !== name) {
      camelToDashLookup[nameCamel] = name;
    }
  }
  return nameCamel;
};
function matchToUpperCase(_, char) {
  return char.toUpperCase();
}
var _changeCase = {
  aI_,
  aJ_
};
var styleValue = function styleHelper(style) {
  if (!style) {
    return null;
  }
  var type = typeof style;
  if (type !== "string") {
    var styles = "";
    if (Array.isArray(style)) {
      for (var i = 0, len = style.length; i < len; i++) {
        var next = styleHelper(style[i]);
        if (next)
          styles += next + (next[next.length - 1] !== ";" ? ";" : "");
      }
    } else if (type === "object") {
      for (var name in style) {
        var value = style[name];
        if (value != null) {
          if (typeof value === "number" && value) {
            value += "px";
          }
          styles += _changeCase.aI_(name) + ":" + value + ";";
        }
      }
    }
    return styles || null;
  }
  return style;
};
var attrs = function(attributes) {
  if (attributes != null) {
    var newAttributes = {};
    for (var attrName in attributes) {
      var val = attributes[attrName];
      if (attrName === "renderBody") {
        continue;
      }
      if (attrName === "class") {
        val = classValue(val);
      } else if (attrName === "style") {
        val = styleValue(val);
      }
      newAttributes[attrName] = val;
    }
    return newAttributes;
  }
  return attributes;
};
var VElement$1 = vdom.aZ_;
var VDocumentFragment = vdom.b__;
var VText = vdom.ba_;
var VComponent = vdom.bb_;
var VFragment = vdom.bc_;
var virtualizeHTML = vdom.bd_;
var defaultDocument = vdom.be_;
var EVENT_UPDATE = "update";
var EVENT_FINISH = "finish";
function State(tree) {
  this.bf_ = new src();
  this.bg_ = tree;
  this.bh_ = false;
}
function AsyncVDOMBuilder(globalData, parentNode, parentOut) {
  if (!parentNode) {
    parentNode = new VDocumentFragment();
  }
  var state;
  if (parentOut) {
    state = parentOut.J_;
  } else {
    state = new State(parentNode);
  }
  this.bi_ = 1;
  this.bj_ = 0;
  this.bk_ = null;
  this.bl_ = parentOut;
  this.data = {};
  this.J_ = state;
  this.l_ = parentNode;
  this.global = globalData || {};
  this.bm_ = [parentNode];
  this.bn_ = false;
  this.bo_ = void 0;
  this.b_ = null;
  this.g_ = null;
  this.i_ = null;
  this.ax_ = null;
}
var proto = AsyncVDOMBuilder.prototype = {
  aO_: true,
  X_: defaultDocument,
  bc: function(component, key, ownerComponent) {
    var vComponent = new VComponent(component, key, ownerComponent);
    return this.bp_(vComponent, 0, true);
  },
  ay_: function(component, key, ownerComponent) {
    var vComponent = new VComponent(component, key, ownerComponent, true);
    this.bp_(vComponent, 0);
  },
  bp_: function(child, childCount, pushToStack) {
    this.l_.bq_(child);
    if (pushToStack === true) {
      this.bm_.push(child);
      this.l_ = child;
    }
    return childCount === 0 ? this : child;
  },
  element: function(tagName, attrs2, key, component, childCount, flags, props) {
    var element = new VElement$1(tagName, attrs2, key, component, childCount, flags, props);
    return this.bp_(element, childCount);
  },
  aM_: function(tagName, attrs$1, key, componentDef, props) {
    return this.element(tagName, attrs(attrs$1), key, componentDef.h_, 0, 0, props);
  },
  n: function(node, component) {
    var clone = node.br_();
    this.node(clone);
    clone.aA_ = component;
    return this;
  },
  node: function(node) {
    this.l_.bq_(node);
    return this;
  },
  text: function(text, ownerComponent) {
    var type = typeof text;
    if (type != "string") {
      if (text == null) {
        return;
      } else if (type === "object") {
        if (text.toHTML) {
          return this.h(text.toHTML(), ownerComponent);
        }
      }
      text = text.toString();
    }
    this.l_.bq_(new VText(text, ownerComponent));
    return this;
  },
  html: function(html, ownerComponent) {
    if (html != null) {
      var vdomNode = virtualizeHTML(html, this.X_ || document, ownerComponent);
      this.node(vdomNode);
    }
    return this;
  },
  beginElement: function(tagName, attrs2, key, component, childCount, flags, props) {
    var element = new VElement$1(tagName, attrs2, key, component, childCount, flags, props);
    this.bp_(element, childCount, true);
    return this;
  },
  aK_: function(tagName, attrs$1, key, componentDef, props) {
    return this.beginElement(tagName, attrs(attrs$1), key, componentDef.h_, 0, 0, props);
  },
  bf: function(key, component, preserve) {
    var fragment2 = new VFragment(key, component, preserve);
    this.bp_(fragment2, null, true);
    return this;
  },
  ef: function() {
    this.endElement();
  },
  endElement: function() {
    var stack = this.bm_;
    stack.pop();
    this.l_ = stack[stack.length - 1];
  },
  end: function() {
    this.l_ = void 0;
    var remaining = --this.bi_;
    var parentOut = this.bl_;
    if (remaining === 0) {
      if (parentOut) {
        parentOut.bs_();
      } else {
        this.bt_();
      }
    } else if (remaining - this.bj_ === 0) {
      this.bu_();
    }
    return this;
  },
  bs_: function() {
    var remaining = --this.bi_;
    if (remaining === 0) {
      var parentOut = this.bl_;
      if (parentOut) {
        parentOut.bs_();
      } else {
        this.bt_();
      }
    } else if (remaining - this.bj_ === 0) {
      this.bu_();
    }
  },
  bt_: function() {
    var state = this.J_;
    state.bh_ = true;
    state.bf_.emit(EVENT_FINISH, this.aP_());
  },
  bu_: function() {
    var lastArray = this._last;
    var i = 0;
    function next() {
      if (i === lastArray.length) {
        return;
      }
      var lastCallback = lastArray[i++];
      lastCallback(next);
      if (!lastCallback.length) {
        next();
      }
    }
    next();
  },
  error: function(e) {
    try {
      this.emit("error", e);
    } finally {
      this.end();
    }
    return this;
  },
  beginAsync: function(options) {
    if (this.bn_) {
      throw Error("Tried to render async while in sync mode. Note: Client side await is not currently supported in re-renders (Issue: #942).");
    }
    var state = this.J_;
    if (options) {
      if (options.last) {
        this.bj_++;
      }
    }
    this.bi_++;
    var documentFragment = this.l_.bv_();
    var asyncOut = new AsyncVDOMBuilder(this.global, documentFragment, this);
    state.bf_.emit("beginAsync", {
      out: asyncOut,
      parentOut: this
    });
    return asyncOut;
  },
  createOut: function() {
    return new AsyncVDOMBuilder(this.global);
  },
  flush: function() {
    var events = this.J_.bf_;
    if (events.listenerCount(EVENT_UPDATE)) {
      events.emit(EVENT_UPDATE, new RenderResult_1(this));
    }
  },
  B_: function() {
    return this.J_.bg_;
  },
  aP_: function() {
    return this.bw_ || (this.bw_ = new RenderResult_1(this));
  },
  on: function(event, callback) {
    var state = this.J_;
    if (event === EVENT_FINISH && state.bh_) {
      callback(this.aP_());
    } else if (event === "last") {
      this.onLast(callback);
    } else {
      state.bf_.on(event, callback);
    }
    return this;
  },
  once: function(event, callback) {
    var state = this.J_;
    if (event === EVENT_FINISH && state.bh_) {
      callback(this.aP_());
    } else if (event === "last") {
      this.onLast(callback);
    } else {
      state.bf_.once(event, callback);
    }
    return this;
  },
  emit: function(type, arg) {
    var events = this.J_.bf_;
    switch (arguments.length) {
      case 1:
        events.emit(type);
        break;
      case 2:
        events.emit(type, arg);
        break;
      default:
        events.emit.apply(events, arguments);
        break;
    }
    return this;
  },
  removeListener: function() {
    var events = this.J_.bf_;
    events.removeListener.apply(events, arguments);
    return this;
  },
  sync: function() {
    this.bn_ = true;
  },
  isSync: function() {
    return this.bn_;
  },
  onLast: function(callback) {
    var lastArray = this._last;
    if (lastArray === void 0) {
      this._last = [callback];
    } else {
      lastArray.push(callback);
    }
    return this;
  },
  A_: function(doc) {
    var node = this.bo_;
    if (!node) {
      var vdomTree = this.B_();
      doc = doc || this.X_ || document;
      this.bo_ = node = vdomTree.bx_(doc, null);
      morphdom_1(node, vdomTree, doc, this.b_);
    }
    return node;
  },
  toString: function(doc) {
    var docFragment = this.A_(doc);
    var html = "";
    var child = docFragment.firstChild;
    while (child) {
      var nextSibling2 = child.nextSibling;
      if (child.nodeType != 1) {
        var container = docFragment.ownerDocument.createElement("div");
        container.appendChild(child.cloneNode());
        html += container.innerHTML;
      } else {
        html += child.outerHTML;
      }
      child = nextSibling2;
    }
    return html;
  },
  then: function(fn, fnErr) {
    var out = this;
    var promise2 = new Promise(function(resolve2, reject) {
      out.on("error", reject).on(EVENT_FINISH, function(result) {
        resolve2(result);
      });
    });
    return Promise.resolve(promise2).then(fn, fnErr);
  },
  catch: function(fnErr) {
    return this.then(void 0, fnErr);
  },
  isVDOM: true,
  c: function(componentDef, key, customEvents) {
    this.g_ = componentDef;
    this.i_ = key;
    this.ax_ = customEvents;
  }
};
proto.e = proto.element;
proto.be = proto.beginElement;
proto.ee = proto.aL_ = proto.endElement;
proto.t = proto.text;
proto.h = proto.w = proto.write = proto.html;
var AsyncVDOMBuilder_1 = AsyncVDOMBuilder;
function safeRender(renderFunc, finalData, finalOut, shouldEnd) {
  try {
    renderFunc(finalData, finalOut);
    if (shouldEnd) {
      finalOut.end();
    }
  } catch (err) {
    var actualEnd = finalOut.end;
    finalOut.end = function() {
    };
    indexBrowser$5(function() {
      finalOut.end = actualEnd;
      finalOut.error(err);
    });
  }
  return finalOut;
}
var renderable = function(target, renderer2) {
  var renderFunc = renderer2 && (renderer2.renderer || renderer2.render || renderer2);
  var createOut3 = target.createOut || renderer2.createOut || createOut_1;
  return extend(target, {
    createOut: createOut3,
    renderToString: function(data, callback) {
      var localData = data || {};
      var render = renderFunc || this._;
      var globalData = localData.$global;
      var out = createOut3(globalData);
      out.global.template = this;
      if (globalData) {
        localData.$global = void 0;
      }
      if (callback) {
        out.on("finish", function() {
          callback(null, out.toString(), out);
        }).once("error", callback);
        return safeRender(render, localData, out, true);
      } else {
        out.sync();
        render(localData, out);
        return out.toString();
      }
    },
    renderSync: function(data) {
      var localData = data || {};
      var render = renderFunc || this._;
      var globalData = localData.$global;
      var out = createOut3(globalData);
      out.sync();
      out.global.template = this;
      if (globalData) {
        localData.$global = void 0;
      }
      render(localData, out);
      return out.aP_();
    },
    render: function(data, out) {
      var callback;
      var finalOut;
      var finalData;
      var globalData;
      var render = renderFunc || this._;
      var shouldBuffer = this.aR_;
      var shouldEnd = true;
      if (data) {
        finalData = data;
        if (globalData = data.$global) {
          finalData.$global = void 0;
        }
      } else {
        finalData = {};
      }
      if (out && out.aO_) {
        finalOut = out;
        shouldEnd = false;
        extend(out.global, globalData);
      } else if (typeof out == "function") {
        finalOut = createOut3(globalData);
        callback = out;
      } else {
        finalOut = createOut3(globalData, out, void 0, shouldBuffer);
      }
      if (callback) {
        finalOut.on("finish", function() {
          callback(null, finalOut.aP_());
        }).once("error", callback);
      }
      globalData = finalOut.global;
      globalData.template = globalData.template || this;
      return safeRender(render, finalData, finalOut, shouldEnd);
    }
  });
};
var t = function createTemplate(typeName) {
  return new Template(typeName);
};
function Template(typeName) {
  this.aY_ = typeName;
}
createOut_1.aE_(Template.prototype.createOut = function createOut2(globalData, parent, parentOut) {
  return new AsyncVDOMBuilder_1(globalData, parent, parentOut);
});
renderable(Template.prototype);
var VElement = vdom.aZ_;
var vElement = function(tagName, attrs2, key, component, childCount, flags, props) {
  return new VElement(tagName, attrs2, key, component, childCount, flags, props);
};
var indexBrowser$1 = function beginComponent(componentsContext, component, key, ownerComponentDef) {
  var componentId = component.id;
  var componentDef = componentsContext.j_ = new ComponentDef_1(component, componentId, componentsContext);
  componentsContext.e_._U_[componentId] = true;
  componentsContext.b_.push(componentDef);
  var out = componentsContext.y_;
  out.bc(component, key, ownerComponentDef && ownerComponentDef.h_);
  return componentDef;
};
var indexBrowser = function endComponent(out) {
  out.ee();
};
var componentLookup = indexBrowser$6.C_;
var getComponentsContext = ComponentsContext_1.o_;
var COMPONENT_BEGIN_ASYNC_ADDED_KEY = "$wa";
function resolveComponentKey(key, parentComponentDef) {
  if (key[0] === "#") {
    return key.substring(1);
  } else {
    return parentComponentDef.id + "-" + parentComponentDef._L_(key);
  }
}
function trackAsyncComponents(out) {
  if (out.isSync() || out.global[COMPONENT_BEGIN_ASYNC_ADDED_KEY]) {
    return;
  }
  out.on("beginAsync", handleBeginAsync);
  out.on("beginDetachedAsync", handleBeginDetachedAsync);
  out.global[COMPONENT_BEGIN_ASYNC_ADDED_KEY] = true;
}
function handleBeginAsync(event) {
  var parentOut = event.parentOut;
  var asyncOut = event.out;
  var componentsContext = parentOut.b_;
  if (componentsContext !== void 0) {
    asyncOut.b_ = new ComponentsContext_1(asyncOut, componentsContext);
  }
  asyncOut.c(parentOut.g_, parentOut.i_, parentOut.ax_);
}
function handleBeginDetachedAsync(event) {
  var asyncOut = event.out;
  handleBeginAsync(event);
  asyncOut.on("beginAsync", handleBeginAsync);
  asyncOut.on("beginDetachedAsync", handleBeginDetachedAsync);
}
function createRendererFunc(templateRenderFunc, componentProps, renderingLogic) {
  var onInput = renderingLogic && renderingLogic.onInput;
  var typeName = componentProps.t;
  var isSplit = componentProps.s === true;
  componentProps.i === true;
  var shouldApplySplitMixins = renderingLogic && isSplit;
  if (componentProps.d) {
    throw new Error("Runtime/NODE_ENV Mismatch");
  }
  return function renderer2(input, out) {
    trackAsyncComponents(out);
    var componentsContext = getComponentsContext(out);
    var globalComponentsContext = componentsContext.e_;
    var component = globalComponentsContext._q_;
    var isRerender = component !== void 0;
    var id;
    var isExisting;
    var customEvents;
    var parentComponentDef = componentsContext.j_;
    var ownerComponentDef = out.g_;
    var ownerComponentId = ownerComponentDef && ownerComponentDef.id;
    var key = out.i_;
    if (component) {
      id = component.id;
      isExisting = true;
      globalComponentsContext._q_ = null;
    } else {
      if (parentComponentDef) {
        customEvents = out.ax_;
        if (key != null) {
          id = resolveComponentKey(key.toString(), parentComponentDef);
        } else {
          id = parentComponentDef._M_();
        }
      } else {
        id = globalComponentsContext._M_();
      }
    }
    {
      if (!component) {
        if (isRerender && (component = componentLookup[id]) && component._N_ !== typeName) {
          component.destroy();
          component = void 0;
        }
        if (component) {
          isExisting = true;
        } else {
          isExisting = false;
          component = indexBrowser$4._P_(typeName, id);
          if (shouldApplySplitMixins === true) {
            shouldApplySplitMixins = false;
            var renderingLogicProps = typeof renderingLogic == "function" ? renderingLogic.prototype : renderingLogic;
            copyProps(renderingLogicProps, component.constructor.prototype);
          }
        }
        component.U_ = true;
        if (customEvents !== void 0) {
          component._v_(customEvents, ownerComponentId);
        }
        if (isExisting === false) {
          component._x_(input, out);
        }
        input = component._g_(input, onInput, out);
        if (isExisting === true) {
          if (component._j_ === false || component.shouldUpdate(input, component.J_) === false) {
            out.ay_(component);
            globalComponentsContext._U_[id] = true;
            component.I_();
            return;
          }
        }
      }
      component.S_ = out.global;
      component._y_(out);
    }
    var componentDef = indexBrowser$1(componentsContext, component, key, ownerComponentDef);
    componentDef._G_ = isExisting;
    templateRenderFunc(input, out, componentDef, component, component._t_);
    indexBrowser(out);
    componentsContext.j_ = parentComponentDef;
  };
}
var renderer = createRendererFunc;
export {r as a, components as c, defineComponent as d, renderer as r, t, vElement as v};
