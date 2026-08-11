!function (t) {
  var e = function (t, i) {
    return e = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (t, e) {
      t.__proto__ = e;
    } || function (t, e) {
      for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
    }, e(t, i);
  };
  function i(t, i) {
    if ("function" != typeof i && null !== i) throw new TypeError("Class extends value " + String(i) + " is not a constructor or null");
    function r() {
      this.constructor = t;
    }
    e(t, i), t.prototype = null === i ? Object.create(i) : (r.prototype = i.prototype, new r());
  }
  var r = function () {
    return r = Object.assign || function (t) {
      for (var e, i = 1, r = arguments.length; i < r; i++) for (var n in e = arguments[i]) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
      return t;
    }, r.apply(this, arguments);
  };
  function n(t, e, i, r) {
    var n,
      s = arguments.length,
      o = s < 3 ? e : null === r ? r = Object.getOwnPropertyDescriptor(e, i) : r;
    if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) o = Reflect.decorate(t, e, i, r);else for (var a = t.length - 1; a >= 0; a--) (n = t[a]) && (o = (s < 3 ? n(o) : s > 3 ? n(e, i, o) : n(e, i)) || o);
    return s > 3 && o && Object.defineProperty(e, i, o), o;
  }
  function s(t, e, i) {
    if (i || 2 === arguments.length) for (var r, n = 0, s = e.length; n < s; n++) !r && n in e || (r || (r = Array.prototype.slice.call(e, 0, n)), r[n] = e[n]);
    return t.concat(r || Array.prototype.slice.call(e));
  }
  "function" == typeof SuppressedError && SuppressedError;
  /**
       * @license
       * Copyright 2019 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const o = globalThis,
    a = o.ShadowRoot && (void 0 === o.ShadyCSS || o.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype,
    l = Symbol(),
    c = new WeakMap();
  class h {
    constructor(t, e, i) {
      if (this._$cssResult$ = !0, i !== l) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t, this.t = e;
    }
    get styleSheet() {
      let t = this.o;
      const e = this.t;
      if (a && void 0 === t) {
        const i = void 0 !== e && 1 === e.length;
        i && (t = c.get(e)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && c.set(e, t));
      }
      return t;
    }
    toString() {
      return this.cssText;
    }
  }
  const d = t => new h("string" == typeof t ? t : t + "", void 0, l),
    u = (t, ...e) => {
      const i = 1 === t.length ? t[0] : e.reduce((e, i, r) => e + (t => {
        if (!0 === t._$cssResult$) return t.cssText;
        if ("number" == typeof t) return t;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(i) + t[r + 1], t[0]);
      return new h(i, t, l);
    },
    p = a ? t => t : t => t instanceof CSSStyleSheet ? (t => {
      let e = "";
      for (const i of t.cssRules) e += i.cssText;
      return d(e);
    })(t) : t
    /**
         * @license
         * Copyright 2017 Google LLC
         * SPDX-License-Identifier: BSD-3-Clause
         */,
    {
      is: g,
      defineProperty: m,
      getOwnPropertyDescriptor: b,
      getOwnPropertyNames: f,
      getOwnPropertySymbols: y,
      getPrototypeOf: _
    } = Object,
    v = globalThis,
    w = v.trustedTypes,
    x = w ? w.emptyScript : "",
    $ = v.reactiveElementPolyfillSupport,
    E = (t, e) => t,
    S = {
      toAttribute(t, e) {
        switch (e) {
          case Boolean:
            t = t ? x : null;
            break;
          case Object:
          case Array:
            t = null == t ? t : JSON.stringify(t);
        }
        return t;
      },
      fromAttribute(t, e) {
        let i = t;
        switch (e) {
          case Boolean:
            i = null !== t;
            break;
          case Number:
            i = null === t ? null : Number(t);
            break;
          case Object:
          case Array:
            try {
              i = JSON.parse(t);
            } catch (t) {
              i = null;
            }
        }
        return i;
      }
    },
    C = (t, e) => !g(t, e),
    A = {
      attribute: !0,
      type: String,
      converter: S,
      reflect: !1,
      hasChanged: C
    };
  Symbol.metadata ??= Symbol("metadata"), v.litPropertyMetadata ??= new WeakMap();
  class P extends HTMLElement {
    static addInitializer(t) {
      this._$Ei(), (this.l ??= []).push(t);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t, e = A) {
      if (e.state && (e.attribute = !1), this._$Ei(), this.elementProperties.set(t, e), !e.noAccessor) {
        const i = Symbol(),
          r = this.getPropertyDescriptor(t, i, e);
        void 0 !== r && m(this.prototype, t, r);
      }
    }
    static getPropertyDescriptor(t, e, i) {
      const {
        get: r,
        set: n
      } = b(this.prototype, t) ?? {
        get() {
          return this[e];
        },
        set(t) {
          this[e] = t;
        }
      };
      return {
        get() {
          return r?.call(this);
        },
        set(e) {
          const s = r?.call(this);
          n.call(this, e), this.requestUpdate(t, s, i);
        },
        configurable: !0,
        enumerable: !0
      };
    }
    static getPropertyOptions(t) {
      return this.elementProperties.get(t) ?? A;
    }
    static _$Ei() {
      if (this.hasOwnProperty(E("elementProperties"))) return;
      const t = _(this);
      t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(E("finalized"))) return;
      if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
        const t = this.properties,
          e = [...f(t), ...y(t)];
        for (const i of e) this.createProperty(i, t[i]);
      }
      const t = this[Symbol.metadata];
      if (null !== t) {
        const e = litPropertyMetadata.get(t);
        if (void 0 !== e) for (const [t, i] of e) this.elementProperties.set(t, i);
      }
      this._$Eh = new Map();
      for (const [t, e] of this.elementProperties) {
        const i = this._$Eu(t, e);
        void 0 !== i && this._$Eh.set(i, t);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(t) {
      const e = [];
      if (Array.isArray(t)) {
        const i = new Set(t.flat(1 / 0).reverse());
        for (const t of i) e.unshift(p(t));
      } else void 0 !== t && e.push(p(t));
      return e;
    }
    static _$Eu(t, e) {
      const i = e.attribute;
      return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise(t => this.enableUpdating = t), this._$AL = new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach(t => t(this));
    }
    addController(t) {
      (this._$EO ??= new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
    }
    removeController(t) {
      this._$EO?.delete(t);
    }
    _$E_() {
      const t = new Map(),
        e = this.constructor.elementProperties;
      for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
      t.size > 0 && (this._$Ep = t);
    }
    createRenderRoot() {
      const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return ((t, e) => {
        if (a) t.adoptedStyleSheets = e.map(t => t instanceof CSSStyleSheet ? t : t.styleSheet);else for (const i of e) {
          const e = document.createElement("style"),
            r = o.litNonce;
          void 0 !== r && e.setAttribute("nonce", r), e.textContent = i.cssText, t.appendChild(e);
        }
      })(t, this.constructor.elementStyles), t;
    }
    connectedCallback() {
      this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach(t => t.hostConnected?.());
    }
    enableUpdating(t) {}
    disconnectedCallback() {
      this._$EO?.forEach(t => t.hostDisconnected?.());
    }
    attributeChangedCallback(t, e, i) {
      this._$AK(t, i);
    }
    _$EC(t, e) {
      const i = this.constructor.elementProperties.get(t),
        r = this.constructor._$Eu(t, i);
      if (void 0 !== r && !0 === i.reflect) {
        const n = (void 0 !== i.converter?.toAttribute ? i.converter : S).toAttribute(e, i.type);
        this._$Em = t, null == n ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
      }
    }
    _$AK(t, e) {
      const i = this.constructor,
        r = i._$Eh.get(t);
      if (void 0 !== r && this._$Em !== r) {
        const t = i.getPropertyOptions(r),
          n = "function" == typeof t.converter ? {
            fromAttribute: t.converter
          } : void 0 !== t.converter?.fromAttribute ? t.converter : S;
        this._$Em = r, this[r] = n.fromAttribute(e, t.type), this._$Em = null;
      }
    }
    requestUpdate(t, e, i) {
      if (void 0 !== t) {
        if (i ??= this.constructor.getPropertyOptions(t), !(i.hasChanged ?? C)(this[t], e)) return;
        this.P(t, e, i);
      }
      !1 === this.isUpdatePending && (this._$ES = this._$ET());
    }
    P(t, e, i) {
      this._$AL.has(t) || this._$AL.set(t, e), !0 === i.reflect && this._$Em !== t && (this._$Ej ??= new Set()).add(t);
    }
    async _$ET() {
      this.isUpdatePending = !0;
      try {
        await this._$ES;
      } catch (t) {
        Promise.reject(t);
      }
      const t = this.scheduleUpdate();
      return null != t && (await t), !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
          for (const [t, e] of this._$Ep) this[t] = e;
          this._$Ep = void 0;
        }
        const t = this.constructor.elementProperties;
        if (t.size > 0) for (const [e, i] of t) !0 !== i.wrapped || this._$AL.has(e) || void 0 === this[e] || this.P(e, this[e], i);
      }
      let t = !1;
      const e = this._$AL;
      try {
        t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach(t => t.hostUpdate?.()), this.update(e)) : this._$EU();
      } catch (e) {
        throw t = !1, this._$EU(), e;
      }
      t && this._$AE(e);
    }
    willUpdate(t) {}
    _$AE(t) {
      this._$EO?.forEach(t => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
    }
    _$EU() {
      this._$AL = new Map(), this.isUpdatePending = !1;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t) {
      return !0;
    }
    update(t) {
      this._$Ej &&= this._$Ej.forEach(t => this._$EC(t, this[t])), this._$EU();
    }
    updated(t) {}
    firstUpdated(t) {}
  }
  P.elementStyles = [], P.shadowRootOptions = {
    mode: "open"
  }, P[E("elementProperties")] = new Map(), P[E("finalized")] = new Map(), $?.({
    ReactiveElement: P
  }), (v.reactiveElementVersions ??= []).push("2.0.4");
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const T = globalThis,
    k = T.trustedTypes,
    M = k ? k.createPolicy("lit-html", {
      createHTML: t => t
    }) : void 0,
    H = "$lit$",
    B = `lit$${Math.random().toFixed(9).slice(2)}$`,
    F = "?" + B,
    I = `<${F}>`,
    L = document,
    D = () => L.createComment(""),
    O = t => null === t || "object" != typeof t && "function" != typeof t,
    N = Array.isArray,
    z = t => N(t) || "function" == typeof t?.[Symbol.iterator],
    U = "[ \t\n\f\r]",
    R = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
    j = /-->/g,
    V = />/g,
    G = RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"),
    Z = /'/g,
    K = /"/g,
    Y = /^(?:script|style|textarea|title)$/i,
    W = t => (e, ...i) => ({
      _$litType$: t,
      strings: e,
      values: i
    }),
    q = W(1),
    X = W(2),
    Q = Symbol.for("lit-noChange"),
    J = Symbol.for("lit-nothing"),
    tt = new WeakMap(),
    et = L.createTreeWalker(L, 129);
  function it(t, e) {
    if (!Array.isArray(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== M ? M.createHTML(e) : e;
  }
  const rt = (t, e) => {
    const i = t.length - 1,
      r = [];
    let n,
      s = 2 === e ? "<svg>" : "",
      o = R;
    for (let e = 0; e < i; e++) {
      const i = t[e];
      let a,
        l,
        c = -1,
        h = 0;
      for (; h < i.length && (o.lastIndex = h, l = o.exec(i), null !== l);) h = o.lastIndex, o === R ? "!--" === l[1] ? o = j : void 0 !== l[1] ? o = V : void 0 !== l[2] ? (Y.test(l[2]) && (n = RegExp("</" + l[2], "g")), o = G) : void 0 !== l[3] && (o = G) : o === G ? ">" === l[0] ? (o = n ?? R, c = -1) : void 0 === l[1] ? c = -2 : (c = o.lastIndex - l[2].length, a = l[1], o = void 0 === l[3] ? G : '"' === l[3] ? K : Z) : o === K || o === Z ? o = G : o === j || o === V ? o = R : (o = G, n = void 0);
      const d = o === G && t[e + 1].startsWith("/>") ? " " : "";
      s += o === R ? i + I : c >= 0 ? (r.push(a), i.slice(0, c) + H + i.slice(c) + B + d) : i + B + (-2 === c ? e : d);
    }
    return [it(t, s + (t[i] || "<?>") + (2 === e ? "</svg>" : "")), r];
  };
  class nt {
    constructor({
      strings: t,
      _$litType$: e
    }, i) {
      let r;
      this.parts = [];
      let n = 0,
        s = 0;
      const o = t.length - 1,
        a = this.parts,
        [l, c] = rt(t, e);
      if (this.el = nt.createElement(l, i), et.currentNode = this.el.content, 2 === e) {
        const t = this.el.content.firstChild;
        t.replaceWith(...t.childNodes);
      }
      for (; null !== (r = et.nextNode()) && a.length < o;) {
        if (1 === r.nodeType) {
          if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(H)) {
            const e = c[s++],
              i = r.getAttribute(t).split(B),
              o = /([.?@])?(.*)/.exec(e);
            a.push({
              type: 1,
              index: n,
              name: o[2],
              strings: i,
              ctor: "." === o[1] ? ct : "?" === o[1] ? ht : "@" === o[1] ? dt : lt
            }), r.removeAttribute(t);
          } else t.startsWith(B) && (a.push({
            type: 6,
            index: n
          }), r.removeAttribute(t));
          if (Y.test(r.tagName)) {
            const t = r.textContent.split(B),
              e = t.length - 1;
            if (e > 0) {
              r.textContent = k ? k.emptyScript : "";
              for (let i = 0; i < e; i++) r.append(t[i], D()), et.nextNode(), a.push({
                type: 2,
                index: ++n
              });
              r.append(t[e], D());
            }
          }
        } else if (8 === r.nodeType) if (r.data === F) a.push({
          type: 2,
          index: n
        });else {
          let t = -1;
          for (; -1 !== (t = r.data.indexOf(B, t + 1));) a.push({
            type: 7,
            index: n
          }), t += B.length - 1;
        }
        n++;
      }
    }
    static createElement(t, e) {
      const i = L.createElement("template");
      return i.innerHTML = t, i;
    }
  }
  function st(t, e, i = t, r) {
    if (e === Q) return e;
    let n = void 0 !== r ? i._$Co?.[r] : i._$Cl;
    const s = O(e) ? void 0 : e._$litDirective$;
    return n?.constructor !== s && (n?._$AO?.(!1), void 0 === s ? n = void 0 : (n = new s(t), n._$AT(t, i, r)), void 0 !== r ? (i._$Co ??= [])[r] = n : i._$Cl = n), void 0 !== n && (e = st(t, n._$AS(t, e.values), n, r)), e;
  }
  class ot {
    constructor(t, e) {
      this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t) {
      const {
          el: {
            content: e
          },
          parts: i
        } = this._$AD,
        r = (t?.creationScope ?? L).importNode(e, !0);
      et.currentNode = r;
      let n = et.nextNode(),
        s = 0,
        o = 0,
        a = i[0];
      for (; void 0 !== a;) {
        if (s === a.index) {
          let e;
          2 === a.type ? e = new at(n, n.nextSibling, this, t) : 1 === a.type ? e = new a.ctor(n, a.name, a.strings, this, t) : 6 === a.type && (e = new ut(n, this, t)), this._$AV.push(e), a = i[++o];
        }
        s !== a?.index && (n = et.nextNode(), s++);
      }
      return et.currentNode = L, r;
    }
    p(t) {
      let e = 0;
      for (const i of this._$AV) void 0 !== i && (void 0 !== i.strings ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
    }
  }
  class at {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t, e, i, r) {
      this.type = 2, this._$AH = J, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
    }
    get parentNode() {
      let t = this._$AA.parentNode;
      const e = this._$AM;
      return void 0 !== e && 11 === t?.nodeType && (t = e.parentNode), t;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t, e = this) {
      t = st(this, t, e), O(t) ? t === J || null == t || "" === t ? (this._$AH !== J && this._$AR(), this._$AH = J) : t !== this._$AH && t !== Q && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : z(t) ? this.k(t) : this._(t);
    }
    S(t) {
      return this._$AA.parentNode.insertBefore(t, this._$AB);
    }
    T(t) {
      this._$AH !== t && (this._$AR(), this._$AH = this.S(t));
    }
    _(t) {
      this._$AH !== J && O(this._$AH) ? this._$AA.nextSibling.data = t : this.T(L.createTextNode(t)), this._$AH = t;
    }
    $(t) {
      const {
          values: e,
          _$litType$: i
        } = t,
        r = "number" == typeof i ? this._$AC(t) : (void 0 === i.el && (i.el = nt.createElement(it(i.h, i.h[0]), this.options)), i);
      if (this._$AH?._$AD === r) this._$AH.p(e);else {
        const t = new ot(r, this),
          i = t.u(this.options);
        t.p(e), this.T(i), this._$AH = t;
      }
    }
    _$AC(t) {
      let e = tt.get(t.strings);
      return void 0 === e && tt.set(t.strings, e = new nt(t)), e;
    }
    k(t) {
      N(this._$AH) || (this._$AH = [], this._$AR());
      const e = this._$AH;
      let i,
        r = 0;
      for (const n of t) r === e.length ? e.push(i = new at(this.S(D()), this.S(D()), this, this.options)) : i = e[r], i._$AI(n), r++;
      r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
    }
    _$AR(t = this._$AA.nextSibling, e) {
      for (this._$AP?.(!1, !0, e); t && t !== this._$AB;) {
        const e = t.nextSibling;
        t.remove(), t = e;
      }
    }
    setConnected(t) {
      void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
    }
  }
  class lt {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t, e, i, r, n) {
      this.type = 1, this._$AH = J, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = n, i.length > 2 || "" !== i[0] || "" !== i[1] ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = J;
    }
    _$AI(t, e = this, i, r) {
      const n = this.strings;
      let s = !1;
      if (void 0 === n) t = st(this, t, e, 0), s = !O(t) || t !== this._$AH && t !== Q, s && (this._$AH = t);else {
        const r = t;
        let o, a;
        for (t = n[0], o = 0; o < n.length - 1; o++) a = st(this, r[i + o], e, o), a === Q && (a = this._$AH[o]), s ||= !O(a) || a !== this._$AH[o], a === J ? t = J : t !== J && (t += (a ?? "") + n[o + 1]), this._$AH[o] = a;
      }
      s && !r && this.j(t);
    }
    j(t) {
      t === J ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
    }
  }
  class ct extends lt {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t) {
      this.element[this.name] = t === J ? void 0 : t;
    }
  }
  class ht extends lt {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t) {
      this.element.toggleAttribute(this.name, !!t && t !== J);
    }
  }
  class dt extends lt {
    constructor(t, e, i, r, n) {
      super(t, e, i, r, n), this.type = 5;
    }
    _$AI(t, e = this) {
      if ((t = st(this, t, e, 0) ?? J) === Q) return;
      const i = this._$AH,
        r = t === J && i !== J || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive,
        n = t !== J && (i === J || r);
      r && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
    }
    handleEvent(t) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
    }
  }
  class ut {
    constructor(t, e, i) {
      this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t) {
      st(this, t);
    }
  }
  const pt = {
      P: H,
      A: B,
      C: F,
      M: 1,
      L: rt,
      R: ot,
      D: z,
      V: st,
      I: at,
      H: lt,
      N: ht,
      U: dt,
      B: ct,
      F: ut
    },
    gt = T.litHtmlPolyfillSupport;
  gt?.(nt, at), (T.litHtmlVersions ??= []).push("3.1.4");
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  class mt extends P {
    constructor() {
      super(...arguments), this.renderOptions = {
        host: this
      }, this._$Do = void 0;
    }
    createRenderRoot() {
      const t = super.createRenderRoot();
      return this.renderOptions.renderBefore ??= t.firstChild, t;
    }
    update(t) {
      const e = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ((t, e, i) => {
        const r = i?.renderBefore ?? e;
        let n = r._$litPart$;
        if (void 0 === n) {
          const t = i?.renderBefore ?? null;
          r._$litPart$ = n = new at(e.insertBefore(D(), t), t, void 0, i ?? {});
        }
        return n._$AI(t), n;
      })(e, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(!0);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(!1);
    }
    render() {
      return Q;
    }
  }
  mt._$litElement$ = !0, mt.finalized = !0, globalThis.litElementHydrateSupport?.({
    LitElement: mt
  });
  const bt = globalThis.litElementPolyfillSupport;
  bt?.({
    LitElement: mt
  }), (globalThis.litElementVersions ??= []).push("4.0.6");
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const ft = {
      attribute: !0,
      type: String,
      converter: S,
      reflect: !1,
      hasChanged: C
    },
    yt = (t = ft, e, i) => {
      const {
        kind: r,
        metadata: n
      } = i;
      let s = globalThis.litPropertyMetadata.get(n);
      if (void 0 === s && globalThis.litPropertyMetadata.set(n, s = new Map()), s.set(i.name, t), "accessor" === r) {
        const {
          name: r
        } = i;
        return {
          set(i) {
            const n = e.get.call(this);
            e.set.call(this, i), this.requestUpdate(r, n, t);
          },
          init(e) {
            return void 0 !== e && this.P(r, void 0, t), e;
          }
        };
      }
      if ("setter" === r) {
        const {
          name: r
        } = i;
        return function (i) {
          const n = this[r];
          e.call(this, i), this.requestUpdate(r, n, t);
        };
      }
      throw Error("Unsupported decorator location: " + r);
    };
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  function _t(t) {
    return (e, i) => "object" == typeof i ? yt(t, e, i) : ((t, e, i) => {
      const r = e.hasOwnProperty(i);
      return e.constructor.createProperty(i, r ? {
        ...t,
        wrapped: !0
      } : t), r ? Object.getOwnPropertyDescriptor(e, i) : void 0;
    })(t, e, i);
  }
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  function vt(t) {
    return _t({
      ...t,
      state: !0,
      attribute: !1
    });
  }
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const wt = (t, e, i) => (i.configurable = !0, i.enumerable = !0, Reflect.decorate && "object" != typeof e && Object.defineProperty(t, e, i), i)
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */;
  function xt(t, e) {
    return (i, r, n) => {
      const s = e => e.renderRoot?.querySelector(t) ?? null;
      if (e) {
        const {
          get: t,
          set: e
        } = "object" == typeof r ? i : n ?? (() => {
          const t = Symbol();
          return {
            get() {
              return this[t];
            },
            set(e) {
              this[t] = e;
            }
          };
        })();
        return wt(i, r, {
          get() {
            let i = t.call(this);
            return void 0 === i && (i = s(this), (null !== i || this.hasUpdated) && e.call(this, i)), i;
          }
        });
      }
      return wt(i, r, {
        get() {
          return s(this);
        }
      });
    };
  }
  const $t = t => e => "function" == typeof e ? ((t, e) => (window.customElements.get(t) || window.customElements.define(t, e), e))(t, e) : ((t, e) => {
    const {
      kind: i,
      elements: r
    } = e;
    return {
      kind: i,
      elements: r,
      finisher(e) {
        window.customElements.get(t) || window.customElements.define(t, e);
      }
    };
  })(t, e);
  var Et, St, Ct, At, Pt, Tt;
  !function (t) {
    t.ETA = "ETA", t.Elapsed = "Elapsed", t.Remaining = "Remaining";
  }(Et || (Et = {})), function (t) {
    t.F = "F", t.C = "C";
  }(St || (St = {})), function (t) {
    t.Status = "Status", t.PrinterOnline = "Online", t.Availability = "Availability", t.ProjectName = "Project", t.CurrentLayer = "Layer";
  }(Ct || (Ct = {})), function (t) {
    t.HotendCurrent = "Hotend", t.BedCurrent = "Bed", t.HotendTarget = "T Hotend", t.BedTarget = "T Bed", t.DryingStatus = "Dry Status", t.DryingTime = "Dry Time", t.SpeedMode = "Speed Mode", t.FanSpeed = "Fan Speed";
  }(At || (At = {})), function (t) {
    t.DryingStatus = "Dry Status", t.DryingTime = "Dry Time";
  }(Pt || (Pt = {})), function (t) {
    t.OnTime = "On Time", t.OffTime = "Off Time", t.BottomTime = "Bottom Time", t.ModelHeight = "Model Height", t.BottomLayers = "Bottom Layers", t.ZUpHeight = "Z Up Height", t.ZUpSpeed = "Z Up Speed", t.ZDownSpeed = "Z Down Speed";
  }(Tt || (Tt = {}));
  const kt = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, Et), Ct), At), Pt), Tt);
  var Mt, Ht, Bt, Ft, It;
  !function (t) {
    t.Auto = "auto", t.Camera = "camera", t.Preview = "preview", t.Printer = "printer", t.PrinterModel = "printer_model", t.None = "none";
  }(Mt || (Mt = {})), function (t) {
    t.Auto = "auto", t.KobraS1 = "kobra_s1", t.KobraS1Combo = "kobra_s1_combo", t.Kobra3 = "kobra_3", t.Resin = "resin", t.FDM = "fdm";
  }(Ht || (Ht = {})), function (t) {
    t.Filament = "filament", t.Move = "move", t.Insights = "insights";
  }(Bt || (Bt = {})), function (t) {
    t.PLA = "PLA", t.PETG = "PETG", t.ABS = "ABS", t.PACF = "PACF", t.PC = "PC", t.ASA = "ASA", t.HIPS = "HIPS", t.PA = "PA", t.PLA_SE = "PLA_SE";
  }(Ft || (Ft = {})), function (t) {
    t.PAUSE = "pause", t.RESUME = "resume", t.CANCEL = "cancel";
  }(It || (It = {}));
  const Lt = 6048e5,
    Dt = 864e5,
    Ot = 6e4,
    Nt = 36e5,
    zt = Symbol.for("constructDateFrom");
  function Ut(t, e) {
    return "function" == typeof t ? t(e) : t && "object" == typeof t && zt in t ? t[zt](e) : t instanceof Date ? new t.constructor(e) : new Date(e);
  }
  function Rt(t, e) {
    return Ut(e || t, t);
  }
  function jt(t, e, i) {
    const {
        years: r = 0,
        months: n = 0,
        weeks: s = 0,
        days: o = 0,
        hours: a = 0,
        minutes: l = 0,
        seconds: c = 0
      } = e,
      h = Rt(t, i?.in),
      d = n || r ? function (t, e, i) {
        const r = Rt(t, i?.in);
        if (isNaN(e)) return Ut(i?.in || t, NaN);
        if (!e) return r;
        const n = r.getDate(),
          s = Ut(i?.in || t, r.getTime());
        return s.setMonth(r.getMonth() + e + 1, 0), n >= s.getDate() ? s : (r.setFullYear(s.getFullYear(), s.getMonth(), n), r);
      }(h, n + 12 * r) : h,
      u = o || s ? function (t, e, i) {
        const r = Rt(t, i?.in);
        return isNaN(e) ? Ut(i?.in || t, NaN) : e ? (r.setDate(r.getDate() + e), r) : r;
      }(d, o + 7 * s) : d,
      p = 1e3 * (c + 60 * (l + 60 * a));
    return Ut(i?.in || t, +u + p);
  }
  let Vt = {};
  function Gt() {
    return Vt;
  }
  function Zt(t, e) {
    const i = Gt(),
      r = e?.weekStartsOn ?? e?.locale?.options?.weekStartsOn ?? i.weekStartsOn ?? i.locale?.options?.weekStartsOn ?? 0,
      n = Rt(t, e?.in),
      s = n.getDay(),
      o = (s < r ? 7 : 0) + s - r;
    return n.setDate(n.getDate() - o), n.setHours(0, 0, 0, 0), n;
  }
  function Kt(t, e) {
    return Zt(t, {
      ...e,
      weekStartsOn: 1
    });
  }
  function Yt(t, e) {
    const i = Rt(t, e?.in),
      r = i.getFullYear(),
      n = Ut(i, 0);
    n.setFullYear(r + 1, 0, 4), n.setHours(0, 0, 0, 0);
    const s = Kt(n),
      o = Ut(i, 0);
    o.setFullYear(r, 0, 4), o.setHours(0, 0, 0, 0);
    const a = Kt(o);
    return i.getTime() >= s.getTime() ? r + 1 : i.getTime() >= a.getTime() ? r : r - 1;
  }
  function Wt(t) {
    const e = Rt(t),
      i = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds(), e.getMilliseconds()));
    return i.setUTCFullYear(e.getFullYear()), +t - +i;
  }
  function qt(t, ...e) {
    const i = Ut.bind(null, t || e.find(t => "object" == typeof t));
    return e.map(i);
  }
  function Xt(t, e) {
    const i = Rt(t, e?.in);
    return i.setHours(0, 0, 0, 0), i;
  }
  function Qt(t, e, i) {
    const [r, n] = qt(i?.in, t, e),
      s = Xt(r),
      o = Xt(n),
      a = +s - Wt(s),
      l = +o - Wt(o);
    return Math.round((a - l) / Dt);
  }
  function Jt(t, e) {
    const i = +Rt(t) - +Rt(e);
    return i < 0 ? -1 : i > 0 ? 1 : i;
  }
  function te(t) {
    return !(!((e = t) instanceof Date || "object" == typeof e && "[object Date]" === Object.prototype.toString.call(e)) && "number" != typeof t || isNaN(+Rt(t)));
    var e;
  }
  function ee(t, e) {
    const i = t.getFullYear() - e.getFullYear() || t.getMonth() - e.getMonth() || t.getDate() - e.getDate() || t.getHours() - e.getHours() || t.getMinutes() - e.getMinutes() || t.getSeconds() - e.getSeconds() || t.getMilliseconds() - e.getMilliseconds();
    return i < 0 ? -1 : i > 0 ? 1 : i;
  }
  function ie(t) {
    return e => {
      const i = (t ? Math[t] : Math.trunc)(e);
      return 0 === i ? 0 : i;
    };
  }
  function re(t, e) {
    return +Rt(t) - +Rt(e);
  }
  function ne(t, e) {
    const i = Rt(t, e?.in);
    return +function (t, e) {
      const i = Rt(t, e?.in);
      return i.setHours(23, 59, 59, 999), i;
    }(i, e) == +function (t, e) {
      const i = Rt(t, e?.in),
        r = i.getMonth();
      return i.setFullYear(i.getFullYear(), r + 1, 0), i.setHours(23, 59, 59, 999), i;
    }(i, e);
  }
  function se(t, e, i) {
    const [r, n, s] = qt(i?.in, t, t, e),
      o = Jt(n, s),
      a = Math.abs(function (t, e, i) {
        const [r, n] = qt(i?.in, t, e);
        return 12 * (r.getFullYear() - n.getFullYear()) + (r.getMonth() - n.getMonth());
      }(n, s));
    if (a < 1) return 0;
    1 === n.getMonth() && n.getDate() > 27 && n.setDate(30), n.setMonth(n.getMonth() - o * a);
    let l = Jt(n, s) === -o;
    ne(r) && 1 === a && 1 === Jt(r, s) && (l = !1);
    const c = o * (a - +l);
    return 0 === c ? 0 : c;
  }
  function oe(t, e, i) {
    const [r, n] = qt(i?.in, t, e),
      s = Jt(r, n),
      o = Math.abs(function (t, e, i) {
        const [r, n] = qt(i?.in, t, e);
        return r.getFullYear() - n.getFullYear();
      }(r, n));
    r.setFullYear(1584), n.setFullYear(1584);
    const a = s * (o - +(Jt(r, n) === -s));
    return 0 === a ? 0 : a;
  }
  const ae = {
    lessThanXSeconds: {
      one: "less than a second",
      other: "less than {{count}} seconds"
    },
    xSeconds: {
      one: "1 second",
      other: "{{count}} seconds"
    },
    halfAMinute: "half a minute",
    lessThanXMinutes: {
      one: "less than a minute",
      other: "less than {{count}} minutes"
    },
    xMinutes: {
      one: "1 minute",
      other: "{{count}} minutes"
    },
    aboutXHours: {
      one: "about 1 hour",
      other: "about {{count}} hours"
    },
    xHours: {
      one: "1 hour",
      other: "{{count}} hours"
    },
    xDays: {
      one: "1 day",
      other: "{{count}} days"
    },
    aboutXWeeks: {
      one: "about 1 week",
      other: "about {{count}} weeks"
    },
    xWeeks: {
      one: "1 week",
      other: "{{count}} weeks"
    },
    aboutXMonths: {
      one: "about 1 month",
      other: "about {{count}} months"
    },
    xMonths: {
      one: "1 month",
      other: "{{count}} months"
    },
    aboutXYears: {
      one: "about 1 year",
      other: "about {{count}} years"
    },
    xYears: {
      one: "1 year",
      other: "{{count}} years"
    },
    overXYears: {
      one: "over 1 year",
      other: "over {{count}} years"
    },
    almostXYears: {
      one: "almost 1 year",
      other: "almost {{count}} years"
    }
  };
  function le(t) {
    return (e = {}) => {
      const i = e.width ? String(e.width) : t.defaultWidth;
      return t.formats[i] || t.formats[t.defaultWidth];
    };
  }
  const ce = {
      date: le({
        formats: {
          full: "EEEE, MMMM do, y",
          long: "MMMM do, y",
          medium: "MMM d, y",
          short: "MM/dd/yyyy"
        },
        defaultWidth: "full"
      }),
      time: le({
        formats: {
          full: "h:mm:ss a zzzz",
          long: "h:mm:ss a z",
          medium: "h:mm:ss a",
          short: "h:mm a"
        },
        defaultWidth: "full"
      }),
      dateTime: le({
        formats: {
          full: "{{date}} 'at' {{time}}",
          long: "{{date}} 'at' {{time}}",
          medium: "{{date}}, {{time}}",
          short: "{{date}}, {{time}}"
        },
        defaultWidth: "full"
      })
    },
    he = {
      lastWeek: "'last' eeee 'at' p",
      yesterday: "'yesterday at' p",
      today: "'today at' p",
      tomorrow: "'tomorrow at' p",
      nextWeek: "eeee 'at' p",
      other: "P"
    };
  function de(t) {
    return (e, i) => {
      let r;
      if ("formatting" === (i?.context ? String(i.context) : "standalone") && t.formattingValues) {
        const e = t.defaultFormattingWidth || t.defaultWidth,
          n = i?.width ? String(i.width) : e;
        r = t.formattingValues[n] || t.formattingValues[e];
      } else {
        const e = t.defaultWidth,
          n = i?.width ? String(i.width) : t.defaultWidth;
        r = t.values[n] || t.values[e];
      }
      return r[t.argumentCallback ? t.argumentCallback(e) : e];
    };
  }
  function ue(t) {
    return (e, i = {}) => {
      const r = i.width,
        n = r && t.matchPatterns[r] || t.matchPatterns[t.defaultMatchWidth],
        s = e.match(n);
      if (!s) return null;
      const o = s[0],
        a = r && t.parsePatterns[r] || t.parsePatterns[t.defaultParseWidth],
        l = Array.isArray(a) ? function (t, e) {
          for (let i = 0; i < t.length; i++) if (e(t[i])) return i;
          return;
        }(a, t => t.test(o)) : function (t, e) {
          for (const i in t) if (Object.prototype.hasOwnProperty.call(t, i) && e(t[i])) return i;
          return;
        }(a, t => t.test(o));
      let c;
      c = t.valueCallback ? t.valueCallback(l) : l, c = i.valueCallback ? i.valueCallback(c) : c;
      return {
        value: c,
        rest: e.slice(o.length)
      };
    };
  }
  var pe;
  const ge = {
    code: "en-US",
    formatDistance: (t, e, i) => {
      let r;
      const n = ae[t];
      return r = "string" == typeof n ? n : 1 === e ? n.one : n.other.replace("{{count}}", e.toString()), i?.addSuffix ? i.comparison && i.comparison > 0 ? "in " + r : r + " ago" : r;
    },
    formatLong: ce,
    formatRelative: (t, e, i, r) => he[t],
    localize: {
      ordinalNumber: (t, e) => {
        const i = Number(t),
          r = i % 100;
        if (r > 20 || r < 10) switch (r % 10) {
          case 1:
            return i + "st";
          case 2:
            return i + "nd";
          case 3:
            return i + "rd";
        }
        return i + "th";
      },
      era: de({
        values: {
          narrow: ["B", "A"],
          abbreviated: ["BC", "AD"],
          wide: ["Before Christ", "Anno Domini"]
        },
        defaultWidth: "wide"
      }),
      quarter: de({
        values: {
          narrow: ["1", "2", "3", "4"],
          abbreviated: ["Q1", "Q2", "Q3", "Q4"],
          wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
        },
        defaultWidth: "wide",
        argumentCallback: t => t - 1
      }),
      month: de({
        values: {
          narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
          abbreviated: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          wide: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        defaultWidth: "wide"
      }),
      day: de({
        values: {
          narrow: ["S", "M", "T", "W", "T", "F", "S"],
          short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          wide: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        defaultWidth: "wide"
      }),
      dayPeriod: de({
        values: {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          }
        },
        defaultWidth: "wide",
        formattingValues: {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          }
        },
        defaultFormattingWidth: "wide"
      })
    },
    match: {
      ordinalNumber: (pe = {
        matchPattern: /^(\d+)(th|st|nd|rd)?/i,
        parsePattern: /\d+/i,
        valueCallback: t => parseInt(t, 10)
      }, (t, e = {}) => {
        const i = t.match(pe.matchPattern);
        if (!i) return null;
        const r = i[0],
          n = t.match(pe.parsePattern);
        if (!n) return null;
        let s = pe.valueCallback ? pe.valueCallback(n[0]) : n[0];
        return s = e.valueCallback ? e.valueCallback(s) : s, {
          value: s,
          rest: t.slice(r.length)
        };
      }),
      era: ue({
        matchPatterns: {
          narrow: /^(b|a)/i,
          abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
          wide: /^(before christ|before common era|anno domini|common era)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          any: [/^b/i, /^(a|c)/i]
        },
        defaultParseWidth: "any"
      }),
      quarter: ue({
        matchPatterns: {
          narrow: /^[1234]/i,
          abbreviated: /^q[1234]/i,
          wide: /^[1234](th|st|nd|rd)? quarter/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          any: [/1/i, /2/i, /3/i, /4/i]
        },
        defaultParseWidth: "any",
        valueCallback: t => t + 1
      }),
      month: ue({
        matchPatterns: {
          narrow: /^[jfmasond]/i,
          abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
          wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
          any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
        },
        defaultParseWidth: "any"
      }),
      day: ue({
        matchPatterns: {
          narrow: /^[smtwf]/i,
          short: /^(su|mo|tu|we|th|fr|sa)/i,
          abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
          wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
          any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
        },
        defaultParseWidth: "any"
      }),
      dayPeriod: ue({
        matchPatterns: {
          narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
          any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
        },
        defaultMatchWidth: "any",
        parsePatterns: {
          any: {
            am: /^a/i,
            pm: /^p/i,
            midnight: /^mi/i,
            noon: /^no/i,
            morning: /morning/i,
            afternoon: /afternoon/i,
            evening: /evening/i,
            night: /night/i
          }
        },
        defaultParseWidth: "any"
      })
    },
    options: {
      weekStartsOn: 0,
      firstWeekContainsDate: 1
    }
  };
  function me(t, e) {
    const i = Rt(t, e?.in),
      r = Qt(i, function (t, e) {
        const i = Rt(t, e?.in);
        return i.setFullYear(i.getFullYear(), 0, 1), i.setHours(0, 0, 0, 0), i;
      }(i));
    return r + 1;
  }
  function be(t, e) {
    const i = Rt(t, e?.in),
      r = +Kt(i) - +function (t, e) {
        const i = Yt(t, e),
          r = Ut(e?.in || t, 0);
        return r.setFullYear(i, 0, 4), r.setHours(0, 0, 0, 0), Kt(r);
      }(i);
    return Math.round(r / Lt) + 1;
  }
  function fe(t, e) {
    const i = Rt(t, e?.in),
      r = i.getFullYear(),
      n = Gt(),
      s = e?.firstWeekContainsDate ?? e?.locale?.options?.firstWeekContainsDate ?? n.firstWeekContainsDate ?? n.locale?.options?.firstWeekContainsDate ?? 1,
      o = Ut(e?.in || t, 0);
    o.setFullYear(r + 1, 0, s), o.setHours(0, 0, 0, 0);
    const a = Zt(o, e),
      l = Ut(e?.in || t, 0);
    l.setFullYear(r, 0, s), l.setHours(0, 0, 0, 0);
    const c = Zt(l, e);
    return +i >= +a ? r + 1 : +i >= +c ? r : r - 1;
  }
  function ye(t, e) {
    const i = Rt(t, e?.in),
      r = +Zt(i, e) - +function (t, e) {
        const i = Gt(),
          r = e?.firstWeekContainsDate ?? e?.locale?.options?.firstWeekContainsDate ?? i.firstWeekContainsDate ?? i.locale?.options?.firstWeekContainsDate ?? 1,
          n = fe(t, e),
          s = Ut(e?.in || t, 0);
        return s.setFullYear(n, 0, r), s.setHours(0, 0, 0, 0), Zt(s, e);
      }(i, e);
    return Math.round(r / Lt) + 1;
  }
  function _e(t, e) {
    return (t < 0 ? "-" : "") + Math.abs(t).toString().padStart(e, "0");
  }
  const ve = {
      y(t, e) {
        const i = t.getFullYear(),
          r = i > 0 ? i : 1 - i;
        return _e("yy" === e ? r % 100 : r, e.length);
      },
      M(t, e) {
        const i = t.getMonth();
        return "M" === e ? String(i + 1) : _e(i + 1, 2);
      },
      d: (t, e) => _e(t.getDate(), e.length),
      a(t, e) {
        const i = t.getHours() / 12 >= 1 ? "pm" : "am";
        switch (e) {
          case "a":
          case "aa":
            return i.toUpperCase();
          case "aaa":
            return i;
          case "aaaaa":
            return i[0];
          default:
            return "am" === i ? "a.m." : "p.m.";
        }
      },
      h: (t, e) => _e(t.getHours() % 12 || 12, e.length),
      H: (t, e) => _e(t.getHours(), e.length),
      m: (t, e) => _e(t.getMinutes(), e.length),
      s: (t, e) => _e(t.getSeconds(), e.length),
      S(t, e) {
        const i = e.length,
          r = t.getMilliseconds();
        return _e(Math.trunc(r * Math.pow(10, i - 3)), e.length);
      }
    },
    we = "midnight",
    xe = "noon",
    $e = "morning",
    Ee = "afternoon",
    Se = "evening",
    Ce = "night",
    Ae = {
      G: function (t, e, i) {
        const r = t.getFullYear() > 0 ? 1 : 0;
        switch (e) {
          case "G":
          case "GG":
          case "GGG":
            return i.era(r, {
              width: "abbreviated"
            });
          case "GGGGG":
            return i.era(r, {
              width: "narrow"
            });
          default:
            return i.era(r, {
              width: "wide"
            });
        }
      },
      y: function (t, e, i) {
        if ("yo" === e) {
          const e = t.getFullYear(),
            r = e > 0 ? e : 1 - e;
          return i.ordinalNumber(r, {
            unit: "year"
          });
        }
        return ve.y(t, e);
      },
      Y: function (t, e, i, r) {
        const n = fe(t, r),
          s = n > 0 ? n : 1 - n;
        if ("YY" === e) {
          return _e(s % 100, 2);
        }
        return "Yo" === e ? i.ordinalNumber(s, {
          unit: "year"
        }) : _e(s, e.length);
      },
      R: function (t, e) {
        return _e(Yt(t), e.length);
      },
      u: function (t, e) {
        return _e(t.getFullYear(), e.length);
      },
      Q: function (t, e, i) {
        const r = Math.ceil((t.getMonth() + 1) / 3);
        switch (e) {
          case "Q":
            return String(r);
          case "QQ":
            return _e(r, 2);
          case "Qo":
            return i.ordinalNumber(r, {
              unit: "quarter"
            });
          case "QQQ":
            return i.quarter(r, {
              width: "abbreviated",
              context: "formatting"
            });
          case "QQQQQ":
            return i.quarter(r, {
              width: "narrow",
              context: "formatting"
            });
          default:
            return i.quarter(r, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      q: function (t, e, i) {
        const r = Math.ceil((t.getMonth() + 1) / 3);
        switch (e) {
          case "q":
            return String(r);
          case "qq":
            return _e(r, 2);
          case "qo":
            return i.ordinalNumber(r, {
              unit: "quarter"
            });
          case "qqq":
            return i.quarter(r, {
              width: "abbreviated",
              context: "standalone"
            });
          case "qqqqq":
            return i.quarter(r, {
              width: "narrow",
              context: "standalone"
            });
          default:
            return i.quarter(r, {
              width: "wide",
              context: "standalone"
            });
        }
      },
      M: function (t, e, i) {
        const r = t.getMonth();
        switch (e) {
          case "M":
          case "MM":
            return ve.M(t, e);
          case "Mo":
            return i.ordinalNumber(r + 1, {
              unit: "month"
            });
          case "MMM":
            return i.month(r, {
              width: "abbreviated",
              context: "formatting"
            });
          case "MMMMM":
            return i.month(r, {
              width: "narrow",
              context: "formatting"
            });
          default:
            return i.month(r, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      L: function (t, e, i) {
        const r = t.getMonth();
        switch (e) {
          case "L":
            return String(r + 1);
          case "LL":
            return _e(r + 1, 2);
          case "Lo":
            return i.ordinalNumber(r + 1, {
              unit: "month"
            });
          case "LLL":
            return i.month(r, {
              width: "abbreviated",
              context: "standalone"
            });
          case "LLLLL":
            return i.month(r, {
              width: "narrow",
              context: "standalone"
            });
          default:
            return i.month(r, {
              width: "wide",
              context: "standalone"
            });
        }
      },
      w: function (t, e, i, r) {
        const n = ye(t, r);
        return "wo" === e ? i.ordinalNumber(n, {
          unit: "week"
        }) : _e(n, e.length);
      },
      I: function (t, e, i) {
        const r = be(t);
        return "Io" === e ? i.ordinalNumber(r, {
          unit: "week"
        }) : _e(r, e.length);
      },
      d: function (t, e, i) {
        return "do" === e ? i.ordinalNumber(t.getDate(), {
          unit: "date"
        }) : ve.d(t, e);
      },
      D: function (t, e, i) {
        const r = me(t);
        return "Do" === e ? i.ordinalNumber(r, {
          unit: "dayOfYear"
        }) : _e(r, e.length);
      },
      E: function (t, e, i) {
        const r = t.getDay();
        switch (e) {
          case "E":
          case "EE":
          case "EEE":
            return i.day(r, {
              width: "abbreviated",
              context: "formatting"
            });
          case "EEEEE":
            return i.day(r, {
              width: "narrow",
              context: "formatting"
            });
          case "EEEEEE":
            return i.day(r, {
              width: "short",
              context: "formatting"
            });
          default:
            return i.day(r, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      e: function (t, e, i, r) {
        const n = t.getDay(),
          s = (n - r.weekStartsOn + 8) % 7 || 7;
        switch (e) {
          case "e":
            return String(s);
          case "ee":
            return _e(s, 2);
          case "eo":
            return i.ordinalNumber(s, {
              unit: "day"
            });
          case "eee":
            return i.day(n, {
              width: "abbreviated",
              context: "formatting"
            });
          case "eeeee":
            return i.day(n, {
              width: "narrow",
              context: "formatting"
            });
          case "eeeeee":
            return i.day(n, {
              width: "short",
              context: "formatting"
            });
          default:
            return i.day(n, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      c: function (t, e, i, r) {
        const n = t.getDay(),
          s = (n - r.weekStartsOn + 8) % 7 || 7;
        switch (e) {
          case "c":
            return String(s);
          case "cc":
            return _e(s, e.length);
          case "co":
            return i.ordinalNumber(s, {
              unit: "day"
            });
          case "ccc":
            return i.day(n, {
              width: "abbreviated",
              context: "standalone"
            });
          case "ccccc":
            return i.day(n, {
              width: "narrow",
              context: "standalone"
            });
          case "cccccc":
            return i.day(n, {
              width: "short",
              context: "standalone"
            });
          default:
            return i.day(n, {
              width: "wide",
              context: "standalone"
            });
        }
      },
      i: function (t, e, i) {
        const r = t.getDay(),
          n = 0 === r ? 7 : r;
        switch (e) {
          case "i":
            return String(n);
          case "ii":
            return _e(n, e.length);
          case "io":
            return i.ordinalNumber(n, {
              unit: "day"
            });
          case "iii":
            return i.day(r, {
              width: "abbreviated",
              context: "formatting"
            });
          case "iiiii":
            return i.day(r, {
              width: "narrow",
              context: "formatting"
            });
          case "iiiiii":
            return i.day(r, {
              width: "short",
              context: "formatting"
            });
          default:
            return i.day(r, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      a: function (t, e, i) {
        const r = t.getHours() / 12 >= 1 ? "pm" : "am";
        switch (e) {
          case "a":
          case "aa":
            return i.dayPeriod(r, {
              width: "abbreviated",
              context: "formatting"
            });
          case "aaa":
            return i.dayPeriod(r, {
              width: "abbreviated",
              context: "formatting"
            }).toLowerCase();
          case "aaaaa":
            return i.dayPeriod(r, {
              width: "narrow",
              context: "formatting"
            });
          default:
            return i.dayPeriod(r, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      b: function (t, e, i) {
        const r = t.getHours();
        let n;
        switch (n = 12 === r ? xe : 0 === r ? we : r / 12 >= 1 ? "pm" : "am", e) {
          case "b":
          case "bb":
            return i.dayPeriod(n, {
              width: "abbreviated",
              context: "formatting"
            });
          case "bbb":
            return i.dayPeriod(n, {
              width: "abbreviated",
              context: "formatting"
            }).toLowerCase();
          case "bbbbb":
            return i.dayPeriod(n, {
              width: "narrow",
              context: "formatting"
            });
          default:
            return i.dayPeriod(n, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      B: function (t, e, i) {
        const r = t.getHours();
        let n;
        switch (n = r >= 17 ? Se : r >= 12 ? Ee : r >= 4 ? $e : Ce, e) {
          case "B":
          case "BB":
          case "BBB":
            return i.dayPeriod(n, {
              width: "abbreviated",
              context: "formatting"
            });
          case "BBBBB":
            return i.dayPeriod(n, {
              width: "narrow",
              context: "formatting"
            });
          default:
            return i.dayPeriod(n, {
              width: "wide",
              context: "formatting"
            });
        }
      },
      h: function (t, e, i) {
        if ("ho" === e) {
          let e = t.getHours() % 12;
          return 0 === e && (e = 12), i.ordinalNumber(e, {
            unit: "hour"
          });
        }
        return ve.h(t, e);
      },
      H: function (t, e, i) {
        return "Ho" === e ? i.ordinalNumber(t.getHours(), {
          unit: "hour"
        }) : ve.H(t, e);
      },
      K: function (t, e, i) {
        const r = t.getHours() % 12;
        return "Ko" === e ? i.ordinalNumber(r, {
          unit: "hour"
        }) : _e(r, e.length);
      },
      k: function (t, e, i) {
        let r = t.getHours();
        return 0 === r && (r = 24), "ko" === e ? i.ordinalNumber(r, {
          unit: "hour"
        }) : _e(r, e.length);
      },
      m: function (t, e, i) {
        return "mo" === e ? i.ordinalNumber(t.getMinutes(), {
          unit: "minute"
        }) : ve.m(t, e);
      },
      s: function (t, e, i) {
        return "so" === e ? i.ordinalNumber(t.getSeconds(), {
          unit: "second"
        }) : ve.s(t, e);
      },
      S: function (t, e) {
        return ve.S(t, e);
      },
      X: function (t, e, i) {
        const r = t.getTimezoneOffset();
        if (0 === r) return "Z";
        switch (e) {
          case "X":
            return Te(r);
          case "XXXX":
          case "XX":
            return ke(r);
          default:
            return ke(r, ":");
        }
      },
      x: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "x":
            return Te(r);
          case "xxxx":
          case "xx":
            return ke(r);
          default:
            return ke(r, ":");
        }
      },
      O: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "O":
          case "OO":
          case "OOO":
            return "GMT" + Pe(r, ":");
          default:
            return "GMT" + ke(r, ":");
        }
      },
      z: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "z":
          case "zz":
          case "zzz":
            return "GMT" + Pe(r, ":");
          default:
            return "GMT" + ke(r, ":");
        }
      },
      t: function (t, e, i) {
        return _e(Math.trunc(+t / 1e3), e.length);
      },
      T: function (t, e, i) {
        return _e(+t, e.length);
      }
    };
  function Pe(t, e = "") {
    const i = t > 0 ? "-" : "+",
      r = Math.abs(t),
      n = Math.trunc(r / 60),
      s = r % 60;
    return 0 === s ? i + String(n) : i + String(n) + e + _e(s, 2);
  }
  function Te(t, e) {
    if (t % 60 == 0) {
      return (t > 0 ? "-" : "+") + _e(Math.abs(t) / 60, 2);
    }
    return ke(t, e);
  }
  function ke(t, e = "") {
    const i = t > 0 ? "-" : "+",
      r = Math.abs(t);
    return i + _e(Math.trunc(r / 60), 2) + e + _e(r % 60, 2);
  }
  const Me = (t, e) => {
      switch (t) {
        case "P":
          return e.date({
            width: "short"
          });
        case "PP":
          return e.date({
            width: "medium"
          });
        case "PPP":
          return e.date({
            width: "long"
          });
        default:
          return e.date({
            width: "full"
          });
      }
    },
    He = (t, e) => {
      switch (t) {
        case "p":
          return e.time({
            width: "short"
          });
        case "pp":
          return e.time({
            width: "medium"
          });
        case "ppp":
          return e.time({
            width: "long"
          });
        default:
          return e.time({
            width: "full"
          });
      }
    },
    Be = {
      p: He,
      P: (t, e) => {
        const i = t.match(/(P+)(p+)?/) || [],
          r = i[1],
          n = i[2];
        if (!n) return Me(t, e);
        let s;
        switch (r) {
          case "P":
            s = e.dateTime({
              width: "short"
            });
            break;
          case "PP":
            s = e.dateTime({
              width: "medium"
            });
            break;
          case "PPP":
            s = e.dateTime({
              width: "long"
            });
            break;
          default:
            s = e.dateTime({
              width: "full"
            });
        }
        return s.replace("{{date}}", Me(r, e)).replace("{{time}}", He(n, e));
      }
    },
    Fe = /^D+$/,
    Ie = /^Y+$/,
    Le = ["D", "DD", "YY", "YYYY"];
  const De = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
    Oe = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
    Ne = /^'([^]*?)'?$/,
    ze = /''/g,
    Ue = /[a-zA-Z]/;
  function Re(t, e, i) {
    const r = Gt(),
      n = i?.locale ?? r.locale ?? ge,
      s = i?.firstWeekContainsDate ?? i?.locale?.options?.firstWeekContainsDate ?? r.firstWeekContainsDate ?? r.locale?.options?.firstWeekContainsDate ?? 1,
      o = i?.weekStartsOn ?? i?.locale?.options?.weekStartsOn ?? r.weekStartsOn ?? r.locale?.options?.weekStartsOn ?? 0,
      a = Rt(t, i?.in);
    if (!te(a)) throw new RangeError("Invalid time value");
    let l = e.match(Oe).map(t => {
      const e = t[0];
      if ("p" === e || "P" === e) {
        return (0, Be[e])(t, n.formatLong);
      }
      return t;
    }).join("").match(De).map(t => {
      if ("''" === t) return {
        isToken: !1,
        value: "'"
      };
      const e = t[0];
      if ("'" === e) return {
        isToken: !1,
        value: je(t)
      };
      if (Ae[e]) return {
        isToken: !0,
        value: t
      };
      if (e.match(Ue)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + e + "`");
      return {
        isToken: !1,
        value: t
      };
    });
    n.localize.preprocessor && (l = n.localize.preprocessor(a, l));
    const c = {
      firstWeekContainsDate: s,
      weekStartsOn: o,
      locale: n
    };
    return l.map(r => {
      if (!r.isToken) return r.value;
      const s = r.value;
      (!i?.useAdditionalWeekYearTokens && function (t) {
        return Ie.test(t);
      }(s) || !i?.useAdditionalDayOfYearTokens && function (t) {
        return Fe.test(t);
      }(s)) && function (t, e, i) {
        const r = function (t, e, i) {
          const r = "Y" === t[0] ? "years" : "days of the month";
          return `Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${r} to the input \`${i}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
        }(t, e, i);
        if (console.warn(r), Le.includes(t)) throw new RangeError(r);
      }(s, e, String(t));
      return (0, Ae[s[0]])(a, s, n.localize, c);
    }).join("");
  }
  function je(t) {
    const e = t.match(Ne);
    return e ? e[1].replace(ze, "'") : t;
  }
  function Ve(t, e) {
    const {
        start: i,
        end: r
      } = function (t, e) {
        const [i, r] = qt(t, e.start, e.end);
        return {
          start: i,
          end: r
        };
      }(e?.in, t),
      n = {},
      s = oe(r, i);
    s && (n.years = s);
    const o = jt(i, {
        years: n.years
      }),
      a = se(r, o);
    a && (n.months = a);
    const l = jt(o, {
        months: n.months
      }),
      c = function (t, e, i) {
        const [r, n] = qt(i?.in, t, e),
          s = ee(r, n),
          o = Math.abs(Qt(r, n));
        r.setDate(r.getDate() - s * o);
        const a = s * (o - Number(ee(r, n) === -s));
        return 0 === a ? 0 : a;
      }(r, l);
    c && (n.days = c);
    const h = jt(l, {
        days: n.days
      }),
      d = function (t, e, i) {
        const [r, n] = qt(i?.in, t, e),
          s = (+r - +n) / Nt;
        return ie(i?.roundingMethod)(s);
      }(r, h);
    d && (n.hours = d);
    const u = jt(h, {
        hours: n.hours
      }),
      p = function (t, e, i) {
        const r = re(t, e) / Ot;
        return ie(i?.roundingMethod)(r);
      }(r, u);
    p && (n.minutes = p);
    const g = function (t, e, i) {
      const r = re(t, e) / 1e3;
      return ie(i?.roundingMethod)(r);
    }(r, jt(u, {
      minutes: n.minutes
    }));
    return g && (n.seconds = g), n;
  }
  const Ge = "anycubic_cloud",
    Ze = ["light"],
    Ke = ["switch"],
    Ye = ["camera"],
    We = (t, e, i, r) => {
      const n = r || {},
        s = i ?? {},
        o = new Event(e, {
          bubbles: void 0 === n.bubbles || n.bubbles,
          cancelable: Boolean(n.cancelable),
          composed: void 0 === n.composed || n.composed
        });
      return o.detail = s, t.dispatchEvent(o), o;
    },
    qe = "—";
  function Xe(t) {
    return {
      state: t.state,
      attributes: t.attributes,
      entity_id: "invalid_domain.invalid_entity",
      last_changed: "",
      last_updated: "",
      context: {
        id: "",
        parent_id: null,
        user_id: null
      }
    };
  }
  function Qe(t) {
    return t.toLowerCase().split(" ").map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");
  }
  function Je(t, e) {
    return e ? t.states[e.entity_id] : void 0;
  }
  function ti(t, e, i, r) {
    const n = function (t, e) {
      const i = Je(t, e);
      return i ? String(i.state) : "";
    }(t, e);
    return "on" === n ? i : r;
  }
  function ei(t) {
    const e = new Set();
    for (const i in t.entities) {
      const r = t.entities[i];
      r.platform === Ge && r.device_id && e.add(r.device_id);
    }
    const i = {};
    for (const r in t.devices) {
      const n = t.devices[r];
      "Anycubic" === n.manufacturer && !n.via_device_id && e.has(n.id) && (i[n.id] = n);
    }
    return i;
  }
  function ii(t, e) {
    var i;
    return null === (i = function (t, e) {
      for (const i in t) if (t[i].translation_key === e) return t[i];
    }(t, e)) || void 0 === i ? void 0 : i.entity_id;
  }
  function ri(t, e, i) {
    const r = ii(e, i);
    return r ? t.states[r] : void 0;
  }
  function ni(t, e, i) {
    const r = ri(t, e, i);
    if (!r || "unavailable" === r.state || "unknown" === r.state) return;
    const n = parseFloat(r.state);
    return isNaN(n) ? void 0 : n;
  }
  function si(t, e) {
    const i = {};
    if (e) {
      const r = new Set([e]);
      for (const i in t.devices) t.devices[i].via_device_id === e && r.add(t.devices[i].id);
      for (const e in t.entities) {
        const n = t.entities[e];
        n.device_id && r.has(n.device_id) && (i[n.entity_id] = n);
      }
    }
    return i;
  }
  function oi(t, e, i) {
    return e + "." + String(t) + i;
  }
  function ai(t, e, i, r) {
    if (e) return function (t, e, i, r) {
      let n;
      for (const s in t) {
        const o = t[s],
          a = s.split(".");
        if (a[0] === e) {
          if (o.translation_key === i) return o;
          if (!n) {
            const t = a[1];
            (r ? t.split(r)[1] === i : t.endsWith(i)) && (n = o);
          }
        }
      }
      return n;
    }(t, i, r, e);
  }
  function li(t) {
    for (const e in t) {
      const t = e.split("."),
        i = t[0],
        r = t[1];
      if ("binary_sensor" === i && r.endsWith("printer_online")) return r.split("printer_online")[0];
    }
  }
  function ci(t, e, i, r) {
    return function (t, e, i, r, n = "unavailable", s = {}) {
      return Je(t, ai(e, i, "button", r)) || Xe({
        state: String(n),
        attributes: s
      });
    }(t, e, i, r, "unavailable", {
      duration: 0,
      temperature: 0
    });
  }
  function hi(t) {
    return !["unavailable"].includes(t.state);
  }
  function di(t, e, i, r) {
    const n = Je(t, ai(e, i, "image", r));
    return n ? function (t) {
      const e = t.attributes.access_token;
      return `${window.location.origin}/api/image_proxy/${t.entity_id}?token=${e}`;
    }(n) : void 0;
  }
  function ui(t, e, i, r, n = "unavailable", s = {}) {
    return Je(t, ai(e, i, "sensor", r)) || Xe({
      state: String(n),
      attributes: s
    });
  }
  function pi(t, e, i, r, n, s, o = void 0) {
    const a = ai(e, i, "binary_sensor", r);
    return a ? ti(t, a, n, s) : o;
  }
  function gi(t) {
    return ["printing", "preheating", "paused", "downloading", "checking"].includes(t);
  }
  function mi(t) {
    return e = 1e3 * t, Ve({
      start: new Date(0),
      end: new Date(e)
    });
    var e;
  }
  const bi = (t, e) => {
      if (0 !== t && (!t || isNaN(t))) return qe;
      const i = mi(e ? 60 * Math.ceil(Number(t) / 60) : Number(t)),
        r = [];
      return i.days && r.push(`${i.days}d`), i.hours && r.length < 2 && r.push(`${i.hours}h`), i.minutes && r.length < 2 && !i.days && r.push(`${i.minutes}m`), i.seconds && r.length < 2 && !i.days && !i.hours && !e && r.push(`${i.seconds}s`), r.length ? r.join(" ") : e ? "0m" : "0s";
    },
    fi = (t, e, i = !1, r = !1) => {
      switch (e) {
        case Et.Remaining:
          return bi(t, i);
        case Et.ETA:
          return ((t, e, i) => {
            if (0 !== t && (!t || isNaN(t))) return qe;
            const r = e ? "" : ":ss",
              n = i ? `HH:mm${r}` : `h:mm${r} a`,
              s = new Date();
            return s.setSeconds(s.getSeconds() + Number(t)), Re(s, n);
          })(t, i, r);
        case Et.Elapsed:
          return bi(t, i);
        default:
          return qe;
      }
    };
  const yi = {
      [St.C]: {
        [St.C]: t => t,
        [St.F]: t => 9 * t / 5 + 32
      },
      [St.F]: {
        [St.C]: t => 5 * (t - 32) / 9,
        [St.F]: t => t
      }
    },
    _i = (t, e, i = !1) => {
      const r = parseFloat(t.state);
      if (isNaN(r)) return qe;
      const n = (t => {
          switch (t.attributes.unit_of_measurement) {
            case "°C":
            default:
              return St.C;
            case "°F":
              return St.F;
          }
        })(t),
        s = (o = r, l = e || n, yi[a = n] && yi[a][l] ? yi[a][l](o) : -1);
      var o, a, l;
      return `${i ? Math.round(s) : s.toFixed(2)}°${e || n}`;
    };
  function vi() {
    return [kt.Status, kt.ETA, kt.Elapsed, kt.Remaining];
  }
  function wi() {
    return {
      vertical: !1,
      round: !0,
      use_24hr: !0,
      temperatureUnit: St.C,
      monitoredStats: vi(),
      scaleFactor: 1,
      slotColors: [],
      showSettingsButton: !1,
      alwaysShow: !1,
      mediaView: Mt.Auto,
      printerArt: Ht.Auto,
      showMoveButtons: !1,
      showControls: !0,
      sections: [Bt.Filament]
    };
  }
  function xi(t, e) {
    return void 0 === t ? e : t;
  }
  function $i(t) {
    var e;
    return (null !== (e = t.attributes.available_modes) && void 0 !== e ? e : []).reduce((t, e) => Object.assign(Object.assign({}, t), {
      [e.mode]: e.description
    }), {});
  }
  function Ei(t) {
    return t && Object.values(Ft).includes(t) ? Ft[t.toUpperCase()] : void 0;
  }
  var Si = "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    Ci = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
    Ai = "M7,10L12,15L17,10H7Z",
    Pi = "M7,15L12,10L17,15H7Z";
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const Ti = 1,
    ki = 2,
    Mi = t => (...e) => ({
      _$litDirective$: t,
      values: e
    });
  class Hi {
    constructor(t) {}
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t, e, i) {
      this._$Ct = t, this._$AM = e, this._$Ci = i;
    }
    _$AS(t, e) {
      return this.update(t, e);
    }
    update(t, e) {
      return this.render(...e);
    }
  }
  /**
       * @license
       * Copyright 2018 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const Bi = Mi(class extends Hi {
      constructor(t) {
        if (super(t), t.type !== Ti || "class" !== t.name || t.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
      }
      render(t) {
        return " " + Object.keys(t).filter(e => t[e]).join(" ") + " ";
      }
      update(t, [e]) {
        if (void 0 === this.st) {
          this.st = new Set(), void 0 !== t.strings && (this.nt = new Set(t.strings.join(" ").split(/\s/).filter(t => "" !== t)));
          for (const t in e) e[t] && !this.nt?.has(t) && this.st.add(t);
          return this.render(e);
        }
        const i = t.element.classList;
        for (const t of this.st) t in e || (i.remove(t), this.st.delete(t));
        for (const t in e) {
          const r = !!e[t];
          r === this.st.has(t) || this.nt?.has(t) || (r ? (i.add(t), this.st.add(t)) : (i.remove(t), this.st.delete(t)));
        }
        return Q;
      }
    }),
    Fi = "important",
    Ii = " !" + Fi,
    Li = Mi(class extends Hi {
      constructor(t) {
        if (super(t), t.type !== Ti || "style" !== t.name || t.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
      }
      render(t) {
        return Object.keys(t).reduce((e, i) => {
          const r = t[i];
          return null == r ? e : e + `${i = i.includes("-") ? i : i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
        }, "");
      }
      update(t, [e]) {
        const {
          style: i
        } = t.element;
        if (void 0 === this.ft) return this.ft = new Set(Object.keys(e)), this.render(e);
        for (const t of this.ft) null == e[t] && (this.ft.delete(t), t.includes("-") ? i.removeProperty(t) : i[t] = null);
        for (const t in e) {
          const r = e[t];
          if (null != r) {
            this.ft.add(t);
            const e = "string" == typeof r && r.endsWith(Ii);
            t.includes("-") || e ? i.setProperty(t, e ? r.slice(0, -11) : r, e ? Fi : "") : i[t] = r;
          }
        }
        return Q;
      }
    });
  /**
       * @license
       * Copyright 2018 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  var Di,
    Oi,
    Ni,
    zi = "Anycubic Cloud",
    Ui = {
      actions: {
        cancel: "Abbrechen",
        pause: "Pausieren",
        print: "Drucken",
        resume: "Fortsetzen",
        yes: "Ja",
        no: "Nein",
        save: "Speichern"
      },
      messages: {
        mqtt_unsupported: "Diese Funktion benötigt MQTT zum Abrufen der Daten, mit der eingestellten Authentifizierungsmethode wird MQTT leider nicht unterstützt."
      }
    },
    Ri = {
      buttons: {
        print_settings: "Druckeinstellungen",
        dry: "Trocknen",
        runout_refill: "Nachfüllen"
      },
      configure: {
        tabs: {
          main: "Allgemein",
          stats: "Statistik",
          colours: "ACE-Farbvoreinstellungen"
        },
        labels: {
          printer_id: "Drucker auswählen",
          vertical: "Vertikales Layout?",
          round: "Werte runden?",
          use_24hr: "24-Stunden-Format verwenden?",
          show_settings_button: "Schaltfläche für Druckeinstellungen immer anzeigen?",
          always_show: "Karte immer anzeigen?",
          temperature_unit: "Temperatureinheit",
          light_entity_id: "Licht-Entität",
          power_entity_id: "Strom-Entität",
          camera_entity_id: "Kamera-Entität",
          scale_factor: "Skalierungsfaktor",
          slot_colors: "Farbvoreinstellungen der Fächer",
          media_view: "Hauptansicht",
          printer_art: "Druckergrafik",
          show_controls: "Steuerungsschaltflächen anzeigen",
          show_move_buttons: "Bewegungsschaltflächen anzeigen",
          sections: "Ausklappbare Bereiche"
        },
        options: {
          printer_art: {
            auto: "Automatisch (erkennen)",
            kobra_s1: "Kobra S1",
            kobra_s1_combo: "Kobra S1 Combo",
            kobra_3: "Kobra 3 / Kobra 2",
            resin: "Photon / Harz",
            fdm: "FDM (allgemein)"
          },
          media_view: {
            auto: "Automatisch",
            camera: "Kamera",
            preview: "Druckvorschau",
            printer: "Druckergrafik",
            printer_model: "Druckergrafik + Modell",
            none: "Ausgeblendet"
          },
          sections: {
            filament: "Filament",
            insights: "Einblicke"
          }
        }
      },
      print_settings: {
        confirm_message: "{action}: Sind Sie sicher?",
        label_nozzle_temp: "Düsentemperatur",
        label_hotbed_temp: "Betttemperatur",
        label_fan_speed: "Lüftergeschwindigkeit",
        label_aux_fan_speed: "Zusatzlüfter",
        label_box_fan_speed: "ACE-Boxlüfter",
        print_pause: "Druck pausieren",
        print_resume: "Druck fortsetzen",
        print_cancel: "Druck abbrechen",
        save_speed_mode: "Geschwindigkeitsmodus speichern",
        save_target_nozzle: "Solltemperatur Düse speichern",
        save_target_hotbed: "Solltemperatur Bett speichern",
        save_fan_speed: "Lüftergeschwindigkeit speichern",
        save_aux_fan_speed: "Zusatzlüfter speichern",
        save_box_fan_speed: "ACE-Boxlüfter speichern"
      },
      drying_settings: {
        heading: "Trocknungsoptionen",
        button_preset: "Voreinstellung",
        button_stop_drying: "Trocknen stoppen",
        button_minutes: "Min."
      },
      spool_settings: {
        heading: "Fach bearbeiten",
        label_select_material: "Material auswählen",
        label_select_colour: "Farbe manuell auswählen"
      },
      monitored_stats: {
        ETA: "Voraussichtliches Ende",
        Elapsed: "Verstrichene Zeit",
        Remaining: "Restzeit",
        Status: "Status",
        Online: "Online",
        Availability: "Verfügbarkeit",
        Project: "Druckauftrag",
        Layer: "Schicht",
        Hotend: "Düse",
        Bed: "Bett",
        "T Hotend": "Soll Düse",
        "T Bed": "Soll Bett",
        "Dry Status": "Trocknungsstatus",
        "Dry Time": "Trocknungszeit",
        "Speed Mode": "Geschwindigkeitsmodus",
        "Fan Speed": "Lüftergeschwindigkeit",
        "On Time": "Belichtungszeit",
        "Off Time": "Pausenzeit",
        "Bottom Time": "Belichtungszeit Basisschichten",
        "Model Height": "Modellhöhe",
        "Bottom Layers": "Basisschichten",
        "Z Up Height": "Z-Hubhöhe",
        "Z Up Speed": "Z-Hubgeschwindigkeit",
        "Z Down Speed": "Z-Senkgeschwindigkeit"
      },
      media_view: {
        tabs: {
          camera: "Kamera",
          preview: "Vorschau",
          printer: "Drucker",
          printer_model: "Drucker + Modell"
        }
      }
    },
    ji = {
      initial: {
        printer_select: "Bitte wählen Sie einen Drucker."
      },
      main: {
        title: "Übersicht",
        cards: {
          main: {
            description: "Allgemeine Informationen zum Drucker.",
            fields: {
              printer_name: "Name",
              printer_id: "ID",
              printer_mac: "MAC",
              printer_model: "Modell",
              printer_fw_version: "Firmware-Version",
              printer_fw_update_available: "Firmware-Status",
              printer_online: "Online",
              printer_available: "Verfügbar",
              curr_nozzle_temp: "Aktuelle Düsentemperatur",
              curr_hotbed_temp: "Aktuelle Betttemperatur",
              target_nozzle_temp: "Solltemperatur Düse",
              target_hotbed_temp: "Solltemperatur Bett",
              job_state: "Druckstatus",
              job_progress: "Druckfortschritt",
              ace_fw_version: "ACE-Firmware-Version",
              ace_fw_update_available: "ACE-Firmware-Status",
              drying_active: "ACE-Trocknungsstatus",
              drying_progress: "ACE-Trocknungsfortschritt"
            }
          }
        },
        groups: {
          machine: "Gerät",
          ace: "ACE",
          diagnostics: "Kennungen"
        },
        presets: {
          title: "Auf dem eigenen Dashboard nachbauen",
          lede: "Jede davon ist dieselbe Karte wie oben, nur anders eingestellt – in der Breite gezeigt, die eine Dashboard-Spalte ihr gibt. Vorschauen öffnen nie die Kamera; hier steht die Druckergrafik dafür. Kopieren und in eine manuelle Karte einfügen.",
          full: "Vollständig",
          compact: "Kompakte Kachel",
          copy: "Kopieren",
          copied: "Kopiert",
          model: "Drucker + Modell",
          vertical: "Vertikal"
        }
      },
      files_cloud: {
        title: "Cloud-Dateien",
        cards: {}
      },
      files_local: {
        title: "Lokale Dateien",
        cards: {}
      },
      files_udisk: {
        title: "USB-Dateien",
        cards: {}
      },
      print_save_in_cloud: {
        title: "Drucken (in Ihrer Cloud speichern)",
        cards: {}
      },
      print_no_cloud_save: {
        title: "Drucken (ohne Cloud-Speicherung)",
        cards: {}
      },
      debug: {
        title: "Debug",
        cards: {}
      }
    },
    Vi = {
      title: zi,
      common: Ui,
      card: Ri,
      panels: ji
    },
    Gi = Object.freeze({
      __proto__: null,
      title: zi,
      common: Ui,
      card: Ri,
      panels: ji,
      default: Vi
    }),
    Zi = "Anycubic Cloud",
    Ki = {
      actions: {
        cancel: "Cancel",
        pause: "Pause",
        print: "Print",
        resume: "Resume",
        yes: "Yes",
        no: "No",
        save: "Save"
      },
      messages: {
        mqtt_unsupported: "This feature requires MQTT to retrieve data but unfortunately MQTT is not supported with the configured authentication mode."
      }
    },
    Yi = {
      buttons: {
        print_settings: "Print Settings",
        dry: "Dry",
        runout_refill: "Refill"
      },
      configure: {
        tabs: {
          main: "Main",
          stats: "Stats",
          colours: "ACE Colour Presets"
        },
        labels: {
          printer_id: "Select Printer",
          vertical: "Vertical Layout?",
          round: "Round Stats?",
          use_24hr: "Use 24hr Time?",
          show_settings_button: "Always show print settings button?",
          always_show: "Always show card?",
          temperature_unit: "Temperature Unit",
          light_entity_id: "Light Entity",
          power_entity_id: "Power Entity",
          camera_entity_id: "Camera Entity",
          scale_factor: "Scale Factor",
          slot_colors: "Slot Colour Presets",
          media_view: "Main view",
          printer_art: "Printer artwork",
          show_controls: "Show control buttons",
          show_move_buttons: "Show move buttons",
          sections: "Expandable sections"
        },
        options: {
          printer_art: {
            auto: "Automatic (detect)",
            kobra_s1: "Kobra S1",
            kobra_s1_combo: "Kobra S1 Combo",
            kobra_3: "Kobra 3 / Kobra 2",
            resin: "Photon / resin",
            fdm: "Generic FDM"
          },
          media_view: {
            auto: "Automatic",
            camera: "Camera",
            preview: "Job preview",
            printer: "Printer graphic",
            printer_model: "Printer graphic + model",
            none: "Hidden"
          },
          sections: {
            filament: "Filament",
            insights: "Insights"
          }
        }
      },
      print_settings: {
        confirm_message: "Are you sure you want to {action} the print?",
        label_nozzle_temp: "Nozzle Temperature",
        label_hotbed_temp: "Hotbed Temperature",
        label_fan_speed: "Fan Speed",
        label_aux_fan_speed: "AUX Fan Speed",
        label_box_fan_speed: "Box Fan Speed",
        print_pause: "Pause Print",
        print_resume: "Resume Print",
        print_cancel: "Cancel Print",
        save_speed_mode: "Save Speed Mode",
        save_target_nozzle: "Save Target Nozzle",
        save_target_hotbed: "Save Target Hotbed",
        save_fan_speed: "Save Fan Speed",
        save_aux_fan_speed: "Save AUX Fan Speed",
        save_box_fan_speed: "Save Box Fan Speed"
      },
      drying_settings: {
        heading: "Drying Options",
        button_preset: "Preset",
        button_stop_drying: "Stop Drying",
        button_minutes: "Mins"
      },
      spool_settings: {
        heading: "Editing Slot",
        label_select_material: "Select Material",
        label_select_colour: "Manually select colour"
      },
      monitored_stats: {
        ETA: "ETA",
        Elapsed: "Elapsed",
        Remaining: "Remaining",
        Status: "Status",
        Online: "Online",
        Availability: "Availability",
        Project: "Project",
        Layer: "Layer",
        Hotend: "Hotend",
        Bed: "Bed",
        "T Hotend": "T Hotend",
        "T Bed": "T Bed",
        "Dry Status": "Dry Status",
        "Dry Time": "Dry Time",
        "Speed Mode": "Speed Mode",
        "Fan Speed": "Fan Speed",
        "On Time": "On Time",
        "Off Time": "Off Time",
        "Bottom Time": "Bottom Time",
        "Model Height": "Model Height",
        "Bottom Layers": "Bottom Layers",
        "Z Up Height": "Z Up Height",
        "Z Up Speed": "Z Up Speed",
        "Z Down Speed": "Z Down Speed"
      },
      media_view: {
        tabs: {
          camera: "Camera",
          preview: "Preview",
          printer: "Printer",
          printer_model: "Printer + model"
        }
      }
    },
    Wi = {
      initial: {
        printer_select: "Select a printer."
      },
      main: {
        title: "Main",
        cards: {
          main: {
            description: "General information about the printer.",
            fields: {
              printer_name: "Name",
              printer_id: "ID",
              printer_mac: "MAC",
              printer_model: "Model",
              printer_fw_version: "FW Version",
              printer_fw_update_available: "FW Status",
              printer_online: "Online",
              printer_available: "Available",
              curr_nozzle_temp: "Current Nozzle Temperature",
              curr_hotbed_temp: "Current Hotbed Temperature",
              target_nozzle_temp: "Target Nozzle Temperature",
              target_hotbed_temp: "Target Hotbed Temperature",
              job_state: "Job State",
              job_progress: "Job Progress",
              ace_fw_version: "ACE FW Version",
              ace_fw_update_available: "ACE FW Status",
              drying_active: "ACE Drying Status",
              drying_progress: "ACE Drying Progress"
            }
          }
        },
        groups: {
          machine: "Machine",
          ace: "ACE",
          diagnostics: "Identifiers"
        },
        presets: {
          title: "Build this on your own dashboard",
          lede: "Each of these is the same card as above, set up differently — shown at the width a dashboard column gives it. Previews never open the camera, so the printer graphic stands in for it here. Copy one and paste it into a Manual card.",
          full: "Full",
          compact: "Compact tile",
          copy: "Copy",
          copied: "Copied",
          model: "Printer + model",
          vertical: "Vertical"
        }
      },
      files_cloud: {
        title: "Cloud Files",
        cards: {}
      },
      files_local: {
        title: "Local Files",
        cards: {}
      },
      files_udisk: {
        title: "USB Files",
        cards: {}
      },
      print_save_in_cloud: {
        title: "Print (Save in user cloud)",
        cards: {}
      },
      print_no_cloud_save: {
        title: "Print (No Cloud Save)",
        cards: {}
      },
      debug: {
        title: "Debug",
        cards: {}
      }
    },
    qi = {
      title: Zi,
      common: Ki,
      card: Yi,
      panels: Wi
    },
    Xi = Object.freeze({
      __proto__: null,
      title: Zi,
      common: Ki,
      card: Yi,
      panels: Wi,
      default: qi
    }),
    Qi = "Anycubic Cloud",
    Ji = {
      actions: {
        cancel: "Annuler",
        pause: "Pause",
        print: "Imprimer",
        resume: "Reprendre",
        yes: "Oui",
        no: "Non",
        save: "Enregistrer"
      },
      messages: {
        mqtt_unsupported: "Cette fonctionnalité nécessite MQTT pour récupérer les données, mais MQTT n'est malheureusement pas pris en charge par le mode d'authentification configuré."
      }
    },
    tr = {
      buttons: {
        print_settings: "Paramètres d'impression",
        dry: "Sécher",
        runout_refill: "Recharger"
      },
      configure: {
        tabs: {
          main: "Général",
          stats: "Statistiques",
          colours: "Préréglages de couleurs ACE"
        },
        labels: {
          printer_id: "Sélectionner l'imprimante",
          vertical: "Disposition verticale ?",
          round: "Arrondir les valeurs ?",
          use_24hr: "Format 24 h ?",
          show_settings_button: "Toujours afficher le bouton des paramètres d'impression ?",
          always_show: "Toujours afficher la carte ?",
          temperature_unit: "Unité de température",
          light_entity_id: "Entité lumière",
          power_entity_id: "Entité alimentation",
          camera_entity_id: "Entité caméra",
          scale_factor: "Facteur d'échelle",
          slot_colors: "Préréglages de couleurs des emplacements",
          media_view: "Vue principale",
          printer_art: "Illustration de l'imprimante",
          show_controls: "Afficher les boutons de contrôle",
          show_move_buttons: "Afficher les boutons de déplacement",
          sections: "Sections dépliables"
        },
        options: {
          printer_art: {
            auto: "Automatique (détection)",
            kobra_s1: "Kobra S1",
            kobra_s1_combo: "Kobra S1 Combo",
            kobra_3: "Kobra 3 / Kobra 2",
            resin: "Photon / résine",
            fdm: "FDM générique"
          },
          media_view: {
            auto: "Automatique",
            camera: "Caméra",
            preview: "Aperçu du travail",
            printer: "Illustration de l'imprimante",
            printer_model: "Illustration + modèle",
            none: "Masqué"
          },
          sections: {
            filament: "Filament",
            insights: "Aperçus"
          }
        }
      },
      print_settings: {
        confirm_message: "{action} : êtes-vous sûr ?",
        label_nozzle_temp: "Température de la buse",
        label_hotbed_temp: "Température du plateau",
        label_fan_speed: "Vitesse du ventilateur",
        label_aux_fan_speed: "Ventilateur AUX",
        label_box_fan_speed: "Ventilateur boîtier ACE",
        print_pause: "Mettre l'impression en pause",
        print_resume: "Reprendre l'impression",
        print_cancel: "Annuler l'impression",
        save_speed_mode: "Enregistrer le mode de vitesse",
        save_target_nozzle: "Enregistrer la consigne buse",
        save_target_hotbed: "Enregistrer la consigne plateau",
        save_fan_speed: "Enregistrer le ventilateur",
        save_aux_fan_speed: "Enregistrer le ventilateur AUX",
        save_box_fan_speed: "Enregistrer le ventilateur boîtier"
      },
      drying_settings: {
        heading: "Options de séchage",
        button_preset: "Préréglage",
        button_stop_drying: "Arrêter le séchage",
        button_minutes: "min"
      },
      spool_settings: {
        heading: "Modifier l'emplacement",
        label_select_material: "Sélectionner le matériau",
        label_select_colour: "Choisir la couleur manuellement"
      },
      monitored_stats: {
        ETA: "Fin prévue",
        Elapsed: "Écoulé",
        Remaining: "Restant",
        Status: "État",
        Online: "En ligne",
        Availability: "Disponibilité",
        Project: "Tâche",
        Layer: "Couche",
        Hotend: "Buse",
        Bed: "Plateau",
        "T Hotend": "Buse cible",
        "T Bed": "Plateau cible",
        "Dry Status": "État du séchage",
        "Dry Time": "Durée de séchage",
        "Speed Mode": "Mode de vitesse",
        "Fan Speed": "Vitesse ventilateur",
        "On Time": "Temps d'exposition",
        "Off Time": "Temps de pause",
        "Bottom Time": "Exposition des couches de base",
        "Model Height": "Hauteur du modèle",
        "Bottom Layers": "Couches de base",
        "Z Up Height": "Hauteur de levée Z",
        "Z Up Speed": "Vitesse de montée Z",
        "Z Down Speed": "Vitesse de descente Z"
      },
      media_view: {
        tabs: {
          camera: "Caméra",
          preview: "Aperçu",
          printer: "Imprimante",
          printer_model: "Imprimante + modèle"
        }
      }
    },
    er = {
      initial: {
        printer_select: "Sélectionnez une imprimante."
      },
      main: {
        title: "Aperçu",
        cards: {
          main: {
            description: "Informations générales sur l'imprimante.",
            fields: {
              printer_name: "Nom",
              printer_id: "ID",
              printer_mac: "MAC",
              printer_model: "Modèle",
              printer_fw_version: "Version du firmware",
              printer_fw_update_available: "État du firmware",
              printer_online: "En ligne",
              printer_available: "Disponible",
              curr_nozzle_temp: "Température actuelle de la buse",
              curr_hotbed_temp: "Température actuelle du plateau",
              target_nozzle_temp: "Température cible de la buse",
              target_hotbed_temp: "Température cible du plateau",
              job_state: "État de la tâche",
              job_progress: "Progression de la tâche",
              ace_fw_version: "Version du firmware ACE",
              ace_fw_update_available: "État du firmware ACE",
              drying_active: "État du séchage ACE",
              drying_progress: "Progression du séchage ACE"
            }
          }
        },
        groups: {
          machine: "Machine",
          ace: "ACE",
          diagnostics: "Identifiants"
        },
        presets: {
          title: "Reproduire ceci sur votre tableau de bord",
          lede: "Chacune est la même carte que ci-dessus, réglée autrement, à la largeur qu'une colonne de tableau de bord lui donne. Les aperçus n'ouvrent jamais la caméra : l'illustration de l'imprimante la remplace ici. Copiez-en une et collez-la dans une carte manuelle.",
          full: "Complète",
          compact: "Tuile compacte",
          copy: "Copier",
          copied: "Copié",
          model: "Imprimante + modèle",
          vertical: "Verticale"
        }
      },
      files_cloud: {
        title: "Fichiers cloud",
        cards: {}
      },
      files_local: {
        title: "Fichiers locaux",
        cards: {}
      },
      files_udisk: {
        title: "Fichiers USB",
        cards: {}
      },
      print_save_in_cloud: {
        title: "Imprimer (enregistrer dans votre cloud)",
        cards: {}
      },
      print_no_cloud_save: {
        title: "Imprimer (sans enregistrement cloud)",
        cards: {}
      },
      debug: {
        title: "Débogage",
        cards: {}
      }
    },
    ir = {
      title: Qi,
      common: Ji,
      card: tr,
      panels: er
    },
    rr = Object.freeze({
      __proto__: null,
      title: Qi,
      common: Ji,
      card: tr,
      panels: er,
      default: ir
    }),
    nr = "Anycubic Cloud",
    sr = {
      actions: {
        cancel: "Annuleren",
        pause: "Pauzeren",
        print: "Printen",
        resume: "Hervatten",
        yes: "Ja",
        no: "Nee",
        save: "Opslaan"
      },
      messages: {
        mqtt_unsupported: "Deze functie heeft MQTT nodig om gegevens op te halen, maar MQTT wordt helaas niet ondersteund door de ingestelde authenticatiemethode."
      }
    },
    or = {
      buttons: {
        print_settings: "Printinstellingen",
        dry: "Drogen",
        runout_refill: "Bijvullen"
      },
      configure: {
        tabs: {
          main: "Algemeen",
          stats: "Statistieken",
          colours: "ACE-kleurvoorinstellingen"
        },
        labels: {
          printer_id: "Printer selecteren",
          vertical: "Verticale indeling?",
          round: "Waarden afronden?",
          use_24hr: "24-uursnotatie gebruiken?",
          show_settings_button: "Knop printinstellingen altijd tonen?",
          always_show: "Kaart altijd tonen?",
          temperature_unit: "Temperatuureenheid",
          light_entity_id: "Licht-entiteit",
          power_entity_id: "Stroom-entiteit",
          camera_entity_id: "Camera-entiteit",
          scale_factor: "Schaalfactor",
          slot_colors: "Kleurvoorinstellingen per slot",
          media_view: "Hoofdweergave",
          printer_art: "Printerafbeelding",
          show_controls: "Bedieningsknoppen tonen",
          show_move_buttons: "Verplaatsknoppen tonen",
          sections: "Uitklapbare secties"
        },
        options: {
          printer_art: {
            auto: "Automatisch (detecteren)",
            kobra_s1: "Kobra S1",
            kobra_s1_combo: "Kobra S1 Combo",
            kobra_3: "Kobra 3 / Kobra 2",
            resin: "Photon / hars",
            fdm: "Algemene FDM"
          },
          media_view: {
            auto: "Automatisch",
            camera: "Camera",
            preview: "Afdrukvoorbeeld",
            printer: "Printerafbeelding",
            printer_model: "Printerafbeelding + model",
            none: "Verborgen"
          },
          sections: {
            filament: "Filament",
            insights: "Inzichten"
          }
        }
      },
      print_settings: {
        confirm_message: "{action}: weet u het zeker?",
        label_nozzle_temp: "Nozzletemperatuur",
        label_hotbed_temp: "Bedtemperatuur",
        label_fan_speed: "Ventilatorsnelheid",
        label_aux_fan_speed: "Hulpventilator",
        label_box_fan_speed: "ACE-boxventilator",
        print_pause: "Print pauzeren",
        print_resume: "Print hervatten",
        print_cancel: "Print annuleren",
        save_speed_mode: "Snelheidsmodus opslaan",
        save_target_nozzle: "Doeltemperatuur nozzle opslaan",
        save_target_hotbed: "Doeltemperatuur bed opslaan",
        save_fan_speed: "Ventilatorsnelheid opslaan",
        save_aux_fan_speed: "Hulpventilator opslaan",
        save_box_fan_speed: "ACE-boxventilator opslaan"
      },
      drying_settings: {
        heading: "Droogopties",
        button_preset: "Voorinstelling",
        button_stop_drying: "Drogen stoppen",
        button_minutes: "min"
      },
      spool_settings: {
        heading: "Slot bewerken",
        label_select_material: "Materiaal selecteren",
        label_select_colour: "Kleur handmatig selecteren"
      },
      monitored_stats: {
        ETA: "Verwacht einde",
        Elapsed: "Verstreken",
        Remaining: "Resterend",
        Status: "Status",
        Online: "Online",
        Availability: "Beschikbaarheid",
        Project: "Printtaak",
        Layer: "Laag",
        Hotend: "Nozzle",
        Bed: "Bed",
        "T Hotend": "Doel nozzle",
        "T Bed": "Doel bed",
        "Dry Status": "Droogstatus",
        "Dry Time": "Droogtijd",
        "Speed Mode": "Snelheidsmodus",
        "Fan Speed": "Ventilatorsnelheid",
        "On Time": "Belichtingstijd",
        "Off Time": "Wachttijd",
        "Bottom Time": "Belichting bodemlagen",
        "Model Height": "Modelhoogte",
        "Bottom Layers": "Bodemlagen",
        "Z Up Height": "Z-hefhoogte",
        "Z Up Speed": "Z-hefsnelheid",
        "Z Down Speed": "Z-daalsnelheid"
      },
      media_view: {
        tabs: {
          camera: "Camera",
          preview: "Voorbeeld",
          printer: "Printer",
          printer_model: "Printer + model"
        }
      }
    },
    ar = {
      initial: {
        printer_select: "Selecteer een printer."
      },
      main: {
        title: "Overzicht",
        cards: {
          main: {
            description: "Algemene informatie over de printer.",
            fields: {
              printer_name: "Naam",
              printer_id: "ID",
              printer_mac: "MAC",
              printer_model: "Model",
              printer_fw_version: "Firmwareversie",
              printer_fw_update_available: "Firmwarestatus",
              printer_online: "Online",
              printer_available: "Beschikbaar",
              curr_nozzle_temp: "Huidige nozzletemperatuur",
              curr_hotbed_temp: "Huidige bedtemperatuur",
              target_nozzle_temp: "Doeltemperatuur nozzle",
              target_hotbed_temp: "Doeltemperatuur bed",
              job_state: "Taakstatus",
              job_progress: "Taakvoortgang",
              ace_fw_version: "ACE-firmwareversie",
              ace_fw_update_available: "ACE-firmwarestatus",
              drying_active: "ACE-droogstatus",
              drying_progress: "ACE-droogvoortgang"
            }
          }
        },
        groups: {
          machine: "Machine",
          ace: "ACE",
          diagnostics: "Identificatie"
        },
        presets: {
          title: "Bouw dit op je eigen dashboard",
          lede: "Elk hiervan is dezelfde kaart als hierboven, anders ingesteld, op de breedte die een dashboardkolom geeft. Voorbeelden openen nooit de camera; de printerafbeelding staat hier in de plaats. Kopieer er een en plak die in een handmatige kaart.",
          full: "Volledig",
          compact: "Compacte tegel",
          copy: "Kopiëren",
          copied: "Gekopieerd",
          model: "Printer + model",
          vertical: "Verticaal"
        }
      },
      files_cloud: {
        title: "Cloudbestanden",
        cards: {}
      },
      files_local: {
        title: "Lokale bestanden",
        cards: {}
      },
      files_udisk: {
        title: "USB-bestanden",
        cards: {}
      },
      print_save_in_cloud: {
        title: "Printen (opslaan in uw cloud)",
        cards: {}
      },
      print_no_cloud_save: {
        title: "Printen (niet in cloud opslaan)",
        cards: {}
      },
      debug: {
        title: "Debug",
        cards: {}
      }
    },
    lr = {
      title: nr,
      common: sr,
      card: or,
      panels: ar
    },
    cr = Object.freeze({
      __proto__: null,
      title: nr,
      common: sr,
      card: or,
      panels: ar,
      default: lr
    }),
    hr = "Anycubic Cloud",
    dr = {
      actions: {
        cancel: "取消",
        pause: "暂停",
        print: "打印",
        resume: "恢复",
        yes: "是",
        no: "否",
        save: "保存"
      },
      messages: {
        mqtt_unsupported: "此功能需要通过 MQTT 获取数据，但当前配置的认证方式不支持 MQTT。"
      }
    },
    ur = {
      buttons: {
        print_settings: "打印设置",
        dry: "烘干",
        runout_refill: "续料"
      },
      configure: {
        tabs: {
          main: "常规",
          stats: "统计",
          colours: "ACE 颜色预设"
        },
        labels: {
          printer_id: "选择打印机",
          vertical: "垂直布局？",
          round: "统计数据取整？",
          use_24hr: "使用 24 小时制？",
          show_settings_button: "始终显示打印设置按钮？",
          always_show: "始终显示卡片？",
          temperature_unit: "温度单位",
          light_entity_id: "灯光实体",
          power_entity_id: "电源实体",
          camera_entity_id: "摄像头实体",
          scale_factor: "缩放比例",
          slot_colors: "槽位颜色预设",
          media_view: "主视图",
          printer_art: "打印机图形",
          show_controls: "显示控制按钮",
          show_move_buttons: "显示移动按钮",
          sections: "可展开区块"
        },
        options: {
          printer_art: {
            auto: "自动（检测）",
            kobra_s1: "Kobra S1",
            kobra_s1_combo: "Kobra S1 Combo",
            kobra_3: "Kobra 3 / Kobra 2",
            resin: "Photon（树脂）",
            fdm: "通用 FDM"
          },
          media_view: {
            auto: "自动",
            camera: "摄像头",
            preview: "打印预览",
            printer: "打印机图形",
            printer_model: "打印机图形 + 模型",
            none: "隐藏"
          },
          sections: {
            filament: "耗材",
            insights: "洞察"
          }
        }
      },
      print_settings: {
        confirm_message: "确定要{action}当前打印吗？",
        label_nozzle_temp: "喷嘴温度",
        label_hotbed_temp: "热床温度",
        label_fan_speed: "风扇转速",
        label_aux_fan_speed: "辅助风扇转速",
        label_box_fan_speed: "料盒风扇转速",
        print_pause: "暂停打印",
        print_resume: "恢复打印",
        print_cancel: "取消打印",
        save_speed_mode: "保存速度模式",
        save_target_nozzle: "保存目标喷嘴",
        save_target_hotbed: "保存目标热床",
        save_fan_speed: "保存风扇转速",
        save_aux_fan_speed: "保存辅助风扇转速",
        save_box_fan_speed: "保存料盒风扇转速"
      },
      drying_settings: {
        heading: "烘干选项",
        button_preset: "预设",
        button_stop_drying: "停止烘干",
        button_minutes: "分钟"
      },
      spool_settings: {
        heading: "编辑槽位",
        label_select_material: "选择材料",
        label_select_colour: "手动选择颜色"
      },
      monitored_stats: {
        ETA: "预计完成",
        Elapsed: "已用时间",
        Remaining: "剩余时间",
        Status: "状态",
        Online: "在线",
        Availability: "可用性",
        Project: "打印任务",
        Layer: "层数",
        Hotend: "喷嘴",
        Bed: "热床",
        "T Hotend": "目标喷嘴",
        "T Bed": "目标热床",
        "Dry Status": "烘干状态",
        "Dry Time": "烘干时间",
        "Speed Mode": "速度模式",
        "Fan Speed": "风扇转速",
        "On Time": "曝光时间",
        "Off Time": "关光时间",
        "Bottom Time": "底层曝光",
        "Model Height": "模型高度",
        "Bottom Layers": "底层层数",
        "Z Up Height": "Z 抬升高度",
        "Z Up Speed": "Z 抬升速度",
        "Z Down Speed": "Z 下降速度"
      },
      media_view: {
        tabs: {
          camera: "摄像头",
          preview: "预览",
          printer: "打印机",
          printer_model: "打印机 + 模型"
        }
      }
    },
    pr = {
      initial: {
        printer_select: "请选择打印机。"
      },
      main: {
        title: "概览",
        cards: {
          main: {
            description: "打印机的基本信息。",
            fields: {
              printer_name: "名称",
              printer_id: "ID",
              printer_mac: "MAC",
              printer_model: "型号",
              printer_fw_version: "固件版本",
              printer_fw_update_available: "固件状态",
              printer_online: "在线",
              printer_available: "可用",
              curr_nozzle_temp: "当前喷嘴温度",
              curr_hotbed_temp: "当前热床温度",
              target_nozzle_temp: "目标喷嘴温度",
              target_hotbed_temp: "目标热床温度",
              job_state: "任务状态",
              job_progress: "任务进度",
              ace_fw_version: "ACE 固件版本",
              ace_fw_update_available: "ACE 固件状态",
              drying_active: "ACE 烘干状态",
              drying_progress: "ACE 烘干进度"
            }
          }
        },
        groups: {
          machine: "设备",
          ace: "ACE",
          diagnostics: "标识信息"
        },
        presets: {
          title: "在你自己的仪表板上搭建",
          lede: "下面每一张都是上方的同一张卡片，只是设置不同，并按仪表板栏位的宽度显示。预览不会打开摄像头，此处以打印机图形代替。复制一段并粘贴到手动卡片中。",
          full: "完整",
          compact: "紧凑磁贴",
          copy: "复制",
          copied: "已复制",
          model: "打印机 + 模型",
          vertical: "竖向"
        }
      },
      files_cloud: {
        title: "云端文件",
        cards: {}
      },
      files_local: {
        title: "本地文件",
        cards: {}
      },
      files_udisk: {
        title: "U 盘文件",
        cards: {}
      },
      print_save_in_cloud: {
        title: "打印（保存到用户云端）",
        cards: {}
      },
      print_no_cloud_save: {
        title: "打印（不保存到云端）",
        cards: {}
      },
      debug: {
        title: "调试",
        cards: {}
      }
    },
    gr = {
      title: hr,
      common: dr,
      card: ur,
      panels: pr
    },
    mr = Object.freeze({
      __proto__: null,
      title: hr,
      common: dr,
      card: ur,
      panels: pr,
      default: gr
    });
  function br(t) {
    return t.type === Oi.literal;
  }
  function fr(t) {
    return t.type === Oi.argument;
  }
  function yr(t) {
    return t.type === Oi.number;
  }
  function _r(t) {
    return t.type === Oi.date;
  }
  function vr(t) {
    return t.type === Oi.time;
  }
  function wr(t) {
    return t.type === Oi.select;
  }
  function xr(t) {
    return t.type === Oi.plural;
  }
  function $r(t) {
    return t.type === Oi.pound;
  }
  function Er(t) {
    return t.type === Oi.tag;
  }
  function Sr(t) {
    return !(!t || "object" != typeof t || t.type !== Ni.number);
  }
  function Cr(t) {
    return !(!t || "object" != typeof t || t.type !== Ni.dateTime);
  }
  !function (t) {
    t[t.EXPECT_ARGUMENT_CLOSING_BRACE = 1] = "EXPECT_ARGUMENT_CLOSING_BRACE", t[t.EMPTY_ARGUMENT = 2] = "EMPTY_ARGUMENT", t[t.MALFORMED_ARGUMENT = 3] = "MALFORMED_ARGUMENT", t[t.EXPECT_ARGUMENT_TYPE = 4] = "EXPECT_ARGUMENT_TYPE", t[t.INVALID_ARGUMENT_TYPE = 5] = "INVALID_ARGUMENT_TYPE", t[t.EXPECT_ARGUMENT_STYLE = 6] = "EXPECT_ARGUMENT_STYLE", t[t.INVALID_NUMBER_SKELETON = 7] = "INVALID_NUMBER_SKELETON", t[t.INVALID_DATE_TIME_SKELETON = 8] = "INVALID_DATE_TIME_SKELETON", t[t.EXPECT_NUMBER_SKELETON = 9] = "EXPECT_NUMBER_SKELETON", t[t.EXPECT_DATE_TIME_SKELETON = 10] = "EXPECT_DATE_TIME_SKELETON", t[t.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE = 11] = "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE", t[t.EXPECT_SELECT_ARGUMENT_OPTIONS = 12] = "EXPECT_SELECT_ARGUMENT_OPTIONS", t[t.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE = 13] = "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE", t[t.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE = 14] = "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE", t[t.EXPECT_SELECT_ARGUMENT_SELECTOR = 15] = "EXPECT_SELECT_ARGUMENT_SELECTOR", t[t.EXPECT_PLURAL_ARGUMENT_SELECTOR = 16] = "EXPECT_PLURAL_ARGUMENT_SELECTOR", t[t.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT = 17] = "EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT", t[t.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT = 18] = "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT", t[t.INVALID_PLURAL_ARGUMENT_SELECTOR = 19] = "INVALID_PLURAL_ARGUMENT_SELECTOR", t[t.DUPLICATE_PLURAL_ARGUMENT_SELECTOR = 20] = "DUPLICATE_PLURAL_ARGUMENT_SELECTOR", t[t.DUPLICATE_SELECT_ARGUMENT_SELECTOR = 21] = "DUPLICATE_SELECT_ARGUMENT_SELECTOR", t[t.MISSING_OTHER_CLAUSE = 22] = "MISSING_OTHER_CLAUSE", t[t.INVALID_TAG = 23] = "INVALID_TAG", t[t.INVALID_TAG_NAME = 25] = "INVALID_TAG_NAME", t[t.UNMATCHED_CLOSING_TAG = 26] = "UNMATCHED_CLOSING_TAG", t[t.UNCLOSED_TAG = 27] = "UNCLOSED_TAG";
  }(Di || (Di = {})), function (t) {
    t[t.literal = 0] = "literal", t[t.argument = 1] = "argument", t[t.number = 2] = "number", t[t.date = 3] = "date", t[t.time = 4] = "time", t[t.select = 5] = "select", t[t.plural = 6] = "plural", t[t.pound = 7] = "pound", t[t.tag = 8] = "tag";
  }(Oi || (Oi = {})), function (t) {
    t[t.number = 0] = "number", t[t.dateTime = 1] = "dateTime";
  }(Ni || (Ni = {}));
  var Ar = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
    Pr = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
  function Tr(t) {
    var e = {};
    return t.replace(Pr, function (t) {
      var i = t.length;
      switch (t[0]) {
        case "G":
          e.era = 4 === i ? "long" : 5 === i ? "narrow" : "short";
          break;
        case "y":
          e.year = 2 === i ? "2-digit" : "numeric";
          break;
        case "Y":
        case "u":
        case "U":
        case "r":
          throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");
        case "q":
        case "Q":
          throw new RangeError("`q/Q` (quarter) patterns are not supported");
        case "M":
        case "L":
          e.month = ["numeric", "2-digit", "short", "long", "narrow"][i - 1];
          break;
        case "w":
        case "W":
          throw new RangeError("`w/W` (week) patterns are not supported");
        case "d":
          e.day = ["numeric", "2-digit"][i - 1];
          break;
        case "D":
        case "F":
        case "g":
          throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");
        case "E":
          e.weekday = 4 === i ? "long" : 5 === i ? "narrow" : "short";
          break;
        case "e":
          if (i < 4) throw new RangeError("`e..eee` (weekday) patterns are not supported");
          e.weekday = ["short", "long", "narrow", "short"][i - 4];
          break;
        case "c":
          if (i < 4) throw new RangeError("`c..ccc` (weekday) patterns are not supported");
          e.weekday = ["short", "long", "narrow", "short"][i - 4];
          break;
        case "a":
          e.hour12 = !0;
          break;
        case "b":
        case "B":
          throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");
        case "h":
          e.hourCycle = "h12", e.hour = ["numeric", "2-digit"][i - 1];
          break;
        case "H":
          e.hourCycle = "h23", e.hour = ["numeric", "2-digit"][i - 1];
          break;
        case "K":
          e.hourCycle = "h11", e.hour = ["numeric", "2-digit"][i - 1];
          break;
        case "k":
          e.hourCycle = "h24", e.hour = ["numeric", "2-digit"][i - 1];
          break;
        case "j":
        case "J":
        case "C":
          throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");
        case "m":
          e.minute = ["numeric", "2-digit"][i - 1];
          break;
        case "s":
          e.second = ["numeric", "2-digit"][i - 1];
          break;
        case "S":
        case "A":
          throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");
        case "z":
          e.timeZoneName = i < 4 ? "short" : "long";
          break;
        case "Z":
        case "O":
        case "v":
        case "V":
        case "X":
        case "x":
          throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead");
      }
      return "";
    }), e;
  }
  var kr = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;
  var Mr = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,
    Hr = /^(@+)?(\+|#+)?[rs]?$/g,
    Br = /(\*)(0+)|(#+)(0+)|(0+)/g,
    Fr = /^(0+)$/;
  function Ir(t) {
    var e = {};
    return "r" === t[t.length - 1] ? e.roundingPriority = "morePrecision" : "s" === t[t.length - 1] && (e.roundingPriority = "lessPrecision"), t.replace(Hr, function (t, i, r) {
      return "string" != typeof r ? (e.minimumSignificantDigits = i.length, e.maximumSignificantDigits = i.length) : "+" === r ? e.minimumSignificantDigits = i.length : "#" === i[0] ? e.maximumSignificantDigits = i.length : (e.minimumSignificantDigits = i.length, e.maximumSignificantDigits = i.length + ("string" == typeof r ? r.length : 0)), "";
    }), e;
  }
  function Lr(t) {
    switch (t) {
      case "sign-auto":
        return {
          signDisplay: "auto"
        };
      case "sign-accounting":
      case "()":
        return {
          currencySign: "accounting"
        };
      case "sign-always":
      case "+!":
        return {
          signDisplay: "always"
        };
      case "sign-accounting-always":
      case "()!":
        return {
          signDisplay: "always",
          currencySign: "accounting"
        };
      case "sign-except-zero":
      case "+?":
        return {
          signDisplay: "exceptZero"
        };
      case "sign-accounting-except-zero":
      case "()?":
        return {
          signDisplay: "exceptZero",
          currencySign: "accounting"
        };
      case "sign-never":
      case "+_":
        return {
          signDisplay: "never"
        };
    }
  }
  function Dr(t) {
    var e;
    if ("E" === t[0] && "E" === t[1] ? (e = {
      notation: "engineering"
    }, t = t.slice(2)) : "E" === t[0] && (e = {
      notation: "scientific"
    }, t = t.slice(1)), e) {
      var i = t.slice(0, 2);
      if ("+!" === i ? (e.signDisplay = "always", t = t.slice(2)) : "+?" === i && (e.signDisplay = "exceptZero", t = t.slice(2)), !Fr.test(t)) throw new Error("Malformed concise eng/scientific notation");
      e.minimumIntegerDigits = t.length;
    }
    return e;
  }
  function Or(t) {
    var e = Lr(t);
    return e || {};
  }
  function Nr(t) {
    for (var e = {}, i = 0, n = t; i < n.length; i++) {
      var s = n[i];
      switch (s.stem) {
        case "percent":
        case "%":
          e.style = "percent";
          continue;
        case "%x100":
          e.style = "percent", e.scale = 100;
          continue;
        case "currency":
          e.style = "currency", e.currency = s.options[0];
          continue;
        case "group-off":
        case ",_":
          e.useGrouping = !1;
          continue;
        case "precision-integer":
        case ".":
          e.maximumFractionDigits = 0;
          continue;
        case "measure-unit":
        case "unit":
          e.style = "unit", e.unit = s.options[0].replace(/^(.*?)-/, "");
          continue;
        case "compact-short":
        case "K":
          e.notation = "compact", e.compactDisplay = "short";
          continue;
        case "compact-long":
        case "KK":
          e.notation = "compact", e.compactDisplay = "long";
          continue;
        case "scientific":
          e = r(r(r({}, e), {
            notation: "scientific"
          }), s.options.reduce(function (t, e) {
            return r(r({}, t), Or(e));
          }, {}));
          continue;
        case "engineering":
          e = r(r(r({}, e), {
            notation: "engineering"
          }), s.options.reduce(function (t, e) {
            return r(r({}, t), Or(e));
          }, {}));
          continue;
        case "notation-simple":
          e.notation = "standard";
          continue;
        case "unit-width-narrow":
          e.currencyDisplay = "narrowSymbol", e.unitDisplay = "narrow";
          continue;
        case "unit-width-short":
          e.currencyDisplay = "code", e.unitDisplay = "short";
          continue;
        case "unit-width-full-name":
          e.currencyDisplay = "name", e.unitDisplay = "long";
          continue;
        case "unit-width-iso-code":
          e.currencyDisplay = "symbol";
          continue;
        case "scale":
          e.scale = parseFloat(s.options[0]);
          continue;
        case "rounding-mode-floor":
          e.roundingMode = "floor";
          continue;
        case "rounding-mode-ceiling":
          e.roundingMode = "ceil";
          continue;
        case "rounding-mode-down":
          e.roundingMode = "trunc";
          continue;
        case "rounding-mode-up":
          e.roundingMode = "expand";
          continue;
        case "rounding-mode-half-even":
          e.roundingMode = "halfEven";
          continue;
        case "rounding-mode-half-down":
          e.roundingMode = "halfTrunc";
          continue;
        case "rounding-mode-half-up":
          e.roundingMode = "halfExpand";
          continue;
        case "integer-width":
          if (s.options.length > 1) throw new RangeError("integer-width stems only accept a single optional option");
          s.options[0].replace(Br, function (t, i, r, n, s, o) {
            if (i) e.minimumIntegerDigits = r.length;else {
              if (n && s) throw new Error("We currently do not support maximum integer digits");
              if (o) throw new Error("We currently do not support exact integer digits");
            }
            return "";
          });
          continue;
      }
      if (Fr.test(s.stem)) e.minimumIntegerDigits = s.stem.length;else if (Mr.test(s.stem)) {
        if (s.options.length > 1) throw new RangeError("Fraction-precision stems only accept a single optional option");
        s.stem.replace(Mr, function (t, i, r, n, s, o) {
          return "*" === r ? e.minimumFractionDigits = i.length : n && "#" === n[0] ? e.maximumFractionDigits = n.length : s && o ? (e.minimumFractionDigits = s.length, e.maximumFractionDigits = s.length + o.length) : (e.minimumFractionDigits = i.length, e.maximumFractionDigits = i.length), "";
        });
        var o = s.options[0];
        "w" === o ? e = r(r({}, e), {
          trailingZeroDisplay: "stripIfInteger"
        }) : o && (e = r(r({}, e), Ir(o)));
      } else if (Hr.test(s.stem)) e = r(r({}, e), Ir(s.stem));else {
        var a = Lr(s.stem);
        a && (e = r(r({}, e), a));
        var l = Dr(s.stem);
        l && (e = r(r({}, e), l));
      }
    }
    return e;
  }
  var zr,
    Ur = {
      "001": ["H", "h"],
      AC: ["H", "h", "hb", "hB"],
      AD: ["H", "hB"],
      AE: ["h", "hB", "hb", "H"],
      AF: ["H", "hb", "hB", "h"],
      AG: ["h", "hb", "H", "hB"],
      AI: ["H", "h", "hb", "hB"],
      AL: ["h", "H", "hB"],
      AM: ["H", "hB"],
      AO: ["H", "hB"],
      AR: ["H", "h", "hB", "hb"],
      AS: ["h", "H"],
      AT: ["H", "hB"],
      AU: ["h", "hb", "H", "hB"],
      AW: ["H", "hB"],
      AX: ["H"],
      AZ: ["H", "hB", "h"],
      BA: ["H", "hB", "h"],
      BB: ["h", "hb", "H", "hB"],
      BD: ["h", "hB", "H"],
      BE: ["H", "hB"],
      BF: ["H", "hB"],
      BG: ["H", "hB", "h"],
      BH: ["h", "hB", "hb", "H"],
      BI: ["H", "h"],
      BJ: ["H", "hB"],
      BL: ["H", "hB"],
      BM: ["h", "hb", "H", "hB"],
      BN: ["hb", "hB", "h", "H"],
      BO: ["H", "hB", "h", "hb"],
      BQ: ["H"],
      BR: ["H", "hB"],
      BS: ["h", "hb", "H", "hB"],
      BT: ["h", "H"],
      BW: ["H", "h", "hb", "hB"],
      BY: ["H", "h"],
      BZ: ["H", "h", "hb", "hB"],
      CA: ["h", "hb", "H", "hB"],
      CC: ["H", "h", "hb", "hB"],
      CD: ["hB", "H"],
      CF: ["H", "h", "hB"],
      CG: ["H", "hB"],
      CH: ["H", "hB", "h"],
      CI: ["H", "hB"],
      CK: ["H", "h", "hb", "hB"],
      CL: ["H", "h", "hB", "hb"],
      CM: ["H", "h", "hB"],
      CN: ["H", "hB", "hb", "h"],
      CO: ["h", "H", "hB", "hb"],
      CP: ["H"],
      CR: ["H", "h", "hB", "hb"],
      CU: ["H", "h", "hB", "hb"],
      CV: ["H", "hB"],
      CW: ["H", "hB"],
      CX: ["H", "h", "hb", "hB"],
      CY: ["h", "H", "hb", "hB"],
      CZ: ["H"],
      DE: ["H", "hB"],
      DG: ["H", "h", "hb", "hB"],
      DJ: ["h", "H"],
      DK: ["H"],
      DM: ["h", "hb", "H", "hB"],
      DO: ["h", "H", "hB", "hb"],
      DZ: ["h", "hB", "hb", "H"],
      EA: ["H", "h", "hB", "hb"],
      EC: ["H", "hB", "h", "hb"],
      EE: ["H", "hB"],
      EG: ["h", "hB", "hb", "H"],
      EH: ["h", "hB", "hb", "H"],
      ER: ["h", "H"],
      ES: ["H", "hB", "h", "hb"],
      ET: ["hB", "hb", "h", "H"],
      FI: ["H"],
      FJ: ["h", "hb", "H", "hB"],
      FK: ["H", "h", "hb", "hB"],
      FM: ["h", "hb", "H", "hB"],
      FO: ["H", "h"],
      FR: ["H", "hB"],
      GA: ["H", "hB"],
      GB: ["H", "h", "hb", "hB"],
      GD: ["h", "hb", "H", "hB"],
      GE: ["H", "hB", "h"],
      GF: ["H", "hB"],
      GG: ["H", "h", "hb", "hB"],
      GH: ["h", "H"],
      GI: ["H", "h", "hb", "hB"],
      GL: ["H", "h"],
      GM: ["h", "hb", "H", "hB"],
      GN: ["H", "hB"],
      GP: ["H", "hB"],
      GQ: ["H", "hB", "h", "hb"],
      GR: ["h", "H", "hb", "hB"],
      GT: ["H", "h", "hB", "hb"],
      GU: ["h", "hb", "H", "hB"],
      GW: ["H", "hB"],
      GY: ["h", "hb", "H", "hB"],
      HK: ["h", "hB", "hb", "H"],
      HN: ["H", "h", "hB", "hb"],
      HR: ["H", "hB"],
      HU: ["H", "h"],
      IC: ["H", "h", "hB", "hb"],
      ID: ["H"],
      IE: ["H", "h", "hb", "hB"],
      IL: ["H", "hB"],
      IM: ["H", "h", "hb", "hB"],
      IN: ["h", "H"],
      IO: ["H", "h", "hb", "hB"],
      IQ: ["h", "hB", "hb", "H"],
      IR: ["hB", "H"],
      IS: ["H"],
      IT: ["H", "hB"],
      JE: ["H", "h", "hb", "hB"],
      JM: ["h", "hb", "H", "hB"],
      JO: ["h", "hB", "hb", "H"],
      JP: ["H", "K", "h"],
      KE: ["hB", "hb", "H", "h"],
      KG: ["H", "h", "hB", "hb"],
      KH: ["hB", "h", "H", "hb"],
      KI: ["h", "hb", "H", "hB"],
      KM: ["H", "h", "hB", "hb"],
      KN: ["h", "hb", "H", "hB"],
      KP: ["h", "H", "hB", "hb"],
      KR: ["h", "H", "hB", "hb"],
      KW: ["h", "hB", "hb", "H"],
      KY: ["h", "hb", "H", "hB"],
      KZ: ["H", "hB"],
      LA: ["H", "hb", "hB", "h"],
      LB: ["h", "hB", "hb", "H"],
      LC: ["h", "hb", "H", "hB"],
      LI: ["H", "hB", "h"],
      LK: ["H", "h", "hB", "hb"],
      LR: ["h", "hb", "H", "hB"],
      LS: ["h", "H"],
      LT: ["H", "h", "hb", "hB"],
      LU: ["H", "h", "hB"],
      LV: ["H", "hB", "hb", "h"],
      LY: ["h", "hB", "hb", "H"],
      MA: ["H", "h", "hB", "hb"],
      MC: ["H", "hB"],
      MD: ["H", "hB"],
      ME: ["H", "hB", "h"],
      MF: ["H", "hB"],
      MG: ["H", "h"],
      MH: ["h", "hb", "H", "hB"],
      MK: ["H", "h", "hb", "hB"],
      ML: ["H"],
      MM: ["hB", "hb", "H", "h"],
      MN: ["H", "h", "hb", "hB"],
      MO: ["h", "hB", "hb", "H"],
      MP: ["h", "hb", "H", "hB"],
      MQ: ["H", "hB"],
      MR: ["h", "hB", "hb", "H"],
      MS: ["H", "h", "hb", "hB"],
      MT: ["H", "h"],
      MU: ["H", "h"],
      MV: ["H", "h"],
      MW: ["h", "hb", "H", "hB"],
      MX: ["H", "h", "hB", "hb"],
      MY: ["hb", "hB", "h", "H"],
      MZ: ["H", "hB"],
      NA: ["h", "H", "hB", "hb"],
      NC: ["H", "hB"],
      NE: ["H"],
      NF: ["H", "h", "hb", "hB"],
      NG: ["H", "h", "hb", "hB"],
      NI: ["H", "h", "hB", "hb"],
      NL: ["H", "hB"],
      NO: ["H", "h"],
      NP: ["H", "h", "hB"],
      NR: ["H", "h", "hb", "hB"],
      NU: ["H", "h", "hb", "hB"],
      NZ: ["h", "hb", "H", "hB"],
      OM: ["h", "hB", "hb", "H"],
      PA: ["h", "H", "hB", "hb"],
      PE: ["H", "hB", "h", "hb"],
      PF: ["H", "h", "hB"],
      PG: ["h", "H"],
      PH: ["h", "hB", "hb", "H"],
      PK: ["h", "hB", "H"],
      PL: ["H", "h"],
      PM: ["H", "hB"],
      PN: ["H", "h", "hb", "hB"],
      PR: ["h", "H", "hB", "hb"],
      PS: ["h", "hB", "hb", "H"],
      PT: ["H", "hB"],
      PW: ["h", "H"],
      PY: ["H", "h", "hB", "hb"],
      QA: ["h", "hB", "hb", "H"],
      RE: ["H", "hB"],
      RO: ["H", "hB"],
      RS: ["H", "hB", "h"],
      RU: ["H"],
      RW: ["H", "h"],
      SA: ["h", "hB", "hb", "H"],
      SB: ["h", "hb", "H", "hB"],
      SC: ["H", "h", "hB"],
      SD: ["h", "hB", "hb", "H"],
      SE: ["H"],
      SG: ["h", "hb", "H", "hB"],
      SH: ["H", "h", "hb", "hB"],
      SI: ["H", "hB"],
      SJ: ["H"],
      SK: ["H"],
      SL: ["h", "hb", "H", "hB"],
      SM: ["H", "h", "hB"],
      SN: ["H", "h", "hB"],
      SO: ["h", "H"],
      SR: ["H", "hB"],
      SS: ["h", "hb", "H", "hB"],
      ST: ["H", "hB"],
      SV: ["H", "h", "hB", "hb"],
      SX: ["H", "h", "hb", "hB"],
      SY: ["h", "hB", "hb", "H"],
      SZ: ["h", "hb", "H", "hB"],
      TA: ["H", "h", "hb", "hB"],
      TC: ["h", "hb", "H", "hB"],
      TD: ["h", "H", "hB"],
      TF: ["H", "h", "hB"],
      TG: ["H", "hB"],
      TH: ["H", "h"],
      TJ: ["H", "h"],
      TL: ["H", "hB", "hb", "h"],
      TM: ["H", "h"],
      TN: ["h", "hB", "hb", "H"],
      TO: ["h", "H"],
      TR: ["H", "hB"],
      TT: ["h", "hb", "H", "hB"],
      TW: ["hB", "hb", "h", "H"],
      TZ: ["hB", "hb", "H", "h"],
      UA: ["H", "hB", "h"],
      UG: ["hB", "hb", "H", "h"],
      UM: ["h", "hb", "H", "hB"],
      US: ["h", "hb", "H", "hB"],
      UY: ["H", "h", "hB", "hb"],
      UZ: ["H", "hB", "h"],
      VA: ["H", "h", "hB"],
      VC: ["h", "hb", "H", "hB"],
      VE: ["h", "H", "hB", "hb"],
      VG: ["h", "hb", "H", "hB"],
      VI: ["h", "hb", "H", "hB"],
      VN: ["H", "h"],
      VU: ["h", "H"],
      WF: ["H", "hB"],
      WS: ["h", "H"],
      XK: ["H", "hB", "h"],
      YE: ["h", "hB", "hb", "H"],
      YT: ["H", "hB"],
      ZA: ["H", "h", "hb", "hB"],
      ZM: ["h", "hb", "H", "hB"],
      ZW: ["H", "h"],
      "af-ZA": ["H", "h", "hB", "hb"],
      "ar-001": ["h", "hB", "hb", "H"],
      "ca-ES": ["H", "h", "hB"],
      "en-001": ["h", "hb", "H", "hB"],
      "es-BO": ["H", "h", "hB", "hb"],
      "es-BR": ["H", "h", "hB", "hb"],
      "es-EC": ["H", "h", "hB", "hb"],
      "es-ES": ["H", "h", "hB", "hb"],
      "es-GQ": ["H", "h", "hB", "hb"],
      "es-PE": ["H", "h", "hB", "hb"],
      "fr-CA": ["H", "h", "hB"],
      "gl-ES": ["H", "h", "hB"],
      "gu-IN": ["hB", "hb", "h", "H"],
      "hi-IN": ["hB", "h", "H"],
      "it-CH": ["H", "h", "hB"],
      "it-IT": ["H", "h", "hB"],
      "kn-IN": ["hB", "h", "H"],
      "ml-IN": ["hB", "h", "H"],
      "mr-IN": ["hB", "hb", "h", "H"],
      "pa-IN": ["hB", "hb", "h", "H"],
      "ta-IN": ["hB", "h", "hb", "H"],
      "te-IN": ["hB", "h", "H"],
      "zu-ZA": ["H", "hB", "hb", "h"]
    };
  function Rr(t) {
    var e = t.hourCycle;
    if (void 0 === e && t.hourCycles && t.hourCycles.length && (e = t.hourCycles[0]), e) switch (e) {
      case "h24":
        return "k";
      case "h23":
        return "H";
      case "h12":
        return "h";
      case "h11":
        return "K";
      default:
        throw new Error("Invalid hourCycle");
    }
    var i,
      r = t.language;
    return "root" !== r && (i = t.maximize().region), (Ur[i || ""] || Ur[r || ""] || Ur["".concat(r, "-001")] || Ur["001"])[0];
  }
  var jr = new RegExp("^".concat(Ar.source, "*")),
    Vr = new RegExp("".concat(Ar.source, "*$"));
  function Gr(t, e) {
    return {
      start: t,
      end: e
    };
  }
  var Zr = !!String.prototype.startsWith && "_a".startsWith("a", 1),
    Kr = !!String.fromCodePoint,
    Yr = !!Object.fromEntries,
    Wr = !!String.prototype.codePointAt,
    qr = !!String.prototype.trimStart,
    Xr = !!String.prototype.trimEnd,
    Qr = !!Number.isSafeInteger ? Number.isSafeInteger : function (t) {
      return "number" == typeof t && isFinite(t) && Math.floor(t) === t && Math.abs(t) <= 9007199254740991;
    },
    Jr = !0;
  try {
    Jr = "a" === (null === (zr = ln("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu").exec("a")) || void 0 === zr ? void 0 : zr[0]);
  } catch (V) {
    Jr = !1;
  }
  var tn,
    en = Zr ? function (t, e, i) {
      return t.startsWith(e, i);
    } : function (t, e, i) {
      return t.slice(i, i + e.length) === e;
    },
    rn = Kr ? String.fromCodePoint : function () {
      for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
      for (var i, r = "", n = t.length, s = 0; n > s;) {
        if ((i = t[s++]) > 1114111) throw RangeError(i + " is not a valid code point");
        r += i < 65536 ? String.fromCharCode(i) : String.fromCharCode(55296 + ((i -= 65536) >> 10), i % 1024 + 56320);
      }
      return r;
    },
    nn = Yr ? Object.fromEntries : function (t) {
      for (var e = {}, i = 0, r = t; i < r.length; i++) {
        var n = r[i],
          s = n[0],
          o = n[1];
        e[s] = o;
      }
      return e;
    },
    sn = Wr ? function (t, e) {
      return t.codePointAt(e);
    } : function (t, e) {
      var i = t.length;
      if (!(e < 0 || e >= i)) {
        var r,
          n = t.charCodeAt(e);
        return n < 55296 || n > 56319 || e + 1 === i || (r = t.charCodeAt(e + 1)) < 56320 || r > 57343 ? n : r - 56320 + (n - 55296 << 10) + 65536;
      }
    },
    on = qr ? function (t) {
      return t.trimStart();
    } : function (t) {
      return t.replace(jr, "");
    },
    an = Xr ? function (t) {
      return t.trimEnd();
    } : function (t) {
      return t.replace(Vr, "");
    };
  function ln(t, e) {
    return new RegExp(t, e);
  }
  if (Jr) {
    var cn = ln("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu");
    tn = function (t, e) {
      var i;
      return cn.lastIndex = e, null !== (i = cn.exec(t)[1]) && void 0 !== i ? i : "";
    };
  } else tn = function (t, e) {
    for (var i = [];;) {
      var r = sn(t, e);
      if (void 0 === r || pn(r) || gn(r)) break;
      i.push(r), e += r >= 65536 ? 2 : 1;
    }
    return rn.apply(void 0, i);
  };
  var hn = function () {
    function t(t, e) {
      void 0 === e && (e = {}), this.message = t, this.position = {
        offset: 0,
        line: 1,
        column: 1
      }, this.ignoreTag = !!e.ignoreTag, this.locale = e.locale, this.requiresOtherClause = !!e.requiresOtherClause, this.shouldParseSkeletons = !!e.shouldParseSkeletons;
    }
    return t.prototype.parse = function () {
      if (0 !== this.offset()) throw Error("parser can only be used once");
      return this.parseMessage(0, "", !1);
    }, t.prototype.parseMessage = function (t, e, i) {
      for (var r = []; !this.isEOF();) {
        var n = this.char();
        if (123 === n) {
          if ((s = this.parseArgument(t, i)).err) return s;
          r.push(s.val);
        } else {
          if (125 === n && t > 0) break;
          if (35 !== n || "plural" !== e && "selectordinal" !== e) {
            if (60 === n && !this.ignoreTag && 47 === this.peek()) {
              if (i) break;
              return this.error(Di.UNMATCHED_CLOSING_TAG, Gr(this.clonePosition(), this.clonePosition()));
            }
            if (60 === n && !this.ignoreTag && dn(this.peek() || 0)) {
              if ((s = this.parseTag(t, e)).err) return s;
              r.push(s.val);
            } else {
              var s;
              if ((s = this.parseLiteral(t, e)).err) return s;
              r.push(s.val);
            }
          } else {
            var o = this.clonePosition();
            this.bump(), r.push({
              type: Oi.pound,
              location: Gr(o, this.clonePosition())
            });
          }
        }
      }
      return {
        val: r,
        err: null
      };
    }, t.prototype.parseTag = function (t, e) {
      var i = this.clonePosition();
      this.bump();
      var r = this.parseTagName();
      if (this.bumpSpace(), this.bumpIf("/>")) return {
        val: {
          type: Oi.literal,
          value: "<".concat(r, "/>"),
          location: Gr(i, this.clonePosition())
        },
        err: null
      };
      if (this.bumpIf(">")) {
        var n = this.parseMessage(t + 1, e, !0);
        if (n.err) return n;
        var s = n.val,
          o = this.clonePosition();
        if (this.bumpIf("</")) {
          if (this.isEOF() || !dn(this.char())) return this.error(Di.INVALID_TAG, Gr(o, this.clonePosition()));
          var a = this.clonePosition();
          return r !== this.parseTagName() ? this.error(Di.UNMATCHED_CLOSING_TAG, Gr(a, this.clonePosition())) : (this.bumpSpace(), this.bumpIf(">") ? {
            val: {
              type: Oi.tag,
              value: r,
              children: s,
              location: Gr(i, this.clonePosition())
            },
            err: null
          } : this.error(Di.INVALID_TAG, Gr(o, this.clonePosition())));
        }
        return this.error(Di.UNCLOSED_TAG, Gr(i, this.clonePosition()));
      }
      return this.error(Di.INVALID_TAG, Gr(i, this.clonePosition()));
    }, t.prototype.parseTagName = function () {
      var t = this.offset();
      for (this.bump(); !this.isEOF() && un(this.char());) this.bump();
      return this.message.slice(t, this.offset());
    }, t.prototype.parseLiteral = function (t, e) {
      for (var i = this.clonePosition(), r = "";;) {
        var n = this.tryParseQuote(e);
        if (n) r += n;else {
          var s = this.tryParseUnquoted(t, e);
          if (s) r += s;else {
            var o = this.tryParseLeftAngleBracket();
            if (!o) break;
            r += o;
          }
        }
      }
      var a = Gr(i, this.clonePosition());
      return {
        val: {
          type: Oi.literal,
          value: r,
          location: a
        },
        err: null
      };
    }, t.prototype.tryParseLeftAngleBracket = function () {
      return this.isEOF() || 60 !== this.char() || !this.ignoreTag && (dn(t = this.peek() || 0) || 47 === t) ? null : (this.bump(), "<");
      var t;
    }, t.prototype.tryParseQuote = function (t) {
      if (this.isEOF() || 39 !== this.char()) return null;
      switch (this.peek()) {
        case 39:
          return this.bump(), this.bump(), "'";
        case 123:
        case 60:
        case 62:
        case 125:
          break;
        case 35:
          if ("plural" === t || "selectordinal" === t) break;
          return null;
        default:
          return null;
      }
      this.bump();
      var e = [this.char()];
      for (this.bump(); !this.isEOF();) {
        var i = this.char();
        if (39 === i) {
          if (39 !== this.peek()) {
            this.bump();
            break;
          }
          e.push(39), this.bump();
        } else e.push(i);
        this.bump();
      }
      return rn.apply(void 0, e);
    }, t.prototype.tryParseUnquoted = function (t, e) {
      if (this.isEOF()) return null;
      var i = this.char();
      return 60 === i || 123 === i || 35 === i && ("plural" === e || "selectordinal" === e) || 125 === i && t > 0 ? null : (this.bump(), rn(i));
    }, t.prototype.parseArgument = function (t, e) {
      var i = this.clonePosition();
      if (this.bump(), this.bumpSpace(), this.isEOF()) return this.error(Di.EXPECT_ARGUMENT_CLOSING_BRACE, Gr(i, this.clonePosition()));
      if (125 === this.char()) return this.bump(), this.error(Di.EMPTY_ARGUMENT, Gr(i, this.clonePosition()));
      var r = this.parseIdentifierIfPossible().value;
      if (!r) return this.error(Di.MALFORMED_ARGUMENT, Gr(i, this.clonePosition()));
      if (this.bumpSpace(), this.isEOF()) return this.error(Di.EXPECT_ARGUMENT_CLOSING_BRACE, Gr(i, this.clonePosition()));
      switch (this.char()) {
        case 125:
          return this.bump(), {
            val: {
              type: Oi.argument,
              value: r,
              location: Gr(i, this.clonePosition())
            },
            err: null
          };
        case 44:
          return this.bump(), this.bumpSpace(), this.isEOF() ? this.error(Di.EXPECT_ARGUMENT_CLOSING_BRACE, Gr(i, this.clonePosition())) : this.parseArgumentOptions(t, e, r, i);
        default:
          return this.error(Di.MALFORMED_ARGUMENT, Gr(i, this.clonePosition()));
      }
    }, t.prototype.parseIdentifierIfPossible = function () {
      var t = this.clonePosition(),
        e = this.offset(),
        i = tn(this.message, e),
        r = e + i.length;
      return this.bumpTo(r), {
        value: i,
        location: Gr(t, this.clonePosition())
      };
    }, t.prototype.parseArgumentOptions = function (t, e, i, n) {
      var s,
        o = this.clonePosition(),
        a = this.parseIdentifierIfPossible().value,
        l = this.clonePosition();
      switch (a) {
        case "":
          return this.error(Di.EXPECT_ARGUMENT_TYPE, Gr(o, l));
        case "number":
        case "date":
        case "time":
          this.bumpSpace();
          var c = null;
          if (this.bumpIf(",")) {
            this.bumpSpace();
            var h = this.clonePosition();
            if ((y = this.parseSimpleArgStyleIfPossible()).err) return y;
            if (0 === (g = an(y.val)).length) return this.error(Di.EXPECT_ARGUMENT_STYLE, Gr(this.clonePosition(), this.clonePosition()));
            c = {
              style: g,
              styleLocation: Gr(h, this.clonePosition())
            };
          }
          if ((_ = this.tryParseArgumentClose(n)).err) return _;
          var d = Gr(n, this.clonePosition());
          if (c && en(null == c ? void 0 : c.style, "::", 0)) {
            var u = on(c.style.slice(2));
            if ("number" === a) return (y = this.parseNumberSkeletonFromString(u, c.styleLocation)).err ? y : {
              val: {
                type: Oi.number,
                value: i,
                location: d,
                style: y.val
              },
              err: null
            };
            if (0 === u.length) return this.error(Di.EXPECT_DATE_TIME_SKELETON, d);
            var p = u;
            this.locale && (p = function (t, e) {
              for (var i = "", r = 0; r < t.length; r++) {
                var n = t.charAt(r);
                if ("j" === n) {
                  for (var s = 0; r + 1 < t.length && t.charAt(r + 1) === n;) s++, r++;
                  var o = 1 + (1 & s),
                    a = s < 2 ? 1 : 3 + (s >> 1),
                    l = Rr(e);
                  for ("H" != l && "k" != l || (a = 0); a-- > 0;) i += "a";
                  for (; o-- > 0;) i = l + i;
                } else i += "J" === n ? "H" : n;
              }
              return i;
            }(u, this.locale));
            var g = {
              type: Ni.dateTime,
              pattern: p,
              location: c.styleLocation,
              parsedOptions: this.shouldParseSkeletons ? Tr(p) : {}
            };
            return {
              val: {
                type: "date" === a ? Oi.date : Oi.time,
                value: i,
                location: d,
                style: g
              },
              err: null
            };
          }
          return {
            val: {
              type: "number" === a ? Oi.number : "date" === a ? Oi.date : Oi.time,
              value: i,
              location: d,
              style: null !== (s = null == c ? void 0 : c.style) && void 0 !== s ? s : null
            },
            err: null
          };
        case "plural":
        case "selectordinal":
        case "select":
          var m = this.clonePosition();
          if (this.bumpSpace(), !this.bumpIf(",")) return this.error(Di.EXPECT_SELECT_ARGUMENT_OPTIONS, Gr(m, r({}, m)));
          this.bumpSpace();
          var b = this.parseIdentifierIfPossible(),
            f = 0;
          if ("select" !== a && "offset" === b.value) {
            if (!this.bumpIf(":")) return this.error(Di.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, Gr(this.clonePosition(), this.clonePosition()));
            var y;
            if (this.bumpSpace(), (y = this.tryParseDecimalInteger(Di.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, Di.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE)).err) return y;
            this.bumpSpace(), b = this.parseIdentifierIfPossible(), f = y.val;
          }
          var _,
            v = this.tryParsePluralOrSelectOptions(t, a, e, b);
          if (v.err) return v;
          if ((_ = this.tryParseArgumentClose(n)).err) return _;
          var w = Gr(n, this.clonePosition());
          return "select" === a ? {
            val: {
              type: Oi.select,
              value: i,
              options: nn(v.val),
              location: w
            },
            err: null
          } : {
            val: {
              type: Oi.plural,
              value: i,
              options: nn(v.val),
              offset: f,
              pluralType: "plural" === a ? "cardinal" : "ordinal",
              location: w
            },
            err: null
          };
        default:
          return this.error(Di.INVALID_ARGUMENT_TYPE, Gr(o, l));
      }
    }, t.prototype.tryParseArgumentClose = function (t) {
      return this.isEOF() || 125 !== this.char() ? this.error(Di.EXPECT_ARGUMENT_CLOSING_BRACE, Gr(t, this.clonePosition())) : (this.bump(), {
        val: !0,
        err: null
      });
    }, t.prototype.parseSimpleArgStyleIfPossible = function () {
      for (var t = 0, e = this.clonePosition(); !this.isEOF();) {
        switch (this.char()) {
          case 39:
            this.bump();
            var i = this.clonePosition();
            if (!this.bumpUntil("'")) return this.error(Di.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE, Gr(i, this.clonePosition()));
            this.bump();
            break;
          case 123:
            t += 1, this.bump();
            break;
          case 125:
            if (!(t > 0)) return {
              val: this.message.slice(e.offset, this.offset()),
              err: null
            };
            t -= 1;
            break;
          default:
            this.bump();
        }
      }
      return {
        val: this.message.slice(e.offset, this.offset()),
        err: null
      };
    }, t.prototype.parseNumberSkeletonFromString = function (t, e) {
      var i = [];
      try {
        i = function (t) {
          if (0 === t.length) throw new Error("Number skeleton cannot be empty");
          for (var e = t.split(kr).filter(function (t) {
              return t.length > 0;
            }), i = [], r = 0, n = e; r < n.length; r++) {
            var s = n[r].split("/");
            if (0 === s.length) throw new Error("Invalid number skeleton");
            for (var o = s[0], a = s.slice(1), l = 0, c = a; l < c.length; l++) if (0 === c[l].length) throw new Error("Invalid number skeleton");
            i.push({
              stem: o,
              options: a
            });
          }
          return i;
        }(t);
      } catch (t) {
        return this.error(Di.INVALID_NUMBER_SKELETON, e);
      }
      return {
        val: {
          type: Ni.number,
          tokens: i,
          location: e,
          parsedOptions: this.shouldParseSkeletons ? Nr(i) : {}
        },
        err: null
      };
    }, t.prototype.tryParsePluralOrSelectOptions = function (t, e, i, r) {
      for (var n, s = !1, o = [], a = new Set(), l = r.value, c = r.location;;) {
        if (0 === l.length) {
          var h = this.clonePosition();
          if ("select" === e || !this.bumpIf("=")) break;
          var d = this.tryParseDecimalInteger(Di.EXPECT_PLURAL_ARGUMENT_SELECTOR, Di.INVALID_PLURAL_ARGUMENT_SELECTOR);
          if (d.err) return d;
          c = Gr(h, this.clonePosition()), l = this.message.slice(h.offset, this.offset());
        }
        if (a.has(l)) return this.error("select" === e ? Di.DUPLICATE_SELECT_ARGUMENT_SELECTOR : Di.DUPLICATE_PLURAL_ARGUMENT_SELECTOR, c);
        "other" === l && (s = !0), this.bumpSpace();
        var u = this.clonePosition();
        if (!this.bumpIf("{")) return this.error("select" === e ? Di.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT : Di.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT, Gr(this.clonePosition(), this.clonePosition()));
        var p = this.parseMessage(t + 1, e, i);
        if (p.err) return p;
        var g = this.tryParseArgumentClose(u);
        if (g.err) return g;
        o.push([l, {
          value: p.val,
          location: Gr(u, this.clonePosition())
        }]), a.add(l), this.bumpSpace(), l = (n = this.parseIdentifierIfPossible()).value, c = n.location;
      }
      return 0 === o.length ? this.error("select" === e ? Di.EXPECT_SELECT_ARGUMENT_SELECTOR : Di.EXPECT_PLURAL_ARGUMENT_SELECTOR, Gr(this.clonePosition(), this.clonePosition())) : this.requiresOtherClause && !s ? this.error(Di.MISSING_OTHER_CLAUSE, Gr(this.clonePosition(), this.clonePosition())) : {
        val: o,
        err: null
      };
    }, t.prototype.tryParseDecimalInteger = function (t, e) {
      var i = 1,
        r = this.clonePosition();
      this.bumpIf("+") || this.bumpIf("-") && (i = -1);
      for (var n = !1, s = 0; !this.isEOF();) {
        var o = this.char();
        if (!(o >= 48 && o <= 57)) break;
        n = !0, s = 10 * s + (o - 48), this.bump();
      }
      var a = Gr(r, this.clonePosition());
      return n ? Qr(s *= i) ? {
        val: s,
        err: null
      } : this.error(e, a) : this.error(t, a);
    }, t.prototype.offset = function () {
      return this.position.offset;
    }, t.prototype.isEOF = function () {
      return this.offset() === this.message.length;
    }, t.prototype.clonePosition = function () {
      return {
        offset: this.position.offset,
        line: this.position.line,
        column: this.position.column
      };
    }, t.prototype.char = function () {
      var t = this.position.offset;
      if (t >= this.message.length) throw Error("out of bound");
      var e = sn(this.message, t);
      if (void 0 === e) throw Error("Offset ".concat(t, " is at invalid UTF-16 code unit boundary"));
      return e;
    }, t.prototype.error = function (t, e) {
      return {
        val: null,
        err: {
          kind: t,
          message: this.message,
          location: e
        }
      };
    }, t.prototype.bump = function () {
      if (!this.isEOF()) {
        var t = this.char();
        10 === t ? (this.position.line += 1, this.position.column = 1, this.position.offset += 1) : (this.position.column += 1, this.position.offset += t < 65536 ? 1 : 2);
      }
    }, t.prototype.bumpIf = function (t) {
      if (en(this.message, t, this.offset())) {
        for (var e = 0; e < t.length; e++) this.bump();
        return !0;
      }
      return !1;
    }, t.prototype.bumpUntil = function (t) {
      var e = this.offset(),
        i = this.message.indexOf(t, e);
      return i >= 0 ? (this.bumpTo(i), !0) : (this.bumpTo(this.message.length), !1);
    }, t.prototype.bumpTo = function (t) {
      if (this.offset() > t) throw Error("targetOffset ".concat(t, " must be greater than or equal to the current offset ").concat(this.offset()));
      for (t = Math.min(t, this.message.length);;) {
        var e = this.offset();
        if (e === t) break;
        if (e > t) throw Error("targetOffset ".concat(t, " is at invalid UTF-16 code unit boundary"));
        if (this.bump(), this.isEOF()) break;
      }
    }, t.prototype.bumpSpace = function () {
      for (; !this.isEOF() && pn(this.char());) this.bump();
    }, t.prototype.peek = function () {
      if (this.isEOF()) return null;
      var t = this.char(),
        e = this.offset(),
        i = this.message.charCodeAt(e + (t >= 65536 ? 2 : 1));
      return null != i ? i : null;
    }, t;
  }();
  function dn(t) {
    return t >= 97 && t <= 122 || t >= 65 && t <= 90;
  }
  function un(t) {
    return 45 === t || 46 === t || t >= 48 && t <= 57 || 95 === t || t >= 97 && t <= 122 || t >= 65 && t <= 90 || 183 == t || t >= 192 && t <= 214 || t >= 216 && t <= 246 || t >= 248 && t <= 893 || t >= 895 && t <= 8191 || t >= 8204 && t <= 8205 || t >= 8255 && t <= 8256 || t >= 8304 && t <= 8591 || t >= 11264 && t <= 12271 || t >= 12289 && t <= 55295 || t >= 63744 && t <= 64975 || t >= 65008 && t <= 65533 || t >= 65536 && t <= 983039;
  }
  function pn(t) {
    return t >= 9 && t <= 13 || 32 === t || 133 === t || t >= 8206 && t <= 8207 || 8232 === t || 8233 === t;
  }
  function gn(t) {
    return t >= 33 && t <= 35 || 36 === t || t >= 37 && t <= 39 || 40 === t || 41 === t || 42 === t || 43 === t || 44 === t || 45 === t || t >= 46 && t <= 47 || t >= 58 && t <= 59 || t >= 60 && t <= 62 || t >= 63 && t <= 64 || 91 === t || 92 === t || 93 === t || 94 === t || 96 === t || 123 === t || 124 === t || 125 === t || 126 === t || 161 === t || t >= 162 && t <= 165 || 166 === t || 167 === t || 169 === t || 171 === t || 172 === t || 174 === t || 176 === t || 177 === t || 182 === t || 187 === t || 191 === t || 215 === t || 247 === t || t >= 8208 && t <= 8213 || t >= 8214 && t <= 8215 || 8216 === t || 8217 === t || 8218 === t || t >= 8219 && t <= 8220 || 8221 === t || 8222 === t || 8223 === t || t >= 8224 && t <= 8231 || t >= 8240 && t <= 8248 || 8249 === t || 8250 === t || t >= 8251 && t <= 8254 || t >= 8257 && t <= 8259 || 8260 === t || 8261 === t || 8262 === t || t >= 8263 && t <= 8273 || 8274 === t || 8275 === t || t >= 8277 && t <= 8286 || t >= 8592 && t <= 8596 || t >= 8597 && t <= 8601 || t >= 8602 && t <= 8603 || t >= 8604 && t <= 8607 || 8608 === t || t >= 8609 && t <= 8610 || 8611 === t || t >= 8612 && t <= 8613 || 8614 === t || t >= 8615 && t <= 8621 || 8622 === t || t >= 8623 && t <= 8653 || t >= 8654 && t <= 8655 || t >= 8656 && t <= 8657 || 8658 === t || 8659 === t || 8660 === t || t >= 8661 && t <= 8691 || t >= 8692 && t <= 8959 || t >= 8960 && t <= 8967 || 8968 === t || 8969 === t || 8970 === t || 8971 === t || t >= 8972 && t <= 8991 || t >= 8992 && t <= 8993 || t >= 8994 && t <= 9e3 || 9001 === t || 9002 === t || t >= 9003 && t <= 9083 || 9084 === t || t >= 9085 && t <= 9114 || t >= 9115 && t <= 9139 || t >= 9140 && t <= 9179 || t >= 9180 && t <= 9185 || t >= 9186 && t <= 9254 || t >= 9255 && t <= 9279 || t >= 9280 && t <= 9290 || t >= 9291 && t <= 9311 || t >= 9472 && t <= 9654 || 9655 === t || t >= 9656 && t <= 9664 || 9665 === t || t >= 9666 && t <= 9719 || t >= 9720 && t <= 9727 || t >= 9728 && t <= 9838 || 9839 === t || t >= 9840 && t <= 10087 || 10088 === t || 10089 === t || 10090 === t || 10091 === t || 10092 === t || 10093 === t || 10094 === t || 10095 === t || 10096 === t || 10097 === t || 10098 === t || 10099 === t || 10100 === t || 10101 === t || t >= 10132 && t <= 10175 || t >= 10176 && t <= 10180 || 10181 === t || 10182 === t || t >= 10183 && t <= 10213 || 10214 === t || 10215 === t || 10216 === t || 10217 === t || 10218 === t || 10219 === t || 10220 === t || 10221 === t || 10222 === t || 10223 === t || t >= 10224 && t <= 10239 || t >= 10240 && t <= 10495 || t >= 10496 && t <= 10626 || 10627 === t || 10628 === t || 10629 === t || 10630 === t || 10631 === t || 10632 === t || 10633 === t || 10634 === t || 10635 === t || 10636 === t || 10637 === t || 10638 === t || 10639 === t || 10640 === t || 10641 === t || 10642 === t || 10643 === t || 10644 === t || 10645 === t || 10646 === t || 10647 === t || 10648 === t || t >= 10649 && t <= 10711 || 10712 === t || 10713 === t || 10714 === t || 10715 === t || t >= 10716 && t <= 10747 || 10748 === t || 10749 === t || t >= 10750 && t <= 11007 || t >= 11008 && t <= 11055 || t >= 11056 && t <= 11076 || t >= 11077 && t <= 11078 || t >= 11079 && t <= 11084 || t >= 11085 && t <= 11123 || t >= 11124 && t <= 11125 || t >= 11126 && t <= 11157 || 11158 === t || t >= 11159 && t <= 11263 || t >= 11776 && t <= 11777 || 11778 === t || 11779 === t || 11780 === t || 11781 === t || t >= 11782 && t <= 11784 || 11785 === t || 11786 === t || 11787 === t || 11788 === t || 11789 === t || t >= 11790 && t <= 11798 || 11799 === t || t >= 11800 && t <= 11801 || 11802 === t || 11803 === t || 11804 === t || 11805 === t || t >= 11806 && t <= 11807 || 11808 === t || 11809 === t || 11810 === t || 11811 === t || 11812 === t || 11813 === t || 11814 === t || 11815 === t || 11816 === t || 11817 === t || t >= 11818 && t <= 11822 || 11823 === t || t >= 11824 && t <= 11833 || t >= 11834 && t <= 11835 || t >= 11836 && t <= 11839 || 11840 === t || 11841 === t || 11842 === t || t >= 11843 && t <= 11855 || t >= 11856 && t <= 11857 || 11858 === t || t >= 11859 && t <= 11903 || t >= 12289 && t <= 12291 || 12296 === t || 12297 === t || 12298 === t || 12299 === t || 12300 === t || 12301 === t || 12302 === t || 12303 === t || 12304 === t || 12305 === t || t >= 12306 && t <= 12307 || 12308 === t || 12309 === t || 12310 === t || 12311 === t || 12312 === t || 12313 === t || 12314 === t || 12315 === t || 12316 === t || 12317 === t || t >= 12318 && t <= 12319 || 12320 === t || 12336 === t || 64830 === t || 64831 === t || t >= 65093 && t <= 65094;
  }
  function mn(t) {
    t.forEach(function (t) {
      if (delete t.location, wr(t) || xr(t)) for (var e in t.options) delete t.options[e].location, mn(t.options[e].value);else yr(t) && Sr(t.style) || (_r(t) || vr(t)) && Cr(t.style) ? delete t.style.location : Er(t) && mn(t.children);
    });
  }
  function bn(t, e) {
    void 0 === e && (e = {}), e = r({
      shouldParseSkeletons: !0,
      requiresOtherClause: !0
    }, e);
    var i = new hn(t, e).parse();
    if (i.err) {
      var n = SyntaxError(Di[i.err.kind]);
      throw n.location = i.err.location, n.originalMessage = i.err.message, n;
    }
    return (null == e ? void 0 : e.captureLocation) || mn(i.val), i.val;
  }
  function fn(t, e) {
    var i = e && e.cache ? e.cache : Sn,
      r = e && e.serializer ? e.serializer : xn;
    return (e && e.strategy ? e.strategy : wn)(t, {
      cache: i,
      serializer: r
    });
  }
  function yn(t, e, i, r) {
    var n,
      s = null == (n = r) || "number" == typeof n || "boolean" == typeof n ? r : i(r),
      o = e.get(s);
    return void 0 === o && (o = t.call(this, r), e.set(s, o)), o;
  }
  function _n(t, e, i) {
    var r = Array.prototype.slice.call(arguments, 3),
      n = i(r),
      s = e.get(n);
    return void 0 === s && (s = t.apply(this, r), e.set(n, s)), s;
  }
  function vn(t, e, i, r, n) {
    return i.bind(e, t, r, n);
  }
  function wn(t, e) {
    return vn(t, this, 1 === t.length ? yn : _n, e.cache.create(), e.serializer);
  }
  var xn = function () {
    return JSON.stringify(arguments);
  };
  function $n() {
    this.cache = Object.create(null);
  }
  $n.prototype.get = function (t) {
    return this.cache[t];
  }, $n.prototype.set = function (t, e) {
    this.cache[t] = e;
  };
  var En,
    Sn = {
      create: function () {
        return new $n();
      }
    },
    Cn = {
      variadic: function (t, e) {
        return vn(t, this, _n, e.cache.create(), e.serializer);
      },
      monadic: function (t, e) {
        return vn(t, this, yn, e.cache.create(), e.serializer);
      }
    };
  !function (t) {
    t.MISSING_VALUE = "MISSING_VALUE", t.INVALID_VALUE = "INVALID_VALUE", t.MISSING_INTL_API = "MISSING_INTL_API";
  }(En || (En = {}));
  var An,
    Pn = function (t) {
      function e(e, i, r) {
        var n = t.call(this, e) || this;
        return n.code = i, n.originalMessage = r, n;
      }
      return i(e, t), e.prototype.toString = function () {
        return "[formatjs Error: ".concat(this.code, "] ").concat(this.message);
      }, e;
    }(Error),
    Tn = function (t) {
      function e(e, i, r, n) {
        return t.call(this, 'Invalid values for "'.concat(e, '": "').concat(i, '". Options are "').concat(Object.keys(r).join('", "'), '"'), En.INVALID_VALUE, n) || this;
      }
      return i(e, t), e;
    }(Pn),
    kn = function (t) {
      function e(e, i, r) {
        return t.call(this, 'Value for "'.concat(e, '" must be of type ').concat(i), En.INVALID_VALUE, r) || this;
      }
      return i(e, t), e;
    }(Pn),
    Mn = function (t) {
      function e(e, i) {
        return t.call(this, 'The intl string context variable "'.concat(e, '" was not provided to the string "').concat(i, '"'), En.MISSING_VALUE, i) || this;
      }
      return i(e, t), e;
    }(Pn);
  function Hn(t) {
    return "function" == typeof t;
  }
  function Bn(t, e, i, r, n, s, o) {
    if (1 === t.length && br(t[0])) return [{
      type: An.literal,
      value: t[0].value
    }];
    for (var a = [], l = 0, c = t; l < c.length; l++) {
      var h = c[l];
      if (br(h)) a.push({
        type: An.literal,
        value: h.value
      });else if ($r(h)) "number" == typeof s && a.push({
        type: An.literal,
        value: i.getNumberFormat(e).format(s)
      });else {
        var d = h.value;
        if (!n || !(d in n)) throw new Mn(d, o);
        var u = n[d];
        if (fr(h)) u && "string" != typeof u && "number" != typeof u || (u = "string" == typeof u || "number" == typeof u ? String(u) : ""), a.push({
          type: "string" == typeof u ? An.literal : An.object,
          value: u
        });else if (_r(h)) {
          var p = "string" == typeof h.style ? r.date[h.style] : Cr(h.style) ? h.style.parsedOptions : void 0;
          a.push({
            type: An.literal,
            value: i.getDateTimeFormat(e, p).format(u)
          });
        } else if (vr(h)) {
          p = "string" == typeof h.style ? r.time[h.style] : Cr(h.style) ? h.style.parsedOptions : r.time.medium;
          a.push({
            type: An.literal,
            value: i.getDateTimeFormat(e, p).format(u)
          });
        } else if (yr(h)) {
          (p = "string" == typeof h.style ? r.number[h.style] : Sr(h.style) ? h.style.parsedOptions : void 0) && p.scale && (u *= p.scale || 1), a.push({
            type: An.literal,
            value: i.getNumberFormat(e, p).format(u)
          });
        } else {
          if (Er(h)) {
            var g = h.children,
              m = h.value,
              b = n[m];
            if (!Hn(b)) throw new kn(m, "function", o);
            var f = b(Bn(g, e, i, r, n, s).map(function (t) {
              return t.value;
            }));
            Array.isArray(f) || (f = [f]), a.push.apply(a, f.map(function (t) {
              return {
                type: "string" == typeof t ? An.literal : An.object,
                value: t
              };
            }));
          }
          if (wr(h)) {
            if (!(y = h.options[u] || h.options.other)) throw new Tn(h.value, u, Object.keys(h.options), o);
            a.push.apply(a, Bn(y.value, e, i, r, n));
          } else if (xr(h)) {
            var y;
            if (!(y = h.options["=".concat(u)])) {
              if (!Intl.PluralRules) throw new Pn('Intl.PluralRules is not available in this environment.\nTry polyfilling it using "@formatjs/intl-pluralrules"\n', En.MISSING_INTL_API, o);
              var _ = i.getPluralRules(e, {
                type: h.pluralType
              }).select(u - (h.offset || 0));
              y = h.options[_] || h.options.other;
            }
            if (!y) throw new Tn(h.value, u, Object.keys(h.options), o);
            a.push.apply(a, Bn(y.value, e, i, r, n, u - (h.offset || 0)));
          } else ;
        }
      }
    }
    return function (t) {
      return t.length < 2 ? t : t.reduce(function (t, e) {
        var i = t[t.length - 1];
        return i && i.type === An.literal && e.type === An.literal ? i.value += e.value : t.push(e), t;
      }, []);
    }(a);
  }
  function Fn(t, e) {
    return e ? Object.keys(t).reduce(function (i, n) {
      var s, o;
      return i[n] = (s = t[n], (o = e[n]) ? r(r(r({}, s || {}), o || {}), Object.keys(s).reduce(function (t, e) {
        return t[e] = r(r({}, s[e]), o[e] || {}), t;
      }, {})) : s), i;
    }, r({}, t)) : t;
  }
  function In(t) {
    return {
      create: function () {
        return {
          get: function (e) {
            return t[e];
          },
          set: function (e, i) {
            t[e] = i;
          }
        };
      }
    };
  }
  !function (t) {
    t[t.literal = 0] = "literal", t[t.object = 1] = "object";
  }(An || (An = {}));
  var Ln = function () {
      function t(e, i, n, o) {
        var a,
          l = this;
        if (void 0 === i && (i = t.defaultLocale), this.formatterCache = {
          number: {},
          dateTime: {},
          pluralRules: {}
        }, this.format = function (t) {
          var e = l.formatToParts(t);
          if (1 === e.length) return e[0].value;
          var i = e.reduce(function (t, e) {
            return t.length && e.type === An.literal && "string" == typeof t[t.length - 1] ? t[t.length - 1] += e.value : t.push(e.value), t;
          }, []);
          return i.length <= 1 ? i[0] || "" : i;
        }, this.formatToParts = function (t) {
          return Bn(l.ast, l.locales, l.formatters, l.formats, t, void 0, l.message);
        }, this.resolvedOptions = function () {
          var t;
          return {
            locale: (null === (t = l.resolvedLocale) || void 0 === t ? void 0 : t.toString()) || Intl.NumberFormat.supportedLocalesOf(l.locales)[0]
          };
        }, this.getAst = function () {
          return l.ast;
        }, this.locales = i, this.resolvedLocale = t.resolveLocale(i), "string" == typeof e) {
          if (this.message = e, !t.__parse) throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");
          var c = o || {};
          c.formatters;
          var h = function (t, e) {
            var i = {};
            for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && e.indexOf(r) < 0 && (i[r] = t[r]);
            if (null != t && "function" == typeof Object.getOwnPropertySymbols) {
              var n = 0;
              for (r = Object.getOwnPropertySymbols(t); n < r.length; n++) e.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(t, r[n]) && (i[r[n]] = t[r[n]]);
            }
            return i;
          }(c, ["formatters"]);
          this.ast = t.__parse(e, r(r({}, h), {
            locale: this.resolvedLocale
          }));
        } else this.ast = e;
        if (!Array.isArray(this.ast)) throw new TypeError("A message must be provided as a String or AST.");
        this.formats = Fn(t.formats, n), this.formatters = o && o.formatters || (void 0 === (a = this.formatterCache) && (a = {
          number: {},
          dateTime: {},
          pluralRules: {}
        }), {
          getNumberFormat: fn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.NumberFormat).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: In(a.number),
            strategy: Cn.variadic
          }),
          getDateTimeFormat: fn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.DateTimeFormat).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: In(a.dateTime),
            strategy: Cn.variadic
          }),
          getPluralRules: fn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.PluralRules).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: In(a.pluralRules),
            strategy: Cn.variadic
          })
        });
      }
      return Object.defineProperty(t, "defaultLocale", {
        get: function () {
          return t.memoizedDefaultLocale || (t.memoizedDefaultLocale = new Intl.NumberFormat().resolvedOptions().locale), t.memoizedDefaultLocale;
        },
        enumerable: !1,
        configurable: !0
      }), t.memoizedDefaultLocale = null, t.resolveLocale = function (t) {
        if (void 0 !== Intl.Locale) {
          var e = Intl.NumberFormat.supportedLocalesOf(t);
          return e.length > 0 ? new Intl.Locale(e[0]) : new Intl.Locale("string" == typeof t ? t : t[0]);
        }
      }, t.__parse = bn, t.formats = {
        number: {
          integer: {
            maximumFractionDigits: 0
          },
          currency: {
            style: "currency"
          },
          percent: {
            style: "percent"
          }
        },
        date: {
          short: {
            month: "numeric",
            day: "numeric",
            year: "2-digit"
          },
          medium: {
            month: "short",
            day: "numeric",
            year: "numeric"
          },
          long: {
            month: "long",
            day: "numeric",
            year: "numeric"
          },
          full: {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          }
        },
        time: {
          short: {
            hour: "numeric",
            minute: "numeric"
          },
          medium: {
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
          },
          long: {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "short"
          },
          full: {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "short"
          }
        }
      }, t;
    }(),
    Dn = Ln,
    On = {
      de: Gi,
      en: Xi,
      fr: rr,
      nl: cr,
      "zh-Hans": mr
    };
  function Nn(t, e, ...i) {
    const r = e.replace(/['"]+/g, "");
    var n;
    try {
      n = t.split(".").reduce((t, e) => t[e], On[r]);
    } catch (e) {
      n = t.split(".").reduce((t, e) => t[e], On.en);
    }
    if (void 0 === n && (n = t.split(".").reduce((t, e) => t[e], On.en)), !i.length) return n;
    const s = {};
    for (let t = 0; t < i.length; t += 2) {
      let e = i[t];
      e = e.replace(/^{([^}]+)?}$/, "$1"), s[e] = i[t + 1];
    }
    try {
      return new Dn(n, e).format(s);
    } catch (t) {
      return "Translation " + t;
    }
  }
  const zn = {
    top: {
      width: 340,
      height: 20
    },
    bottom: {
      width: 340,
      height: 52.3
    },
    left: {
      width: 30,
      height: 400
    },
    right: {
      width: 30,
      height: 380
    },
    buildplate: {
      maxWidth: 250,
      maxHeight: 260,
      verticalOffset: 55
    },
    xAxis: {
      stepper: !0,
      width: 400,
      offsetLeft: -30,
      height: 30,
      extruder: {
        width: 60,
        height: 100
      }
    }
  };
  let Un;
  let Rn = class extends mt {
    constructor() {
      super(...arguments), this._elementReady = !!customElements.get("ha-camera-stream"), this._loadFailed = !1;
    }
    willUpdate(t) {
      super.willUpdate(t), this._elementReady || this._loadFailed || !this.cameraEntityId || async function (t) {
        customElements.get("ha-camera-stream") || (Un || (Un = (async () => {
          const e = await window.loadCardHelpers().then(t => t);
          e.createCardElement({
            type: "picture-entity",
            entity: t,
            camera_view: "live"
          }), await customElements.whenDefined("ha-camera-stream");
        })()), await Un);
      }(this.cameraEntityId).then(() => {
        this._elementReady = !0;
      }, () => {
        this._loadFailed = !0;
      });
    }
    _stateObj() {
      return this.cameraEntityId ? this.hass.states[this.cameraEntityId] : void 0;
    }
    render() {
      const t = this._stateObj();
      return this._loadFailed ? q`<div class="ac-cam-message">Video player unavailable</div>` : t && "unavailable" !== t.state ? this._elementReady ? q`
      <ha-camera-stream
        muted
        .stateObj=${t}
        .fitMode=${"cover"}
      ></ha-camera-stream>
    ` : q`<div class="ac-cam-message">Starting video…</div>` : q`<div class="ac-cam-message">Camera unavailable</div>`;
    }
    static get styles() {
      return u`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        /* ha-camera-stream has its own shadow root, so its internal <video>
           cannot be styled from here and sizes itself to the stream's own
           aspect ratio. Without this it escapes the box entirely -- in the
           printer card that meant the video spilling out past the chassis
           instead of sitting inside the build chamber. */
        overflow: hidden;
      }

      ha-camera-stream {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ac-cam-message {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
    `;
    }
  };
  n([_t()], Rn.prototype, "hass", void 0), n([_t({
    attribute: "camera-entity-id"
  })], Rn.prototype, "cameraEntityId", void 0), n([vt()], Rn.prototype, "_elementReady", void 0), n([vt()], Rn.prototype, "_loadFailed", void 0), Rn = n([$t("anycubic-printercard-camera_stream")], Rn);
  const jn = [66.5, 102, 137.5, 173],
    Vn = ["#d94a3d", "#2f7fd1", "#e8b33a", "#3aa87a"],
    Gn = (t, e, i, r, n = !0) => X`
  ${t && n ? X`
        <g class="ac-apr-wash" fill="var(--ac-printer-light, #ffd88a)">
          <rect x="${e + 3}" y="${i + 3}" width="${r - 6}" height="34" opacity="0.055"></rect>
          <rect x="${e + 3}" y="${i + 3}" width="${r - 6}" height="18" opacity="0.075"></rect>
          <rect x="${e + 3}" y="${i + 3}" width="${r - 6}" height="8" opacity="0.1"></rect>
        </g>` : J}
  <rect x="${e}" y="${i}" width="${r}" height="3" rx="1.5"
        fill="${t ? "var(--ac-printer-light, #ffd88a)" : "currentColor"}"
        opacity="${t ? .95 : .3}"></rect>
  ${t ? X`<rect x="${(e + .18 * r).toFixed(1)}" y="${i + .7}" width="${(.64 * r).toFixed(1)}" height="1.2" rx="0.6"
              fill="#ffffff" opacity="0.6"></rect>` : J}`,
    Zn = t => {
      if (!t || !/^#[0-9a-f]{6}$/i.test(t)) return "rgba(255,255,255,0.35)";
      const e = parseInt(t.slice(1), 16);
      return (.299 * (e >> 16 & 255) + .587 * (e >> 8 & 255) + .114 * (255 & e)) / 255 < .45 ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
    },
    Kn = (t, e, i, r, n, s, o, a) => {
      if (!t || e <= .005) return J;
      if (a) {
        const t = Math.min(1, e),
          l = s,
          c = Math.min(r, l),
          h = i + (r - c) / 2,
          d = n - l,
          u = l * t,
          p = ((t, ...e) => {
            const i = `${t}|${e.map(t => t.toFixed(2)).join(",")}`;
            let r = 0;
            for (let t = 0; t < i.length; t++) r = 31 * r + i.charCodeAt(t) | 0;
            return `acm${(r >>> 0).toString(36)}`;
          })(a, h, d, c, l, u);
        return X`
      <g class="ac-apr-print">
        <defs>
          <!-- mask-type:alpha, not a filter and not a luminance mask. The
               render is a transparent PNG of a near-black object, so its
               ALPHA is the silhouette and its luminance is nothing: a default
               luminance mask renders it almost invisible. Masking a plain
               rect of the filament colour gives the part's real outline in
               the colour it is actually being printed in. -->
          <mask id="${p}m" style="mask-type:alpha">
            <image href="${a}" x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                   width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                   preserveAspectRatio="xMidYMax meet"></image>
          </mask>
          <clipPath id="${p}c">
            <rect x="${h.toFixed(1)}" y="${(n - u).toFixed(1)}"
                  width="${c.toFixed(1)}" height="${u.toFixed(1)}"></rect>
          </clipPath>
        </defs>
        <g clip-path="url(#${p}c)">
          <!-- A halo of the same silhouette, very slightly larger, in the
               contrasting edge colour. The live printer is loaded with PLA+
               at #1A1A1A and the chamber is darker still, so without this the
               part is a black shape on a black background. Scaling about the
               shape's own centre keeps it registered. -->
          <g transform="translate(${(h + c / 2).toFixed(1)} ${(d + l / 2).toFixed(1)}) scale(1.035) translate(${(-h - c / 2).toFixed(1)} ${(-d - l / 2).toFixed(1)})">
            <rect x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                  width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                  fill="${Zn(o)}" mask="url(#${p}m)"></rect>
          </g>
          <rect x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                fill="${o}" mask="url(#${p}m)"></rect>
        </g>
        <rect x="${h.toFixed(1)}" y="${(n - u).toFixed(1)}"
              width="${c.toFixed(1)}" height="1.4"
              fill="var(--ac-printer-card-bg, #fff)" opacity="0.55"></rect>
      </g>`;
      }
      const l = Math.min(1, e) * s,
        c = .22 * r,
        h = Math.min(6, .25 * l),
        d = i + c,
        u = r - 2 * c,
        p = [];
      for (let t = n - 4; t > n - l + 1; t -= 4) {
        const e = h * ((n - t) / Math.max(1, l));
        p.push(X`<line x1="${(d + e).toFixed(1)}" y1="${t.toFixed(1)}"
                x2="${(d + u - e).toFixed(1)}" y2="${t.toFixed(1)}"
                stroke="var(--ac-printer-card-bg, #fff)" stroke-opacity="0.14"
                stroke-width="0.8"></line>`);
      }
      return X`
    <g class="ac-apr-print">
      <path d="M${d} ${n} L${d + h} ${n - l} L${d + u - h} ${n - l} L${d + u} ${n} Z"
            fill="${o}" opacity="0.9"></path>
      ${p}
      <path d="M${d} ${n} L${d + h} ${n - l} L${d + h + .32 * u} ${n - l} L${d + .32 * u} ${n} Z"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.07"></path>
      <rect x="${d + h}" y="${(n - l).toFixed(1)}" width="${(u - 2 * h).toFixed(1)}" height="1.6"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.5"></rect>
    </g>`;
    },
    Yn = t => {
      const e = Math.max(0, Math.min(1, t)),
        i = (t, i) => Math.round(t + (i - t) * e);
      return `rgb(${i(255, 255)},${i(180, 79)},${i(84, 33)})`;
    },
    Wn = (t, e, i) => t <= .02 ? J : X`
      <g class="ac-apr-ember">
        <rect x="${e - 11}" y="${i}" width="22" height="10" rx="5"
              fill="${Yn(t)}" opacity="${(.18 * t).toFixed(2)}"></rect>
        <rect x="${e - 15}" y="${i - 1.5}" width="30" height="3" rx="1.5"
              fill="${Yn(t)}" opacity="${(.3 + .6 * t).toFixed(2)}"></rect>
      </g>`,
    qn = (t, e, i, r, n) => t <= .02 ? J : X`
      <rect class="ac-apr-bedember" x="${e}" y="${i}" width="${r}" height="${n}" rx="${n / 2}"
            fill="${Yn(t)}" opacity="${(.25 + .6 * t).toFixed(2)}"></rect>`,
    Xn = (t, e, i, r) => X`
  <g opacity="${t ? .9 : .3}">
    <circle cx="${e}" cy="${i}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.3"></circle>
    <g class="${t ? "ac-apr-fan" : ""}">
      <path d="M${e} ${i - .7 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e + .61 * r} ${i + .35 * r} L${e} ${i} Z" fill="currentColor"></path>
      <path d="M${e + .61 * r} ${i + .35 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e - .61 * r} ${i + .35 * r} L${e} ${i} Z" fill="currentColor" opacity="0.7"></path>
      <path d="M${e - .61 * r} ${i + .35 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e} ${i - .7 * r} L${e} ${i} Z" fill="currentColor" opacity="0.45"></path>
    </g>
  </g>`,
    Qn = (t, e, i, r) => {
      if ("paused" === t) {
        const t = .32 * r;
        return X`<g>
      <rect x="${e - 1.9 * t}" y="${i - .75 * r}" width="${t}" height="${1.5 * r}" rx="${.3 * t}" fill="#e8b33a"></rect>
      <rect x="${e + .9 * t}" y="${i - .75 * r}" width="${t}" height="${1.5 * r}" rx="${.3 * t}" fill="#e8b33a"></rect>
    </g>`;
      }
      return "error" === t ? X`<g>
      <path d="M${e} ${i - r} L${e + r} ${i + .72 * r} L${e - r} ${i + .72 * r} Z"
            fill="none" stroke="#e05252" stroke-width="${.24 * r}" stroke-linejoin="round"></path>
      <rect x="${e - .1 * r}" y="${i - .3 * r}" width="${.2 * r}" height="${.62 * r}" rx="${.1 * r}" fill="#e05252"></rect>
    </g>` : ((t, e, i) => {
        const r = .575 * i;
        return X`
    <g class="ac-apr-logo">
      <path d="M${t} ${e - 1.05 * i} L${t + i} ${e - .9 * r} L${t} ${e + .2 * r} L${t - i} ${e - .9 * r} Z"
            fill="#403f44"></path>
      <path d="M${t - i} ${e - .9 * r} L${t} ${e + .2 * r} L${t} ${e + 1.05 * i} L${t - i} ${e + 1.1 * r} Z"
            fill="#2b262c"></path>
      <path d="M${t + i} ${e - .9 * r} L${t + i} ${e + 1.1 * r} L${t} ${e + 1.05 * i} L${t} ${e + .2 * r} Z"
            fill="#41649a"></path>
    </g>`;
      })(e, i, r);
    },
    Jn = (t, e = 0, i = "M188 88 C 216 94 214 116 196 122", r = !0, n = 0, s = []) => {
      var o;
      return X`
  <g id="ace-${n}">
    <rect x="45" y="6" width="149" height="95" rx="11" fill="currentColor"></rect>
    <rect x="45" y="6" width="149" height="16" rx="8" fill="currentColor"></rect>
    <rect x="56" y="21" width="127" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.28"></rect>
    <rect x="103" y="9" width="34" height="4" rx="2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
    ${jn.map((e, i) => X`
      <rect x="${e - 15}" y="38" width="30" height="40" rx="4" fill="var(--ac-printer-card-bg, #fff)" opacity="0.9"></rect>
      ${((t, e, i) => {
        const r = null != e ? e : "var(--ac-printer-rail, currentColor)",
          n = 11 + 21 * (void 0 === i ? 1 : Math.max(0, Math.min(1, i)));
        return X`
    <rect x="${t - 9}" y="${(42 + (32 - n) / 2).toFixed(1)}" width="18" height="${n.toFixed(1)}" rx="2" fill="${r}"
          stroke="${Zn(e)}" stroke-width="0.75"></rect>
    <rect x="${t - 9}" y="55" width="18" height="5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.25"></rect>`;
      })(e, t[i], s[i])}
      <rect x="${e - 13.5}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>
      <rect x="${e + 9}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>`)}
    ${void 0 === jn[e] ? J : X`<rect x="${jn[e] - 17}" y="36" width="34" height="44" rx="5" fill="none"
                stroke="${null !== (o = t[e]) && void 0 !== o ? o : "currentColor"}" stroke-width="2"></rect>`}
    <rect x="56" y="86" width="127" height="7" rx="3.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.18"></rect>
    <circle cx="186" cy="16" r="2.6" fill="var(--ac-printer-accent, currentColor)"></circle>
  </g>
  <path d="${i}" stroke="${r && t[e] || "var(--ac-printer-rail, currentColor)"}"
        stroke-opacity="0.9" stroke-width="4.5" stroke-linecap="round" fill="none"></path>`;
    },
    ts = {
      kobra_s1: {
        kind: "kobra_s1",
        park: 36,
        viewBox: "0 0 240 240",
        chamber: [16.7, 19.6, 20, 19.2],
        travel: 104,
        body: ({
          gantry: t,
          nozzle: e,
          tip: i = "var(--ac-printer-accent, currentColor)",
          lightOn: r = !1,
          progress: n = 0,
          chamberBusy: s = !1,
          previewUrl: o,
          nozzleHeat: a = 0,
          bedHeat: l = 0,
          fanOn: c = !1,
          status: h = "idle"
        }) => X`
  <g fill="currentColor">
    <rect x="38" y="20" width="163" height="20" rx="5"></rect>
    <rect x="38" y="34" width="11" height="162"></rect>
    <rect x="190" y="34" width="11" height="162"></rect>
    <rect x="38" y="188" width="163" height="26" rx="5"></rect>
    <rect x="47" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
    <rect x="172" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
  </g>
  <rect x="54" y="24" width="94" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.3"></rect>
  <g>
    <rect x="149" y="2" width="46" height="22" rx="3" fill="currentColor"></rect>
    <rect x="152.5" y="5" width="39" height="16" rx="2" fill="#101216"></rect>
    ${Qn(h, 172, 13, 7.5)}
  </g>
  <rect x="146" y="22" width="12" height="6" rx="2" fill="currentColor" opacity="0.85"></rect>
  ${Gn(r, 56, 42, 127, !s)}
  <rect x="49" y="40" width="141" height="148" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6" fill="none"></rect>
  <g fill="currentColor" opacity="0.75">
    <rect x="46" y="56" width="5" height="15" rx="2"></rect>
    <rect x="46" y="155" width="5" height="15" rx="2"></rect>
  </g>
  ${Xn(c, 195.5, 114, 7.5)}
  <path d="M58 46 L82 46 L60 104 L58 104 Z" fill="currentColor" opacity="0.05"></path>
  <path d="M90 46 L100 46 L74 118 L68 118 Z" fill="currentColor" opacity="0.04"></path>
  <g fill="currentColor" opacity="0.22">
    <rect x="47" y="194" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="200" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="206" width="42" height="2.5" rx="1"></rect>
  </g>
  <rect x="56" y="178" width="128" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
  <rect x="64" y="186" width="112" height="3" rx="1.5" fill="currentColor" opacity="0.35"></rect>
  ${qn(s ? 0 : l, 64, 186, 112, 3)}
  ${Kn(!s, n, 56, 128, 178, 66, i, o)}
  <g transform="${t}"
     style="${s ? "display:none" : ""}">
    <rect x="49" y="48" width="141" height="1.6" fill="currentColor" opacity="0.2"></rect>
    <rect x="49" y="52" width="141" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
    <g fill="currentColor" opacity="0.9">
      <rect x="49" y="44" width="13" height="20" rx="2"></rect>
      <rect x="177" y="44" width="13" height="20" rx="2"></rect>
    </g>
    <g class="ac-apr-nozzle" transform="${e}">
      <rect x="102" y="40" width="36" height="25" rx="3" fill="currentColor"></rect>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.28">
        <rect x="107" y="45" width="20" height="2" rx="1"></rect>
        <rect x="107" y="50" width="20" height="2" rx="1"></rect>
        <rect x="107" y="55" width="20" height="2" rx="1"></rect>
      </g>
      <rect x="130" y="44" width="5" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.7"></rect>
      <path d="M113 65 h13 l-2.9 8 h-7.2 Z" fill="currentColor"></path>
      <path d="M115.9 73 h7.2 l-0.6 3 h-6 Z" fill="${i}"></path>
      ${Wn(a, 119.5, 65)}
    </g>
  </g>`
      },
      kobra_3: {
        kind: "kobra_3",
        park: 36,
        viewBox: "0 0 240 240",
        chamber: [19, 24, 30, 24],
        travel: 92,
        body: ({
          gantry: t,
          nozzle: e,
          tip: i = "var(--ac-printer-accent, currentColor)",
          lightOn: r = !1,
          progress: n = 0,
          chamberBusy: s = !1,
          previewUrl: o,
          nozzleHeat: a = 0,
          bedHeat: l = 0,
          fanOn: c = !1,
          status: h = "idle"
        }) => X`
      <g fill="currentColor">
        <rect x="20" y="176" width="200" height="38" rx="7"></rect>
        <rect x="40" y="42" width="18" height="136" rx="3"></rect>
        <rect x="182" y="42" width="18" height="136" rx="3"></rect>
        <rect x="40" y="30" width="160" height="16" rx="5"></rect>
        <rect x="36" y="214" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="180" y="214" width="24" height="8" rx="3" opacity="0.8"></rect>
      </g>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.2">
        <rect x="46" y="52" width="6" height="120" rx="3"></rect>
        <rect x="188" y="52" width="6" height="120" rx="3"></rect>
        <rect x="52" y="35" width="136" height="5" rx="2.5"></rect>
      </g>
      <g fill="currentColor" opacity="0.85">
        <circle cx="52" cy="38" r="5"></circle>
        <circle cx="188" cy="38" r="5"></circle>
      </g>
      <g fill="currentColor" opacity="0.22">
        <rect x="34" y="184" width="44" height="2.5" rx="1"></rect>
        <rect x="34" y="190" width="44" height="2.5" rx="1"></rect>
        <rect x="34" y="196" width="44" height="2.5" rx="1"></rect>
      </g>
      <rect x="146" y="29" width="50" height="15" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="150" y="32" width="42" height="9" rx="2" fill="#101216"></rect>
      ${Qn(h, 171, 36.5, 5)}
      ${Gn(r, 52, 47, 136, !s)}
      <rect x="54" y="177" width="132" height="3" rx="1.5" fill="var(--ac-printer-rail, currentColor)" opacity="0.5"></rect>
      <rect x="62" y="166" width="116" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <rect x="70" y="174" width="100" height="4" rx="2" fill="currentColor" opacity="0.35"></rect>
      ${qn(s ? 0 : l, 70, 174, 100, 4)}
      ${Kn(!s, n, 62, 116, 166, 58, i, o)}
      ${Xn(c, 30, 196, 7)}
      <g transform="${t}"
     style="${s ? "display:none" : ""}">
        <rect x="42" y="54" width="156" height="1.6" fill="currentColor" opacity="0.2"></rect>
        <rect x="42" y="58" width="156" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="42" y="50" width="12" height="20" rx="2"></rect>
          <rect x="186" y="50" width="12" height="20" rx="2"></rect>
        </g>
        <g class="ac-apr-nozzle" transform="${e}">
          <rect x="102" y="46" width="36" height="25" rx="3" fill="currentColor"></rect>
          <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.28">
            <rect x="107" y="51" width="20" height="2" rx="1"></rect>
            <rect x="107" y="56" width="20" height="2" rx="1"></rect>
            <rect x="107" y="61" width="20" height="2" rx="1"></rect>
          </g>
          <rect x="130" y="50" width="5" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.7"></rect>
          <path d="M113 71 h13 l-2.9 8 h-7.2 Z" fill="currentColor"></path>
          <path d="M115.9 79 h7.2 l-0.6 3 h-6 Z" fill="${i}"></path>
          ${Wn(a, 119.5, 71)}
        </g>
      </g>`
      },
      fdm: {
        kind: "fdm",
        park: 34,
        viewBox: "0 0 240 240",
        chamber: [20, 19.2, 29, 19.2],
        travel: 92,
        body: ({
          gantry: t,
          nozzle: e,
          tip: i = "var(--ac-printer-accent, currentColor)",
          lightOn: r = !1,
          progress: n = 0,
          chamberBusy: s = !1,
          previewUrl: o,
          nozzleHeat: a = 0,
          bedHeat: l = 0,
          fanOn: c = !1,
          status: h = "idle"
        }) => X`
      <g fill="currentColor">
        <rect x="24" y="178" width="192" height="34" rx="6"></rect>
        <rect x="30" y="46" width="16" height="132" rx="3"></rect>
        <rect x="194" y="46" width="16" height="132" rx="3"></rect>
        <rect x="30" y="34" width="180" height="14" rx="4"></rect>
      </g>
      <rect x="46" y="52" width="148" height="126" stroke="currentColor" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="5 6" fill="none"></rect>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.18">
        <rect x="35" y="52" width="6" height="120" rx="3"></rect>
        <rect x="199" y="52" width="6" height="120" rx="3"></rect>
      </g>
      <rect x="60" y="170" width="120" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <rect x="68" y="178" width="104" height="4" rx="2" fill="currentColor" opacity="0.35"></rect>
      ${qn(s ? 0 : l, 68, 178, 104, 4)}
      ${Kn(!s, n, 60, 120, 170, 60, i, o)}
      ${Xn(c, 34, 200, 6.5)}
      <rect x="154" y="33" width="50" height="16" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="158" y="36" width="42" height="10" rx="2" fill="#101216"></rect>
      ${Qn(h, 179, 41, 5)}
      ${Gn(r, 46, 52, 148, !s)}
      <g fill="currentColor" opacity="0.2">
        <rect x="36" y="188" width="40" height="2.5" rx="1"></rect>
        <rect x="36" y="194" width="40" height="2.5" rx="1"></rect>
      </g>
      <g transform="${t}"
     style="${s ? "display:none" : ""}">
        <rect x="32" y="60" width="176" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="32" y="52" width="12" height="20" rx="2"></rect>
          <rect x="196" y="52" width="12" height="20" rx="2"></rect>
        </g>
        <g class="ac-apr-nozzle" transform="${e}">
          <rect x="104" y="48" width="32" height="24" rx="3" fill="currentColor"></rect>
          <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.26">
            <rect x="109" y="53" width="18" height="2" rx="1"></rect>
            <rect x="109" y="58" width="18" height="2" rx="1"></rect>
            <rect x="109" y="63" width="18" height="2" rx="1"></rect>
          </g>
          <path d="M113 72 h13 l-3 7.5 h-7 Z" fill="currentColor"></path>
          <path d="M116 79.5 h7 l-0.5 2.5 h-6 Z" fill="${i}"></path>
          ${Wn(a, 119.5, 72)}
        </g>
      </g>`
      },
      resin: {
        kind: "resin",
        park: 0,
        viewBox: "0 0 240 240",
        chamber: [16, 26, 38, 26],
        travel: 76,
        body: ({
          gantry: t,
          tip: e = "var(--ac-printer-accent, currentColor)",
          progress: i = 0,
          chamberBusy: r = !1,
          status: n = "idle"
        }) => X`
      <path d="M74 34 h92 a8 8 0 0 1 8 8 v108 h-108 v-108 a8 8 0 0 1 8 -8 Z" stroke="currentColor" stroke-opacity="0.45" stroke-width="4" fill="none"></path>
      <g fill="currentColor">
        <rect x="36" y="150" width="168" height="62" rx="8"></rect>
        <rect x="52" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="164" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="58" y="40" width="16" height="110" rx="4"></rect>
      </g>
      <rect x="104" y="26" width="36" height="6" rx="3" fill="currentColor" opacity="0.5"></rect>
      <rect x="63" y="46" width="5" height="100" rx="2.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
      <rect x="130" y="162" width="60" height="26" rx="5" fill="currentColor" opacity="0.9"></rect>
      <rect x="136" y="168" width="48" height="14" rx="3" fill="#101216"></rect>
      ${Qn(n, 160, 175, 5.5)}
      <g fill="currentColor" opacity="0.2">
        <rect x="50" y="176" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="182" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="188" width="46" height="2.5" rx="1"></rect>
      </g>
      <path d="M80 126 h84 l-6 24 h-72 Z" fill="currentColor" opacity="0.28"></path>
      <path d="M85 137 h74" stroke="${e}" stroke-opacity="0.75" stroke-width="3"></path>
      <rect x="78" y="118" width="96" height="8" rx="2" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <g transform="${t}">
        <rect x="70" y="46" width="14" height="10" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.7"></rect>
        <g>
          <rect x="84" y="48" width="66" height="6" rx="2" fill="currentColor"></rect>
          <rect x="96" y="54" width="42" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.8"></rect>
        </g>
        ${((t, e, i) => {
          if (!t || e <= .005) return J;
          const r = 40 * Math.min(1, e),
            n = 106;
          return X`
    <g class="ac-apr-print">
      <path d="M${n} ${68} L${128} ${68} L${124} ${(68 + r).toFixed(1)} L${110} ${(68 + r).toFixed(1)} Z"
            fill="${i}" opacity="0.8"></path>
    </g>`;
        })(!r, i, e)}
      </g>`
      }
    },
    es = [["kobra s1", "kobra_s1"], ["kobra 3", "kobra_3"], ["kobra 2", "kobra_3"], ["photon", "resin"], ["mono", "resin"], ["m5s", "resin"], ["m7", "resin"], ["kobra", "kobra_3"]],
    is = (t, e, i) => i ? `translate(0 ${-t.park})` : `translate(0 ${(t.travel * (1 - e / 100)).toFixed(1)})`,
    rs = (t, e = 48) => `translate(${(t * e).toFixed(1)} 0)`;
  const ns = {
      black: "#1c1c1e",
      white: "#f2f2f0",
      grey: "#8a9099",
      gray: "#8a9099",
      silver: "#c2c7cc",
      red: "#d94a3d",
      orange: "#e07a2f",
      yellow: "#e8b33a",
      green: "#3aa87a",
      blue: "#2f7fd1",
      purple: "#7a5cd1",
      pink: "#d9679b",
      brown: "#8a5a3b",
      clear: "#cfd8de",
      natural: "#e6ded2",
      transparent: "#cfd8de"
    },
    ss = "var(--ac-printer-accent, currentColor)";
  const os = t => {
      const [,, e, i] = t.viewBox.split(/\s+/).map(Number);
      return `${e} / ${i}`;
    },
    as = t => t.chamber.map(t => `${t}%`).join(" "),
    ls = (t, e, i = Vn, r = 0, n = []) => e > 0 ? function (t, e, i = Vn, r = 0, n = []) {
      if (e < 1) return t;
      const s = 101 * e + 14,
        o = 221 + s + 8,
        [a, l, c, h] = t.chamber,
        d = a / 100 * 240,
        u = 240 - c / 100 * 240;
      return Object.assign(Object.assign({}, t), {
        kind: "kobra_s1" === t.kind ? "kobra_s1_combo" : t.kind,
        viewBox: `0 0 240 ${o}`,
        chamber: [+((d + s) / o * 100).toFixed(2), l, +((o - (u + s)) / o * 100).toFixed(2), h],
        body: o => X`
      ${Array.from({
          length: e
        }, (t, o) => {
          const a = s - 101 * o,
            l = Math.floor(r / 4) === o,
            c = 0 === o && 2 === e ? `M188 88 C 214 94 219 106 219 130 L 219 ${a + 8} C 219 ${a + 17} 210 ${a + 21} 200 ${a + 22}` : `M188 88 C 216 94 214 ${a + 12} 196 ${a + 22}`,
            h = i.slice(4 * o, 4 * o + 4),
            d = n.slice(4 * o, 4 * o + 4);
          return X`<g transform="translate(0 ${101 * o})">
          ${Jn(h, l ? r - 4 * o : -1, c, l, o, d)}
        </g>`;
        })}
      <g transform="translate(0 ${s})">${t.body(o)}</g>`
      });
    }(t, e, i, r, n) : Object.assign(Object.assign({}, t), {
      body: e => X`
          ${((t = "var(--ac-printer-accent, currentColor)", e = 70, i = 219.5) => X`
  <g>
    <path d="M${i - 7.5} ${e - 12} C ${i - 7.5} ${e - 26} ${i - 13.5} ${e - 34} ${i - 31.5} ${e - 32}" stroke="${t}"
          stroke-opacity="0.9" stroke-width="3.5" stroke-linecap="round" fill="none"></path>
    <rect x="${i - 23.5}" y="${e - 3}" width="16" height="6" rx="3" fill="currentColor" opacity="0.85"></rect>
    <rect x="${i - 8.5}" y="${e - 18}" width="17" height="36" rx="2" fill="${t}"
          stroke="${Zn(t)}" stroke-width="0.75"></rect>
    <!-- Wound filament: a couple of banded highlights so the reel reads as
         coiled material rather than a solid block of colour. -->
    <rect x="${i - 8.5}" y="${e - 13}" width="17" height="1.2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.16"></rect>
    <rect x="${i - 8.5}" y="${e + 10}" width="17" height="1.2" fill="#000" opacity="0.14"></rect>
    <!-- The hub, which is what makes it a reel seen edge-on and not a pill. -->
    <rect x="${i - 8.5}" y="${e - 4.5}" width="17" height="9" rx="1"
          fill="var(--ac-printer-card-bg, #fff)" opacity="0.30"></rect>
    <rect x="${i - 2.2}" y="${e - 3}" width="4.4" height="6" rx="1"
          fill="currentColor" opacity="0.55"></rect>
    <rect x="${i - 12.5}" y="${e - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
    <rect x="${i + 7.5}" y="${e - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
  </g>`)(e.tip, "kobra_3" === t.kind ? 80 : 70, "fdm" === t.kind ? 222 : 219.5)}
          ${t.body(e)}`
    });
  let cs = class extends mt {
    constructor() {
      super(...arguments), this._progressNum = 0, this._isPrinting = !1, this._lightOn = !1;
    }
    willUpdate(t) {
      var e;
      if (super.willUpdate(t), !t.has("hass") && !t.has("printerEntities") && !t.has("printerEntityIdPart")) return;
      const i = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_preview");
      this.imagePreviewUrl !== i && (this.imagePreviewUrl = i, this.imagePreviewBgUrl = i ? `url('${i}')` : void 0);
      const r = Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_progress", 0).state);
      this._progressNum = Number.isFinite(r) ? r / 100 : 0, this._isPrinting = gi(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state").state.toLowerCase()), this._lightOn = "on" === (null === (e = ri(this.hass, this.printerEntities, "printer_light")) || void 0 === e ? void 0 : e.state);
    }
    _machineName() {
      var t;
      for (const e in this.printerEntities) {
        const i = this.printerEntities[e].device_id,
          r = i ? this.hass.devices[i] : void 0;
        if (r) return null !== (t = r.model) && void 0 !== t ? t : r.name;
      }
    }
    _spoolState() {
      var t;
      const e = t => {
          const e = ri(this.hass, this.printerEntities, t),
            i = null == e ? void 0 : e.attributes.spool_info;
          return Array.isArray(i) ? i : [];
        },
        i = e("ace_spools"),
        r = e("secondary_ace_spools"),
        n = r.length ? 2 : i.length ? 1 : 0,
        s = [...i, ...r],
        o = s.map(t => {
          var e, i;
          return function (t) {
            var e;
            if (!t) return ss;
            const i = String(t).trim();
            return /^#[0-9a-f]{8}$/i.test(i) ? i.slice(0, 7) : /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(i) ? i : /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(i) ? "#" + i.slice(0, 6) : /^(rgb|hsl)a?\(/i.test(i) ? i : null !== (e = ns[i.toLowerCase()]) && void 0 !== e ? e : ss;
          }(null !== (e = t.color_hex) && void 0 !== e ? e : (i = t.color, Array.isArray(i) && i.length >= 3 ? "#" + i.slice(0, 3).map(t => Math.max(0, Math.min(255, Math.round(t))).toString(16).padStart(2, "0")).join("") : void 0));
        }),
        a = s.map(t => "number" == typeof t.consumables_percent ? Math.max(0, Math.min(1, t.consumables_percent / 100)) : void 0),
        l = null === (t = ri(this.hass, this.printerEntities, "ace_spools")) || void 0 === t ? void 0 : t.attributes.box_info,
        c = null == l ? void 0 : l.loaded_slot;
      return {
        spools: o,
        active: "number" == typeof c && c > 0 ? c - 1 : 0,
        units: n,
        remaining: a
      };
    }
    _heat(t, e) {
      const i = t => Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, t, 0).state),
        r = i(e);
      if (!Number.isFinite(r) || r <= 0) return 0;
      const n = i(t);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, (n - 20) / Math.max(1, r - 20))) : 0;
    }
    _status() {
      var t;
      if ("on" === (null === (t = ri(this.hass, this.printerEntities, "job_is_paused")) || void 0 === t ? void 0 : t.state)) return "paused";
      const e = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state").state.toLowerCase();
      return e.includes("fail") || e.includes("error") ? "error" : this._isPrinting ? "printing" : "idle";
    }
    _art() {
      var t;
      const {
        spools: e,
        active: i,
        units: r,
        remaining: n
      } = this._spoolState();
      return function (t, e = 0, i, r, n = 0, s = []) {
        const o = (null != t ? t : "").toLowerCase();
        let a = "fdm",
          l = e;
        if ("kobra_s1_combo" === i) a = "kobra_s1", l = l > 0 ? l : 1;else if (i && Object.prototype.hasOwnProperty.call(ts, i)) a = i;else for (const [t, e] of es) if (o.includes(t)) {
          a = e;
          break;
        }
        const c = ts[a];
        return "resin" === a ? c : ls(c, l, r, n, s);
      }(this._machineName(), r, null !== (t = this.printerArt) && void 0 !== t ? t : null, e, i, n);
    }
    render() {
      var t;
      const e = this._art(),
        {
          spools: i,
          active: r
        } = this._spoolState(),
        n = null !== (t = i[r]) && void 0 !== t ? t : void 0,
        s = Boolean(this.cameraEntityId);
      return q`
      <div
        class="ac-printercard-animatedprinter"
        style=${Li({
        "--ac-apr-chamber": as(e),
        "--ac-apr-aspect": os(e)
      })}
      >
        ${s ? q`
              <anycubic-printercard-camera_stream
                class="ac-apr-camera"
                .hass=${this.hass}
                .cameraEntityId=${this.cameraEntityId}
              ></anycubic-printercard-camera_stream>
            ` : J}
        ${((t, e = {}) => {
        var i, r;
        return q` <svg
    class="ac-apr-svg"
    viewBox=${t.viewBox}
    fill="none"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    ${t.body(Object.assign(Object.assign({}, e), {
          gantry: is(t, 100 * (null !== (i = e.progress) && void 0 !== i ? i : 0), !!e.cameraLive),
          chamberBusy: !!e.cameraLive,
          nozzle: rs(null !== (r = e.nozzleX) && void 0 !== r ? r : 0)
        }))}
  </svg>`;
      })(e, {
        progress: this._progressNum,
        cameraLive: s,
        previewUrl: s ? void 0 : this.imagePreviewUrl,
        tip: n,
        lightOn: this._lightOn,
        nozzleHeat: this._heat("nozzle_temperature", "target_nozzle_temperature"),
        bedHeat: this._heat("hotbed_temperature", "target_hotbed_temperature"),
        fanOn: Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state) > 0,
        status: this._status()
      })}
      </div>
    `;
    }
    static get styles() {
      return u`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        /* Without this the host has no definite height for max-height to
           resolve against, and the cap silently does nothing. */
        min-height: 0;
      }

      /* The wrapper carries the drawing's own aspect ratio, and is capped by
         BOTH dimensions of whatever box the card gives it.

         This is what stops the printer rendering enormous. width:100% on the
         SVG alone means its height just follows the aspect ratio with nothing
         to cap it, and a Combo with two ACE units is nearly twice as tall as
         it is wide. Constraining the wrapper rather than letting the SVG
         letterbox inside it also keeps the camera aligned: the stream is
         positioned by percentage inset OF THIS BOX, so if the drawing did not
         fill it exactly, the chamber hole would stop lining up with the video
         behind it. */
      .ac-printercard-animatedprinter {
        position: relative;
        aspect-ratio: var(--ac-apr-aspect, 1 / 1);
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        overflow: hidden;
      }

      /* Both of these fill exactly the chamber hole in the artwork, which is
         negative space, so the SVG frames them rather than covering them.
         The inset comes from the art itself because it moves with ACE count. */
      /* The chamber is a hole in the artwork, so whatever sits behind it must
         be clipped to that hole. The stream is the reason: its <video> is in a
         shadow root we cannot reach and sizes itself, so without clipping here
         it renders at its own aspect ratio and spills out past the chassis. */
      .ac-apr-camera,
      .ac-apr-imgprev {
        position: absolute;
        inset: var(--ac-apr-chamber, 0);
        z-index: 0;
        overflow: hidden;
        /* The camera is a custom element whose own :host sets width and height
           to 100%. An explicit size beats the four inset edges, so without
           these the stream filled the whole wrapper instead of the chamber
           hole -- measured on the live card as 115x165 against a chamber that
           should be about 71x105. Styles from here outrank :host, so auto
           hands sizing back to the insets. */
        width: auto;
        height: auto;
      }

      /* The stream is 16:9 and the chamber hole is nearly square, so filling
         the hole meant object-fit: cover cropping away about 46% of the
         width -- you saw a narrow centre slice of the bed, heavily zoomed in.
         The <video> lives in ha-camera-stream's shadow root and cannot be
         restyled from here, so the BOX is matched to the stream instead: at
         16:9 inside the hole, cover and contain agree and nothing is cropped.
         Centred with margin:auto against the four inset edges. */
      .ac-apr-camera {
        background-color: #000;
        aspect-ratio: 16 / 9;
        max-width: 100%;
        max-height: 100%;
        margin: auto;
      }

      .ac-apr-imgprev {
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center bottom;
      }

      /* Sits over the stream, and must never swallow clicks meant for the
         card underneath. */
      .ac-apr-svg {
        position: relative;
        z-index: 1;
        pointer-events: none;
        display: block;
        width: 100%;
        height: 100%;
        color: var(--primary-text-color);
        --ac-printer-accent: var(
          --state-icon-active-color,
          var(--primary-color)
        );
        --ac-printer-rail: var(--secondary-text-color);
        --ac-printer-plate: var(--divider-color);
        --ac-printer-card-bg: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        --ac-printer-light: #ffd88a;
      }

      /* The head sweeps only while a job is running. Driven from CSS rather
         than axis data, which the printer does not report often enough to
         animate from -- when it is wired, replace this with nozzleTransform.

         Targeted by CLASS, not id. It was an id, and an unrelated cleanup that
         removed the artwork's document-global ids silently killed the sweep:
         the rule kept matching nothing and the head simply stopped moving. A
         class cannot collide between two cards, so it satisfies both. */
      .ac-apr-svg .ac-apr-nozzle {
        transform-box: fill-box;
        transform-origin: center;
      }

      :host([printing]) .ac-apr-svg .ac-apr-nozzle {
        animation: ac-apr-sweep 4.4s ease-in-out infinite;
      }

      @keyframes ac-apr-sweep {
        0%,
        100% {
          transform: translateX(-46px);
        }
        50% {
          transform: translateX(46px);
        }
      }

      .ac-apr-svg .ac-apr-fan {
        transform-box: fill-box;
        transform-origin: center;
        animation: ac-apr-spin 1.1s linear infinite;
      }

      @keyframes ac-apr-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Motion is the whole point of both of these, so under reduced-motion
         they stop rather than slow: the fan still reads as running from its
         opacity, and the head from its position. */
      @media (prefers-reduced-motion: reduce) {
        :host([printing]) .ac-apr-svg .ac-apr-nozzle,
        .ac-apr-svg .ac-apr-fan {
          animation: none;
        }
      }
    `;
    }
    updated(t) {
      super.updated(t), this.toggleAttribute("printing", this._isPrinting);
    }
  };
  n([_t()], cs.prototype, "hass", void 0), n([_t({
    attribute: "scale-factor"
  })], cs.prototype, "scaleFactor", void 0), n([_t({
    attribute: "printer-config"
  })], cs.prototype, "printerConfig", void 0), n([_t({
    attribute: "printer-entities"
  })], cs.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], cs.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "camera-entity-id"
  })], cs.prototype, "cameraEntityId", void 0), n([_t({
    attribute: "printer-art"
  })], cs.prototype, "printerArt", void 0), n([vt()], cs.prototype, "_progressNum", void 0), n([vt()], cs.prototype, "_isPrinting", void 0), n([vt()], cs.prototype, "_lightOn", void 0), n([vt()], cs.prototype, "imagePreviewUrl", void 0), n([vt()], cs.prototype, "imagePreviewBgUrl", void 0), cs = n([$t("anycubic-printercard-animated_printer")], cs);
  let hs = class extends mt {
    constructor() {
      super(...arguments), this._viewClick = () => {
        this.toggleVideo && this.toggleVideo();
      };
    }
    render() {
      return q`
      <div class="ac-printercard-printerview" @click=${this._viewClick}>
        <anycubic-printercard-animated_printer
          .hass=${this.hass}
          .scaleFactor=${this.scaleFactor}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
          .printerConfig=${zn}
          .cameraEntityId=${this.cameraEntityId}
          .printerArt=${this.printerArt === Ht.Auto ? void 0 : this.printerArt}
        ></anycubic-printercard-animated_printer>
      </div>
    `;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-printercard-printerview {
        height: 100%;
        box-sizing: border-box;
      }
    `;
    }
  };
  n([_t()], hs.prototype, "hass", void 0), n([_t({
    attribute: "toggle-video",
    type: Function
  })], hs.prototype, "toggleVideo", void 0), n([_t({
    attribute: "printer-entities"
  })], hs.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], hs.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "scale-factor"
  })], hs.prototype, "scaleFactor", void 0), n([_t({
    attribute: "camera-entity-id"
  })], hs.prototype, "cameraEntityId", void 0), n([_t({
    attribute: "printer-art"
  })], hs.prototype, "printerArt", void 0), hs = n([$t("anycubic-printercard-printer_view")], hs);
  let ds = class extends mt {
    constructor() {
      super(...arguments), this.mediaView = Mt.Auto, this.noCamera = !1, this.language = "en", this.isPrinting = !1, this._previewFailed = !1, this._previewLoadFailed = () => {
        this._previewFailed = !0, this._selected === Mt.Preview && (this._selected = void 0);
      }, this._selectTab = t => {
        this._selected = t.currentTarget.tabKey;
      };
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("hass") || t.has("printerEntityIdPart")) {
        const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_preview");
        t !== this._previewUrl && (this._previewUrl = t, this._previewFailed = !1);
      }
    }
    _defaultTab() {
      return this._usablePreview() ? Mt.Preview : Mt.Printer;
    }
    _usablePreview() {
      return !!this._previewUrl && !this._previewFailed;
    }
    _availableTabs() {
      const t = [];
      return this.camera && !this.noCamera && t.push({
        key: Mt.Camera,
        icon: "M6.03 12.03L8.03 15.5L5.5 18.68L2 12.62L6.03 12.03M17 18V15.29C17.88 14.9 18.5 14.03 18.5 13C18.5 12.43 18.3 11.9 17.97 11.5L19.94 10.35C20.95 9.76 21.3 8.47 20.71 7.46L19.33 5.06C18.74 4.05 17.45 3.7 16.44 4.28L8.31 9C7.36 9.53 7.03 10.75 7.58 11.71L9.08 14.31C9.63 15.26 10.86 15.59 11.81 15.04L13.69 13.96C13.94 14.55 14.41 15.03 15 15.29V18C15 19.1 15.9 20 17 20H22V18H17Z",
        label: Nn("card.media_view.tabs.camera", this.language)
      }), this._usablePreview() && t.push({
        key: Mt.Preview,
        icon: "M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z",
        label: Nn("card.media_view.tabs.preview", this.language)
      }), t.push({
        key: Mt.Printer,
        icon: "M19,6A1,1 0 0,0 20,5A1,1 0 0,0 19,4A1,1 0 0,0 18,5A1,1 0 0,0 19,6M19,2A3,3 0 0,1 22,5V11H18V7H6V11H2V5A3,3 0 0,1 5,2H19M18,18.25C18,18.63 17.79,18.96 17.47,19.13L12.57,21.82C12.4,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L6.53,19.13C6.21,18.96 6,18.63 6,18.25V13C6,12.62 6.21,12.29 6.53,12.12L11.43,9.68C11.59,9.56 11.79,9.5 12,9.5C12.21,9.5 12.4,9.56 12.57,9.68L17.47,12.12C17.79,12.29 18,12.62 18,13V18.25M12,11.65L9.04,13L12,14.6L14.96,13L12,11.65M8,17.66L11,19.29V16.33L8,14.71V17.66M16,17.66V14.71L13,16.33V19.29L16,17.66Z",
        label: Nn("card.media_view.tabs.printer", this.language)
      }), this._usablePreview() && this.camera && t.push({
        key: Mt.PrinterModel,
        icon: "M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z",
        label: Nn("card.media_view.tabs.printer_model", this.language)
      }), t;
    }
    _activeTab() {
      var t;
      const e = this._availableTabs(),
        i = null !== (t = this._selected) && void 0 !== t ? t : this.mediaView === Mt.Auto ? this._defaultTab() : this.mediaView;
      return e.some(t => t.key === i) ? i : Mt.Printer;
    }
    _renderTabs(t, e) {
      return t.map(t => q`
        <button
          class="ac-media-tab ${Bi({
        "ac-media-tab-active": t.key === e
      })}"
          title=${t.label}
          aria-label=${t.label}
          aria-pressed=${t.key === e ? "true" : "false"}
          .tabKey=${t.key}
          @click=${this._selectTab}
        >
          <ha-svg-icon .path=${t.icon}></ha-svg-icon>
        </button>
      `);
    }
    render() {
      var t;
      if (this.mediaView === Mt.None) return J;
      const e = this._activeTab(),
        i = this._availableTabs();
      return q`
      <div
        class="ac-media ${Bi({
        "ac-media-tall": e === Mt.Printer || e === Mt.PrinterModel
      })}"
      >
        <div class="ac-media-surface">${this._renderSurface(e)}</div>
        ${i.length > 1 ? q`
              <div class="ac-media-tabs">${this._renderTabs(i, e)}</div>
            ` : J}
        ${e === Mt.Camera && (null === (t = this.camera) || void 0 === t ? void 0 : t.isCloud) ? q`<div class="ac-media-badge">LIVE</div>` : J}
      </div>
    `;
    }
    _renderSurface(t) {
      return t === Mt.Camera && this.camera && !this.noCamera ? q`
        <anycubic-printercard-camera_stream
          .hass=${this.hass}
          .cameraEntityId=${this.camera.entity_id}
        ></anycubic-printercard-camera_stream>
      ` : t === Mt.Preview && this._usablePreview() ? q`
        <img
          class="ac-media-preview"
          src=${this._previewUrl}
          alt="Job preview"
          @error=${this._previewLoadFailed}
        />
      ` : q`
      <anycubic-printercard-printer_view
        .hass=${this.hass}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .scaleFactor=${1}
        .cameraEntityId=${this._insetCameraEntityId()}
        .printerArt=${this.printerArt}
      ></anycubic-printercard-printer_view>
    `;
    }
    _insetCameraEntityId() {
      if (this.noCamera || !this.camera || !this.camera.available) return;
      if (this._activeTab() === Mt.PrinterModel) return;
      return this._selected === Mt.Printer || this.mediaView === Mt.Printer ? this.camera.entity_id : void 0;
    }
    static get styles() {
      return u`
      :host {
        display: block;
      }

      .ac-media {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 12px;
        overflow: hidden;
        background: var(--ac-media-background);
        box-sizing: border-box;
      }

      /* The printer silhouette is drawn tall; 16:9 crops its frame. It also
         reads better standing on the card than boxed in a panel. */
      .ac-media-tall {
        aspect-ratio: 4 / 3;
        background: transparent;
      }

      .ac-media-tall .ac-media-surface {
        padding: 8px 0;
      }

      .ac-media-tall .ac-media-tabs {
        background: var(--ac-overlay-background-solid);
      }

      .ac-media-surface {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ac-media-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: var(--ac-media-background);
      }

      anycubic-printercard-printer_view {
        width: 100%;
        height: 100%;
      }

      .ac-media-tabs {
        position: absolute;
        left: 8px;
        bottom: 8px;
        display: flex;
        flex-direction: row;
        gap: 2px;
        padding: 2px;
        border-radius: 999px;
        background: var(--ac-overlay-background);
        backdrop-filter: blur(8px);
      }

      .ac-media-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--ac-overlay-text);
        cursor: pointer;
        --mdc-icon-size: 18px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-media-tab:hover {
        background: var(--ac-overlay-hover);
      }

      .ac-media-tab-active {
        background: var(--ac-overlay-active);
        color: var(--ac-overlay-active-text);
      }

      .ac-media-badge {
        position: absolute;
        right: 8px;
        top: 8px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #fff;
        background: #e5484d;
      }
    `;
    }
  };
  /**
       * @license
       * Copyright 2021 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  function* us(t, e) {
    if (void 0 !== t) {
      let i = 0;
      for (const r of t) yield e(r, i++);
    }
  }
  n([_t()], ds.prototype, "hass", void 0), n([_t({
    attribute: "printer-entities"
  })], ds.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], ds.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "media-view"
  })], ds.prototype, "mediaView", void 0), n([_t({
    attribute: "printer-art"
  })], ds.prototype, "printerArt", void 0), n([_t({
    attribute: "no-camera",
    type: Boolean
  })], ds.prototype, "noCamera", void 0), n([_t()], ds.prototype, "language", void 0), n([_t({
    attribute: !1
  })], ds.prototype, "camera", void 0), n([_t({
    attribute: "is-printing",
    type: Boolean
  })], ds.prototype, "isPrinting", void 0), n([vt()], ds.prototype, "_selected", void 0), n([vt()], ds.prototype, "_previewUrl", void 0), n([vt()], ds.prototype, "_previewFailed", void 0), ds = n([$t("anycubic-printercard-media_view")], ds);
  const ps = "secondary_",
    gs = "ace_run_out_refill",
    ms = ps + gs,
    bs = "ace_spools",
    fs = ps + bs;
  let ys = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this._runoutRefillId = gs, this._spoolsEntityId = bs, this.spoolList = [], this.selectedIndex = -1, this.selectedMaterialType = "", this.selectedColor = [0, 0, 0], this._changingRunout = !1, this._openDryingModal = () => {
        We(this, "ac-mcbdry-modal", {
          modalOpen: !0,
          box_id: this.box_id
        });
      }, this._handleRunoutRefillChanged = t => {
        var e, i;
        this._changingRunout || (this._changingRunout = !0, this.hass.callService("switch", "toggle", {
          entity_id: null !== (i = null === (e = ai(this.printerEntities, this.printerEntityIdPart, "switch", this._runoutRefillId)) || void 0 === e ? void 0 : e.entity_id) && void 0 !== i ? i : oi(this.printerEntityIdPart, "switch", this._runoutRefillId)
        }).then(() => {
          this._changingRunout = !1;
        }).catch(t => {
          this._changingRunout = !1;
        }));
      }, this._editSpool = t => {
        const e = t.currentTarget.index,
          i = t.currentTarget.material_type,
          r = t.currentTarget.color;
        We(this, "ac-mcb-modal", {
          modalOpen: !0,
          box_id: this.box_id,
          spool_index: e,
          material_type: i,
          color: r
        });
      };
    }
    willUpdate(t) {
      var e, i, r, n;
      super.willUpdate(t), t.has("language") && (this._buttonRefill = Nn("card.buttons.runout_refill", this.language), this._buttonDry = Nn("card.buttons.dry", this.language)), t.has("box_id") && (1 === this.box_id ? (this._runoutRefillId = ms, this._spoolsEntityId = fs) : (this._runoutRefillId = gs, this._spoolsEntityId = bs)), (t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) && (this.spoolList = ui(this.hass, this.printerEntities, this.printerEntityIdPart, this._spoolsEntityId, "not loaded", {
        spool_info: []
      }).attributes.spool_info, this._runoutRefillState = (e = this.hass, i = this.printerEntities, r = this.printerEntityIdPart, n = this._runoutRefillId, Je(e, ai(i, r, "switch", n))));
    }
    render() {
      return q`
      <div class="ac-printercard-mcbview">
        <div class="ac-printercard-mcbmenu ac-printercard-menuleft">
          <div class="ac-switch" @click=${this._handleRunoutRefillChanged}>
            <div class="ac-switch-label">${this._buttonRefill}</div>
            <ha-entity-toggle
              .hass=${this.hass}
              .stateObj=${this._runoutRefillState}
            ></ha-entity-toggle>
          </div>
        </div>
        <div class="ac-printercard-spoolcont">${this._renderSpools()}</div>
        <div class="ac-printercard-mcbmenu ac-printercard-menuright">
          <ha-control-button @click=${this._openDryingModal}>
            <ha-svg-icon .path=${"M7.95,3L6.53,5.19L7.95,7.4H7.94L5.95,10.5L4.22,9.6L5.64,7.39L4.22,5.19L6.22,2.09L7.95,3M13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L11.95,10.4L10.22,9.5L11.64,7.3L10.22,5.1L12.22,2L13.95,2.89M20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89M2,22V14A2,2 0 0,1 4,12H20A2,2 0 0,1 22,14V22H20V20H4V22H2M6,14A1,1 0 0,0 5,15V17A1,1 0 0,0 6,18A1,1 0 0,0 7,17V15A1,1 0 0,0 6,14M10,14A1,1 0 0,0 9,15V17A1,1 0 0,0 10,18A1,1 0 0,0 11,17V15A1,1 0 0,0 10,14M14,14A1,1 0 0,0 13,15V17A1,1 0 0,0 14,18A1,1 0 0,0 15,17V15A1,1 0 0,0 14,14M18,14A1,1 0 0,0 17,15V17A1,1 0 0,0 18,18A1,1 0 0,0 19,17V15A1,1 0 0,0 18,14Z"}></ha-svg-icon>
            ${this._buttonDry}
          </ha-control-button>
        </div>
      </div>
    `;
    }
    _renderSpools() {
      return us(this.spoolList, (t, e) => {
        const i = {
          "background-color": t.spool_loaded ? `rgb(${t.color[0]}, ${t.color[1]}, ${t.color[2]})` : "#aaa"
        };
        return q`
          <div
            class="ac-spool-info"
            .index=${e}
            .material_type=${t.material_type}
            .color=${t.color}
            @click=${this._editSpool}
          >
            <div class="ac-spool-color-ring-cont">
              <div
                class="ac-spool-color-ring-inner"
                style=${Li(i)}
              >
                <div class="ac-spool-color-num">${e + 1}</div>
              </div>
            </div>
            <div class="ac-spool-material-type">
              ${t.spool_loaded ? t.material_type : "---"}
            </div>
          </div>
        `;
      });
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-printercard-mcbview {
        height: 100%;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-sizing: border-box;
        width: 100%;
      }

      .ac-printercard-mcbmenu {
        height: 100%;
        position: relative;
        width: 10.42%;
      }

      .ac-printercard-spoolcont {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        width: 62.5%;
      }

      .ac-spool-info {
        box-sizing: border-box;
        height: auto;
        cursor: pointer;
        width: 25%;
        padding: 5px;
      }

      .ac-spool-color-ring-cont {
        position: relative;
        width: 100%;
        box-sizing: border-box;
      }

      .ac-spool-color-ring-cont:before {
        content: "";
        display: block;
        padding-top: 100%;
      }

      .ac-spool-color-ring-inner {
        position: absolute;
        top: 0px;
        left: 0px;
        bottom: 0px;
        right: 0px;
        background-color: #aaa;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .ac-spool-color-num {
        font-weight: 900;
        box-sizing: border-box;
        border-radius: 50%;
        background-color: #eee;
        width: 46.5%;
        height: 46.5%;
        color: #222;
        text-align: center;
      }

      .ac-spool-color-num:before {
        content: "";
        display: inline-block;
        height: 100%;
        vertical-align: middle;
        padding-top: 2.5px;
      }

      .ac-spool-material-type {
        height: auto;
        text-align: center;
        font-weight: 900;
      }

      .ac-printercard-mcbmenu ha-control-button {
        font-size: 12px;
        margin: 0px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        min-width: 48px;
        min-height: 48px;
        width: 100%;
      }

      .ac-printercard-menuright ha-control-button {
        right: 0px;
      }

      .ac-printercard-mcbmenu .ac-switch-label {
        font-size: 12px;
      }

      .ac-printercard-mcbmenu .ac-switch {
        display: flex;
        flex-wrap: wrap;
        text-align: center;
        margin: 0px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        box-sizing: border-box;
        padding: 4px 4px;
        justify-content: center;
        background-color: #8686862e;
        border-radius: 8px;
      }

      .ac-printercard-mcbmenu .ac-switch:hover {
        background-color: #86868669;
      }
    `;
    }
  };
  n([_t()], ys.prototype, "hass", void 0), n([_t()], ys.prototype, "language", void 0), n([_t({
    attribute: "printer-entities"
  })], ys.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], ys.prototype, "printerEntityIdPart", void 0), n([_t()], ys.prototype, "box_id", void 0), n([vt()], ys.prototype, "_runoutRefillId", void 0), n([vt()], ys.prototype, "_spoolsEntityId", void 0), n([vt()], ys.prototype, "spoolList", void 0), n([vt()], ys.prototype, "selectedIndex", void 0), n([vt()], ys.prototype, "selectedMaterialType", void 0), n([vt()], ys.prototype, "selectedColor", void 0), n([vt()], ys.prototype, "_runoutRefillState", void 0), n([vt()], ys.prototype, "_buttonRefill", void 0), n([vt()], ys.prototype, "_buttonDry", void 0), n([vt()], ys.prototype, "_changingRunout", void 0), ys = n([$t("anycubic-printercard-multicolorbox_view")], ys);
  /**
       * @license
       * Copyright 2020 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const {
      I: _s
    } = pt,
    vs = () => document.createComment(""),
    ws = (t, e, i) => {
      const r = t._$AA.parentNode,
        n = void 0 === e ? t._$AB : e._$AA;
      if (void 0 === i) {
        const e = r.insertBefore(vs(), n),
          s = r.insertBefore(vs(), n);
        i = new _s(e, s, t, t.options);
      } else {
        const e = i._$AB.nextSibling,
          s = i._$AM,
          o = s !== t;
        if (o) {
          let e;
          i._$AQ?.(t), i._$AM = t, void 0 !== i._$AP && (e = t._$AU) !== s._$AU && i._$AP(e);
        }
        if (e !== n || o) {
          let t = i._$AA;
          for (; t !== e;) {
            const e = t.nextSibling;
            r.insertBefore(t, n), t = e;
          }
        }
      }
      return i;
    },
    xs = (t, e, i = t) => (t._$AI(e, i), t),
    $s = {},
    Es = t => {
      t._$AP?.(!1, !0);
      let e = t._$AA;
      const i = t._$AB.nextSibling;
      for (; e !== i;) {
        const t = e.nextSibling;
        e.remove(), e = t;
      }
    },
    Ss = (t, e, i) => {
      const r = new Map();
      for (let n = e; n <= i; n++) r.set(t[n], n);
      return r;
    },
    Cs = Mi(class extends Hi {
      constructor(t) {
        if (super(t), t.type !== ki) throw Error("repeat() can only be used in text expressions");
      }
      dt(t, e, i) {
        let r;
        void 0 === i ? i = e : void 0 !== e && (r = e);
        const n = [],
          s = [];
        let o = 0;
        for (const e of t) n[o] = r ? r(e, o) : o, s[o] = i(e, o), o++;
        return {
          values: s,
          keys: n
        };
      }
      render(t, e, i) {
        return this.dt(t, e, i).values;
      }
      update(t, [e, i, r]) {
        const n = (t => t._$AH)(t),
          {
            values: s,
            keys: o
          } = this.dt(e, i, r);
        if (!Array.isArray(n)) return this.ut = o, s;
        const a = this.ut ??= [],
          l = [];
        let c,
          h,
          d = 0,
          u = n.length - 1,
          p = 0,
          g = s.length - 1;
        for (; d <= u && p <= g;) if (null === n[d]) d++;else if (null === n[u]) u--;else if (a[d] === o[p]) l[p] = xs(n[d], s[p]), d++, p++;else if (a[u] === o[g]) l[g] = xs(n[u], s[g]), u--, g--;else if (a[d] === o[g]) l[g] = xs(n[d], s[g]), ws(t, l[g + 1], n[d]), d++, g--;else if (a[u] === o[p]) l[p] = xs(n[u], s[p]), ws(t, n[d], n[u]), u--, p++;else if (void 0 === c && (c = Ss(o, p, g), h = Ss(a, d, u)), c.has(a[d])) {
          if (c.has(a[u])) {
            const e = h.get(o[p]),
              i = void 0 !== e ? n[e] : null;
            if (null === i) {
              const e = ws(t, n[d]);
              xs(e, s[p]), l[p] = e;
            } else l[p] = xs(i, s[p]), ws(t, n[d], i), n[e] = null;
            p++;
          } else Es(n[u]), u--;
        } else Es(n[d]), d++;
        for (; p <= g;) {
          const e = ws(t, l[g + 1]);
          xs(e, s[p]), l[p++] = e;
        }
        for (; d <= u;) {
          const t = n[d++];
          null !== t && Es(t);
        }
        return this.ut = o, ((t, e = $s) => {
          t._$AH = e;
        })(t, l), Q;
      }
    });
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  let As = class extends mt {
    render() {
      const t = {
        width: String(this.progress) + "%"
      };
      return q`
      <div class="ac-stat-line">
        <p class="ac-stat-heading">${this.name}</p>
        <div class="ac-stat-value">
          <div class="ac-progress-bar">
            <div class="ac-stat-text">${this.value}</div>
            <div
              class="ac-progress-line"
              style=${Li(t)}
            ></div>
          </div>
        </div>
      </div>
    `;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-stat-line {
        box-sizing: border-box;
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin: 2px 0;
      }

      .ac-stat-value {
        margin: 0;
        display: inline-block;
        max-width: calc(100% - 120px);
        width: 100%;
        position: relative;
      }

      .ac-stat-text {
        margin: 0;
        font-size: 16px;
        display: block;
        position: relative;
        top: 3px;
        left: 0px;
        z-index: 1;
        text-align: center;
      }

      .ac-stat-heading {
        margin: 0;
        font-size: 16px;
        display: block;
        font-weight: bold;
      }

      .ac-progress-bar {
        display: block;
        width: 100%;
        height: 30px;
        background-color: #8b8b8b6e;
        position: relative;
      }

      .ac-progress-line {
        position: absolute;
        top: 0px;
        left: 0px;
        display: block;
        height: 100%;
        background-color: #ee8f36e6;
        border-right: 2px solid #ffd151e6;
        box-shadow: 4px 0px 6px 0px rgb(255 245 126 / 25%);
      }
    `;
    }
  };
  n([_t({
    type: String
  })], As.prototype, "name", void 0), n([_t({
    type: Number
  })], As.prototype, "value", void 0), n([_t({
    type: Number
  })], As.prototype, "progress", void 0), As = n([$t("anycubic-printercard-progress-line")], As);
  let Ps = class extends mt {
    constructor() {
      super(...arguments), this.unit = "";
    }
    render() {
      return q`
      <div class="ac-stat-line">
        <p class="ac-stat-text ac-stat-heading">${this.name}</p>
        <p class="ac-stat-text">${this.value}${this.unit}</p>
      </div>
    `;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-stat-line {
        box-sizing: border-box;
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin: 2px 0;
      }

      .ac-stat-text {
        margin: 0;
        font-size: 16px;
        display: inline-block;
        max-width: calc(100% - 120px);
        text-align: right;
        word-wrap: break-word;
      }

      .ac-stat-heading {
        font-weight: bold;
        max-width: unset;
        overflow: unset;
      }
    `;
    }
  };
  n([_t({
    type: String
  })], Ps.prototype, "name", void 0), n([_t({
    type: String
  })], Ps.prototype, "value", void 0), n([_t({
    type: String
  })], Ps.prototype, "unit", void 0), Ps = n([$t("anycubic-printercard-stat-line")], Ps);
  let Ts = class extends mt {
    render() {
      return q`<anycubic-printercard-stat-line
      .name=${this.name}
      .value=${_i(this.temperatureEntity, this.temperatureUnit, this.round)}
    ></anycubic-printercard-stat-line>`;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }
    `;
    }
  };
  n([_t({
    type: String
  })], Ts.prototype, "name", void 0), n([_t({
    attribute: "temperature-entity"
  })], Ts.prototype, "temperatureEntity", void 0), n([_t({
    type: Boolean
  })], Ts.prototype, "round", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], Ts.prototype, "temperatureUnit", void 0), Ts = n([$t("anycubic-printercard-stat-temperature")], Ts);
  let ks = class extends mt {
    constructor() {
      super(...arguments), this.running = !1, this.currentTime = 0, this.lastIntervalId = -1;
    }
    willUpdate(t) {
      super.willUpdate(t), t.has("timeEntity") && (-1 !== this.lastIntervalId && clearInterval(this.lastIntervalId), this.currentTime = function (t, e = !1) {
        let i;
        if (t.state) {
          if (t.state.includes(", ")) {
            const [e, r] = t.state.split(", "),
              [n, s, o] = r.split(":"),
              a = e.match(/\d+/);
            i = 60 * +(a ? a[0] : 0) * 60 * 24 + 60 * +n * 60 + 60 * +s + +o;
          } else if (t.state.includes(":")) {
            const [e, r, n] = t.state.split(":");
            i = 60 * +e * 60 + 60 * +r + +n;
          } else i = e ? +t.state : 60 * +t.state;
        } else i = 0;
        return i;
      }(this.timeEntity), this.lastIntervalId = setInterval(() => {
        this._incTime();
      }, 1e3));
    }
    connectedCallback() {
      super.connectedCallback(), -1 === this.lastIntervalId && (this.lastIntervalId = setInterval(() => {
        this._incTime();
      }, 1e3));
    }
    disconnectedCallback() {
      super.disconnectedCallback(), -1 !== this.lastIntervalId && (clearInterval(this.lastIntervalId), this.lastIntervalId = -1);
    }
    render() {
      return q`<anycubic-printercard-stat-line
      .name=${this.name}
      .value=${fi(this.currentTime, this.timeType, this.round, this.use_24hr)}
    ></anycubic-printercard-stat-line>`;
    }
    _incTime() {
      if (this.running && (0 === this.currentTime || this.currentTime && !isNaN(this.currentTime))) {
        const t = Number(this.currentTime) + this.direction;
        this.currentTime = t < 0 ? 0 : t;
      }
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }
    `;
    }
  };
  n([_t({
    attribute: "time-entity"
  })], ks.prototype, "timeEntity", void 0), n([_t({
    attribute: "time-type"
  })], ks.prototype, "timeType", void 0), n([_t({
    type: String
  })], ks.prototype, "name", void 0), n([_t({
    type: Number
  })], ks.prototype, "direction", void 0), n([_t({
    type: Boolean
  })], ks.prototype, "round", void 0), n([_t({
    type: Boolean
  })], ks.prototype, "use_24hr", void 0), n([_t({
    attribute: "is-seconds",
    type: Boolean
  })], ks.prototype, "isSeconds", void 0), n([_t({
    type: Boolean
  })], ks.prototype, "running", void 0), n([vt()], ks.prototype, "currentTime", void 0), n([vt()], ks.prototype, "lastIntervalId", void 0), ks = n([$t("anycubic-printercard-stat-time")], ks);
  let Ms = class extends mt {
    constructor() {
      super(...arguments), this.round = !0, this.temperatureUnit = St.C, this.progressPercent = 0, this._jobRunning = !1, this._valDryProgress = 0;
    }
    willUpdate(t) {
      var e;
      if (super.willUpdate(t), t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) {
        const t = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state", "unknown").state.toLowerCase();
        this._jobRunning = gi(t) && "paused" !== t, this._entETA = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_remaining"), this._entElapsed = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_elapsed"), this._entRemaining = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_remaining"), this._entBedCurrent = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "hotbed_temperature"), this._entHotendCurrent = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "nozzle_temperature"), this._entBedTarget = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "target_hotbed_temperature"), this._entHotendTarget = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "target_nozzle_temperature"), this._valStatus = Qe("unavailable" === t || "unknown" === t ? ui(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status", "unknown").state : t), this._valOnline = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "printer_online", "Online", "Offline", "unknown"), this._valAvailability = Qe(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status").state), this._valJobName = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_name").state, this._valCurrentLayer = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_current_layer").state;
        const i = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_speed_mode", "", {
            available_modes: [],
            print_speed_mode_code: -1
          }),
          r = $i(i),
          n = null !== (e = i.attributes.print_speed_mode_code) && void 0 !== e ? e : 0;
        this._valSpeedMode = n >= 0 && n in r ? r[n] : "Unknown", this._valFanSpeed = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state, this._valDryStatus = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_active", "Drying", "Not Drying", "unknown");
        const s = Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_total_duration", 0).state),
          o = Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_remaining_time", 0).state);
        this._valDryRemain = isNaN(o) ? "" : `${o} Mins`, this._valDryProgress = !isNaN(s) && s > 0 ? o / s * 100 : 0, this._valOnTime = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_on_time", 0).state, this._valOffTime = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_off_time", 0).state, this._valBottomTime = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_bottom_time", 0).state, this._valModelHeight = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_model_height", 0).state, this._valBottomLayers = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_bottom_layers", 0).state, this._valZUpHeight = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_up_height", 0).state, this._valZUpSpeed = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_up_speed", 0).state, this._valZDownSpeed = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_down_speed", 0).state;
      }
      (t.has("language") || t.has("monitoredStats")) && (this._statTranslations = this.monitoredStats.reduce((t, e) => (t[e] = Nn(`card.monitored_stats.${e}`, this.language), t), {}));
    }
    render() {
      return q`
      <div class="ac-stats-box ac-stats-section">
        ${this.showPercent ? q`
              <div class="ac-stats-box ac-stats-part-percent">
                <p class="ac-stats-part-percent-text">
                  ${this.round ? Math.round(this.progressPercent) : this.progressPercent}%
                </p>
              </div>
            ` : null}
        <div class="ac-stats-box ac-stats-section">${this._renderStats()}</div>
      </div>
    `;
    }
    _renderStats() {
      return Cs(this.monitoredStats, t => t, (t, e) => {
        switch (t) {
          case kt.Status:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valStatus}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ETA:
            return q`
              <anycubic-printercard-stat-time
                .timeEntity=${this._entETA}
                .timeType=${t}
                .name=${this._statTranslations[t]}
                .direction=${0}
                .running=${this._jobRunning}
                .round=${this.round}
                .use_24hr=${this.use_24hr}
              ></anycubic-printercard-stat-time>
            `;
          case kt.Elapsed:
            return q`
              <anycubic-printercard-stat-time
                .timeEntity=${this._entElapsed}
                .timeType=${t}
                .name=${this._statTranslations[t]}
                .direction=${1}
                .running=${this._jobRunning}
                .round=${this.round}
                .use_24hr=${this.use_24hr}
              ></anycubic-printercard-stat-time>
            `;
          case kt.Remaining:
            return q`
              <anycubic-printercard-stat-time
                .timeEntity=${this._entRemaining}
                .timeType=${t}
                .name=${this._statTranslations[t]}
                .direction=${-1}
                .running=${this._jobRunning}
                .round=${this.round}
                .use_24hr=${this.use_24hr}
              ></anycubic-printercard-stat-time>
            `;
          case kt.BedCurrent:
            return q`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entBedCurrent}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case kt.HotendCurrent:
            return q`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entHotendCurrent}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case kt.BedTarget:
            return q`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entBedTarget}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case kt.HotendTarget:
            return q`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entHotendTarget}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case kt.PrinterOnline:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOnline}
              ></anycubic-printercard-stat-line>
            `;
          case kt.Availability:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valAvailability}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ProjectName:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valJobName}
              ></anycubic-printercard-stat-line>
            `;
          case kt.CurrentLayer:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valCurrentLayer}
              ></anycubic-printercard-stat-line>
            `;
          case kt.SpeedMode:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valSpeedMode}
              ></anycubic-printercard-stat-line>
            `;
          case kt.FanSpeed:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valFanSpeed}
                .unit=${"%"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.DryingStatus:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valDryStatus}
              ></anycubic-printercard-stat-line>
            `;
          case kt.DryingTime:
            return q`
              <anycubic-printercard-progress-line
                .name=${this._statTranslations[t]}
                .value=${this._valDryRemain}
                .progress=${this._valDryProgress}
              ></anycubic-printercard-progress-line>
            `;
          case kt.OnTime:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOnTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.OffTime:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOffTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.BottomTime:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valBottomTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ModelHeight:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valModelHeight}
                .unit=${"mm"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.BottomLayers:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valBottomLayers}
                .unit=${"layers"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ZUpHeight:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZUpHeight}
                .unit=${"mm"}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ZUpSpeed:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZUpSpeed}
              ></anycubic-printercard-stat-line>
            `;
          case kt.ZDownSpeed:
            return q`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZDownSpeed}
              ></anycubic-printercard-stat-line>
            `;
          default:
            return q`
              <anycubic-printercard-stat-line
                .name=${"Unknown"}
                .value=${"<unknown>"}
              ></anycubic-printercard-stat-line>
            `;
        }
      });
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-stats-box {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
      }

      .ac-stats-section {
        flex-direction: column;
        justify-content: center;
      }

      .ac-stats-part-percent {
        justify-content: center;
        margin-bottom: 20px;
      }
      .ac-stats-part-percent-text {
        margin: 0px;
        font-size: 42px;
        font-weight: bold;
        height: 44px;
        line-height: 44px;
      }
    `;
    }
  };
  n([_t()], Ms.prototype, "hass", void 0), n([_t()], Ms.prototype, "language", void 0), n([_t({
    attribute: "monitored-stats"
  })], Ms.prototype, "monitoredStats", void 0), n([_t({
    attribute: "show-percent",
    type: Boolean
  })], Ms.prototype, "showPercent", void 0), n([_t({
    type: Boolean
  })], Ms.prototype, "round", void 0), n([_t({
    type: Boolean
  })], Ms.prototype, "use_24hr", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], Ms.prototype, "temperatureUnit", void 0), n([_t({
    attribute: "printer-entities"
  })], Ms.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], Ms.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "progress-percent"
  })], Ms.prototype, "progressPercent", void 0), n([vt()], Ms.prototype, "_statTranslations", void 0), n([vt()], Ms.prototype, "_jobRunning", void 0), n([vt()], Ms.prototype, "_entETA", void 0), n([vt()], Ms.prototype, "_entElapsed", void 0), n([vt()], Ms.prototype, "_entRemaining", void 0), n([vt()], Ms.prototype, "_entBedCurrent", void 0), n([vt()], Ms.prototype, "_entHotendCurrent", void 0), n([vt()], Ms.prototype, "_entBedTarget", void 0), n([vt()], Ms.prototype, "_entHotendTarget", void 0), n([vt()], Ms.prototype, "_valStatus", void 0), n([vt()], Ms.prototype, "_valOnline", void 0), n([vt()], Ms.prototype, "_valAvailability", void 0), n([vt()], Ms.prototype, "_valJobName", void 0), n([vt()], Ms.prototype, "_valCurrentLayer", void 0), n([vt()], Ms.prototype, "_valSpeedMode", void 0), n([vt()], Ms.prototype, "_valFanSpeed", void 0), n([vt()], Ms.prototype, "_valDryStatus", void 0), n([vt()], Ms.prototype, "_valDryRemain", void 0), n([vt()], Ms.prototype, "_valDryProgress", void 0), n([vt()], Ms.prototype, "_valOnTime", void 0), n([vt()], Ms.prototype, "_valOffTime", void 0), n([vt()], Ms.prototype, "_valBottomTime", void 0), n([vt()], Ms.prototype, "_valModelHeight", void 0), n([vt()], Ms.prototype, "_valBottomLayers", void 0), n([vt()], Ms.prototype, "_valZUpHeight", void 0), n([vt()], Ms.prototype, "_valZUpSpeed", void 0), n([vt()], Ms.prototype, "_valZDownSpeed", void 0), Ms = n([$t("anycubic-printercard-stats-component")], Ms);
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const Hs = (t, e) => {
      const i = t._$AN;
      if (void 0 === i) return !1;
      for (const t of i) t._$AO?.(e, !1), Hs(t, e);
      return !0;
    },
    Bs = t => {
      let e, i;
      do {
        if (void 0 === (e = t._$AM)) break;
        i = e._$AN, i.delete(t), t = e;
      } while (0 === i?.size);
    },
    Fs = t => {
      for (let e; e = t._$AM; t = e) {
        let i = e._$AN;
        if (void 0 === i) e._$AN = i = new Set();else if (i.has(t)) break;
        i.add(t), Ds(e);
      }
    };
  function Is(t) {
    void 0 !== this._$AN ? (Bs(this), this._$AM = t, Fs(this)) : this._$AM = t;
  }
  function Ls(t, e = !1, i = 0) {
    const r = this._$AH,
      n = this._$AN;
    if (void 0 !== n && 0 !== n.size) if (e) {
      if (Array.isArray(r)) for (let t = i; t < r.length; t++) Hs(r[t], !1), Bs(r[t]);else null != r && (Hs(r, !1), Bs(r));
    } else Hs(this, t);
  }
  const Ds = t => {
    t.type == ki && (t._$AP ??= Ls, t._$AQ ??= Is);
  };
  class Os extends Hi {
    constructor() {
      super(...arguments), this._$AN = void 0;
    }
    _$AT(t, e, i) {
      super._$AT(t, e, i), Fs(this), this.isConnected = t._$AU;
    }
    _$AO(t, e = !0) {
      t !== this.isConnected && (this.isConnected = t, t ? this.reconnected?.() : this.disconnected?.()), e && (Hs(this, t), Bs(this));
    }
    setValue(t) {
      if ((t => void 0 === t.strings)(this._$Ct)) this._$Ct._$AI(t, this);else {
        const e = [...this._$Ct._$AH];
        e[this._$Ci] = t, this._$Ct._$AI(e, this, 0);
      }
    }
    disconnected() {}
    reconnected() {}
  }
  const Ns = new WeakMap();
  let zs = 0;
  const Us = new Map(),
    Rs = new WeakSet(),
    js = () => new Promise(t => requestAnimationFrame(t)),
    Vs = (t, e) => {
      const i = t - e;
      return 0 === i ? void 0 : i;
    },
    Gs = (t, e) => {
      const i = t / e;
      return 1 === i ? void 0 : i;
    },
    Zs = {
      left: (t, e) => {
        const i = Vs(t, e);
        return {
          value: i,
          transform: null == i || isNaN(i) ? void 0 : `translateX(${i}px)`
        };
      },
      top: (t, e) => {
        const i = Vs(t, e);
        return {
          value: i,
          transform: null == i || isNaN(i) ? void 0 : `translateY(${i}px)`
        };
      },
      width: (t, e) => {
        let i;
        0 === e && (e = 1, i = {
          width: "1px"
        });
        const r = Gs(t, e);
        return {
          value: r,
          overrideFrom: i,
          transform: null == r || isNaN(r) ? void 0 : `scaleX(${r})`
        };
      },
      height: (t, e) => {
        let i;
        0 === e && (e = 1, i = {
          height: "1px"
        });
        const r = Gs(t, e);
        return {
          value: r,
          overrideFrom: i,
          transform: null == r || isNaN(r) ? void 0 : `scaleY(${r})`
        };
      }
    },
    Ks = {
      duration: 333,
      easing: "ease-in-out"
    },
    Ys = ["left", "top", "width", "height", "opacity", "color", "background"],
    Ws = new WeakMap();
  const qs = Mi(class extends Os {
      constructor(t) {
        if (super(t), this.t = !1, this.i = null, this.o = null, this.h = !0, this.shouldLog = !1, t.type === ki) throw Error("The `animate` directive must be used in attribute position.");
        this.createFinished();
      }
      createFinished() {
        this.resolveFinished?.(), this.finished = new Promise(t => {
          this.l = t;
        });
      }
      async resolveFinished() {
        this.l?.(), this.l = void 0;
      }
      render(t) {
        return J;
      }
      getController() {
        return Ns.get(this.u);
      }
      isDisabled() {
        return this.options.disabled || this.getController()?.disabled;
      }
      update(t, [e]) {
        const i = void 0 === this.u;
        return i && (this.u = t.options?.host, this.u.addController(this), this.u.updateComplete.then(t => this.t = !0), this.element = t.element, Ws.set(this.element, this)), this.optionsOrCallback = e, (i || "function" != typeof e) && this.p(e), this.render(e);
      }
      p(t) {
        t = t ?? {};
        const e = this.getController();
        void 0 !== e && ((t = {
          ...e.defaultOptions,
          ...t
        }).keyframeOptions = {
          ...e.defaultOptions.keyframeOptions,
          ...t.keyframeOptions
        }), t.properties ??= Ys, this.options = t;
      }
      m() {
        const t = {},
          e = this.element.getBoundingClientRect(),
          i = getComputedStyle(this.element);
        return this.options.properties.forEach(r => {
          const n = e[r] ?? (Zs[r] ? void 0 : i[r]),
            s = Number(n);
          t[r] = isNaN(s) ? n + "" : s;
        }), t;
      }
      v() {
        let t,
          e = !0;
        return this.options.guard && (t = this.options.guard(), e = ((t, e) => {
          if (Array.isArray(t)) {
            if (Array.isArray(e) && e.length === t.length && t.every((t, i) => t === e[i])) return !1;
          } else if (e === t) return !1;
          return !0;
        })(t, this._)), this.h = this.t && !this.isDisabled() && !this.isAnimating() && e && this.element.isConnected, this.h && (this._ = Array.isArray(t) ? Array.from(t) : t), this.h;
      }
      hostUpdate() {
        "function" == typeof this.optionsOrCallback && this.p(this.optionsOrCallback()), this.v() && (this.A = this.m(), this.i = this.i ?? this.element.parentNode, this.o = this.element.nextSibling);
      }
      async hostUpdated() {
        if (!this.h || !this.element.isConnected || this.options.skipInitial && !this.isHostRendered) return;
        let t;
        this.prepare(), await js;
        const e = this.O(),
          i = this.j(this.options.keyframeOptions, e),
          r = this.m();
        if (void 0 !== this.A) {
          const {
            from: i,
            to: n
          } = this.N(this.A, r, e);
          this.log("measured", [this.A, r, i, n]), t = this.calculateKeyframes(i, n);
        } else {
          const i = Us.get(this.options.inId);
          if (i) {
            Us.delete(this.options.inId);
            const {
              from: n,
              to: s
            } = this.N(i, r, e);
            t = this.calculateKeyframes(n, s), t = this.options.in ? [{
              ...this.options.in[0],
              ...t[0]
            }, ...this.options.in.slice(1), t[1]] : t, zs++, t.forEach(t => t.zIndex = zs);
          } else this.options.in && (t = [...this.options.in, {}]);
        }
        this.animate(t, i);
      }
      resetStyles() {
        void 0 !== this.P && (this.element.setAttribute("style", this.P ?? ""), this.P = void 0);
      }
      commitStyles() {
        this.P = this.element.getAttribute("style"), this.webAnimation?.commitStyles(), this.webAnimation?.cancel();
      }
      reconnected() {}
      async disconnected() {
        if (!this.h) return;
        if (void 0 !== this.options.id && Us.set(this.options.id, this.A), void 0 === this.options.out) return;
        if (this.prepare(), await js(), this.i?.isConnected) {
          const t = this.o && this.o.parentNode === this.i ? this.o : null;
          if (this.i.insertBefore(this.element, t), this.options.stabilizeOut) {
            const t = this.m();
            this.log("stabilizing out");
            const e = this.A.left - t.left,
              i = this.A.top - t.top;
            !("static" === getComputedStyle(this.element).position) || 0 === e && 0 === i || (this.element.style.position = "relative"), 0 !== e && (this.element.style.left = e + "px"), 0 !== i && (this.element.style.top = i + "px");
          }
        }
        const t = this.j(this.options.keyframeOptions);
        await this.animate(this.options.out, t), this.element.remove();
      }
      prepare() {
        this.createFinished();
      }
      start() {
        this.options.onStart?.(this);
      }
      didFinish(t) {
        t && this.options.onComplete?.(this), this.A = void 0, this.animatingProperties = void 0, this.frames = void 0, this.resolveFinished();
      }
      O() {
        const t = [];
        for (let e = this.element.parentNode; e; e = e?.parentNode) {
          const i = Ws.get(e);
          i && !i.isDisabled() && i && t.push(i);
        }
        return t;
      }
      get isHostRendered() {
        const t = Rs.has(this.u);
        return t || this.u.updateComplete.then(() => {
          Rs.add(this.u);
        }), t;
      }
      j(t, e = this.O()) {
        const i = {
          ...Ks
        };
        return e.forEach(t => Object.assign(i, t.options.keyframeOptions)), Object.assign(i, t), i;
      }
      N(t, e, i) {
        t = {
          ...t
        }, e = {
          ...e
        };
        const r = i.map(t => t.animatingProperties).filter(t => void 0 !== t);
        let n = 1,
          s = 1;
        return r.length > 0 && (r.forEach(t => {
          t.width && (n /= t.width), t.height && (s /= t.height);
        }), void 0 !== t.left && void 0 !== e.left && (t.left = n * t.left, e.left = n * e.left), void 0 !== t.top && void 0 !== e.top && (t.top = s * t.top, e.top = s * e.top)), {
          from: t,
          to: e
        };
      }
      calculateKeyframes(t, e, i = !1) {
        const r = {},
          n = {};
        let s = !1;
        const o = {};
        for (const i in e) {
          const a = t[i],
            l = e[i];
          if (i in Zs) {
            const t = Zs[i];
            if (void 0 === a || void 0 === l) continue;
            const e = t(a, l);
            void 0 !== e.transform && (o[i] = e.value, s = !0, r.transform = `${r.transform ?? ""} ${e.transform}`, void 0 !== e.overrideFrom && Object.assign(r, e.overrideFrom));
          } else a !== l && void 0 !== a && void 0 !== l && (s = !0, r[i] = a, n[i] = l);
        }
        return r.transformOrigin = n.transformOrigin = i ? "center center" : "top left", this.animatingProperties = o, s ? [r, n] : void 0;
      }
      async animate(t, e = this.options.keyframeOptions) {
        this.start(), this.frames = t;
        let i = !1;
        if (!this.isAnimating() && !this.isDisabled() && (this.options.onFrames && (this.frames = t = this.options.onFrames(this), this.log("modified frames", t)), void 0 !== t)) {
          this.log("animate", [t, e]), i = !0, this.webAnimation = this.element.animate(t, e);
          const r = this.getController();
          r?.add(this);
          try {
            await this.webAnimation.finished;
          } catch (t) {}
          r?.remove(this);
        }
        return this.didFinish(i), i;
      }
      isAnimating() {
        return "running" === this.webAnimation?.playState || this.webAnimation?.pending;
      }
      log(t, e) {
        this.shouldLog && !this.isDisabled() && console.log(t, this.options.id, e);
      }
    }),
    Xs = u`
  :host {
    display: none;
    position: fixed;
    z-index: 10;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(3px);
  }

  .ac-modal-container {
    border-radius: 16px;
    background-color: var(--primary-background-color);
    margin: auto;
    padding: 50px;
    width: 80%;
    min-height: 150px;
    max-width: 600px;
    margin-top: 50px;
    box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.3);
  }

  .ac-modal-card {
    padding: 20px;
  }
  .ac-modal-close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }

  .ac-modal-close:hover,
  .ac-modal-close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }

  .ac-modal-label {
  }

  @media (max-width: 599px) {
    .ac-modal-container {
      width: 95%;
      padding: 6px;
    }
  }
`;
  let Qs = class extends mt {
    constructor() {
      super(...arguments), this._isActive = !1, this._setActive = () => {
        this._isActive = !0;
      }, this._setInactive = () => {
        this._isActive = !1;
      };
    }
    render() {
      const t = {
        filter: this._isActive ? "brightness(80%)" : "brightness(100%)"
      };
      return q`
      <button
        class="ac-ui-seld-select"
        style=${Li(t)}
        @mouseenter=${this._setActive}
        @mousedown=${this._setActive}
        @mouseup=${this._setInactive}
        @mouseleave=${this._setInactive}
      >
        ${this.item}
      </button>
    `;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-ui-seld-select {
        width: 100%;
        border: none;
        outline: none;
        background: var(
          --ha-card-background,
          var(--card-background-color, white)
        );
        padding: 0 16px;
        box-sizing: border-box;
        font-size: 16px;
        font-weight: bold;
        line-height: 48px;
        text-align: left;
        cursor: pointer;
        color: var(--primary-text-color);
      }
    `;
    }
  };
  n([_t()], Qs.prototype, "item", void 0), n([vt()], Qs.prototype, "_isActive", void 0), Qs = n([$t("anycubic-ui-select-dropdown-item")], Qs);
  let Js = class extends mt {
    constructor() {
      super(...arguments), this._active = !1, this._hidden = !1, this._showOptions = () => {
        this._hidden = !1;
      }, this._hideOptions = () => {
        this._hidden = !0;
      }, this._setActive = () => {
        this._active = !0;
      }, this._setInactive = () => {
        this._active = !1;
      }, this._selectItem = t => {
        if (!this.availableOptions) return;
        const e = t.currentTarget.item_key;
        this._selectedItem = this.availableOptions[e], We(this, "ac-select-dropdown", {
          key: e,
          value: this.availableOptions[e]
        }), this._hidden = !0;
      };
    }
    async firstUpdated() {
      this._selectedItem = this.initialItem, this._hidden = !0, this._active = !1, this.requestUpdate();
    }
    render() {
      const t = {
          backgroundColor: this._active ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.15)"
        },
        e = {
          opacity: this._hidden ? 0 : 1,
          transform: this._hidden ? "scaleY(0.0)" : "scaleY(1.0)"
        };
      return this.availableOptions ? q`
          <button
            class="ac-ui-select-button"
            style=${Li(t)}
            @click=${this._showOptions}
            @mouseenter=${this._setActive}
            @mouseleave=${this._setInactive}
          >
            ${this._selectedItem ? this._selectedItem : this.placeholder}
            <ha-svg-icon .path=${Si}></ha-svg-icon>
          </button>
          <div class="ac-ui-select-options" style=${Li(e)}>
            ${this._renderOptions()}
          </div>
        ` : J;
    }
    _renderOptions() {
      return us(Object.keys(this.availableOptions), (t, e) => q`
          <anycubic-ui-select-dropdown-item
            .item=${this.availableOptions[t]}
            .item_key=${t}
            @click=${this._selectItem}
          ></anycubic-ui-select-dropdown-item>
        `);
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
        position: relative;
        background: var(
          --ha-card-background,
          var(--card-background-color, white)
        );
        border-radius: 8px;
      }

      .ac-ui-select-button {
        width: 100%;
        border: none;
        outline: none;
        padding: 0 16px;
        box-sizing: border-box;
        font-size: 16px;
        font-weight: bold;
        line-height: 48px;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: rgba(0, 0, 0, 0.05);
        align-items: center;
        color: var(--primary-text-color);
      }

      .ac-ui-select-options {
        width: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;
        box-shadow:
          0px 10px 20px rgba(0, 0, 0, 0.19),
          0px 6px 6px rgba(0, 0, 0, 0.23);
        z-index: 11;
        opacity: 0;
        transform: scaleY(0);
        transform-origin: top center;
      }
    `;
    }
  };
  n([_t({
    attribute: "available-options"
  })], Js.prototype, "availableOptions", void 0), n([_t()], Js.prototype, "placeholder", void 0), n([_t({
    attribute: "initial-item"
  })], Js.prototype, "initialItem", void 0), n([vt()], Js.prototype, "_selectedItem", void 0), n([vt()], Js.prototype, "_active", void 0), n([vt()], Js.prototype, "_hidden", void 0), Js = n([$t("anycubic-ui-select-dropdown")], Js);
  const to = {
      keyframeOptions: {
        duration: 250,
        direction: "alternate",
        easing: "ease-in-out"
      },
      properties: ["height", "opacity", "scale"]
    },
    eo = "drying_preset_1",
    io = "drying_preset_2",
    ro = "drying_preset_3",
    no = "drying_preset_4",
    so = "drying_stop",
    oo = "secondary_",
    ao = oo + eo,
    lo = oo + io,
    co = oo + ro,
    ho = oo + no,
    uo = oo + so;
  let po = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this._dryingPresetId1 = eo, this._dryingPresetId2 = io, this._dryingPresetId3 = ro, this._dryingPresetId4 = no, this._dryingStopId = so, this._hasDryingPreset1 = !1, this._hasDryingPreset2 = !1, this._hasDryingPreset3 = !1, this._hasDryingPreset4 = !1, this._hasDryingStop = !1, this._dryingPresetTemp1 = "", this._dryingPresetDur1 = "", this._dryingPresetTemp2 = "", this._dryingPresetDur2 = "", this._dryingPresetTemp3 = "", this._dryingPresetDur3 = "", this._dryingPresetTemp4 = "", this._dryingPresetDur4 = "", this._isOpen = !1, this._handleDryingPreset1 = () => {
        this._pressHassButton(this._dryingPresetId1), this._closeModal();
      }, this._handleDryingPreset2 = () => {
        this._pressHassButton(this._dryingPresetId2), this._closeModal();
      }, this._handleDryingPreset3 = () => {
        this._pressHassButton(this._dryingPresetId3), this._closeModal();
      }, this._handleDryingPreset4 = () => {
        this._pressHassButton(this._dryingPresetId4), this._closeModal();
      }, this._handleDryingStop = () => {
        this._pressHassButton(this._dryingStopId), this._closeModal();
      }, this._handleModalEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.modalOpen && (this._isOpen = !0, this.box_id = Number(e.detail.box_id));
      }, this._closeModal = t => {
        t && t.stopPropagation(), this._isOpen = !1, this.box_id = 0;
      }, this._cardClick = t => {
        t.stopPropagation();
      };
    }
    async firstUpdated() {
      this.addEventListener("click", t => {
        this._closeModal(t);
      });
    }
    connectedCallback() {
      var t;
      super.connectedCallback(), null === (t = this.parentElement) || void 0 === t || t.addEventListener("ac-mcbdry-modal", this._handleModalEvent);
    }
    disconnectedCallback() {
      var t;
      null === (t = this.parentElement) || void 0 === t || t.removeEventListener("ac-mcbdry-modal", this._handleModalEvent), super.disconnectedCallback();
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("language") && (this._heading = Nn("card.drying_settings.heading", this.language), this._buttonTextPreset = Nn("card.drying_settings.button_preset", this.language), this._buttonTextMinutes = Nn("card.drying_settings.button_minutes", this.language), this._buttonStopDrying = Nn("card.drying_settings.button_stop_drying", this.language)), t.has("box_id") && (1 === this.box_id ? (this._dryingPresetId1 = ao, this._dryingPresetId2 = lo, this._dryingPresetId3 = co, this._dryingPresetId4 = ho, this._dryingStopId = uo) : (this._dryingPresetId1 = eo, this._dryingPresetId2 = io, this._dryingPresetId3 = ro, this._dryingPresetId4 = no, this._dryingStopId = so)), t.has("hass") || t.has("selectedPrinterDevice") || t.has("box_id")) {
        const t = ci(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId1);
        this._hasDryingPreset1 = hi(t), this._dryingPresetTemp1 = String(t.attributes.temperature), this._dryingPresetDur1 = String(t.attributes.duration);
        const e = ci(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId2);
        this._hasDryingPreset2 = hi(e), this._dryingPresetTemp2 = String(e.attributes.temperature), this._dryingPresetDur2 = String(e.attributes.duration);
        const i = ci(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId3);
        this._hasDryingPreset3 = hi(i), this._dryingPresetTemp3 = String(i.attributes.temperature), this._dryingPresetDur3 = String(i.attributes.duration);
        const r = ci(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId4);
        this._hasDryingPreset4 = hi(r), this._dryingPresetTemp4 = String(r.attributes.temperature), this._dryingPresetDur4 = String(r.attributes.duration);
        const n = ci(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingStopId);
        this._hasDryingStop = hi(n);
      }
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return q`
      <div
        class="ac-modal-container"
        style=${Li({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${qs(Object.assign({}, to))}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this._renderCard()}
        </div>
      </div>
    `;
    }
    _renderCard() {
      return q`
      <div>
        <div class="ac-drying-header">${this._heading}</div>
        <div class="ac-drying-buttonscont">
          ${this._hasDryingPreset1 ? q`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset1}>
                    ${this._buttonTextPreset} 1<br />
                    ${this._dryingPresetDur1} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp1}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset2 ? q`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset2}>
                    ${this._buttonTextPreset} 2<br />
                    ${this._dryingPresetDur2} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp2}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset3 ? q`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset3}>
                    ${this._buttonTextPreset} 3<br />
                    ${this._dryingPresetDur3} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp3}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset4 ? q`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset4}>
                    ${this._buttonTextPreset} 4<br />
                    ${this._dryingPresetDur4} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp4}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingStop ? q`
                <div class="ac-flex-break"></div>
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingStop}>
                    ${this._buttonStopDrying}
                  </ha-control-button>
                </div>
              ` : J}
        </div>
      </div>
    `;
    }
    _pressHassButton(t) {
      var e, i;
      this.printerEntityIdPart && this.hass.callService("button", "press", {
        entity_id: null !== (i = null === (e = ai(this.printerEntities, this.printerEntityIdPart, "button", t)) || void 0 === e ? void 0 : e.entity_id) && void 0 !== i ? i : oi(this.printerEntityIdPart, "button", t)
      }).then().catch(t => {});
    }
    static get styles() {
      return u`
      ${Xs}

      .ac-drying-header {
        font-size: 24px;
        text-align: center;
        font-weight: 600;
      }

      ha-control-button {
        min-width: 150px;
        font-size: 14px;
        min-height: 55px;
        width: 100%;
        box-sizing: border-box;
      }

      .ac-flex-break {
        flex-basis: 100%;
        height: 0;
      }

      .ac-drying-buttonscont {
        display: flex;
        flex-wrap: wrap;
        margin-top: 30px;
        align-items: center;
        justify-content: center;
      }

      .ac-drying-buttoncont {
        width: 50%;
        margin: 0;
        position: relative;
        box-sizing: border-box;
        padding: 10px;
      }
    `;
    }
  };
  n([_t()], po.prototype, "hass", void 0), n([_t()], po.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], po.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "printer-entities"
  })], po.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], po.prototype, "printerEntityIdPart", void 0), n([vt()], po.prototype, "box_id", void 0), n([vt()], po.prototype, "_dryingPresetId1", void 0), n([vt()], po.prototype, "_dryingPresetId2", void 0), n([vt()], po.prototype, "_dryingPresetId3", void 0), n([vt()], po.prototype, "_dryingPresetId4", void 0), n([vt()], po.prototype, "_dryingStopId", void 0), n([vt()], po.prototype, "_hasDryingPreset1", void 0), n([vt()], po.prototype, "_hasDryingPreset2", void 0), n([vt()], po.prototype, "_hasDryingPreset3", void 0), n([vt()], po.prototype, "_hasDryingPreset4", void 0), n([vt()], po.prototype, "_hasDryingStop", void 0), n([vt()], po.prototype, "_dryingPresetTemp1", void 0), n([vt()], po.prototype, "_dryingPresetDur1", void 0), n([vt()], po.prototype, "_dryingPresetTemp2", void 0), n([vt()], po.prototype, "_dryingPresetDur2", void 0), n([vt()], po.prototype, "_dryingPresetTemp3", void 0), n([vt()], po.prototype, "_dryingPresetDur3", void 0), n([vt()], po.prototype, "_dryingPresetTemp4", void 0), n([vt()], po.prototype, "_dryingPresetDur4", void 0), n([vt()], po.prototype, "_isOpen", void 0), n([vt()], po.prototype, "_heading", void 0), n([vt()], po.prototype, "_buttonTextPreset", void 0), n([vt()], po.prototype, "_buttonTextMinutes", void 0), n([vt()], po.prototype, "_buttonStopDrying", void 0), po = n([$t("anycubic-printercard-multicolorbox_modal_drying")], po);
  const go = t => fo(255, Math.round(Number(t))),
    mo = t => go(255 * t),
    bo = t => fo(1, t / 255),
    fo = (t, e) => Math.max(0, Math.min(t, e)),
    yo = t => void 0 === t ? 1 : ("string" == typeof t && t.indexOf("%") > 0 && (t = Number(t.split("%")[0]) / 100), t = Number(Number(t).toFixed(3)), isNaN(t) ? 1 : fo(1, t)),
    _o = {
      aliceblue: "#F0F8FF",
      antiquewhite: "#FAEBD7",
      aqua: "#00FFFF",
      aquamarine: "#7FFFD4",
      azure: "#F0FFFF",
      beige: "#F5F5DC",
      bisque: "#FFE4C4",
      black: "#000000",
      blanchedalmond: "#FFEBCD",
      blue: "#0000FF",
      blueviolet: "#8A2BE2",
      brown: "#A52A2A",
      burlywood: "#DEB887",
      cadetblue: "#5F9EA0",
      chartreuse: "#7FFF00",
      chocolate: "#D2691E",
      coral: "#FF7F50",
      cornflowerblue: "#6495ED",
      cornsilk: "#FFF8DC",
      crimson: "#DC143C",
      cyan: "#00FFFF",
      darkblue: "#00008B",
      darkcyan: "#008B8B",
      darkgoldenrod: "#B8860B",
      darkgray: "#A9A9A9",
      darkgrey: "#A9A9A9",
      darkgreen: "#006400",
      darkkhaki: "#BDB76B",
      darkmagenta: "#8B008B",
      darkolivegreen: "#556B2F",
      darkorange: "#FF8C00",
      darkorchid: "#9932CC",
      darkred: "#8B0000",
      darksalmon: "#E9967A",
      darkseagreen: "#8FBC8F",
      darkslateblue: "#483D8B",
      darkslategray: "#2F4F4F",
      darkslategrey: "#2F4F4F",
      darkturquoise: "#00CED1",
      darkviolet: "#9400D3",
      deeppink: "#FF1493",
      deepskyblue: "#00BFFF",
      dimgray: "#696969",
      dimgrey: "#696969",
      dodgerblue: "#1E90FF",
      firebrick: "#B22222",
      floralwhite: "#FFFAF0",
      forestgreen: "#228B22",
      fuchsia: "#FF00FF",
      gainsboro: "#DCDCDC",
      ghostwhite: "#F8F8FF",
      gold: "#FFD700",
      goldenrod: "#DAA520",
      gray: "#808080",
      grey: "#808080",
      green: "#008000",
      greenyellow: "#ADFF2F",
      honeydew: "#F0FFF0",
      hotpink: "#FF69B4",
      indianred: "#CD5C5C",
      indigo: "#4B0082",
      ivory: "#FFFFF0",
      khaki: "#F0E68C",
      lavender: "#E6E6FA",
      lavenderblush: "#FFF0F5",
      lawngreen: "#7CFC00",
      lemonchiffon: "#FFFACD",
      lightblue: "#ADD8E6",
      lightcoral: "#F08080",
      lightcyan: "#E0FFFF",
      lightgoldenrodyellow: "#FAFAD2",
      lightgray: "#D3D3D3",
      lightgrey: "#D3D3D3",
      lightgreen: "#90EE90",
      lightpink: "#FFB6C1",
      lightsalmon: "#FFA07A",
      lightseagreen: "#20B2AA",
      lightskyblue: "#87CEFA",
      lightslategray: "#778899",
      lightslategrey: "#778899",
      lightsteelblue: "#B0C4DE",
      lightyellow: "#FFFFE0",
      lime: "#00FF00",
      limegreen: "#32CD32",
      linen: "#FAF0E6",
      magenta: "#FF00FF",
      maroon: "#800000",
      mediumaquamarine: "#66CDAA",
      mediumblue: "#0000CD",
      mediumorchid: "#BA55D3",
      mediumpurple: "#9370DB",
      mediumseagreen: "#3CB371",
      mediumslateblue: "#7B68EE",
      mediumspringgreen: "#00FA9A",
      mediumturquoise: "#48D1CC",
      mediumvioletred: "#C71585",
      midnightblue: "#191970",
      mintcream: "#F5FFFA",
      mistyrose: "#FFE4E1",
      moccasin: "#FFE4B5",
      navajowhite: "#FFDEAD",
      navy: "#000080",
      oldlace: "#FDF5E6",
      olive: "#808000",
      olivedrab: "#6B8E23",
      orange: "#FFA500",
      orangered: "#FF4500",
      orchid: "#DA70D6",
      palegoldenrod: "#EEE8AA",
      palegreen: "#98FB98",
      paleturquoise: "#AFEEEE",
      palevioletred: "#DB7093",
      papayawhip: "#FFEFD5",
      peachpuff: "#FFDAB9",
      peru: "#CD853F",
      pink: "#FFC0CB",
      plum: "#DDA0DD",
      powderblue: "#B0E0E6",
      purple: "#800080",
      rebeccapurple: "#663399",
      red: "#FF0000",
      rosybrown: "#BC8F8F",
      royalblue: "#4169E1",
      saddlebrown: "#8B4513",
      salmon: "#FA8072",
      sandybrown: "#F4A460",
      seagreen: "#2E8B57",
      seashell: "#FFF5EE",
      sienna: "#A0522D",
      silver: "#C0C0C0",
      skyblue: "#87CEEB",
      slateblue: "#6A5ACD",
      slategray: "#708090",
      slategrey: "#708090",
      snow: "#FFFAFA",
      springgreen: "#00FF7F",
      steelblue: "#4682B4",
      tan: "#D2B48C",
      teal: "#008080",
      thistle: "#D8BFD8",
      tomato: "#FF6347",
      turquoise: "#40E0D0",
      violet: "#EE82EE",
      wheat: "#F5DEB3",
      white: "#FFFFFF",
      whitesmoke: "#F5F5F5",
      yellow: "#FFFF00",
      yellowgreen: "#9ACD32"
    };
  class vo {
    constructor(t, e, i, r) {
      return vo.isBaseConstructor(t) ? (this.r = go(t.r), this.g = go(t.g), this.b = go(t.b), void 0 !== t.a && (this.a = yo(t.a)), this) : vo.parse(t, e, i, r);
    }
    static parse(t, e, i, r) {
      if (vo.isBaseConstructor(t)) return new vo(t);
      if (void 0 !== e && void 0 !== i) {
        let n = go(t);
        return e = go(e), i = go(i), void 0 !== r && (r = yo(r)), new vo({
          r: n,
          g: e,
          b: i,
          a: r
        });
      }
      if (Array.isArray(t)) return vo.fromArray(t);
      if ("string" == typeof t) {
        let i;
        if (void 0 !== e && Number(e) <= 1 && Number(e) >= 0 && (i = Number(e)), t.startsWith("#")) return vo.fromHex(t, i);
        if (_o[t.toLowerCase()]) return vo.fromNamed(t, i);
        if (t.startsWith("rgb")) return vo.fromRgbString(t);
        if ("transparent" === t) {
          let t, e, i, r;
          return t = e = i = r = 0, new vo({
            r: t,
            g: e,
            b: i,
            a: r
          });
        }
        return null;
      }
      if ("object" == typeof t) {
        if (void 0 !== t.a && (this.a = yo(t.a)), void 0 !== t.h) {
          let e = {};
          if (void 0 !== t.v) e = vo.fromHsv(t);else {
            if (void 0 === t.l) return vo.fromArray([0, 0, 0]);
            e = vo.fromHsl(t);
          }
          return e.a = void 0 !== t.a ? yo(t.a) : void 0, new vo(e);
        }
        return void 0 !== t.c ? vo.fromCMYK(t) : this;
      }
      return vo.fromArray([0, 0, 0]);
    }
    static isBaseConstructor(t) {
      return "object" == typeof t && void 0 !== t.r && void 0 !== t.g && void 0 !== t.b;
    }
    static fromNamed(t, e) {
      return vo.fromHex(_o[t.toLowerCase()], e);
    }
    static fromArray(t) {
      t = t.filter(t => "" !== t && isFinite(t));
      const e = {
        r: go(t[0]),
        g: go(t[1]),
        b: go(t[2])
      };
      return void 0 !== t[3] && (e.a = yo(t[3])), new vo(e);
    }
    static fromHex(t, e) {
      3 !== (t = t.replace("#", "")).length && 4 !== t.length || (t = t.split("").map(t => t + t).join(""));
      let i = t.match(/[A-Za-z0-9]{2}/g).map(t => parseInt(t, 16));
      return 4 === i.length ? i[3] /= 255 : void 0 !== e && (i[3] = e), vo.fromArray(i);
    }
    static fromRgbString(t) {
      if (t.includes(",")) return vo.fromArray(t.split("(")[1].split(")")[0].split(","));
      const e = t.replace("/", " ").split("(")[1].replace(")", "").split(" ").filter(t => "" !== t && isFinite(Number(t)));
      return vo.fromArray(e);
    }
    static fromHsv({
      h: t,
      s: e,
      v: i
    }) {
      e /= 100, i /= 100;
      const r = Math.floor(t / 60 % 6),
        n = t / 60 - r,
        s = i * (1 - e),
        o = i * (1 - n * e),
        a = i * (1 - (1 - n) * e),
        l = [[i, a, s], [o, i, s], [s, i, a], [s, o, i], [a, s, i], [i, s, o]][r].map(t => Math.round(256 * t));
      return new vo({
        r: go(l[0]),
        g: go(l[1]),
        b: go(l[2])
      });
    }
    static fromHsl({
      h: t,
      s: e,
      l: i
    }) {
      e /= 100, i /= 100;
      const r = (1 - Math.abs(2 * i - 1)) * e,
        n = r * (1 - Math.abs(t / 60 % 2 - 1)),
        s = i - r / 2;
      let o = 0,
        a = 0,
        l = 0;
      return 0 <= t && t < 60 ? (o = r, a = n, l = 0) : 60 <= t && t < 120 ? (o = n, a = r, l = 0) : 120 <= t && t < 180 ? (o = 0, a = r, l = n) : 180 <= t && t < 240 ? (o = 0, a = n, l = r) : 240 <= t && t < 300 ? (o = n, a = 0, l = r) : 300 <= t && t < 360 && (o = r, a = 0, l = n), new vo({
        r: mo(s + o),
        g: mo(s + a),
        b: mo(s + l)
      });
    }
    static fromCMYK({
      c: t,
      m: e,
      y: i,
      k: r,
      a: n
    }) {
      const s = t => mo(1 - Math.min(1, t / 100 * (1 - r) + r));
      return new vo({
        r: s(t),
        b: s(e),
        g: s(i),
        a: n
      });
    }
    get alpha() {
      return void 0 === this.a ? 1 : this.a;
    }
    get rgb() {
      return [this.r, this.g, this.b];
    }
    get rgba() {
      return [this.r, this.g, this.b, this.alpha];
    }
    get rgbObj() {
      let {
        r: t,
        g: e,
        b: i
      } = this;
      return {
        r: t,
        g: e,
        b: i,
        a: this.alpha
      };
    }
    get css() {
      return this.rgbString;
    }
    get rgbString() {
      return void 0 === this.a ? `rgb(${this.rgb.join(",")})` : `rgba(${this.rgba.join(",")})`;
    }
    get rgbaString() {
      return `rgba(${this.rgba.join(",")})`;
    }
    get hex() {
      return `#${this.rgb.map(t => t.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    }
    get hexa() {
      return this.rgbaHex;
    }
    get rgbaHex() {
      let t = this.rgba;
      return t[3] = mo(t[3]), `#${t.map(t => t.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    }
    get hsv() {
      const t = bo(this.r),
        e = bo(this.g),
        i = bo(this.b),
        r = Math.min(t, e, i),
        n = Math.max(t, e, i);
      let s;
      const o = n,
        a = n - r;
      s = 0 === a ? 0 : n === t ? (e - i) / a * 60 % 360 : n === e ? (i - t) / a * 60 + 120 : n === i ? (t - e) / a * 60 + 240 : 0, s < 0 && (s += 360);
      const l = 0 === n ? 0 : 1 - r / n;
      return {
        h: Math.round(s),
        s: Math.round(100 * l),
        v: Math.round(100 * o),
        a: this.alpha
      };
    }
    get hsl() {
      const t = bo(this.r),
        e = bo(this.g),
        i = bo(this.b),
        r = Math.max(t, e, i),
        n = Math.min(t, e, i);
      let s, o;
      const a = (r + n) / 2;
      if (r === n) s = o = 0;else {
        const l = r - n;
        switch (o = a > .5 ? l / (2 - r - n) : l / (r + n), r) {
          case t:
            s = (e - i) / l + (e < i ? 6 : 0);
            break;
          case e:
            s = (i - t) / l + 2;
            break;
          case i:
            s = (t - e) / l + 4;
        }
        s /= 6;
      }
      return {
        h: Math.round(360 * s),
        s: Math.round(100 * o),
        l: Math.round(100 * a),
        a: this.alpha
      };
    }
    get cmyk() {
      let t, e, i, r;
      const n = parseFloat(this.r) / 255,
        s = parseFloat(this.g) / 255,
        o = parseFloat(this.b) / 255;
      return r = 1 - Math.max(n, s, o), 1 === r ? t = e = i = 0 : (t = (1 - n - r) / (1 - r), e = (1 - s - r) / (1 - r), i = (1 - o - r) / (1 - r)), t = Math.round(100 * t), e = Math.round(100 * e), i = Math.round(100 * i), r = Math.round(100 * r), this.alpha ? {
        c: t,
        m: e,
        y: i,
        k: r,
        a: this.alpha
      } : {
        c: t,
        m: e,
        y: i,
        k: r
      };
    }
    get hslString() {
      const t = this.hsl;
      return `hsl(${t.h}, ${t.s}%, ${t.l}%)`;
    }
    get hslaString() {
      const t = this.hsl;
      return `hsla(${t.h}, ${t.s}%, ${t.l}%, ${t.a})`;
    }
    get cmykString() {
      const t = this.cmyk;
      return `cmyk(${t.c}%, ${t.m}%, ${t.y}%, ${t.k}%)`;
    }
    get cmykaString() {
      const t = this.cmyk;
      return `cmyka(${t.c}%, ${t.m}%, ${t.y}%, ${t.k}%, ${t.a})`;
    }
    toString(t = "rgb") {
      let e;
      switch (t) {
        case "rgb":
        default:
          e = this.rgbString;
          break;
        case "hex":
          e = this.hex;
          break;
        case "rgbaHex":
          e = this.hexa;
          break;
        case "hsl":
          e = this.hslString;
          break;
        case "hsla":
          e = this.hslaString;
          break;
        case "cmyk":
          e = this.cmykString;
          break;
        case "cmyka":
          e = this.cmykaString;
      }
      return e;
    }
    mix(t, e = .5) {
      const i = this.rgba;
      i[3] = mo(i[3]);
      const r = new vo(t).rgba;
      r[3] = mo(r[3]), e = yo(e);
      const n = i.map((t, i) => {
        const n = r[i],
          s = n < t,
          o = s ? t - n : n - t,
          a = Math.round(o * e);
        return s ? t - a : a + t;
      });
      return n[3] = bo(n[3]), vo.fromArray(n);
    }
    adjustSatLum(t, e, i) {
      const r = this.hsl;
      let n = r[t],
        s = (i ? n : 100 - n) * e;
      return r[t] = fo(100, i ? n - s : n + s), r.a = this.a, new vo(r);
    }
    lighten(t, e = !1) {
      return this.adjustSatLum("l", t, e);
    }
    darken(t) {
      return this.lighten(t, !0);
    }
    saturate(t, e = !1) {
      return this.adjustSatLum("s", t, e);
    }
    desaturate(t) {
      return this.saturate(t, !0);
    }
    grayscale() {
      return this.desaturate(1);
    }
    rotate(t) {
      return this.hue(t);
    }
    hue(t) {
      const e = this.hsl;
      return e.h = Math.round(e.h + t) % 360, e.a = this.a, new vo(e);
    }
    fadeIn(t, e) {
      let i = this.alpha;
      const {
        r,
        g: n,
        b: s
      } = this;
      let o = (1 - i) * t;
      return i = e ? i - o : i + o, vo({
        r,
        g: n,
        b: s,
        a: i
      });
    }
    fadeOut(t) {
      return this.fadeIn(t, !0);
    }
    negate() {
      let t = this.rgb.map(t => 255 - t);
      return void 0 !== this.a && t.push(this.alpha), vo.fromArray(t);
    }
  }
  const wo = (t, e, i = "color-update") => {
      const r = i.includes("color") ? {
          color: e
        } : e,
        n = new CustomEvent(i, {
          bubbles: !0,
          composed: !0,
          detail: r
        });
      t.dispatchEvent(n);
    },
    xo = (t = 3, e) => {
      let i = 0,
        r = 100,
        n = 50,
        s = null,
        o = !1;
      e && (r = e.s, e.hasOwnProperty("v") ? (s = e.v, n = null, o = !0) : n = e.l);
      const a = [];
      let l, c;
      const h = (t, e) => `${t.css} ${(100 * e).toFixed(1)}%`;
      for (; i < 360;) l = vo.parse(o ? {
        h: i,
        s: r,
        v: s
      } : {
        h: i,
        s: r,
        l: n
      }), c = i / 360, a.push(h(l, c)), i += t;
      return i = 359, l = vo.parse(o ? {
        h: i,
        s: r,
        v: s
      } : {
        h: i,
        s: r,
        l: n
      }), c = 1, a.push(h(l, c)), a.join(", ");
    },
    $o = q`<svg
  stroke="currentColor"
  fill="none"
  stroke-width="0"
  viewBox="0 0 24 24"
>
  <path d="M13 7H7V5H13V7Z" fill="currentColor"></path>
  <path d="M13 11H7V9H13V11Z" fill="currentColor"></path>
  <path d="M7 15H13V13H7V15Z" fill="currentColor"></path>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M3 19V1H17V5H21V23H7V19H3ZM15 17V3H5V17H15ZM17 7V19H9V21H19V7H17Z"
    fill="currentColor"
  ></path>
</svg>`;
  class Eo extends mt {
    static properties = {
      hue: {
        type: Number
      },
      color: {
        type: Object
      },
      gradient: {
        type: String,
        attribute: !1
      },
      sliderStyle: {
        type: String,
        attribute: !1
      },
      sliderBounds: {
        type: Object
      },
      width: {
        type: Number,
        attribute: !1
      }
    };
    static styles = u`
    :host > div {
      display: block;
      width: ${d(this.width)}px;
      height: 15px;
      cursor: pointer;
      position: relative;
    }

    :host .slider {
      position: absolute;
      top: -1px;
      height: 17px;
      width: 8px;
      margin-left: -4px;
      box-shadow:
        0 0 3px #111,
        inset 0 0 2px white;
    }
  `;
    constructor() {
      super(), this.gradient = {
        backgroundImage: `linear-gradient(90deg, ${xo(24)})`
      }, this.width = 400, this.sliderStyle = {
        display: "none"
      };
    }
    firstUpdated() {
      const t = this.renderRoot.querySelector("lit-movable");
      t.onmovestart = () => {
        wo(this.renderRoot, {
          sliding: !0
        }, "sliding-hue");
      }, t.onmoveend = () => {
        wo(this.renderRoot, {
          sliding: !1
        }, "sliding-hue");
      }, t.onmove = ({
        posLeft: t
      }) => this.selectHue({
        offsetX: t
      }), this.sliderStyle = this.sliderCss(this.hue);
    }
    get sliderBounds() {
      const t = this.width / 360,
        e = Number(this.hue) * t;
      return {
        min: 0 - e,
        max: this.width - e,
        posLeft: e
      };
    }
    get sliderCss() {
      return t => {
        this.color.hsx && (t = this.color.hsx.h), void 0 === t && (t = this.color.hsl.h);
        return {
          backgroundColor: vo.parse({
            h: t,
            s: 100,
            l: 50
          }).css
        };
      };
    }
    willUpdate(t) {
      if (t.get("hue") && isFinite(this.hue)) {
        if (this.color?.hsx) return;
        const t = this.hue;
        this.sliderStyle = this.sliderCss(t);
      }
    }
    selectHue(t) {
      const e = 360 / this.width,
        i = t.offsetX,
        r = Math.max(0, Math.min(359, Math.round(i * e))),
        n = this.renderRoot.querySelector("a"),
        s = new CustomEvent("hue-update", {
          bubbles: !0,
          composed: !0,
          detail: {
            h: r
          }
        });
      n.dispatchEvent(s), this.sliderStyle = this.sliderCss(r);
    }
    render() {
      return q` <div
      style=${Li(this.gradient)}
      class="bar"
      @click="${this.selectHue}"
    >
      <lit-movable
        horizontal="${this.sliderBounds.min}, ${this.sliderBounds.max}"
        posLeft="${this.sliderBounds.posLeft}"
      >
        <a class="slider" style=${Li(this.sliderCss(this.h))}></a>
      </lit-movable>
    </div>`;
    }
  }
  customElements.get("hue-bar") || customElements.define("hue-bar", Eo);
  const So = u`
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: -1;
  background: linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.125) 25%,
      transparent 0,
      transparent 75%,
      rgba(0, 0, 0, 0.125) 0,
      rgba(0, 0, 0, 0.125) 0
    ),
    linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.125) 25%,
      transparent 0,
      transparent 75%,
      rgba(0, 0, 0, 0.125) 0,
      rgba(0, 0, 0, 0.125) 0
    ),
    #fff;
  background-repeat: repeat, repeat;
  background-position:
    0 0,
    6px 6px;
  background-size:
    12px 12px,
    12px 12px;
`,
    Co = u`
  display: inline-block;
  width: 69px;
  padding: 0.325rem 0.5rem;
  font-size: 0.9rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--input-color);
  appearance: none;
  background-color: var(--input-bg);
  background-clip: padding-box;
  border: 1px solid var(--form-border-color);
  border-radius: 3px;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
`,
    Ao = u`
  color: var(--input-active-color);
  background-color: var(--input-active-bg);
  border-color: var(--input-active-border-color);
  outline: 0;
  box-shadow: var(--input-active-box-shadow);
`,
    Po = u`
  :host {
    --font-fam: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
      "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --bg-color: rgb(30 41 59);
    --label-color: #ccc;
    --form-border-color: #495057;
    --input-active-border-color: #86b7fe;
    --input-bg: #020617;
    --input-active-bg: #4682b4;
    --input-color: #ccc;
    --input-active-color: #333;
    --input-active-box-shadow: 0 2px 5px #ccc;
    --button-active-bg: #0c5b9d;
    --button-active-color: white;
    --outer-box-shadow: 0 4px 12px #111;
  }
  :host > .outer {
    position: relative;
    background-color: var(--bg-color);
    height: 250px;
    width: 400px;
    display: block;
    padding: 10px;
    margin: 10px;
    box-shadow: var(--outer-box-shadow);
  }
  .d-flex {
    display: flex;
    width: 100%;
    margin-top: 15px;
  }
  .w-30 {
    width: 30%;
  }
  .w-40 {
    width: 40%;
    position: relative;
    height: 210px;
  }
  :host .form-control {
    ${Co}
  }
  :host .form-control:focus {
    ${Ao}
  }
  :host label {
    width: 12px;
    display: inline-block;
    color: var(--label-color);
    font-family: var(--font-fam);
  }
  :host .hsl-mode {
    padding-left: 16px;
    margin-top: 18px;
  }
  :host .button {
    padding: 0.325rem 0.5rem;
    background-color: var(--input-bg);
    border: 1px solid var(--form-border-color);
    font-family: var(--font-fam);
    color: var(--input-color);
    cursor: pointer;
    font-size: 0.9rem;
  }
  :host div.hex {
    margin-top: 27px;
    white-space: nowrap;
    position: relative;
  }
  :host dialog {
    opacity: 0;
    width: 177px;
    position: absolute;
    bottom: 30px;
    left: 0px;
    z-index: 3;
    border: 1px solid transparent;
    outline: transparent;
    box-shadow: var(--outer-box-shadow);
    background-color: var(--input-bg);
    transition: opacity 0.3s;
  }
  :host dialog.open {
    opacity: 1;
  }
  :host dialog * {
    color: var(--input-color);
  }
  :host dialog a.copy-item {
    margin-bottom: 5px;
    white-space: nowrap;
    display: block;
    width: 180px;
    cursor: pointer;
  }
  :host dialog input.form-control {
    font-size: 12px;
    display: inline-block;
    vertical-align: middle;
    width: 132px;
    padding-bottom: 2px;
    border-bottom-right-radius: 4px;
    border-top-right-radius: 4px;
    pointer-events: none;
  }
  :host dialog button.button {
    display: inline-block;
    vertical-align: middle;
    margin-left: -5px;
    font-size: 12px;
    height: 27px;
    width: 27px;
    border-bottom-right-radius: 3px;
    border-top-right-radius: 3px;
    box-sizing: border-box;
    overflow: hidden;
    outline: none;
    background-color: transparent;
  }
  :host dialog a.copy-item:hover .button,
  :host dialog a.copy-item:hover input.form-control,
  :host dialog a.copy-item:hover path {
    color: var(--button-active-color);
    background-color: var(--button-active-bg);
    fill: var(--button-active-color);
    cursor: pointer;
  }
  :host dialog .button svg {
    height: 15px;
    width: 15px;
    margin-left: -3px;
  }
  :host div.hex input {
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
    vertical-align: middle;
    display: inline-block;
  }
  :host .button.copy {
    padding: 8px 6px 5px 5px;
    position: relative;
    position: relative;
    border-left: 0;
    border-bottom-right-radius: 3px;
    border-top-right-radius: 3px;
    height: 34px;
    display: inline-block;
    box-sizing: border-box;
    overflow: hidden;
    vertical-align: middle;
  }
  :host .button.copy svg {
    height: 16px;
    width: 15px;
    margin-right: -2px;
  }
  :host .button.copy span {
    font-size: 10px;
    position: relative;
    top: -3px;
  }
  :host a.button.l {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }
  :host a.button.r {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    border-left: none;
  }
  :host a.button.active {
    color: #eee;
    background-color: var(--button-active-bg);
    cursor: default;
  }
  :host .ok {
    position: absolute;
    bottom: 0;
    right: 0;
  }
  :host .ok a {
    border-radius: 3px;
    padding: 6px 12px;
  }
  :host .swatch {
    height: 14px;
    width: 14px;
    display: inline-block;
    position: relative;
    top: 2px;
    margin-left: 3px;
  }
  :host .swatch span {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }
  :host .swatch span.checky {
    ${So}
    z-index: 0;
  }
`,
    To = u`
  :host > div {
    margin-bottom: 8px;
    display: block;
    position: relative;
  }

  :host label {
    width: 12px;
    display: inline-block;
    color: var(--label-color);
    font-family: var(--font-fam);
  }

  :host .form-control {
    ${Co}
  }

  :host .form-control:focus {
    ${Ao}
  }

  :host .preview-bar {
    height: 4px;
    width: 85.5px;
    position: absolute;
    bottom: 0px;
    right: 17.5px;
    --pct: 0;
    pointer-events: none;
    z-index: 2;
  }

  :host .preview-bar:after {
    position: absolute;
    content: "";
    background-image: var(--preview);
    background-color: transparent;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    box-shadow: inset 0 -1px 1px var(--form-border-color);
    height: 100%;
    width: 100%;
  }

  :host > div.active .preview-bar {
    width: 128px;
    bottom: -23px;
    right: -9px;
    height: 10px;
    border: 8px solid var(--input-bg);
    box-shadow: var(--input-active-box-shadow);
    pointer-events: all;
    z-index: 2;
    cursor: pointer;
  }
  :host > div.active .preview-bar:after {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  :host .preview-bar .pct {
    bottom: -3px;
    margin-top: -0.75px;
    position: absolute;
    width: 3px;
    height: 11px;
    background: 0 0;
    left: var(--pct);
    display: inline-block;
    z-index: 3;
    pointer-events: none;
  }

  :host .preview-bar .pct:before {
    content: "";
    height: 7px;
    width: 5px;
    position: absolute;
    left: -2.5px;
    top: 2.5px;
    background-color: #fff;
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
  :host .active .preview-bar .pct:before {
    width: 7px;
    height: 11px;
    left: -3.5px;
    top: -1px;
  }
  :host .transparent-checks {
    ${So}
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  :host div.active .transparent-checks {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
`,
    ko = {
      r: "R (red) channel",
      g: "G (green) channel",
      b: "B (blue) channel",
      h: "H (hue) channel",
      s: "S (saturation) channel",
      v: "V (value / brightness) channel",
      l: "L (luminosity) channel",
      a: "A (alpha / opacity) channel"
    };
  class Mo extends mt {
    static properties = {
      group: {
        type: String
      },
      channel: {
        type: String
      },
      color: {
        type: Object
      },
      isHsl: {
        type: Boolean
      },
      c: {
        type: Object,
        state: !0,
        attribute: !1
      },
      previewGradient: {
        type: Object,
        state: !0,
        attribute: !1
      },
      active: {
        type: Boolean,
        state: !0,
        attribute: !1
      },
      max: {
        type: Number,
        state: !0,
        attribute: !1
      },
      v: {
        type: Number,
        state: !0,
        attribute: !1
      }
    };
    static styles = To;
    clickPreview(t) {
      const e = Math.max(0, Math.min(t.offsetX, 128));
      let i = Math.round(e / 128 * this.max);
      "a" === this.channel && (i = Number((e / 127).toFixed(2))), this.valueChange(null, i), this.setActive(!1);
    }
    valueChange = (t, e = null) => {
      e = e ?? Number(this.renderRoot.querySelector("input").value), "a" === this.channel && (e /= 100), this.c[this.channel] = e;
      const i = vo.parse(this.c);
      "rgb" !== this.group && (i.hsx = this.c), this.c = "rgb" === this.group ? this.color.rgbObj : this.isHsl ? this.color.hsl : this.color.hsv, wo(this.renderRoot, i);
    };
    setActive(t) {
      this.active = t, t && this.renderRoot.querySelector("input").select();
    }
    constructor() {
      super();
    }
    setPreviewGradient() {
      let t;
      t = "rgb" === this.group ? this.color.rgbObj : this.color.hsx ? this.color.hsx : this.isHsl ? this.color.hsl : this.color.hsv, this.c = t;
      const e = this.group,
        i = this.channel,
        r = "a" === i;
      this.v = t[i], r && (this.v *= 100);
      let n,
        s,
        o = 255;
      if ("rgb" !== e || "a" === i) {
        if ("h" === i) return o = this.max = 359, void (this.previewGradient = {
          "--preview": `linear-gradient(90deg, ${xo(24, t)})`,
          "--pct": t.h / o * 100 + "%"
        });
        o = r ? 1 : 100;
      }
      if (this.max = o, n = {
        ...t
      }, s = n, n[this.channel] = 0, n = vo.parse(n), s[this.channel] = o, s = vo.parse(s), "l" === this.channel) {
        const e = {
          ...t
        };
        e.l = 50, this.previewGradient = {
          "--preview": `linear-gradient(90deg, ${n.hex}, ${vo.parse(e).hex}, ${s.hex})`,
          "--pct": t[this.channel] / o * 100 + "%"
        };
      } else this.previewGradient = {
        "--preview": `linear-gradient(90deg, ${r ? n.css : n.hex}, ${r ? s.css : s.hex})`,
        "--pct": t[this.channel] / o * 100 + "%"
      };
    }
    willUpdate(t) {
      this.setPreviewGradient();
    }
    render() {
      const t = "a" === this.channel ? q`<div class="transparent-checks"></div>` : null,
        e = "a" === this.channel ? 100 : this.max;
      return q` <div class="${Bi({
        active: this.active
      })}">
      <label for="channel_${this.ch}">${this.channel.toUpperCase()}</label>
      <input
        id="channel_${this.ch}"
        aria-label="${ko[this.channel]}"
        class="form-control"
        .value="${Math.round(this.v)}"
        type="number"
        min="0"
        max="${e}"
        @input="${this.valueChange}"
        @focus="${() => this.setActive(!0)}"
        @blur="${() => this.setActive(!1)}"
      />
      <div
        class="preview-bar"
        style="${Li(this.previewGradient)}"
        @mousedown="${this.clickPreview}"
      >
        <div class="pct"></div>
        ${t}
      </div>
    </div>`;
    }
  }
  customElements.get("color-input-channel") || customElements.define("color-input-channel", Mo);
  class Ho extends mt {
    static properties = {
      color: {
        type: Object
      },
      isHsl: {
        type: Boolean
      },
      size: {
        type: Number
      },
      debounceMode: {
        type: Boolean
      },
      ctx: {
        type: Object,
        state: !0,
        attribute: !1
      },
      hsw: {
        type: Object,
        state: !0,
        attribute: !1
      },
      circlePos: {
        type: Object,
        state: !0,
        attribute: !1
      }
    };
    static styles = u`
    :host .outer {
      position: absolute;
      top: 0;
      right: 0;
    }

    :host .outer canvas {
      height: inherit;
      width: inherit;
      cursor: pointer;
    }

    :host .circle {
      height: 12px;
      width: 12px;
      border: solid 2px #eee;
      border-radius: 50%;
      box-shadow:
        0 0 3px #000,
        inset 0 0 1px #fff;
      position: absolute;
      margin: -8px;
      mix-blend-mode: difference;
    }
  `;
    constructor() {
      super(), this.isHsl = !0, this.circlePos = {
        top: 0,
        left: 0,
        bounds: {
          x: "",
          y: ""
        }
      }, this.size = 160;
    }
    setColor(t) {
      wo(this.renderRoot, t);
    }
    setCircleCss(t, e) {
      const i = `${t}`,
        r = `${e}`,
        n = {
          x: `0, ${this.size}`,
          y: `0,${this.size}`
        };
      this.circlePos = {
        top: r,
        left: i,
        bounds: n
      };
    }
    pickCoord({
      offsetX: t,
      offsetY: e
    }) {
      const i = t,
        r = e,
        {
          size: n,
          hsw: s,
          isHsl: o,
          color: a
        } = this;
      let l = (n - r) / n;
      l = Math.round(100 * l);
      const c = Math.round(i / n * 100),
        h = {
          h: s.h,
          s: c,
          [o ? "l" : "v"]: l
        },
        d = o ? vo.fromHsl(h) : vo.fromHsv(h);
      this.setCircleCss(i, r), d.a = a.alpha, d.hsx = h, d.fromHSLCanvas = !0, this.setColor(d);
    }
    debouncePaintDetail(t) {
      clearTimeout(this.bouncer), this.bouncer = setTimeout(() => this.paintHSL(t, !0), 50), this.paintHSL(t, !1);
    }
    paintHSL(t, e = null) {
      if (this.debounceMode && null === e) return this.debouncePaintDetail(t);
      const {
        ctx: i,
        color: r,
        isHsl: n,
        size: s
      } = this;
      if (!i) return;
      const o = r;
      (t = t ?? n ? o.hsl : o.hsv).w = n ? t.l : t.v;
      const {
          h: a,
          s: l,
          w: c
        } = t,
        h = this.hsw = {
          h: a,
          s: l,
          w: c
        },
        d = s / 100,
        u = n ? (t, e, i) => `hsl(${t}, ${e}%, ${100 - i}%)` : (t, e, i) => vo.fromHsv({
          h: t,
          s: e,
          v: 100 - i
        }).hex,
        p = !1 === e ? 4 : 1;
      for (let t = 0; t < 100; t += p) for (let e = 0; e < 100; e += p) i.fillStyle = u(a, t, e), i.fillRect(t, e, t + p, e + p);
      this.setCircleCss(h.s * d, s - t.w * d);
    }
    willUpdate(t) {
      if (t.has("color") || t.has("isHsl")) {
        if (this.color?.hsx) return this.color.fromHSLCanvas ? void delete this.color.fromHSLCanvas : this.paintHSL(this.color.hsx);
        this.paintHSL();
      }
    }
    firstUpdated(t) {
      const e = this.renderRoot.querySelector("canvas");
      this.ctx = e.getContext("2d"), this.paintHSL();
    }
    circleMove({
      posTop: t,
      posLeft: e
    }) {
      this.pickCoord({
        offsetX: e,
        offsetY: t
      });
    }
    render() {
      const t = {
          height: this.size + "p",
          width: this.size + "px"
        },
        {
          top: e,
          left: i,
          bounds: r
        } = this.circlePos;
      return q` <div
      class="outer"
      @click="${this.pickCoord}"
      style="${Li(t)}"
    >
      <canvas height="100" width="100"></canvas>
      <lit-movable
        boundsX="${r.x}"
        boundsY="${r.y}"
        posTop="${e}"
        posLeft="${i}"
        .onmove="${t => this.circleMove(t)}"
      >
        <div class="circle"></div>
      </lit-movable>
    </div>`;
    }
  }
  customElements.get("hsl-canvas") || customElements.define("hsl-canvas", Ho);
  const Bo = t => isFinite(t) ? Number(t) : Number(t.replace(/[^0-9.\-]/g, "")),
    Fo = t => (t = Number(t), (isNaN(t) || [void 0, null].includes(t)) && (t = 0), t);
  class Io {
    constructor(t, e) {
      this.x = Fo(t), this.y = Fo(e);
    }
    static fromPointerEvent(t) {
      const {
        pageX: e,
        pageY: i
      } = t;
      return new Io(e, i);
    }
    static fromElementStyle(t) {
      const e = Bo(t.style.left ?? 0),
        i = Bo(t.style.top ?? 0);
      return new Io(e, i);
    }
    static fromObject({
      x: t,
      y: e
    }) {
      return new Io(t, e);
    }
    get top() {
      return this.y;
    }
    set top(t) {
      this.y = t;
    }
    get left() {
      return this.x;
    }
    set left(t) {
      this.x = t;
    }
  }
  class Lo {
    constructor(t = -1 / 0, e = 1 / 0) {
      this.min = t, this.max = e, this.attr = "";
    }
    get constrained() {
      return this.min === this.max;
    }
    get unconstrained() {
      return this.min === -1 / 0 && this.max === 1 / 0;
    }
    static fromString(t = null, e = 0) {
      if (!t) return new Lo();
      if ("null" === t) return new Lo(0, 0);
      const [i, r] = t.split(",").map(t => Number(t.trim()) + e),
        n = new Lo(i, r);
      return n.attr = t, n;
    }
  }
  class Do extends mt {
    _target;
    _targetSelector = null;
    _boundsX = new Lo();
    _boundsY = new Lo();
    isMoving = !1;
    moveState = {};
    _vertical = null;
    _horizontal = null;
    _posTop = null;
    _posLeft = null;
    _grid = 1;
    pointerId;
    constructor() {
      super();
    }
    get vertical() {
      return this._vertical;
    }
    set vertical(t) {
      this.boundsY = t, this.boundsX = "null", this._vertical = t;
    }
    get horizontal() {
      return this._horizontal;
    }
    set horizontal(t) {
      this.boundsX = t, this.boundsY = "null", this._horizontal = t;
    }
    set posTop(t) {
      t = Number(t), this._posTop = t, this.target && (this.target.style.top = t + "px");
    }
    get posTop() {
      return this._posTop;
    }
    set posLeft(t) {
      t = Number(t), this._posLeft = t, this.target && (this.target.style.left = t + "px");
    }
    get posLeft() {
      return this._posLeft;
    }
    get grid() {
      return this._grid;
    }
    set grid(t) {
      this._grid = t > 0 && t < 1 / 0 ? t : 1;
    }
    get bounds() {
      return {
        left: this._boundsX,
        top: this._boundsY
      };
    }
    set targetSelector(t) {
      this._targetSelector = t, this._retryTarget = null === document.querySelector(t), this._target = document.querySelector(t);
    }
    get targetSelector() {
      return this._targetSelector;
    }
    get target() {
      return this._target ?? this;
    }
    set target(t) {
      this._target = t;
    }
    get boundsX() {
      return this._boundsX;
    }
    set boundsX(t) {
      this._boundsX = Lo.fromString(t, Bo(this.target?.style.left ?? 0)), this.bounds.left = this._boundsX;
    }
    get boundsY() {
      return this._boundsY;
    }
    set boundsY(t) {
      this._boundsY = Lo.fromString(t, Bo(this.target?.style.top ?? 0)), this.bounds.top = this._boundsY;
    }
    static properties = {
      posLeft: {
        type: Number
      },
      posTop: {
        type: Number
      },
      target: {
        type: Object,
        attribute: !1,
        state: !0
      },
      targetSelector: {
        type: String
      },
      bounds: {
        type: Object,
        attribute: !1,
        state: !0
      },
      boundsX: {
        type: String
      },
      boundsY: {
        type: String
      },
      vertical: {
        type: String
      },
      horizontal: {
        type: String
      },
      grid: {
        type: Number
      },
      shiftBehavior: {
        type: Boolean
      },
      disabled: {
        type: Boolean
      },
      eventsOnly: {
        type: Boolean
      },
      listening: {
        type: Boolean
      },
      onmovestart: {
        type: Object
      },
      onmoveend: {
        type: Object
      },
      onmove: {
        type: Object
      }
    };
    firstUpdated(t) {
      this._retryTarget && (this.target = document.querySelector(this.targetSelector));
      const {
          bounds: e,
          target: i,
          posTop: r,
          posLeft: n
        } = this,
        {
          offsetLeft: s,
          offsetTop: o,
          style: {
            left: a,
            top: l
          }
        } = this.target;
      i.classList.add("--movable-base"), this.renderRoot.addEventListener("pointerdown", t => this.pointerdown(t)), i.style.position = "absolute", i.style.cursor = "pointer", n ? i.style.left = n + "px" : !a && s && (i.style.left = s + "px", e.left.constrained && (e.left.min = e.left.max = s)), r ? i.style.top = r + "px" : !l && o && (i.style.top = o + "px", e.top.constrained && (e.top.min = e.top.max = o));
    }
    reposition(t) {
      if ("object" == typeof t) {
        const {
          eventsOnly: e,
          target: i
        } = this;
        this.posTop = t.top, this.posLeft = t.left, i && !e && (i.style.left = t.left + "px", i.style.top = t.top + "px");
      } else this.isMoving = t;
    }
    moveInit(t) {
      const e = this.moveState,
        {
          target: i,
          bounds: r
        } = this;
      e.mouseCoord = Io.fromPointerEvent(t), e.startCoord = Io.fromElementStyle(i), e.moveDist = new Io(0, 0), e.totalDist = new Io(0, 0), e.clickOffset = (t => {
        const e = Io.fromPointerEvent(t),
          i = t.target.getBoundingClientRect(),
          r = e.x - (i.left + document.body.scrollLeft),
          n = e.y - (i.top + document.body.scrollTop);
        return new Io(r, n);
      })(t), e.coords = Io.fromObject(e.startCoord), e.maxX = isFinite(r.left.min) && isFinite(r.left.max) ? r.left.min + r.left.max : 1 / 0, e.maxY = isFinite(r.top.min) && isFinite(r.top.max) ? r.top.min + r.top.max : 1 / 0, this.isMoving = !0, this.reposition(!0), this.eventBroker("movestart", t);
    }
    eventBroker(t, e) {
      this.moveState.posTop = this.posTop, this.moveState.posLeft = this.posLeft;
      const i = new CustomEvent(t, {
        bubbles: !0,
        composed: !0,
        detail: {
          ...e,
          ...this.moveState,
          element: this
        }
      });
      this.renderRoot.dispatchEvent(i);
      const r = this[`on${t}`];
      r && r({
        ...e,
        ...this.moveState,
        me: this
      });
    }
    unbind(t) {
      this.pointerId = null, document.body.removeEventListener("pointermove", t => this.motionHandler(t)), this.moveEnd(t);
    }
    moveEnd(t) {
      this.isMoving && (this.isMoving = this.moveState.isMoving = !1, this.reposition(!1), this.eventBroker("moveend", t));
    }
    motionHandler(t) {
      t.stopPropagation();
      const e = Io.fromPointerEvent(t),
        i = this.moveState,
        {
          grid: r,
          bounds: n,
          shiftBehavior: s,
          boundsX: o,
          boundsY: a
        } = this;
      if (i.moveDist = Io.fromObject({
        x: e.x - i.mouseCoord.x,
        y: e.y - i.mouseCoord.y
      }), i.mouseCoord = e, i.totalDist = Io.fromObject({
        x: i.totalDist.x + i.moveDist.x,
        y: i.totalDist.y + i.moveDist.y
      }), i.coords = Io.fromObject({
        x: Math.round(i.totalDist.x / r) * r + i.startCoord.x,
        y: Math.round(i.totalDist.y / r) * r + i.startCoord.y
      }), s && t.shiftKey && o.unconstrained && a.unconstrained) {
        const {
          x: t,
          y: e
        } = i.totalDist;
        Math.abs(t) > Math.abs(e) ? i.coords.top = i.startCoord.y : i.coords.left = i.startCoord.x;
      } else i.coords.y = Math.min(Math.max(n.top.min, i.coords.top), n.top.max), i.coords.x = Math.min(Math.max(n.left.min, i.coords.left), n.left.max);
      isFinite(i.maxX) && (i.pctX = Math.max(n.left.min, i.coords.left) / i.maxX), isFinite(i.maxY) && (i.pctY = Math.max(n.top.min, i.coords.top) / i.maxY), this.reposition(i.coords), this.eventBroker("move", t);
    }
    pointerdown(t) {
      document.body.setPointerCapture(t.pointerId), t.preventDefault(), t.stopPropagation(), void 0 !== t.pointerId && (this.pointerId = t.pointerId), this.listening || (document.body.addEventListener("pointerup", t => {
        this.isMoving && this.unbind(t);
      }, !1), document.body.addEventListener("pointermove", t => {
        void 0 !== this.pointerId && t.pointerId === this.pointerId && this.motionHandler(t);
      }, !1)), this.listening = !0, this.moveInit(t);
    }
    render() {
      return q`<slot></slot>`;
    }
  }
  window.customElements.get("lit-movable") || window.customElements.define("lit-movable", Do);
  class Oo extends mt {
    static properties = {
      color: {
        type: Object,
        state: !0,
        attribute: !1
      },
      hex: {
        type: String,
        state: !0,
        attribute: !1
      },
      value: {
        type: String
      },
      isHsl: {
        type: Boolean,
        state: !0,
        attribute: !1
      },
      copied: {
        type: String
      },
      debounceMode: {
        type: Boolean
      },
      buttonDisabled: {
        attribute: "button-disabled",
        type: Boolean
      }
    };
    static styles = Po;
    _color;
    constructor() {
      super(), this._color = vo.parse(_o.slateblue), this.isHsl = !0, this.buttonDisabled = !1;
    }
    firstUpdated(t) {
      this.debounceMode = !1, t.has("value") && (this.color = vo.parse(this.value));
    }
    get color() {
      return this._color;
    }
    set color(t) {
      (t = t.hsx ? t : t.rgba ? vo.parse(...t.rgba) : vo.parse(t)) && (this.hex = t.hex, this._color = t, wo(this.renderRoot, t, "colorchanged"));
    }
    updateColor({
      detail: {
        color: t
      }
    }) {
      this.color = t;
    }
    setColor(t) {
      const e = this.renderRoot.querySelector("input#hex").value,
        i = vo.parse(e);
      i ? this.color = i : console.log(`ignored unparsable input: ${e}`);
    }
    setHue({
      detail: {
        h: t
      }
    }) {
      let {
        s: e,
        l: i,
        a: r
      } = this.color.hsl;
      1 === r && (r = void 0), this.color = {
        h: t,
        s: e,
        l: i,
        a: r
      };
    }
    setHsl(t) {
      this.isHsl = t;
    }
    okColor() {
      wo(this.renderRoot, this.color, "colorpicked");
    }
    showCopyDialog() {
      if (this.copied = null, this.dlg = this.dlg ?? this.renderRoot.querySelector("dialog"), this.dlg.open) return this.dlg.classList.remove("open"), this.dlg.close();
      this.dlg.show(), this.dlg.classList.add("open");
    }
    clipboard(t) {
      const e = this.color.toString(t),
        i = window.navigator.clipboard;
      i && i.writeText ? i.writeText(e).then(() => this.hideCopyDialog(e), () => this.hideCopyDialog(e)) : this.hideCopyDialog(e);
    }
    hideCopyDialog(t) {
      if (t) return this.copied = t, setTimeout(() => this.dlg.classList.remove("open"), 400), void setTimeout(() => this.hideCopyDialog(), 1200);
      this.dlg.classList.remove("open"), this.dlg.close(), this.copied = null;
    }
    setSliding({
      detail: t
    }) {
      this.debounceMode = t.sliding;
    }
    render() {
      const t = this.isHsl ? ["h", "s", "l"] : ["h", "s", "v"],
        e = {
          button: !0,
          active: !this.isHsl,
          l: !0
        },
        i = {
          button: !0,
          active: this.isHsl,
          r: !0
        },
        r = {
          backgroundColor: this.color
        },
        n = this.copied ? {
          textAlign: "center",
          display: "block"
        } : {
          display: "none"
        },
        s = this.debounceMode;
      return q` <div class="outer">
      <hue-bar
        @sliding-hue="${this.setSliding}"
        hue="${this.color.hsx ? this.color.hsx.h : this.color.hsl.h}"
        @hue-update="${this.setHue}"
        .color="${this.color}"
      ></hue-bar>
      <div class="d-flex">
        <div class="col w-30">
          ${["r", "g", "b", "a"].map(t => q`
              <color-input-channel
                group="rgb"
                channel="${t}"
                isHsl="${this.isHsl}"
                .color="${this.color}"
                @color-update="${this.updateColor}"
              />
            `)}
          <div class="hex">
            <dialog @blur="${() => this.hideCopyDialog()}" tabindex="0">
              <sub class="copied" style="${Li(n)}"
                >copied <em>${this.copied}</em></sub
              >
              ${this.copied ? q`` : q`
                    <a
                      class="copy-item"
                      @click=${t => this.clipboard("hex", t)}
                      id="copyHex"
                    >
                      <input
                        class="form-control"
                        disabled="disabled"
                        value="${this.color.hex}"
                      />
                      <button
                        title="Copy HEX String"
                        class="button"
                        tabindex="0"
                      >
                        ${$o}
                      </button>
                    </a>
                    <a
                      class="copy-item"
                      @click=${t => this.clipboard("css", t)}
                      id="copyRgb"
                    >
                      <input
                        class="form-control"
                        disabled="disabled"
                        value="${this.color.css}"
                      />
                      <button
                        title="Copy RGB String"
                        class="button"
                        tabindex="0"
                      >
                        ${$o}
                      </button>
                    </a>
                    <a
                      class="copy-item"
                      id="copyHsl"
                      @click=${t => this.clipboard(this.color.alpha < 1 ? "hsla" : "hsl", t)}
                    >
                      <input
                        class="form-control"
                        disabled="disabled"
                        value="${this.color.toString(this.color.alpha < 1 ? "hsla" : "hsl")}"
                      />
                      <button
                        title="Copy HSL String"
                        class="button"
                        tabindex="0"
                      >
                        ${$o}
                      </button>
                    </a>
                  `}
            </dialog>
            <label for="hex">#</label>
            <input
              aria-label="Hexadecimal value (editable - accepts any valid color string)"
              @input="${this.setColor}"
              class="form-control"
              id="hex"
              placeholder="Set color"
              value="${this.hex}"
            /><a
              title="Show copy to clipboard menu"
              @click="${this.showCopyDialog}"
              class="button copy"
            >
              ${$o}
              <span>&#11205;</span>
            </a>
          </div>
        </div>
        <div class="col w-30">
          ${t.map(t => q`
              <color-input-channel
                group="hsl"
                channel="${t}"
                .isHsl="${this.isHsl}"
                .color="${this.color}"
                @color-update="${this.updateColor}"
              />
            `)}
          <div class="hsl-mode">
            <a
              title="Use hue / saturation / value (brightness) mode"
              class="${Bi(e)}"
              @click="${() => this.setHsl(!1)}"
              >HSV</a
            ><a
              title="Use hue / saturation / luminosity mode"
              class="${Bi(i)}"
              @click="${() => this.setHsl(!0)}"
              >HSL</a
            >
          </div>
        </div>
        <div class="w-40">
          <hsl-canvas
            .debounceMode="${s}"
            size="${160}"
            .isHsl="${this.isHsl}"
            .color="${this.color}"
            @color-update="${this.updateColor}"
          ></hsl-canvas>
          <div class="ok">
            <a
              class="button"
              .disabled=${this.buttonDisabled}
              @click="${this.okColor}"
              >OK
              <span class="swatch">
                <span style="${Li(r)}"></span>
                <span class="checky"></span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>`;
    }
  }
  window.customElements.get("color-picker") || window.customElements.define("color-picker", Oo);
  const No = {
    keyframeOptions: {
      duration: 250,
      direction: "alternate",
      easing: "ease-in-out"
    },
    properties: ["height", "opacity", "scale"]
  };
  let zo = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this.spoolList = [], this.spool_index = -1, this._isOpen = !1, this._changingSlot = !1, this._colourPresetChange = t => {
        this.color = t.currentTarget.preset, this._elColorPicker && (this._elColorPicker.color = this.color);
      }, this._handleModalEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.modalOpen && (this._isOpen = !0, this.box_id = Number(e.detail.box_id), this.spool_index = Number(e.detail.spool_index), this.material_type = Ei(e.detail.material_type), this.color = e.detail.color);
      }, this._handleDropdownEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.value && (this.material_type = Ei(e.detail.value));
      }, this._handleColourEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.color && (this.color = e.detail.color.rgb);
      }, this._handleColourPickEvent = t => {
        this._handleColourEvent(t), this._changingSlot || this._submitSlotChanges();
      }, this._handleSaveButton = () => {
        this._submitSlotChanges();
      }, this._closeModal = t => {
        t && t.stopPropagation(), this._isOpen = !1, this.spool_index = -1, this.material_type = void 0, this.color = void 0, this.box_id = 0;
      }, this._cardClick = t => {
        t.stopPropagation();
      };
    }
    async firstUpdated() {
      this.addEventListener("click", t => {
        this._closeModal(t);
      }), this.addEventListener("ac-select-dropdown", this._handleDropdownEvent), this.addEventListener("colorchanged", this._handleColourEvent), this.addEventListener("colorpicked", this._handleColourPickEvent);
    }
    connectedCallback() {
      var t;
      super.connectedCallback(), null === (t = this.parentElement) || void 0 === t || t.addEventListener("ac-mcb-modal", this._handleModalEvent);
    }
    disconnectedCallback() {
      var t;
      null === (t = this.parentElement) || void 0 === t || t.removeEventListener("ac-mcb-modal", this._handleModalEvent), super.disconnectedCallback();
    }
    willUpdate(t) {
      super.willUpdate(t), t.has("language") && (this._heading = Nn("card.spool_settings.heading", this.language), this._labelSelectMaterial = Nn("card.spool_settings.label_select_material", this.language), this._labelSelectColour = Nn("card.spool_settings.label_select_colour", this.language), this._buttonSave = Nn("common.actions.save", this.language));
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return q`
      <div
        class="ac-modal-container"
        style=${Li({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${qs(Object.assign({}, No))}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this.color ? this._renderCard() : J}
        </div>
      </div>
    `;
    }
    _renderCard() {
      return this.spool_index >= 0 ? q`
          <div>
            <div class="ac-slot-title">
              ${this._heading}: ${this.spool_index + 1}
            </div>
            <div>
              <div>
                <p class="ac-modal-label">${this._labelSelectMaterial}:</p>
                <anycubic-ui-select-dropdown
                  .availableOptions=${Ft}
                  .placeholder=${Ft.PLA}
                  .initialItem=${this.material_type}
                ></anycubic-ui-select-dropdown>
              </div>
              ${this._renderPresets()}
              <div>
                <p class="ac-modal-label">${this._labelSelectColour}:</p>
                <color-picker .value=${this.color}></color-picker>
              </div>
            </div>
            <div class="ac-save-settings">
              <ha-control-button
                .disabled=${this._changingSlot}
                @click=${this._handleSaveButton}
              >
                ${this._buttonSave}
              </ha-control-button>
            </div>
          </div>
        ` : J;
    }
    _renderPresets() {
      return q`
      <div>
        <p class="ac-modal-label">Choose Preset Colour:</p>
        <div class="ac-mcb-presets">
          ${this.slotColors ? us(this.slotColors, (t, e) => q`
                  <div
                    class="ac-mcb-preset-color"
                    style=${Li({
        "background-color": t
      })}
                    .preset=${t}
                    @click=${this._colourPresetChange}
                  >
                    &nbsp;
                  </div>
                `) : J}
        </div>
      </div>
    `;
    }
    _submitSlotChanges() {
      if (this.selectedPrinterDevice && this.material_type && this.spool_index >= 0 && this.color && this.color.length >= 3) {
        const t = `multi_color_box_set_slot_${this.material_type.toLowerCase()}`;
        this._changingSlot = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          box_id: this.box_id,
          slot_number: this.spool_index + 1,
          slot_color_red: this.color[0],
          slot_color_green: this.color[1],
          slot_color_blue: this.color[2]
        }).then(() => {
          this._changingSlot = !1;
        }).catch(t => {
          this._changingSlot = !1;
        }), this._closeModal();
      }
    }
    static get styles() {
      return u`
      ${Xs}

      .ac-slot-title {
        font-size: 24px;
        text-align: center;
        font-weight: 600;
      }

      .ac-mcb-presets {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
      }

      .ac-mcb-preset-color {
        width: 30px;
        height: 30px;
        border-radius: 15px;
        margin: 20px 10px;
      }

      ha-control-button {
        min-width: 150px;
        margin: 30px auto 0px;
        font-size: 14px;
      }

      color-picker {
        --font-fam: var(--token-font-family-primary);
        --bg-color: var(--ha-card-background);
        --label-color: var(--secondary-text-color);
        --form-border-color: var(--ha-card-background);
        --input-active-border-color: var(--primary-color);
        --input-bg: var(--primary-background-color);
        --input-active-bg: var(--ha-card-background);
        --input-color: var(--secondary-text-color);
        --input-active-color: var(--primary-text-color);
        --input-active-box-shadow: 0 2px 5px #ccc;
        --button-active-bg: var(--state-active-color);
        --button-active-color: var(--token-color-icon-primary);
        --outer-box-shadow: 0 4px 12px #111;
      }
    `;
    }
  };
  n([xt("color-picker")], zo.prototype, "_elColorPicker", void 0), n([_t()], zo.prototype, "hass", void 0), n([_t()], zo.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], zo.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "slot-colors"
  })], zo.prototype, "slotColors", void 0), n([vt()], zo.prototype, "box_id", void 0), n([vt()], zo.prototype, "spoolList", void 0), n([vt()], zo.prototype, "spool_index", void 0), n([vt()], zo.prototype, "material_type", void 0), n([vt()], zo.prototype, "color", void 0), n([vt()], zo.prototype, "_isOpen", void 0), n([vt()], zo.prototype, "_heading", void 0), n([vt()], zo.prototype, "_labelSelectMaterial", void 0), n([vt()], zo.prototype, "_labelSelectColour", void 0), n([vt()], zo.prototype, "_buttonSave", void 0), n([vt()], zo.prototype, "_changingSlot", void 0), zo = n([$t("anycubic-printercard-multicolorbox_modal_spool")], zo);
  const Uo = {
    keyframeOptions: {
      duration: 250,
      direction: "alternate",
      easing: "ease-in-out"
    },
    properties: ["height", "opacity", "scale"]
  };
  let Ro = class extends mt {
    constructor() {
      super(...arguments), this.availableSpeedModes = {}, this.isFDM = !1, this.currentSpeedModeKey = 0, this.currentSpeedModeDescr = void 0, this._userEditSpeedMode = !1, this.currentFanSpeed = 0, this._userEditFanSpeed = !1, this.currentAuxFanSpeed = 0, this._userEditAuxFanSpeed = !1, this.currentBoxFanSpeed = 0, this._userEditBoxFanSpeed = !1, this.currentTargetTempNozzle = 0, this.minTargetTempNozzle = 0, this.maxTargetTempNozzle = 0, this._userEditTargetTempNozzle = !1, this.currentTargetTempHotbed = 0, this.minTargetTempHotbed = 0, this.maxTargetTempHotbed = 0, this._userEditTargetTempHotbed = !1, this._isOpen = !1, this._changingSettings = !1, this._setConfirmationMode = t => {
        this._confirmationType = t.currentTarget.confirmation_type, this._confirmMessage = Nn("card.print_settings.confirm_message", this.language, "action", Nn("common.actions." + this._confirmationType, this.language));
      }, this._handleConfirmApprove = () => {
        switch (this._confirmationType) {
          case It.PAUSE:
            this._pressHassButton("pause_print");
            break;
          case It.RESUME:
            this._pressHassButton("resume_print");
            break;
          case It.CANCEL:
            this._pressHassButton("cancel_print");
        }
        this._confirmationType = void 0, this._closeModal();
      }, this._handleConfirmCancel = () => {
        this._confirmationType = void 0;
      }, this._handleFanSpeedChange = t => {
        const e = t.currentTarget.value;
        this.currentFanSpeed = Number(e), this._userEditFanSpeed = !0;
      }, this._handleAuxFanSpeedChange = t => {
        const e = t.currentTarget.value;
        this.currentAuxFanSpeed = Number(e), this._userEditAuxFanSpeed = !0;
      }, this._handleBoxFanSpeedChange = t => {
        const e = t.currentTarget.value;
        this.currentBoxFanSpeed = Number(e), this._userEditBoxFanSpeed = !0;
      }, this._handleFanSpeedKeyDown = t => {
        "Enter" === t.code ? (t.preventDefault(), this._submitChangedFanSpeed()) : this._userEditFanSpeed = !0;
      }, this._handleAuxFanSpeedKeyDown = t => {
        "Enter" === t.code ? (t.preventDefault(), this._submitChangedAuxFanSpeed()) : this._userEditAuxFanSpeed = !0;
      }, this._handleBoxFanSpeedKeyDown = t => {
        "Enter" === t.code ? (t.preventDefault(), this._submitChangedBoxFanSpeed()) : this._userEditBoxFanSpeed = !0;
      }, this._handleTargetTempNozzleChange = t => {
        const e = t.currentTarget.value;
        this.currentTargetTempNozzle = Number(e), this._userEditTargetTempNozzle = !0;
      }, this._handleTargetTempHotbedChange = t => {
        const e = t.currentTarget.value;
        this.currentTargetTempHotbed = Number(e), this._userEditTargetTempHotbed = !0;
      }, this._handleTargetTempNozzleKeyDown = t => {
        "Enter" === t.code ? (t.preventDefault(), this._submitChangedTargetTempNozzle()) : this._userEditTargetTempNozzle = !0;
      }, this._handleTargetTempHotbedKeyDown = t => {
        "Enter" === t.code ? (t.preventDefault(), this._submitChangedTargetTempHotbed()) : this._userEditTargetTempHotbed = !0;
      }, this._handleModalEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.modalOpen && (this._isOpen = !0, this._resetUserEdits());
      }, this._handleDropdownEvent = t => {
        const e = t;
        e.stopPropagation(), this._userEditSpeedMode = !0, void 0 !== e.detail.key && (this.currentSpeedModeKey = e.detail.key, this.currentSpeedModeDescr = this.currentSpeedModeKey >= 0 && this.currentSpeedModeKey in this.availableSpeedModes ? this.availableSpeedModes[this.currentSpeedModeKey] : void 0);
      }, this._handleSaveFanSpeedButton = () => {
        this._submitChangedFanSpeed(), this._resetUserEdits();
      }, this._handleSaveAuxFanSpeedButton = () => {
        this._submitChangedAuxFanSpeed(), this._resetUserEdits();
      }, this._handleSaveBoxFanSpeedButton = () => {
        this._submitChangedBoxFanSpeed(), this._resetUserEdits();
      }, this._handleSaveSpeedModeButton = () => {
        this._submitChangedSpeedMode(), this._resetUserEdits();
      }, this._handleSaveTargetTempNozzleButton = () => {
        this._submitChangedTargetTempNozzle(), this._resetUserEdits();
      }, this._handleSaveTargetTempHotbedButton = () => {
        this._submitChangedTargetTempHotbed(), this._resetUserEdits();
      }, this._closeModal = t => {
        t && t.stopPropagation(), this._isOpen = !1, this._resetUserEdits();
      }, this._cardClick = t => {
        t.stopPropagation();
      };
    }
    async firstUpdated() {
      this.addEventListener("ac-select-dropdown", this._handleDropdownEvent), this.addEventListener("click", t => {
        this._closeModal(t);
      });
    }
    connectedCallback() {
      var t;
      super.connectedCallback(), null === (t = this.parentElement) || void 0 === t || t.addEventListener("ac-printset-modal", this._handleModalEvent);
    }
    disconnectedCallback() {
      var t;
      null === (t = this.parentElement) || void 0 === t || t.removeEventListener("ac-printset-modal", this._handleModalEvent), super.disconnectedCallback();
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("language") && (this._labelNozzleTemperature = Nn("card.print_settings.label_nozzle_temp", this.language), this._labelHotbedTemperature = Nn("card.print_settings.label_hotbed_temp", this.language), this._labelFanSpeed = Nn("card.print_settings.label_fan_speed", this.language), this._labelAuxFanSpeed = Nn("card.print_settings.label_aux_fan_speed", this.language), this._labelBoxFanSpeed = Nn("card.print_settings.label_box_fan_speed", this.language), this._buttonYes = Nn("common.actions.yes", this.language), this._buttonNo = Nn("common.actions.no", this.language), this._buttonPrintPause = Nn("card.print_settings.print_pause", this.language), this._buttonPrintResume = Nn("card.print_settings.print_resume", this.language), this._buttonPrintCancel = Nn("card.print_settings.print_cancel", this.language), this._buttonSaveSpeedMode = Nn("card.print_settings.save_speed_mode", this.language), this._buttonSaveTargetNozzle = Nn("card.print_settings.save_target_nozzle", this.language), this._buttonSaveTargetHotbed = Nn("card.print_settings.save_target_hotbed", this.language), this._buttonSaveFanSpeed = Nn("card.print_settings.save_fan_speed", this.language), this._buttonSaveAuxFanSpeed = Nn("card.print_settings.save_aux_fan_speed", this.language), this._buttonSaveBoxFanSpeed = Nn("card.print_settings.save_box_fan_speed", this.language)), t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) {
        if (this.isFDM = (e = this.hass, i = this.printerEntities, r = this.printerEntityIdPart, "Filament" === ui(e, i, r, "current_status").attributes.material_type), this._userEditFanSpeed || (this.currentFanSpeed = Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state)), !this._userEditTargetTempNozzle) {
          const t = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "target_nozzle_temperature", 0, {
            limit_min: 0,
            limit_max: 0
          });
          this.currentTargetTempNozzle = Number(t.state), this.minTargetTempNozzle = t.attributes.limit_min, this.maxTargetTempNozzle = t.attributes.limit_max;
        }
        if (!this._userEditTargetTempHotbed) {
          const t = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "target_hotbed_temperature", 0, {
            limit_min: 0,
            limit_max: 0
          });
          this.currentTargetTempHotbed = Number(t.state), this.minTargetTempHotbed = t.attributes.limit_min, this.maxTargetTempHotbed = t.attributes.limit_max;
        }
        if (!this._userEditSpeedMode) {
          const t = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_speed_mode", "", {
            available_modes: [],
            job_speed_mode_code: -1
          });
          this.availableSpeedModes = $i(t), this.currentSpeedModeKey = t.attributes.print_speed_mode_code, this.currentSpeedModeDescr = this.currentSpeedModeKey >= 0 && this.currentSpeedModeKey in this.availableSpeedModes ? this.availableSpeedModes[this.currentSpeedModeKey] : void 0;
        }
      }
      var e, i, r;
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return q`
      <div
        class="ac-modal-container"
        style=${Li({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${qs(Object.assign({}, Uo))}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this._renderCard()}
        </div>
      </div>
    `;
    }
    _renderCard() {
      return this._confirmationType ? this._renderConfirm() : this._renderSettings();
    }
    _renderConfirm() {
      return q`
      <div>
        <div class="ac-settings-header">Confirm Action</div>
        <div>
          <div class="ac-confirm-description">${this._confirmMessage}</div>
          <div class="ac-confirm-buttons">
            <ha-control-button
              @click=${this._handleConfirmApprove}
              .disabled=${this._changingSettings}
            >
              ${this._buttonYes}
            </ha-control-button>
            <ha-control-button @click=${this._handleConfirmCancel}>
              ${this._buttonNo}
            </ha-control-button>
          </div>
        </div>
      </div>
    `;
    }
    _renderSettings() {
      return q`
      <div>
        <div class="ac-settings-header">Print Settings</div>
        <div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${It.PAUSE}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintPause}
            </ha-control-button>
          </div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${It.RESUME}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintResume}
            </ha-control-button>
          </div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${It.CANCEL}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintCancel}
            </ha-control-button>
          </div>
          ${this.isFDM ? q`
                <div class="ac-settings-row">
                  <anycubic-ui-select-dropdown
                    .availableOptions=${this.availableSpeedModes}
                    .placeholder=${this.currentSpeedModeDescr}
                    .initialItem=${this.currentSpeedModeDescr}
                  ></anycubic-ui-select-dropdown>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveSpeedModeButton}
                  >
                    ${this._buttonSaveSpeedMode}
                  </ha-control-button>
                </div>
                <div class="ac-settings-row">
                  <ha-textfield
                    .value=${this.currentTargetTempNozzle}
                    .placeholder=${this.currentTargetTempNozzle}
                    .label=${this._labelNozzleTemperature}
                    .type=${"number"}
                    .min=${this.minTargetTempNozzle}
                    .max=${this.maxTargetTempNozzle}
                    @input=${this._handleTargetTempNozzleChange}
                    @keydown=${this._handleTargetTempNozzleKeyDown}
                  ></ha-textfield>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveTargetTempNozzleButton}
                  >
                    ${this._buttonSaveTargetNozzle}
                  </ha-control-button>
                </div>
                <div class="ac-settings-row">
                  <ha-textfield
                    .value=${this.currentTargetTempHotbed}
                    .placeholder=${this.currentTargetTempHotbed}
                    .label=${this._labelHotbedTemperature}
                    .type=${"number"}
                    .min=${this.minTargetTempHotbed}
                    .max=${this.maxTargetTempHotbed}
                    @input=${this._handleTargetTempHotbedChange}
                    @keydown=${this._handleTargetTempHotbedKeyDown}
                  ></ha-textfield>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveTargetTempHotbedButton}
                  >
                    ${this._buttonSaveTargetHotbed}
                  </ha-control-button>
                </div>
                <div class="ac-settings-row">
                  <ha-textfield
                    .value=${this.currentFanSpeed}
                    .placeholder=${this.currentFanSpeed}
                    .label=${this._labelFanSpeed}
                    .type=${"number"}
                    .min=${0}
                    .max=${100}
                    @input=${this._handleFanSpeedChange}
                    @keydown=${this._handleFanSpeedKeyDown}
                  ></ha-textfield>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveFanSpeedButton}
                  >
                    ${this._buttonSaveFanSpeed}
                  </ha-control-button>
                </div>
                <div class="ac-settings-row ac-disabled-feature">
                  <ha-textfield
                    .value=${this.currentAuxFanSpeed}
                    .placeholder=${this.currentAuxFanSpeed}
                    .label=${this._labelAuxFanSpeed}
                    .type=${"number"}
                    .min=${0}
                    .max=${100}
                    @input=${this._handleAuxFanSpeedChange}
                    @keydown=${this._handleAuxFanSpeedKeyDown}
                  ></ha-textfield>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveAuxFanSpeedButton}
                  >
                    ${this._buttonSaveAuxFanSpeed}
                  </ha-control-button>
                </div>
                <div class="ac-settings-row ac-disabled-feature">
                  <ha-textfield
                    .value=${this.currentBoxFanSpeed}
                    .placeholder=${this.currentBoxFanSpeed}
                    .label=${this._labelBoxFanSpeed}
                    .type=${"number"}
                    .min=${0}
                    .max=${100}
                    @input=${this._handleBoxFanSpeedChange}
                    @keydown=${this._handleBoxFanSpeedKeyDown}
                  ></ha-textfield>
                  <ha-control-button
                    .disabled=${this._changingSettings}
                    @click=${this._handleSaveBoxFanSpeedButton}
                  >
                    ${this._buttonSaveBoxFanSpeed}
                  </ha-control-button>
                </div>
              ` : J}
        </div>
      </div>
    `;
    }
    _pressHassButton(t) {
      this._changingSettings = !0, this.hass.callService("button", "press", {
        entity_id: oi(this.printerEntityIdPart, "button", t)
      }).then(() => {
        this._changingSettings = !1;
      }).catch(t => {
        this._changingSettings = !1;
      });
    }
    _resetUserEdits() {
      this._userEditFanSpeed = !1, this._userEditAuxFanSpeed = !1, this._userEditBoxFanSpeed = !1, this._userEditTargetTempNozzle = !1, this._userEditTargetTempHotbed = !1, this._userEditSpeedMode = !1;
    }
    _submitChangedSpeedMode() {
      if (this._userEditSpeedMode && this.selectedPrinterDevice) {
        const t = "change_print_speed_mode";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          speed_mode: this.currentSpeedModeKey
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    _submitChangedFanSpeed() {
      if (this._userEditFanSpeed && this.selectedPrinterDevice) {
        const t = "change_print_fan_speed";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          speed: this.currentFanSpeed
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    _submitChangedAuxFanSpeed() {
      if (this._userEditAuxFanSpeed && this.selectedPrinterDevice) {
        const t = "change_print_aux_fan_speed";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          speed: this.currentAuxFanSpeed
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    _submitChangedBoxFanSpeed() {
      if (this._userEditBoxFanSpeed && this.selectedPrinterDevice) {
        const t = "change_print_box_fan_speed";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          speed: this.currentBoxFanSpeed
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    _submitChangedTargetTempNozzle() {
      if (this._userEditTargetTempNozzle && this.selectedPrinterDevice) {
        const t = "change_print_target_nozzle_temperature";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          temperature: this.currentTargetTempNozzle
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    _submitChangedTargetTempHotbed() {
      if (this._userEditTargetTempHotbed && this.selectedPrinterDevice) {
        const t = "change_print_target_hotbed_temperature";
        this._changingSettings = !0, this.hass.callService(Ge, t, {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          temperature: this.currentTargetTempHotbed
        }).then(() => {
          this._changingSettings = !1;
        }).catch(t => {
          this._changingSettings = !1;
        }), this._closeModal();
      }
    }
    static get styles() {
      return u`
      ${Xs}

      .ac-settings-header {
        font-size: 24px;
        text-align: center;
        font-weight: 600;
        margin-bottom: 20px;
      }

      .ac-settings-row {
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
      }

      .ac-disabled-feature {
        display: none;
      }

      ha-textfield {
        min-width: 150px;
        width: 100%;
      }

      ha-control-button {
        min-width: 150px;
        margin: 8px 0px 0px 8px;
        font-size: 14px;
      }

      .ac-settings-buttonrow ha-control-button {
        min-width: 100%;
        margin: 8px 0px 0px 8px;
        font-size: 14px;
      }

      .ac-confirm-description {
        font-size: 16px;
        text-align: center;
      }

      .ac-confirm-buttons {
        display: flex;
        justify-content: center;
      }

      .ac-confirm-buttons ha-control-button {
        margin: 20px 30px 0px 30px;
      }
    `;
    }
  };
  n([_t()], Ro.prototype, "hass", void 0), n([_t()], Ro.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], Ro.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "printer-entities"
  })], Ro.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], Ro.prototype, "printerEntityIdPart", void 0), n([vt()], Ro.prototype, "availableSpeedModes", void 0), n([vt()], Ro.prototype, "isFDM", void 0), n([vt()], Ro.prototype, "currentSpeedModeKey", void 0), n([vt()], Ro.prototype, "currentSpeedModeDescr", void 0), n([vt()], Ro.prototype, "_userEditSpeedMode", void 0), n([vt()], Ro.prototype, "currentFanSpeed", void 0), n([vt()], Ro.prototype, "_userEditFanSpeed", void 0), n([vt()], Ro.prototype, "currentAuxFanSpeed", void 0), n([vt()], Ro.prototype, "_userEditAuxFanSpeed", void 0), n([vt()], Ro.prototype, "currentBoxFanSpeed", void 0), n([vt()], Ro.prototype, "_userEditBoxFanSpeed", void 0), n([vt()], Ro.prototype, "currentTargetTempNozzle", void 0), n([vt()], Ro.prototype, "minTargetTempNozzle", void 0), n([vt()], Ro.prototype, "maxTargetTempNozzle", void 0), n([vt()], Ro.prototype, "_userEditTargetTempNozzle", void 0), n([vt()], Ro.prototype, "currentTargetTempHotbed", void 0), n([vt()], Ro.prototype, "minTargetTempHotbed", void 0), n([vt()], Ro.prototype, "maxTargetTempHotbed", void 0), n([vt()], Ro.prototype, "_userEditTargetTempHotbed", void 0), n([vt()], Ro.prototype, "_confirmationType", void 0), n([vt()], Ro.prototype, "_isOpen", void 0), n([vt()], Ro.prototype, "_confirmMessage", void 0), n([vt()], Ro.prototype, "_labelNozzleTemperature", void 0), n([vt()], Ro.prototype, "_labelHotbedTemperature", void 0), n([vt()], Ro.prototype, "_labelFanSpeed", void 0), n([vt()], Ro.prototype, "_labelAuxFanSpeed", void 0), n([vt()], Ro.prototype, "_labelBoxFanSpeed", void 0), n([vt()], Ro.prototype, "_buttonYes", void 0), n([vt()], Ro.prototype, "_buttonNo", void 0), n([vt()], Ro.prototype, "_buttonPrintPause", void 0), n([vt()], Ro.prototype, "_buttonPrintResume", void 0), n([vt()], Ro.prototype, "_buttonPrintCancel", void 0), n([vt()], Ro.prototype, "_buttonSaveSpeedMode", void 0), n([vt()], Ro.prototype, "_buttonSaveTargetNozzle", void 0), n([vt()], Ro.prototype, "_buttonSaveTargetHotbed", void 0), n([vt()], Ro.prototype, "_buttonSaveFanSpeed", void 0), n([vt()], Ro.prototype, "_buttonSaveAuxFanSpeed", void 0), n([vt()], Ro.prototype, "_buttonSaveBoxFanSpeed", void 0), n([vt()], Ro.prototype, "_changingSettings", void 0), Ro = n([$t("anycubic-printercard-printsettings_modal")], Ro);
  const jo = vi();
  let Vo = class extends mt {
    constructor() {
      super(...arguments), this.monitoredStats = jo, this.round = !0, this.temperatureUnit = St.C, this.mediaView = Mt.Auto, this.printerArt = Ht.Auto, this.noCamera = !1, this.showControls = !0, this.showMoveButtons = !1, this.isHidden = !1, this.isPrinting = !1, this.isPaused = !1, this.hiddenOverride = !1, this.hasColorbox = !1, this.hasSecondaryColorbox = !1, this.lightIsOn = !1, this.statusColor = "#ffc107", this.printStateString = "unknown", this.progressPercent = 0, this._togglingLight = !1, this._togglingPower = !1, this._pressButtonEvent = t => {
        const e = t.currentTarget.entityId;
        e && this.hass.callService("button", "press", {
          entity_id: e
        });
      }, this._selectOptionEvent = t => {
        const e = t.currentTarget.entityId;
        e && this.hass.callService("select", "select_option", {
          entity_id: e,
          option: t.currentTarget.option
        });
      }, this._toggleSection = t => {
        const e = t.currentTarget.sectionKey;
        this._openSection = this._openSection === e ? void 0 : e;
      }, this._openPrintSettingsModal = () => {
        We(this._printerCardContainer, "ac-printset-modal", {
          modalOpen: !0
        });
      }, this._toggleLightEntity = () => {
        this.lightEntityId && (this._togglingLight = !0, this.hass.callService("homeassistant", "toggle", {
          entity_id: this.lightEntityId
        }).then(() => {
          this._togglingLight = !1;
        }).catch(t => {
          this._togglingLight = !1;
        }));
      }, this._togglePowerEntity = () => {
        this.powerEntityId && (this._togglingPower = !0, this.hass.callService("homeassistant", "toggle", {
          entity_id: this.powerEntityId
        }).then(() => {
          this._togglingPower = !1;
        }).catch(t => {
          this._togglingPower = !1;
        }));
      }, this._toggleHiddenOveride = () => {
        this.hiddenOverride = !this.hiddenOverride;
      };
    }
    willUpdate(t) {
      var e, i;
      if (super.willUpdate(t), t.has("language") && (this._buttonPrintSettings = Nn("card.buttons.print_settings", this.language)), t.has("monitoredStats") && (this.monitoredStats = xi(this.monitoredStats, jo)), t.has("selectedPrinterID") && (this.printerEntities = si(this.hass, this.selectedPrinterID), this.printerEntityIdPart = li(this.printerEntities)), t.has("hass") || t.has("alwaysShow") || t.has("hiddenOverride") || t.has("cameraEntityId") || t.has("selectedPrinterID")) {
        this.progressPercent = this._percentComplete(), this.hasColorbox = "active" === ui(this.hass, this.printerEntities, this.printerEntityIdPart, "ace_spools", "inactive").state, this.hasSecondaryColorbox = "active" === ui(this.hass, this.printerEntities, this.printerEntityIdPart, "secondary_ace_spools", "inactive").state, this.camera = function (t, e) {
          var i, r;
          return e ? null !== (i = t.find(t => t.entity_id === e)) && void 0 !== i ? i : {
            entity_id: e,
            isCloud: e.endsWith("cloud_camera"),
            available: !0
          } : null !== (r = t.find(t => t.available)) && void 0 !== r ? r : t[0];
        }(function (t, e) {
          const i = [];
          for (const r in e) {
            if (!r.startsWith("camera.")) continue;
            const e = t.states[r];
            i.push({
              entity_id: r,
              isCloud: r.endsWith("cloud_camera"),
              available: void 0 !== e && "unavailable" !== e.state
            });
          }
          return i.sort((t, e) => Number(t.isCloud) - Number(e.isCloud));
        }(this.hass, this.printerEntities), this.cameraEntityId), this.lightIsOn = ti(this.hass, {
          entity_id: null !== (e = this.lightEntityId) && void 0 !== e ? e : ""
        }, !0, !1);
        const t = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state", "unknown").state.toLowerCase(),
          r = "unavailable" !== t && "unknown" !== t;
        this.printStateString = r ? t : this._printerAvailability(), this.isPrinting = r && gi(t), this.isPaused = "paused" === t, this.isHidden = !this.alwaysShow && !this.hiddenOverride && !this.isPrinting, this.statusColor = "preheating" === (i = this.printStateString) || "busy" === i ? "#ffc107" : gi(i) ? "#4caf50" : "unknown" === i ? "#f44336" : "operational" === i || "finished" === i || "available" === i || "idle" === i || "free" === i ? "#00bcd4" : "#f44336";
      }
    }
    render() {
      return q`
      <ha-card class="ac-printer-card">
        ${this._renderHeader()}
        <div
          class="ac-body ${Bi({
        "ac-body-hidden": this.isHidden
      })}"
          aria-hidden=${this.isHidden ? "true" : "false"}
        >
          <div
            class="ac-main ${Bi({
        "ac-main-stacked": !!this.vertical
      })}"
            style=${Li(this._mainColumnStyles())}
          >
            ${this._renderMedia()}
            <div class="ac-summary">
              ${this._renderProgress()} ${this._renderStats()}
            </div>
          </div>
          ${this._renderControls()} ${this._renderMove()}
          ${this._renderSections()}
        </div>
        <anycubic-printercard-multicolorbox_modal_spool
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .slotColors=${this.slotColors}
        ></anycubic-printercard-multicolorbox_modal_spool>
        <anycubic-printercard-printsettings_modal
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
        ></anycubic-printercard-printsettings_modal>
        <anycubic-printercard-multicolorbox_modal_drying
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
        ></anycubic-printercard-multicolorbox_modal_drying>
      </ha-card>
    `;
    }
    _renderHeader() {
      var t, e;
      const i = {
        "background-color": this.statusColor
      };
      return q`
      <div class="ac-header">
        <button
          class="ac-header-identity"
          @click=${this._toggleHiddenOveride}
          title=${this.alwaysShow ? "" : "Show or hide the card body"}
        >
          <span class="ac-status-dot" style=${Li(i)}></span>
          <span class="ac-header-text">
            <span class="ac-header-name"
              >${null !== (e = null === (t = this.selectedPrinterDevice) || void 0 === t ? void 0 : t.name) && void 0 !== e ? e : "Anycubic printer"}</span
            >
            <span class="ac-header-state"
              >${Qe(this.printStateString)}</span
            >
          </span>
        </button>
        <div class="ac-header-actions">
          ${this.lightEntityId ? q`
                <button
                  class="ac-icon-button ${Bi({
        "ac-icon-button-on": this.lightIsOn
      })}"
                  .disabled=${this._togglingLight}
                  title="Printer light"
                  aria-label="Printer light"
                  @click=${this._toggleLightEntity}
                >
                  <ha-svg-icon
                    .path=${this.lightIsOn ? "M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63Z" : "M12,2C9.76,2 7.78,3.05 6.5,4.68L16.31,14.5C17.94,13.21 19,11.24 19,9A7,7 0 0,0 12,2M3.28,4L2,5.27L5.04,8.3C5,8.53 5,8.76 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H14.73L18.73,22L20,20.72L3.28,4M9,20V21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9Z"}
                  ></ha-svg-icon>
                </button>
              ` : J}
          ${this.powerEntityId ? q`
                <button
                  class="ac-icon-button"
                  .disabled=${this._togglingPower}
                  title="Printer power"
                  aria-label="Printer power"
                  @click=${this._togglePowerEntity}
                >
                  <ha-svg-icon .path=${"M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"}></ha-svg-icon>
                </button>
              ` : J}
        </div>
      </div>
    `;
    }
    _mainColumnStyles() {
      return {
        "grid-template-columns": `minmax(0, ${this.scaleFactor && this.scaleFactor > 0 ? this.scaleFactor : 1}fr) minmax(0, 1fr)`
      };
    }
    _renderMedia() {
      return this.mediaView === Mt.None ? J : q`
      <anycubic-printercard-media_view
        .hass=${this.hass}
        .language=${this.language}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .mediaView=${this.mediaView}
        .printerArt=${this.printerArt}
        .noCamera=${this.noCamera}
        .camera=${this.camera}
        .isPrinting=${this.isPrinting}
      ></anycubic-printercard-media_view>
    `;
    }
    _renderProgress() {
      if (!isFinite(this.progressPercent) || this.progressPercent < 0) return J;
      const t = Math.max(0, Math.min(100, this.progressPercent)),
        e = ni(this.hass, this.printerEntities, "job_current_layer"),
        i = ni(this.hass, this.printerEntities, "job_total_layers");
      return q`
      <div class="ac-progress">
        <div class="ac-progress-head">
          <span class="ac-progress-pct"
            >${this.round ? Math.round(t) : t}%</span
          >
          ${void 0 !== e && void 0 !== i ? q`<span class="ac-progress-layers"
                >Layer ${e} / ${i}</span
              >` : J}
        </div>
        <div class="ac-progress-track">
          <div
            class="ac-progress-fill"
            style=${Li({
        width: `${t}%`,
        "background-color": this.statusColor
      })}
          ></div>
        </div>
      </div>
    `;
    }
    _renderStats() {
      return q`
      <anycubic-printercard-stats-component
        .hass=${this.hass}
        .language=${this.language}
        .monitoredStats=${this.monitoredStats}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .progressPercent=${this.progressPercent}
        .showPercent=${!1}
        .round=${this.round}
        .use_24hr=${this.use_24hr}
        .temperatureUnit=${this.temperatureUnit}
      ></anycubic-printercard-stats-component>
    `;
    }
    _renderControls() {
      if (!this.showControls) return J;
      const t = [];
      return this.isPrinting && (t.push(this.isPaused ? this._renderActionButton("Resume", "M8,5.14V19.14L19,12.14L8,5.14Z", "resume_print") : this._renderActionButton("Pause", "M14,19H18V5H14M6,19H10V5H6V19Z", "pause_print")), t.push(this._renderActionButton("Cancel", "M18,18H6V6H18V18Z", "cancel_print", !0))), (this.showSettingsButton || this.isPrinting) && t.push(q`
        <button class="ac-button" @click=${this._openPrintSettingsModal}>
          <ha-svg-icon .path=${"M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"}></ha-svg-icon>
          <span>${this._buttonPrintSettings}</span>
        </button>
      `), t.length ? q`<div class="ac-controls">${t}</div>` : J;
    }
    _renderActionButton(t, e, i, r = !1) {
      const n = ii(this.printerEntities, i),
        s = n ? this.hass.states[n] : void 0,
        o = !n || "unavailable" === (null == s ? void 0 : s.state);
      return q`
      <button
        class="ac-button ${Bi({
        "ac-button-danger": r
      })}"
        .disabled=${o}
        .entityId=${n}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${e}></ha-svg-icon>
        <span>${t}</span>
      </button>
    `;
    }
    _renderMove() {
      return this.showMoveButtons ? q`<div class="ac-move-panel">${this._renderMoveSection()}</div>` : J;
    }
    _renderSections() {
      var t;
      const e = null !== (t = this.sections) && void 0 !== t ? t : [Bt.Filament],
        i = [];
      return e.includes(Bt.Filament) && this.hasColorbox && i.push(this._renderSection(Bt.Filament, "Filament", this._renderFilamentSection())), e.includes(Bt.Insights) && i.push(this._renderSection(Bt.Insights, "Insights", this._renderInsightsSection())), i.length ? q`${i}` : J;
    }
    _renderSection(t, e, i) {
      const r = this._openSection === t;
      return q`
      <div class="ac-section">
        <button
          class="ac-section-head"
          aria-expanded=${r ? "true" : "false"}
          .sectionKey=${t}
          @click=${this._toggleSection}
        >
          <span>${e}</span>
          <ha-svg-icon
            class="ac-section-chevron ${Bi({
        "ac-section-chevron-open": r
      })}"
            .path=${Si}
          ></ha-svg-icon>
        </button>
        ${r ? q`<div class="ac-section-body">${i}</div>` : J}
      </div>
    `;
    }
    _renderFilamentSection() {
      return q`
      <anycubic-printercard-multicolorbox_view
        .hass=${this.hass}
        .language=${this.language}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .box_id=${0}
      ></anycubic-printercard-multicolorbox_view>
      ${this.hasSecondaryColorbox ? q`
            <anycubic-printercard-multicolorbox_view
              .hass=${this.hass}
              .language=${this.language}
              .printerEntities=${this.printerEntities}
              .printerEntityIdPart=${this.printerEntityIdPart}
              .box_id=${1}
            ></anycubic-printercard-multicolorbox_view>
          ` : J}
    `;
    }
    _renderMoveSection() {
      var t, e;
      const i = ii(this.printerEntities, "axis_step"),
        r = i ? this.hass.states[i] : void 0,
        n = "on" === (null === (t = ri(this.hass, this.printerEntities, "axis_moving")) || void 0 === t ? void 0 : t.state),
        s = "on" === (null === (e = ri(this.hass, this.printerEntities, "axis_move_failed")) || void 0 === e ? void 0 : e.state);
      return q`
      ${r ? q`
            <div class="ac-step-segmented">
              ${this._renderStepOptions(i, r)}
            </div>
          ` : J}
      <div class="ac-move">
        <div class="ac-move-col">
          ${this._renderSquareButton("axis_home_all", Ci, "Home all axes")}
          ${this._renderSquareButton("axis_motors_off", "M2.5,3.77L6.87,8.14L5,10V13H3V10H1V18H3V15H5V18H8L10,20H18V19.27L21.23,22.5L22.5,21.22L3.78,2.5L2.5,3.77M16,18H11L9,16H7V11L8,10H8.73L16,17.27V18M23,9V19H22.82L16,12.18V10H13.82L7.82,4H15V6H12V8H18V12H20V9H23Z", "Release motors")}
        </div>

        <div class="ac-dial">
          ${this._renderWedge("axis_move_y_plus", Pi, "Y+", "up")}
          ${this._renderWedge("axis_move_x_minus", "M14,7L9,12L14,17V7Z", "X-", "left")}
          ${this._renderWedge("axis_move_x_plus", "M10,17L15,12L10,7V17Z", "X+", "right")}
          ${this._renderWedge("axis_move_y_minus", Ai, "Y-", "down")}
          ${this._renderDialCentre()}
        </div>

        <div class="ac-move-col">
          ${this._renderSquareButton("axis_move_z_plus", Pi, "Z up", "Z+")}
          ${this._renderSquareButton("axis_home_z", Ci, "Home Z", "", !0)}
          ${this._renderSquareButton("axis_move_z_minus", Ai, "Z down", "Z-")}
        </div>
      </div>
      ${n ? q`<p class="ac-note">Moving…</p>` : s ? q`<p class="ac-note ac-note-warn">
              Last move was refused. Z has to be homed on its own before it will
              move.
            </p>` : J}
    `;
    }
    _renderWedge(t, e, i, r) {
      const n = ii(this.printerEntities, t),
        s = n ? this.hass.states[n] : void 0,
        o = !n || "unavailable" === (null == s ? void 0 : s.state);
      return q`
      <button
        class="ac-wedge ac-wedge-${r}"
        .disabled=${o}
        title=${i}
        aria-label=${i}
        .entityId=${n}
        @click=${this._pressButtonEvent}
      >
        <span class="ac-wedge-inner">
          <ha-svg-icon .path=${e}></ha-svg-icon>
          <span class="ac-wedge-label">${i}</span>
        </span>
      </button>
    `;
    }
    _renderDialCentre() {
      const t = ii(this.printerEntities, "axis_home_xy"),
        e = t ? this.hass.states[t] : void 0,
        i = !t || "unavailable" === (null == e ? void 0 : e.state);
      return q`
      <button
        class="ac-dial-centre"
        .disabled=${i}
        title="Home X and Y"
        aria-label="Home X and Y"
        .entityId=${t}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${Ci}></ha-svg-icon>
      </button>
    `;
    }
    _renderSquareButton(t, e, i, r = "", n = !1) {
      const s = ii(this.printerEntities, t),
        o = s ? this.hass.states[s] : void 0,
        a = !s || "unavailable" === (null == o ? void 0 : o.state);
      return q`
      <button
        class="ac-square ${Bi({
        "ac-square-accent": n
      })}"
        .disabled=${a}
        title=${i}
        aria-label=${i}
        .entityId=${s}
        @click=${this._pressButtonEvent}
      >
        ${r ? q`<span class="ac-square-label">${r}</span>` : J}
        <ha-svg-icon .path=${e}></ha-svg-icon>
      </button>
    `;
    }
    _renderStepOptions(t, e) {
      var i;
      return (null !== (i = e.attributes.options) && void 0 !== i ? i : []).map(i => q`
        <button
          class="ac-chip-button ${Bi({
        "ac-chip-button-active": e.state === i
      })}"
          .entityId=${t}
          .option=${i}
          @click=${this._selectOptionEvent}
        >
          ${i}
        </button>
      `);
    }
    _renderInsightsSection() {
      var t;
      const e = null !== (t = this.hass.config.currency) && void 0 !== t ? t : "",
        i = [],
        r = (t, e) => {
          void 0 !== e && i.push({
            label: t,
            value: e
          });
        },
        n = t => {
          const i = ni(this.hass, this.printerEntities, t);
          if (void 0 !== i) {
            if (!e) return i.toFixed(2);
            try {
              return new Intl.NumberFormat(this.hass.language, {
                style: "currency",
                currency: e
              }).format(i);
            } catch (t) {
              return `${i.toFixed(2)} ${e}`;
            }
          }
        },
        s = t => {
          const e = ni(this.hass, this.printerEntities, t);
          return void 0 === e ? void 0 : `${Math.round(e)} g`;
        };
      r("This job", n("job_cost")), r("Last job", n("last_job_cost")), r("Filament spend", n("filament_cost_total")), r("Job needs", s("job_filament_required")), r("Shortfall", s("job_filament_shortfall"));
      const o = ni(this.hass, this.printerEntities, "nozzle_wear_percent");
      r("Nozzle wear", void 0 === o ? void 0 : `${o.toFixed(1)}%`), r("Spools left", s("spool_inventory_remaining"));
      const a = ri(this.hass, this.printerEntities, "job_filament_insufficient");
      return i.length ? q`
      ${"on" === (null == a ? void 0 : a.state) ? q`<p class="ac-note ac-note-warn">
            Not enough filament loaded to finish this job.
          </p>` : J}
      <div class="ac-insights">${this._renderInsightRows(i)}</div>
    ` : q`<p class="ac-note">
        Nothing to report yet. Cost and forecast figures appear once a job has
        run and spool weights are set.
      </p>`;
    }
    _renderInsightRows(t) {
      return t.map(t => q`
        <div class="ac-insight">
          <span class="ac-insight-label">${t.label}</span>
          <span class="ac-insight-value">${t.value}</span>
        </div>
      `);
    }
    _printerAvailability() {
      const t = ri(this.hass, this.printerEntities, "printer_online");
      if ("off" === (null == t ? void 0 : t.state)) return "offline";
      return ui(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status", "unknown").state.toLowerCase();
    }
    _percentComplete() {
      return Number(ui(this.hass, this.printerEntities, this.printerEntityIdPart, "job_progress", -1).state);
    }
    static get styles() {
      return u`
      :host {
        display: block;

        --ac-gap: 12px;
        --ac-radius: 12px;
        --ac-media-background: color-mix(
          in srgb,
          var(--primary-text-color) 8%,
          transparent
        );
        --ac-overlay-background: rgba(0, 0, 0, 0.45);
        /* The tab strip sits on the card itself in the printer view, where a
           translucent scrim has nothing behind it to soften. */
        --ac-overlay-background-solid: rgba(0, 0, 0, 0.72);
        --ac-overlay-hover: rgba(255, 255, 255, 0.14);
        --ac-overlay-active: rgba(255, 255, 255, 0.92);
        --ac-overlay-active-text: #111;
        --ac-overlay-text: #fff;
        --ac-subtle: color-mix(
          in srgb,
          var(--primary-text-color) 6%,
          transparent
        );
        --ac-pressed: color-mix(
          in srgb,
          var(--primary-text-color) 12%,
          transparent
        );
        --ac-border: var(--divider-color, rgba(127, 127, 127, 0.3));
      }

      .ac-printer-card {
        display: block;
        box-sizing: border-box;
        padding: 12px;
        overflow: hidden;
        /* Lets the layout answer to the space the card was actually given,
           rather than to the width of the browser window. */
        container-type: inline-size;
      }

      /* Header ------------------------------------------------------------ */

      .ac-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .ac-header-identity {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        flex: 1 1 auto;
        min-width: 0;
        padding: 4px;
        border: none;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
      }

      .ac-status-dot {
        flex: 0 0 auto;
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .ac-header-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .ac-header-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ac-header-state {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .ac-header-actions {
        display: flex;
        flex-direction: row;
        gap: 2px;
        flex: 0 0 auto;
      }

      .ac-icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        --mdc-icon-size: 20px;
        transition:
          background-color 150ms ease-in-out,
          color 150ms ease-in-out;
      }

      .ac-icon-button:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-icon-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .ac-icon-button-on {
        color: var(--state-light-active-color, #fdd835);
      }

      /* Body -------------------------------------------------------------- */

      .ac-body {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
        padding-top: var(--ac-gap);
        max-height: 2400px;
        transition:
          opacity 200ms ease-in-out,
          max-height 250ms ease-in-out;
        overflow: hidden;
      }

      .ac-body-hidden {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        pointer-events: none;
      }

      .ac-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
      }

      .ac-summary {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
        min-width: 0;
      }

      /* Side by side once the card is wide enough to earn it, unless the
         config asked for a stacked layout. */
      @container (min-width: 480px) {
        /* The column ratio itself is set inline from scaleFactor; grid-template
           cannot be assembled from a custom property in plain CSS. It is inert
           while this element is display:flex on a narrow card. */
        .ac-main:not(.ac-main-stacked) {
          display: grid;
          align-items: start;
        }

        .ac-main:not(.ac-main-stacked) .ac-summary {
          justify-content: center;
        }
      }

      /* Progress ---------------------------------------------------------- */

      .ac-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ac-progress-head {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: space-between;
      }

      .ac-progress-pct {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary-text-color);
        font-variant-numeric: tabular-nums;
      }

      .ac-progress-layers {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums;
      }

      .ac-progress-track {
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: var(--ac-subtle);
        overflow: hidden;
      }

      .ac-progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 400ms ease-in-out;
      }

      /* Controls ---------------------------------------------------------- */

      .ac-controls {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ac-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex: 1 1 auto;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid var(--ac-border);
        border-radius: 999px;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        --mdc-icon-size: 18px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-button:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-button:disabled {
        opacity: 0.45;
        cursor: default;
      }

      .ac-button-danger {
        color: var(--error-color, #db4437);
        border-color: color-mix(
          in srgb,
          var(--error-color, #db4437) 45%,
          transparent
        );
      }

      /* Sections ---------------------------------------------------------- */

      .ac-section {
        border-top: 1px solid var(--ac-border);
      }

      .ac-section-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 2px;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .ac-section-chevron {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
        transition: transform 200ms ease-in-out;
      }

      .ac-section-chevron-open {
        transform: rotate(180deg);
      }

      .ac-section-body {
        padding: 4px 0 12px 0;
      }

      /* Same breathing room the move pad had as a section body, so promoting
         it out of the accordion does not change its spacing. */
      .ac-move-panel {
        padding: 4px 0 12px 0;
      }

      /* Move -------------------------------------------------------------- */

      .ac-chip-button {
        padding: 4px 10px;
        border: 1px solid var(--ac-border);
        border-radius: 999px;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition:
          background-color 150ms ease-in-out,
          border-color 150ms ease-in-out,
          color 150ms ease-in-out;
      }

      .ac-chip-button:hover:not(.ac-chip-button-active) {
        background: var(--ac-subtle);
      }

      .ac-chip-button-active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }

      .ac-step-segmented {
        display: flex;
        flex-direction: row;
        gap: 6px;
        margin-bottom: 18px;
      }

      .ac-step-segmented .ac-chip-button {
        flex: 1 1 0;
        min-height: 34px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 10px;
      }

      .ac-move {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .ac-move-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 0 0 auto;
      }

      .ac-square {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        width: 46px;
        height: 46px;
        padding: 0;
        border: 1px solid var(--ac-border);
        border-radius: 12px;
        background: transparent;
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 22px;
        transition:
          background-color 150ms ease-in-out,
          border-color 150ms ease-in-out;
      }

      .ac-square:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-square:active:not(:disabled) {
        background: var(--ac-pressed);
      }

      .ac-square:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .ac-square-accent {
        border-color: var(--primary-color);
      }

      .ac-square-label {
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        color: var(--secondary-text-color);
      }

      /* The XY dial: four quadrants clipped out of one circle, with a home
         button sitting in the middle. */
      .ac-dial {
        position: relative;
        flex: 0 0 auto;
        width: 148px;
        height: 148px;
        border-radius: 50%;
        background: var(--ac-subtle);
        overflow: hidden;
      }

      .ac-wedge {
        position: absolute;
        inset: 0;
        display: flex;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 16px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-wedge:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-wedge:active:not(:disabled) {
        background: var(--ac-pressed);
      }

      .ac-wedge:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .ac-wedge-up {
        clip-path: polygon(0 0, 100% 0, 50% 50%);
        align-items: flex-start;
        justify-content: center;
        padding-top: 10px;
      }

      .ac-wedge-right {
        clip-path: polygon(100% 0, 100% 100%, 50% 50%);
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
      }

      .ac-wedge-down {
        clip-path: polygon(0 100%, 100% 100%, 50% 50%);
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 10px;
      }

      .ac-wedge-left {
        clip-path: polygon(0 0, 0 100%, 50% 50%);
        align-items: center;
        justify-content: flex-start;
        padding-left: 8px;
      }

      .ac-wedge-inner {
        display: flex;
        align-items: center;
        gap: 1px;
      }

      .ac-wedge-up .ac-wedge-inner,
      .ac-wedge-down .ac-wedge-inner {
        flex-direction: column;
      }

      .ac-wedge-down .ac-wedge-inner {
        flex-direction: column-reverse;
      }

      .ac-wedge-right .ac-wedge-inner {
        flex-direction: row-reverse;
      }

      .ac-wedge-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color);
      }

      .ac-dial-centre {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        padding: 0;
        border: 1px solid var(--ac-border);
        border-radius: 50%;
        background: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 22px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-dial-centre:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-dial-centre:disabled {
        opacity: 0.35;
        cursor: default;
      }

      /* Insights ---------------------------------------------------------- */

      .ac-insights {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 8px;
      }

      .ac-insight {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 10px;
        background: var(--ac-subtle);
      }

      .ac-insight-label {
        font-size: 11px;
        color: var(--secondary-text-color);
      }

      .ac-insight-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        font-variant-numeric: tabular-nums;
      }

      /* Notes ------------------------------------------------------------- */

      .ac-note {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .ac-note-warn {
        color: var(--warning-color, #ffa600);
      }

      @media (max-width: 420px) {
        .ac-move {
          gap: 12px;
        }
      }
    `;
    }
  };
  n([xt(".ac-printer-card")], Vo.prototype, "_printerCardContainer", void 0), n([_t()], Vo.prototype, "hass", void 0), n([_t()], Vo.prototype, "language", void 0), n([_t({
    attribute: "monitored-stats"
  })], Vo.prototype, "monitoredStats", void 0), n([_t({
    attribute: "selected-printer-id"
  })], Vo.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], Vo.prototype, "selectedPrinterDevice", void 0), n([_t({
    type: Boolean
  })], Vo.prototype, "round", void 0), n([_t({
    type: Boolean
  })], Vo.prototype, "use_24hr", void 0), n([_t({
    attribute: "show-settings-button",
    type: Boolean
  })], Vo.prototype, "showSettingsButton", void 0), n([_t({
    attribute: "always-show",
    type: Boolean
  })], Vo.prototype, "alwaysShow", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], Vo.prototype, "temperatureUnit", void 0), n([_t({
    attribute: "light-entity-id",
    type: String
  })], Vo.prototype, "lightEntityId", void 0), n([_t({
    attribute: "power-entity-id",
    type: String
  })], Vo.prototype, "powerEntityId", void 0), n([_t({
    attribute: "camera-entity-id",
    type: String
  })], Vo.prototype, "cameraEntityId", void 0), n([_t({
    type: Boolean
  })], Vo.prototype, "vertical", void 0), n([_t({
    attribute: "scale-factor"
  })], Vo.prototype, "scaleFactor", void 0), n([_t({
    attribute: "slot-colors"
  })], Vo.prototype, "slotColors", void 0), n([_t({
    attribute: "media-view"
  })], Vo.prototype, "mediaView", void 0), n([_t({
    attribute: "printer-art"
  })], Vo.prototype, "printerArt", void 0), n([_t({
    attribute: "no-camera",
    type: Boolean
  })], Vo.prototype, "noCamera", void 0), n([_t({
    attribute: "show-controls",
    type: Boolean
  })], Vo.prototype, "showControls", void 0), n([_t({
    attribute: "show-move-buttons",
    type: Boolean
  })], Vo.prototype, "showMoveButtons", void 0), n([_t({
    attribute: !1
  })], Vo.prototype, "sections", void 0), n([vt()], Vo.prototype, "isHidden", void 0), n([vt()], Vo.prototype, "isPrinting", void 0), n([vt()], Vo.prototype, "isPaused", void 0), n([vt()], Vo.prototype, "hiddenOverride", void 0), n([vt()], Vo.prototype, "hasColorbox", void 0), n([vt()], Vo.prototype, "hasSecondaryColorbox", void 0), n([vt()], Vo.prototype, "lightIsOn", void 0), n([vt()], Vo.prototype, "statusColor", void 0), n([vt()], Vo.prototype, "printStateString", void 0), n([vt()], Vo.prototype, "printerEntities", void 0), n([vt()], Vo.prototype, "printerEntityIdPart", void 0), n([vt()], Vo.prototype, "progressPercent", void 0), n([vt()], Vo.prototype, "camera", void 0), n([vt()], Vo.prototype, "_buttonPrintSettings", void 0), n([vt()], Vo.prototype, "_togglingLight", void 0), n([vt()], Vo.prototype, "_togglingPower", void 0), n([vt()], Vo.prototype, "_openSection", void 0), Vo = n([$t("anycubic-printercard-card")], Vo);
  let Go = class extends mt {
    constructor() {
      super(...arguments), this._toggle_item = () => {
        this.toggle(this.item);
      }, this._reorder_item = t => {
        this._isActive && this.reorder(this.item, t.currentTarget.direction);
      };
    }
    willUpdate(t) {
      super.willUpdate(t), (t.has("selectedItems") || t.has("item")) && (this._isActive = this.selectedItems.includes(this.item));
    }
    update(t) {
      super.update(t), (t.has("_isActive") || t.has("selectedItems") || t.has("unusedItems") || t.has("item")) && (this.style.top = String(this._isActive ? 56 * this.selectedItems.indexOf(this.item) : 56 * (this.selectedItems.length + this.unusedItems.indexOf(this.item))) + "px");
    }
    render() {
      const t = {
        "ac-ui-deselected": !this._isActive
      };
      return q`
      <button class="ac-ui-msr-select" @click=${this._toggle_item}>
        ${this._isActive ? q`<ha-svg-icon .path=${"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"}></ha-svg-icon>` : J}
      </button>
      <p class="ac-ui-msr-itemtext ${Bi(t)}">
        ${this.item}
      </p>
      <div>
        <button
          class="ac-ui-msr-position"
          .direction=${1}
          @click=${this._reorder_item}
        >
          <ha-svg-icon .path=${Si}></ha-svg-icon>
        </button>
        <button
          class="ac-ui-msr-position"
          .direction=${-1}
          @click=${this._reorder_item}
        >
          <ha-svg-icon .path=${"M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"}></ha-svg-icon>
        </button>
      </div>
    `;
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ac-ui-msr-itemtext {
        flex-grow: 1;
        font-size: 16px;
        font-weight: bold;
        line-height: 24px;
      }

      .ac-ui-msr-select {
        box-sizing: border-box;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background-color: rgba(0, 0, 0, 0.1);
        outline: none;
        border: none;
        margin-right: 16px;
        padding: 0px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--primary-text-color);
        cursor: pointer;
      }

      .ac-ui-msr-position {
        box-sizing: border-box;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background-color: transparent;
        outline: none;
        border: none;
        margin-left: 16px;
        color: var(--primary-text-color);
        cursor: pointer;
      }
    `;
    }
  };
  n([_t()], Go.prototype, "item", void 0), n([_t({
    attribute: "selected-items"
  })], Go.prototype, "selectedItems", void 0), n([_t({
    attribute: "unused-items"
  })], Go.prototype, "unusedItems", void 0), n([_t()], Go.prototype, "reorder", void 0), n([_t()], Go.prototype, "toggle", void 0), n([vt()], Go.prototype, "_isActive", void 0), Go = n([$t("anycubic-ui-multi-select-reorder-item")], Go);
  let Zo = class extends mt {
    constructor() {
      super(...arguments), this._reorder = (t, e) => {
        const i = this._selectedItems.indexOf(t),
          r = i + e;
        if (r < 0 || r > this._selectedItems.length - 1) return;
        const n = this._selectedItems.slice(0),
          s = n[r];
        n[r] = t, n[i] = s, this._setSelectedItems(n);
      }, this._toggle = t => {
        if (this._selectedItems.includes(t)) {
          const e = this._selectedItems.indexOf(t);
          this._setSelectedItems([...this._selectedItems.slice(0, e), ...this._selectedItems.slice(e + 1)]), this._unusedItems = [t, ...this._unusedItems];
        } else {
          const e = this._unusedItems.indexOf(t);
          this._unusedItems = [...this._unusedItems.slice(0, e), ...this._unusedItems.slice(e + 1)], this._setSelectedItems([...this._selectedItems, t]);
        }
      };
    }
    async firstUpdated() {
      this._allOptions = Object.values(this.availableOptions), this._setSelectedItems([...this.initialItems].filter(t => this._allOptions.includes(t))), this._unusedItems = this._allOptions.filter(t => !this.initialItems.includes(t)), this.requestUpdate();
    }
    willUpdate(t) {
      super.willUpdate(t);
    }
    render() {
      const t = {
        height: this._allOptions ? String(56 * this._allOptions.length) + "px" : "0px"
      };
      return this._allOptions ? q`
          <div style=${Li(t)}>
            ${us(this._allOptions, (t, e) => q`
                <anycubic-ui-multi-select-reorder-item
                  .item=${t}
                  .selectedItems=${this._selectedItems}
                  .unusedItems=${this._unusedItems}
                  .reorder=${this._reorder}
                  .toggle=${this._toggle}
                ></anycubic-ui-multi-select-reorder-item>
              `)}
          </div>
        ` : J;
    }
    _setSelectedItems(t) {
      this._selectedItems = t, this.onChange(this._selectedItems);
    }
    static get styles() {
      return u`
      :host {
        box-sizing: border-box;
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
    `;
    }
  };
  n([_t({
    attribute: "available-options"
  })], Zo.prototype, "availableOptions", void 0), n([_t({
    attribute: "initial-items"
  })], Zo.prototype, "initialItems", void 0), n([_t({
    attribute: "on-change"
  })], Zo.prototype, "onChange", void 0), n([vt()], Zo.prototype, "_allOptions", void 0), n([vt()], Zo.prototype, "_selectedItems", void 0), n([vt()], Zo.prototype, "_unusedItems", void 0), Zo = n([$t("anycubic-ui-multi-select-reorder")], Zo);
  const Ko = wi();
  let Yo = class extends mt {
    constructor() {
      super(...arguments), this.configPage = "main", this.availableStats = {}, this.formSchemaMain = [], this.formSchemaColours = [], this.hasColorbox = !1, this.isLCD = !1, this._handlePageSelected = t => {
        const e = t.detail.item.getAttribute("page-name");
        e !== this.configPage && (this.configPage = e);
      }, this._selectedStatsChanged = t => {
        this.cardConfig.monitoredStats = t, this._configChanged(this.cardConfig);
      }, this._formValueChanged = t => {
        this.cardConfig = t.detail.value, this._configChanged(this.cardConfig);
      }, this._computeLabel = t => {
        switch (t.name) {
          case "printer_id":
          default:
            return this._labelPrinter_id;
          case "vertical":
            return this._labelVertical;
          case "round":
            return this._labelRound;
          case "use_24hr":
            return this._labelUse_24hr;
          case "showSettingsButton":
            return this._labelShowSettingsButton;
          case "alwaysShow":
            return this._labelAlwaysShow;
          case "temperatureUnit":
            return this._labelTemperatureUnit;
          case "lightEntityId":
            return this._labelLightEntityId;
          case "powerEntityId":
            return this._labelPowerEntityId;
          case "cameraEntityId":
            return this._labelCameraEntityId;
          case "scaleFactor":
            return this._labelScaleFactor;
          case "slotColors":
            return this._labelSlotColors;
          case "mediaView":
            return this._labelMediaView;
          case "printerArt":
            return this._labelPrinterArt;
          case "showControls":
            return this._labelShowControls;
          case "showMoveButtons":
            return this._labelShowMoveButtons;
          case "sections":
            return this._labelSections;
        }
      }, this._optPrinterArt = t => Nn(`card.configure.options.printer_art.${t}`, this.language), this._opt = (t, e) => Nn(`card.configure.options.${t}.${e}`, this.language);
    }
    willUpdate(t) {
      var e, i, r;
      super.willUpdate(t), t.has("language") && (this._tabMain = Nn("card.configure.tabs.main", this.language), this._tabStats = Nn("card.configure.tabs.stats", this.language), this._tabColours = Nn("card.configure.tabs.colours", this.language), this._labelPrinter_id = Nn("card.configure.labels.printer_id", this.language), this._labelVertical = Nn("card.configure.labels.vertical", this.language), this._labelRound = Nn("card.configure.labels.round", this.language), this._labelUse_24hr = Nn("card.configure.labels.use_24hr", this.language), this._labelShowSettingsButton = Nn("card.configure.labels.show_settings_button", this.language), this._labelAlwaysShow = Nn("card.configure.labels.always_show", this.language), this._labelTemperatureUnit = Nn("card.configure.labels.temperature_unit", this.language), this._labelLightEntityId = Nn("card.configure.labels.light_entity_id", this.language), this._labelPowerEntityId = Nn("card.configure.labels.power_entity_id", this.language), this._labelCameraEntityId = Nn("card.configure.labels.camera_entity_id", this.language), this._labelScaleFactor = Nn("card.configure.labels.scale_factor", this.language), this._labelSlotColors = Nn("card.configure.labels.slot_colors", this.language), this._labelMediaView = Nn("card.configure.labels.media_view", this.language), this._labelShowControls = Nn("card.configure.labels.show_controls", this.language), this._labelShowMoveButtons = Nn("card.configure.labels.show_move_buttons", this.language), this._labelSections = Nn("card.configure.labels.sections", this.language), this._labelPrinterArt = Nn("card.configure.labels.printer_art", this.language)), (t.has("hass") || t.has("cardConfig")) && (this.printerEntities = si(this.hass, this.cardConfig.printer_id), this.printerEntityIdPart = li(this.printerEntities), this.isLCD = (e = this.hass, i = this.printerEntities, r = this.printerEntityIdPart, "Resin" === ui(e, i, r, "current_status").attributes.material_type), this.hasColorbox = "active" === ui(this.hass, this.printerEntities, this.printerEntityIdPart, "ace_spools", "inactive").state, this.availableStats = Object.assign(Object.assign({}, Ct), Et), this.isLCD ? this.availableStats = Object.assign(Object.assign({}, this.availableStats), Tt) : this.availableStats = Object.assign(Object.assign({}, this.availableStats), At), this.hasColorbox && (this.availableStats = Object.assign(Object.assign({}, this.availableStats), Pt))), (t.has("printers") || t.has("language")) && (this.formSchemaMain = this._computeSchemaMain(), this.formSchemaColours = this._computeSchemaColours());
    }
    render() {
      return q`
      <div class="ac-printer-card-configure-cont">
        ${this._renderMenu()} ${this._renderConfMain()}
        ${this._renderConfColours()} ${this._renderConfStats()}
      </div>
    `;
    }
    _renderConfMain() {
      return "main" === this.configPage ? q`
          <div class="ac-printer-card-configure-conf">
            <ha-form
              .hass=${this.hass}
              .data=${this.cardConfig}
              .schema=${this.formSchemaMain}
              .computeLabel=${this._computeLabel}
              @value-changed=${this._formValueChanged}
            ></ha-form>
          </div>
        ` : J;
    }
    _renderConfStats() {
      return "stats" === this.configPage ? q`
          <div class="ac-printer-card-configure-conf">
            <p class="ac-cconf-label">Choose Monitored Stats</p>
            <anycubic-ui-multi-select-reorder
              .availableOptions=${this.availableStats}
              .initialItems=${this.cardConfig.monitoredStats}
              .onChange=${this._selectedStatsChanged}
            ></anycubic-ui-multi-select-reorder>
          </div>
        ` : J;
    }
    _renderConfColours() {
      return "colours" === this.configPage ? q`
          <div class="ac-printer-card-configure-conf">
            <ha-form
              .hass=${this.hass}
              .data=${this.cardConfig}
              .schema=${this.formSchemaColours}
              .computeLabel=${this._computeLabel}
              @value-changed=${this._formValueChanged}
            ></ha-form>
          </div>
        ` : J;
    }
    _renderMenu() {
      return q`
      <div class="header">
        <ha-tabs
          scrollable
          attr-for-selected="page-name"
          .selected=${this.configPage}
          @iron-activate=${this._handlePageSelected}
        >
          <paper-tab page-name="main">${this._tabMain}</paper-tab>
          <paper-tab page-name="stats">${this._tabStats}</paper-tab>
          ${this.hasColorbox ? q`<paper-tab page-name="colours">
                ${this._tabColours}
              </paper-tab>` : J}
        </ha-tabs>
      </div>
    `;
    }
    _configChanged(t) {
      const e = Object.keys(t).filter(e => t[e] !== Ko[e]).reduce((e, i) => (e[i] = t[i], e), {});
      We(this, "config-changed", {
        config: e
      });
    }
    _computeSchemaMain() {
      if (!this.printers) return [];
      return [{
        name: "printer_id",
        selector: {
          select: {
            options: Object.keys(this.printers).map((t, e) => ({
              value: t,
              label: this.printers[t].name
            })),
            mode: "dropdown",
            multiple: !1
          }
        }
      }, {
        name: "vertical",
        selector: {
          boolean: {}
        }
      }, {
        name: "round",
        selector: {
          boolean: {}
        }
      }, {
        name: "use_24hr",
        selector: {
          boolean: {}
        }
      }, {
        name: "temperatureUnit",
        selector: {
          select: {
            options: [{
              value: St.C,
              label: `°${St.C}`
            }, {
              value: St.F,
              label: `°${St.F}`
            }],
            mode: "list",
            multiple: !1
          }
        }
      }, {
        name: "alwaysShow",
        selector: {
          boolean: {}
        }
      }, {
        name: "showSettingsButton",
        selector: {
          boolean: {}
        }
      }, {
        name: "scaleFactor",
        selector: {
          select: {
            options: [{
              value: 1,
              label: "1"
            }, {
              value: .75,
              label: "0.75"
            }, {
              value: .5,
              label: "0.5"
            }],
            mode: "list",
            multiple: !1
          }
        }
      }, {
        name: "lightEntityId",
        selector: {
          entity: {
            domain: Ze
          }
        }
      }, {
        name: "powerEntityId",
        selector: {
          entity: {
            domain: Ke
          }
        }
      }, {
        name: "cameraEntityId",
        selector: {
          entity: {
            domain: Ye
          }
        }
      }, {
        name: "mediaView",
        selector: {
          select: {
            options: [{
              value: Mt.Auto,
              label: this._opt("media_view", "auto")
            }, {
              value: Mt.Camera,
              label: this._opt("media_view", "camera")
            }, {
              value: Mt.Preview,
              label: this._opt("media_view", "preview")
            }, {
              value: Mt.Printer,
              label: this._opt("media_view", "printer")
            }, {
              value: Mt.PrinterModel,
              label: this._opt("media_view", "printer_model")
            }, {
              value: Mt.None,
              label: this._opt("media_view", "none")
            }],
            mode: "dropdown",
            multiple: !1
          }
        }
      }, {
        name: "printerArt",
        selector: {
          select: {
            options: [{
              value: Ht.Auto,
              label: this._optPrinterArt(Ht.Auto)
            }, {
              value: Ht.KobraS1,
              label: this._optPrinterArt(Ht.KobraS1)
            }, {
              value: Ht.KobraS1Combo,
              label: this._optPrinterArt(Ht.KobraS1Combo)
            }, {
              value: Ht.Kobra3,
              label: this._optPrinterArt(Ht.Kobra3)
            }, {
              value: Ht.Resin,
              label: this._optPrinterArt(Ht.Resin)
            }, {
              value: Ht.FDM,
              label: this._optPrinterArt(Ht.FDM)
            }],
            mode: "dropdown",
            multiple: !1
          }
        }
      }, {
        name: "showControls",
        selector: {
          boolean: {}
        }
      }, {
        name: "showMoveButtons",
        selector: {
          boolean: {}
        }
      }, {
        name: "sections",
        selector: {
          select: {
            options: [{
              value: Bt.Filament,
              label: this._opt("sections", "filament")
            }, {
              value: Bt.Insights,
              label: this._opt("sections", "insights")
            }],
            mode: "list",
            multiple: !0
          }
        }
      }];
    }
    _computeSchemaColours() {
      return this.printers ? [{
        name: "slotColors",
        selector: {
          text: {
            multiple: !0
          }
        }
      }] : [];
    }
    static get styles() {
      return u`
      :host {
        display: block;
      }

      .header {
        color: var(--primary-text-color);
      }

      ha-tabs {
        margin-left: max(env(safe-area-inset-left), 24px);
        margin-right: max(env(safe-area-inset-right), 24px);
        --paper-tabs-selection-bar-color: var(--primary-color);
        text-transform: uppercase;
      }

      .ac-printer-card-configure-conf {
        margin-top: 10px;
      }

      .ac-cconf-label {
        margin-bottom: 4px;
        font-weight: bold;
        font-size: 14px;
      }
    `;
    }
  };
  n([_t()], Yo.prototype, "hass", void 0), n([_t()], Yo.prototype, "language", void 0), n([_t({
    attribute: "card-config"
  })], Yo.prototype, "cardConfig", void 0), n([_t()], Yo.prototype, "printers", void 0), n([vt()], Yo.prototype, "configPage", void 0), n([vt()], Yo.prototype, "availableStats", void 0), n([vt()], Yo.prototype, "formSchemaMain", void 0), n([vt()], Yo.prototype, "formSchemaColours", void 0), n([vt()], Yo.prototype, "printerEntities", void 0), n([vt()], Yo.prototype, "printerEntityIdPart", void 0), n([vt()], Yo.prototype, "hasColorbox", void 0), n([vt()], Yo.prototype, "isLCD", void 0), n([vt()], Yo.prototype, "_tabMain", void 0), n([vt()], Yo.prototype, "_tabStats", void 0), n([vt()], Yo.prototype, "_tabColours", void 0), n([vt()], Yo.prototype, "_labelPrinter_id", void 0), n([vt()], Yo.prototype, "_labelVertical", void 0), n([vt()], Yo.prototype, "_labelRound", void 0), n([vt()], Yo.prototype, "_labelUse_24hr", void 0), n([vt()], Yo.prototype, "_labelShowSettingsButton", void 0), n([vt()], Yo.prototype, "_labelAlwaysShow", void 0), n([vt()], Yo.prototype, "_labelTemperatureUnit", void 0), n([vt()], Yo.prototype, "_labelLightEntityId", void 0), n([vt()], Yo.prototype, "_labelPowerEntityId", void 0), n([vt()], Yo.prototype, "_labelCameraEntityId", void 0), n([vt()], Yo.prototype, "_labelScaleFactor", void 0), n([vt()], Yo.prototype, "_labelSlotColors", void 0), n([vt()], Yo.prototype, "_labelMediaView", void 0), n([vt()], Yo.prototype, "_labelShowControls", void 0), n([vt()], Yo.prototype, "_labelShowMoveButtons", void 0), n([vt()], Yo.prototype, "_labelSections", void 0), n([vt()], Yo.prototype, "_labelPrinterArt", void 0), Yo = n([(t => (e, i) => {
    void 0 !== i ? i.addInitializer(() => {
      customElements.define(t, e);
    }) : customElements.define(t, e);
  })("anycubic-printercard-configure")], Yo), window.console.info("%c ANYCUBIC-CARD %c v0.2.2 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
  const Wo = wi();
  function qo(t) {
    var e, i;
    return "boolean" == typeof t.showMoveButtons ? t.showMoveButtons : null !== (i = null === (e = t.sections) || void 0 === e ? void 0 : e.includes(Bt.Move)) && void 0 !== i && i;
  }
  t.AnycubicPrintercardEditor = class extends mt {
    constructor() {
      super(...arguments), this.config = {};
    }
    async firstUpdated() {
      this.printers = ei(this.hass);
    }
    willUpdate(t) {
      super.willUpdate(t), t.has("hass") && this.hass.language !== this.language && (this.language = this.hass.language), t.has("config") && (this.config.vertical = xi(this.config.vertical, Wo.vertical), this.config.round = xi(this.config.round, Wo.round), this.config.use_24hr = xi(this.config.use_24hr, Wo.use_24hr), this.config.alwaysShow = xi(this.config.alwaysShow, Wo.alwaysShow), this.config.showSettingsButton = xi(this.config.showSettingsButton, Wo.showSettingsButton), this.config.temperatureUnit = xi(this.config.temperatureUnit, Wo.temperatureUnit), this.config.monitoredStats = xi(this.config.monitoredStats, Wo.monitoredStats), this.config.slotColors = xi(this.config.slotColors, Wo.slotColors), this.config.scaleFactor = xi(this.config.scaleFactor, Wo.scaleFactor), this.config.mediaView = xi(this.config.mediaView, Wo.mediaView), this.config.printerArt = xi(this.config.printerArt, Wo.printerArt), this.config.showControls = xi(this.config.showControls, Wo.showControls), this.config.showMoveButtons = qo(this.config), this.config.sections = xi(this.config.sections, Wo.sections));
    }
    setConfig(t) {
      this.config = Object.assign({}, t);
    }
    render() {
      return q`
      <anycubic-printercard-configure
        .hass=${this.hass}
        .language=${this.language}
        .printers=${this.printers}
        .cardConfig=${this.config}
      ></anycubic-printercard-configure>
    `;
    }
  }, n([_t()], t.AnycubicPrintercardEditor.prototype, "hass", void 0), n([_t()], t.AnycubicPrintercardEditor.prototype, "config", void 0), n([vt()], t.AnycubicPrintercardEditor.prototype, "printers", void 0), n([vt()], t.AnycubicPrintercardEditor.prototype, "language", void 0), t.AnycubicPrintercardEditor = n([$t("anycubic-card-editor")], t.AnycubicPrintercardEditor), t.AnycubicCard = class extends mt {
    constructor() {
      super(...arguments), this.config = {};
    }
    async firstUpdated() {
      this.printers = ei(this.hass), this.requestUpdate();
    }
    willUpdate(t) {
      var e, i;
      super.willUpdate(t), t.has("hass") && this.hass.language !== this.language && (this.language = this.hass.language), (t.has("config") || t.has("printers")) && (this.vertical = xi(this.config.vertical, Wo.vertical), this.round = xi(this.config.round, Wo.round), this.use_24hr = xi(this.config.use_24hr, Wo.use_24hr), this.alwaysShow = xi(this.config.alwaysShow, Wo.alwaysShow), this.showSettingsButton = xi(this.config.showSettingsButton, Wo.showSettingsButton), this.temperatureUnit = xi(this.config.temperatureUnit, Wo.temperatureUnit), this.lightEntityId = this.config.lightEntityId, this.powerEntityId = this.config.powerEntityId, this.cameraEntityId = this.config.cameraEntityId, this.scaleFactor = this.config.scaleFactor, this.slotColors = this.config.slotColors, this.monitoredStats = this.config.monitoredStats, this.mediaView = xi(this.config.mediaView, Wo.mediaView), this.printerArt = xi(this.config.printerArt, Wo.printerArt), this.showControls = xi(this.config.showControls, Wo.showControls), this.showMoveButtons = qo(this.config), this.sections = xi(this.config.sections, Wo.sections), this.config.printer_id && this.printers && (this.selectedPrinterID = this.config.printer_id, this.selectedPrinterDevice = (e = this.printers, i = this.config.printer_id, e && i ? e[i] : void 0)));
    }
    setConfig(t) {
      this.config = Object.assign({}, t);
    }
    render() {
      return q`
      <anycubic-printercard-card
        .hass=${this.hass}
        .language=${this.language}
        .monitoredStats=${this.config.monitoredStats}
        .selectedPrinterID=${this.selectedPrinterID}
        .selectedPrinterDevice=${this.selectedPrinterDevice}
        .vertical=${this.vertical}
        .round=${this.round}
        .use_24hr=${this.use_24hr}
        .showSettingsButton=${this.showSettingsButton}
        .alwaysShow=${this.alwaysShow}
        .temperatureUnit=${this.temperatureUnit}
        .lightEntityId=${this.lightEntityId}
        .powerEntityId=${this.powerEntityId}
        .cameraEntityId=${this.cameraEntityId}
        .scaleFactor=${this.scaleFactor}
        .slotColors=${this.slotColors}
        .mediaView=${this.mediaView}
        .printerArt=${this.printerArt}
        .showControls=${this.showControls}
        .showMoveButtons=${this.showMoveButtons}
        .sections=${this.sections}
      ></anycubic-printercard-card>
    `;
    }
    getCardSize() {
      return this.config.mediaView === Mt.None ? 4 : 8;
    }
    getGridOptions() {
      return {
        columns: 12,
        min_columns: 6,
        rows: "auto"
      };
    }
    static getConfigElement() {
      return document.createElement("anycubic-card-editor");
    }
    static getStubConfig(t, e, i) {
      return {
        printer_id: Object.keys(ei(t))[0]
      };
    }
  }, n([_t()], t.AnycubicCard.prototype, "hass", void 0), n([_t()], t.AnycubicCard.prototype, "config", void 0), n([vt()], t.AnycubicCard.prototype, "printers", void 0), n([vt()], t.AnycubicCard.prototype, "language", void 0), n([vt()], t.AnycubicCard.prototype, "selectedPrinterID", void 0), n([vt()], t.AnycubicCard.prototype, "selectedPrinterDevice", void 0), n([vt()], t.AnycubicCard.prototype, "vertical", void 0), n([vt()], t.AnycubicCard.prototype, "round", void 0), n([vt()], t.AnycubicCard.prototype, "use_24hr", void 0), n([vt()], t.AnycubicCard.prototype, "showSettingsButton", void 0), n([vt()], t.AnycubicCard.prototype, "alwaysShow", void 0), n([vt()], t.AnycubicCard.prototype, "temperatureUnit", void 0), n([vt()], t.AnycubicCard.prototype, "lightEntityId", void 0), n([vt()], t.AnycubicCard.prototype, "powerEntityId", void 0), n([vt()], t.AnycubicCard.prototype, "cameraEntityId", void 0), n([vt()], t.AnycubicCard.prototype, "scaleFactor", void 0), n([vt()], t.AnycubicCard.prototype, "slotColors", void 0), n([vt()], t.AnycubicCard.prototype, "monitoredStats", void 0), n([vt()], t.AnycubicCard.prototype, "mediaView", void 0), n([vt()], t.AnycubicCard.prototype, "printerArt", void 0), n([vt()], t.AnycubicCard.prototype, "showControls", void 0), n([vt()], t.AnycubicCard.prototype, "showMoveButtons", void 0), n([vt()], t.AnycubicCard.prototype, "sections", void 0), t.AnycubicCard = n([$t("anycubic-card")], t.AnycubicCard);
  const Xo = window;
  Xo.customCards = Xo.customCards || [], Xo.customCards.push({
    type: "anycubic-card",
    name: "Anycubic Card",
    preview: !0,
    description: "Anycubic Cloud Integration Card"
  }), Object.defineProperty(t, "__esModule", {
    value: !0
  });
}({});
