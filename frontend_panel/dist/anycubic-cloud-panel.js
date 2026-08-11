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
      a = s < 3 ? e : null === r ? r = Object.getOwnPropertyDescriptor(e, i) : r;
    if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, i, r);else for (var o = t.length - 1; o >= 0; o--) (n = t[o]) && (a = (s < 3 ? n(a) : s > 3 ? n(e, i, a) : n(e, i)) || a);
    return s > 3 && a && Object.defineProperty(e, i, a), a;
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
  const a = globalThis,
    o = a.ShadowRoot && (void 0 === a.ShadyCSS || a.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype,
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
      if (o && void 0 === t) {
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
    p = (t, ...e) => {
      const i = 1 === t.length ? t[0] : e.reduce((e, i, r) => e + (t => {
        if (!0 === t._$cssResult$) return t.cssText;
        if ("number" == typeof t) return t;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(i) + t[r + 1], t[0]);
      return new h(i, t, l);
    },
    u = o ? t => t : t => t instanceof CSSStyleSheet ? (t => {
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
      getOwnPropertyNames: v,
      getOwnPropertySymbols: y,
      getPrototypeOf: f
    } = Object,
    _ = globalThis,
    w = _.trustedTypes,
    x = w ? w.emptyScript : "",
    $ = _.reactiveElementPolyfillSupport,
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
    P = (t, e) => !g(t, e),
    C = {
      attribute: !0,
      type: String,
      converter: S,
      reflect: !1,
      hasChanged: P
    };
  Symbol.metadata ??= Symbol("metadata"), _.litPropertyMetadata ??= new WeakMap();
  class A extends HTMLElement {
    static addInitializer(t) {
      this._$Ei(), (this.l ??= []).push(t);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t, e = C) {
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
      return this.elementProperties.get(t) ?? C;
    }
    static _$Ei() {
      if (this.hasOwnProperty(E("elementProperties"))) return;
      const t = f(this);
      t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(E("finalized"))) return;
      if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
        const t = this.properties,
          e = [...v(t), ...y(t)];
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
        for (const t of i) e.unshift(u(t));
      } else void 0 !== t && e.push(u(t));
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
        if (o) t.adoptedStyleSheets = e.map(t => t instanceof CSSStyleSheet ? t : t.styleSheet);else for (const i of e) {
          const e = document.createElement("style"),
            r = a.litNonce;
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
        if (i ??= this.constructor.getPropertyOptions(t), !(i.hasChanged ?? P)(this[t], e)) return;
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
  A.elementStyles = [], A.shadowRootOptions = {
    mode: "open"
  }, A[E("elementProperties")] = new Map(), A[E("finalized")] = new Map(), $?.({
    ReactiveElement: A
  }), (_.reactiveElementVersions ??= []).push("2.0.4");
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
    D = `lit$${Math.random().toFixed(9).slice(2)}$`,
    F = "?" + D,
    B = `<${F}>`,
    I = document,
    L = () => I.createComment(""),
    N = t => null === t || "object" != typeof t && "function" != typeof t,
    O = Array.isArray,
    z = t => O(t) || "function" == typeof t?.[Symbol.iterator],
    U = "[ \t\n\f\r]",
    R = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
    j = /-->/g,
    V = />/g,
    G = RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"),
    Z = /'/g,
    Y = /"/g,
    K = /^(?:script|style|textarea|title)$/i,
    q = t => (e, ...i) => ({
      _$litType$: t,
      strings: e,
      values: i
    }),
    W = q(1),
    X = q(2),
    Q = Symbol.for("lit-noChange"),
    J = Symbol.for("lit-nothing"),
    tt = new WeakMap(),
    et = I.createTreeWalker(I, 129);
  function it(t, e) {
    if (!Array.isArray(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== M ? M.createHTML(e) : e;
  }
  const rt = (t, e) => {
    const i = t.length - 1,
      r = [];
    let n,
      s = 2 === e ? "<svg>" : "",
      a = R;
    for (let e = 0; e < i; e++) {
      const i = t[e];
      let o,
        l,
        c = -1,
        h = 0;
      for (; h < i.length && (a.lastIndex = h, l = a.exec(i), null !== l);) h = a.lastIndex, a === R ? "!--" === l[1] ? a = j : void 0 !== l[1] ? a = V : void 0 !== l[2] ? (K.test(l[2]) && (n = RegExp("</" + l[2], "g")), a = G) : void 0 !== l[3] && (a = G) : a === G ? ">" === l[0] ? (a = n ?? R, c = -1) : void 0 === l[1] ? c = -2 : (c = a.lastIndex - l[2].length, o = l[1], a = void 0 === l[3] ? G : '"' === l[3] ? Y : Z) : a === Y || a === Z ? a = G : a === j || a === V ? a = R : (a = G, n = void 0);
      const d = a === G && t[e + 1].startsWith("/>") ? " " : "";
      s += a === R ? i + B : c >= 0 ? (r.push(o), i.slice(0, c) + H + i.slice(c) + D + d) : i + D + (-2 === c ? e : d);
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
      const a = t.length - 1,
        o = this.parts,
        [l, c] = rt(t, e);
      if (this.el = nt.createElement(l, i), et.currentNode = this.el.content, 2 === e) {
        const t = this.el.content.firstChild;
        t.replaceWith(...t.childNodes);
      }
      for (; null !== (r = et.nextNode()) && o.length < a;) {
        if (1 === r.nodeType) {
          if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(H)) {
            const e = c[s++],
              i = r.getAttribute(t).split(D),
              a = /([.?@])?(.*)/.exec(e);
            o.push({
              type: 1,
              index: n,
              name: a[2],
              strings: i,
              ctor: "." === a[1] ? ct : "?" === a[1] ? ht : "@" === a[1] ? dt : lt
            }), r.removeAttribute(t);
          } else t.startsWith(D) && (o.push({
            type: 6,
            index: n
          }), r.removeAttribute(t));
          if (K.test(r.tagName)) {
            const t = r.textContent.split(D),
              e = t.length - 1;
            if (e > 0) {
              r.textContent = k ? k.emptyScript : "";
              for (let i = 0; i < e; i++) r.append(t[i], L()), et.nextNode(), o.push({
                type: 2,
                index: ++n
              });
              r.append(t[e], L());
            }
          }
        } else if (8 === r.nodeType) if (r.data === F) o.push({
          type: 2,
          index: n
        });else {
          let t = -1;
          for (; -1 !== (t = r.data.indexOf(D, t + 1));) o.push({
            type: 7,
            index: n
          }), t += D.length - 1;
        }
        n++;
      }
    }
    static createElement(t, e) {
      const i = I.createElement("template");
      return i.innerHTML = t, i;
    }
  }
  function st(t, e, i = t, r) {
    if (e === Q) return e;
    let n = void 0 !== r ? i._$Co?.[r] : i._$Cl;
    const s = N(e) ? void 0 : e._$litDirective$;
    return n?.constructor !== s && (n?._$AO?.(!1), void 0 === s ? n = void 0 : (n = new s(t), n._$AT(t, i, r)), void 0 !== r ? (i._$Co ??= [])[r] = n : i._$Cl = n), void 0 !== n && (e = st(t, n._$AS(t, e.values), n, r)), e;
  }
  class at {
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
        r = (t?.creationScope ?? I).importNode(e, !0);
      et.currentNode = r;
      let n = et.nextNode(),
        s = 0,
        a = 0,
        o = i[0];
      for (; void 0 !== o;) {
        if (s === o.index) {
          let e;
          2 === o.type ? e = new ot(n, n.nextSibling, this, t) : 1 === o.type ? e = new o.ctor(n, o.name, o.strings, this, t) : 6 === o.type && (e = new pt(n, this, t)), this._$AV.push(e), o = i[++a];
        }
        s !== o?.index && (n = et.nextNode(), s++);
      }
      return et.currentNode = I, r;
    }
    p(t) {
      let e = 0;
      for (const i of this._$AV) void 0 !== i && (void 0 !== i.strings ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
    }
  }
  class ot {
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
      t = st(this, t, e), N(t) ? t === J || null == t || "" === t ? (this._$AH !== J && this._$AR(), this._$AH = J) : t !== this._$AH && t !== Q && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : z(t) ? this.k(t) : this._(t);
    }
    S(t) {
      return this._$AA.parentNode.insertBefore(t, this._$AB);
    }
    T(t) {
      this._$AH !== t && (this._$AR(), this._$AH = this.S(t));
    }
    _(t) {
      this._$AH !== J && N(this._$AH) ? this._$AA.nextSibling.data = t : this.T(I.createTextNode(t)), this._$AH = t;
    }
    $(t) {
      const {
          values: e,
          _$litType$: i
        } = t,
        r = "number" == typeof i ? this._$AC(t) : (void 0 === i.el && (i.el = nt.createElement(it(i.h, i.h[0]), this.options)), i);
      if (this._$AH?._$AD === r) this._$AH.p(e);else {
        const t = new at(r, this),
          i = t.u(this.options);
        t.p(e), this.T(i), this._$AH = t;
      }
    }
    _$AC(t) {
      let e = tt.get(t.strings);
      return void 0 === e && tt.set(t.strings, e = new nt(t)), e;
    }
    k(t) {
      O(this._$AH) || (this._$AH = [], this._$AR());
      const e = this._$AH;
      let i,
        r = 0;
      for (const n of t) r === e.length ? e.push(i = new ot(this.S(L()), this.S(L()), this, this.options)) : i = e[r], i._$AI(n), r++;
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
      if (void 0 === n) t = st(this, t, e, 0), s = !N(t) || t !== this._$AH && t !== Q, s && (this._$AH = t);else {
        const r = t;
        let a, o;
        for (t = n[0], a = 0; a < n.length - 1; a++) o = st(this, r[i + a], e, a), o === Q && (o = this._$AH[a]), s ||= !N(o) || o !== this._$AH[a], o === J ? t = J : t !== J && (t += (o ?? "") + n[a + 1]), this._$AH[a] = o;
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
  class pt {
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
  const ut = {
      P: H,
      A: D,
      C: F,
      M: 1,
      L: rt,
      R: at,
      D: z,
      V: st,
      I: ot,
      H: lt,
      N: ht,
      U: dt,
      B: ct,
      F: pt
    },
    gt = T.litHtmlPolyfillSupport;
  gt?.(nt, ot), (T.litHtmlVersions ??= []).push("3.1.4");
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  class mt extends A {
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
          r._$litPart$ = n = new ot(e.insertBefore(L(), t), t, void 0, i ?? {});
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
  const vt = t => (e, i) => {
      void 0 !== i ? i.addInitializer(() => {
        customElements.define(t, e);
      }) : customElements.define(t, e);
    }
    /**
         * @license
         * Copyright 2017 Google LLC
         * SPDX-License-Identifier: BSD-3-Clause
         */,
    yt = {
      attribute: !0,
      type: String,
      converter: S,
      reflect: !1,
      hasChanged: P
    },
    ft = (t = yt, e, i) => {
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
  function _t(t) {
    return (e, i) => "object" == typeof i ? ft(t, e, i) : ((t, e, i) => {
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
  function wt(t) {
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
  const xt = (t, e, i) => (i.configurable = !0, i.enumerable = !0, Reflect.decorate && "object" != typeof e && Object.defineProperty(t, e, i), i)
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */;
  function $t(t, e) {
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
        return xt(i, r, {
          get() {
            let i = t.call(this);
            return void 0 === i && (i = s(this), (null !== i || this.hasUpdated) && e.call(this, i)), i;
          }
        });
      }
      return xt(i, r, {
        get() {
          return s(this);
        }
      });
    };
  }
  const Et = 6048e5,
    St = 864e5,
    Pt = 6e4,
    Ct = 36e5,
    At = Symbol.for("constructDateFrom");
  function Tt(t, e) {
    return "function" == typeof t ? t(e) : t && "object" == typeof t && At in t ? t[At](e) : t instanceof Date ? new t.constructor(e) : new Date(e);
  }
  function kt(t, e) {
    return Tt(e || t, t);
  }
  function Mt(t, e, i) {
    const {
        years: r = 0,
        months: n = 0,
        weeks: s = 0,
        days: a = 0,
        hours: o = 0,
        minutes: l = 0,
        seconds: c = 0
      } = e,
      h = kt(t, i?.in),
      d = n || r ? function (t, e, i) {
        const r = kt(t, i?.in);
        if (isNaN(e)) return Tt(i?.in || t, NaN);
        if (!e) return r;
        const n = r.getDate(),
          s = Tt(i?.in || t, r.getTime());
        return s.setMonth(r.getMonth() + e + 1, 0), n >= s.getDate() ? s : (r.setFullYear(s.getFullYear(), s.getMonth(), n), r);
      }(h, n + 12 * r) : h,
      p = a || s ? function (t, e, i) {
        const r = kt(t, i?.in);
        return isNaN(e) ? Tt(i?.in || t, NaN) : e ? (r.setDate(r.getDate() + e), r) : r;
      }(d, a + 7 * s) : d,
      u = 1e3 * (c + 60 * (l + 60 * o));
    return Tt(i?.in || t, +p + u);
  }
  let Ht = {};
  function Dt() {
    return Ht;
  }
  function Ft(t, e) {
    const i = Dt(),
      r = e?.weekStartsOn ?? e?.locale?.options?.weekStartsOn ?? i.weekStartsOn ?? i.locale?.options?.weekStartsOn ?? 0,
      n = kt(t, e?.in),
      s = n.getDay(),
      a = (s < r ? 7 : 0) + s - r;
    return n.setDate(n.getDate() - a), n.setHours(0, 0, 0, 0), n;
  }
  function Bt(t, e) {
    return Ft(t, {
      ...e,
      weekStartsOn: 1
    });
  }
  function It(t, e) {
    const i = kt(t, e?.in),
      r = i.getFullYear(),
      n = Tt(i, 0);
    n.setFullYear(r + 1, 0, 4), n.setHours(0, 0, 0, 0);
    const s = Bt(n),
      a = Tt(i, 0);
    a.setFullYear(r, 0, 4), a.setHours(0, 0, 0, 0);
    const o = Bt(a);
    return i.getTime() >= s.getTime() ? r + 1 : i.getTime() >= o.getTime() ? r : r - 1;
  }
  function Lt(t) {
    const e = kt(t),
      i = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds(), e.getMilliseconds()));
    return i.setUTCFullYear(e.getFullYear()), +t - +i;
  }
  function Nt(t, ...e) {
    const i = Tt.bind(null, t || e.find(t => "object" == typeof t));
    return e.map(i);
  }
  function Ot(t, e) {
    const i = kt(t, e?.in);
    return i.setHours(0, 0, 0, 0), i;
  }
  function zt(t, e, i) {
    const [r, n] = Nt(i?.in, t, e),
      s = Ot(r),
      a = Ot(n),
      o = +s - Lt(s),
      l = +a - Lt(a);
    return Math.round((o - l) / St);
  }
  function Ut(t, e) {
    const i = +kt(t) - +kt(e);
    return i < 0 ? -1 : i > 0 ? 1 : i;
  }
  function Rt(t) {
    return !(!((e = t) instanceof Date || "object" == typeof e && "[object Date]" === Object.prototype.toString.call(e)) && "number" != typeof t || isNaN(+kt(t)));
    var e;
  }
  function jt(t, e) {
    const i = t.getFullYear() - e.getFullYear() || t.getMonth() - e.getMonth() || t.getDate() - e.getDate() || t.getHours() - e.getHours() || t.getMinutes() - e.getMinutes() || t.getSeconds() - e.getSeconds() || t.getMilliseconds() - e.getMilliseconds();
    return i < 0 ? -1 : i > 0 ? 1 : i;
  }
  function Vt(t) {
    return e => {
      const i = (t ? Math[t] : Math.trunc)(e);
      return 0 === i ? 0 : i;
    };
  }
  function Gt(t, e) {
    return +kt(t) - +kt(e);
  }
  function Zt(t, e) {
    const i = kt(t, e?.in);
    return +function (t, e) {
      const i = kt(t, e?.in);
      return i.setHours(23, 59, 59, 999), i;
    }(i, e) == +function (t, e) {
      const i = kt(t, e?.in),
        r = i.getMonth();
      return i.setFullYear(i.getFullYear(), r + 1, 0), i.setHours(23, 59, 59, 999), i;
    }(i, e);
  }
  function Yt(t, e, i) {
    const [r, n, s] = Nt(i?.in, t, t, e),
      a = Ut(n, s),
      o = Math.abs(function (t, e, i) {
        const [r, n] = Nt(i?.in, t, e);
        return 12 * (r.getFullYear() - n.getFullYear()) + (r.getMonth() - n.getMonth());
      }(n, s));
    if (o < 1) return 0;
    1 === n.getMonth() && n.getDate() > 27 && n.setDate(30), n.setMonth(n.getMonth() - a * o);
    let l = Ut(n, s) === -a;
    Zt(r) && 1 === o && 1 === Ut(r, s) && (l = !1);
    const c = a * (o - +l);
    return 0 === c ? 0 : c;
  }
  function Kt(t, e, i) {
    const [r, n] = Nt(i?.in, t, e),
      s = Ut(r, n),
      a = Math.abs(function (t, e, i) {
        const [r, n] = Nt(i?.in, t, e);
        return r.getFullYear() - n.getFullYear();
      }(r, n));
    r.setFullYear(1584), n.setFullYear(1584);
    const o = s * (a - +(Ut(r, n) === -s));
    return 0 === o ? 0 : o;
  }
  const qt = {
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
  function Wt(t) {
    return (e = {}) => {
      const i = e.width ? String(e.width) : t.defaultWidth;
      return t.formats[i] || t.formats[t.defaultWidth];
    };
  }
  const Xt = {
      date: Wt({
        formats: {
          full: "EEEE, MMMM do, y",
          long: "MMMM do, y",
          medium: "MMM d, y",
          short: "MM/dd/yyyy"
        },
        defaultWidth: "full"
      }),
      time: Wt({
        formats: {
          full: "h:mm:ss a zzzz",
          long: "h:mm:ss a z",
          medium: "h:mm:ss a",
          short: "h:mm a"
        },
        defaultWidth: "full"
      }),
      dateTime: Wt({
        formats: {
          full: "{{date}} 'at' {{time}}",
          long: "{{date}} 'at' {{time}}",
          medium: "{{date}}, {{time}}",
          short: "{{date}}, {{time}}"
        },
        defaultWidth: "full"
      })
    },
    Qt = {
      lastWeek: "'last' eeee 'at' p",
      yesterday: "'yesterday at' p",
      today: "'today at' p",
      tomorrow: "'tomorrow at' p",
      nextWeek: "eeee 'at' p",
      other: "P"
    };
  function Jt(t) {
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
  function te(t) {
    return (e, i = {}) => {
      const r = i.width,
        n = r && t.matchPatterns[r] || t.matchPatterns[t.defaultMatchWidth],
        s = e.match(n);
      if (!s) return null;
      const a = s[0],
        o = r && t.parsePatterns[r] || t.parsePatterns[t.defaultParseWidth],
        l = Array.isArray(o) ? function (t, e) {
          for (let i = 0; i < t.length; i++) if (e(t[i])) return i;
          return;
        }(o, t => t.test(a)) : function (t, e) {
          for (const i in t) if (Object.prototype.hasOwnProperty.call(t, i) && e(t[i])) return i;
          return;
        }(o, t => t.test(a));
      let c;
      c = t.valueCallback ? t.valueCallback(l) : l, c = i.valueCallback ? i.valueCallback(c) : c;
      return {
        value: c,
        rest: e.slice(a.length)
      };
    };
  }
  var ee;
  const ie = {
    code: "en-US",
    formatDistance: (t, e, i) => {
      let r;
      const n = qt[t];
      return r = "string" == typeof n ? n : 1 === e ? n.one : n.other.replace("{{count}}", e.toString()), i?.addSuffix ? i.comparison && i.comparison > 0 ? "in " + r : r + " ago" : r;
    },
    formatLong: Xt,
    formatRelative: (t, e, i, r) => Qt[t],
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
      era: Jt({
        values: {
          narrow: ["B", "A"],
          abbreviated: ["BC", "AD"],
          wide: ["Before Christ", "Anno Domini"]
        },
        defaultWidth: "wide"
      }),
      quarter: Jt({
        values: {
          narrow: ["1", "2", "3", "4"],
          abbreviated: ["Q1", "Q2", "Q3", "Q4"],
          wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
        },
        defaultWidth: "wide",
        argumentCallback: t => t - 1
      }),
      month: Jt({
        values: {
          narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
          abbreviated: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          wide: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        defaultWidth: "wide"
      }),
      day: Jt({
        values: {
          narrow: ["S", "M", "T", "W", "T", "F", "S"],
          short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          wide: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        defaultWidth: "wide"
      }),
      dayPeriod: Jt({
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
      ordinalNumber: (ee = {
        matchPattern: /^(\d+)(th|st|nd|rd)?/i,
        parsePattern: /\d+/i,
        valueCallback: t => parseInt(t, 10)
      }, (t, e = {}) => {
        const i = t.match(ee.matchPattern);
        if (!i) return null;
        const r = i[0],
          n = t.match(ee.parsePattern);
        if (!n) return null;
        let s = ee.valueCallback ? ee.valueCallback(n[0]) : n[0];
        return s = e.valueCallback ? e.valueCallback(s) : s, {
          value: s,
          rest: t.slice(r.length)
        };
      }),
      era: te({
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
      quarter: te({
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
      month: te({
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
      day: te({
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
      dayPeriod: te({
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
  function re(t, e) {
    const i = kt(t, e?.in),
      r = zt(i, function (t, e) {
        const i = kt(t, e?.in);
        return i.setFullYear(i.getFullYear(), 0, 1), i.setHours(0, 0, 0, 0), i;
      }(i));
    return r + 1;
  }
  function ne(t, e) {
    const i = kt(t, e?.in),
      r = +Bt(i) - +function (t, e) {
        const i = It(t, e),
          r = Tt(e?.in || t, 0);
        return r.setFullYear(i, 0, 4), r.setHours(0, 0, 0, 0), Bt(r);
      }(i);
    return Math.round(r / Et) + 1;
  }
  function se(t, e) {
    const i = kt(t, e?.in),
      r = i.getFullYear(),
      n = Dt(),
      s = e?.firstWeekContainsDate ?? e?.locale?.options?.firstWeekContainsDate ?? n.firstWeekContainsDate ?? n.locale?.options?.firstWeekContainsDate ?? 1,
      a = Tt(e?.in || t, 0);
    a.setFullYear(r + 1, 0, s), a.setHours(0, 0, 0, 0);
    const o = Ft(a, e),
      l = Tt(e?.in || t, 0);
    l.setFullYear(r, 0, s), l.setHours(0, 0, 0, 0);
    const c = Ft(l, e);
    return +i >= +o ? r + 1 : +i >= +c ? r : r - 1;
  }
  function ae(t, e) {
    const i = kt(t, e?.in),
      r = +Ft(i, e) - +function (t, e) {
        const i = Dt(),
          r = e?.firstWeekContainsDate ?? e?.locale?.options?.firstWeekContainsDate ?? i.firstWeekContainsDate ?? i.locale?.options?.firstWeekContainsDate ?? 1,
          n = se(t, e),
          s = Tt(e?.in || t, 0);
        return s.setFullYear(n, 0, r), s.setHours(0, 0, 0, 0), Ft(s, e);
      }(i, e);
    return Math.round(r / Et) + 1;
  }
  function oe(t, e) {
    return (t < 0 ? "-" : "") + Math.abs(t).toString().padStart(e, "0");
  }
  const le = {
      y(t, e) {
        const i = t.getFullYear(),
          r = i > 0 ? i : 1 - i;
        return oe("yy" === e ? r % 100 : r, e.length);
      },
      M(t, e) {
        const i = t.getMonth();
        return "M" === e ? String(i + 1) : oe(i + 1, 2);
      },
      d: (t, e) => oe(t.getDate(), e.length),
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
      h: (t, e) => oe(t.getHours() % 12 || 12, e.length),
      H: (t, e) => oe(t.getHours(), e.length),
      m: (t, e) => oe(t.getMinutes(), e.length),
      s: (t, e) => oe(t.getSeconds(), e.length),
      S(t, e) {
        const i = e.length,
          r = t.getMilliseconds();
        return oe(Math.trunc(r * Math.pow(10, i - 3)), e.length);
      }
    },
    ce = "midnight",
    he = "noon",
    de = "morning",
    pe = "afternoon",
    ue = "evening",
    ge = "night",
    me = {
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
        return le.y(t, e);
      },
      Y: function (t, e, i, r) {
        const n = se(t, r),
          s = n > 0 ? n : 1 - n;
        if ("YY" === e) {
          return oe(s % 100, 2);
        }
        return "Yo" === e ? i.ordinalNumber(s, {
          unit: "year"
        }) : oe(s, e.length);
      },
      R: function (t, e) {
        return oe(It(t), e.length);
      },
      u: function (t, e) {
        return oe(t.getFullYear(), e.length);
      },
      Q: function (t, e, i) {
        const r = Math.ceil((t.getMonth() + 1) / 3);
        switch (e) {
          case "Q":
            return String(r);
          case "QQ":
            return oe(r, 2);
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
            return oe(r, 2);
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
            return le.M(t, e);
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
            return oe(r + 1, 2);
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
        const n = ae(t, r);
        return "wo" === e ? i.ordinalNumber(n, {
          unit: "week"
        }) : oe(n, e.length);
      },
      I: function (t, e, i) {
        const r = ne(t);
        return "Io" === e ? i.ordinalNumber(r, {
          unit: "week"
        }) : oe(r, e.length);
      },
      d: function (t, e, i) {
        return "do" === e ? i.ordinalNumber(t.getDate(), {
          unit: "date"
        }) : le.d(t, e);
      },
      D: function (t, e, i) {
        const r = re(t);
        return "Do" === e ? i.ordinalNumber(r, {
          unit: "dayOfYear"
        }) : oe(r, e.length);
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
            return oe(s, 2);
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
            return oe(s, e.length);
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
            return oe(n, e.length);
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
        switch (n = 12 === r ? he : 0 === r ? ce : r / 12 >= 1 ? "pm" : "am", e) {
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
        switch (n = r >= 17 ? ue : r >= 12 ? pe : r >= 4 ? de : ge, e) {
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
        return le.h(t, e);
      },
      H: function (t, e, i) {
        return "Ho" === e ? i.ordinalNumber(t.getHours(), {
          unit: "hour"
        }) : le.H(t, e);
      },
      K: function (t, e, i) {
        const r = t.getHours() % 12;
        return "Ko" === e ? i.ordinalNumber(r, {
          unit: "hour"
        }) : oe(r, e.length);
      },
      k: function (t, e, i) {
        let r = t.getHours();
        return 0 === r && (r = 24), "ko" === e ? i.ordinalNumber(r, {
          unit: "hour"
        }) : oe(r, e.length);
      },
      m: function (t, e, i) {
        return "mo" === e ? i.ordinalNumber(t.getMinutes(), {
          unit: "minute"
        }) : le.m(t, e);
      },
      s: function (t, e, i) {
        return "so" === e ? i.ordinalNumber(t.getSeconds(), {
          unit: "second"
        }) : le.s(t, e);
      },
      S: function (t, e) {
        return le.S(t, e);
      },
      X: function (t, e, i) {
        const r = t.getTimezoneOffset();
        if (0 === r) return "Z";
        switch (e) {
          case "X":
            return ve(r);
          case "XXXX":
          case "XX":
            return ye(r);
          default:
            return ye(r, ":");
        }
      },
      x: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "x":
            return ve(r);
          case "xxxx":
          case "xx":
            return ye(r);
          default:
            return ye(r, ":");
        }
      },
      O: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "O":
          case "OO":
          case "OOO":
            return "GMT" + be(r, ":");
          default:
            return "GMT" + ye(r, ":");
        }
      },
      z: function (t, e, i) {
        const r = t.getTimezoneOffset();
        switch (e) {
          case "z":
          case "zz":
          case "zzz":
            return "GMT" + be(r, ":");
          default:
            return "GMT" + ye(r, ":");
        }
      },
      t: function (t, e, i) {
        return oe(Math.trunc(+t / 1e3), e.length);
      },
      T: function (t, e, i) {
        return oe(+t, e.length);
      }
    };
  function be(t, e = "") {
    const i = t > 0 ? "-" : "+",
      r = Math.abs(t),
      n = Math.trunc(r / 60),
      s = r % 60;
    return 0 === s ? i + String(n) : i + String(n) + e + oe(s, 2);
  }
  function ve(t, e) {
    if (t % 60 == 0) {
      return (t > 0 ? "-" : "+") + oe(Math.abs(t) / 60, 2);
    }
    return ye(t, e);
  }
  function ye(t, e = "") {
    const i = t > 0 ? "-" : "+",
      r = Math.abs(t);
    return i + oe(Math.trunc(r / 60), 2) + e + oe(r % 60, 2);
  }
  const fe = (t, e) => {
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
    _e = (t, e) => {
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
    we = {
      p: _e,
      P: (t, e) => {
        const i = t.match(/(P+)(p+)?/) || [],
          r = i[1],
          n = i[2];
        if (!n) return fe(t, e);
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
        return s.replace("{{date}}", fe(r, e)).replace("{{time}}", _e(n, e));
      }
    },
    xe = /^D+$/,
    $e = /^Y+$/,
    Ee = ["D", "DD", "YY", "YYYY"];
  const Se = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
    Pe = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
    Ce = /^'([^]*?)'?$/,
    Ae = /''/g,
    Te = /[a-zA-Z]/;
  function ke(t, e, i) {
    const r = Dt(),
      n = i?.locale ?? r.locale ?? ie,
      s = i?.firstWeekContainsDate ?? i?.locale?.options?.firstWeekContainsDate ?? r.firstWeekContainsDate ?? r.locale?.options?.firstWeekContainsDate ?? 1,
      a = i?.weekStartsOn ?? i?.locale?.options?.weekStartsOn ?? r.weekStartsOn ?? r.locale?.options?.weekStartsOn ?? 0,
      o = kt(t, i?.in);
    if (!Rt(o)) throw new RangeError("Invalid time value");
    let l = e.match(Pe).map(t => {
      const e = t[0];
      if ("p" === e || "P" === e) {
        return (0, we[e])(t, n.formatLong);
      }
      return t;
    }).join("").match(Se).map(t => {
      if ("''" === t) return {
        isToken: !1,
        value: "'"
      };
      const e = t[0];
      if ("'" === e) return {
        isToken: !1,
        value: Me(t)
      };
      if (me[e]) return {
        isToken: !0,
        value: t
      };
      if (e.match(Te)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + e + "`");
      return {
        isToken: !1,
        value: t
      };
    });
    n.localize.preprocessor && (l = n.localize.preprocessor(o, l));
    const c = {
      firstWeekContainsDate: s,
      weekStartsOn: a,
      locale: n
    };
    return l.map(r => {
      if (!r.isToken) return r.value;
      const s = r.value;
      (!i?.useAdditionalWeekYearTokens && function (t) {
        return $e.test(t);
      }(s) || !i?.useAdditionalDayOfYearTokens && function (t) {
        return xe.test(t);
      }(s)) && function (t, e, i) {
        const r = function (t, e, i) {
          const r = "Y" === t[0] ? "years" : "days of the month";
          return `Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${r} to the input \`${i}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
        }(t, e, i);
        if (console.warn(r), Ee.includes(t)) throw new RangeError(r);
      }(s, e, String(t));
      return (0, me[s[0]])(o, s, n.localize, c);
    }).join("");
  }
  function Me(t) {
    const e = t.match(Ce);
    return e ? e[1].replace(Ae, "'") : t;
  }
  function He(t, e) {
    const {
        start: i,
        end: r
      } = function (t, e) {
        const [i, r] = Nt(t, e.start, e.end);
        return {
          start: i,
          end: r
        };
      }(e?.in, t),
      n = {},
      s = Kt(r, i);
    s && (n.years = s);
    const a = Mt(i, {
        years: n.years
      }),
      o = Yt(r, a);
    o && (n.months = o);
    const l = Mt(a, {
        months: n.months
      }),
      c = function (t, e, i) {
        const [r, n] = Nt(i?.in, t, e),
          s = jt(r, n),
          a = Math.abs(zt(r, n));
        r.setDate(r.getDate() - s * a);
        const o = s * (a - Number(jt(r, n) === -s));
        return 0 === o ? 0 : o;
      }(r, l);
    c && (n.days = c);
    const h = Mt(l, {
        days: n.days
      }),
      d = function (t, e, i) {
        const [r, n] = Nt(i?.in, t, e),
          s = (+r - +n) / Ct;
        return Vt(i?.roundingMethod)(s);
      }(r, h);
    d && (n.hours = d);
    const p = Mt(h, {
        hours: n.hours
      }),
      u = function (t, e, i) {
        const r = Gt(t, e) / Pt;
        return Vt(i?.roundingMethod)(r);
      }(r, p);
    u && (n.minutes = u);
    const g = function (t, e, i) {
      const r = Gt(t, e) / 1e3;
      return Vt(i?.roundingMethod)(r);
    }(r, Mt(p, {
      minutes: n.minutes
    }));
    return g && (n.seconds = g), n;
  }
  const De = "anycubic_cloud",
    Fe = (t, e, i, r) => {
      const n = r || {},
        s = i ?? {},
        a = new Event(e, {
          bubbles: void 0 === n.bubbles || n.bubbles,
          cancelable: Boolean(n.cancelable),
          composed: void 0 === n.composed || n.composed
        });
      return a.detail = s, t.dispatchEvent(a), a;
    };
  var Be, Ie, Le, Ne, Oe, ze;
  !function (t) {
    t.ETA = "ETA", t.Elapsed = "Elapsed", t.Remaining = "Remaining";
  }(Be || (Be = {})), function (t) {
    t.F = "F", t.C = "C";
  }(Ie || (Ie = {})), function (t) {
    t.Status = "Status", t.PrinterOnline = "Online", t.Availability = "Availability", t.ProjectName = "Project", t.CurrentLayer = "Layer";
  }(Le || (Le = {})), function (t) {
    t.HotendCurrent = "Hotend", t.BedCurrent = "Bed", t.HotendTarget = "T Hotend", t.BedTarget = "T Bed", t.DryingStatus = "Dry Status", t.DryingTime = "Dry Time", t.SpeedMode = "Speed Mode", t.FanSpeed = "Fan Speed";
  }(Ne || (Ne = {})), function (t) {
    t.DryingStatus = "Dry Status", t.DryingTime = "Dry Time";
  }(Oe || (Oe = {})), function (t) {
    t.OnTime = "On Time", t.OffTime = "Off Time", t.BottomTime = "Bottom Time", t.ModelHeight = "Model Height", t.BottomLayers = "Bottom Layers", t.ZUpHeight = "Z Up Height", t.ZUpSpeed = "Z Up Speed", t.ZDownSpeed = "Z Down Speed";
  }(ze || (ze = {}));
  const Ue = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, Be), Le), Ne), Oe), ze);
  var Re, je, Ve, Ge, Ze;
  !function (t) {
    t.Auto = "auto", t.Camera = "camera", t.Preview = "preview", t.Printer = "printer", t.PrinterModel = "printer_model", t.None = "none";
  }(Re || (Re = {})), function (t) {
    t.Auto = "auto", t.KobraS1 = "kobra_s1", t.KobraS1Combo = "kobra_s1_combo", t.Kobra3 = "kobra_3", t.Resin = "resin", t.FDM = "fdm";
  }(je || (je = {})), function (t) {
    t.Filament = "filament", t.Move = "move", t.Insights = "insights";
  }(Ve || (Ve = {})), function (t) {
    t.PLA = "PLA", t.PETG = "PETG", t.ABS = "ABS", t.PACF = "PACF", t.PC = "PC", t.ASA = "ASA", t.HIPS = "HIPS", t.PA = "PA", t.PLA_SE = "PLA_SE";
  }(Ge || (Ge = {})), function (t) {
    t.PAUSE = "pause", t.RESUME = "resume", t.CANCEL = "cancel";
  }(Ze || (Ze = {}));
  const Ye = "—";
  function Ke(t) {
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
  function qe(t) {
    return t.toLowerCase().split(" ").map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");
  }
  function We(t, e) {
    return e ? t.states[e.entity_id] : void 0;
  }
  function Xe(t, e) {
    const i = We(t, e);
    return i ? String(i.state) : "";
  }
  function Qe(t, e, i, r) {
    return "on" === Xe(t, e) ? i : r;
  }
  function Je(t, e) {
    var i;
    return null === (i = function (t, e) {
      for (const i in t) if (t[i].translation_key === e) return t[i];
    }(t, e)) || void 0 === i ? void 0 : i.entity_id;
  }
  function ti(t, e, i) {
    const r = Je(e, i);
    return r ? t.states[r] : void 0;
  }
  function ei(t, e, i) {
    const r = ti(t, e, i);
    if (!r || "unavailable" === r.state || "unknown" === r.state) return;
    const n = parseFloat(r.state);
    return isNaN(n) ? void 0 : n;
  }
  function ii(t, e) {
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
  function ri(t, e, i, r) {
    let n;
    for (const s in t) {
      const a = t[s],
        o = s.split(".");
      if (o[0] === e) {
        if (a.translation_key === i) return a;
        if (!n) {
          const t = o[1];
          (r ? t.split(r)[1] === i : t.endsWith(i)) && (n = a);
        }
      }
    }
    return n;
  }
  function ni(t, e, i) {
    return ri(t, e, i);
  }
  function si(t, e, i) {
    return e + "." + String(t) + i;
  }
  function ai(t, e, i, r) {
    if (e) return ri(t, i, r, e);
  }
  function oi(t) {
    for (const e in t) {
      const t = e.split("."),
        i = t[0],
        r = t[1];
      if ("binary_sensor" === i && r.endsWith("printer_online")) return r.split("printer_online")[0];
    }
  }
  function li(t, e, i, r) {
    return function (t, e, i, r, n = "unavailable", s = {}) {
      return We(t, ai(e, i, "button", r)) || Ke({
        state: String(n),
        attributes: s
      });
    }(t, e, i, r, "unavailable", {
      duration: 0,
      temperature: 0
    });
  }
  function ci(t) {
    return !["unavailable"].includes(t.state);
  }
  function hi(t, e, i, r) {
    const n = We(t, ai(e, i, "image", r));
    return n ? function (t) {
      const e = t.attributes.access_token;
      return `${window.location.origin}/api/image_proxy/${t.entity_id}?token=${e}`;
    }(n) : void 0;
  }
  function di(t, e, i, r, n = "unavailable", s = {}) {
    return We(t, ai(e, i, "sensor", r)) || Ke({
      state: String(n),
      attributes: s
    });
  }
  function pi(t, e, i, r) {
    const n = ai(e, i, "sensor", r);
    return n ? function (t, e) {
      const i = We(t, e),
        r = i ? parseFloat(i.state) : 0;
      return isNaN(r) ? 0 : r;
    }(t, n) : void 0;
  }
  function ui(t, e, i, r, n, s, a = void 0) {
    const o = ai(e, i, "binary_sensor", r);
    return o ? Qe(t, o, n, s) : a;
  }
  function gi(t, e, i, r) {
    const n = ai(e, i, "update", r);
    return n ? Qe(t, n, "Update Available", "Up To Date") : void 0;
  }
  function mi(t, e, i) {
    return "Filament" === di(t, e, i, "current_status").attributes.material_type;
  }
  function bi(t) {
    const e = t.path.split("/");
    return e.length > 1 ? e[1] : void 0;
  }
  function vi(t) {
    const e = t.path.split("/");
    return e.length > 2 ? e[2] : "main";
  }
  function yi(t) {
    return ["printing", "preheating", "paused", "downloading", "checking"].includes(t);
  }
  function fi(t) {
    return e = 1e3 * t, He({
      start: new Date(0),
      end: new Date(e)
    });
    var e;
  }
  const _i = (t, e) => {
      if (0 !== t && (!t || isNaN(t))) return Ye;
      const i = fi(e ? 60 * Math.ceil(Number(t) / 60) : Number(t)),
        r = [];
      return i.days && r.push(`${i.days}d`), i.hours && r.length < 2 && r.push(`${i.hours}h`), i.minutes && r.length < 2 && !i.days && r.push(`${i.minutes}m`), i.seconds && r.length < 2 && !i.days && !i.hours && !e && r.push(`${i.seconds}s`), r.length ? r.join(" ") : e ? "0m" : "0s";
    },
    wi = (t, e, i = !1, r = !1) => {
      switch (e) {
        case Be.Remaining:
          return _i(t, i);
        case Be.ETA:
          return ((t, e, i) => {
            if (0 !== t && (!t || isNaN(t))) return Ye;
            const r = e ? "" : ":ss",
              n = i ? `HH:mm${r}` : `h:mm${r} a`,
              s = new Date();
            return s.setSeconds(s.getSeconds() + Number(t)), ke(s, n);
          })(t, i, r);
        case Be.Elapsed:
          return _i(t, i);
        default:
          return Ye;
      }
    };
  const xi = {
      [Ie.C]: {
        [Ie.C]: t => t,
        [Ie.F]: t => 9 * t / 5 + 32
      },
      [Ie.F]: {
        [Ie.C]: t => 5 * (t - 32) / 9,
        [Ie.F]: t => t
      }
    },
    $i = (t, e, i = !1) => {
      const r = parseFloat(t.state);
      if (isNaN(r)) return Ye;
      const n = (t => {
          switch (t.attributes.unit_of_measurement) {
            case "°C":
            default:
              return Ie.C;
            case "°F":
              return Ie.F;
          }
        })(t),
        s = (a = r, l = e || n, xi[o = n] && xi[o][l] ? xi[o][l](a) : -1);
      var a, o, l;
      return `${i ? Math.round(s) : s.toFixed(2)}°${e || n}`;
    };
  function Ei() {
    return [Ue.Status, Ue.ETA, Ue.Elapsed, Ue.Remaining];
  }
  function Si() {
    return [...Ei(), Ue.HotendCurrent, Ue.BedCurrent, Ue.HotendTarget, Ue.BedTarget, Ue.PrinterOnline, Ue.Availability, Ue.ProjectName, Ue.CurrentLayer];
  }
  function Pi(t) {
    var e;
    return (null !== (e = t.attributes.available_modes) && void 0 !== e ? e : []).reduce((t, e) => Object.assign(Object.assign({}, t), {
      [e.mode]: e.description
    }), {});
  }
  function Ci(t) {
    return t && Object.values(Ge).includes(t) ? Ge[t.toUpperCase()] : void 0;
  }
  let Ai = class extends mt {
    willUpdate(t) {
      super.willUpdate(t), t.has("selectedPrinterID") && (this.printerEntities = ii(this.hass, this.selectedPrinterID));
    }
    render() {
      return W`
      <debug-data elevation="2">
        <p>There are ${Object.keys(this.hass.states).length} entities.</p>
        <p>The screen is${this.narrow ? "" : " not"} narrow.</p>
        Configured panel config
        <pre>${JSON.stringify(this.panel, void 0, 2)}</pre>
        Current route
        <pre>${JSON.stringify(this.route, void 0, 2)}</pre>
        Printers
        <pre>${JSON.stringify(this.printers, void 0, 2)}</pre>
        Printer Entities
        <pre>${JSON.stringify(this.printerEntities, void 0, 2)}</pre>
        Selected Printer
        <pre>${JSON.stringify(this.selectedPrinterDevice, void 0, 2)}</pre>
      </debug-data>
    `;
    }
    static get styles() {
      return p`
      :host {
        padding: 16px;
        display: block;
      }
      debug-data {
        padding: 16px;
        display: block;
        font-size: 18px;
        max-width: 600px;
        margin: 0 auto;
      }
    `;
    }
  };
  n([_t()], Ai.prototype, "hass", void 0), n([_t()], Ai.prototype, "language", void 0), n([_t({
    type: Boolean,
    reflect: !0
  })], Ai.prototype, "narrow", void 0), n([_t()], Ai.prototype, "route", void 0), n([_t()], Ai.prototype, "panel", void 0), n([_t()], Ai.prototype, "printers", void 0), n([_t({
    attribute: "selected-printer-id"
  })], Ai.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], Ai.prototype, "selectedPrinterDevice", void 0), n([wt()], Ai.prototype, "printerEntities", void 0), Ai = n([vt("anycubic-view-debug")], Ai);
  var Ti,
    ki,
    Mi,
    Hi = "Anycubic Cloud",
    Di = {
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
    Fi = {
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
    Bi = {
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
    Ii = {
      title: Hi,
      common: Di,
      card: Fi,
      panels: Bi
    },
    Li = Object.freeze({
      __proto__: null,
      title: Hi,
      common: Di,
      card: Fi,
      panels: Bi,
      default: Ii
    }),
    Ni = "Anycubic Cloud",
    Oi = {
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
    zi = {
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
    Ui = {
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
    Ri = {
      title: Ni,
      common: Oi,
      card: zi,
      panels: Ui
    },
    ji = Object.freeze({
      __proto__: null,
      title: Ni,
      common: Oi,
      card: zi,
      panels: Ui,
      default: Ri
    }),
    Vi = "Anycubic Cloud",
    Gi = {
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
    Zi = {
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
    Yi = {
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
    Ki = {
      title: Vi,
      common: Gi,
      card: Zi,
      panels: Yi
    },
    qi = Object.freeze({
      __proto__: null,
      title: Vi,
      common: Gi,
      card: Zi,
      panels: Yi,
      default: Ki
    }),
    Wi = "Anycubic Cloud",
    Xi = {
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
    Qi = {
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
    Ji = {
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
    tr = {
      title: Wi,
      common: Xi,
      card: Qi,
      panels: Ji
    },
    er = Object.freeze({
      __proto__: null,
      title: Wi,
      common: Xi,
      card: Qi,
      panels: Ji,
      default: tr
    }),
    ir = "Anycubic Cloud",
    rr = {
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
    nr = {
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
    sr = {
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
    ar = {
      title: ir,
      common: rr,
      card: nr,
      panels: sr
    },
    or = Object.freeze({
      __proto__: null,
      title: ir,
      common: rr,
      card: nr,
      panels: sr,
      default: ar
    });
  function lr(t) {
    return t.type === ki.literal;
  }
  function cr(t) {
    return t.type === ki.argument;
  }
  function hr(t) {
    return t.type === ki.number;
  }
  function dr(t) {
    return t.type === ki.date;
  }
  function pr(t) {
    return t.type === ki.time;
  }
  function ur(t) {
    return t.type === ki.select;
  }
  function gr(t) {
    return t.type === ki.plural;
  }
  function mr(t) {
    return t.type === ki.pound;
  }
  function br(t) {
    return t.type === ki.tag;
  }
  function vr(t) {
    return !(!t || "object" != typeof t || t.type !== Mi.number);
  }
  function yr(t) {
    return !(!t || "object" != typeof t || t.type !== Mi.dateTime);
  }
  !function (t) {
    t[t.EXPECT_ARGUMENT_CLOSING_BRACE = 1] = "EXPECT_ARGUMENT_CLOSING_BRACE", t[t.EMPTY_ARGUMENT = 2] = "EMPTY_ARGUMENT", t[t.MALFORMED_ARGUMENT = 3] = "MALFORMED_ARGUMENT", t[t.EXPECT_ARGUMENT_TYPE = 4] = "EXPECT_ARGUMENT_TYPE", t[t.INVALID_ARGUMENT_TYPE = 5] = "INVALID_ARGUMENT_TYPE", t[t.EXPECT_ARGUMENT_STYLE = 6] = "EXPECT_ARGUMENT_STYLE", t[t.INVALID_NUMBER_SKELETON = 7] = "INVALID_NUMBER_SKELETON", t[t.INVALID_DATE_TIME_SKELETON = 8] = "INVALID_DATE_TIME_SKELETON", t[t.EXPECT_NUMBER_SKELETON = 9] = "EXPECT_NUMBER_SKELETON", t[t.EXPECT_DATE_TIME_SKELETON = 10] = "EXPECT_DATE_TIME_SKELETON", t[t.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE = 11] = "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE", t[t.EXPECT_SELECT_ARGUMENT_OPTIONS = 12] = "EXPECT_SELECT_ARGUMENT_OPTIONS", t[t.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE = 13] = "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE", t[t.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE = 14] = "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE", t[t.EXPECT_SELECT_ARGUMENT_SELECTOR = 15] = "EXPECT_SELECT_ARGUMENT_SELECTOR", t[t.EXPECT_PLURAL_ARGUMENT_SELECTOR = 16] = "EXPECT_PLURAL_ARGUMENT_SELECTOR", t[t.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT = 17] = "EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT", t[t.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT = 18] = "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT", t[t.INVALID_PLURAL_ARGUMENT_SELECTOR = 19] = "INVALID_PLURAL_ARGUMENT_SELECTOR", t[t.DUPLICATE_PLURAL_ARGUMENT_SELECTOR = 20] = "DUPLICATE_PLURAL_ARGUMENT_SELECTOR", t[t.DUPLICATE_SELECT_ARGUMENT_SELECTOR = 21] = "DUPLICATE_SELECT_ARGUMENT_SELECTOR", t[t.MISSING_OTHER_CLAUSE = 22] = "MISSING_OTHER_CLAUSE", t[t.INVALID_TAG = 23] = "INVALID_TAG", t[t.INVALID_TAG_NAME = 25] = "INVALID_TAG_NAME", t[t.UNMATCHED_CLOSING_TAG = 26] = "UNMATCHED_CLOSING_TAG", t[t.UNCLOSED_TAG = 27] = "UNCLOSED_TAG";
  }(Ti || (Ti = {})), function (t) {
    t[t.literal = 0] = "literal", t[t.argument = 1] = "argument", t[t.number = 2] = "number", t[t.date = 3] = "date", t[t.time = 4] = "time", t[t.select = 5] = "select", t[t.plural = 6] = "plural", t[t.pound = 7] = "pound", t[t.tag = 8] = "tag";
  }(ki || (ki = {})), function (t) {
    t[t.number = 0] = "number", t[t.dateTime = 1] = "dateTime";
  }(Mi || (Mi = {}));
  var fr = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
    _r = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
  function wr(t) {
    var e = {};
    return t.replace(_r, function (t) {
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
  var xr = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;
  var $r = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,
    Er = /^(@+)?(\+|#+)?[rs]?$/g,
    Sr = /(\*)(0+)|(#+)(0+)|(0+)/g,
    Pr = /^(0+)$/;
  function Cr(t) {
    var e = {};
    return "r" === t[t.length - 1] ? e.roundingPriority = "morePrecision" : "s" === t[t.length - 1] && (e.roundingPriority = "lessPrecision"), t.replace(Er, function (t, i, r) {
      return "string" != typeof r ? (e.minimumSignificantDigits = i.length, e.maximumSignificantDigits = i.length) : "+" === r ? e.minimumSignificantDigits = i.length : "#" === i[0] ? e.maximumSignificantDigits = i.length : (e.minimumSignificantDigits = i.length, e.maximumSignificantDigits = i.length + ("string" == typeof r ? r.length : 0)), "";
    }), e;
  }
  function Ar(t) {
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
  function Tr(t) {
    var e;
    if ("E" === t[0] && "E" === t[1] ? (e = {
      notation: "engineering"
    }, t = t.slice(2)) : "E" === t[0] && (e = {
      notation: "scientific"
    }, t = t.slice(1)), e) {
      var i = t.slice(0, 2);
      if ("+!" === i ? (e.signDisplay = "always", t = t.slice(2)) : "+?" === i && (e.signDisplay = "exceptZero", t = t.slice(2)), !Pr.test(t)) throw new Error("Malformed concise eng/scientific notation");
      e.minimumIntegerDigits = t.length;
    }
    return e;
  }
  function kr(t) {
    var e = Ar(t);
    return e || {};
  }
  function Mr(t) {
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
            return r(r({}, t), kr(e));
          }, {}));
          continue;
        case "engineering":
          e = r(r(r({}, e), {
            notation: "engineering"
          }), s.options.reduce(function (t, e) {
            return r(r({}, t), kr(e));
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
          s.options[0].replace(Sr, function (t, i, r, n, s, a) {
            if (i) e.minimumIntegerDigits = r.length;else {
              if (n && s) throw new Error("We currently do not support maximum integer digits");
              if (a) throw new Error("We currently do not support exact integer digits");
            }
            return "";
          });
          continue;
      }
      if (Pr.test(s.stem)) e.minimumIntegerDigits = s.stem.length;else if ($r.test(s.stem)) {
        if (s.options.length > 1) throw new RangeError("Fraction-precision stems only accept a single optional option");
        s.stem.replace($r, function (t, i, r, n, s, a) {
          return "*" === r ? e.minimumFractionDigits = i.length : n && "#" === n[0] ? e.maximumFractionDigits = n.length : s && a ? (e.minimumFractionDigits = s.length, e.maximumFractionDigits = s.length + a.length) : (e.minimumFractionDigits = i.length, e.maximumFractionDigits = i.length), "";
        });
        var a = s.options[0];
        "w" === a ? e = r(r({}, e), {
          trailingZeroDisplay: "stripIfInteger"
        }) : a && (e = r(r({}, e), Cr(a)));
      } else if (Er.test(s.stem)) e = r(r({}, e), Cr(s.stem));else {
        var o = Ar(s.stem);
        o && (e = r(r({}, e), o));
        var l = Tr(s.stem);
        l && (e = r(r({}, e), l));
      }
    }
    return e;
  }
  var Hr,
    Dr = {
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
  function Fr(t) {
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
    return "root" !== r && (i = t.maximize().region), (Dr[i || ""] || Dr[r || ""] || Dr["".concat(r, "-001")] || Dr["001"])[0];
  }
  var Br = new RegExp("^".concat(fr.source, "*")),
    Ir = new RegExp("".concat(fr.source, "*$"));
  function Lr(t, e) {
    return {
      start: t,
      end: e
    };
  }
  var Nr = !!String.prototype.startsWith && "_a".startsWith("a", 1),
    Or = !!String.fromCodePoint,
    zr = !!Object.fromEntries,
    Ur = !!String.prototype.codePointAt,
    Rr = !!String.prototype.trimStart,
    jr = !!String.prototype.trimEnd,
    Vr = !!Number.isSafeInteger ? Number.isSafeInteger : function (t) {
      return "number" == typeof t && isFinite(t) && Math.floor(t) === t && Math.abs(t) <= 9007199254740991;
    },
    Gr = !0;
  try {
    Gr = "a" === (null === (Hr = Jr("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu").exec("a")) || void 0 === Hr ? void 0 : Hr[0]);
  } catch (V) {
    Gr = !1;
  }
  var Zr,
    Yr = Nr ? function (t, e, i) {
      return t.startsWith(e, i);
    } : function (t, e, i) {
      return t.slice(i, i + e.length) === e;
    },
    Kr = Or ? String.fromCodePoint : function () {
      for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
      for (var i, r = "", n = t.length, s = 0; n > s;) {
        if ((i = t[s++]) > 1114111) throw RangeError(i + " is not a valid code point");
        r += i < 65536 ? String.fromCharCode(i) : String.fromCharCode(55296 + ((i -= 65536) >> 10), i % 1024 + 56320);
      }
      return r;
    },
    qr = zr ? Object.fromEntries : function (t) {
      for (var e = {}, i = 0, r = t; i < r.length; i++) {
        var n = r[i],
          s = n[0],
          a = n[1];
        e[s] = a;
      }
      return e;
    },
    Wr = Ur ? function (t, e) {
      return t.codePointAt(e);
    } : function (t, e) {
      var i = t.length;
      if (!(e < 0 || e >= i)) {
        var r,
          n = t.charCodeAt(e);
        return n < 55296 || n > 56319 || e + 1 === i || (r = t.charCodeAt(e + 1)) < 56320 || r > 57343 ? n : r - 56320 + (n - 55296 << 10) + 65536;
      }
    },
    Xr = Rr ? function (t) {
      return t.trimStart();
    } : function (t) {
      return t.replace(Br, "");
    },
    Qr = jr ? function (t) {
      return t.trimEnd();
    } : function (t) {
      return t.replace(Ir, "");
    };
  function Jr(t, e) {
    return new RegExp(t, e);
  }
  if (Gr) {
    var tn = Jr("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu");
    Zr = function (t, e) {
      var i;
      return tn.lastIndex = e, null !== (i = tn.exec(t)[1]) && void 0 !== i ? i : "";
    };
  } else Zr = function (t, e) {
    for (var i = [];;) {
      var r = Wr(t, e);
      if (void 0 === r || sn(r) || an(r)) break;
      i.push(r), e += r >= 65536 ? 2 : 1;
    }
    return Kr.apply(void 0, i);
  };
  var en = function () {
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
              return this.error(Ti.UNMATCHED_CLOSING_TAG, Lr(this.clonePosition(), this.clonePosition()));
            }
            if (60 === n && !this.ignoreTag && rn(this.peek() || 0)) {
              if ((s = this.parseTag(t, e)).err) return s;
              r.push(s.val);
            } else {
              var s;
              if ((s = this.parseLiteral(t, e)).err) return s;
              r.push(s.val);
            }
          } else {
            var a = this.clonePosition();
            this.bump(), r.push({
              type: ki.pound,
              location: Lr(a, this.clonePosition())
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
          type: ki.literal,
          value: "<".concat(r, "/>"),
          location: Lr(i, this.clonePosition())
        },
        err: null
      };
      if (this.bumpIf(">")) {
        var n = this.parseMessage(t + 1, e, !0);
        if (n.err) return n;
        var s = n.val,
          a = this.clonePosition();
        if (this.bumpIf("</")) {
          if (this.isEOF() || !rn(this.char())) return this.error(Ti.INVALID_TAG, Lr(a, this.clonePosition()));
          var o = this.clonePosition();
          return r !== this.parseTagName() ? this.error(Ti.UNMATCHED_CLOSING_TAG, Lr(o, this.clonePosition())) : (this.bumpSpace(), this.bumpIf(">") ? {
            val: {
              type: ki.tag,
              value: r,
              children: s,
              location: Lr(i, this.clonePosition())
            },
            err: null
          } : this.error(Ti.INVALID_TAG, Lr(a, this.clonePosition())));
        }
        return this.error(Ti.UNCLOSED_TAG, Lr(i, this.clonePosition()));
      }
      return this.error(Ti.INVALID_TAG, Lr(i, this.clonePosition()));
    }, t.prototype.parseTagName = function () {
      var t = this.offset();
      for (this.bump(); !this.isEOF() && nn(this.char());) this.bump();
      return this.message.slice(t, this.offset());
    }, t.prototype.parseLiteral = function (t, e) {
      for (var i = this.clonePosition(), r = "";;) {
        var n = this.tryParseQuote(e);
        if (n) r += n;else {
          var s = this.tryParseUnquoted(t, e);
          if (s) r += s;else {
            var a = this.tryParseLeftAngleBracket();
            if (!a) break;
            r += a;
          }
        }
      }
      var o = Lr(i, this.clonePosition());
      return {
        val: {
          type: ki.literal,
          value: r,
          location: o
        },
        err: null
      };
    }, t.prototype.tryParseLeftAngleBracket = function () {
      return this.isEOF() || 60 !== this.char() || !this.ignoreTag && (rn(t = this.peek() || 0) || 47 === t) ? null : (this.bump(), "<");
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
      return Kr.apply(void 0, e);
    }, t.prototype.tryParseUnquoted = function (t, e) {
      if (this.isEOF()) return null;
      var i = this.char();
      return 60 === i || 123 === i || 35 === i && ("plural" === e || "selectordinal" === e) || 125 === i && t > 0 ? null : (this.bump(), Kr(i));
    }, t.prototype.parseArgument = function (t, e) {
      var i = this.clonePosition();
      if (this.bump(), this.bumpSpace(), this.isEOF()) return this.error(Ti.EXPECT_ARGUMENT_CLOSING_BRACE, Lr(i, this.clonePosition()));
      if (125 === this.char()) return this.bump(), this.error(Ti.EMPTY_ARGUMENT, Lr(i, this.clonePosition()));
      var r = this.parseIdentifierIfPossible().value;
      if (!r) return this.error(Ti.MALFORMED_ARGUMENT, Lr(i, this.clonePosition()));
      if (this.bumpSpace(), this.isEOF()) return this.error(Ti.EXPECT_ARGUMENT_CLOSING_BRACE, Lr(i, this.clonePosition()));
      switch (this.char()) {
        case 125:
          return this.bump(), {
            val: {
              type: ki.argument,
              value: r,
              location: Lr(i, this.clonePosition())
            },
            err: null
          };
        case 44:
          return this.bump(), this.bumpSpace(), this.isEOF() ? this.error(Ti.EXPECT_ARGUMENT_CLOSING_BRACE, Lr(i, this.clonePosition())) : this.parseArgumentOptions(t, e, r, i);
        default:
          return this.error(Ti.MALFORMED_ARGUMENT, Lr(i, this.clonePosition()));
      }
    }, t.prototype.parseIdentifierIfPossible = function () {
      var t = this.clonePosition(),
        e = this.offset(),
        i = Zr(this.message, e),
        r = e + i.length;
      return this.bumpTo(r), {
        value: i,
        location: Lr(t, this.clonePosition())
      };
    }, t.prototype.parseArgumentOptions = function (t, e, i, n) {
      var s,
        a = this.clonePosition(),
        o = this.parseIdentifierIfPossible().value,
        l = this.clonePosition();
      switch (o) {
        case "":
          return this.error(Ti.EXPECT_ARGUMENT_TYPE, Lr(a, l));
        case "number":
        case "date":
        case "time":
          this.bumpSpace();
          var c = null;
          if (this.bumpIf(",")) {
            this.bumpSpace();
            var h = this.clonePosition();
            if ((y = this.parseSimpleArgStyleIfPossible()).err) return y;
            if (0 === (g = Qr(y.val)).length) return this.error(Ti.EXPECT_ARGUMENT_STYLE, Lr(this.clonePosition(), this.clonePosition()));
            c = {
              style: g,
              styleLocation: Lr(h, this.clonePosition())
            };
          }
          if ((f = this.tryParseArgumentClose(n)).err) return f;
          var d = Lr(n, this.clonePosition());
          if (c && Yr(null == c ? void 0 : c.style, "::", 0)) {
            var p = Xr(c.style.slice(2));
            if ("number" === o) return (y = this.parseNumberSkeletonFromString(p, c.styleLocation)).err ? y : {
              val: {
                type: ki.number,
                value: i,
                location: d,
                style: y.val
              },
              err: null
            };
            if (0 === p.length) return this.error(Ti.EXPECT_DATE_TIME_SKELETON, d);
            var u = p;
            this.locale && (u = function (t, e) {
              for (var i = "", r = 0; r < t.length; r++) {
                var n = t.charAt(r);
                if ("j" === n) {
                  for (var s = 0; r + 1 < t.length && t.charAt(r + 1) === n;) s++, r++;
                  var a = 1 + (1 & s),
                    o = s < 2 ? 1 : 3 + (s >> 1),
                    l = Fr(e);
                  for ("H" != l && "k" != l || (o = 0); o-- > 0;) i += "a";
                  for (; a-- > 0;) i = l + i;
                } else i += "J" === n ? "H" : n;
              }
              return i;
            }(p, this.locale));
            var g = {
              type: Mi.dateTime,
              pattern: u,
              location: c.styleLocation,
              parsedOptions: this.shouldParseSkeletons ? wr(u) : {}
            };
            return {
              val: {
                type: "date" === o ? ki.date : ki.time,
                value: i,
                location: d,
                style: g
              },
              err: null
            };
          }
          return {
            val: {
              type: "number" === o ? ki.number : "date" === o ? ki.date : ki.time,
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
          if (this.bumpSpace(), !this.bumpIf(",")) return this.error(Ti.EXPECT_SELECT_ARGUMENT_OPTIONS, Lr(m, r({}, m)));
          this.bumpSpace();
          var b = this.parseIdentifierIfPossible(),
            v = 0;
          if ("select" !== o && "offset" === b.value) {
            if (!this.bumpIf(":")) return this.error(Ti.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, Lr(this.clonePosition(), this.clonePosition()));
            var y;
            if (this.bumpSpace(), (y = this.tryParseDecimalInteger(Ti.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, Ti.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE)).err) return y;
            this.bumpSpace(), b = this.parseIdentifierIfPossible(), v = y.val;
          }
          var f,
            _ = this.tryParsePluralOrSelectOptions(t, o, e, b);
          if (_.err) return _;
          if ((f = this.tryParseArgumentClose(n)).err) return f;
          var w = Lr(n, this.clonePosition());
          return "select" === o ? {
            val: {
              type: ki.select,
              value: i,
              options: qr(_.val),
              location: w
            },
            err: null
          } : {
            val: {
              type: ki.plural,
              value: i,
              options: qr(_.val),
              offset: v,
              pluralType: "plural" === o ? "cardinal" : "ordinal",
              location: w
            },
            err: null
          };
        default:
          return this.error(Ti.INVALID_ARGUMENT_TYPE, Lr(a, l));
      }
    }, t.prototype.tryParseArgumentClose = function (t) {
      return this.isEOF() || 125 !== this.char() ? this.error(Ti.EXPECT_ARGUMENT_CLOSING_BRACE, Lr(t, this.clonePosition())) : (this.bump(), {
        val: !0,
        err: null
      });
    }, t.prototype.parseSimpleArgStyleIfPossible = function () {
      for (var t = 0, e = this.clonePosition(); !this.isEOF();) {
        switch (this.char()) {
          case 39:
            this.bump();
            var i = this.clonePosition();
            if (!this.bumpUntil("'")) return this.error(Ti.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE, Lr(i, this.clonePosition()));
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
          for (var e = t.split(xr).filter(function (t) {
              return t.length > 0;
            }), i = [], r = 0, n = e; r < n.length; r++) {
            var s = n[r].split("/");
            if (0 === s.length) throw new Error("Invalid number skeleton");
            for (var a = s[0], o = s.slice(1), l = 0, c = o; l < c.length; l++) if (0 === c[l].length) throw new Error("Invalid number skeleton");
            i.push({
              stem: a,
              options: o
            });
          }
          return i;
        }(t);
      } catch (t) {
        return this.error(Ti.INVALID_NUMBER_SKELETON, e);
      }
      return {
        val: {
          type: Mi.number,
          tokens: i,
          location: e,
          parsedOptions: this.shouldParseSkeletons ? Mr(i) : {}
        },
        err: null
      };
    }, t.prototype.tryParsePluralOrSelectOptions = function (t, e, i, r) {
      for (var n, s = !1, a = [], o = new Set(), l = r.value, c = r.location;;) {
        if (0 === l.length) {
          var h = this.clonePosition();
          if ("select" === e || !this.bumpIf("=")) break;
          var d = this.tryParseDecimalInteger(Ti.EXPECT_PLURAL_ARGUMENT_SELECTOR, Ti.INVALID_PLURAL_ARGUMENT_SELECTOR);
          if (d.err) return d;
          c = Lr(h, this.clonePosition()), l = this.message.slice(h.offset, this.offset());
        }
        if (o.has(l)) return this.error("select" === e ? Ti.DUPLICATE_SELECT_ARGUMENT_SELECTOR : Ti.DUPLICATE_PLURAL_ARGUMENT_SELECTOR, c);
        "other" === l && (s = !0), this.bumpSpace();
        var p = this.clonePosition();
        if (!this.bumpIf("{")) return this.error("select" === e ? Ti.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT : Ti.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT, Lr(this.clonePosition(), this.clonePosition()));
        var u = this.parseMessage(t + 1, e, i);
        if (u.err) return u;
        var g = this.tryParseArgumentClose(p);
        if (g.err) return g;
        a.push([l, {
          value: u.val,
          location: Lr(p, this.clonePosition())
        }]), o.add(l), this.bumpSpace(), l = (n = this.parseIdentifierIfPossible()).value, c = n.location;
      }
      return 0 === a.length ? this.error("select" === e ? Ti.EXPECT_SELECT_ARGUMENT_SELECTOR : Ti.EXPECT_PLURAL_ARGUMENT_SELECTOR, Lr(this.clonePosition(), this.clonePosition())) : this.requiresOtherClause && !s ? this.error(Ti.MISSING_OTHER_CLAUSE, Lr(this.clonePosition(), this.clonePosition())) : {
        val: a,
        err: null
      };
    }, t.prototype.tryParseDecimalInteger = function (t, e) {
      var i = 1,
        r = this.clonePosition();
      this.bumpIf("+") || this.bumpIf("-") && (i = -1);
      for (var n = !1, s = 0; !this.isEOF();) {
        var a = this.char();
        if (!(a >= 48 && a <= 57)) break;
        n = !0, s = 10 * s + (a - 48), this.bump();
      }
      var o = Lr(r, this.clonePosition());
      return n ? Vr(s *= i) ? {
        val: s,
        err: null
      } : this.error(e, o) : this.error(t, o);
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
      var e = Wr(this.message, t);
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
      if (Yr(this.message, t, this.offset())) {
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
      for (; !this.isEOF() && sn(this.char());) this.bump();
    }, t.prototype.peek = function () {
      if (this.isEOF()) return null;
      var t = this.char(),
        e = this.offset(),
        i = this.message.charCodeAt(e + (t >= 65536 ? 2 : 1));
      return null != i ? i : null;
    }, t;
  }();
  function rn(t) {
    return t >= 97 && t <= 122 || t >= 65 && t <= 90;
  }
  function nn(t) {
    return 45 === t || 46 === t || t >= 48 && t <= 57 || 95 === t || t >= 97 && t <= 122 || t >= 65 && t <= 90 || 183 == t || t >= 192 && t <= 214 || t >= 216 && t <= 246 || t >= 248 && t <= 893 || t >= 895 && t <= 8191 || t >= 8204 && t <= 8205 || t >= 8255 && t <= 8256 || t >= 8304 && t <= 8591 || t >= 11264 && t <= 12271 || t >= 12289 && t <= 55295 || t >= 63744 && t <= 64975 || t >= 65008 && t <= 65533 || t >= 65536 && t <= 983039;
  }
  function sn(t) {
    return t >= 9 && t <= 13 || 32 === t || 133 === t || t >= 8206 && t <= 8207 || 8232 === t || 8233 === t;
  }
  function an(t) {
    return t >= 33 && t <= 35 || 36 === t || t >= 37 && t <= 39 || 40 === t || 41 === t || 42 === t || 43 === t || 44 === t || 45 === t || t >= 46 && t <= 47 || t >= 58 && t <= 59 || t >= 60 && t <= 62 || t >= 63 && t <= 64 || 91 === t || 92 === t || 93 === t || 94 === t || 96 === t || 123 === t || 124 === t || 125 === t || 126 === t || 161 === t || t >= 162 && t <= 165 || 166 === t || 167 === t || 169 === t || 171 === t || 172 === t || 174 === t || 176 === t || 177 === t || 182 === t || 187 === t || 191 === t || 215 === t || 247 === t || t >= 8208 && t <= 8213 || t >= 8214 && t <= 8215 || 8216 === t || 8217 === t || 8218 === t || t >= 8219 && t <= 8220 || 8221 === t || 8222 === t || 8223 === t || t >= 8224 && t <= 8231 || t >= 8240 && t <= 8248 || 8249 === t || 8250 === t || t >= 8251 && t <= 8254 || t >= 8257 && t <= 8259 || 8260 === t || 8261 === t || 8262 === t || t >= 8263 && t <= 8273 || 8274 === t || 8275 === t || t >= 8277 && t <= 8286 || t >= 8592 && t <= 8596 || t >= 8597 && t <= 8601 || t >= 8602 && t <= 8603 || t >= 8604 && t <= 8607 || 8608 === t || t >= 8609 && t <= 8610 || 8611 === t || t >= 8612 && t <= 8613 || 8614 === t || t >= 8615 && t <= 8621 || 8622 === t || t >= 8623 && t <= 8653 || t >= 8654 && t <= 8655 || t >= 8656 && t <= 8657 || 8658 === t || 8659 === t || 8660 === t || t >= 8661 && t <= 8691 || t >= 8692 && t <= 8959 || t >= 8960 && t <= 8967 || 8968 === t || 8969 === t || 8970 === t || 8971 === t || t >= 8972 && t <= 8991 || t >= 8992 && t <= 8993 || t >= 8994 && t <= 9e3 || 9001 === t || 9002 === t || t >= 9003 && t <= 9083 || 9084 === t || t >= 9085 && t <= 9114 || t >= 9115 && t <= 9139 || t >= 9140 && t <= 9179 || t >= 9180 && t <= 9185 || t >= 9186 && t <= 9254 || t >= 9255 && t <= 9279 || t >= 9280 && t <= 9290 || t >= 9291 && t <= 9311 || t >= 9472 && t <= 9654 || 9655 === t || t >= 9656 && t <= 9664 || 9665 === t || t >= 9666 && t <= 9719 || t >= 9720 && t <= 9727 || t >= 9728 && t <= 9838 || 9839 === t || t >= 9840 && t <= 10087 || 10088 === t || 10089 === t || 10090 === t || 10091 === t || 10092 === t || 10093 === t || 10094 === t || 10095 === t || 10096 === t || 10097 === t || 10098 === t || 10099 === t || 10100 === t || 10101 === t || t >= 10132 && t <= 10175 || t >= 10176 && t <= 10180 || 10181 === t || 10182 === t || t >= 10183 && t <= 10213 || 10214 === t || 10215 === t || 10216 === t || 10217 === t || 10218 === t || 10219 === t || 10220 === t || 10221 === t || 10222 === t || 10223 === t || t >= 10224 && t <= 10239 || t >= 10240 && t <= 10495 || t >= 10496 && t <= 10626 || 10627 === t || 10628 === t || 10629 === t || 10630 === t || 10631 === t || 10632 === t || 10633 === t || 10634 === t || 10635 === t || 10636 === t || 10637 === t || 10638 === t || 10639 === t || 10640 === t || 10641 === t || 10642 === t || 10643 === t || 10644 === t || 10645 === t || 10646 === t || 10647 === t || 10648 === t || t >= 10649 && t <= 10711 || 10712 === t || 10713 === t || 10714 === t || 10715 === t || t >= 10716 && t <= 10747 || 10748 === t || 10749 === t || t >= 10750 && t <= 11007 || t >= 11008 && t <= 11055 || t >= 11056 && t <= 11076 || t >= 11077 && t <= 11078 || t >= 11079 && t <= 11084 || t >= 11085 && t <= 11123 || t >= 11124 && t <= 11125 || t >= 11126 && t <= 11157 || 11158 === t || t >= 11159 && t <= 11263 || t >= 11776 && t <= 11777 || 11778 === t || 11779 === t || 11780 === t || 11781 === t || t >= 11782 && t <= 11784 || 11785 === t || 11786 === t || 11787 === t || 11788 === t || 11789 === t || t >= 11790 && t <= 11798 || 11799 === t || t >= 11800 && t <= 11801 || 11802 === t || 11803 === t || 11804 === t || 11805 === t || t >= 11806 && t <= 11807 || 11808 === t || 11809 === t || 11810 === t || 11811 === t || 11812 === t || 11813 === t || 11814 === t || 11815 === t || 11816 === t || 11817 === t || t >= 11818 && t <= 11822 || 11823 === t || t >= 11824 && t <= 11833 || t >= 11834 && t <= 11835 || t >= 11836 && t <= 11839 || 11840 === t || 11841 === t || 11842 === t || t >= 11843 && t <= 11855 || t >= 11856 && t <= 11857 || 11858 === t || t >= 11859 && t <= 11903 || t >= 12289 && t <= 12291 || 12296 === t || 12297 === t || 12298 === t || 12299 === t || 12300 === t || 12301 === t || 12302 === t || 12303 === t || 12304 === t || 12305 === t || t >= 12306 && t <= 12307 || 12308 === t || 12309 === t || 12310 === t || 12311 === t || 12312 === t || 12313 === t || 12314 === t || 12315 === t || 12316 === t || 12317 === t || t >= 12318 && t <= 12319 || 12320 === t || 12336 === t || 64830 === t || 64831 === t || t >= 65093 && t <= 65094;
  }
  function on(t) {
    t.forEach(function (t) {
      if (delete t.location, ur(t) || gr(t)) for (var e in t.options) delete t.options[e].location, on(t.options[e].value);else hr(t) && vr(t.style) || (dr(t) || pr(t)) && yr(t.style) ? delete t.style.location : br(t) && on(t.children);
    });
  }
  function ln(t, e) {
    void 0 === e && (e = {}), e = r({
      shouldParseSkeletons: !0,
      requiresOtherClause: !0
    }, e);
    var i = new en(t, e).parse();
    if (i.err) {
      var n = SyntaxError(Ti[i.err.kind]);
      throw n.location = i.err.location, n.originalMessage = i.err.message, n;
    }
    return (null == e ? void 0 : e.captureLocation) || on(i.val), i.val;
  }
  function cn(t, e) {
    var i = e && e.cache ? e.cache : vn,
      r = e && e.serializer ? e.serializer : gn;
    return (e && e.strategy ? e.strategy : un)(t, {
      cache: i,
      serializer: r
    });
  }
  function hn(t, e, i, r) {
    var n,
      s = null == (n = r) || "number" == typeof n || "boolean" == typeof n ? r : i(r),
      a = e.get(s);
    return void 0 === a && (a = t.call(this, r), e.set(s, a)), a;
  }
  function dn(t, e, i) {
    var r = Array.prototype.slice.call(arguments, 3),
      n = i(r),
      s = e.get(n);
    return void 0 === s && (s = t.apply(this, r), e.set(n, s)), s;
  }
  function pn(t, e, i, r, n) {
    return i.bind(e, t, r, n);
  }
  function un(t, e) {
    return pn(t, this, 1 === t.length ? hn : dn, e.cache.create(), e.serializer);
  }
  var gn = function () {
    return JSON.stringify(arguments);
  };
  function mn() {
    this.cache = Object.create(null);
  }
  mn.prototype.get = function (t) {
    return this.cache[t];
  }, mn.prototype.set = function (t, e) {
    this.cache[t] = e;
  };
  var bn,
    vn = {
      create: function () {
        return new mn();
      }
    },
    yn = {
      variadic: function (t, e) {
        return pn(t, this, dn, e.cache.create(), e.serializer);
      },
      monadic: function (t, e) {
        return pn(t, this, hn, e.cache.create(), e.serializer);
      }
    };
  !function (t) {
    t.MISSING_VALUE = "MISSING_VALUE", t.INVALID_VALUE = "INVALID_VALUE", t.MISSING_INTL_API = "MISSING_INTL_API";
  }(bn || (bn = {}));
  var fn,
    _n = function (t) {
      function e(e, i, r) {
        var n = t.call(this, e) || this;
        return n.code = i, n.originalMessage = r, n;
      }
      return i(e, t), e.prototype.toString = function () {
        return "[formatjs Error: ".concat(this.code, "] ").concat(this.message);
      }, e;
    }(Error),
    wn = function (t) {
      function e(e, i, r, n) {
        return t.call(this, 'Invalid values for "'.concat(e, '": "').concat(i, '". Options are "').concat(Object.keys(r).join('", "'), '"'), bn.INVALID_VALUE, n) || this;
      }
      return i(e, t), e;
    }(_n),
    xn = function (t) {
      function e(e, i, r) {
        return t.call(this, 'Value for "'.concat(e, '" must be of type ').concat(i), bn.INVALID_VALUE, r) || this;
      }
      return i(e, t), e;
    }(_n),
    $n = function (t) {
      function e(e, i) {
        return t.call(this, 'The intl string context variable "'.concat(e, '" was not provided to the string "').concat(i, '"'), bn.MISSING_VALUE, i) || this;
      }
      return i(e, t), e;
    }(_n);
  function En(t) {
    return "function" == typeof t;
  }
  function Sn(t, e, i, r, n, s, a) {
    if (1 === t.length && lr(t[0])) return [{
      type: fn.literal,
      value: t[0].value
    }];
    for (var o = [], l = 0, c = t; l < c.length; l++) {
      var h = c[l];
      if (lr(h)) o.push({
        type: fn.literal,
        value: h.value
      });else if (mr(h)) "number" == typeof s && o.push({
        type: fn.literal,
        value: i.getNumberFormat(e).format(s)
      });else {
        var d = h.value;
        if (!n || !(d in n)) throw new $n(d, a);
        var p = n[d];
        if (cr(h)) p && "string" != typeof p && "number" != typeof p || (p = "string" == typeof p || "number" == typeof p ? String(p) : ""), o.push({
          type: "string" == typeof p ? fn.literal : fn.object,
          value: p
        });else if (dr(h)) {
          var u = "string" == typeof h.style ? r.date[h.style] : yr(h.style) ? h.style.parsedOptions : void 0;
          o.push({
            type: fn.literal,
            value: i.getDateTimeFormat(e, u).format(p)
          });
        } else if (pr(h)) {
          u = "string" == typeof h.style ? r.time[h.style] : yr(h.style) ? h.style.parsedOptions : r.time.medium;
          o.push({
            type: fn.literal,
            value: i.getDateTimeFormat(e, u).format(p)
          });
        } else if (hr(h)) {
          (u = "string" == typeof h.style ? r.number[h.style] : vr(h.style) ? h.style.parsedOptions : void 0) && u.scale && (p *= u.scale || 1), o.push({
            type: fn.literal,
            value: i.getNumberFormat(e, u).format(p)
          });
        } else {
          if (br(h)) {
            var g = h.children,
              m = h.value,
              b = n[m];
            if (!En(b)) throw new xn(m, "function", a);
            var v = b(Sn(g, e, i, r, n, s).map(function (t) {
              return t.value;
            }));
            Array.isArray(v) || (v = [v]), o.push.apply(o, v.map(function (t) {
              return {
                type: "string" == typeof t ? fn.literal : fn.object,
                value: t
              };
            }));
          }
          if (ur(h)) {
            if (!(y = h.options[p] || h.options.other)) throw new wn(h.value, p, Object.keys(h.options), a);
            o.push.apply(o, Sn(y.value, e, i, r, n));
          } else if (gr(h)) {
            var y;
            if (!(y = h.options["=".concat(p)])) {
              if (!Intl.PluralRules) throw new _n('Intl.PluralRules is not available in this environment.\nTry polyfilling it using "@formatjs/intl-pluralrules"\n', bn.MISSING_INTL_API, a);
              var f = i.getPluralRules(e, {
                type: h.pluralType
              }).select(p - (h.offset || 0));
              y = h.options[f] || h.options.other;
            }
            if (!y) throw new wn(h.value, p, Object.keys(h.options), a);
            o.push.apply(o, Sn(y.value, e, i, r, n, p - (h.offset || 0)));
          } else ;
        }
      }
    }
    return function (t) {
      return t.length < 2 ? t : t.reduce(function (t, e) {
        var i = t[t.length - 1];
        return i && i.type === fn.literal && e.type === fn.literal ? i.value += e.value : t.push(e), t;
      }, []);
    }(o);
  }
  function Pn(t, e) {
    return e ? Object.keys(t).reduce(function (i, n) {
      var s, a;
      return i[n] = (s = t[n], (a = e[n]) ? r(r(r({}, s || {}), a || {}), Object.keys(s).reduce(function (t, e) {
        return t[e] = r(r({}, s[e]), a[e] || {}), t;
      }, {})) : s), i;
    }, r({}, t)) : t;
  }
  function Cn(t) {
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
  }(fn || (fn = {}));
  var An = function () {
      function t(e, i, n, a) {
        var o,
          l = this;
        if (void 0 === i && (i = t.defaultLocale), this.formatterCache = {
          number: {},
          dateTime: {},
          pluralRules: {}
        }, this.format = function (t) {
          var e = l.formatToParts(t);
          if (1 === e.length) return e[0].value;
          var i = e.reduce(function (t, e) {
            return t.length && e.type === fn.literal && "string" == typeof t[t.length - 1] ? t[t.length - 1] += e.value : t.push(e.value), t;
          }, []);
          return i.length <= 1 ? i[0] || "" : i;
        }, this.formatToParts = function (t) {
          return Sn(l.ast, l.locales, l.formatters, l.formats, t, void 0, l.message);
        }, this.resolvedOptions = function () {
          var t;
          return {
            locale: (null === (t = l.resolvedLocale) || void 0 === t ? void 0 : t.toString()) || Intl.NumberFormat.supportedLocalesOf(l.locales)[0]
          };
        }, this.getAst = function () {
          return l.ast;
        }, this.locales = i, this.resolvedLocale = t.resolveLocale(i), "string" == typeof e) {
          if (this.message = e, !t.__parse) throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");
          var c = a || {};
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
        this.formats = Pn(t.formats, n), this.formatters = a && a.formatters || (void 0 === (o = this.formatterCache) && (o = {
          number: {},
          dateTime: {},
          pluralRules: {}
        }), {
          getNumberFormat: cn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.NumberFormat).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: Cn(o.number),
            strategy: yn.variadic
          }),
          getDateTimeFormat: cn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.DateTimeFormat).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: Cn(o.dateTime),
            strategy: yn.variadic
          }),
          getPluralRules: cn(function () {
            for (var t, e = [], i = 0; i < arguments.length; i++) e[i] = arguments[i];
            return new ((t = Intl.PluralRules).bind.apply(t, s([void 0], e, !1)))();
          }, {
            cache: Cn(o.pluralRules),
            strategy: yn.variadic
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
      }, t.__parse = ln, t.formats = {
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
    Tn = An,
    kn = {
      de: Li,
      en: ji,
      fr: qi,
      nl: er,
      "zh-Hans": or
    };
  function Mn(t, e, ...i) {
    const r = e.replace(/['"]+/g, "");
    var n;
    try {
      n = t.split(".").reduce((t, e) => t[e], kn[r]);
    } catch (e) {
      n = t.split(".").reduce((t, e) => t[e], kn.en);
    }
    if (void 0 === n && (n = t.split(".").reduce((t, e) => t[e], kn.en)), !i.length) return n;
    const s = {};
    for (let t = 0; t < i.length; t += 2) {
      let e = i[t];
      e = e.replace(/^{([^}]+)?}$/, "$1"), s[e] = i[t + 1];
    }
    try {
      return new Tn(n, e).format(s);
    } catch (t) {
      return "Translation " + t;
    }
  }
  var Hn = "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    Dn = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
    Fn = "M7,10L12,15L17,10H7Z",
    Bn = "M7,15L12,10L17,15H7Z",
    In = "M8,5.14V19.14L19,12.14L8,5.14Z";
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const Ln = 1,
    Nn = 2,
    On = t => (...e) => ({
      _$litDirective$: t,
      values: e
    });
  class zn {
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
  const Un = On(class extends zn {
      constructor(t) {
        if (super(t), t.type !== Ln || "class" !== t.name || t.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
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
    Rn = "important",
    jn = " !" + Rn,
    Vn = On(class extends zn {
      constructor(t) {
        if (super(t), t.type !== Ln || "style" !== t.name || t.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
            const e = "string" == typeof r && r.endsWith(jn);
            t.includes("-") || e ? i.setProperty(t, e ? r.slice(0, -11) : r, e ? Rn : "") : i[t] = r;
          }
        }
        return Q;
      }
    }),
    Gn = t => e => "function" == typeof e ? ((t, e) => (window.customElements.get(t) || window.customElements.define(t, e), e))(t, e) : ((t, e) => {
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
    })(t, e),
    Zn = {
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
  /**
       * @license
       * Copyright 2018 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  let Yn;
  let Kn = class extends mt {
    constructor() {
      super(...arguments), this._elementReady = !!customElements.get("ha-camera-stream"), this._loadFailed = !1;
    }
    willUpdate(t) {
      super.willUpdate(t), this._elementReady || this._loadFailed || !this.cameraEntityId || async function (t) {
        customElements.get("ha-camera-stream") || (Yn || (Yn = (async () => {
          const e = await window.loadCardHelpers().then(t => t);
          e.createCardElement({
            type: "picture-entity",
            entity: t,
            camera_view: "live"
          }), await customElements.whenDefined("ha-camera-stream");
        })()), await Yn);
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
      return this._loadFailed ? W`<div class="ac-cam-message">Video player unavailable</div>` : t && "unavailable" !== t.state ? this._elementReady ? W`
      <ha-camera-stream
        muted
        .stateObj=${t}
        .fitMode=${"cover"}
      ></ha-camera-stream>
    ` : W`<div class="ac-cam-message">Starting video…</div>` : W`<div class="ac-cam-message">Camera unavailable</div>`;
    }
    static get styles() {
      return p`
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
  n([_t()], Kn.prototype, "hass", void 0), n([_t({
    attribute: "camera-entity-id"
  })], Kn.prototype, "cameraEntityId", void 0), n([wt()], Kn.prototype, "_elementReady", void 0), n([wt()], Kn.prototype, "_loadFailed", void 0), Kn = n([Gn("anycubic-printercard-camera_stream")], Kn);
  const qn = [66.5, 102, 137.5, 173],
    Wn = ["#d94a3d", "#2f7fd1", "#e8b33a", "#3aa87a"],
    Xn = (t, e, i, r, n = !0) => X`
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
    Qn = t => {
      if (!t || !/^#[0-9a-f]{6}$/i.test(t)) return "rgba(255,255,255,0.35)";
      const e = parseInt(t.slice(1), 16);
      return (.299 * (e >> 16 & 255) + .587 * (e >> 8 & 255) + .114 * (255 & e)) / 255 < .45 ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
    },
    Jn = (t, e, i, r, n, s, a, o) => {
      if (!t || e <= .005) return J;
      if (o) {
        const t = Math.min(1, e),
          l = s,
          c = Math.min(r, l),
          h = i + (r - c) / 2,
          d = n - l,
          p = l * t,
          u = ((t, ...e) => {
            const i = `${t}|${e.map(t => t.toFixed(2)).join(",")}`;
            let r = 0;
            for (let t = 0; t < i.length; t++) r = 31 * r + i.charCodeAt(t) | 0;
            return `acm${(r >>> 0).toString(36)}`;
          })(o, h, d, c, l, p);
        return X`
      <g class="ac-apr-print">
        <defs>
          <!-- mask-type:alpha, not a filter and not a luminance mask. The
               render is a transparent PNG of a near-black object, so its
               ALPHA is the silhouette and its luminance is nothing: a default
               luminance mask renders it almost invisible. Masking a plain
               rect of the filament colour gives the part's real outline in
               the colour it is actually being printed in. -->
          <mask id="${u}m" style="mask-type:alpha">
            <image href="${o}" x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                   width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                   preserveAspectRatio="xMidYMax meet"></image>
          </mask>
          <clipPath id="${u}c">
            <rect x="${h.toFixed(1)}" y="${(n - p).toFixed(1)}"
                  width="${c.toFixed(1)}" height="${p.toFixed(1)}"></rect>
          </clipPath>
        </defs>
        <g clip-path="url(#${u}c)">
          <!-- A halo of the same silhouette, very slightly larger, in the
               contrasting edge colour. The live printer is loaded with PLA+
               at #1A1A1A and the chamber is darker still, so without this the
               part is a black shape on a black background. Scaling about the
               shape's own centre keeps it registered. -->
          <g transform="translate(${(h + c / 2).toFixed(1)} ${(d + l / 2).toFixed(1)}) scale(1.035) translate(${(-h - c / 2).toFixed(1)} ${(-d - l / 2).toFixed(1)})">
            <rect x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                  width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                  fill="${Qn(a)}" mask="url(#${u}m)"></rect>
          </g>
          <rect x="${h.toFixed(1)}" y="${d.toFixed(1)}"
                width="${c.toFixed(1)}" height="${l.toFixed(1)}"
                fill="${a}" mask="url(#${u}m)"></rect>
        </g>
        <rect x="${h.toFixed(1)}" y="${(n - p).toFixed(1)}"
              width="${c.toFixed(1)}" height="1.4"
              fill="var(--ac-printer-card-bg, #fff)" opacity="0.55"></rect>
      </g>`;
      }
      const l = Math.min(1, e) * s,
        c = .22 * r,
        h = Math.min(6, .25 * l),
        d = i + c,
        p = r - 2 * c,
        u = [];
      for (let t = n - 4; t > n - l + 1; t -= 4) {
        const e = h * ((n - t) / Math.max(1, l));
        u.push(X`<line x1="${(d + e).toFixed(1)}" y1="${t.toFixed(1)}"
                x2="${(d + p - e).toFixed(1)}" y2="${t.toFixed(1)}"
                stroke="var(--ac-printer-card-bg, #fff)" stroke-opacity="0.14"
                stroke-width="0.8"></line>`);
      }
      return X`
    <g class="ac-apr-print">
      <path d="M${d} ${n} L${d + h} ${n - l} L${d + p - h} ${n - l} L${d + p} ${n} Z"
            fill="${a}" opacity="0.9"></path>
      ${u}
      <path d="M${d} ${n} L${d + h} ${n - l} L${d + h + .32 * p} ${n - l} L${d + .32 * p} ${n} Z"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.07"></path>
      <rect x="${d + h}" y="${(n - l).toFixed(1)}" width="${(p - 2 * h).toFixed(1)}" height="1.6"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.5"></rect>
    </g>`;
    },
    ts = t => {
      const e = Math.max(0, Math.min(1, t)),
        i = (t, i) => Math.round(t + (i - t) * e);
      return `rgb(${i(255, 255)},${i(180, 79)},${i(84, 33)})`;
    },
    es = (t, e, i) => t <= .02 ? J : X`
      <g class="ac-apr-ember">
        <rect x="${e - 11}" y="${i}" width="22" height="10" rx="5"
              fill="${ts(t)}" opacity="${(.18 * t).toFixed(2)}"></rect>
        <rect x="${e - 15}" y="${i - 1.5}" width="30" height="3" rx="1.5"
              fill="${ts(t)}" opacity="${(.3 + .6 * t).toFixed(2)}"></rect>
      </g>`,
    is = (t, e, i, r, n) => t <= .02 ? J : X`
      <rect class="ac-apr-bedember" x="${e}" y="${i}" width="${r}" height="${n}" rx="${n / 2}"
            fill="${ts(t)}" opacity="${(.25 + .6 * t).toFixed(2)}"></rect>`,
    rs = (t, e, i, r) => X`
  <g opacity="${t ? .9 : .3}">
    <circle cx="${e}" cy="${i}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.3"></circle>
    <g class="${t ? "ac-apr-fan" : ""}">
      <path d="M${e} ${i - .7 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e + .61 * r} ${i + .35 * r} L${e} ${i} Z" fill="currentColor"></path>
      <path d="M${e + .61 * r} ${i + .35 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e - .61 * r} ${i + .35 * r} L${e} ${i} Z" fill="currentColor" opacity="0.7"></path>
      <path d="M${e - .61 * r} ${i + .35 * r} A${.7 * r} ${.7 * r} 0 0 1 ${e} ${i - .7 * r} L${e} ${i} Z" fill="currentColor" opacity="0.45"></path>
    </g>
  </g>`,
    ns = (t, e, i, r) => {
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
    ss = (t, e = 0, i = "M188 88 C 216 94 214 116 196 122", r = !0, n = 0, s = []) => {
      var a;
      return X`
  <g id="ace-${n}">
    <rect x="45" y="6" width="149" height="95" rx="11" fill="currentColor"></rect>
    <rect x="45" y="6" width="149" height="16" rx="8" fill="currentColor"></rect>
    <rect x="56" y="21" width="127" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.28"></rect>
    <rect x="103" y="9" width="34" height="4" rx="2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
    ${qn.map((e, i) => X`
      <rect x="${e - 15}" y="38" width="30" height="40" rx="4" fill="var(--ac-printer-card-bg, #fff)" opacity="0.9"></rect>
      ${((t, e, i) => {
        const r = null != e ? e : "var(--ac-printer-rail, currentColor)",
          n = 11 + 21 * (void 0 === i ? 1 : Math.max(0, Math.min(1, i)));
        return X`
    <rect x="${t - 9}" y="${(42 + (32 - n) / 2).toFixed(1)}" width="18" height="${n.toFixed(1)}" rx="2" fill="${r}"
          stroke="${Qn(e)}" stroke-width="0.75"></rect>
    <rect x="${t - 9}" y="55" width="18" height="5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.25"></rect>`;
      })(e, t[i], s[i])}
      <rect x="${e - 13.5}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>
      <rect x="${e + 9}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>`)}
    ${void 0 === qn[e] ? J : X`<rect x="${qn[e] - 17}" y="36" width="34" height="44" rx="5" fill="none"
                stroke="${null !== (a = t[e]) && void 0 !== a ? a : "currentColor"}" stroke-width="2"></rect>`}
    <rect x="56" y="86" width="127" height="7" rx="3.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.18"></rect>
    <circle cx="186" cy="16" r="2.6" fill="var(--ac-printer-accent, currentColor)"></circle>
  </g>
  <path d="${i}" stroke="${r && t[e] || "var(--ac-printer-rail, currentColor)"}"
        stroke-opacity="0.9" stroke-width="4.5" stroke-linecap="round" fill="none"></path>`;
    },
    as = {
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
          previewUrl: a,
          nozzleHeat: o = 0,
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
    ${ns(h, 172, 13, 7.5)}
  </g>
  <rect x="146" y="22" width="12" height="6" rx="2" fill="currentColor" opacity="0.85"></rect>
  ${Xn(r, 56, 42, 127, !s)}
  <rect x="49" y="40" width="141" height="148" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6" fill="none"></rect>
  <g fill="currentColor" opacity="0.75">
    <rect x="46" y="56" width="5" height="15" rx="2"></rect>
    <rect x="46" y="155" width="5" height="15" rx="2"></rect>
  </g>
  ${rs(c, 195.5, 114, 7.5)}
  <path d="M58 46 L82 46 L60 104 L58 104 Z" fill="currentColor" opacity="0.05"></path>
  <path d="M90 46 L100 46 L74 118 L68 118 Z" fill="currentColor" opacity="0.04"></path>
  <g fill="currentColor" opacity="0.22">
    <rect x="47" y="194" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="200" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="206" width="42" height="2.5" rx="1"></rect>
  </g>
  <rect x="56" y="178" width="128" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
  <rect x="64" y="186" width="112" height="3" rx="1.5" fill="currentColor" opacity="0.35"></rect>
  ${is(s ? 0 : l, 64, 186, 112, 3)}
  ${Jn(!s, n, 56, 128, 178, 66, i, a)}
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
      ${es(o, 119.5, 65)}
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
          previewUrl: a,
          nozzleHeat: o = 0,
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
      ${ns(h, 171, 36.5, 5)}
      ${Xn(r, 52, 47, 136, !s)}
      <rect x="54" y="177" width="132" height="3" rx="1.5" fill="var(--ac-printer-rail, currentColor)" opacity="0.5"></rect>
      <rect x="62" y="166" width="116" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <rect x="70" y="174" width="100" height="4" rx="2" fill="currentColor" opacity="0.35"></rect>
      ${is(s ? 0 : l, 70, 174, 100, 4)}
      ${Jn(!s, n, 62, 116, 166, 58, i, a)}
      ${rs(c, 30, 196, 7)}
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
          ${es(o, 119.5, 71)}
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
          previewUrl: a,
          nozzleHeat: o = 0,
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
      ${is(s ? 0 : l, 68, 178, 104, 4)}
      ${Jn(!s, n, 60, 120, 170, 60, i, a)}
      ${rs(c, 34, 200, 6.5)}
      <rect x="154" y="33" width="50" height="16" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="158" y="36" width="42" height="10" rx="2" fill="#101216"></rect>
      ${ns(h, 179, 41, 5)}
      ${Xn(r, 46, 52, 148, !s)}
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
          ${es(o, 119.5, 72)}
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
      ${ns(n, 160, 175, 5.5)}
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
    os = [["kobra s1", "kobra_s1"], ["kobra 3", "kobra_3"], ["kobra 2", "kobra_3"], ["photon", "resin"], ["mono", "resin"], ["m5s", "resin"], ["m7", "resin"], ["kobra", "kobra_3"]],
    ls = (t, e, i) => i ? `translate(0 ${-t.park})` : `translate(0 ${(t.travel * (1 - e / 100)).toFixed(1)})`,
    cs = (t, e = 48) => `translate(${(t * e).toFixed(1)} 0)`;
  const hs = {
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
    ds = "var(--ac-printer-accent, currentColor)";
  const ps = t => {
      const [,, e, i] = t.viewBox.split(/\s+/).map(Number);
      return `${e} / ${i}`;
    },
    us = t => t.chamber.map(t => `${t}%`).join(" "),
    gs = (t, e, i = Wn, r = 0, n = []) => e > 0 ? function (t, e, i = Wn, r = 0, n = []) {
      if (e < 1) return t;
      const s = 101 * e + 14,
        a = 221 + s + 8,
        [o, l, c, h] = t.chamber,
        d = o / 100 * 240,
        p = 240 - c / 100 * 240;
      return Object.assign(Object.assign({}, t), {
        kind: "kobra_s1" === t.kind ? "kobra_s1_combo" : t.kind,
        viewBox: `0 0 240 ${a}`,
        chamber: [+((d + s) / a * 100).toFixed(2), l, +((a - (p + s)) / a * 100).toFixed(2), h],
        body: a => X`
      ${Array.from({
          length: e
        }, (t, a) => {
          const o = s - 101 * a,
            l = Math.floor(r / 4) === a,
            c = 0 === a && 2 === e ? `M188 88 C 214 94 219 106 219 130 L 219 ${o + 8} C 219 ${o + 17} 210 ${o + 21} 200 ${o + 22}` : `M188 88 C 216 94 214 ${o + 12} 196 ${o + 22}`,
            h = i.slice(4 * a, 4 * a + 4),
            d = n.slice(4 * a, 4 * a + 4);
          return X`<g transform="translate(0 ${101 * a})">
          ${ss(h, l ? r - 4 * a : -1, c, l, a, d)}
        </g>`;
        })}
      <g transform="translate(0 ${s})">${t.body(a)}</g>`
      });
    }(t, e, i, r, n) : Object.assign(Object.assign({}, t), {
      body: e => X`
          ${((t = "var(--ac-printer-accent, currentColor)", e = 70, i = 219.5) => X`
  <g>
    <path d="M${i - 7.5} ${e - 12} C ${i - 7.5} ${e - 26} ${i - 13.5} ${e - 34} ${i - 31.5} ${e - 32}" stroke="${t}"
          stroke-opacity="0.9" stroke-width="3.5" stroke-linecap="round" fill="none"></path>
    <rect x="${i - 23.5}" y="${e - 3}" width="16" height="6" rx="3" fill="currentColor" opacity="0.85"></rect>
    <rect x="${i - 8.5}" y="${e - 18}" width="17" height="36" rx="2" fill="${t}"
          stroke="${Qn(t)}" stroke-width="0.75"></rect>
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
  let ms = class extends mt {
    constructor() {
      super(...arguments), this._progressNum = 0, this._isPrinting = !1, this._lightOn = !1;
    }
    willUpdate(t) {
      var e;
      if (super.willUpdate(t), !t.has("hass") && !t.has("printerEntities") && !t.has("printerEntityIdPart")) return;
      const i = hi(this.hass, this.printerEntities, this.printerEntityIdPart, "job_preview");
      this.imagePreviewUrl !== i && (this.imagePreviewUrl = i, this.imagePreviewBgUrl = i ? `url('${i}')` : void 0);
      const r = Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_progress", 0).state);
      this._progressNum = Number.isFinite(r) ? r / 100 : 0, this._isPrinting = yi(di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state").state.toLowerCase()), this._lightOn = "on" === (null === (e = ti(this.hass, this.printerEntities, "printer_light")) || void 0 === e ? void 0 : e.state);
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
          const e = ti(this.hass, this.printerEntities, t),
            i = null == e ? void 0 : e.attributes.spool_info;
          return Array.isArray(i) ? i : [];
        },
        i = e("ace_spools"),
        r = e("secondary_ace_spools"),
        n = r.length ? 2 : i.length ? 1 : 0,
        s = [...i, ...r],
        a = s.map(t => {
          var e, i;
          return function (t) {
            var e;
            if (!t) return ds;
            const i = String(t).trim();
            return /^#[0-9a-f]{8}$/i.test(i) ? i.slice(0, 7) : /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(i) ? i : /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(i) ? "#" + i.slice(0, 6) : /^(rgb|hsl)a?\(/i.test(i) ? i : null !== (e = hs[i.toLowerCase()]) && void 0 !== e ? e : ds;
          }(null !== (e = t.color_hex) && void 0 !== e ? e : (i = t.color, Array.isArray(i) && i.length >= 3 ? "#" + i.slice(0, 3).map(t => Math.max(0, Math.min(255, Math.round(t))).toString(16).padStart(2, "0")).join("") : void 0));
        }),
        o = s.map(t => "number" == typeof t.consumables_percent ? Math.max(0, Math.min(1, t.consumables_percent / 100)) : void 0),
        l = null === (t = ti(this.hass, this.printerEntities, "ace_spools")) || void 0 === t ? void 0 : t.attributes.box_info,
        c = null == l ? void 0 : l.loaded_slot;
      return {
        spools: a,
        active: "number" == typeof c && c > 0 ? c - 1 : 0,
        units: n,
        remaining: o
      };
    }
    _heat(t, e) {
      const i = t => Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, t, 0).state),
        r = i(e);
      if (!Number.isFinite(r) || r <= 0) return 0;
      const n = i(t);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, (n - 20) / Math.max(1, r - 20))) : 0;
    }
    _status() {
      var t;
      if ("on" === (null === (t = ti(this.hass, this.printerEntities, "job_is_paused")) || void 0 === t ? void 0 : t.state)) return "paused";
      const e = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state").state.toLowerCase();
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
        const a = (null != t ? t : "").toLowerCase();
        let o = "fdm",
          l = e;
        if ("kobra_s1_combo" === i) o = "kobra_s1", l = l > 0 ? l : 1;else if (i && Object.prototype.hasOwnProperty.call(as, i)) o = i;else for (const [t, e] of os) if (a.includes(t)) {
          o = e;
          break;
        }
        const c = as[o];
        return "resin" === o ? c : gs(c, l, r, n, s);
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
      return W`
      <div
        class="ac-printercard-animatedprinter"
        style=${Vn({
        "--ac-apr-chamber": us(e),
        "--ac-apr-aspect": ps(e)
      })}
      >
        ${s ? W`
              <anycubic-printercard-camera_stream
                class="ac-apr-camera"
                .hass=${this.hass}
                .cameraEntityId=${this.cameraEntityId}
              ></anycubic-printercard-camera_stream>
            ` : J}
        ${((t, e = {}) => {
        var i, r;
        return W` <svg
    class="ac-apr-svg"
    viewBox=${t.viewBox}
    fill="none"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    ${t.body(Object.assign(Object.assign({}, e), {
          gantry: ls(t, 100 * (null !== (i = e.progress) && void 0 !== i ? i : 0), !!e.cameraLive),
          chamberBusy: !!e.cameraLive,
          nozzle: cs(null !== (r = e.nozzleX) && void 0 !== r ? r : 0)
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
        fanOn: Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state) > 0,
        status: this._status()
      })}
      </div>
    `;
    }
    static get styles() {
      return p`
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
  n([_t()], ms.prototype, "hass", void 0), n([_t({
    attribute: "scale-factor"
  })], ms.prototype, "scaleFactor", void 0), n([_t({
    attribute: "printer-config"
  })], ms.prototype, "printerConfig", void 0), n([_t({
    attribute: "printer-entities"
  })], ms.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], ms.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "camera-entity-id"
  })], ms.prototype, "cameraEntityId", void 0), n([_t({
    attribute: "printer-art"
  })], ms.prototype, "printerArt", void 0), n([wt()], ms.prototype, "_progressNum", void 0), n([wt()], ms.prototype, "_isPrinting", void 0), n([wt()], ms.prototype, "_lightOn", void 0), n([wt()], ms.prototype, "imagePreviewUrl", void 0), n([wt()], ms.prototype, "imagePreviewBgUrl", void 0), ms = n([Gn("anycubic-printercard-animated_printer")], ms);
  let bs = class extends mt {
    constructor() {
      super(...arguments), this._viewClick = () => {
        this.toggleVideo && this.toggleVideo();
      };
    }
    render() {
      return W`
      <div class="ac-printercard-printerview" @click=${this._viewClick}>
        <anycubic-printercard-animated_printer
          .hass=${this.hass}
          .scaleFactor=${this.scaleFactor}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
          .printerConfig=${Zn}
          .cameraEntityId=${this.cameraEntityId}
          .printerArt=${this.printerArt === je.Auto ? void 0 : this.printerArt}
        ></anycubic-printercard-animated_printer>
      </div>
    `;
    }
    static get styles() {
      return p`
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
  n([_t()], bs.prototype, "hass", void 0), n([_t({
    attribute: "toggle-video",
    type: Function
  })], bs.prototype, "toggleVideo", void 0), n([_t({
    attribute: "printer-entities"
  })], bs.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], bs.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "scale-factor"
  })], bs.prototype, "scaleFactor", void 0), n([_t({
    attribute: "camera-entity-id"
  })], bs.prototype, "cameraEntityId", void 0), n([_t({
    attribute: "printer-art"
  })], bs.prototype, "printerArt", void 0), bs = n([Gn("anycubic-printercard-printer_view")], bs);
  let vs = class extends mt {
    constructor() {
      super(...arguments), this.mediaView = Re.Auto, this.noCamera = !1, this.language = "en", this.isPrinting = !1, this._previewFailed = !1, this._previewLoadFailed = () => {
        this._previewFailed = !0, this._selected === Re.Preview && (this._selected = void 0);
      }, this._selectTab = t => {
        this._selected = t.currentTarget.tabKey;
      };
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("hass") || t.has("printerEntityIdPart")) {
        const t = hi(this.hass, this.printerEntities, this.printerEntityIdPart, "job_preview");
        t !== this._previewUrl && (this._previewUrl = t, this._previewFailed = !1);
      }
    }
    _defaultTab() {
      return this._usablePreview() ? Re.Preview : Re.Printer;
    }
    _usablePreview() {
      return !!this._previewUrl && !this._previewFailed;
    }
    _availableTabs() {
      const t = [];
      return this.camera && !this.noCamera && t.push({
        key: Re.Camera,
        icon: "M6.03 12.03L8.03 15.5L5.5 18.68L2 12.62L6.03 12.03M17 18V15.29C17.88 14.9 18.5 14.03 18.5 13C18.5 12.43 18.3 11.9 17.97 11.5L19.94 10.35C20.95 9.76 21.3 8.47 20.71 7.46L19.33 5.06C18.74 4.05 17.45 3.7 16.44 4.28L8.31 9C7.36 9.53 7.03 10.75 7.58 11.71L9.08 14.31C9.63 15.26 10.86 15.59 11.81 15.04L13.69 13.96C13.94 14.55 14.41 15.03 15 15.29V18C15 19.1 15.9 20 17 20H22V18H17Z",
        label: Mn("card.media_view.tabs.camera", this.language)
      }), this._usablePreview() && t.push({
        key: Re.Preview,
        icon: "M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z",
        label: Mn("card.media_view.tabs.preview", this.language)
      }), t.push({
        key: Re.Printer,
        icon: "M19,6A1,1 0 0,0 20,5A1,1 0 0,0 19,4A1,1 0 0,0 18,5A1,1 0 0,0 19,6M19,2A3,3 0 0,1 22,5V11H18V7H6V11H2V5A3,3 0 0,1 5,2H19M18,18.25C18,18.63 17.79,18.96 17.47,19.13L12.57,21.82C12.4,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L6.53,19.13C6.21,18.96 6,18.63 6,18.25V13C6,12.62 6.21,12.29 6.53,12.12L11.43,9.68C11.59,9.56 11.79,9.5 12,9.5C12.21,9.5 12.4,9.56 12.57,9.68L17.47,12.12C17.79,12.29 18,12.62 18,13V18.25M12,11.65L9.04,13L12,14.6L14.96,13L12,11.65M8,17.66L11,19.29V16.33L8,14.71V17.66M16,17.66V14.71L13,16.33V19.29L16,17.66Z",
        label: Mn("card.media_view.tabs.printer", this.language)
      }), this._usablePreview() && this.camera && t.push({
        key: Re.PrinterModel,
        icon: "M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z",
        label: Mn("card.media_view.tabs.printer_model", this.language)
      }), t;
    }
    _activeTab() {
      var t;
      const e = this._availableTabs(),
        i = null !== (t = this._selected) && void 0 !== t ? t : this.mediaView === Re.Auto ? this._defaultTab() : this.mediaView;
      return e.some(t => t.key === i) ? i : Re.Printer;
    }
    _renderTabs(t, e) {
      return t.map(t => W`
        <button
          class="ac-media-tab ${Un({
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
      if (this.mediaView === Re.None) return J;
      const e = this._activeTab(),
        i = this._availableTabs();
      return W`
      <div
        class="ac-media ${Un({
        "ac-media-tall": e === Re.Printer || e === Re.PrinterModel
      })}"
      >
        <div class="ac-media-surface">${this._renderSurface(e)}</div>
        ${i.length > 1 ? W`
              <div class="ac-media-tabs">${this._renderTabs(i, e)}</div>
            ` : J}
        ${e === Re.Camera && (null === (t = this.camera) || void 0 === t ? void 0 : t.isCloud) ? W`<div class="ac-media-badge">LIVE</div>` : J}
      </div>
    `;
    }
    _renderSurface(t) {
      return t === Re.Camera && this.camera && !this.noCamera ? W`
        <anycubic-printercard-camera_stream
          .hass=${this.hass}
          .cameraEntityId=${this.camera.entity_id}
        ></anycubic-printercard-camera_stream>
      ` : t === Re.Preview && this._usablePreview() ? W`
        <img
          class="ac-media-preview"
          src=${this._previewUrl}
          alt="Job preview"
          @error=${this._previewLoadFailed}
        />
      ` : W`
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
      if (this._activeTab() === Re.PrinterModel) return;
      return this._selected === Re.Printer || this.mediaView === Re.Printer ? this.camera.entity_id : void 0;
    }
    static get styles() {
      return p`
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
  function* ys(t, e) {
    if (void 0 !== t) {
      let i = 0;
      for (const r of t) yield e(r, i++);
    }
  }
  n([_t()], vs.prototype, "hass", void 0), n([_t({
    attribute: "printer-entities"
  })], vs.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], vs.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "media-view"
  })], vs.prototype, "mediaView", void 0), n([_t({
    attribute: "printer-art"
  })], vs.prototype, "printerArt", void 0), n([_t({
    attribute: "no-camera",
    type: Boolean
  })], vs.prototype, "noCamera", void 0), n([_t()], vs.prototype, "language", void 0), n([_t({
    attribute: !1
  })], vs.prototype, "camera", void 0), n([_t({
    attribute: "is-printing",
    type: Boolean
  })], vs.prototype, "isPrinting", void 0), n([wt()], vs.prototype, "_selected", void 0), n([wt()], vs.prototype, "_previewUrl", void 0), n([wt()], vs.prototype, "_previewFailed", void 0), vs = n([Gn("anycubic-printercard-media_view")], vs);
  const fs = "secondary_",
    _s = "ace_run_out_refill",
    ws = fs + _s,
    xs = "ace_spools",
    $s = fs + xs;
  let Es = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this._runoutRefillId = _s, this._spoolsEntityId = xs, this.spoolList = [], this.selectedIndex = -1, this.selectedMaterialType = "", this.selectedColor = [0, 0, 0], this._changingRunout = !1, this._openDryingModal = () => {
        Fe(this, "ac-mcbdry-modal", {
          modalOpen: !0,
          box_id: this.box_id
        });
      }, this._handleRunoutRefillChanged = t => {
        var e, i;
        this._changingRunout || (this._changingRunout = !0, this.hass.callService("switch", "toggle", {
          entity_id: null !== (i = null === (e = ai(this.printerEntities, this.printerEntityIdPart, "switch", this._runoutRefillId)) || void 0 === e ? void 0 : e.entity_id) && void 0 !== i ? i : si(this.printerEntityIdPart, "switch", this._runoutRefillId)
        }).then(() => {
          this._changingRunout = !1;
        }).catch(t => {
          this._changingRunout = !1;
        }));
      }, this._editSpool = t => {
        const e = t.currentTarget.index,
          i = t.currentTarget.material_type,
          r = t.currentTarget.color;
        Fe(this, "ac-mcb-modal", {
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
      super.willUpdate(t), t.has("language") && (this._buttonRefill = Mn("card.buttons.runout_refill", this.language), this._buttonDry = Mn("card.buttons.dry", this.language)), t.has("box_id") && (1 === this.box_id ? (this._runoutRefillId = ws, this._spoolsEntityId = $s) : (this._runoutRefillId = _s, this._spoolsEntityId = xs)), (t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) && (this.spoolList = di(this.hass, this.printerEntities, this.printerEntityIdPart, this._spoolsEntityId, "not loaded", {
        spool_info: []
      }).attributes.spool_info, this._runoutRefillState = (e = this.hass, i = this.printerEntities, r = this.printerEntityIdPart, n = this._runoutRefillId, We(e, ai(i, r, "switch", n))));
    }
    render() {
      return W`
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
      return ys(this.spoolList, (t, e) => {
        const i = {
          "background-color": t.spool_loaded ? `rgb(${t.color[0]}, ${t.color[1]}, ${t.color[2]})` : "#aaa"
        };
        return W`
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
                style=${Vn(i)}
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
      return p`
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
  n([_t()], Es.prototype, "hass", void 0), n([_t()], Es.prototype, "language", void 0), n([_t({
    attribute: "printer-entities"
  })], Es.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], Es.prototype, "printerEntityIdPart", void 0), n([_t()], Es.prototype, "box_id", void 0), n([wt()], Es.prototype, "_runoutRefillId", void 0), n([wt()], Es.prototype, "_spoolsEntityId", void 0), n([wt()], Es.prototype, "spoolList", void 0), n([wt()], Es.prototype, "selectedIndex", void 0), n([wt()], Es.prototype, "selectedMaterialType", void 0), n([wt()], Es.prototype, "selectedColor", void 0), n([wt()], Es.prototype, "_runoutRefillState", void 0), n([wt()], Es.prototype, "_buttonRefill", void 0), n([wt()], Es.prototype, "_buttonDry", void 0), n([wt()], Es.prototype, "_changingRunout", void 0), Es = n([Gn("anycubic-printercard-multicolorbox_view")], Es);
  /**
       * @license
       * Copyright 2020 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const {
      I: Ss
    } = ut,
    Ps = () => document.createComment(""),
    Cs = (t, e, i) => {
      const r = t._$AA.parentNode,
        n = void 0 === e ? t._$AB : e._$AA;
      if (void 0 === i) {
        const e = r.insertBefore(Ps(), n),
          s = r.insertBefore(Ps(), n);
        i = new Ss(e, s, t, t.options);
      } else {
        const e = i._$AB.nextSibling,
          s = i._$AM,
          a = s !== t;
        if (a) {
          let e;
          i._$AQ?.(t), i._$AM = t, void 0 !== i._$AP && (e = t._$AU) !== s._$AU && i._$AP(e);
        }
        if (e !== n || a) {
          let t = i._$AA;
          for (; t !== e;) {
            const e = t.nextSibling;
            r.insertBefore(t, n), t = e;
          }
        }
      }
      return i;
    },
    As = (t, e, i = t) => (t._$AI(e, i), t),
    Ts = {},
    ks = t => {
      t._$AP?.(!1, !0);
      let e = t._$AA;
      const i = t._$AB.nextSibling;
      for (; e !== i;) {
        const t = e.nextSibling;
        e.remove(), e = t;
      }
    },
    Ms = (t, e, i) => {
      const r = new Map();
      for (let n = e; n <= i; n++) r.set(t[n], n);
      return r;
    },
    Hs = On(class extends zn {
      constructor(t) {
        if (super(t), t.type !== Nn) throw Error("repeat() can only be used in text expressions");
      }
      dt(t, e, i) {
        let r;
        void 0 === i ? i = e : void 0 !== e && (r = e);
        const n = [],
          s = [];
        let a = 0;
        for (const e of t) n[a] = r ? r(e, a) : a, s[a] = i(e, a), a++;
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
            keys: a
          } = this.dt(e, i, r);
        if (!Array.isArray(n)) return this.ut = a, s;
        const o = this.ut ??= [],
          l = [];
        let c,
          h,
          d = 0,
          p = n.length - 1,
          u = 0,
          g = s.length - 1;
        for (; d <= p && u <= g;) if (null === n[d]) d++;else if (null === n[p]) p--;else if (o[d] === a[u]) l[u] = As(n[d], s[u]), d++, u++;else if (o[p] === a[g]) l[g] = As(n[p], s[g]), p--, g--;else if (o[d] === a[g]) l[g] = As(n[d], s[g]), Cs(t, l[g + 1], n[d]), d++, g--;else if (o[p] === a[u]) l[u] = As(n[p], s[u]), Cs(t, n[d], n[p]), p--, u++;else if (void 0 === c && (c = Ms(a, u, g), h = Ms(o, d, p)), c.has(o[d])) {
          if (c.has(o[p])) {
            const e = h.get(a[u]),
              i = void 0 !== e ? n[e] : null;
            if (null === i) {
              const e = Cs(t, n[d]);
              As(e, s[u]), l[u] = e;
            } else l[u] = As(i, s[u]), Cs(t, n[d], i), n[e] = null;
            u++;
          } else ks(n[p]), p--;
        } else ks(n[d]), d++;
        for (; u <= g;) {
          const e = Cs(t, l[g + 1]);
          As(e, s[u]), l[u++] = e;
        }
        for (; d <= p;) {
          const t = n[d++];
          null !== t && ks(t);
        }
        return this.ut = a, ((t, e = Ts) => {
          t._$AH = e;
        })(t, l), Q;
      }
    });
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  let Ds = class extends mt {
    render() {
      const t = {
        width: String(this.progress) + "%"
      };
      return W`
      <div class="ac-stat-line">
        <p class="ac-stat-heading">${this.name}</p>
        <div class="ac-stat-value">
          <div class="ac-progress-bar">
            <div class="ac-stat-text">${this.value}</div>
            <div
              class="ac-progress-line"
              style=${Vn(t)}
            ></div>
          </div>
        </div>
      </div>
    `;
    }
    static get styles() {
      return p`
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
  })], Ds.prototype, "name", void 0), n([_t({
    type: Number
  })], Ds.prototype, "value", void 0), n([_t({
    type: Number
  })], Ds.prototype, "progress", void 0), Ds = n([Gn("anycubic-printercard-progress-line")], Ds);
  let Fs = class extends mt {
    constructor() {
      super(...arguments), this.unit = "";
    }
    render() {
      return W`
      <div class="ac-stat-line">
        <p class="ac-stat-text ac-stat-heading">${this.name}</p>
        <p class="ac-stat-text">${this.value}${this.unit}</p>
      </div>
    `;
    }
    static get styles() {
      return p`
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
  })], Fs.prototype, "name", void 0), n([_t({
    type: String
  })], Fs.prototype, "value", void 0), n([_t({
    type: String
  })], Fs.prototype, "unit", void 0), Fs = n([Gn("anycubic-printercard-stat-line")], Fs);
  let Bs = class extends mt {
    render() {
      return W`<anycubic-printercard-stat-line
      .name=${this.name}
      .value=${$i(this.temperatureEntity, this.temperatureUnit, this.round)}
    ></anycubic-printercard-stat-line>`;
    }
    static get styles() {
      return p`
      :host {
        box-sizing: border-box;
        width: 100%;
      }
    `;
    }
  };
  n([_t({
    type: String
  })], Bs.prototype, "name", void 0), n([_t({
    attribute: "temperature-entity"
  })], Bs.prototype, "temperatureEntity", void 0), n([_t({
    type: Boolean
  })], Bs.prototype, "round", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], Bs.prototype, "temperatureUnit", void 0), Bs = n([Gn("anycubic-printercard-stat-temperature")], Bs);
  let Is = class extends mt {
    constructor() {
      super(...arguments), this.running = !1, this.currentTime = 0, this.lastIntervalId = -1;
    }
    willUpdate(t) {
      super.willUpdate(t), t.has("timeEntity") && (-1 !== this.lastIntervalId && clearInterval(this.lastIntervalId), this.currentTime = function (t, e = !1) {
        let i;
        if (t.state) {
          if (t.state.includes(", ")) {
            const [e, r] = t.state.split(", "),
              [n, s, a] = r.split(":"),
              o = e.match(/\d+/);
            i = 60 * +(o ? o[0] : 0) * 60 * 24 + 60 * +n * 60 + 60 * +s + +a;
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
      return W`<anycubic-printercard-stat-line
      .name=${this.name}
      .value=${wi(this.currentTime, this.timeType, this.round, this.use_24hr)}
    ></anycubic-printercard-stat-line>`;
    }
    _incTime() {
      if (this.running && (0 === this.currentTime || this.currentTime && !isNaN(this.currentTime))) {
        const t = Number(this.currentTime) + this.direction;
        this.currentTime = t < 0 ? 0 : t;
      }
    }
    static get styles() {
      return p`
      :host {
        box-sizing: border-box;
        width: 100%;
      }
    `;
    }
  };
  n([_t({
    attribute: "time-entity"
  })], Is.prototype, "timeEntity", void 0), n([_t({
    attribute: "time-type"
  })], Is.prototype, "timeType", void 0), n([_t({
    type: String
  })], Is.prototype, "name", void 0), n([_t({
    type: Number
  })], Is.prototype, "direction", void 0), n([_t({
    type: Boolean
  })], Is.prototype, "round", void 0), n([_t({
    type: Boolean
  })], Is.prototype, "use_24hr", void 0), n([_t({
    attribute: "is-seconds",
    type: Boolean
  })], Is.prototype, "isSeconds", void 0), n([_t({
    type: Boolean
  })], Is.prototype, "running", void 0), n([wt()], Is.prototype, "currentTime", void 0), n([wt()], Is.prototype, "lastIntervalId", void 0), Is = n([Gn("anycubic-printercard-stat-time")], Is);
  let Ls = class extends mt {
    constructor() {
      super(...arguments), this.round = !0, this.temperatureUnit = Ie.C, this.progressPercent = 0, this._jobRunning = !1, this._valDryProgress = 0;
    }
    willUpdate(t) {
      var e;
      if (super.willUpdate(t), t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) {
        const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state", "unknown").state.toLowerCase();
        this._jobRunning = yi(t) && "paused" !== t, this._entETA = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_remaining"), this._entElapsed = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_elapsed"), this._entRemaining = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_time_remaining"), this._entBedCurrent = di(this.hass, this.printerEntities, this.printerEntityIdPart, "hotbed_temperature"), this._entHotendCurrent = di(this.hass, this.printerEntities, this.printerEntityIdPart, "nozzle_temperature"), this._entBedTarget = di(this.hass, this.printerEntities, this.printerEntityIdPart, "target_hotbed_temperature"), this._entHotendTarget = di(this.hass, this.printerEntities, this.printerEntityIdPart, "target_nozzle_temperature"), this._valStatus = qe("unavailable" === t || "unknown" === t ? di(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status", "unknown").state : t), this._valOnline = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "printer_online", "Online", "Offline", "unknown"), this._valAvailability = qe(di(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status").state), this._valJobName = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_name").state, this._valCurrentLayer = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_current_layer").state;
        const i = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_speed_mode", "", {
            available_modes: [],
            print_speed_mode_code: -1
          }),
          r = Pi(i),
          n = null !== (e = i.attributes.print_speed_mode_code) && void 0 !== e ? e : 0;
        this._valSpeedMode = n >= 0 && n in r ? r[n] : "Unknown", this._valFanSpeed = di(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state, this._valDryStatus = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_active", "Drying", "Not Drying", "unknown");
        const s = Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_total_duration", 0).state),
          a = Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_remaining_time", 0).state);
        this._valDryRemain = isNaN(a) ? "" : `${a} Mins`, this._valDryProgress = !isNaN(s) && s > 0 ? a / s * 100 : 0, this._valOnTime = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_on_time", 0).state, this._valOffTime = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_off_time", 0).state, this._valBottomTime = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_bottom_time", 0).state, this._valModelHeight = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_model_height", 0).state, this._valBottomLayers = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_bottom_layers", 0).state, this._valZUpHeight = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_up_height", 0).state, this._valZUpSpeed = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_up_speed", 0).state, this._valZDownSpeed = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_z_down_speed", 0).state;
      }
      (t.has("language") || t.has("monitoredStats")) && (this._statTranslations = this.monitoredStats.reduce((t, e) => (t[e] = Mn(`card.monitored_stats.${e}`, this.language), t), {}));
    }
    render() {
      return W`
      <div class="ac-stats-box ac-stats-section">
        ${this.showPercent ? W`
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
      return Hs(this.monitoredStats, t => t, (t, e) => {
        switch (t) {
          case Ue.Status:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valStatus}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ETA:
            return W`
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
          case Ue.Elapsed:
            return W`
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
          case Ue.Remaining:
            return W`
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
          case Ue.BedCurrent:
            return W`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entBedCurrent}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case Ue.HotendCurrent:
            return W`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entHotendCurrent}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case Ue.BedTarget:
            return W`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entBedTarget}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case Ue.HotendTarget:
            return W`
              <anycubic-printercard-stat-temperature
                .name=${this._statTranslations[t]}
                .temperatureEntity=${this._entHotendTarget}
                .round=${this.round}
                .temperatureUnit=${this.temperatureUnit}
              ></anycubic-printercard-stat-temperature>
            `;
          case Ue.PrinterOnline:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOnline}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.Availability:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valAvailability}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ProjectName:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valJobName}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.CurrentLayer:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valCurrentLayer}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.SpeedMode:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valSpeedMode}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.FanSpeed:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valFanSpeed}
                .unit=${"%"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.DryingStatus:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valDryStatus}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.DryingTime:
            return W`
              <anycubic-printercard-progress-line
                .name=${this._statTranslations[t]}
                .value=${this._valDryRemain}
                .progress=${this._valDryProgress}
              ></anycubic-printercard-progress-line>
            `;
          case Ue.OnTime:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOnTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.OffTime:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valOffTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.BottomTime:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valBottomTime}
                .unit=${"s"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ModelHeight:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valModelHeight}
                .unit=${"mm"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.BottomLayers:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valBottomLayers}
                .unit=${"layers"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ZUpHeight:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZUpHeight}
                .unit=${"mm"}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ZUpSpeed:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZUpSpeed}
              ></anycubic-printercard-stat-line>
            `;
          case Ue.ZDownSpeed:
            return W`
              <anycubic-printercard-stat-line
                .name=${this._statTranslations[t]}
                .value=${this._valZDownSpeed}
              ></anycubic-printercard-stat-line>
            `;
          default:
            return W`
              <anycubic-printercard-stat-line
                .name=${"Unknown"}
                .value=${"<unknown>"}
              ></anycubic-printercard-stat-line>
            `;
        }
      });
    }
    static get styles() {
      return p`
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
  n([_t()], Ls.prototype, "hass", void 0), n([_t()], Ls.prototype, "language", void 0), n([_t({
    attribute: "monitored-stats"
  })], Ls.prototype, "monitoredStats", void 0), n([_t({
    attribute: "show-percent",
    type: Boolean
  })], Ls.prototype, "showPercent", void 0), n([_t({
    type: Boolean
  })], Ls.prototype, "round", void 0), n([_t({
    type: Boolean
  })], Ls.prototype, "use_24hr", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], Ls.prototype, "temperatureUnit", void 0), n([_t({
    attribute: "printer-entities"
  })], Ls.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], Ls.prototype, "printerEntityIdPart", void 0), n([_t({
    attribute: "progress-percent"
  })], Ls.prototype, "progressPercent", void 0), n([wt()], Ls.prototype, "_statTranslations", void 0), n([wt()], Ls.prototype, "_jobRunning", void 0), n([wt()], Ls.prototype, "_entETA", void 0), n([wt()], Ls.prototype, "_entElapsed", void 0), n([wt()], Ls.prototype, "_entRemaining", void 0), n([wt()], Ls.prototype, "_entBedCurrent", void 0), n([wt()], Ls.prototype, "_entHotendCurrent", void 0), n([wt()], Ls.prototype, "_entBedTarget", void 0), n([wt()], Ls.prototype, "_entHotendTarget", void 0), n([wt()], Ls.prototype, "_valStatus", void 0), n([wt()], Ls.prototype, "_valOnline", void 0), n([wt()], Ls.prototype, "_valAvailability", void 0), n([wt()], Ls.prototype, "_valJobName", void 0), n([wt()], Ls.prototype, "_valCurrentLayer", void 0), n([wt()], Ls.prototype, "_valSpeedMode", void 0), n([wt()], Ls.prototype, "_valFanSpeed", void 0), n([wt()], Ls.prototype, "_valDryStatus", void 0), n([wt()], Ls.prototype, "_valDryRemain", void 0), n([wt()], Ls.prototype, "_valDryProgress", void 0), n([wt()], Ls.prototype, "_valOnTime", void 0), n([wt()], Ls.prototype, "_valOffTime", void 0), n([wt()], Ls.prototype, "_valBottomTime", void 0), n([wt()], Ls.prototype, "_valModelHeight", void 0), n([wt()], Ls.prototype, "_valBottomLayers", void 0), n([wt()], Ls.prototype, "_valZUpHeight", void 0), n([wt()], Ls.prototype, "_valZUpSpeed", void 0), n([wt()], Ls.prototype, "_valZDownSpeed", void 0), Ls = n([Gn("anycubic-printercard-stats-component")], Ls);
  /**
       * @license
       * Copyright 2017 Google LLC
       * SPDX-License-Identifier: BSD-3-Clause
       */
  const Ns = (t, e) => {
      const i = t._$AN;
      if (void 0 === i) return !1;
      for (const t of i) t._$AO?.(e, !1), Ns(t, e);
      return !0;
    },
    Os = t => {
      let e, i;
      do {
        if (void 0 === (e = t._$AM)) break;
        i = e._$AN, i.delete(t), t = e;
      } while (0 === i?.size);
    },
    zs = t => {
      for (let e; e = t._$AM; t = e) {
        let i = e._$AN;
        if (void 0 === i) e._$AN = i = new Set();else if (i.has(t)) break;
        i.add(t), js(e);
      }
    };
  function Us(t) {
    void 0 !== this._$AN ? (Os(this), this._$AM = t, zs(this)) : this._$AM = t;
  }
  function Rs(t, e = !1, i = 0) {
    const r = this._$AH,
      n = this._$AN;
    if (void 0 !== n && 0 !== n.size) if (e) {
      if (Array.isArray(r)) for (let t = i; t < r.length; t++) Ns(r[t], !1), Os(r[t]);else null != r && (Ns(r, !1), Os(r));
    } else Ns(this, t);
  }
  const js = t => {
    t.type == Nn && (t._$AP ??= Rs, t._$AQ ??= Us);
  };
  class Vs extends zn {
    constructor() {
      super(...arguments), this._$AN = void 0;
    }
    _$AT(t, e, i) {
      super._$AT(t, e, i), zs(this), this.isConnected = t._$AU;
    }
    _$AO(t, e = !0) {
      t !== this.isConnected && (this.isConnected = t, t ? this.reconnected?.() : this.disconnected?.()), e && (Ns(this, t), Os(this));
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
  const Gs = new WeakMap();
  let Zs = 0;
  const Ys = new Map(),
    Ks = new WeakSet(),
    qs = () => new Promise(t => requestAnimationFrame(t)),
    Ws = (t, e) => {
      const i = t - e;
      return 0 === i ? void 0 : i;
    },
    Xs = (t, e) => {
      const i = t / e;
      return 1 === i ? void 0 : i;
    },
    Qs = {
      left: (t, e) => {
        const i = Ws(t, e);
        return {
          value: i,
          transform: null == i || isNaN(i) ? void 0 : `translateX(${i}px)`
        };
      },
      top: (t, e) => {
        const i = Ws(t, e);
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
        const r = Xs(t, e);
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
        const r = Xs(t, e);
        return {
          value: r,
          overrideFrom: i,
          transform: null == r || isNaN(r) ? void 0 : `scaleY(${r})`
        };
      }
    },
    Js = {
      duration: 333,
      easing: "ease-in-out"
    },
    ta = ["left", "top", "width", "height", "opacity", "color", "background"],
    ea = new WeakMap();
  const ia = On(class extends Vs {
      constructor(t) {
        if (super(t), this.t = !1, this.i = null, this.o = null, this.h = !0, this.shouldLog = !1, t.type === Nn) throw Error("The `animate` directive must be used in attribute position.");
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
        return Gs.get(this.u);
      }
      isDisabled() {
        return this.options.disabled || this.getController()?.disabled;
      }
      update(t, [e]) {
        const i = void 0 === this.u;
        return i && (this.u = t.options?.host, this.u.addController(this), this.u.updateComplete.then(t => this.t = !0), this.element = t.element, ea.set(this.element, this)), this.optionsOrCallback = e, (i || "function" != typeof e) && this.p(e), this.render(e);
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
        }), t.properties ??= ta, this.options = t;
      }
      m() {
        const t = {},
          e = this.element.getBoundingClientRect(),
          i = getComputedStyle(this.element);
        return this.options.properties.forEach(r => {
          const n = e[r] ?? (Qs[r] ? void 0 : i[r]),
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
        this.prepare(), await qs;
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
          const i = Ys.get(this.options.inId);
          if (i) {
            Ys.delete(this.options.inId);
            const {
              from: n,
              to: s
            } = this.N(i, r, e);
            t = this.calculateKeyframes(n, s), t = this.options.in ? [{
              ...this.options.in[0],
              ...t[0]
            }, ...this.options.in.slice(1), t[1]] : t, Zs++, t.forEach(t => t.zIndex = Zs);
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
        if (void 0 !== this.options.id && Ys.set(this.options.id, this.A), void 0 === this.options.out) return;
        if (this.prepare(), await qs(), this.i?.isConnected) {
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
          const i = ea.get(e);
          i && !i.isDisabled() && i && t.push(i);
        }
        return t;
      }
      get isHostRendered() {
        const t = Ks.has(this.u);
        return t || this.u.updateComplete.then(() => {
          Ks.add(this.u);
        }), t;
      }
      j(t, e = this.O()) {
        const i = {
          ...Js
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
        const a = {};
        for (const i in e) {
          const o = t[i],
            l = e[i];
          if (i in Qs) {
            const t = Qs[i];
            if (void 0 === o || void 0 === l) continue;
            const e = t(o, l);
            void 0 !== e.transform && (a[i] = e.value, s = !0, r.transform = `${r.transform ?? ""} ${e.transform}`, void 0 !== e.overrideFrom && Object.assign(r, e.overrideFrom));
          } else o !== l && void 0 !== o && void 0 !== l && (s = !0, r[i] = o, n[i] = l);
        }
        return r.transformOrigin = n.transformOrigin = i ? "center center" : "top left", this.animatingProperties = a, s ? [r, n] : void 0;
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
    ra = p`
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
  let na = class extends mt {
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
      return W`
      <button
        class="ac-ui-seld-select"
        style=${Vn(t)}
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
      return p`
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
  n([_t()], na.prototype, "item", void 0), n([wt()], na.prototype, "_isActive", void 0), na = n([Gn("anycubic-ui-select-dropdown-item")], na);
  let sa = class extends mt {
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
        this._selectedItem = this.availableOptions[e], Fe(this, "ac-select-dropdown", {
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
      return this.availableOptions ? W`
          <button
            class="ac-ui-select-button"
            style=${Vn(t)}
            @click=${this._showOptions}
            @mouseenter=${this._setActive}
            @mouseleave=${this._setInactive}
          >
            ${this._selectedItem ? this._selectedItem : this.placeholder}
            <ha-svg-icon .path=${Hn}></ha-svg-icon>
          </button>
          <div class="ac-ui-select-options" style=${Vn(e)}>
            ${this._renderOptions()}
          </div>
        ` : J;
    }
    _renderOptions() {
      return ys(Object.keys(this.availableOptions), (t, e) => W`
          <anycubic-ui-select-dropdown-item
            .item=${this.availableOptions[t]}
            .item_key=${t}
            @click=${this._selectItem}
          ></anycubic-ui-select-dropdown-item>
        `);
    }
    static get styles() {
      return p`
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
  })], sa.prototype, "availableOptions", void 0), n([_t()], sa.prototype, "placeholder", void 0), n([_t({
    attribute: "initial-item"
  })], sa.prototype, "initialItem", void 0), n([wt()], sa.prototype, "_selectedItem", void 0), n([wt()], sa.prototype, "_active", void 0), n([wt()], sa.prototype, "_hidden", void 0), sa = n([Gn("anycubic-ui-select-dropdown")], sa);
  const aa = {
      keyframeOptions: {
        duration: 250,
        direction: "alternate",
        easing: "ease-in-out"
      },
      properties: ["height", "opacity", "scale"]
    },
    oa = "drying_preset_1",
    la = "drying_preset_2",
    ca = "drying_preset_3",
    ha = "drying_preset_4",
    da = "drying_stop",
    pa = "secondary_",
    ua = pa + oa,
    ga = pa + la,
    ma = pa + ca,
    ba = pa + ha,
    va = pa + da;
  let ya = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this._dryingPresetId1 = oa, this._dryingPresetId2 = la, this._dryingPresetId3 = ca, this._dryingPresetId4 = ha, this._dryingStopId = da, this._hasDryingPreset1 = !1, this._hasDryingPreset2 = !1, this._hasDryingPreset3 = !1, this._hasDryingPreset4 = !1, this._hasDryingStop = !1, this._dryingPresetTemp1 = "", this._dryingPresetDur1 = "", this._dryingPresetTemp2 = "", this._dryingPresetDur2 = "", this._dryingPresetTemp3 = "", this._dryingPresetDur3 = "", this._dryingPresetTemp4 = "", this._dryingPresetDur4 = "", this._isOpen = !1, this._handleDryingPreset1 = () => {
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
      if (super.willUpdate(t), t.has("language") && (this._heading = Mn("card.drying_settings.heading", this.language), this._buttonTextPreset = Mn("card.drying_settings.button_preset", this.language), this._buttonTextMinutes = Mn("card.drying_settings.button_minutes", this.language), this._buttonStopDrying = Mn("card.drying_settings.button_stop_drying", this.language)), t.has("box_id") && (1 === this.box_id ? (this._dryingPresetId1 = ua, this._dryingPresetId2 = ga, this._dryingPresetId3 = ma, this._dryingPresetId4 = ba, this._dryingStopId = va) : (this._dryingPresetId1 = oa, this._dryingPresetId2 = la, this._dryingPresetId3 = ca, this._dryingPresetId4 = ha, this._dryingStopId = da)), t.has("hass") || t.has("selectedPrinterDevice") || t.has("box_id")) {
        const t = li(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId1);
        this._hasDryingPreset1 = ci(t), this._dryingPresetTemp1 = String(t.attributes.temperature), this._dryingPresetDur1 = String(t.attributes.duration);
        const e = li(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId2);
        this._hasDryingPreset2 = ci(e), this._dryingPresetTemp2 = String(e.attributes.temperature), this._dryingPresetDur2 = String(e.attributes.duration);
        const i = li(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId3);
        this._hasDryingPreset3 = ci(i), this._dryingPresetTemp3 = String(i.attributes.temperature), this._dryingPresetDur3 = String(i.attributes.duration);
        const r = li(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingPresetId4);
        this._hasDryingPreset4 = ci(r), this._dryingPresetTemp4 = String(r.attributes.temperature), this._dryingPresetDur4 = String(r.attributes.duration);
        const n = li(this.hass, this.printerEntities, this.printerEntityIdPart, this._dryingStopId);
        this._hasDryingStop = ci(n);
      }
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return W`
      <div
        class="ac-modal-container"
        style=${Vn({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${ia(Object.assign({}, aa))}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this._renderCard()}
        </div>
      </div>
    `;
    }
    _renderCard() {
      return W`
      <div>
        <div class="ac-drying-header">${this._heading}</div>
        <div class="ac-drying-buttonscont">
          ${this._hasDryingPreset1 ? W`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset1}>
                    ${this._buttonTextPreset} 1<br />
                    ${this._dryingPresetDur1} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp1}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset2 ? W`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset2}>
                    ${this._buttonTextPreset} 2<br />
                    ${this._dryingPresetDur2} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp2}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset3 ? W`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset3}>
                    ${this._buttonTextPreset} 3<br />
                    ${this._dryingPresetDur3} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp3}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingPreset4 ? W`
                <div class="ac-drying-buttoncont">
                  <ha-control-button @click=${this._handleDryingPreset4}>
                    ${this._buttonTextPreset} 4<br />
                    ${this._dryingPresetDur4} ${this._buttonTextMinutes} @
                    ${this._dryingPresetTemp4}°C
                  </ha-control-button>
                </div>
              ` : J}
          ${this._hasDryingStop ? W`
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
        entity_id: null !== (i = null === (e = ai(this.printerEntities, this.printerEntityIdPart, "button", t)) || void 0 === e ? void 0 : e.entity_id) && void 0 !== i ? i : si(this.printerEntityIdPart, "button", t)
      }).then().catch(t => {});
    }
    static get styles() {
      return p`
      ${ra}

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
  n([_t()], ya.prototype, "hass", void 0), n([_t()], ya.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], ya.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "printer-entities"
  })], ya.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], ya.prototype, "printerEntityIdPart", void 0), n([wt()], ya.prototype, "box_id", void 0), n([wt()], ya.prototype, "_dryingPresetId1", void 0), n([wt()], ya.prototype, "_dryingPresetId2", void 0), n([wt()], ya.prototype, "_dryingPresetId3", void 0), n([wt()], ya.prototype, "_dryingPresetId4", void 0), n([wt()], ya.prototype, "_dryingStopId", void 0), n([wt()], ya.prototype, "_hasDryingPreset1", void 0), n([wt()], ya.prototype, "_hasDryingPreset2", void 0), n([wt()], ya.prototype, "_hasDryingPreset3", void 0), n([wt()], ya.prototype, "_hasDryingPreset4", void 0), n([wt()], ya.prototype, "_hasDryingStop", void 0), n([wt()], ya.prototype, "_dryingPresetTemp1", void 0), n([wt()], ya.prototype, "_dryingPresetDur1", void 0), n([wt()], ya.prototype, "_dryingPresetTemp2", void 0), n([wt()], ya.prototype, "_dryingPresetDur2", void 0), n([wt()], ya.prototype, "_dryingPresetTemp3", void 0), n([wt()], ya.prototype, "_dryingPresetDur3", void 0), n([wt()], ya.prototype, "_dryingPresetTemp4", void 0), n([wt()], ya.prototype, "_dryingPresetDur4", void 0), n([wt()], ya.prototype, "_isOpen", void 0), n([wt()], ya.prototype, "_heading", void 0), n([wt()], ya.prototype, "_buttonTextPreset", void 0), n([wt()], ya.prototype, "_buttonTextMinutes", void 0), n([wt()], ya.prototype, "_buttonStopDrying", void 0), ya = n([Gn("anycubic-printercard-multicolorbox_modal_drying")], ya);
  const fa = t => xa(255, Math.round(Number(t))),
    _a = t => fa(255 * t),
    wa = t => xa(1, t / 255),
    xa = (t, e) => Math.max(0, Math.min(t, e)),
    $a = t => void 0 === t ? 1 : ("string" == typeof t && t.indexOf("%") > 0 && (t = Number(t.split("%")[0]) / 100), t = Number(Number(t).toFixed(3)), isNaN(t) ? 1 : xa(1, t)),
    Ea = {
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
  class Sa {
    constructor(t, e, i, r) {
      return Sa.isBaseConstructor(t) ? (this.r = fa(t.r), this.g = fa(t.g), this.b = fa(t.b), void 0 !== t.a && (this.a = $a(t.a)), this) : Sa.parse(t, e, i, r);
    }
    static parse(t, e, i, r) {
      if (Sa.isBaseConstructor(t)) return new Sa(t);
      if (void 0 !== e && void 0 !== i) {
        let n = fa(t);
        return e = fa(e), i = fa(i), void 0 !== r && (r = $a(r)), new Sa({
          r: n,
          g: e,
          b: i,
          a: r
        });
      }
      if (Array.isArray(t)) return Sa.fromArray(t);
      if ("string" == typeof t) {
        let i;
        if (void 0 !== e && Number(e) <= 1 && Number(e) >= 0 && (i = Number(e)), t.startsWith("#")) return Sa.fromHex(t, i);
        if (Ea[t.toLowerCase()]) return Sa.fromNamed(t, i);
        if (t.startsWith("rgb")) return Sa.fromRgbString(t);
        if ("transparent" === t) {
          let t, e, i, r;
          return t = e = i = r = 0, new Sa({
            r: t,
            g: e,
            b: i,
            a: r
          });
        }
        return null;
      }
      if ("object" == typeof t) {
        if (void 0 !== t.a && (this.a = $a(t.a)), void 0 !== t.h) {
          let e = {};
          if (void 0 !== t.v) e = Sa.fromHsv(t);else {
            if (void 0 === t.l) return Sa.fromArray([0, 0, 0]);
            e = Sa.fromHsl(t);
          }
          return e.a = void 0 !== t.a ? $a(t.a) : void 0, new Sa(e);
        }
        return void 0 !== t.c ? Sa.fromCMYK(t) : this;
      }
      return Sa.fromArray([0, 0, 0]);
    }
    static isBaseConstructor(t) {
      return "object" == typeof t && void 0 !== t.r && void 0 !== t.g && void 0 !== t.b;
    }
    static fromNamed(t, e) {
      return Sa.fromHex(Ea[t.toLowerCase()], e);
    }
    static fromArray(t) {
      t = t.filter(t => "" !== t && isFinite(t));
      const e = {
        r: fa(t[0]),
        g: fa(t[1]),
        b: fa(t[2])
      };
      return void 0 !== t[3] && (e.a = $a(t[3])), new Sa(e);
    }
    static fromHex(t, e) {
      3 !== (t = t.replace("#", "")).length && 4 !== t.length || (t = t.split("").map(t => t + t).join(""));
      let i = t.match(/[A-Za-z0-9]{2}/g).map(t => parseInt(t, 16));
      return 4 === i.length ? i[3] /= 255 : void 0 !== e && (i[3] = e), Sa.fromArray(i);
    }
    static fromRgbString(t) {
      if (t.includes(",")) return Sa.fromArray(t.split("(")[1].split(")")[0].split(","));
      const e = t.replace("/", " ").split("(")[1].replace(")", "").split(" ").filter(t => "" !== t && isFinite(Number(t)));
      return Sa.fromArray(e);
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
        a = i * (1 - n * e),
        o = i * (1 - (1 - n) * e),
        l = [[i, o, s], [a, i, s], [s, i, o], [s, a, i], [o, s, i], [i, s, a]][r].map(t => Math.round(256 * t));
      return new Sa({
        r: fa(l[0]),
        g: fa(l[1]),
        b: fa(l[2])
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
      let a = 0,
        o = 0,
        l = 0;
      return 0 <= t && t < 60 ? (a = r, o = n, l = 0) : 60 <= t && t < 120 ? (a = n, o = r, l = 0) : 120 <= t && t < 180 ? (a = 0, o = r, l = n) : 180 <= t && t < 240 ? (a = 0, o = n, l = r) : 240 <= t && t < 300 ? (a = n, o = 0, l = r) : 300 <= t && t < 360 && (a = r, o = 0, l = n), new Sa({
        r: _a(s + a),
        g: _a(s + o),
        b: _a(s + l)
      });
    }
    static fromCMYK({
      c: t,
      m: e,
      y: i,
      k: r,
      a: n
    }) {
      const s = t => _a(1 - Math.min(1, t / 100 * (1 - r) + r));
      return new Sa({
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
      return t[3] = _a(t[3]), `#${t.map(t => t.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    }
    get hsv() {
      const t = wa(this.r),
        e = wa(this.g),
        i = wa(this.b),
        r = Math.min(t, e, i),
        n = Math.max(t, e, i);
      let s;
      const a = n,
        o = n - r;
      s = 0 === o ? 0 : n === t ? (e - i) / o * 60 % 360 : n === e ? (i - t) / o * 60 + 120 : n === i ? (t - e) / o * 60 + 240 : 0, s < 0 && (s += 360);
      const l = 0 === n ? 0 : 1 - r / n;
      return {
        h: Math.round(s),
        s: Math.round(100 * l),
        v: Math.round(100 * a),
        a: this.alpha
      };
    }
    get hsl() {
      const t = wa(this.r),
        e = wa(this.g),
        i = wa(this.b),
        r = Math.max(t, e, i),
        n = Math.min(t, e, i);
      let s, a;
      const o = (r + n) / 2;
      if (r === n) s = a = 0;else {
        const l = r - n;
        switch (a = o > .5 ? l / (2 - r - n) : l / (r + n), r) {
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
        s: Math.round(100 * a),
        l: Math.round(100 * o),
        a: this.alpha
      };
    }
    get cmyk() {
      let t, e, i, r;
      const n = parseFloat(this.r) / 255,
        s = parseFloat(this.g) / 255,
        a = parseFloat(this.b) / 255;
      return r = 1 - Math.max(n, s, a), 1 === r ? t = e = i = 0 : (t = (1 - n - r) / (1 - r), e = (1 - s - r) / (1 - r), i = (1 - a - r) / (1 - r)), t = Math.round(100 * t), e = Math.round(100 * e), i = Math.round(100 * i), r = Math.round(100 * r), this.alpha ? {
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
      i[3] = _a(i[3]);
      const r = new Sa(t).rgba;
      r[3] = _a(r[3]), e = $a(e);
      const n = i.map((t, i) => {
        const n = r[i],
          s = n < t,
          a = s ? t - n : n - t,
          o = Math.round(a * e);
        return s ? t - o : o + t;
      });
      return n[3] = wa(n[3]), Sa.fromArray(n);
    }
    adjustSatLum(t, e, i) {
      const r = this.hsl;
      let n = r[t],
        s = (i ? n : 100 - n) * e;
      return r[t] = xa(100, i ? n - s : n + s), r.a = this.a, new Sa(r);
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
      return e.h = Math.round(e.h + t) % 360, e.a = this.a, new Sa(e);
    }
    fadeIn(t, e) {
      let i = this.alpha;
      const {
        r,
        g: n,
        b: s
      } = this;
      let a = (1 - i) * t;
      return i = e ? i - a : i + a, Sa({
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
      return void 0 !== this.a && t.push(this.alpha), Sa.fromArray(t);
    }
  }
  const Pa = (t, e, i = "color-update") => {
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
    Ca = (t = 3, e) => {
      let i = 0,
        r = 100,
        n = 50,
        s = null,
        a = !1;
      e && (r = e.s, e.hasOwnProperty("v") ? (s = e.v, n = null, a = !0) : n = e.l);
      const o = [];
      let l, c;
      const h = (t, e) => `${t.css} ${(100 * e).toFixed(1)}%`;
      for (; i < 360;) l = Sa.parse(a ? {
        h: i,
        s: r,
        v: s
      } : {
        h: i,
        s: r,
        l: n
      }), c = i / 360, o.push(h(l, c)), i += t;
      return i = 359, l = Sa.parse(a ? {
        h: i,
        s: r,
        v: s
      } : {
        h: i,
        s: r,
        l: n
      }), c = 1, o.push(h(l, c)), o.join(", ");
    },
    Aa = W`<svg
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
  class Ta extends mt {
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
    static styles = p`
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
        backgroundImage: `linear-gradient(90deg, ${Ca(24)})`
      }, this.width = 400, this.sliderStyle = {
        display: "none"
      };
    }
    firstUpdated() {
      const t = this.renderRoot.querySelector("lit-movable");
      t.onmovestart = () => {
        Pa(this.renderRoot, {
          sliding: !0
        }, "sliding-hue");
      }, t.onmoveend = () => {
        Pa(this.renderRoot, {
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
          backgroundColor: Sa.parse({
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
      return W` <div
      style=${Vn(this.gradient)}
      class="bar"
      @click="${this.selectHue}"
    >
      <lit-movable
        horizontal="${this.sliderBounds.min}, ${this.sliderBounds.max}"
        posLeft="${this.sliderBounds.posLeft}"
      >
        <a class="slider" style=${Vn(this.sliderCss(this.h))}></a>
      </lit-movable>
    </div>`;
    }
  }
  customElements.get("hue-bar") || customElements.define("hue-bar", Ta);
  const ka = p`
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
    Ma = p`
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
    Ha = p`
  color: var(--input-active-color);
  background-color: var(--input-active-bg);
  border-color: var(--input-active-border-color);
  outline: 0;
  box-shadow: var(--input-active-box-shadow);
`,
    Da = p`
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
    ${Ma}
  }
  :host .form-control:focus {
    ${Ha}
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
    ${ka}
    z-index: 0;
  }
`,
    Fa = p`
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
    ${Ma}
  }

  :host .form-control:focus {
    ${Ha}
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
    ${ka}
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  :host div.active .transparent-checks {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
`,
    Ba = {
      r: "R (red) channel",
      g: "G (green) channel",
      b: "B (blue) channel",
      h: "H (hue) channel",
      s: "S (saturation) channel",
      v: "V (value / brightness) channel",
      l: "L (luminosity) channel",
      a: "A (alpha / opacity) channel"
    };
  class Ia extends mt {
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
    static styles = Fa;
    clickPreview(t) {
      const e = Math.max(0, Math.min(t.offsetX, 128));
      let i = Math.round(e / 128 * this.max);
      "a" === this.channel && (i = Number((e / 127).toFixed(2))), this.valueChange(null, i), this.setActive(!1);
    }
    valueChange = (t, e = null) => {
      e = e ?? Number(this.renderRoot.querySelector("input").value), "a" === this.channel && (e /= 100), this.c[this.channel] = e;
      const i = Sa.parse(this.c);
      "rgb" !== this.group && (i.hsx = this.c), this.c = "rgb" === this.group ? this.color.rgbObj : this.isHsl ? this.color.hsl : this.color.hsv, Pa(this.renderRoot, i);
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
        a = 255;
      if ("rgb" !== e || "a" === i) {
        if ("h" === i) return a = this.max = 359, void (this.previewGradient = {
          "--preview": `linear-gradient(90deg, ${Ca(24, t)})`,
          "--pct": t.h / a * 100 + "%"
        });
        a = r ? 1 : 100;
      }
      if (this.max = a, n = {
        ...t
      }, s = n, n[this.channel] = 0, n = Sa.parse(n), s[this.channel] = a, s = Sa.parse(s), "l" === this.channel) {
        const e = {
          ...t
        };
        e.l = 50, this.previewGradient = {
          "--preview": `linear-gradient(90deg, ${n.hex}, ${Sa.parse(e).hex}, ${s.hex})`,
          "--pct": t[this.channel] / a * 100 + "%"
        };
      } else this.previewGradient = {
        "--preview": `linear-gradient(90deg, ${r ? n.css : n.hex}, ${r ? s.css : s.hex})`,
        "--pct": t[this.channel] / a * 100 + "%"
      };
    }
    willUpdate(t) {
      this.setPreviewGradient();
    }
    render() {
      const t = "a" === this.channel ? W`<div class="transparent-checks"></div>` : null,
        e = "a" === this.channel ? 100 : this.max;
      return W` <div class="${Un({
        active: this.active
      })}">
      <label for="channel_${this.ch}">${this.channel.toUpperCase()}</label>
      <input
        id="channel_${this.ch}"
        aria-label="${Ba[this.channel]}"
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
        style="${Vn(this.previewGradient)}"
        @mousedown="${this.clickPreview}"
      >
        <div class="pct"></div>
        ${t}
      </div>
    </div>`;
    }
  }
  customElements.get("color-input-channel") || customElements.define("color-input-channel", Ia);
  class La extends mt {
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
    static styles = p`
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
      Pa(this.renderRoot, t);
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
          isHsl: a,
          color: o
        } = this;
      let l = (n - r) / n;
      l = Math.round(100 * l);
      const c = Math.round(i / n * 100),
        h = {
          h: s.h,
          s: c,
          [a ? "l" : "v"]: l
        },
        d = a ? Sa.fromHsl(h) : Sa.fromHsv(h);
      this.setCircleCss(i, r), d.a = o.alpha, d.hsx = h, d.fromHSLCanvas = !0, this.setColor(d);
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
      const a = r;
      (t = t ?? n ? a.hsl : a.hsv).w = n ? t.l : t.v;
      const {
          h: o,
          s: l,
          w: c
        } = t,
        h = this.hsw = {
          h: o,
          s: l,
          w: c
        },
        d = s / 100,
        p = n ? (t, e, i) => `hsl(${t}, ${e}%, ${100 - i}%)` : (t, e, i) => Sa.fromHsv({
          h: t,
          s: e,
          v: 100 - i
        }).hex,
        u = !1 === e ? 4 : 1;
      for (let t = 0; t < 100; t += u) for (let e = 0; e < 100; e += u) i.fillStyle = p(o, t, e), i.fillRect(t, e, t + u, e + u);
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
      return W` <div
      class="outer"
      @click="${this.pickCoord}"
      style="${Vn(t)}"
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
  customElements.get("hsl-canvas") || customElements.define("hsl-canvas", La);
  const Na = t => isFinite(t) ? Number(t) : Number(t.replace(/[^0-9.\-]/g, "")),
    Oa = t => (t = Number(t), (isNaN(t) || [void 0, null].includes(t)) && (t = 0), t);
  class za {
    constructor(t, e) {
      this.x = Oa(t), this.y = Oa(e);
    }
    static fromPointerEvent(t) {
      const {
        pageX: e,
        pageY: i
      } = t;
      return new za(e, i);
    }
    static fromElementStyle(t) {
      const e = Na(t.style.left ?? 0),
        i = Na(t.style.top ?? 0);
      return new za(e, i);
    }
    static fromObject({
      x: t,
      y: e
    }) {
      return new za(t, e);
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
  class Ua {
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
      if (!t) return new Ua();
      if ("null" === t) return new Ua(0, 0);
      const [i, r] = t.split(",").map(t => Number(t.trim()) + e),
        n = new Ua(i, r);
      return n.attr = t, n;
    }
  }
  class Ra extends mt {
    _target;
    _targetSelector = null;
    _boundsX = new Ua();
    _boundsY = new Ua();
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
      this._boundsX = Ua.fromString(t, Na(this.target?.style.left ?? 0)), this.bounds.left = this._boundsX;
    }
    get boundsY() {
      return this._boundsY;
    }
    set boundsY(t) {
      this._boundsY = Ua.fromString(t, Na(this.target?.style.top ?? 0)), this.bounds.top = this._boundsY;
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
          offsetTop: a,
          style: {
            left: o,
            top: l
          }
        } = this.target;
      i.classList.add("--movable-base"), this.renderRoot.addEventListener("pointerdown", t => this.pointerdown(t)), i.style.position = "absolute", i.style.cursor = "pointer", n ? i.style.left = n + "px" : !o && s && (i.style.left = s + "px", e.left.constrained && (e.left.min = e.left.max = s)), r ? i.style.top = r + "px" : !l && a && (i.style.top = a + "px", e.top.constrained && (e.top.min = e.top.max = a));
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
      e.mouseCoord = za.fromPointerEvent(t), e.startCoord = za.fromElementStyle(i), e.moveDist = new za(0, 0), e.totalDist = new za(0, 0), e.clickOffset = (t => {
        const e = za.fromPointerEvent(t),
          i = t.target.getBoundingClientRect(),
          r = e.x - (i.left + document.body.scrollLeft),
          n = e.y - (i.top + document.body.scrollTop);
        return new za(r, n);
      })(t), e.coords = za.fromObject(e.startCoord), e.maxX = isFinite(r.left.min) && isFinite(r.left.max) ? r.left.min + r.left.max : 1 / 0, e.maxY = isFinite(r.top.min) && isFinite(r.top.max) ? r.top.min + r.top.max : 1 / 0, this.isMoving = !0, this.reposition(!0), this.eventBroker("movestart", t);
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
      const e = za.fromPointerEvent(t),
        i = this.moveState,
        {
          grid: r,
          bounds: n,
          shiftBehavior: s,
          boundsX: a,
          boundsY: o
        } = this;
      if (i.moveDist = za.fromObject({
        x: e.x - i.mouseCoord.x,
        y: e.y - i.mouseCoord.y
      }), i.mouseCoord = e, i.totalDist = za.fromObject({
        x: i.totalDist.x + i.moveDist.x,
        y: i.totalDist.y + i.moveDist.y
      }), i.coords = za.fromObject({
        x: Math.round(i.totalDist.x / r) * r + i.startCoord.x,
        y: Math.round(i.totalDist.y / r) * r + i.startCoord.y
      }), s && t.shiftKey && a.unconstrained && o.unconstrained) {
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
      return W`<slot></slot>`;
    }
  }
  window.customElements.get("lit-movable") || window.customElements.define("lit-movable", Ra);
  class ja extends mt {
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
    static styles = Da;
    _color;
    constructor() {
      super(), this._color = Sa.parse(Ea.slateblue), this.isHsl = !0, this.buttonDisabled = !1;
    }
    firstUpdated(t) {
      this.debounceMode = !1, t.has("value") && (this.color = Sa.parse(this.value));
    }
    get color() {
      return this._color;
    }
    set color(t) {
      (t = t.hsx ? t : t.rgba ? Sa.parse(...t.rgba) : Sa.parse(t)) && (this.hex = t.hex, this._color = t, Pa(this.renderRoot, t, "colorchanged"));
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
        i = Sa.parse(e);
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
      Pa(this.renderRoot, this.color, "colorpicked");
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
      return W` <div class="outer">
      <hue-bar
        @sliding-hue="${this.setSliding}"
        hue="${this.color.hsx ? this.color.hsx.h : this.color.hsl.h}"
        @hue-update="${this.setHue}"
        .color="${this.color}"
      ></hue-bar>
      <div class="d-flex">
        <div class="col w-30">
          ${["r", "g", "b", "a"].map(t => W`
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
              <sub class="copied" style="${Vn(n)}"
                >copied <em>${this.copied}</em></sub
              >
              ${this.copied ? W`` : W`
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
                        ${Aa}
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
                        ${Aa}
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
                        ${Aa}
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
              ${Aa}
              <span>&#11205;</span>
            </a>
          </div>
        </div>
        <div class="col w-30">
          ${t.map(t => W`
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
              class="${Un(e)}"
              @click="${() => this.setHsl(!1)}"
              >HSV</a
            ><a
              title="Use hue / saturation / luminosity mode"
              class="${Un(i)}"
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
                <span style="${Vn(r)}"></span>
                <span class="checky"></span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>`;
    }
  }
  window.customElements.get("color-picker") || window.customElements.define("color-picker", ja);
  const Va = {
    keyframeOptions: {
      duration: 250,
      direction: "alternate",
      easing: "ease-in-out"
    },
    properties: ["height", "opacity", "scale"]
  };
  let Ga = class extends mt {
    constructor() {
      super(...arguments), this.box_id = 0, this.spoolList = [], this.spool_index = -1, this._isOpen = !1, this._changingSlot = !1, this._colourPresetChange = t => {
        this.color = t.currentTarget.preset, this._elColorPicker && (this._elColorPicker.color = this.color);
      }, this._handleModalEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.modalOpen && (this._isOpen = !0, this.box_id = Number(e.detail.box_id), this.spool_index = Number(e.detail.spool_index), this.material_type = Ci(e.detail.material_type), this.color = e.detail.color);
      }, this._handleDropdownEvent = t => {
        const e = t;
        e.stopPropagation(), e.detail.value && (this.material_type = Ci(e.detail.value));
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
      super.willUpdate(t), t.has("language") && (this._heading = Mn("card.spool_settings.heading", this.language), this._labelSelectMaterial = Mn("card.spool_settings.label_select_material", this.language), this._labelSelectColour = Mn("card.spool_settings.label_select_colour", this.language), this._buttonSave = Mn("common.actions.save", this.language));
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return W`
      <div
        class="ac-modal-container"
        style=${Vn({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${ia(Object.assign({}, Va))}
      >
        <span class="ac-modal-close" @click=${this._closeModal}>&times;</span>
        <div class="ac-modal-card" @click=${this._cardClick}>
          ${this.color ? this._renderCard() : J}
        </div>
      </div>
    `;
    }
    _renderCard() {
      return this.spool_index >= 0 ? W`
          <div>
            <div class="ac-slot-title">
              ${this._heading}: ${this.spool_index + 1}
            </div>
            <div>
              <div>
                <p class="ac-modal-label">${this._labelSelectMaterial}:</p>
                <anycubic-ui-select-dropdown
                  .availableOptions=${Ge}
                  .placeholder=${Ge.PLA}
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
      return W`
      <div>
        <p class="ac-modal-label">Choose Preset Colour:</p>
        <div class="ac-mcb-presets">
          ${this.slotColors ? ys(this.slotColors, (t, e) => W`
                  <div
                    class="ac-mcb-preset-color"
                    style=${Vn({
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
        this._changingSlot = !0, this.hass.callService(De, t, {
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
      return p`
      ${ra}

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
  n([$t("color-picker")], Ga.prototype, "_elColorPicker", void 0), n([_t()], Ga.prototype, "hass", void 0), n([_t()], Ga.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], Ga.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "slot-colors"
  })], Ga.prototype, "slotColors", void 0), n([wt()], Ga.prototype, "box_id", void 0), n([wt()], Ga.prototype, "spoolList", void 0), n([wt()], Ga.prototype, "spool_index", void 0), n([wt()], Ga.prototype, "material_type", void 0), n([wt()], Ga.prototype, "color", void 0), n([wt()], Ga.prototype, "_isOpen", void 0), n([wt()], Ga.prototype, "_heading", void 0), n([wt()], Ga.prototype, "_labelSelectMaterial", void 0), n([wt()], Ga.prototype, "_labelSelectColour", void 0), n([wt()], Ga.prototype, "_buttonSave", void 0), n([wt()], Ga.prototype, "_changingSlot", void 0), Ga = n([Gn("anycubic-printercard-multicolorbox_modal_spool")], Ga);
  const Za = {
    keyframeOptions: {
      duration: 250,
      direction: "alternate",
      easing: "ease-in-out"
    },
    properties: ["height", "opacity", "scale"]
  };
  let Ya = class extends mt {
    constructor() {
      super(...arguments), this.availableSpeedModes = {}, this.isFDM = !1, this.currentSpeedModeKey = 0, this.currentSpeedModeDescr = void 0, this._userEditSpeedMode = !1, this.currentFanSpeed = 0, this._userEditFanSpeed = !1, this.currentAuxFanSpeed = 0, this._userEditAuxFanSpeed = !1, this.currentBoxFanSpeed = 0, this._userEditBoxFanSpeed = !1, this.currentTargetTempNozzle = 0, this.minTargetTempNozzle = 0, this.maxTargetTempNozzle = 0, this._userEditTargetTempNozzle = !1, this.currentTargetTempHotbed = 0, this.minTargetTempHotbed = 0, this.maxTargetTempHotbed = 0, this._userEditTargetTempHotbed = !1, this._isOpen = !1, this._changingSettings = !1, this._setConfirmationMode = t => {
        this._confirmationType = t.currentTarget.confirmation_type, this._confirmMessage = Mn("card.print_settings.confirm_message", this.language, "action", Mn("common.actions." + this._confirmationType, this.language));
      }, this._handleConfirmApprove = () => {
        switch (this._confirmationType) {
          case Ze.PAUSE:
            this._pressHassButton("pause_print");
            break;
          case Ze.RESUME:
            this._pressHassButton("resume_print");
            break;
          case Ze.CANCEL:
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
      if (super.willUpdate(t), t.has("language") && (this._labelNozzleTemperature = Mn("card.print_settings.label_nozzle_temp", this.language), this._labelHotbedTemperature = Mn("card.print_settings.label_hotbed_temp", this.language), this._labelFanSpeed = Mn("card.print_settings.label_fan_speed", this.language), this._labelAuxFanSpeed = Mn("card.print_settings.label_aux_fan_speed", this.language), this._labelBoxFanSpeed = Mn("card.print_settings.label_box_fan_speed", this.language), this._buttonYes = Mn("common.actions.yes", this.language), this._buttonNo = Mn("common.actions.no", this.language), this._buttonPrintPause = Mn("card.print_settings.print_pause", this.language), this._buttonPrintResume = Mn("card.print_settings.print_resume", this.language), this._buttonPrintCancel = Mn("card.print_settings.print_cancel", this.language), this._buttonSaveSpeedMode = Mn("card.print_settings.save_speed_mode", this.language), this._buttonSaveTargetNozzle = Mn("card.print_settings.save_target_nozzle", this.language), this._buttonSaveTargetHotbed = Mn("card.print_settings.save_target_hotbed", this.language), this._buttonSaveFanSpeed = Mn("card.print_settings.save_fan_speed", this.language), this._buttonSaveAuxFanSpeed = Mn("card.print_settings.save_aux_fan_speed", this.language), this._buttonSaveBoxFanSpeed = Mn("card.print_settings.save_box_fan_speed", this.language)), t.has("hass") || t.has("printerEntities") || t.has("printerEntityIdPart")) {
        if (this.isFDM = mi(this.hass, this.printerEntities, this.printerEntityIdPart), this._userEditFanSpeed || (this.currentFanSpeed = Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "fan_speed", 0).state)), !this._userEditTargetTempNozzle) {
          const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "target_nozzle_temperature", 0, {
            limit_min: 0,
            limit_max: 0
          });
          this.currentTargetTempNozzle = Number(t.state), this.minTargetTempNozzle = t.attributes.limit_min, this.maxTargetTempNozzle = t.attributes.limit_max;
        }
        if (!this._userEditTargetTempHotbed) {
          const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "target_hotbed_temperature", 0, {
            limit_min: 0,
            limit_max: 0
          });
          this.currentTargetTempHotbed = Number(t.state), this.minTargetTempHotbed = t.attributes.limit_min, this.maxTargetTempHotbed = t.attributes.limit_max;
        }
        if (!this._userEditSpeedMode) {
          const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_speed_mode", "", {
            available_modes: [],
            job_speed_mode_code: -1
          });
          this.availableSpeedModes = Pi(t), this.currentSpeedModeKey = t.attributes.print_speed_mode_code, this.currentSpeedModeDescr = this.currentSpeedModeKey >= 0 && this.currentSpeedModeKey in this.availableSpeedModes ? this.availableSpeedModes[this.currentSpeedModeKey] : void 0;
        }
      }
    }
    update(t) {
      super.update(t), this._isOpen ? this.style.display = "block" : this.style.display = "none";
    }
    render() {
      return W`
      <div
        class="ac-modal-container"
        style=${Vn({
        height: "auto",
        opacity: 1,
        scale: 1
      })}
        ${ia(Object.assign({}, Za))}
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
      return W`
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
      return W`
      <div>
        <div class="ac-settings-header">Print Settings</div>
        <div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${Ze.PAUSE}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintPause}
            </ha-control-button>
          </div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${Ze.RESUME}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintResume}
            </ha-control-button>
          </div>
          <div class="ac-settings-row ac-settings-buttonrow">
            <ha-control-button
              .confirmation_type=${Ze.CANCEL}
              @click=${this._setConfirmationMode}
            >
              ${this._buttonPrintCancel}
            </ha-control-button>
          </div>
          ${this.isFDM ? W`
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
        entity_id: si(this.printerEntityIdPart, "button", t)
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
        this._changingSettings = !0, this.hass.callService(De, t, {
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
      return p`
      ${ra}

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
  n([_t()], Ya.prototype, "hass", void 0), n([_t()], Ya.prototype, "language", void 0), n([_t({
    attribute: "selected-printer-device"
  })], Ya.prototype, "selectedPrinterDevice", void 0), n([_t({
    attribute: "printer-entities"
  })], Ya.prototype, "printerEntities", void 0), n([_t({
    attribute: "printer-entity-id-part"
  })], Ya.prototype, "printerEntityIdPart", void 0), n([wt()], Ya.prototype, "availableSpeedModes", void 0), n([wt()], Ya.prototype, "isFDM", void 0), n([wt()], Ya.prototype, "currentSpeedModeKey", void 0), n([wt()], Ya.prototype, "currentSpeedModeDescr", void 0), n([wt()], Ya.prototype, "_userEditSpeedMode", void 0), n([wt()], Ya.prototype, "currentFanSpeed", void 0), n([wt()], Ya.prototype, "_userEditFanSpeed", void 0), n([wt()], Ya.prototype, "currentAuxFanSpeed", void 0), n([wt()], Ya.prototype, "_userEditAuxFanSpeed", void 0), n([wt()], Ya.prototype, "currentBoxFanSpeed", void 0), n([wt()], Ya.prototype, "_userEditBoxFanSpeed", void 0), n([wt()], Ya.prototype, "currentTargetTempNozzle", void 0), n([wt()], Ya.prototype, "minTargetTempNozzle", void 0), n([wt()], Ya.prototype, "maxTargetTempNozzle", void 0), n([wt()], Ya.prototype, "_userEditTargetTempNozzle", void 0), n([wt()], Ya.prototype, "currentTargetTempHotbed", void 0), n([wt()], Ya.prototype, "minTargetTempHotbed", void 0), n([wt()], Ya.prototype, "maxTargetTempHotbed", void 0), n([wt()], Ya.prototype, "_userEditTargetTempHotbed", void 0), n([wt()], Ya.prototype, "_confirmationType", void 0), n([wt()], Ya.prototype, "_isOpen", void 0), n([wt()], Ya.prototype, "_confirmMessage", void 0), n([wt()], Ya.prototype, "_labelNozzleTemperature", void 0), n([wt()], Ya.prototype, "_labelHotbedTemperature", void 0), n([wt()], Ya.prototype, "_labelFanSpeed", void 0), n([wt()], Ya.prototype, "_labelAuxFanSpeed", void 0), n([wt()], Ya.prototype, "_labelBoxFanSpeed", void 0), n([wt()], Ya.prototype, "_buttonYes", void 0), n([wt()], Ya.prototype, "_buttonNo", void 0), n([wt()], Ya.prototype, "_buttonPrintPause", void 0), n([wt()], Ya.prototype, "_buttonPrintResume", void 0), n([wt()], Ya.prototype, "_buttonPrintCancel", void 0), n([wt()], Ya.prototype, "_buttonSaveSpeedMode", void 0), n([wt()], Ya.prototype, "_buttonSaveTargetNozzle", void 0), n([wt()], Ya.prototype, "_buttonSaveTargetHotbed", void 0), n([wt()], Ya.prototype, "_buttonSaveFanSpeed", void 0), n([wt()], Ya.prototype, "_buttonSaveAuxFanSpeed", void 0), n([wt()], Ya.prototype, "_buttonSaveBoxFanSpeed", void 0), n([wt()], Ya.prototype, "_changingSettings", void 0), Ya = n([Gn("anycubic-printercard-printsettings_modal")], Ya);
  const Ka = Ei();
  let qa = class extends mt {
    constructor() {
      super(...arguments), this.monitoredStats = Ka, this.round = !0, this.temperatureUnit = Ie.C, this.mediaView = Re.Auto, this.printerArt = je.Auto, this.noCamera = !1, this.showControls = !0, this.showMoveButtons = !1, this.isHidden = !1, this.isPrinting = !1, this.isPaused = !1, this.hiddenOverride = !1, this.hasColorbox = !1, this.hasSecondaryColorbox = !1, this.lightIsOn = !1, this.statusColor = "#ffc107", this.printStateString = "unknown", this.progressPercent = 0, this._togglingLight = !1, this._togglingPower = !1, this._pressButtonEvent = t => {
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
        Fe(this._printerCardContainer, "ac-printset-modal", {
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
      var e, i, r, n;
      if (super.willUpdate(t), t.has("language") && (this._buttonPrintSettings = Mn("card.buttons.print_settings", this.language)), t.has("monitoredStats") && (this.monitoredStats = (i = this.monitoredStats, r = Ka, void 0 === i ? r : i)), t.has("selectedPrinterID") && (this.printerEntities = ii(this.hass, this.selectedPrinterID), this.printerEntityIdPart = oi(this.printerEntities)), t.has("hass") || t.has("alwaysShow") || t.has("hiddenOverride") || t.has("cameraEntityId") || t.has("selectedPrinterID")) {
        this.progressPercent = this._percentComplete(), this.hasColorbox = "active" === di(this.hass, this.printerEntities, this.printerEntityIdPart, "ace_spools", "inactive").state, this.hasSecondaryColorbox = "active" === di(this.hass, this.printerEntities, this.printerEntityIdPart, "secondary_ace_spools", "inactive").state, this.camera = function (t, e) {
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
        }(this.hass, this.printerEntities), this.cameraEntityId), this.lightIsOn = Qe(this.hass, {
          entity_id: null !== (e = this.lightEntityId) && void 0 !== e ? e : ""
        }, !0, !1);
        const t = di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state", "unknown").state.toLowerCase(),
          i = "unavailable" !== t && "unknown" !== t;
        this.printStateString = i ? t : this._printerAvailability(), this.isPrinting = i && yi(t), this.isPaused = "paused" === t, this.isHidden = !this.alwaysShow && !this.hiddenOverride && !this.isPrinting, this.statusColor = "preheating" === (n = this.printStateString) || "busy" === n ? "#ffc107" : yi(n) ? "#4caf50" : "unknown" === n ? "#f44336" : "operational" === n || "finished" === n || "available" === n || "idle" === n || "free" === n ? "#00bcd4" : "#f44336";
      }
    }
    render() {
      return W`
      <ha-card class="ac-printer-card">
        ${this._renderHeader()}
        <div
          class="ac-body ${Un({
        "ac-body-hidden": this.isHidden
      })}"
          aria-hidden=${this.isHidden ? "true" : "false"}
        >
          <div
            class="ac-main ${Un({
        "ac-main-stacked": !!this.vertical
      })}"
            style=${Vn(this._mainColumnStyles())}
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
      return W`
      <div class="ac-header">
        <button
          class="ac-header-identity"
          @click=${this._toggleHiddenOveride}
          title=${this.alwaysShow ? "" : "Show or hide the card body"}
        >
          <span class="ac-status-dot" style=${Vn(i)}></span>
          <span class="ac-header-text">
            <span class="ac-header-name"
              >${null !== (e = null === (t = this.selectedPrinterDevice) || void 0 === t ? void 0 : t.name) && void 0 !== e ? e : "Anycubic printer"}</span
            >
            <span class="ac-header-state"
              >${qe(this.printStateString)}</span
            >
          </span>
        </button>
        <div class="ac-header-actions">
          ${this.lightEntityId ? W`
                <button
                  class="ac-icon-button ${Un({
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
          ${this.powerEntityId ? W`
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
      return this.mediaView === Re.None ? J : W`
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
        e = ei(this.hass, this.printerEntities, "job_current_layer"),
        i = ei(this.hass, this.printerEntities, "job_total_layers");
      return W`
      <div class="ac-progress">
        <div class="ac-progress-head">
          <span class="ac-progress-pct"
            >${this.round ? Math.round(t) : t}%</span
          >
          ${void 0 !== e && void 0 !== i ? W`<span class="ac-progress-layers"
                >Layer ${e} / ${i}</span
              >` : J}
        </div>
        <div class="ac-progress-track">
          <div
            class="ac-progress-fill"
            style=${Vn({
        width: `${t}%`,
        "background-color": this.statusColor
      })}
          ></div>
        </div>
      </div>
    `;
    }
    _renderStats() {
      return W`
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
      return this.isPrinting && (t.push(this.isPaused ? this._renderActionButton("Resume", In, "resume_print") : this._renderActionButton("Pause", "M14,19H18V5H14M6,19H10V5H6V19Z", "pause_print")), t.push(this._renderActionButton("Cancel", "M18,18H6V6H18V18Z", "cancel_print", !0))), (this.showSettingsButton || this.isPrinting) && t.push(W`
        <button class="ac-button" @click=${this._openPrintSettingsModal}>
          <ha-svg-icon .path=${"M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"}></ha-svg-icon>
          <span>${this._buttonPrintSettings}</span>
        </button>
      `), t.length ? W`<div class="ac-controls">${t}</div>` : J;
    }
    _renderActionButton(t, e, i, r = !1) {
      const n = Je(this.printerEntities, i),
        s = n ? this.hass.states[n] : void 0,
        a = !n || "unavailable" === (null == s ? void 0 : s.state);
      return W`
      <button
        class="ac-button ${Un({
        "ac-button-danger": r
      })}"
        .disabled=${a}
        .entityId=${n}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${e}></ha-svg-icon>
        <span>${t}</span>
      </button>
    `;
    }
    _renderMove() {
      return this.showMoveButtons ? W`<div class="ac-move-panel">${this._renderMoveSection()}</div>` : J;
    }
    _renderSections() {
      var t;
      const e = null !== (t = this.sections) && void 0 !== t ? t : [Ve.Filament],
        i = [];
      return e.includes(Ve.Filament) && this.hasColorbox && i.push(this._renderSection(Ve.Filament, "Filament", this._renderFilamentSection())), e.includes(Ve.Insights) && i.push(this._renderSection(Ve.Insights, "Insights", this._renderInsightsSection())), i.length ? W`${i}` : J;
    }
    _renderSection(t, e, i) {
      const r = this._openSection === t;
      return W`
      <div class="ac-section">
        <button
          class="ac-section-head"
          aria-expanded=${r ? "true" : "false"}
          .sectionKey=${t}
          @click=${this._toggleSection}
        >
          <span>${e}</span>
          <ha-svg-icon
            class="ac-section-chevron ${Un({
        "ac-section-chevron-open": r
      })}"
            .path=${Hn}
          ></ha-svg-icon>
        </button>
        ${r ? W`<div class="ac-section-body">${i}</div>` : J}
      </div>
    `;
    }
    _renderFilamentSection() {
      return W`
      <anycubic-printercard-multicolorbox_view
        .hass=${this.hass}
        .language=${this.language}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .box_id=${0}
      ></anycubic-printercard-multicolorbox_view>
      ${this.hasSecondaryColorbox ? W`
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
      const i = Je(this.printerEntities, "axis_step"),
        r = i ? this.hass.states[i] : void 0,
        n = "on" === (null === (t = ti(this.hass, this.printerEntities, "axis_moving")) || void 0 === t ? void 0 : t.state),
        s = "on" === (null === (e = ti(this.hass, this.printerEntities, "axis_move_failed")) || void 0 === e ? void 0 : e.state);
      return W`
      ${r ? W`
            <div class="ac-step-segmented">
              ${this._renderStepOptions(i, r)}
            </div>
          ` : J}
      <div class="ac-move">
        <div class="ac-move-col">
          ${this._renderSquareButton("axis_home_all", Dn, "Home all axes")}
          ${this._renderSquareButton("axis_motors_off", "M2.5,3.77L6.87,8.14L5,10V13H3V10H1V18H3V15H5V18H8L10,20H18V19.27L21.23,22.5L22.5,21.22L3.78,2.5L2.5,3.77M16,18H11L9,16H7V11L8,10H8.73L16,17.27V18M23,9V19H22.82L16,12.18V10H13.82L7.82,4H15V6H12V8H18V12H20V9H23Z", "Release motors")}
        </div>

        <div class="ac-dial">
          ${this._renderWedge("axis_move_y_plus", Bn, "Y+", "up")}
          ${this._renderWedge("axis_move_x_minus", "M14,7L9,12L14,17V7Z", "X-", "left")}
          ${this._renderWedge("axis_move_x_plus", "M10,17L15,12L10,7V17Z", "X+", "right")}
          ${this._renderWedge("axis_move_y_minus", Fn, "Y-", "down")}
          ${this._renderDialCentre()}
        </div>

        <div class="ac-move-col">
          ${this._renderSquareButton("axis_move_z_plus", Bn, "Z up", "Z+")}
          ${this._renderSquareButton("axis_home_z", Dn, "Home Z", "", !0)}
          ${this._renderSquareButton("axis_move_z_minus", Fn, "Z down", "Z-")}
        </div>
      </div>
      ${n ? W`<p class="ac-note">Moving…</p>` : s ? W`<p class="ac-note ac-note-warn">
              Last move was refused. Z has to be homed on its own before it will
              move.
            </p>` : J}
    `;
    }
    _renderWedge(t, e, i, r) {
      const n = Je(this.printerEntities, t),
        s = n ? this.hass.states[n] : void 0,
        a = !n || "unavailable" === (null == s ? void 0 : s.state);
      return W`
      <button
        class="ac-wedge ac-wedge-${r}"
        .disabled=${a}
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
      const t = Je(this.printerEntities, "axis_home_xy"),
        e = t ? this.hass.states[t] : void 0,
        i = !t || "unavailable" === (null == e ? void 0 : e.state);
      return W`
      <button
        class="ac-dial-centre"
        .disabled=${i}
        title="Home X and Y"
        aria-label="Home X and Y"
        .entityId=${t}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${Dn}></ha-svg-icon>
      </button>
    `;
    }
    _renderSquareButton(t, e, i, r = "", n = !1) {
      const s = Je(this.printerEntities, t),
        a = s ? this.hass.states[s] : void 0,
        o = !s || "unavailable" === (null == a ? void 0 : a.state);
      return W`
      <button
        class="ac-square ${Un({
        "ac-square-accent": n
      })}"
        .disabled=${o}
        title=${i}
        aria-label=${i}
        .entityId=${s}
        @click=${this._pressButtonEvent}
      >
        ${r ? W`<span class="ac-square-label">${r}</span>` : J}
        <ha-svg-icon .path=${e}></ha-svg-icon>
      </button>
    `;
    }
    _renderStepOptions(t, e) {
      var i;
      return (null !== (i = e.attributes.options) && void 0 !== i ? i : []).map(i => W`
        <button
          class="ac-chip-button ${Un({
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
          const i = ei(this.hass, this.printerEntities, t);
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
          const e = ei(this.hass, this.printerEntities, t);
          return void 0 === e ? void 0 : `${Math.round(e)} g`;
        };
      r("This job", n("job_cost")), r("Last job", n("last_job_cost")), r("Filament spend", n("filament_cost_total")), r("Job needs", s("job_filament_required")), r("Shortfall", s("job_filament_shortfall"));
      const a = ei(this.hass, this.printerEntities, "nozzle_wear_percent");
      r("Nozzle wear", void 0 === a ? void 0 : `${a.toFixed(1)}%`), r("Spools left", s("spool_inventory_remaining"));
      const o = ti(this.hass, this.printerEntities, "job_filament_insufficient");
      return i.length ? W`
      ${"on" === (null == o ? void 0 : o.state) ? W`<p class="ac-note ac-note-warn">
            Not enough filament loaded to finish this job.
          </p>` : J}
      <div class="ac-insights">${this._renderInsightRows(i)}</div>
    ` : W`<p class="ac-note">
        Nothing to report yet. Cost and forecast figures appear once a job has
        run and spool weights are set.
      </p>`;
    }
    _renderInsightRows(t) {
      return t.map(t => W`
        <div class="ac-insight">
          <span class="ac-insight-label">${t.label}</span>
          <span class="ac-insight-value">${t.value}</span>
        </div>
      `);
    }
    _printerAvailability() {
      const t = ti(this.hass, this.printerEntities, "printer_online");
      if ("off" === (null == t ? void 0 : t.state)) return "offline";
      return di(this.hass, this.printerEntities, this.printerEntityIdPart, "current_status", "unknown").state.toLowerCase();
    }
    _percentComplete() {
      return Number(di(this.hass, this.printerEntities, this.printerEntityIdPart, "job_progress", -1).state);
    }
    static get styles() {
      return p`
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
  n([$t(".ac-printer-card")], qa.prototype, "_printerCardContainer", void 0), n([_t()], qa.prototype, "hass", void 0), n([_t()], qa.prototype, "language", void 0), n([_t({
    attribute: "monitored-stats"
  })], qa.prototype, "monitoredStats", void 0), n([_t({
    attribute: "selected-printer-id"
  })], qa.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], qa.prototype, "selectedPrinterDevice", void 0), n([_t({
    type: Boolean
  })], qa.prototype, "round", void 0), n([_t({
    type: Boolean
  })], qa.prototype, "use_24hr", void 0), n([_t({
    attribute: "show-settings-button",
    type: Boolean
  })], qa.prototype, "showSettingsButton", void 0), n([_t({
    attribute: "always-show",
    type: Boolean
  })], qa.prototype, "alwaysShow", void 0), n([_t({
    attribute: "temperature-unit",
    type: String
  })], qa.prototype, "temperatureUnit", void 0), n([_t({
    attribute: "light-entity-id",
    type: String
  })], qa.prototype, "lightEntityId", void 0), n([_t({
    attribute: "power-entity-id",
    type: String
  })], qa.prototype, "powerEntityId", void 0), n([_t({
    attribute: "camera-entity-id",
    type: String
  })], qa.prototype, "cameraEntityId", void 0), n([_t({
    type: Boolean
  })], qa.prototype, "vertical", void 0), n([_t({
    attribute: "scale-factor"
  })], qa.prototype, "scaleFactor", void 0), n([_t({
    attribute: "slot-colors"
  })], qa.prototype, "slotColors", void 0), n([_t({
    attribute: "media-view"
  })], qa.prototype, "mediaView", void 0), n([_t({
    attribute: "printer-art"
  })], qa.prototype, "printerArt", void 0), n([_t({
    attribute: "no-camera",
    type: Boolean
  })], qa.prototype, "noCamera", void 0), n([_t({
    attribute: "show-controls",
    type: Boolean
  })], qa.prototype, "showControls", void 0), n([_t({
    attribute: "show-move-buttons",
    type: Boolean
  })], qa.prototype, "showMoveButtons", void 0), n([_t({
    attribute: !1
  })], qa.prototype, "sections", void 0), n([wt()], qa.prototype, "isHidden", void 0), n([wt()], qa.prototype, "isPrinting", void 0), n([wt()], qa.prototype, "isPaused", void 0), n([wt()], qa.prototype, "hiddenOverride", void 0), n([wt()], qa.prototype, "hasColorbox", void 0), n([wt()], qa.prototype, "hasSecondaryColorbox", void 0), n([wt()], qa.prototype, "lightIsOn", void 0), n([wt()], qa.prototype, "statusColor", void 0), n([wt()], qa.prototype, "printStateString", void 0), n([wt()], qa.prototype, "printerEntities", void 0), n([wt()], qa.prototype, "printerEntityIdPart", void 0), n([wt()], qa.prototype, "progressPercent", void 0), n([wt()], qa.prototype, "camera", void 0), n([wt()], qa.prototype, "_buttonPrintSettings", void 0), n([wt()], qa.prototype, "_togglingLight", void 0), n([wt()], qa.prototype, "_togglingPower", void 0), n([wt()], qa.prototype, "_openSection", void 0), qa = n([Gn("anycubic-printercard-card")], qa);
  const Wa = [...Si(), Ue.DryingStatus, Ue.DryingTime],
    Xa = [...Ei(), Ue.PrinterOnline, Ue.Availability, Ue.ProjectName, Ue.CurrentLayer],
    Qa = Si(),
    Ja = [Ve.Filament],
    to = {
      vertical: !1,
      round: !0,
      use_24hr: !0,
      temperatureUnit: Ie.C,
      monitoredStats: Ei(),
      scaleFactor: 1,
      slotColors: [],
      showSettingsButton: !1,
      alwaysShow: !1,
      mediaView: Re.Auto,
      printerArt: je.Auto,
      showMoveButtons: !1,
      showControls: !0,
      sections: [Ve.Filament]
    },
    eo = ["printer_name", "printer_id", "printer_mac", "printer_model", "printer_fw_version", "printer_fw_update_available", "printer_online", "printer_available", "curr_nozzle_temp", "curr_hotbed_temp", "target_nozzle_temp", "target_hotbed_temp", "job_state", "job_progress", "ace_fw_version", "ace_fw_update_available", "drying_active", "drying_progress"];
  let io = class extends mt {
    constructor() {
      super(...arguments), this.isFDM = !1, this.monitoredStats = Xa, this._copyPreset = t => {
        const e = t.currentTarget,
          i = () => {
            const t = e.textContent;
            e.textContent = Mn("panels.main.presets.copied", this.language), setTimeout(() => {
              e.textContent = t;
            }, 1500);
          },
          r = () => {
            const t = document.createElement("textarea");
            t.value = e.yaml, t.style.position = "fixed", t.style.opacity = "0", document.body.appendChild(t), t.select();
            let r = !1;
            try {
              r = document.execCommand("copy");
            } catch (t) {
              r = !1;
            }
            t.remove(), r && i();
          },
          n = window.navigator.clipboard;
        (null == n ? void 0 : n.writeText) ? n.writeText(e.yaml).then(i, r) : r();
      };
    }
    willUpdate(t) {
      var e;
      if (super.willUpdate(t), t.has("language") && (this._statTranslations = eo.reduce((t, e) => (t[e] = Mn(`panels.main.cards.main.fields.${e}`, this.language), t), {})), t.has("selectedPrinterDevice") && (this.printerID = (e = this.selectedPrinterDevice) ? e.serial_number : void 0, this.printerMAC = function (t) {
        return t && t.connections.length > 0 && t.connections[0].length > 1 ? t.connections[0][1] : null;
      }(this.selectedPrinterDevice)), t.has("selectedPrinterID") && (this.printerEntities = ii(this.hass, this.selectedPrinterID), this.printerEntityIdPart = oi(this.printerEntities)), t.has("hass") || t.has("selectedPrinterID")) {
        this.isFDM = mi(this.hass, this.printerEntities, this.printerEntityIdPart), this.printerStateFwUpdateAvailable = gi(this.hass, this.printerEntities, this.printerEntityIdPart, "printer_firmware"), this.printerStateAvailable = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "is_available", "Available", "Busy"), this.printerStateOnline = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "printer_online", "Online", "Offline"), this.printerStateCurrNozzleTemp = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "nozzle_temperature"), this.printerStateCurrHotbedTemp = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "hotbed_temperature"), this.printerStateTargetNozzleTemp = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "target_nozzle_temperature"), this.printerStateTargetHotbedTemp = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "target_hotbed_temperature");
        const t = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "job_progress");
        this.jobStateProgress = void 0 !== t ? `${t}%` : "0%", this.jobStatePrintState = function (t, e, i, r, n = !1) {
          const s = ai(e, i, "sensor", r);
          if (s) {
            const e = Xe(t, s);
            return n ? qe(e) : e;
          }
        }(this.hass, this.printerEntities, this.printerEntityIdPart, "job_state", !0), this.aceStateFwUpdateAvailable = gi(this.hass, this.printerEntities, this.printerEntityIdPart, "ace_firmware"), this.aceStateDryingActive = ui(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_active", "Drying", "Not Drying"), this.aceStateDryingRemaining = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_remaining_time"), this.aceStateDryingTotal = pi(this.hass, this.printerEntities, this.printerEntityIdPart, "drying_total_duration"), this.aceDryingProgress = void 0 !== this.aceStateDryingRemaining && void 0 !== this.aceStateDryingTotal ? String((this.aceStateDryingTotal > 0 ? Math.round(1e4 * (1 - this.aceStateDryingRemaining / this.aceStateDryingTotal)) / 100 : 0).toFixed(2)) + "%" : void 0, this.aceStateFwUpdateAvailable ? this.monitoredStats = Wa : this.isFDM ? this.monitoredStats = Qa : this.monitoredStats = Xa;
      }
    }
    _renderInfoRow(t, e) {
      return W`
      <div class="info-row">
        <span class="info-heading"> ${this._statTranslations[t]}:</span>
        <span class="info-detail">${e}</span>
      </div>
    `;
    }
    _renderOptionalInfoRow(t, e) {
      return void 0 !== e ? this._renderInfoRow(t, e) : null;
    }
    _renderGroup(t, e) {
      const i = e.filter(([, t]) => null != t && "" !== t);
      if (!i.length) return J;
      const r = i.map(([t, e]) => this._renderInfoRow(t, e));
      return W`
      <div class="ac-tile">
        <h3 class="ac-tile-title">
          ${Mn(`panels.main.groups.${t}`, this.language)}
        </h3>
        ${r}
      </div>
    `;
    }
    _renderDiagnostics() {
      return W`
      <details class="ac-diag">
        <summary>
          ${Mn("panels.main.groups.diagnostics", this.language)}
        </summary>
        ${this._renderInfoRow("printer_name", this.selectedPrinterDevice ? this.selectedPrinterDevice.name : null)}
        ${this._renderInfoRow("printer_id", this.printerID)}
        ${this._renderInfoRow("printer_mac", this.printerMAC)}
      </details>
    `;
    }
    _renderPresets() {
      var t, e;
      const i = null !== (e = null === (t = this.selectedPrinterDevice) || void 0 === t ? void 0 : t.id) && void 0 !== e ? e : "YOUR_PRINTER_DEVICE_ID",
        r = [["full", {
          printer_id: i,
          mediaView: Re.Printer,
          showControls: !0,
          showMoveButtons: !0,
          sections: [Ve.Filament],
          alwaysShow: !0
        }], ["model", {
          printer_id: i,
          mediaView: Re.PrinterModel,
          showControls: !0,
          showMoveButtons: !1,
          alwaysShow: !0
        }], ["compact", {
          printer_id: i,
          mediaView: Re.Printer,
          showControls: !1,
          showMoveButtons: !1,
          alwaysShow: !0,
          monitoredStats: [Ue.Status, Ue.ETA]
        }], ["vertical", {
          printer_id: i,
          vertical: !0,
          mediaView: Re.Printer,
          showControls: !0,
          showMoveButtons: !1,
          alwaysShow: !0
        }]].map(([t, e]) => this._presetCard(t, e));
      return W`
      <div class="ac-presets">
        <h3 class="ac-tile-title">
          ${Mn("panels.main.presets.title", this.language)}
        </h3>
        <p class="ac-presets-lede">
          ${Mn("panels.main.presets.lede", this.language)}
        </p>
        <div class="ac-preset-grid">${r}</div>
      </div>
    `;
    }
    _presetYaml(t) {
      const e = ["type: custom:anycubic-card"];
      for (const [i, r] of Object.entries(t)) if (Array.isArray(r)) {
        e.push(`${i}:`);
        for (const t of r) e.push(`  - ${String(t)}`);
      } else e.push(`${i}: ${String(r)}`);
      return e.join("\n");
    }
    _presetCard(t, e) {
      var i, r, n, s, a, o, l, c;
      const h = this._presetYaml(e);
      return W`
      <div class="ac-preset">
        <div class="ac-preset-head">
          <span>${Mn(`panels.main.presets.${t}`, this.language)}</span>
          <button class="ac-copy" .yaml=${h} @click=${this._copyPreset}>
            ${Mn("panels.main.presets.copy", this.language)}
          </button>
        </div>
        <div class="ac-preset-frame">
          <anycubic-printercard-card
            .hass=${this.hass}
            .language=${this.language}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
            .vertical=${null !== (i = e.vertical) && void 0 !== i && i}
            .round=${!0}
            .use_24hr=${null === (r = this.panel.config.use_24hr) || void 0 === r || r}
            .temperatureUnit=${this.panel.config.temperatureUnit}
            .monitoredStats=${null !== (n = e.monitoredStats) && void 0 !== n ? n : to.monitoredStats}
            .mediaView=${null !== (s = e.mediaView) && void 0 !== s ? s : to.mediaView}
            .showControls=${null !== (a = e.showControls) && void 0 !== a ? a : to.showControls}
            .showMoveButtons=${null !== (o = e.showMoveButtons) && void 0 !== o ? o : to.showMoveButtons}
            .sections=${null !== (l = e.sections) && void 0 !== l ? l : to.sections}
            .showSettingsButton=${to.showSettingsButton}
            .alwaysShow=${null !== (c = e.alwaysShow) && void 0 !== c ? c : to.alwaysShow}
            .noCamera=${!0}
          ></anycubic-printercard-card>
        </div>
        <pre>${h}</pre>
      </div>
    `;
    }
    render() {
      var t, e, i, r, n, s, a, o, l, c, h, d, p;
      return W`
      <div class="ac-panel">
        <printer-card elevation="2" class="ac-hero">
          <anycubic-printercard-card
            .hass=${this.hass}
            .language=${this.language}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
            .vertical=${null !== (t = this.panel.config.vertical) && void 0 !== t && t}
            .round=${null === (e = this.panel.config.round) || void 0 === e || e}
            .use_24hr=${null === (i = this.panel.config.use_24hr) || void 0 === i || i}
            .temperatureUnit=${this.panel.config.temperatureUnit}
            .lightEntityId=${this.panel.config.lightEntityId}
            .powerEntityId=${this.panel.config.powerEntityId}
            .cameraEntityId=${this.panel.config.cameraEntityId}
            .monitoredStats=${null !== (r = this.panel.config.monitoredStats) && void 0 !== r ? r : this.monitoredStats}
            .scaleFactor=${this.panel.config.scaleFactor}
            .slotColors=${this.panel.config.slotColors}
            .showSettingsButton=${null === (n = this.panel.config.showSettingsButton) || void 0 === n || n}
            .alwaysShow=${null === (s = this.panel.config.alwaysShow) || void 0 === s || s}
            .mediaView=${null !== (a = this.panel.config.mediaView) && void 0 !== a ? a : Re.Auto}
            .printerArt=${null !== (o = this.panel.config.printerArt) && void 0 !== o ? o : je.Auto}
            .showControls=${null === (l = this.panel.config.showControls) || void 0 === l || l}
            .showMoveButtons=${null === (c = this.panel.config.showMoveButtons) || void 0 === c || c}
            .sections=${null !== (h = this.panel.config.sections) && void 0 !== h ? h : Ja}
          ></anycubic-printercard-card>
        </printer-card>

        <div class="ac-rail">
          ${this._renderGroup("machine", [["printer_model", null === (d = this.selectedPrinterDevice) || void 0 === d ? void 0 : d.model], ["printer_fw_version", null === (p = this.selectedPrinterDevice) || void 0 === p ? void 0 : p.sw_version], ["printer_fw_update_available", this.printerStateFwUpdateAvailable], ["printer_online", this.printerStateOnline], ["printer_available", this.printerStateAvailable]])}
          ${this._renderGroup("ace", [["ace_fw_update_available", this.aceStateFwUpdateAvailable], ["drying_active", this.aceStateDryingActive], ["drying_progress", this.aceDryingProgress]])}
          ${this._renderDiagnostics()}
        </div>

        ${this._renderPresets()}
      </div>
    `;
    }
    static get styles() {
      return p`
      :host {
        padding: 16px;
        display: block;
      }

      /* The old layout capped the whole page at 600px and centred it, so on a
         1920px screen roughly 69% of the width was empty and the page still
         scrolled. The hero and its rail now sit side by side once there is
         room for both, and stack below that. */
      .ac-panel {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: 1600px;
        margin: 0 auto;
        align-items: start;
      }

      @media (min-width: 1100px) {
        .ac-panel {
          grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
        }
        .ac-presets {
          grid-column: 1 / -1;
        }
      }

      printer-card {
        padding: 16px;
        display: block;
        font-size: 18px;
      }

      anycubic-printercard-card {
        margin: 8px;
      }

      .ac-rail {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }

      .ac-tile,
      .ac-diag,
      .ac-presets {
        background: var(--ha-card-background, var(--card-background-color));
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        padding: 12px 16px;
        box-sizing: border-box;
      }

      .ac-tile-title {
        margin: 0 0 8px 0;
        font-size: 0.8em;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      /* Identifiers are reference material, not a readout. Folded away, and
         in a smaller monospace so a MAC address stops competing with the
         machine's actual state. */
      .ac-diag summary {
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .ac-diag[open] summary {
        margin-bottom: 8px;
      }

      .ac-diag .info-detail {
        font-family: var(--code-font-family, monospace);
        font-size: 0.85em;
        font-weight: 400;
      }

      .ac-presets-lede {
        margin: 0 0 12px 0;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }

      .ac-preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 380px));
        gap: 12px;
      }

      .ac-preset {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        border-radius: 8px;
        overflow: hidden;
        min-width: 0;
      }

      .ac-preset-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        font-size: 0.9em;
        font-weight: 600;
        background: var(--secondary-background-color);
      }

      .ac-copy {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        background: transparent;
        color: var(--primary-text-color);
        border-radius: 999px;
        padding: 2px 10px;
        font: inherit;
        font-size: 0.85em;
        cursor: pointer;
      }

      .ac-copy:hover {
        background: var(--divider-color, rgba(127, 127, 127, 0.2));
      }

      /* Deliberately narrower than the card's own 480px container breakpoint,
         so each tile shows the STACKED form a dashboard column actually gives
         it -- not the wide panel form, which would flatter the preset and then
         look different once pasted. */
      .ac-preset-frame {
        padding: 8px;
        background: var(--primary-background-color);
        border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        container-type: inline-size;
      }

      /* Previews are a shop window: looking is fine, operating a printer by
         accident from a gallery is not. */
      .ac-preset-frame anycubic-printercard-card {
        pointer-events: none;
      }

      /* YAML must never widen the page; it scrolls inside its own box. */
      .ac-preset pre {
        margin: 0;
        padding: 10px;
        overflow-x: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 0.8em;
        line-height: 1.5;
      }

      .info-row {
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        box-sizing: border-box;
        width: 100%;
      }

      .info-heading {
        margin-right: 10px;
        font-size: 0.85em;
      }

      .info-detail {
        font-weight: 700;
      }
    `;
    }
  };
  n([_t()], io.prototype, "hass", void 0), n([_t()], io.prototype, "language", void 0), n([_t({
    type: Boolean,
    reflect: !0
  })], io.prototype, "narrow", void 0), n([_t()], io.prototype, "route", void 0), n([_t()], io.prototype, "panel", void 0), n([_t({
    attribute: "selected-printer-id"
  })], io.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], io.prototype, "selectedPrinterDevice", void 0), n([wt()], io.prototype, "printerEntities", void 0), n([wt()], io.prototype, "printerEntityIdPart", void 0), n([wt()], io.prototype, "printerID", void 0), n([wt()], io.prototype, "printerMAC", void 0), n([wt()], io.prototype, "printerStateFwUpdateAvailable", void 0), n([wt()], io.prototype, "printerStateAvailable", void 0), n([wt()], io.prototype, "printerStateOnline", void 0), n([wt()], io.prototype, "printerStateCurrNozzleTemp", void 0), n([wt()], io.prototype, "printerStateCurrHotbedTemp", void 0), n([wt()], io.prototype, "printerStateTargetNozzleTemp", void 0), n([wt()], io.prototype, "printerStateTargetHotbedTemp", void 0), n([wt()], io.prototype, "jobStateProgress", void 0), n([wt()], io.prototype, "jobStatePrintState", void 0), n([wt()], io.prototype, "aceStateFwUpdateAvailable", void 0), n([wt()], io.prototype, "aceStateDryingActive", void 0), n([wt()], io.prototype, "aceStateDryingRemaining", void 0), n([wt()], io.prototype, "aceStateDryingTotal", void 0), n([wt()], io.prototype, "aceDryingProgress", void 0), n([wt()], io.prototype, "isFDM", void 0), n([wt()], io.prototype, "monitoredStats", void 0), n([wt()], io.prototype, "_statTranslations", void 0), io = n([vt("anycubic-view-main")], io);
  const ro = p`
  :host {
    padding: 16px;
    display: block;
  }

  .files-card {
    padding: 16px;
    display: block;
    font-size: 18px;
    margin: 0 auto;
    text-align: center;
  }

  .files-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
  }

  .file-info {
    display: flex;
    min-height: 20px;
    min-width: 250px;
    border: 2px solid #ccc3;
    border-radius: 16px;
    padding: 16px 32px;
    line-height: 20px;
    text-align: center;
    font-weight: 900;
    margin: 6px;
    width: 100%;
    justify-content: space-between;
  }

  .file-name {
    display: block;
    line-height: 20px;
    text-align: center;
    font-weight: 900;
    margin: 6px;
    word-wrap: break-word;
    max-width: calc(100% - 58px);
  }

  .file-info:hover {
    background-color: #ccc3;
    border-color: #ccc9;
  }

  .file-refresh-button {
    padding: 10px;
    margin-bottom: 20px;
  }

  .file-refresh-icon {
    --mdc-icon-size: 50px;
  }

  .file-delete-button {
    padding: 4px;
    margin-left: 10px;
  }

  .file-delete-icon {
  }

  .no-mqtt-msg {
  }

  @media (max-width: 599px) {
    :host {
      padding: 6px;
    }

    .files-card {
      padding: 0px;
    }

    .file-info {
      padding: 6px 6px;
      margin: 6px 0px;
    }
  }
`;
  class no extends mt {
    constructor() {
      super(...arguments), this._isRefreshing = !1, this._supportsMQTT = !1, this._httpResponse = !1, this.refreshList = () => {
        this._listRefreshEntity && (this._isRefreshing = !0, this.hass.callService("button", "press", {
          entity_id: this._listRefreshEntity.entity_id
        }).then(() => {
          this._isRefreshing = !1;
        }).catch(t => {
          this._isRefreshing = !1;
        }));
      }, this.deleteFile = t => {};
    }
    willUpdate(t) {
      super.willUpdate(t), t.has("language") && (this._noMqttMessage = Mn("common.messages.mqtt_unsupported", this.language)), (t.has("hass") || t.has("selectedPrinterID")) && (this.printerEntities = ii(this.hass, this.selectedPrinterID), this.printerEntityIdPart = oi(this.printerEntities), this._supportsMQTT = function (t, e, i) {
        const r = We(t, ai(e, i, "binary_sensor", "mqtt_connection_active"));
        return !!r && !!r.attributes.supports_mqtt_login;
      }(this.hass, this.printerEntities, this.printerEntityIdPart));
    }
    render() {
      return W`
      <div class="files-card" elevation="2">
        <button
          .disabled=${!this._httpResponse && !this._supportsMQTT || this._isRefreshing}
          class="file-refresh-button"
          @click=${this.refreshList}
        >
          <ha-icon
            class="file-refresh-icon"
            icon="mdi:refresh"
          >
          </ha-icon>
        </button>
        ${this._httpResponse || this._supportsMQTT ? J : W` <div class="no-mqtt-msg">${this._noMqttMessage}</div> `}
        <ul class="files-container">
        ${this._fileArray ? this._fileArray.map(t => W`
                  <li class="file-info">
                    <div class="file-name">${t.name}</div>
                    <button
                      class="file-delete-button"
                      .disabled=${this._isDeleting}
                      .file_info=${t}
                      @click=${this.deleteFile}
                    >
                      <ha-icon
                        class="file-delete-icon"
                        icon="mdi:delete"
                      ></ha-icon>
                    </button>
                  </li>
                `) : null}
      </div>
    `;
    }
    static get styles() {
      return p`
      ${ro}
    `;
    }
  }
  n([_t()], no.prototype, "hass", void 0), n([_t()], no.prototype, "language", void 0), n([_t({
    type: Boolean,
    reflect: !0
  })], no.prototype, "narrow", void 0), n([_t()], no.prototype, "route", void 0), n([_t()], no.prototype, "panel", void 0), n([_t({
    attribute: "selected-printer-id"
  })], no.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], no.prototype, "selectedPrinterDevice", void 0), n([wt()], no.prototype, "printerEntities", void 0), n([wt()], no.prototype, "printerEntityIdPart", void 0), n([wt()], no.prototype, "_fileArray", void 0), n([wt()], no.prototype, "_listRefreshEntity", void 0), n([wt()], no.prototype, "_isRefreshing", void 0), n([wt()], no.prototype, "_isDeleting", void 0), n([wt()], no.prototype, "_noMqttMessage", void 0), n([wt()], no.prototype, "_supportsMQTT", void 0), n([wt()], no.prototype, "_httpResponse", void 0);
  let so = class extends no {
    constructor() {
      super(...arguments), this._httpResponse = !0, this.deleteFile = t => {
        const e = t.currentTarget.file_info;
        this.selectedPrinterDevice && e.id && (this._isDeleting = !0, this.hass.callService(De, "delete_file_cloud", {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          file_id: e.id
        }).then(() => {
          this._isDeleting = !1;
        }).catch(t => {
          this._isDeleting = !1;
        }));
      };
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("hass") || t.has("selectedPrinterID")) {
        const t = We(this.hass, ni(this.printerEntities, "sensor", "file_list_cloud"));
        this._fileArray = t ? t.attributes.file_info : void 0, this._listRefreshEntity = function (t) {
          return ni(t, "button", "request_file_list_cloud");
        }(this.printerEntities);
      }
    }
  };
  n([wt()], so.prototype, "_fileArray", void 0), n([wt()], so.prototype, "_httpResponse", void 0), so = n([vt("anycubic-view-files_cloud")], so);
  let ao = class extends no {
    constructor() {
      super(...arguments), this.deleteFile = t => {
        const e = t.currentTarget.file_info;
        this.selectedPrinterDevice && e.name && (this._isDeleting = !0, this.hass.callService(De, "delete_file_local", {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          filename: e.name
        }).then(() => {
          this._isDeleting = !1;
        }).catch(t => {
          this._isDeleting = !1;
        }));
      };
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("hass") || t.has("selectedPrinterID")) {
        const t = We(this.hass, ni(this.printerEntities, "sensor", "file_list_local"));
        this._fileArray = t ? t.attributes.file_info : void 0, this._listRefreshEntity = function (t) {
          return ni(t, "button", "request_file_list_local");
        }(this.printerEntities);
      }
    }
  };
  ao = n([vt("anycubic-view-files_local")], ao);
  let oo = class extends no {
    constructor() {
      super(...arguments), this.deleteFile = t => {
        const e = t.currentTarget.file_info;
        this.selectedPrinterDevice && e.name && (this._isDeleting = !0, this.hass.callService(De, "delete_file_udisk", {
          config_entry: this.selectedPrinterDevice.primary_config_entry,
          device_id: this.selectedPrinterDevice.id,
          filename: e.name
        }).then(() => {
          this._isDeleting = !1;
        }).catch(t => {
          this._isDeleting = !1;
        }));
      };
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("hass") || t.has("selectedPrinterID")) {
        const t = We(this.hass, ni(this.printerEntities, "sensor", "file_list_udisk"));
        this._fileArray = t ? t.attributes.file_info : void 0, this._listRefreshEntity = function (t) {
          return ni(t, "button", "request_file_list_udisk");
        }(this.printerEntities);
      }
    }
  };
  oo = n([vt("anycubic-view-files_udisk")], oo);
  const lo = p`
  :host {
    padding: 16px;
    display: block;
  }
  ac-print-view {
    padding: 16px;
    display: block;
    font-size: 18px;
    max-width: 1024px;
    margin: 0 auto;
  }

  ha-alert {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .print-button {
    margin: auto;
    width: 100px;
    height: 40px;
    display: block;
    margin-top: 20px;
  }
`;
  var co;
  !function (t) {
    t.Light = "light", t.Medium = "medium", t.Heavy = "heavy";
  }(co || (co = {}));
  class ho extends mt {
    constructor() {
      super(...arguments), this._scriptData = {}, this._serviceName = "", this._buttonProgress = !1, this._scriptDataChanged = t => {
        this._scriptData = Object.assign(Object.assign({}, this._scriptData), t.detail.value), this._error = void 0;
      }, this._runScript = t => {
        const e = t.currentTarget;
        this._error = void 0, t.stopPropagation(), this._buttonProgress = !0, ((t = co.Medium) => {
          const e = new Event("haptic");
          e.detail = t, window && window.dispatchEvent(e);
        })(), this.hass.callService(De, this._serviceName, this._scriptData.data).then(() => {
          e.actionSuccess(), this._buttonProgress = !1;
        }).catch(t => {
          this._error = t.message, e.actionError(), this._buttonProgress = !1;
        });
      };
    }
    async firstUpdated() {
      await (async () => {
        var t, e, i, r, n, s, a, o;
        if (customElements.get("ha-service-control")) return;
        const l = document.createElement("partial-panel-resolver").getRoutes([{
          component_name: "developer-tools",
          url_path: "a"
        }]);
        await (null === (i = null === (e = null === (t = null == l ? void 0 : l.routes) || void 0 === t ? void 0 : t.a) || void 0 === e ? void 0 : e.load) || void 0 === i ? void 0 : i.call(e));
        const c = document.createElement("developer-tools-router"),
          h = null === (r = null == c ? void 0 : c.routerOptions) || void 0 === r ? void 0 : r.routes;
        (null == h ? void 0 : h.service) && (await (null === (s = null === (n = null == h ? void 0 : h.service) || void 0 === n ? void 0 : n.load) || void 0 === s ? void 0 : s.call(n))), (null == h ? void 0 : h.action) && (await (null === (o = null === (a = null == h ? void 0 : h.action) || void 0 === a ? void 0 : a.load) || void 0 === o ? void 0 : o.call(a)));
      })();
    }
    willUpdate(t) {
      if (super.willUpdate(t), t.has("language") && (this._buttonPrint = Mn("common.actions.print", this.language)), t.has("selectedPrinterDevice") && this.selectedPrinterDevice) {
        const t = `${De}.${this._serviceName}`;
        this._scriptData = Object.assign(Object.assign({}, this._scriptData), {
          action: t,
          service: t,
          data: Object.assign(Object.assign({}, this._scriptData.data || {}), {
            config_entry: this.selectedPrinterDevice.primary_config_entry,
            device_id: this.selectedPrinterDevice.id
          })
        });
      }
    }
    render() {
      return W`
      <ac-print-view elevation="2">
        <ha-service-control
          hidePicker
          .hass=${this.hass}
          .value=${this._scriptData}
          .showAdvanced=${!0}
          .narrow=${this.narrow}
          @value-changed=${this._scriptDataChanged}
        ></ha-service-control>
        ${void 0 !== this._error ? W`<ha-alert alert-type="error">${this._error}</ha-alert>` : J}
        <ha-progress-button
          class="print-button"
          raised
          @click=${this._runScript}
          .progress=${this._buttonProgress}
        >
          <ha-svg-icon .path=${In}></ha-svg-icon>
          ${this._buttonPrint}
        </ha-progress-button>
      </ac-print-view>
    `;
    }
    static get styles() {
      return p`
      ${lo}
    `;
    }
  }
  n([_t({
    attribute: !1
  })], ho.prototype, "hass", void 0), n([_t()], ho.prototype, "language", void 0), n([_t({
    type: Boolean,
    reflect: !0
  })], ho.prototype, "narrow", void 0), n([_t()], ho.prototype, "route", void 0), n([_t()], ho.prototype, "panel", void 0), n([_t({
    attribute: "selected-printer-id"
  })], ho.prototype, "selectedPrinterID", void 0), n([_t({
    attribute: "selected-printer-device"
  })], ho.prototype, "selectedPrinterDevice", void 0), n([wt()], ho.prototype, "_scriptData", void 0), n([wt()], ho.prototype, "_error", void 0), n([wt()], ho.prototype, "_serviceName", void 0), n([wt()], ho.prototype, "_buttonPrint", void 0), n([wt()], ho.prototype, "_buttonProgress", void 0);
  let po = class extends ho {
    constructor() {
      super(...arguments), this._serviceName = "print_and_upload_no_cloud_save";
    }
  };
  n([wt()], po.prototype, "_serviceName", void 0), po = n([vt("anycubic-view-print-no_cloud_save")], po);
  let uo = class extends ho {
    constructor() {
      super(...arguments), this._serviceName = "print_and_upload_save_in_cloud";
    }
  };
  n([wt()], uo.prototype, "_serviceName", void 0), uo = n([vt("anycubic-view-print-save_in_cloud")], uo);
  var go = "0.2.2";
  window.console.info(`%c ANYCUBIC-PANEL %c v${go} `, "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray"), t.AnycubicCloudPanel = class extends mt {
    constructor() {
      super(...arguments), this.selectedPage = "main", this._handleLocationChange = () => {
        window.location.pathname.includes("anycubic-cloud") && this.requestUpdate();
      }, this._handlePrinterClick = t => {
        ((t, e, i = !1) => {
          const r = `${t.route.prefix}/${e ? `${e}/main` : ""}`;
          i ? history.replaceState(null, "", r) : history.pushState(null, "", r), Fe(window, "location-changed", {
            replace: i
          });
        })(this, t.currentTarget.printer_id), this.requestUpdate();
      }, this.handlePageSelected = t => {
        const e = t.detail.item.getAttribute("page-name");
        e !== vi(this.route) ? (((t, e, i = !1) => {
          const r = t.route.prefix,
            n = bi(t.route),
            s = `${r}/${n ? `${n}/${e}` : ""}`;
          i ? history.replaceState(null, "", s) : history.pushState(null, "", s), Fe(window, "location-changed", {
            replace: i
          });
        })(this, e), this.requestUpdate()) : scrollTo(0, 0);
      };
    }
    connectedCallback() {
      super.connectedCallback(), window.addEventListener("location-changed", this._handleLocationChange);
    }
    disconnectedCallback() {
      window.removeEventListener("location-changed", this._handleLocationChange), super.disconnectedCallback();
    }
    willUpdate(t) {
      var e, i;
      super.willUpdate(t), t.has("hass") && this.hass.language !== this.language && (this.language = this.hass.language, this._tabMain = Mn("panels.main.title", this.language), this._tabFilesLocal = Mn("panels.files_local.title", this.language), this._tabFilesUdisk = Mn("panels.files_udisk.title", this.language), this._tabFilesCloud = Mn("panels.files_cloud.title", this.language), this._tabPrintNoSave = Mn("panels.print_no_cloud_save.title", this.language), this._tabPrintSave = Mn("panels.print_save_in_cloud.title", this.language), this._tabDebug = Mn("panels.debug.title", this.language), this._mainTitle = Mn("title", this.language), this._selectPrinter = Mn("panels.initial.printer_select", this.language)), t.has("route") && (this.printers = function (t) {
        const e = new Set();
        for (const i in t.entities) {
          const r = t.entities[i];
          r.platform === De && r.device_id && e.add(r.device_id);
        }
        const i = {};
        for (const r in t.devices) {
          const n = t.devices[r];
          "Anycubic" === n.manufacturer && !n.via_device_id && e.has(n.id) && (i[n.id] = n);
        }
        return i;
      }(this.hass), this.selectedPage = vi(this.route), this.selectedPrinterID = bi(this.route), this.selectedPrinterDevice = (e = this.printers, i = this.selectedPrinterID, e && i ? e[i] : void 0));
    }
    render() {
      return this.getInitialView();
    }
    renderPrinterPage() {
      return W`
      <div class="header">
        ${this.renderToolbar()}
        <ha-tabs
          scrollable
          attr-for-selected="page-name"
          .selected=${this.selectedPage}
          @iron-activate=${this.handlePageSelected}
        >
          <paper-tab page-name="main"> ${this._tabMain} </paper-tab>
          <paper-tab page-name="local-files">
            ${this._tabFilesLocal}
          </paper-tab>
          <paper-tab page-name="udisk-files">
            ${this._tabFilesUdisk}
          </paper-tab>
          <paper-tab page-name="cloud-files">
            ${this._tabFilesCloud}
          </paper-tab>
          <paper-tab page-name="print-no_cloud_save">
            ${this._tabPrintNoSave}
          </paper-tab>
          <paper-tab page-name="print-save_in_cloud">
            ${this._tabPrintSave}
          </paper-tab>
          ${null}
        </ha-tabs>
      </div>
      <div class="view">${this.getView(this.route)}</div>
    `;
    }
    renderToolbar() {
      return W`
      <div class="toolbar">
        <ha-menu-button
          .hass=${this.hass}
          .narrow=${this.narrow}
        ></ha-menu-button>
        <div class="main-title">${this._mainTitle}</div>
        <div class="version">v${go}</div>
      </div>
    `;
    }
    getInitialView() {
      return this.selectedPrinterID ? this.renderPrinterPage() : W`
        <div class="header">${this.renderToolbar()}</div>
        <printer-select elevation="2">
          <p>${this._selectPrinter}</p>
          <ul class="printers-container">
            ${this.printers ? Object.keys(this.printers).map(t => W`<li
                      class="printer-select-box"
                      .printer_id=${t}
                      @click=${this._handlePrinterClick}
                    >
                      ${this.printers ? this.printers[t].name : ""}
                    </li>`) : null}
          </ul>
        </printer-select>
      `;
    }
    getView(t) {
      switch (this.selectedPage) {
        case "local-files":
          return W`
          <anycubic-view-files_local
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-files_local>
        `;
        case "udisk-files":
          return W`
          <anycubic-view-files_udisk
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-files_udisk>
        `;
        case "cloud-files":
          return W`
          <anycubic-view-files_cloud
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-files_cloud>
        `;
        case "print-no_cloud_save":
          return W`
          <anycubic-view-print-no_cloud_save
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-print-no_cloud_save>
        `;
        case "print-save_in_cloud":
          return W`
          <anycubic-view-print-save_in_cloud
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-print-save_in_cloud>
        `;
        case "main":
          return W`
          <anycubic-view-main
            class="ac_wide_view"
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-main>
        `;
        case "debug":
          return W`
          <anycubic-view-debug
            .hass=${this.hass}
            .language=${this.language}
            .narrow=${this.narrow}
            .route=${t}
            .panel=${this.panel}
            .printers=${this.printers}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
          ></anycubic-view-debug>
        `;
        default:
          return W`
          <ha-card header="Page not found">
            <div class="card-content">
              The page you are trying to reach cannot be found. Please select a
              page from the menu above to continue.
            </div>
          </ha-card>
        `;
      }
    }
    static get styles() {
      return p`
      :host {
        padding: 16px;
        display: block;
      }
      .header {
        background-color: var(--app-header-background-color);
        color: var(--app-header-text-color, white);
        border-bottom: var(--app-header-border-bottom, none);
      }
      .toolbar {
        height: var(--header-height);
        display: flex;
        align-items: center;
        font-size: 20px;
        padding: 0 16px;
        font-weight: 400;
        box-sizing: border-box;
      }
      .main-title {
        margin: 0 0 0 24px;
        line-height: 20px;
        flex-grow: 1;
      }
      ha-tabs {
        margin-left: max(env(safe-area-inset-left), 24px);
        margin-right: max(env(safe-area-inset-right), 24px);
        --paper-tabs-selection-bar-color: var(
          --app-header-selection-bar-color,
          var(--app-header-text-color, #fff)
        );
        text-transform: uppercase;
      }

      .version {
        font-size: 14px;
        font-weight: 500;
        color: rgba(var(--rgb-text-primary-color), 0.9);
      }

      printer-select {
        padding: 16px;
        display: block;
        font-size: 18px;
        max-width: 1024px;
        margin: 0 auto;
      }

      .view {
        height: calc(100vh - 112px);
        display: flex;
        justify-content: center;
      }

      .view > * {
        min-width: 600px;
        max-width: 1024px;
      }

      .view > *:last-child {
        margin-bottom: 20px;
      }

      .ac_wide_view {
        width: 100%;
      }

      /* The main view lays itself out in columns and is the first thing a new
         user sees, so it gets the whole screen rather than the 1024px lane the
         file lists and forms use -- those get harder to read when stretched. */
      anycubic-view-main.ac_wide_view {
        max-width: 1600px;
      }

      .printers-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      .printer-select-box {
        cursor: pointer;
        display: block;
        min-height: 60px;
        min-width: 250px;
        border: 2px solid #ccc3;
        border-radius: 16px;
        padding: 16px;
        line-height: 60px;
        text-align: center;
        font-weight: 900;
      }

      .printer-select-box:hover {
        background-color: #ccc3;
        border-color: #ccc9;
      }
      @media (max-width: 599px) {
        .view > * {
          min-width: 100%;
          max-width: 100%;
        }
      }
    `;
    }
  }, n([_t()], t.AnycubicCloudPanel.prototype, "hass", void 0), n([_t({
    type: Boolean,
    reflect: !0
  })], t.AnycubicCloudPanel.prototype, "narrow", void 0), n([_t()], t.AnycubicCloudPanel.prototype, "route", void 0), n([_t()], t.AnycubicCloudPanel.prototype, "panel", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "printers", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "selectedPage", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "selectedPrinterID", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "selectedPrinterDevice", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "language", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabMain", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabFilesLocal", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabFilesUdisk", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabFilesCloud", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabPrintNoSave", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabPrintSave", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_tabDebug", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_mainTitle", void 0), n([wt()], t.AnycubicCloudPanel.prototype, "_selectPrinter", void 0), t.AnycubicCloudPanel = n([vt("anycubic-cloud-panel")], t.AnycubicCloudPanel), Object.defineProperty(t, "__esModule", {
    value: !0
  });
}({});
