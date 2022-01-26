var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var indexBrowser$4 = {};
var indexBrowser$3 = {};
var constants$2 = {};
var win$1 = typeof window !== "undefined" ? window : commonjsGlobal;
constants$2.NOOP = win$1.$W10NOOP = win$1.$W10NOOP || function() {
};
var constants$1 = constants$2;
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
var eventDelegation$3 = {};
var indexBrowser$2 = {};
var domData$6 = {
  ad_: new WeakMap(),
  ae_: new WeakMap(),
  E_: new WeakMap(),
  af_: new WeakMap(),
  ag_: new WeakMap(),
  F_: {}
};
var domData$5 = domData$6;
var componentsByDOMNode$2 = domData$5.E_;
var keysByDOMNode$2 = domData$5.ag_;
var vElementsByDOMNode = domData$5.ae_;
var vPropsByDOMNode = domData$5.ad_;
var markoUID = window.$MUID || (window.$MUID = { i: 0 });
var runtimeId$1 = markoUID.i++;
var componentLookup$3 = {};
var EMPTY_OBJECT$2 = {};
function getComponentForEl(el, host) {
  var node = typeof el == "string" ? ((host ? host.ownerDocument : host) || document).getElementById(el) : el;
  var component;
  var vElement;
  while (node) {
    if (node.fragment) {
      if (node.fragment.endNode === node) {
        node = node.fragment.startNode;
      } else {
        node = node.fragment;
        component = componentsByDOMNode$2.get(node);
      }
    } else if (vElement = vElementsByDOMNode.get(node)) {
      component = vElement.aB_;
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
    delete componentLookup$3[componentToDestroy.id];
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
  var vElement = vElementsByDOMNode.get(el);
  var virtualProps;
  if (vElement) {
    virtualProps = vElement.aC_;
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
indexBrowser$2.al_ = runtimeId$1;
indexBrowser$2.C_ = componentLookup$3;
indexBrowser$2.ah_ = getComponentForEl;
indexBrowser$2.aD_ = destroyComponentForNode$1;
indexBrowser$2.D_ = destroyNodeRecursive$3;
indexBrowser$2._T_ = nextComponentIdProvider$1;
indexBrowser$2._C_ = attachBubblingEvent$1;
indexBrowser$2.am_ = getMarkoPropsFromEl$1;
indexBrowser$2.ap_ = addComponentRootToKeyedElements$2;
indexBrowser$2.aE_ = normalizeComponentKey$1;
var componentsUtil$5 = indexBrowser$2;
var runtimeId = componentsUtil$5.al_;
var componentLookup$2 = componentsUtil$5.C_;
var getMarkoPropsFromEl = componentsUtil$5.am_;
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
  var targetComponent = componentLookup$2[targetComponentId];
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
function addDelegatedEventHandlerToHost(eventType, host) {
  var listeners = host[listenersAttachedKey] = host[listenersAttachedKey] || {};
  if (!listeners[eventType]) {
    (host.body || host).addEventListener(eventType, listeners[eventType] = function(event) {
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
eventDelegation$3.ab_ = noop;
eventDelegation$3.___ = noop;
eventDelegation$3._Z_ = delegateEvent;
eventDelegation$3.a__ = getEventFromEl;
eventDelegation$3._D_ = addDelegatedEventHandler$1;
eventDelegation$3.an_ = function(host) {
  Object.keys(delegatedEvents).forEach(function(eventType) {
    addDelegatedEventHandlerToHost(eventType, host);
  });
};
var fragment$1 = {};
var helpers$3 = {};
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
helpers$3.aG_ = insertBefore$3;
helpers$3.aH_ = insertAfter$2;
helpers$3.bT_ = nextSibling$1;
helpers$3._r_ = firstChild$1;
helpers$3.aI_ = removeChild$2;
var helpers$2 = helpers$3;
var insertBefore$2 = helpers$2.aG_;
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
  fragment2.bZ_ = function(nextNode) {
    fragment2.bZ_ = null;
    insertBefore$2(fragment2.endNode, nextNode, parentNode || startNode.parentNode);
  };
  return fragment2;
}
fragment$1.ao_ = createFragmentNode$3;
fragment$1.c__ = beginFragmentNode$1;
var constants = constants$2;
var extend$4 = function extend(target, source) {
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
function KeySequence$2() {
  this._V_ = Object.create(null);
}
KeySequence$2.prototype._L_ = function(key) {
  var lookup = this._V_;
  if (lookup[key]) {
    return key + "_" + lookup[key]++;
  }
  lookup[key] = 1;
  return key;
};
var KeySequence_1 = KeySequence$2;
var w10Noop = constants.NOOP;
var componentUtil = indexBrowser$2;
var attachBubblingEvent = componentUtil._C_;
var addDelegatedEventHandler = eventDelegation$3._D_;
var extend$3 = extend$4;
var KeySequence$1 = KeySequence_1;
var EMPTY_OBJECT$1 = {};
var FLAG_WILL_RERENDER_IN_BROWSER$1 = 1;
var FLAG_HAS_RENDER_BODY = 2;
function ComponentDef$1(component, componentId, componentsContext) {
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
ComponentDef$1.prototype = {
  _L_: function(key) {
    return (this._K_ || (this._K_ = new KeySequence$1()))._L_(key);
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
ComponentDef$1.prototype.nk = ComponentDef$1.prototype._L_;
ComponentDef$1._O_ = function(o, types, global2, registry2) {
  var id = o[0];
  var typeName = types[o[1]];
  var input = o[2] || null;
  var extra = o[3] || EMPTY_OBJECT$1;
  var state = extra.s;
  var componentProps = extra.w;
  var flags = extra.f;
  var component = registry2._P_(typeName, id);
  component.U_ = true;
  if (flags & FLAG_HAS_RENDER_BODY) {
    (input || (input = {})).renderBody = w10Noop;
  }
  if (flags & FLAG_WILL_RERENDER_IN_BROWSER$1) {
    if (component.onCreate) {
      component.onCreate(input, { global: global2 });
    }
    if (component.onInput) {
      input = component.onInput(input, { global: global2 }) || input;
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
      extend$3(component, componentProps);
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
var ComponentDef_1 = ComponentDef$1;
var indexBrowser$1 = {};
var promise;
var queueMicrotask_1 = typeof queueMicrotask === "function" ? queueMicrotask : typeof Promise === "function" && (promise = Promise.resolve()) ? function(cb) {
  promise.then(cb).catch(rethrow);
} : setTimeout;
function rethrow(err) {
  setTimeout(function() {
    throw err;
  });
}
var extend$2 = extend$4;
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
function State(component) {
  this.h_ = component;
  this._u_ = {};
  this.V_ = false;
  this._l_ = null;
  this._k_ = null;
  this._Y_ = null;
  Object.seal(this);
}
State.prototype = {
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
      this._u_ = rawState = extend$2({}, rawState);
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
var State_1 = State;
var extend$1 = extend$4;
var componentsUtil$4 = indexBrowser$2;
var destroyComponentForNode = componentsUtil$4.aD_;
var destroyNodeRecursive$2 = componentsUtil$4.D_;
var helpers$1 = helpers$3;
var insertBefore$1 = helpers$1.aG_;
var insertAfter$1 = helpers$1.aH_;
var removeChild$1 = helpers$1.aI_;
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
var domInsert$2 = function(target, getEl3, afterInsert3) {
  extend$1(target, {
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
createOut.aF_ = setCreateOut;
var createOut_1 = createOut;
var ComponentsContext = { exports: {} };
var nextComponentIdProvider = indexBrowser$2._T_;
function GlobalComponentsContext(out) {
  this._U_ = {};
  this._q_ = void 0;
  this._M_ = nextComponentIdProvider(out);
}
var GlobalComponentsContext_1 = GlobalComponentsContext;
(function(module, exports) {
  var GlobalComponentsContext2 = GlobalComponentsContext_1;
  function ComponentsContext2(out, parentComponentsContext) {
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
        out.global.b_ = globalComponentsContext = new GlobalComponentsContext2(out);
      }
    }
    this.e_ = globalComponentsContext;
    this.b_ = [];
    this.y_ = out;
    this.j_ = componentDef;
    this._Q_ = void 0;
    this.p_ = parentComponentsContext && parentComponentsContext.p_;
  }
  ComponentsContext2.prototype = {
    z_: function(host) {
      var componentDefs = this.b_;
      ComponentsContext2._R_(componentDefs, host);
      this.y_.emit("_S_");
      this.y_.global.b_ = void 0;
      return componentDefs;
    }
  };
  function getComponentsContext2(out) {
    return out.b_ || (out.b_ = new ComponentsContext2(out));
  }
  module.exports = exports = ComponentsContext2;
  exports.o_ = getComponentsContext2;
})(ComponentsContext, ComponentsContext.exports);
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
function EventEmitter$1() {
  this.$e = this.$e || {};
}
EventEmitter$1.EventEmitter = EventEmitter$1;
EventEmitter$1.prototype = {
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
var src = EventEmitter$1;
var domInsert$1 = domInsert$2;
function getRootNode(el) {
  var cur = el;
  while (cur.parentNode)
    cur = cur.parentNode;
  return cur;
}
function getComponentDefs(result) {
  var componentDefs = result.b_;
  if (!componentDefs) {
    throw Error("No component");
  }
  return componentDefs;
}
function RenderResult$1(out) {
  this.out = this.y_ = out;
  this.b_ = void 0;
}
var RenderResult_1 = RenderResult$1;
var proto$1 = RenderResult$1.prototype = {
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
  afterInsert: function(host) {
    var out = this.y_;
    var componentsContext = out.b_;
    if (componentsContext) {
      this.b_ = componentsContext.z_(host);
    } else {
      this.b_ = null;
    }
    return this;
  },
  getNode: function(host) {
    return this.y_.A_(host);
  },
  getOutput: function() {
    return this.y_.B_();
  },
  toString: function() {
    return this.y_.toString();
  },
  document: typeof window === "object" && document
};
Object.defineProperty(proto$1, "html", {
  get: function() {
    return this.toString();
  }
});
Object.defineProperty(proto$1, "context", {
  get: function() {
    return this.y_;
  }
});
domInsert$1(proto$1, function getEl(renderResult, referenceEl) {
  return renderResult.getNode(getRootNode(referenceEl));
}, function afterInsert(renderResult, referenceEl) {
  return renderResult.afterInsert(getRootNode(referenceEl));
});
var listenerTracker = { exports: {} };
(function(module, exports) {
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
  function SubscriptionTracker2() {
    this.$__subscribeToList = [];
  }
  SubscriptionTracker2.prototype = {
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
  exports = module.exports = SubscriptionTracker2;
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
    return new SubscriptionTracker2();
  };
})(listenerTracker, listenerTracker.exports);
var copyProps$1 = function copyProps(from, to) {
  Object.getOwnPropertyNames(from).forEach(function(name) {
    var descriptor = Object.getOwnPropertyDescriptor(from, name);
    Object.defineProperty(to, name, descriptor);
  });
};
var copyProps2 = copyProps$1;
function inherit$7(ctor, superCtor, shouldCopyProps) {
  var oldProto = ctor.prototype;
  var newProto = ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      writable: true,
      configurable: true
    }
  });
  if (oldProto && shouldCopyProps !== false) {
    copyProps2(oldProto, newProto);
  }
  ctor.$super = superCtor;
  ctor.prototype = newProto;
  return ctor;
}
var inherit_1 = inherit$7;
inherit$7._inherit = inherit$7;
var updateManager$1 = {};
var indexBrowser = {};
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
indexBrowser.az_ = function(callback) {
  if (queue.push(callback) === 1) {
    window.postMessage(msg, "*");
  }
};
var updatesScheduled = false;
var batchStack = [];
var unbatchedQueue = [];
var setImmediate = indexBrowser.az_;
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
  setImmediate(updateUnbatchedComponents);
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
    aA_: null
  };
  batchStack.push(batch);
  try {
    func();
  } finally {
    try {
      if (batch.aA_) {
        updateComponents(batch.aA_);
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
    if (batch.aA_) {
      batch.aA_.push(component);
    } else {
      batch.aA_ = [component];
    }
  } else {
    scheduleUpdates();
    unbatchedQueue.push(component);
  }
}
updateManager$1._i_ = queueComponentUpdate;
updateManager$1._o_ = batchUpdate;
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
    if (curChild.bI_ === "option") {
      fn(curChild, ++i);
    } else {
      i = forEachOption(curChild, fn, i);
    }
    curChild = curChild.bT_;
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
    if (fromEl.hasAttribute("value") && !toEl.bM_("value")) {
      fromEl.removeAttribute("value");
    }
  },
  textarea: function(fromEl, toEl) {
    if (toEl.bW_) {
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
    if (!toEl.bM_("multiple")) {
      var selected = 0;
      forEachOption(toEl, function(option, i) {
        if (option.bM_("selected")) {
          selected = i;
        }
      }, -1);
      if (fromEl.selectedIndex !== selected) {
        fromEl.selectedIndex = selected;
      }
    }
  }
};
var specialElHandlers$1 = new SpecialElHandlers();
var vdom = {};
function VNode$6() {
}
VNode$6.prototype = {
  bA_: function(finalChildCount, ownerComponent) {
    this.bQ_ = finalChildCount;
    this.bR_ = 0;
    this.bG_ = null;
    this.bS_ = null;
    this.bD_ = null;
    this.bE_ = null;
    this.aB_ = ownerComponent;
  },
  get _r_() {
    var firstChild2 = this.bG_;
    if (firstChild2 && firstChild2.bF_) {
      var nestedFirstChild = firstChild2._r_;
      return nestedFirstChild || firstChild2.bT_;
    }
    return firstChild2;
  },
  get bT_() {
    var nextSibling2 = this.bE_;
    if (nextSibling2) {
      if (nextSibling2.bF_) {
        var firstChild2 = nextSibling2._r_;
        return firstChild2 || nextSibling2.bT_;
      }
    } else {
      var parentNode = this.bD_;
      if (parentNode && parentNode.bF_) {
        return parentNode.bT_;
      }
    }
    return nextSibling2;
  },
  bs_: function(child) {
    this.bR_++;
    if (this.bI_ === "textarea") {
      if (child.bU_) {
        var childValue = child.bV_;
        this.bJ_ = (this.bJ_ || "") + childValue;
      } else if (child.n_ || child.m_) {
        this.bW_ = true;
      } else {
        throw TypeError();
      }
    } else {
      var lastChild = this.bS_;
      child.bD_ = this;
      if (lastChild) {
        lastChild.bE_ = child;
      } else {
        this.bG_ = child;
      }
      this.bS_ = child;
    }
    return child;
  },
  bL_: function finishChild() {
    if (this.bR_ === this.bQ_ && this.bD_) {
      return this.bD_.bL_();
    } else {
      return this;
    }
  }
};
var VNode_1 = VNode$6;
var VNode$5 = VNode_1;
var inherit$6 = inherit_1;
var extend2 = extend$4;
function VDocumentFragmentClone(other) {
  extend2(this, other);
  this.bD_ = null;
  this.bE_ = null;
}
function VDocumentFragment$1(out) {
  this.bA_(null);
  this.y_ = out;
}
VDocumentFragment$1.prototype = {
  bC_: 11,
  bF_: true,
  bt_: function() {
    return new VDocumentFragmentClone(this);
  },
  bz_: function(host) {
    return (host.ownerDocument || host).createDocumentFragment();
  }
};
inherit$6(VDocumentFragment$1, VNode$5);
VDocumentFragmentClone.prototype = VDocumentFragment$1.prototype;
var VDocumentFragment_1 = VDocumentFragment$1;
var domData$4 = domData$6;
var componentsUtil$3 = indexBrowser$2;
var vElementByDOMNode$2 = domData$4.ae_;
var VNode$4 = VNode_1;
var inherit$5 = inherit_1;
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
  this.bG_ = other.bG_;
  this.bD_ = null;
  this.bE_ = null;
  this.bB_ = other.bB_;
  this.bH_ = other.bH_;
  this.aC_ = other.aC_;
  this.bI_ = other.bI_;
  this._I_ = other._I_;
  this.bJ_ = other.bJ_;
  this.bK_ = other.bK_;
}
function VElement$2(tagName, attrs, key, ownerComponent, childCount, flags, props) {
  this.bA_(childCount, ownerComponent);
  var constId;
  if (props) {
    constId = props.i;
  }
  this.bB_ = key;
  this._I_ = flags || 0;
  this.bH_ = attrs || EMPTY_OBJECT;
  this.aC_ = props || EMPTY_OBJECT;
  this.bI_ = tagName;
  this.bJ_ = null;
  this.bK_ = constId;
  this.n_ = false;
  this.m_ = false;
}
VElement$2.prototype = {
  bC_: 1,
  bt_: function() {
    return new VElementClone(this);
  },
  e: function(tagName, attrs, key, ownerComponent, childCount, flags, props) {
    var child = this.bs_(new VElement$2(tagName, attrs, key, ownerComponent, childCount, flags, props));
    if (childCount === 0) {
      return this.bL_();
    } else {
      return child;
    }
  },
  n: function(node, ownerComponent) {
    node = node.bt_();
    node.aB_ = ownerComponent;
    this.bs_(node);
    return this.bL_();
  },
  bz_: function(host, parentNamespaceURI) {
    var tagName = this.bI_;
    var attributes = this.bH_;
    var namespaceURI = DEFAULT_NS[tagName] || parentNamespaceURI || NS_HTML;
    var flags = this._I_;
    var el = (host.ownerDocument || host).createElementNS(namespaceURI, tagName);
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
  bM_: function(name) {
    var value = this.bH_[name];
    return value != null && value !== false;
  }
};
inherit$5(VElement$2, VNode$4);
var proto = VElementClone.prototype = VElement$2.prototype;
["checked", "selected", "disabled"].forEach(function(name) {
  defineProperty(proto, name, {
    get: function() {
      var value = this.bH_[name];
      return value !== false && value != null;
    }
  });
});
defineProperty(proto, "q_", {
  get: function() {
    var value = this.bJ_;
    if (value == null) {
      value = this.bH_.value;
    }
    return value != null && value !== false ? value + "" : this.bH_.type === "checkbox" || this.bH_.type === "radio" ? "on" : "";
  }
});
VElement$2.bN_ = function(attrs) {
  return attrs;
};
function virtualizeElement$1(node, virtualizeChildNodes2, ownerComponent) {
  var attributes = node.attributes;
  var attrCount = attributes.length;
  var attrs = null;
  var props = null;
  if (attrCount) {
    attrs = {};
    for (var i = 0; i < attrCount; i++) {
      var attr = attributes[i];
      var attrName = attr.name;
      if (!xmlnsRegExp.test(attrName)) {
        if (attrName === "data-marko") {
          props = componentsUtil$3.am_(node);
        } else if (attr.namespaceURI === NS_XLINK) {
          attrs[ATTR_XLINK_HREF] = attr.value;
        } else {
          attrs[attrName] = attr.value;
        }
      }
    }
  }
  var tagName = node.nodeName;
  if (node.namespaceURI === NS_HTML) {
    tagName = tagName.toLowerCase();
  }
  var vdomEl = new VElement$2(tagName, attrs, null, ownerComponent, 0, 0, props);
  if (vdomEl.bI_ === "textarea") {
    vdomEl.bJ_ = node.value;
  } else if (virtualizeChildNodes2) {
    virtualizeChildNodes2(node, vdomEl, ownerComponent);
  }
  return vdomEl;
}
VElement$2.bO_ = virtualizeElement$1;
VElement$2.bP_ = function(fromEl, vFromEl, toEl) {
  var removePreservedAttributes = VElement$2.bN_;
  var fromFlags = vFromEl._I_;
  var toFlags = toEl._I_;
  vElementByDOMNode$2.set(fromEl, toEl);
  var attrs = toEl.bH_;
  var props = toEl.aC_;
  if (toFlags & FLAG_CUSTOM_ELEMENT) {
    return assign(fromEl, attrs);
  }
  var attrName;
  var oldAttrs = vFromEl.bH_;
  if (oldAttrs) {
    if (oldAttrs === attrs) {
      return;
    } else {
      oldAttrs = removePreservedAttributes(oldAttrs, props);
    }
  }
  var attrValue;
  if (toFlags & FLAG_SIMPLE_ATTRS && fromFlags & FLAG_SIMPLE_ATTRS) {
    if (oldAttrs["class"] !== (attrValue = attrs["class"])) {
      fromEl.className = attrValue;
    }
    if (oldAttrs.id !== (attrValue = attrs.id)) {
      fromEl.id = attrValue;
    }
    if (oldAttrs.style !== (attrValue = attrs.style)) {
      fromEl.cssText = attrValue;
    }
    return;
  }
  attrs = removePreservedAttributes(attrs, props, true);
  var namespaceURI;
  for (attrName in attrs) {
    attrValue = attrs[attrName];
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
  if (toEl.bB_ === null || fromFlags & FLAG_SPREAD_ATTRS) {
    for (attrName in oldAttrs) {
      if (!(attrName in attrs)) {
        if (attrName === ATTR_XLINK_HREF) {
          fromEl.removeAttributeNS(ATTR_XLINK_HREF, ATTR_HREF);
        } else {
          fromEl.removeAttribute(attrName);
        }
      }
    }
  }
};
var VElement_1 = VElement$2;
var VNode$3 = VNode_1;
var inherit$4 = inherit_1;
function VText$1(value, ownerComponent) {
  this.bA_(-1, ownerComponent);
  this.bV_ = value;
}
VText$1.prototype = {
  bU_: true,
  bC_: 3,
  bz_: function(host) {
    return (host.ownerDocument || host).createTextNode(this.bV_);
  },
  bt_: function() {
    return new VText$1(this.bV_);
  }
};
inherit$4(VText$1, VNode$3);
var VText_1 = VText$1;
var VNode$2 = VNode_1;
var inherit$3 = inherit_1;
function VComponent$1(component, key, ownerComponent, preserve) {
  this.bA_(null, ownerComponent);
  this.bB_ = key;
  this.h_ = component;
  this.n_ = preserve;
}
VComponent$1.prototype = {
  bC_: 2
};
inherit$3(VComponent$1, VNode$2);
var VComponent_1 = VComponent$1;
var domData$3 = domData$6;
var keysByDOMNode$1 = domData$3.ag_;
var vElementByDOMNode$1 = domData$3.ae_;
var VNode$1 = VNode_1;
var inherit$2 = inherit_1;
var createFragmentNode$2 = fragment$1.ao_;
function VFragment$1(key, ownerComponent, preserve) {
  this.bA_(null, ownerComponent);
  this.bB_ = key;
  this.n_ = preserve;
}
VFragment$1.prototype = {
  bC_: 12,
  bz_: function() {
    var fragment2 = createFragmentNode$2();
    keysByDOMNode$1.set(fragment2, this.bB_);
    vElementByDOMNode$1.set(fragment2, this);
    return fragment2;
  }
};
inherit$2(VFragment$1, VNode$1);
var VFragment_1 = VFragment$1;
var parseHTML$1 = function(html) {
  var container = document.createElement("template");
  parseHTML$1 = container.content ? function(html2) {
    container.innerHTML = html2;
    return container.content;
  } : function(html2) {
    container.innerHTML = html2;
    return container;
  };
  return parseHTML$1(html);
};
var parseHtml = function(html) {
  return parseHTML$1(html).firstChild;
};
var VNode = VNode_1;
var VDocumentFragment = VDocumentFragment_1;
var VElement$1 = VElement_1;
var VText = VText_1;
var VComponent = VComponent_1;
var VFragment = VFragment_1;
var parseHTML = parseHtml;
var specialHtmlRegexp = /[&<]/;
function virtualizeChildNodes(node, vdomParent, ownerComponent) {
  var curChild = node.firstChild;
  while (curChild) {
    vdomParent.bs_(virtualize(curChild, ownerComponent));
    curChild = curChild.nextSibling;
  }
}
function virtualize(node, ownerComponent) {
  switch (node.nodeType) {
    case 1:
      return VElement$1.bO_(node, virtualizeChildNodes, ownerComponent);
    case 3:
      return new VText(node.nodeValue, ownerComponent);
    case 11:
      var vdomDocFragment = new VDocumentFragment();
      virtualizeChildNodes(node, vdomDocFragment, ownerComponent);
      return vdomDocFragment;
  }
}
function virtualizeHTML(html, ownerComponent) {
  if (!specialHtmlRegexp.test(html)) {
    return new VText(html, ownerComponent);
  }
  var vdomFragment = new VDocumentFragment();
  var curChild = parseHTML(html);
  while (curChild) {
    vdomFragment.bs_(virtualize(curChild, ownerComponent));
    curChild = curChild.nextSibling;
  }
  return vdomFragment;
}
var Node_prototype = VNode.prototype;
Node_prototype.t = function(value) {
  var type = typeof value;
  var vdomNode;
  if (type !== "string") {
    if (value == null) {
      value = "";
    } else if (type === "object") {
      if (value.toHTML) {
        vdomNode = virtualizeHTML(value.toHTML());
      }
    }
  }
  this.bs_(vdomNode || new VText(value.toString()));
  return this.bL_();
};
Node_prototype.bx_ = function() {
  return this.bs_(new VDocumentFragment());
};
vdom.bc_ = VDocumentFragment;
vdom.bb_ = VElement$1;
vdom.bd_ = VText;
vdom.be_ = VComponent;
vdom.bf_ = VFragment;
vdom.bO_ = virtualize;
vdom.bg_ = virtualizeHTML;
var specialElHandlers = specialElHandlers$1;
var KeySequence = KeySequence_1;
var componentsUtil$2 = indexBrowser$2;
var existingComponentLookup = componentsUtil$2.C_;
var destroyNodeRecursive$1 = componentsUtil$2.D_;
var addComponentRootToKeyedElements$1 = componentsUtil$2.ap_;
var normalizeComponentKey = componentsUtil$2.aE_;
var VElement = vdom.bb_;
var virtualizeElement = VElement.bO_;
var morphAttrs = VElement.bP_;
var eventDelegation$2 = eventDelegation$3;
var fragment = fragment$1;
var helpers = helpers$3;
var domData$2 = domData$6;
var keysByDOMNode = domData$2.ag_;
var componentByDOMNode = domData$2.E_;
var vElementByDOMNode = domData$2.ae_;
var detachedByDOMNode = domData$2.af_;
var insertBefore = helpers.aG_;
var insertAfter = helpers.aH_;
var nextSibling = helpers.bT_;
var firstChild = helpers._r_;
var removeChild = helpers.aI_;
var createFragmentNode$1 = fragment.ao_;
var beginFragmentNode = fragment.c__;
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
  return fromEl.bI_ === toEl.bI_;
}
function caseInsensitiveCompare(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}
function onNodeAdded(node, componentsContext) {
  if (node.nodeType === ELEMENT_NODE$1) {
    eventDelegation$2.ab_(node, componentsContext);
  }
}
function morphdom$1(fromNode, toNode, host, componentsContext) {
  var globalComponentsContext;
  var isHydrate = false;
  var keySequences = Object.create(null);
  if (componentsContext) {
    globalComponentsContext = componentsContext.e_;
    isHydrate = globalComponentsContext.f_;
  }
  function insertVirtualNodeBefore(vNode, key, referenceEl, parentEl, ownerComponent, parentComponent) {
    var realNode = vNode.bz_(host, parentEl.namespaceURI);
    insertBefore(realNode, referenceEl, parentEl);
    if (vNode.bC_ === ELEMENT_NODE$1 || vNode.bC_ === FRAGMENT_NODE) {
      if (key) {
        keysByDOMNode.set(realNode, key);
        (isAutoKey(key) ? parentComponent : ownerComponent).k_[key] = realNode;
      }
      if (vNode.bI_ !== "textarea") {
        morphChildren(realNode, vNode, parentComponent);
      }
      onNodeAdded(realNode, componentsContext);
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
        toNextSibling = curToNodeChild.bT_;
        curToNodeType = curToNodeChild.bC_;
        curToNodeKey = curToNodeChild.bB_;
        if (curFromNodeChild && curFromNodeChild.nodeType === DOCTYPE_NODE) {
          curFromNodeChild = nextSibling(curFromNodeChild);
        }
        var ownerComponent = curToNodeChild.aB_ || parentComponent;
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
          curToNodeKey = (keySequences[referenceComponent.id] || (keySequences[referenceComponent.id] = new KeySequence()))._L_(curToNodeKey);
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
                if (curFromNodeChild.nodeType === ELEMENT_NODE$1 && (curToNodeChild.n_ || caseInsensitiveCompare(curFromNodeChild.nodeName, curToNodeChild.bI_ || ""))) {
                  curVFromNodeChild = virtualizeElement(curFromNodeChild);
                  curVFromNodeChild.bI_ = curToNodeChild.bI_;
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
                } else if (curToNodeChild.bC_ === FRAGMENT_NODE && curFromNodeChild.nodeType === COMMENT_NODE) {
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
                    if (toNextSibling && toNextSibling.bB_ === curFromNodeKey) {
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
                  if (caseInsensitiveCompare(curVFromNodeChild.bI_, curToNodeChild.bI_)) {
                    curVFromNodeChild.bI_ = curToNodeChild.bI_;
                  }
                } else {
                  curFromNodeChild = fromNextSibling;
                  continue;
                }
              } else if (curFromNodeKey = curVFromNodeChild.bB_) {
                isCompatible = false;
              }
              isCompatible = isCompatible !== false && compareNodeNames(curVFromNodeChild, curToNodeChild) === true;
              if (isCompatible === true) {
                morphEl(curFromNodeChild, curVFromNodeChild, curToNodeChild, parentComponent);
              }
            } else if (curFromNodeType === TEXT_NODE || curFromNodeType === COMMENT_NODE) {
              isCompatible = true;
              if (isHydrate === true && toNextSibling && curFromNodeType === TEXT_NODE && toNextSibling.bC_ === TEXT_NODE) {
                fromNextSibling = curFromNodeChild.splitText(curToNodeChild.bV_.length);
              }
              if (curFromNodeChild.nodeValue !== curToNodeChild.bV_) {
                curFromNodeChild.nodeValue = curToNodeChild.bV_;
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
    if (fromNode2.bZ_) {
      fromNode2.bZ_(curFromNodeChild);
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
          referenceComponent = curVFromNodeChild && curVFromNodeChild.aB_;
        }
        detachNode(curFromNodeChild, fromNode2, referenceComponent);
        curFromNodeChild = fromNextSibling;
      }
    }
  }
  function morphEl(fromEl, vFromEl, toEl, parentComponent) {
    var nodeName = toEl.bI_;
    var constId = toEl.bK_;
    if (constId !== void 0 && vFromEl.bK_ === constId) {
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
        if (eventDelegation$2.___(node) != false) {
          removeChild(node);
        }
      }
    }
  });
}
var morphdom_1 = morphdom$1;
var domInsert = domInsert$2;
var defaultCreateOut = createOut_1;
var getComponentsContext = ComponentsContext.exports.o_;
var componentsUtil$1 = indexBrowser$2;
var componentLookup$1 = componentsUtil$1.C_;
var destroyNodeRecursive = componentsUtil$1.D_;
var EventEmitter = src;
var RenderResult = RenderResult_1;
var SubscriptionTracker = listenerTracker.exports;
var inherit$1 = inherit_1;
var updateManager = updateManager$1;
var morphdom = morphdom_1;
var eventDelegation$1 = eventDelegation$3;
var domData$1 = domData$6;
var componentsByDOMNode$1 = domData$1.E_;
var keyedElementsByComponentId$1 = domData$1.F_;
var CONTEXT_KEY = "__subtree_context__";
var hasOwnProperty = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;
var COMPONENT_SUBSCRIBE_TO_OPTIONS;
var NON_COMPONENT_SUBSCRIBE_TO_OPTIONS = {
  addDestroyListener: false
};
var emit = EventEmitter.prototype.emit;
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
  var targetComponent = componentLookup$1[component.G_];
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
  EventEmitter.call(this);
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
    var subscriptions = this.L_ || (this.L_ = new SubscriptionTracker());
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
      if (eventDelegation$1.___(node) !== false) {
        node.parentNode.removeChild(node);
      }
    });
    root.detached = true;
    delete componentLookup$1[this.id];
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
    var renderer = self2._n_;
    if (!renderer) {
      throw TypeError();
    }
    var input = this.P_ || this.Q_;
    updateManager._o_(function() {
      self2._p_(input, false).afterInsert(self2.X_);
    });
    this.I_();
  },
  _p_: function(input, isHydrate) {
    var host = this.X_;
    var globalData = this.S_;
    var rootNode = this.K_;
    var renderer = this._n_;
    var createOut2 = renderer.createOut || defaultCreateOut;
    var out = createOut2(globalData);
    out.sync();
    out.X_ = this.X_;
    out[CONTEXT_KEY] = this._h_;
    var componentsContext = getComponentsContext(out);
    var globalComponentsContext = componentsContext.e_;
    globalComponentsContext._q_ = this;
    globalComponentsContext.f_ = isHydrate;
    renderer(input, out);
    var result = new RenderResult(out);
    var targetNode = out.B_()._r_;
    morphdom(rootNode, targetNode, host, componentsContext);
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
      if (targetMethodName) {
        finalCustomEvents[eventType] = [targetMethodName, isOnce, extraArgs];
      }
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
inherit$1(Component, EventEmitter);
var Component_1 = Component;
var BaseState = State_1;
var BaseComponent = Component_1;
var inherit = inherit_1;
var defineComponent$1 = function defineComponent(def, renderer) {
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
    BaseComponent.call(this, id);
  }
  if (!proto2.Y_) {
    inherit(ComponentClass, BaseComponent);
  }
  proto2 = Component2.prototype = ComponentClass.prototype;
  Component2.Y_ = true;
  function State2(component) {
    BaseState.call(this, component);
  }
  inherit(State2, BaseState);
  proto2._c_ = State2;
  proto2._n_ = renderer;
  return Component2;
};
var queueMicrotask$1 = queueMicrotask_1;
var defineComponent2 = defineComponent$1;
var initComponents$1 = indexBrowser$3;
var registered = {};
var loaded = {};
var componentTypes = {};
var pendingDefs;
function register(type, def) {
  var pendingForType;
  if (pendingDefs) {
    pendingForType = pendingDefs[type];
  }
  registered[type] = def;
  delete loaded[type];
  delete componentTypes[type];
  if (pendingForType) {
    delete pendingDefs[type];
    queueMicrotask$1(function() {
      pendingForType.forEach(function(args) {
        initComponents$1.au_(args[0], args[1], args[2], args[3])();
      });
    });
  }
  return type;
}
function addPendingDef(def, type, meta, host, runtimeId2) {
  if (!pendingDefs) {
    pendingDefs = {};
  }
  (pendingDefs[type] = pendingDefs[type] || []).push([
    def,
    meta,
    host,
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
    ComponentClass = defineComponent2(ComponentClass, ComponentClass.renderer);
  }
  ComponentClass.prototype._N_ = typeName;
  componentTypes[typeName] = ComponentClass;
  return ComponentClass;
}
function createComponent(typeName, id) {
  var ComponentClass = getComponentClass(typeName);
  return new ComponentClass(id);
}
indexBrowser$1.r = register;
indexBrowser$1.av_ = getComponentClass;
indexBrowser$1._P_ = createComponent;
indexBrowser$1.as_ = isRegistered;
indexBrowser$1.at_ = addPendingDef;
var warp10Finalize = finalize2;
var eventDelegation = eventDelegation$3;
var win = window;
var createFragmentNode = fragment$1.ao_;
var componentsUtil = indexBrowser$2;
var componentLookup = componentsUtil.C_;
var addComponentRootToKeyedElements = componentsUtil.ap_;
var ComponentDef = ComponentDef_1;
var registry$1 = indexBrowser$1;
var domData = domData$6;
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
            if (ownerComponent = componentLookup[ownerId]) {
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
      var markoProps = componentsUtil.am_(node);
      if (markoKey) {
        var separatorIndex = markoKey.indexOf(" ");
        ownerId = markoKey.substring(separatorIndex + 1);
        markoKey = markoKey.substring(0, separatorIndex);
        if (ownerComponent = componentLookup[ownerId]) {
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
function initComponent(componentDef, host) {
  var component = componentDef.h_;
  component.I_();
  component.X_ = host;
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
function initClientRendered(componentDefs, host) {
  if (!host)
    host = document;
  eventDelegation.an_(host);
  var len = componentDefs.length;
  var componentDef;
  var i;
  for (i = len; i--; ) {
    componentDef = componentDefs[i];
    trackComponent(componentDef);
  }
  for (i = len; i--; ) {
    componentDef = componentDefs[i];
    initComponent(componentDef, host);
  }
}
function initServerRendered(renderedComponents, host) {
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
  renderedComponents = warp10Finalize(renderedComponents);
  if (isFromSerializedGlobals) {
    runtimeId2 = this.r;
    host = document;
  } else {
    runtimeId2 = renderedComponents.r || DEFAULT_RUNTIME_ID;
    if (!host)
      host = document;
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
  indexServerComponentBoundaries(host, runtimeId2);
  eventDelegation.an_(host);
  if (renderedComponents.g) {
    meta.aq_ = renderedComponents.g;
  }
  if (renderedComponents.t) {
    meta.ar_ = meta.ar_ ? meta.ar_.concat(renderedComponents.t) : renderedComponents.t;
  }
  (renderedComponents.w || []).map(function(componentDef) {
    var typeName = meta.ar_[componentDef[1]];
    return registry$1.as_(typeName) ? tryHydrateComponent(componentDef, meta, host, runtimeId2) : registry$1.at_(componentDef, typeName, meta, host, runtimeId2);
  }).reverse().forEach(tryInvoke);
  return this;
}
function tryHydrateComponent(rawDef, meta, host, runtimeId2) {
  var componentDef = ComponentDef._O_(rawDef, meta.ar_, meta.aq_, registry$1);
  var mount = hydrateComponentAndGetMount(componentDef, host);
  if (!mount) {
    if (deferredDefs) {
      deferredDefs.push(componentDef);
    } else {
      deferredDefs = [componentDef];
      document.addEventListener("DOMContentLoaded", function() {
        indexServerComponentBoundaries(host, runtimeId2);
        deferredDefs.map(function(componentDef2) {
          return hydrateComponentAndGetMount(componentDef2, host);
        }).reverse().forEach(tryInvoke);
        deferredDefs = void 0;
      });
    }
  }
  return mount;
}
function hydrateComponentAndGetMount(componentDef, host) {
  var componentId = componentDef.id;
  var component = componentDef.h_;
  var rootNode = serverComponentRootNodes[componentId];
  var renderResult;
  if (rootNode) {
    delete serverComponentRootNodes[componentId];
    component.K_ = rootNode;
    componentsByDOMNode.set(rootNode, component);
    if (componentDef._I_ & FLAG_WILL_RERENDER_IN_BROWSER) {
      component.X_ = host;
      renderResult = component._p_(component.Q_, true);
      trackComponent(componentDef);
      return function mount() {
        renderResult.afterInsert(host);
      };
    } else {
      trackComponent(componentDef);
    }
    return function mount() {
      initComponent(componentDef, host);
    };
  }
}
function trackComponent(componentDef) {
  var component = componentDef.h_;
  if (component) {
    componentLookup[component.id] = component;
  }
}
function tryInvoke(fn) {
  if (fn)
    fn();
}
indexBrowser$3._R_ = initClientRendered;
indexBrowser$3.ai_ = initServerRendered;
indexBrowser$3.au_ = tryHydrateComponent;
var initComponents = indexBrowser$3;
ComponentsContext.exports._R_ = initComponents._R_;
indexBrowser$4.getComponentForEl = indexBrowser$2.ah_;
indexBrowser$4.init = window.$initComponents = initComponents.ai_;
var registry = indexBrowser$1;
indexBrowser$4.register = function(id, component) {
  registry.r(id, function() {
    return component;
  });
};
var components = indexBrowser$4;
export { components as c };
