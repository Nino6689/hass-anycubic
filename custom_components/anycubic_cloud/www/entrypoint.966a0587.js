const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let r=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const n=t=>new r("string"==typeof t?t:t+"",void 0,i),a=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(s,t,i)},o=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return n(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,g=f?f.emptyScript:"",b=m.reactiveElementPolyfillSupport,$=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),_={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);r?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...p(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of s){const s=document.createElement("style"),r=t.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=s;const n=r.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const n=this.constructor;if(!1===s&&(r=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??y)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[$("elementProperties")]=new Map,x[$("finalized")]=new Map,b?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,k=w.trustedTypes,C=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+L,H=`<${M}>`,E=document,V=()=>E.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,P=Array.isArray,j="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,O=/>/g,T=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,B=/"/g,D=/^(?:script|style|textarea|title)$/i,F=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),R=F(1),Z=F(2),q=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),Y=new WeakMap,G=E.createTreeWalker(E,129);function X(t,e){if(!P(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":3===e?"<math>":"",a=I;for(let e=0;e<i;e++){const i=t[e];let o,l,c=-1,d=0;for(;d<i.length&&(a.lastIndex=d,l=a.exec(i),null!==l);)d=a.lastIndex,a===I?"!--"===l[1]?a=N:void 0!==l[1]?a=O:void 0!==l[2]?(D.test(l[2])&&(r=RegExp("</"+l[2],"g")),a=T):void 0!==l[3]&&(a=T):a===T?">"===l[0]?(a=r??I,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,o=l[1],a=void 0===l[3]?T:'"'===l[3]?B:U):a===B||a===U?a=T:a===N||a===O?a=I:(a=T,r=void 0);const p=a===T&&t[e+1].startsWith("/>")?" ":"";n+=a===I?i+H:c>=0?(s.push(o),i.slice(0,c)+S+i.slice(c)+L+p):i+L+(-2===c?e:p)}return[X(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class K{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const a=t.length-1,o=this.parts,[l,c]=J(t,e);if(this.el=K.createElement(l,i),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=G.nextNode())&&o.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[n++],i=s.getAttribute(t).split(L),a=/([.?@])?(.*)/.exec(e);o.push({type:1,index:r,name:a[2],strings:i,ctor:"."===a[1]?st:"?"===a[1]?rt:"@"===a[1]?nt:it}),s.removeAttribute(t)}else t.startsWith(L)&&(o.push({type:6,index:r}),s.removeAttribute(t));if(D.test(s.tagName)){const t=s.textContent.split(L),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],V()),G.nextNode(),o.push({type:2,index:++r});s.append(t[e],V())}}}else if(8===s.nodeType)if(s.data===M)o.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(L,t+1));)o.push({type:7,index:r}),t+=L.length-1}r++}}static createElement(t,e){const i=E.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===q)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const n=z(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=Q(t,r._$AS(t,e.values),r,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??E).importNode(e,!0);G.currentNode=s;let r=G.nextNode(),n=0,a=0,o=i[0];for(;void 0!==o;){if(n===o.index){let e;2===o.type?e=new et(r,r.nextSibling,this,t):1===o.type?e=new o.ctor(r,o.name,o.strings,this,t):6===o.type&&(e=new at(r,this,t)),this._$AV.push(e),o=i[++a]}n!==o?.index&&(r=G.nextNode(),n++)}return G.currentNode=E,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),z(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>P(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(E.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=K.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Y.get(t.strings);return void 0===e&&Y.set(t.strings,e=new K(t)),e}k(t){P(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new et(this.O(V()),this.O(V()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=Q(this,t,e,0),n=!z(t)||t!==this._$AH&&t!==q,n&&(this._$AH=t);else{const s=t;let a,o;for(t=r[0],a=0;a<r.length-1;a++)o=Q(this,s[i+a],e,a),o===q&&(o=this._$AH[a]),n||=!z(o)||o!==this._$AH[a],o===W?t=W:t!==W&&(t+=(o??"")+r[a+1]),this._$AH[a]=o}n&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class rt extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class nt extends it{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??W)===q)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const ot=w.litHtmlPolyfillSupport;ot?.(K,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;class ct extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new et(e.insertBefore(V(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");var pt="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",ht="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z",ut="M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z",mt="M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22",ft="M8,5.14V19.14L19,12.14L8,5.14Z",gt="M19,6A1,1 0 0,0 20,5A1,1 0 0,0 19,4A1,1 0 0,0 18,5A1,1 0 0,0 19,6M19,2A3,3 0 0,1 22,5V11H18V7H6V11H2V5A3,3 0 0,1 5,2H19M18,18.25C18,18.63 17.79,18.96 17.47,19.13L12.57,21.82C12.4,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L6.53,19.13C6.21,18.96 6,18.63 6,18.25V13C6,12.62 6.21,12.29 6.53,12.12L11.43,9.68C11.59,9.56 11.79,9.5 12,9.5C12.21,9.5 12.4,9.56 12.57,9.68L17.47,12.12C17.79,12.29 18,12.62 18,13V18.25M12,11.65L9.04,13L12,14.6L14.96,13L12,11.65M8,17.66L11,19.29V16.33L8,14.71V17.66M16,17.66V14.71L13,16.33V19.29L16,17.66Z";function bt(t,e){if("undefined"!=typeof customElements&&!customElements.get(t))try{customElements.define(t,e)}catch{}}function $t(t,e,i){t.dispatchEvent(new CustomEvent(e,{detail:i,bubbles:!0,composed:!0}))}function vt(t,e=!1){e?window.history.replaceState(null,"",t):window.history.pushState(null,"",t),$t(window,"location-changed",{replace:e})}function yt(t="light"){$t(window,"haptic",t)}const _t="anycubic_cloud";function xt(t){if(!t?.devices||!t.entities)return[];const e=new Set;for(const i of Object.values(t.entities))i.platform===_t&&i.device_id&&e.add(i.device_id);return Object.values(t.devices).filter(t=>"Anycubic"===t.manufacturer&&!t.via_device_id&&e.has(t.id))}function wt(t){return t?.name_by_user||t?.name||void 0}function At(t){const e=t.indexOf(".");return e<0?t:t.slice(e+1)}function kt(t){const e=t.indexOf(".");return e<0?"":t.slice(0,e)}function Ct(t){if(0===t.length)return"";const e=t.map(At);let i=e[0];for(const t of e.slice(1)){let e=0;for(;e<i.length&&e<t.length&&i[e]===t[e];)e++;if(i=i.slice(0,e),""===i)return""}const s=i.lastIndexOf("_");return s<0?"":i.slice(0,s+1)}function St(t){return null==t||""===t||"unknown"===t||"unavailable"===t}class Lt{constructor(t,e){this.hass=t,this.deviceId=e,this.cache=new Map,this.set=function(t,e){const i=e?t?.devices?.[e]:void 0;if(!t||!i)return{device:i,deviceIds:[],entityIds:[],prefix:""};const s=[i.id,...Object.values(t.devices).filter(t=>t.via_device_id===i.id).map(t=>t.id)],r=new Set(s),n=Object.values(t.entities??{}).filter(t=>t.device_id&&r.has(t.device_id)).map(t=>t.entity_id);return{device:i,deviceIds:s,entityIds:n,prefix:Ct(n)}}(t,e)}get device(){return this.set.device}get exists(){return void 0!==this.set.device}get name(){return wt(this.set.device)}get configEntry(){const t=this.set.device;return t?.primary_config_entry??t?.config_entries?.[0]??void 0}id(t,e="sensor"){const i=`${e}|${t}`;return this.cache.has(i)||this.cache.set(i,function(t,e,i,s){if(!t)return;const r=e.entityIds.filter(e=>kt(e)===s&&void 0!==t.states?.[e]),n=t=>t.length<=1?t[0]:(e.prefix?t.find(t=>At(t).startsWith(e.prefix)):void 0)??t[0],a=t.entities??{},o=r.filter(t=>a[t]?.translation_key===i);if(o.length)return n(o);const l=r.filter(t=>{const e=a[t]?.translation_key,s=At(t);return null==e&&(s===i||s.endsWith(`_${i}`))});if(l.length>1&&e.prefix){const t=l.find(t=>At(t)===`${e.prefix}${i}`);if(t)return t}return n(l)}(this.hass,this.set,t,e)),this.cache.get(i)}entity(t,e="sensor"){const i=this.id(t,e);return i?this.hass?.states?.[i]:void 0}value(t,e="sensor"){const i=this.entity(t,e)?.state;return St(i)?void 0:i}num(t,e="sensor"){const i=this.value(t,e);if(void 0===i)return;const s=Number(i);return Number.isFinite(s)?s:void 0}isOn(t,e="binary_sensor"){const i=this.value(t,e);return"on"===i||"off"!==i&&void 0}attr(t,e,i="sensor"){return this.entity(t,i)?.attributes?.[e]}usable(t,e){const i=this.entity(t,e)?.state;return void 0!==i&&"unavailable"!==i}get materialType(){return this.attr("current_status","material_type")}get isResin(){return"Resin"===this.materialType}get isFilament(){return"Filament"===this.materialType}aceActive(t){return"active"===this.value(0===t?"ace_spools":"secondary_ace_spools")}camera(t){return function(t,e,i){if(!t)return;const s=e.entityIds.filter(t=>"camera"===kt(t)).map(e=>{const i=t.entities?.[e]?.translation_key,s=i?"cloud_camera"===i:At(e).endsWith("cloud_camera"),r=t.states?.[e]?.state;return{entityId:e,isCloud:s,available:void 0!==r&&"unavailable"!==r}});if(s.sort((t,e)=>Number(t.isCloud)-Number(e.isCloud)),i){const t=s.find(t=>t.entityId===i);return t??{entityId:i,isCloud:At(i).endsWith("cloud_camera"),available:!0}}return s.find(t=>t.available)??s[0]}(this.hass,this.set,t)}}const Mt="—";function Ht(t,e){if(void 0===t||!Number.isFinite(t))return Mt;let i=Math.max(0,t);i=e?60*Math.ceil(i/60):Math.floor(i);const s=Math.floor(i/86400),r=Math.floor(i%86400/3600),n=Math.floor(i%3600/60),a=i%60,o=(t,e,i,s)=>i>0?`${t}${e} ${i}${s}`:`${t}${e}`;return s>0?o(s,"d",r,"h"):r>0?o(r,"h",n,"m"):e?`${n}m`:n>0?o(n,"m",a,"s"):`${a}s`}function Et(t,e,i,s,r=new Date){const n=function(t,e,i){if(!t||Number.isNaN(t.getTime()))return Mt;const s=t=>String(t).padStart(2,"0"),r=i?"":`:${s(t.getSeconds())}`,n=s(t.getMinutes());if(e)return`${s(t.getHours())}:${n}${r}`;const a=t.getHours();return`${a%12==0?12:a%12}:${n}${r} ${a<12?"am":"pm"}`}(t,e,i);if(!t||n===Mt)return n;if(t.getFullYear()===r.getFullYear()&&t.getMonth()===r.getMonth()&&t.getDate()===r.getDate())return n;let a;try{a=new Intl.DateTimeFormat(s||"en",{weekday:"short"}).format(t)}catch{a=new Intl.DateTimeFormat("en",{weekday:"short"}).format(t)}return`${a} ${n}`}function Vt(t,e,i){if(void 0===t||!Number.isFinite(t))return Mt;if(!i)return t.toFixed(2);try{return new Intl.NumberFormat(e||"en",{style:"currency",currency:i}).format(t)}catch{return`${t.toFixed(2)} ${i}`}}function zt(t){return Math.min(100,Math.max(0,t))}function Pt(t,e){if(void 0!==t&&void 0!==e&&e>0)return zt(t/e*100)}const jt={en:{title:"Anycubic printers",common:{actions:{cancel:"cancel",pause:"pause",print:"Print",resume:"resume",yes:"Yes",no:"No",save:"Save",close:"Close",delete:"Delete",refresh:"Refresh"},messages:{refresh_unavailable:"This list can't be fetched over the current connection, so refreshing is switched off.",no_printer:"No printer selected",page_not_found:"There's nothing at this address.",unknown:"Unknown"},states:{printing:"Printing",paused:"Paused",finished:"Finished",failed:"Failed",cancelled:"Cancelled",downloading:"Downloading",checking:"Checking",preheating:"Preheating",slicing:"Slicing",levelling:"Levelling",idle:"Idle",unknown:"Unknown",offline:"Offline",moving:"Moving",busy:"Busy",available:"Ready",operational:"Ready",free:"Ready"},values:{online:"Online",offline:"Offline",drying:"Drying",not_drying:"Not drying",available:"Available",busy:"Busy",update_available:"Update ready",up_to_date:"Current",minutes:"min",layers:"layers"}},card:{fallback_name:"3D printer",buttons:{print_settings:"Print settings",dry:"Dry",runout_refill:"Auto refill",toggle_body:"Show or hide details",light:"Printer light",power:"Printer power"},controls:{pause:"Pause",resume:"Resume",cancel:"Cancel",confirm_cancel:"Stop this print? It can't be resumed afterwards."},progress:{layer:"Layer {current} of {total}"},media_view:{tabs:{camera:"Camera",preview:"Job render",printer:"Printer",printer_model:"Printer with model"},live:"LIVE",preview_alt:"Render of the current job",camera_unavailable:"The camera isn't available right now.",player_unavailable:"The video player couldn't be loaded.",starting:"Starting video…"},move:{title:"Move axes",step:"Step",home_all:"Home every axis",home_xy:"Home X/Y",home_z:"Home Z",motors_off:"Release motors",x_plus:"X+",x_minus:"X−",y_plus:"Y+",y_minus:"Y−",z_plus:"Z up",z_minus:"Z down",moving:"Moving…",failed:"The printer refused that move. Home the Z axis on its own first, then try again."},sections:{filament:"Filament",insights:"Usage and cost"},insights:{job_cost:"This print",last_job_cost:"Previous print",filament_cost_total:"Spent on filament",job_filament_required:"Print needs",job_filament_shortfall:"Missing",nozzle_wear_percent:"Nozzle wear",spool_inventory_remaining:"Left on spools",insufficient:"The loaded spools may not hold enough filament for this print.",empty:"Figures show up here after a print finishes and spool weights have been entered."},monitored_stats:{ETA:"Done at",Elapsed:"Time spent",Remaining:"Time left",Status:"State",Online:"Connection",Availability:"Printer",Project:"File",Layer:"Layer",Hotend:"Nozzle",Bed:"Bed","T Hotend":"Nozzle target","T Bed":"Bed target","Dry Status":"Dryer","Dry Time":"Drying left","Speed Mode":"Speed","Fan Speed":"Part fan","On Time":"Exposure","Off Time":"Rest time","Bottom Time":"Base exposure","Model Height":"Model height","Bottom Layers":"Base layers","Z Up Height":"Lift height","Z Up Speed":"Lift speed","Z Down Speed":"Lower speed"},print_settings:{heading:"Print settings",confirm_heading:"Are you sure?",confirm_message:"Do you want to {action} the print?",label_speed_mode:"Speed",label_nozzle_temp:"Nozzle target (°C)",label_hotbed_temp:"Bed target (°C)",label_fan_speed:"Part fan (%)",label_aux_fan_speed:"Side fan (%)",label_box_fan_speed:"Enclosure fan",print_pause:"Pause",print_resume:"Resume",print_cancel:"Cancel print",save_speed_mode:"Apply speed",save_target_nozzle:"Apply nozzle",save_target_hotbed:"Apply bed",save_fan_speed:"Apply fan",save_aux_fan_speed:"Apply side fan",save_box_fan_speed:"Apply enclosure fan"},drying_settings:{heading:"Filament dryer",button_preset:"Preset {number}",button_stop_drying:"Stop drying",button_minutes:"min"},spool_settings:{heading:"Slot {slot}",label_select_material:"Material",label_select_colour:"Colour",label_preset_colours:"Saved colours",placeholder_material:"Choose…"},configure:{tabs:{main:"General",stats:"Rows",colours:"Colours"},labels:{printer_id:"Printer",vertical:"Stack the picture above the details",round:"Round numbers",use_24hr:"24-hour clock",show_settings_button:"Always offer print settings",always_show:"Keep details open when idle",temperature_unit:"Temperature unit",light_entity_id:"Light",power_entity_id:"Power switch",camera_entity_id:"Camera",scale_factor:"Picture width",slot_colors:"Colour shortcuts",media_view:"Picture shown first",printer_art:"Printer drawing",show_controls:"Show print buttons",show_move_buttons:"Show axis controls",sections:"Extra sections",no_camera:"Never start a camera",monitored_stats:"Pick the rows to show and put them in order",add_colour:"Add colour",remove:"Remove",move_up:"Up",move_down:"Down"},helpers:{light_entity_id:"Any light you want to switch from the card header.",power_entity_id:"A smart plug or other switch that powers the printer. Leave empty if you have none.",camera_entity_id:"Leave empty to let the card pick the printer's camera."},options:{printer_art:{auto:"Match my printer",kobra_s1:"Enclosed",kobra_s1_combo:"Enclosed with colour box",kobra_3:"Open frame",resin:"Resin",fdm:"Simple"},media_view:{auto:"Automatic",camera:"Camera",preview:"Job render",printer:"Printer drawing",printer_model:"Drawing with model",none:"Nothing"},sections:{filament:"Filament",insights:"Usage and cost"},scale_factor:{1:"Same width as the details",.75:"Slightly narrower",.5:"Half the details' width"}}}},panels:{initial:{printer_select:"Which printer would you like to open?",no_printers:"No printers from this integration were found."},main:{title:"Overview",cards:{main:{description:"Printer details",fields:{printer_name:"Name",printer_id:"Printer ID",printer_mac:"MAC address",printer_model:"Model",printer_fw_version:"Firmware",printer_fw_update_available:"Firmware update",printer_online:"Connection",printer_available:"State",curr_nozzle_temp:"Nozzle",curr_hotbed_temp:"Bed",target_nozzle_temp:"Nozzle target",target_hotbed_temp:"Bed target",job_state:"Job",job_progress:"Progress",ace_fw_version:"Colour box firmware",ace_fw_update_available:"Colour box update",drying_active:"Dryer",drying_progress:"Drying left"}}},groups:{machine:"Machine",ace:"Colour box",diagnostics:"Diagnostics"},presets:{title:"Card ideas",lede:"Copy one of these into a dashboard card's code editor.",full:"Everything",model:"With model",compact:"Small",vertical:"Tall",copy:"Copy",copied:"Copied"}},files_local:{title:"Printer storage",cards:{}},files_udisk:{title:"USB stick",cards:{}},files_cloud:{title:"Cloud files",cards:{}},print_no_cloud_save:{title:"Print a file",cards:{}},print_save_in_cloud:{title:"Print and keep in cloud",cards:{}},debug:{title:"Debug",cards:{}},files:{empty:"No files listed. Refresh to ask the printer.",confirm_delete:"Delete {name}? This can't be undone."},print:{file:"Sliced file",slots:"Colour box slots, one per colour in the file (for example 1, 2)",slots_invalid:"Slots must be whole numbers separated by commas.",no_file:"Choose a file first.",uploading:"Uploading…",started:"Sent to the printer."}}},de:{},es:{},fr:{},nl:{},"zh-Hans":{}};function It(t,e){let i=t;for(const t of e.split(".")){if(void 0===i||"string"==typeof i)return;i=i[t]}return"string"==typeof i?i:void 0}function Nt(t,e,i){let s;for(const i of function(t){const e=[];if(t){e.push(t);const i=t.split("-")[0];i!==t&&e.push(i)}return e.push("en"),e}(t))if(s=It(jt[i],e),void 0!==s)break;if(void 0!==s)return i?s.replace(/\{(\w+)\}/g,(t,e)=>e in i?String(i[e]):t):s}function Ot(t,e,i){return Nt(t,e,i)??e}function Tt(t,e){if(!e)return Ot(t,"common.states.unknown");const i=Nt(t,`common.states.${e.toLowerCase()}`);return i||((s=e)?s.replace(/_/g," ").split(" ").filter(t=>""!==t).map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).join(" "):Mt);var s}function Ut(t,e,i){if(t?.formatEntityState&&e&&i&&e.state.toLowerCase()===i.toLowerCase())try{const i=t.formatEntityState(e);if(i&&i!==e.state)return i}catch{}return Tt(t?.language,i)}function Bt(t,e=24){return Z`<svg class="mdi" viewBox="0 0 24 24" width=${e} height=${e} aria-hidden="true" focusable="false"><path d=${t} fill="currentColor"></path></svg>`}const Dt=a`
  :host {
    --ac-accent: var(--state-active-color, var(--primary-color, #03a9f4));
    --ac-activity: var(--warning-color, #ffa600);
    --ac-printing: var(--success-color, #43a047);
    --ac-healthy: var(--info-color, #039be5);
    --ac-problem: var(--error-color, #db4437);
    --ac-radius: var(--ha-card-border-radius, 12px);
    --ac-muted: var(--secondary-text-color, #727272);
    --ac-divider: var(--divider-color, rgba(0, 0, 0, 0.12));
    --ac-surface: var(--card-background-color, var(--ha-card-background, #fff));
    --ac-surface-2: var(--secondary-background-color, #f3f3f3);
  }
  .mdi {
    display: block;
    flex: none;
  }
  button {
    font: inherit;
    color: inherit;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid var(--ac-divider);
    background: var(--ac-surface-2);
    color: var(--primary-text-color);
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: background 120ms ease, opacity 120ms ease;
  }
  .btn:hover:not([disabled]) {
    background: color-mix(in srgb, var(--ac-accent) 14%, var(--ac-surface-2));
  }
  .btn:focus-visible,
  .icon-btn:focus-visible,
  .chip:focus-visible {
    outline: 2px solid var(--ac-accent);
    outline-offset: 2px;
  }
  .btn[disabled],
  .icon-btn[disabled],
  .chip[disabled] {
    opacity: 0.45;
    cursor: default;
  }
  .btn.primary {
    background: var(--ac-accent);
    border-color: transparent;
    color: var(--text-primary-color, #fff);
  }
  .btn.danger {
    background: color-mix(in srgb, var(--ac-problem) 14%, var(--ac-surface));
    border-color: color-mix(in srgb, var(--ac-problem) 40%, transparent);
    color: var(--ac-problem);
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--ac-muted);
  }
  .icon-btn:hover:not([disabled]) {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .icon-btn.on {
    color: var(--ac-activity);
  }
  .chip {
    border: 1px solid var(--ac-divider);
    background: transparent;
    border-radius: 16px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 13px;
  }
  .chip.selected {
    background: var(--ac-accent);
    color: var(--text-primary-color, #fff);
    border-color: transparent;
  }
  .muted {
    color: var(--ac-muted);
  }
  .note {
    font-size: 13px;
    color: var(--ac-muted);
    margin: 8px 0 0;
  }
  .warn {
    font-size: 13px;
    color: var(--ac-activity);
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  input,
  select {
    font: inherit;
    color: var(--primary-text-color);
    background: var(--ac-surface);
    border: 1px solid var(--ac-divider);
    border-radius: 8px;
    padding: 8px 10px;
    min-height: 38px;
    box-sizing: border-box;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`,Ft="1.0.0-dev.0",Rt=["PLA","PETG","ABS","PACF","PC","ASA","HIPS","PA","PLA_SE"];function Zt(t){return{config_entry:t.configEntry,device_id:t.deviceId}}async function qt(t,e,i,s={}){if(!e.deviceId||!e.configEntry)throw new Error("No printer selected");await t.callService(_t,i,{...Zt(e),...s})}async function Wt(t,e,i){const s=e.id(i,"button");s&&await t.callService("button","press",{entity_id:s})}async function Yt(t,e){e&&await t.callService("homeassistant","toggle",{entity_id:e})}const Gt={black:"#1b1b1b",white:"#f4f4f4",grey:"#8a8a8a",gray:"#8a8a8a",silver:"#c0c4c8",red:"#d32f2f",orange:"#f57c00",yellow:"#fbc02d",green:"#388e3c",blue:"#1976d2",purple:"#7b1fa2",pink:"#ec6fa4",brown:"#795548",clear:"#dfe9ee",natural:"#e8dcc0",transparent:"#dfe9ee"};function Xt(t){return Math.round(Math.min(255,Math.max(0,t))).toString(16).padStart(2,"0")}function Jt([t,e,i]){return`#${Xt(t)}${Xt(e)}${Xt(i)}`}function Kt(t){const e=/^#?([0-9a-f]{6})$/i.exec(t.trim());if(!e)return;const i=parseInt(e[1],16);return[i>>16&255,i>>8&255,255&i]}function Qt(t){if("string"!=typeof t)return;const e=t.trim().toLowerCase();if(""===e)return;if(Gt[e])return Gt[e];const i=/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(e);if(i){const t=i[1];return 3===t.length?`#${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`:`#${t.slice(0,6)}`}return/^(rgb|rgba|hsl|hsla)\(\s*[-\d.%\s,/deg]+\)$/.test(e)?e:void 0}function te(t){if(!Array.isArray(t)||t.length<3)return;const e=t.slice(0,3).map(Number);return e.some(t=>!Number.isFinite(t))?void 0:e}function ee(t){if(!t)return;const e=Qt(t.color_hex);if(e)return e;const i=te(t.color);return i?Jt(i):void 0}function ie(t,e){return void 0!==t&&void 0!==e&&e>20?Math.min(1,Math.max(0,(t-20)/(e-20))):0}const se=["printing","preheating","paused","downloading","checking"];function re(t,e,i){return St(t)?"off"===e?"offline":St(i)?"unknown":String(i).toLowerCase():String(t).toLowerCase()}function ne(t){return re(t.entity("job_state")?.state,t.entity("printer_online","binary_sensor")?.state,t.entity("current_status")?.state)}function ae(t,e){for(const i of["job_state","current_status"]){const s=t.entity(i);if(s&&!St(s.state)&&s.state.toLowerCase()===e)return s}}function oe(t){return t.value("job_state")?.toLowerCase()}function le(t){const e=oe(t);return void 0!==e&&se.includes(e)}function ce(t){return"paused"===oe(t)}function de(t){return le(t)&&!ce(t)}function pe(t){return!!t&&(t.includes("fail")||t.includes("error"))}class he extends ct{constructor(){super(...arguments),this.open=!1,this.heading="",this.closeLabel="Close",this.onKey=t=>{this.open&&"Escape"===t.key&&this.dismiss()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this.onKey)}disconnectedCallback(){window.removeEventListener("keydown",this.onKey),super.disconnectedCallback()}dismiss(){$t(this,"dialog-closed")}render(){return this.open?R`<div class="backdrop" @click=${t=>t.target===t.currentTarget&&this.dismiss()}>
      <div class="panel" role="dialog" aria-modal="true" aria-label=${this.heading}>
        <header>
          <h2>${this.heading}</h2>
          <button class="icon-btn" title=${this.closeLabel} aria-label=${this.closeLabel} @click=${this.dismiss}>
            ${Bt("M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z")}
          </button>
        </header>
        <slot></slot>
      </div>
    </div>`:W}}he.properties={open:{type:Boolean,reflect:!0},heading:{type:String},closeLabel:{type:String}},he.styles=[Dt,a`
      :host {
        display: contents;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        animation: fade 160ms ease-out;
      }
      .panel {
        width: 80%;
        max-width: 600px;
        max-height: 88vh;
        overflow: auto;
        box-sizing: border-box;
        background: var(--ac-surface);
        color: var(--primary-text-color);
        border-radius: var(--ac-radius);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        padding: 12px 20px 20px;
        animation: pop 160ms ease-out;
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      h2 {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      @media (max-width: 600px) {
        .panel {
          width: 95%;
        }
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: scale(0.94);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .panel {
          animation: none;
        }
      }
    `],bt("anycubic-dialog",he);const ue=a`
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
    margin: 12px 0;
  }
  .row label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1 1 160px;
    font-size: 13px;
    color: var(--ac-muted);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 4px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .swatch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--ac-divider);
    cursor: pointer;
    padding: 0;
  }
  input[type="color"] {
    width: 64px;
    height: 40px;
    padding: 2px;
  }
  p {
    margin: 8px 0;
  }
`;class me extends ct{constructor(){super(...arguments),this.open=!1,this.busy=!1}t(t,e){return Ot(this.hass?.language,t,e)}close(){$t(this,"dialog-closed")}async run(t,e=!0){if(!this.busy){this.busy=!0;try{await t(),e&&this.close()}catch(t){console.error("anycubic-card:",t)}finally{this.busy=!1}}}}me.properties={hass:{attribute:!1},printer:{attribute:!1},open:{type:Boolean},busy:{state:!0}},me.styles=[Dt,ue];class fe extends ct{constructor(){super(...arguments),this.open=!1,this.heading="",this.message=""}render(){const t=t=>Ot(this.hass?.language,t);return R`<anycubic-dialog .open=${this.open} .heading=${this.heading} .closeLabel=${t("common.actions.close")}>
      <p>${this.message}</p>
      <div class="buttons">
        <button class="btn danger" @click=${()=>$t(this,"confirmed")}>${t("common.actions.yes")}</button>
        <button class="btn" @click=${()=>$t(this,"dialog-closed")}>${t("common.actions.no")}</button>
      </div>
    </anycubic-dialog>`}}fe.properties={hass:{attribute:!1},open:{type:Boolean},heading:{type:String},message:{type:String}},fe.styles=[Dt,ue];class ge extends me{constructor(){super(...arguments),this.edits={}}willUpdate(t){t.has("open")&&this.open&&(this.confirm=void 0,this.edits={})}live(t){const e=this.printer;if(!e)return"";switch(t){case"speed":{const t=e.attr("job_speed_mode","print_speed_mode_code");return null==t?"":String(t)}case"nozzle":return e.value("target_nozzle_temp")??"";case"bed":return e.value("target_hotbed_temp")??"";case"fan":return e.value("fan_speed_pct")??""}}val(t){return this.edits[t]??this.live(t)}edit(t,e){this.edits={...this.edits,[t]:e}}save(t){const e=this.hass,i=this.printer,s=Number(this.val(t));if(!e||!i||""===this.val(t)||!Number.isFinite(s))return;const r={speed:["change_print_speed_mode",{speed_mode:Math.round(s)}],nozzle:["change_print_target_nozzle_temperature",{temperature:Math.round(s)}],bed:["change_print_target_hotbed_temperature",{temperature:Math.round(s)}],fan:["change_print_fan_speed",{speed:Math.round(s)}]},[n,a]=r[t];this.run(()=>qt(e,i,n,a))}numberRow(t,e,i,s,r){return R`<div class="row">
      <label
        >${this.t(`card.print_settings.${e}`)}
        <input
          type="number"
          inputmode="numeric"
          .value=${this.val(t)}
          min=${s??W}
          max=${r??W}
          ?disabled=${this.busy}
          @input=${e=>this.edit(t,e.target.value)}
          @keydown=${e=>"Enter"===e.key&&this.save(t)}
      /></label>
      <button class="btn" ?disabled=${this.busy} @click=${()=>this.save(t)}>${this.t(`card.print_settings.${i}`)}</button>
    </div>`}renderConfirm(t){const e=this.t(`common.actions.${t}`);return R`<p>${this.t("card.print_settings.confirm_message",{action:e})}</p>
      <div class="buttons">
        <button
          class="btn danger"
          ?disabled=${this.busy}
          @click=${()=>this.run(()=>Wt(this.hass,this.printer,`${t}_print`))}
        >
          ${this.t("common.actions.yes")}
        </button>
        <button class="btn" ?disabled=${this.busy} @click=${()=>this.confirm=void 0}>${this.t("common.actions.no")}</button>
      </div>`}renderSettings(){const t=this.printer;if(!t)return W;const e=t.attr("job_speed_mode","available_modes"),i=le(t),s=ce(t),r=t.attr("target_nozzle_temp","limit_min"),n=t.attr("target_nozzle_temp","limit_max"),a=t.attr("target_hotbed_temp","limit_min"),o=t.attr("target_hotbed_temp","limit_max");return R`<div class="buttons">
        <button class="btn" ?disabled=${!t.usable("pause_print","button")||!i||s} @click=${()=>this.confirm="pause"}>
          ${this.t("card.print_settings.print_pause")}
        </button>
        <button class="btn" ?disabled=${!t.usable("resume_print","button")||!s} @click=${()=>this.confirm="resume"}>
          ${this.t("card.print_settings.print_resume")}
        </button>
        <button class="btn danger" ?disabled=${!t.usable("cancel_print","button")||!i} @click=${()=>this.confirm="cancel"}>
          ${this.t("card.print_settings.print_cancel")}
        </button>
      </div>
      ${t.isFilament?R`${Array.isArray(e)&&e.length?R`<div class="row">
                <label
                  >${this.t("card.print_settings.label_speed_mode")}
                  <select
                    .value=${this.val("speed")}
                    ?disabled=${this.busy}
                    @change=${t=>this.edit("speed",t.target.value)}
                  >
                    ${e.map(t=>R`<option value=${String(t.mode)} ?selected=${String(t.mode)===this.val("speed")}>${t.description}</option>`)}
                  </select></label
                >
                <button class="btn" ?disabled=${this.busy} @click=${()=>this.save("speed")}>
                  ${this.t("card.print_settings.save_speed_mode")}
                </button>
              </div>`:W}
          ${this.numberRow("nozzle","label_nozzle_temp","save_target_nozzle",r,n)}
          ${this.numberRow("bed","label_hotbed_temp","save_target_hotbed",a,o)}
          ${this.numberRow("fan","label_fan_speed","save_fan_speed",0,100)}`:W}`}render(){const t=this.confirm?this.t("card.print_settings.confirm_heading"):this.t("card.print_settings.heading");return R`<anycubic-dialog .open=${this.open} .heading=${t} .closeLabel=${this.t("common.actions.close")}>
      ${this.confirm?this.renderConfirm(this.confirm):this.renderSettings()}
    </anycubic-dialog>`}}ge.properties={...me.properties,confirm:{state:!0},edits:{state:!0}};class be extends me{constructor(){super(...arguments),this.unit=0,this.presets=[],this.material="",this.colour="#ffffff"}willUpdate(t){if((t.has("open")||t.has("spool"))&&this.open&&this.spool){const t=this.spool.material?.toUpperCase().replace(/\s+/g,"_");this.material=t&&Rt.includes(t)?t:"";const e=function(t){const e=te(t?.color);if(e)return e;const i=Qt(t?.color_hex);return i?.startsWith("#")?Kt(i):void 0}(this.spool.raw);this.colour=e?Jt(e):"#ffffff"}}save(){const t=Kt(this.colour);if(!(this.material&&t&&this.spool&&this.hass&&this.printer))return;const[e,i,s]=t;this.run(()=>qt(this.hass,this.printer,`multi_color_box_set_slot_${this.material.toLowerCase()}`,{box_id:this.unit,slot_number:this.spool.slot,slot_color_red:e,slot_color_green:i,slot_color_blue:s}))}render(){const t=this.presets.map(t=>({raw:t,css:Qt(t)})).filter(t=>!!t.css);return R`<anycubic-dialog
      .open=${this.open}
      .heading=${this.t("card.spool_settings.heading",{slot:this.spool?.slot??""})}
      .closeLabel=${this.t("common.actions.close")}
    >
      <div class="row">
        <label
          >${this.t("card.spool_settings.label_select_material")}
          <select .value=${this.material} @change=${t=>this.material=t.target.value}>
            <option value="" ?selected=${!this.material} disabled>${this.t("card.spool_settings.placeholder_material")} (PLA)</option>
            ${Rt.map(t=>R`<option value=${t} ?selected=${t===this.material}>${t.replace("_"," ")}</option>`)}
          </select></label
        >
      </div>
      ${t.length?R`<p class="muted">${this.t("card.spool_settings.label_preset_colours")}</p>
            <div class="swatches">
              ${t.map(t=>R`<button
                  class="swatch"
                  style="background:${t.css}"
                  title=${t.raw}
                  aria-label=${t.raw}
                  @click=${()=>{const e=t.css.startsWith("#")?t.css:void 0;this.colour=e||(function(t){if("undefined"==typeof document)return;const e=document.createElement("canvas").getContext("2d");if(!e)return;e.fillStyle="#000000",e.fillStyle=t;const i=e.fillStyle;return"string"==typeof i&&i.startsWith("#")?i:void 0}(t.css)??this.colour)}}
                ></button>`)}
            </div>`:W}
      <div class="row">
        <label
          >${this.t("card.spool_settings.label_select_colour")}
          <input type="color" .value=${this.colour} @input=${t=>this.colour=t.target.value}
        /></label>
      </div>
      <div class="buttons">
        <button class="btn primary" ?disabled=${this.busy||!this.material} @click=${this.save}>${this.t("common.actions.save")}</button>
      </div>
    </anycubic-dialog>`}}be.properties={...me.properties,unit:{type:Number},spool:{attribute:!1},presets:{attribute:!1},material:{state:!0},colour:{state:!0}};class $e extends me{constructor(){super(...arguments),this.unit=0}render(){const t=this.printer,e=1===this.unit?"secondary_":"",i=t=>"number"==typeof t&&Number.isFinite(t)&&t>0,s=[1,2,3,4].map(i=>{const s=`${e}drying_start_preset_${i}`;return{n:i,key:s,duration:t?.attr(s,"duration","button"),temp:t?.attr(s,"temperature","button")}}).filter(({key:e,duration:s,temp:r})=>t?.usable(e,"button")&&i(s)&&i(r)),r=`${e}drying_stop`;return R`<anycubic-dialog
      .open=${this.open}
      .heading=${this.t("card.drying_settings.heading")}
      .closeLabel=${this.t("common.actions.close")}
    >
      <div class="stack">
        ${s.map(({n:e,key:i,duration:s,temp:r})=>R`<button class="btn" ?disabled=${this.busy} @click=${()=>this.run(()=>Wt(this.hass,t,i))}>
            ${this.t("card.drying_settings.button_preset",{number:e})} — ${s}
            ${this.t("card.drying_settings.button_minutes")} @ ${r}°C
          </button>`)}
        ${t?.id(r,"button")?R`<button class="btn danger" ?disabled=${this.busy} @click=${()=>this.run(()=>Wt(this.hass,t,r))}>
              ${this.t("card.drying_settings.button_stop_drying")}
            </button>`:W}
      </div>
    </anycubic-dialog>`}}function ve(t,e){return t.usable(`request_file_list_${e}`,"button")}$e.properties={...me.properties,unit:{type:Number}},bt("anycubic-confirm",fe),bt("anycubic-print-settings",ge),bt("anycubic-spool-editor",be),bt("anycubic-drying",$e);class ye extends ct{constructor(){super(...arguments),this.source="local",this.refreshing=!1,this.deleting=!1}t(t,e){return Ot(this.hass?.language,t,e)}async refresh(t){if(!this.refreshing&&this.hass&&ve(t,this.source)){this.refreshing=!0;try{await Wt(this.hass,t,`request_file_list_${this.source}`)}catch(t){console.error("anycubic panel:",t)}finally{this.refreshing=!1}}}async deleteFile(t,e){if(this.confirm=void 0,!this.deleting&&this.hass){this.deleting=!0;try{if("cloud"===this.source){if("number"!=typeof e.id)return;await qt(this.hass,t,"delete_file_cloud",{file_id:e.id})}else await qt(this.hass,t,`delete_file_${this.source}`,{filename:e.name})}catch(t){console.error("anycubic panel:",t)}finally{this.deleting=!1}}}render(){const t=new Lt(this.hass,this.deviceId),e=t.attr(`file_list_${this.source}`,"file_info"),i=Array.isArray(e)?e.filter(t=>t&&"string"==typeof t.name):[],s=ve(t,this.source);return R`<ha-card>
      <div class="bar">
        ${s?W:R`<p class="note">${this.t("common.messages.refresh_unavailable")}</p>`}
        <button class="btn" ?disabled=${!s||this.refreshing} @click=${()=>this.refresh(t)}>
          ${Bt("M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",18)} ${this.t("common.actions.refresh")}
        </button>
      </div>
      ${i.length?R`<ul>
            ${i.map(t=>R`<li>
                <span class="name">${t.name}</span>
                <button
                  class="icon-btn"
                  title=${this.t("common.actions.delete")}
                  aria-label=${`${this.t("common.actions.delete")} ${t.name}`}
                  ?disabled=${this.deleting}
                  @click=${()=>this.confirm=t}
                >
                  ${Bt("M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z")}
                </button>
              </li>`)}
          </ul>`:R`<p class="note">${this.t("panels.files.empty")}</p>`}
      <anycubic-confirm
        .hass=${this.hass}
        .open=${void 0!==this.confirm}
        .heading=${this.t("common.actions.delete")}
        .message=${this.t("panels.files.confirm_delete",{name:this.confirm?.name??""})}
        @dialog-closed=${()=>this.confirm=void 0}
        @confirmed=${()=>this.confirm&&this.deleteFile(t,this.confirm)}
      ></anycubic-confirm>
    </ha-card>`}}ye.properties={hass:{attribute:!1},deviceId:{type:String},source:{type:String},refreshing:{state:!0},deleting:{state:!0},confirm:{state:!0}},ye.styles=[Dt,a`
      ha-card {
        display: block;
        padding: 16px;
      }
      .bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .bar .note {
        flex: 1;
        margin: 0;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        border-bottom: 1px solid var(--ac-divider);
      }
      li:last-child {
        border-bottom: none;
      }
      .name {
        flex: 1;
        overflow-wrap: anywhere;
      }
    `],bt("anycubic-files-page",ye);const _e=["Dry Status","Dry Time"],xe=[...new Set(["Status","Online","Availability","Project","Layer","ETA","Elapsed","Remaining","Hotend","Bed","T Hotend","T Bed","Dry Status","Dry Time","Speed Mode","Fan Speed","On Time","Off Time","Bottom Time","Model Height","Bottom Layers","Z Up Height","Z Up Speed","Z Down Speed"])],we=["auto","camera","preview","printer","printer_model","none"],Ae=["auto","kobra_s1","kobra_s1_combo","kobra_3","resin","fdm"],ke=["filament","insights"],Ce=Object.freeze({vertical:!1,round:!0,use_24hr:!0,temperatureUnit:"C",monitoredStats:["Status","ETA","Elapsed","Remaining"],scaleFactor:1,slotColors:[],showSettingsButton:!1,alwaysShow:!1,mediaView:"auto",printerArt:"auto",showMoveButtons:!1,showControls:!0,sections:["filament"],noCamera:!1}),Se=Object.freeze({...Ce,showSettingsButton:!0,alwaysShow:!0,showMoveButtons:!0,monitoredStats:void 0});function Le(t,e){if("boolean"==typeof t)return t;if("string"==typeof t){const e=t.trim().toLowerCase();if("true"===e)return!0;if("false"===e)return!1}return e}function Me(t){if("number"==typeof t&&Number.isFinite(t))return String(t);if("string"!=typeof t)return;const e=t.trim();return""===e?void 0:e}function He(t){return"string"==typeof t?""===t.trim()?[]:[t.trim()]:Array.isArray(t)?t.filter(t=>"string"==typeof t).map(t=>t.trim()).filter(t=>""!==t):void 0}function Ee(t,e,i){if("string"!=typeof t)return i;const s=t.trim();return e.includes(s)?s:i}function Ve(t,e){const i="number"==typeof t?t:"string"==typeof t?Number(t):NaN;return!Number.isFinite(i)||i<=0?void 0===t?e:1:i}function ze(t,e){if("string"!=typeof t)return e;const i=t.trim().toUpperCase().replace("°","");return"F"===i?"F":"C"===i?"C":e}function Pe(t,e=Ce){const i=t??{},s=He(i.monitoredStats),r=He(i.sections),n="boolean"==typeof i.showMoveButtons||"string"==typeof i.showMoveButtons?Le(i.showMoveButtons,e.showMoveButtons):function(t){const e=He(t?.sections);return void 0!==e&&e.includes("move")}(i)||e.showMoveButtons;return{printer_id:Me(i.printer_id),vertical:Le(i.vertical,e.vertical),round:Le(i.round,e.round),use_24hr:Le(i.use_24hr,e.use_24hr),temperatureUnit:ze(i.temperatureUnit,e.temperatureUnit),lightEntityId:Me(i.lightEntityId),powerEntityId:Me(i.powerEntityId),cameraEntityId:Me(i.cameraEntityId),monitoredStats:void 0!==s?s.filter(t=>xe.includes(t)):e.monitoredStats?[...e.monitoredStats]:void 0,scaleFactor:Ve(i.scaleFactor,e.scaleFactor),slotColors:He(i.slotColors)??[...e.slotColors],showSettingsButton:Le(i.showSettingsButton,e.showSettingsButton),alwaysShow:Le(i.alwaysShow,e.alwaysShow),mediaView:Ee(i.mediaView,we,e.mediaView),printerArt:Ee(i.printerArt,Ae,e.printerArt),showMoveButtons:n,showControls:Le(i.showControls,e.showControls),sections:void 0!==r?ke.filter(t=>r.includes(t)):[...e.sections],noCamera:Le(i.noCamera,e.noCamera)}}function je(t){return"string"==typeof t?""===t||/^[\s\-?:,[\]{}#&*!|>'"%@`]|: |\s#|\s$/.test(t)||/^(true|false|null|yes|no|on|off|~|[-+.\d].*)$/i.test(t)?JSON.stringify(t):t:String(t)}function Ie(t,e){const i=0===e?"ace_spools":"secondary_ace_spools",s=t.aceActive(e),r=t.attr(i,"spool_info"),n=t.attr(i,"box_info"),a=0===e?"":"secondary_",o=(Array.isArray(r)?r:[]).map((e,i)=>{const s="number"==typeof e?.slot?e.slot:i+1;return{slot:s,colour:ee(e),material:"string"==typeof e?.material_type&&e.material_type?e.material_type:void 0,loaded:!1!==e?.spool_loaded,percent:t.num(`${a}ace_slot_${s}_filament_remaining_percent`),raw:e??{}}}),l="number"==typeof n?.loaded_slot?n.loaded_slot:void 0;return{index:e,active:s,slots:o,loadedSlot:s?l:void 0}}function Ne(t){const e=t[0];if(e?.loadedSlot)return{unit:0,slot:e.loadedSlot};const i=t[1];return i?.loadedSlot?{unit:1,slot:i.loadedSlot}:{unit:0,slot:1}}function Oe(t){const{unit:e,slot:i}=Ne(t);return t[e]?.slots.find(t=>t.slot===i)?.colour}const Te=[[["kobra s1"],"enclosed"],[["kobra 3"],"bedslinger"],[["kobra 2"],"bedslinger"],[["photon","mono","m5s","m7"],"resin"],[["kobra"],"bedslinger"]];function Ue(t){const e=(t??"").toLowerCase();for(const[t,i]of Te)if(t.some(t=>e.includes(t)))return i;return"generic"}const Be=110,De={enclosed:{x:100,y:36,w:280,h:196},bedslinger:{x:110,y:30,w:260,h:200},resin:{x:130,y:30,w:220,h:170},generic:{x:112,y:22,w:256,h:230}},Fe=214,Re=246,Ze=204,qe=236;const We="#ffb300",Ye="#ffd27a";function Ge(t){return function(t,e,i){const s=Kt(t)??[0,0,0],r=Kt(e)??[0,0,0],n=Math.min(1,Math.max(0,i));return Jt([s[0]+(r[0]-s[0])*n,s[1]+(r[1]-s[1])*n,s[2]+(r[2]-s[2])*n])}(We,"#ff3d00",t)}function Xe(t,e,i){const s="M0 -2 C 6 -14, 14 -10, 12 -2 Z";return Z`<g transform="translate(${t} ${e})" class="a-fan ${i?"on":""}">
    <circle r="18" class="a-hole a-line"></circle>
    <g class=${i?"spin":""}>
      <circle r="16" fill="none"></circle>
      <path d=${s}></path>
      <path d=${s} transform="rotate(120)"></path>
      <path d=${s} transform="rotate(240)"></path>
      <circle r="3"></circle>
    </g>
  </g>`}function Je(t,e,i,s,r){const n=t+i/2,a=e+s/2;let o;if(r.error)o=Z`<path d="M${n} ${a-13} L${n+14} ${a+11} L${n-14} ${a+11} Z" fill="#e53935"></path>
      <rect x=${n-1.5} y=${a-5} width="3" height="9" fill="#fff"></rect>
      <rect x=${n-1.5} y=${a+6} width="3" height="3" fill="#fff"></rect>`;else if(r.paused)o=Z`<rect x=${n-9} y=${a-11} width="6" height="22" rx="1.5" fill=${We}></rect>
      <rect x=${n+3} y=${a-11} width="6" height="22" rx="1.5" fill=${We}></rect>`;else{const t=.28*Math.min(i,s);o=Z`<g class="a-glyph" transform="translate(${n} ${a})">
      <path d="M0 ${-t} L${.87*t} ${-t/2} L${.87*t} ${t/2} L0 ${t} L${.87*-t} ${t/2} L${.87*-t} ${-t/2} Z"></path>
      <path d="M${.87*-t} ${-t/2} L0 0 L${.87*t} ${-t/2} M0 0 L0 ${t}"></path>
    </g>`}return Z`<rect x=${t} y=${e} width=${i} height=${s} rx="5" class="a-screen"></rect>${o}`}function Ke(t,e,i,s,r){const n=r+(void 0===i.percent?100:Math.min(100,Math.max(0,i.percent)))/100*(s-r),a=i.loaded?i.colour:void 0;return Z`<g>
    <circle cx=${t} cy=${e} r=${s} class="a-reel-rim"></circle>
    <circle cx=${t} cy=${e} r=${n} class=${a?"a-reel":"a-reel empty"} style=${a?`fill:${a}`:""}></circle>
    <circle cx=${t} cy=${e} r=${r} class="a-hole a-line"></circle>
    ${i.feeding?Z`<circle cx=${t} cy=${e} r=${s+4} class="a-feeding"></circle>`:W}
  </g>`}function Qe(t,e){if(e.height<=.5)return W;const i=t.tipColour??"var(--ac-accent)",s=function(t){const e=t?Kt(t):void 0;return e&&(.2126*e[0]+.7152*e[1]+.0722*e[2])/255>.55?"#1b1b1b":"#ffffff"}(t.tipColour?.startsWith("#")?t.tipColour:void 0),r=e.hanging?1:-1,n=e.hanging?e.base:e.base-e.height;if(t.previewUrl){const r=150,a=e.hanging?e.base:e.base-Be,o=e.hanging?`translate(0 ${2*e.base+Be}) scale(1 -1)`:"";return Z`<defs>
        <mask id="mask-${t.uid}" style="mask-type:alpha" maskUnits="userSpaceOnUse"
          x=${e.cx-r/2} y=${a} width=${r} height=${Be}>
          <image href=${t.previewUrl} x=${e.cx-r/2} y=${a}
            width=${r} height=${Be} preserveAspectRatio="xMidYMax meet" transform=${o}></image>
        </mask>
        <clipPath id="reveal-${t.uid}"><rect x=${e.cx-r/2-4} y=${n} width=${r+8} height=${e.height}></rect></clipPath>
        <filter id="halo-${t.uid}" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="grown"></feMorphology>
          <feFlood flood-color=${s} flood-opacity="0.8"></feFlood>
          <feComposite in2="grown" operator="in" result="ring"></feComposite>
          <feMerge><feMergeNode in="ring"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      <g clip-path="url(#reveal-${t.uid})"><g filter="url(#halo-${t.uid})">
        <rect x=${e.cx-r/2} y=${a} width=${r} height=${Be} style="fill:${i}" mask="url(#mask-${t.uid})"></rect>
      </g></g>`}const a=t=>90-26*t/Be,o=a(e.height),l=e.base+r*e.height,c=[[e.cx-45,e.base],[e.cx+45,e.base],[e.cx+o/2,l],[e.cx-o/2,l]].map(t=>t.join(",")).join(" "),d=[];for(let t=7;t<e.height;t+=7){const i=a(t),n=e.base+r*t;d.push(Z`<line x1=${e.cx-i/2} x2=${e.cx+i/2} y1=${n} y2=${n} class="a-layer" style="stroke:${s}"></line>`)}return Z`<polygon points=${c} style="fill:${i}" class="a-part"></polygon>${d}`}function ti(t,e,i,s,r){return Z`
    <rect x=${e} y=${i} width=${s} height="4" rx="2" class=${t.lightOn?"a-led on":"a-led"}></rect>
    ${t.lightOn&&!t.cameraInChamber?Z`<defs><linearGradient id="wash-${t.uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color=${Ye} stop-opacity="0.28"></stop>
            <stop offset="1" stop-color=${Ye} stop-opacity="0"></stop>
          </linearGradient></defs>
          <rect x=${r.x} y=${i+4} width=${r.w} height=${r.h-(i+4-r.y)} fill="url(#wash-${t.uid})"></rect>`:W}`}function ei(t,e){return void 0===t.progress||!Number.isFinite(t.progress)||t.progress<.5?0:Math.min(100,t.progress)/100*e}function ii(t,e,i,s,r,n){const a=t.cameraInChamber?0:ei(t,Be),o=e.chamber.y+12,l=t.cameraInChamber?o:Math.max(o,i-a-42),c=t.printing&&!t.paused&&!t.cameraInChamber;return Z`
    ${n?Z`<rect x=${e.chamber.x-10} y=${l+10} width=${e.chamber.w+20} height="8" rx="3" class="a-rail-bar"></rect>`:Z`<line x1=${e.chamber.x} x2=${e.chamber.x+e.chamber.w} y1=${l+14} y2=${l+14} class="a-rail"></line>`}
    <rect x=${s} y=${i} width=${r} height="6" rx="2" class="a-plate"></rect>
    ${function(t,e,i,s){return t.bedHeat<=0||t.cameraInChamber?W:Z`<rect x=${e} y=${i} width=${s} height="5" rx="2" style="fill:${Ge(t.bedHeat)};opacity:${.3+.7*t.bedHeat}"></rect>`}(t,s,i+6,r)}
    ${t.cameraInChamber?W:Qe(t,{cx:240,base:i,height:a,hanging:!1})}
    ${function(t,e,i,s){const r=t.nozzleHeat>0?Ge(t.nozzleHeat):void 0;return Z`<g transform="translate(${e} ${i})"><g class=${s?"sweep":""}>
    <rect x="-22" y="0" width="44" height="30" rx="5" class="a-chassis solid"></rect>
    <path d="M-7 30 L7 30 L2 39 L-2 39 Z" class="a-nozzle"></path>
    ${r?Z`<circle cx="0" cy="39" r="6" style="fill:${r};opacity:${.35+.65*t.nozzleHeat}" class="a-glow"></circle>`:W}
  </g></g>`}(t,240,l,c)}`}function si(t,e){const i="enclosed"===t.body?function(t,e){const i=e.y0,s=e.chamber,r=`M80 ${i+14} a14 14 0 0 1 14 -14 H386 a14 14 0 0 1 14 14 V${i+306} a14 14 0 0 1 -14 14 H94 a14 14 0 0 1 -14 -14 Z\n    M${s.x} ${s.y} V${s.y+s.h} H${s.x+s.w} V${s.y} Z`;return Z`
    ${t.cameraInChamber?W:Z`<rect x=${s.x} y=${s.y} width=${s.w} height=${s.h} class="a-hole"></rect>`}
    ${ii(t,e,i+Fe,120,240,!1)}
    ${ti(t,110,s.y+2,260,s)}
    <path d=${r} fill-rule="evenodd" class="a-chassis"></path>
    <line x1="100" x2="380" y1=${i+244} y2=${i+244} class="a-rail"></line>
    ${Je(110,i+254,80,50,t)}
    <g class="a-vents">${[0,1,2,3].map(t=>Z`<line x1=${220+22*t} x2=${220+22*t} y1=${i+262} y2=${i+296}></line>`)}</g>
    ${Xe(350,i+279,t.fanOn)}`}(t,e):"bedslinger"===t.body?function(t,e){const i=e.y0,s=e.chamber,r=i+Re;return Z`
    ${ii(t,e,r,140,200,!0)}
    <rect x="150" y=${r+6} width="180" height=${i+262-r-6} class="a-rail-bar"></rect>
    <rect x="96" y=${i+10} width="14" height="252" rx="4" class="a-chassis solid"></rect>
    <rect x="370" y=${i+10} width="14" height="252" rx="4" class="a-chassis solid"></rect>
    <rect x="90" y=${i+6} width="300" height="16" rx="5" class="a-chassis solid"></rect>
    ${ti(t,116,i+24,248,s)}
    <rect x="80" y=${i+262} width="320" height="58" rx="10" class="a-chassis"></rect>
    ${Je(98,i+272,70,38,t)}
    ${Xe(355,i+291,t.fanOn)}`}(t,e):"resin"===t.body?function(t,e){const i=e.y0,s=e.chamber,r=i+Ze,n=t.cameraInChamber?0:ei(t,106),a=t.cameraInChamber?s.y+20:r-14-n;return Z`
    ${t.cameraInChamber?W:Z`<rect x=${s.x} y=${s.y} width=${s.w} height=${s.h} class="a-hole"></rect>`}
    <rect x="322" y=${s.y+6} width="10" height=${r-s.y-6} class="a-rail-bar"></rect>
    <path d="M300 ${a+4} H327" class="a-rail"></path>
    <rect x="170" y=${a} width="140" height="10" rx="2" class="a-chassis solid"></rect>
    ${t.cameraInChamber?W:Qe(t,{cx:240,base:a+10,height:n>0?r-a-10:0,hanging:!0})}
    <rect x="140" y=${r} width="200" height="16" rx="3" class="a-plate"></rect>
    ${ti(t,140,s.y-4,200,s)}
    <rect x="120" y=${i+20} width="240" height=${r-i-20} rx="10" class="a-lid"></rect>
    <rect x="110" y=${i+220} width="260" height="100" rx="10" class="a-chassis"></rect>
    ${Je(130,i+246,76,48,t)}
    ${Xe(330,i+270,t.fanOn)}`}(t,e):function(t,e){const i=e.y0,s=e.chamber;return Z`
    ${t.cameraInChamber?W:Z`<rect x=${s.x} y=${s.y} width=${s.w} height=${s.h} class="a-hole"></rect>`}
    ${ii(t,e,i+qe,150,180,!1)}
    ${ti(t,120,i+18,240,s)}
    <path d="M100 ${i+16} a6 6 0 0 1 6 -6 H374 a6 6 0 0 1 6 6 V${i+304} a6 6 0 0 1 -6 6 H106 a6 6 0 0 1 -6 -6 Z
      M${s.x} ${s.y} V${s.y+s.h} H${s.x+s.w} V${s.y} Z" fill-rule="evenodd" class="a-chassis"></path>
    ${Je(118,i+266,60,34,t)}
    ${Xe(348,i+283,t.fanOn)}`}(t,e),s="resin"===t.body?W:t.ace.length?function(t,e){const i=[];return t.ace.forEach((s,r)=>{const n=`M370 ${e-84*(r+1)+6+36} H${418+12*r} V${e+22} H392`;i.push(Z`<path d=${n} class=${s.feeding?"a-tube feeding":"a-tube"}
      style=${s.feeding&&t.tipColour?`stroke:${t.tipColour}`:""}></path>`)}),t.ace.forEach((t,s)=>{const r=e-84*(s+1)+6;i.push(Z`<rect x="110" y=${r} width="260" height="72" rx="10" class="a-chassis"></rect>`),t.reels.slice(0,4).forEach((t,e)=>i.push(Ke(110+260*(e+.5)/4,r+36,t,26,9)));for(let e=t.reels.length;e<4;e++)i.push(Ke(110+260*(e+.5)/4,r+36,{loaded:!1,feeding:!1},26,9))}),i}(t,e.y0):function(t,e){const i=e+80;return Z`<g>
    <path d="M40 ${i-30} C 40 ${e-22}, 120 ${e-22}, 132 ${e+8}" class="a-tube feeding"
      style=${t.tipColour?`stroke:${t.tipColour}`:""}></path>
    <path d="M80 ${i} H40" class="a-rail"></path>
    ${Ke(40,i,{loaded:!0,feeding:!1,colour:t.tipColour??"var(--ac-accent)"},30,10)}
  </g>`}(t,e.y0);return Z`<svg class="art" viewBox="0 0 ${e.width} ${e.height}" aria-hidden="true" focusable="false"
      preserveAspectRatio="xMidYMid meet">
    ${s}
    ${i}
  </svg>`}const ri=a`
  .art {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  .a-chassis {
    fill: color-mix(in srgb, var(--primary-text-color) 9%, var(--ac-surface));
    stroke: var(--primary-text-color);
    stroke-width: 2;
  }
  .a-chassis.solid {
    fill: color-mix(in srgb, var(--primary-text-color) 22%, var(--ac-surface));
  }
  .a-lid {
    fill: color-mix(in srgb, var(--ac-accent) 10%, transparent);
    stroke: var(--primary-text-color);
    stroke-width: 2;
  }
  .a-hole {
    fill: var(--ac-surface);
  }
  .a-line {
    stroke: var(--primary-text-color);
    stroke-width: 1.5;
  }
  .a-rail {
    stroke: var(--ac-muted);
    stroke-width: 3;
    stroke-linecap: round;
    fill: none;
  }
  .a-rail-bar {
    fill: var(--ac-muted);
    opacity: 0.7;
  }
  .a-plate {
    fill: var(--ac-divider);
    stroke: var(--ac-muted);
    stroke-width: 1;
  }
  .a-nozzle {
    fill: var(--primary-text-color);
  }
  .a-vents line {
    stroke: var(--ac-muted);
    stroke-width: 3;
    stroke-linecap: round;
    opacity: 0.6;
  }
  .a-screen {
    fill: var(--ac-surface);
    stroke: var(--primary-text-color);
    stroke-width: 1.5;
  }
  .a-glyph path {
    fill: none;
    stroke: var(--ac-accent);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .a-fan path,
  .a-fan g > circle:not([fill]) {
    fill: var(--primary-text-color);
  }
  .a-fan {
    opacity: 0.35;
  }
  .a-fan.on {
    opacity: 1;
  }
  .a-fan .spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: ac-spin 1s linear infinite;
  }
  .a-led {
    fill: ${n(Ye)};
    opacity: 0.25;
  }
  .a-led.on {
    opacity: 1;
    filter: drop-shadow(0 0 4px ${n(Ye)});
  }
  .a-reel-rim {
    fill: var(--ac-surface);
    stroke: var(--ac-muted);
    stroke-width: 1.5;
  }
  .a-reel {
    stroke: color-mix(in srgb, var(--primary-text-color) 35%, transparent);
    stroke-width: 1;
  }
  .a-reel.empty {
    fill: var(--ac-surface-2);
  }
  .a-feeding {
    fill: none;
    stroke: var(--ac-accent);
    stroke-width: 3;
  }
  .a-tube {
    fill: none;
    stroke: var(--ac-muted);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.5;
  }
  .a-tube.feeding {
    stroke: var(--ac-accent);
    stroke-width: 4;
    opacity: 1;
  }
  .a-part {
    stroke: none;
  }
  .a-layer {
    stroke-width: 1;
    opacity: 0.25;
  }
  .sweep {
    animation: ac-sweep 4.5s ease-in-out infinite alternate;
  }
  @keyframes ac-sweep {
    from {
      transform: translateX(-85px);
    }
    to {
      transform: translateX(85px);
    }
  }
  @keyframes ac-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sweep,
    .a-fan .spin {
      animation: none;
    }
  }
`;let ni;class ai extends ct{constructor(){super(...arguments),this.available=!0,this.live=!1,this.player="loading"}connectedCallback(){super.connectedCallback(),(customElements.get("ha-camera-stream")?Promise.resolve(!0):(ni??=(async()=>{try{const t=await(window.loadCardHelpers?.());t?.importMoreInfoControl?.("camera")}catch{}await Promise.race([customElements.whenDefined("ha-camera-stream"),new Promise(t=>setTimeout(t,1e4))]);const t=void 0!==customElements.get("ha-camera-stream");return t||(ni=void 0),t})(),ni)).then(t=>this.player=t?"ready":"failed")}render(){const t=t=>Ot(this.hass?.language,`card.media_view.${t}`),e=this.entityId?this.hass?.states[this.entityId]:void 0;return this.available&&e&&"unavailable"!==e.state?"failed"===this.player?R`<div class="msg">${t("player_unavailable")}</div>`:"loading"===this.player?R`<div class="msg">${t("starting")}</div>`:R`<ha-camera-stream
        .hass=${this.hass}
        .stateObj=${e}
        .muted=${!0}
        .controls=${!1}
        .allowExoPlayer=${!0}
        .fitMode=${"contain"}
      ></ha-camera-stream>
      ${this.live?R`<span class="live">${t("live")}</span>`:W}`:R`<div class="msg">${t("camera_unavailable")}</div>`}}ai.properties={hass:{attribute:!1},entityId:{type:String},available:{type:Boolean},live:{type:Boolean},player:{state:!0}},ai.styles=a`
    :host {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
    }
    ha-camera-stream {
      display: block;
      width: 100%;
      height: 100%;
      --video-max-height: 100%;
    }
    .msg {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 12px;
      color: #eee;
      font-size: 14px;
    }
    .live {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #d32f2f;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 6px;
      border-radius: 4px;
    }
  `,bt("anycubic-camera",ai);let oi=0;function li(t){return t.replace(/([?&])token=[^&]*&?/,"$1").replace(/[?&]$/,"")}class ci extends ct{constructor(){super(...arguments),this.preview=!1,this.failed=new Set,this.uid="ac"+ ++oi}get noCamera(){return this.preview||!!this.config?.noCamera}previewUrl(){const t=this.printer?.entity("job_image_url","image");if(!t||"unavailable"===t.state)return;const e=t.attributes.entity_picture;if("string"==typeof e&&e)return e;const i=t.attributes.access_token;return"string"==typeof i?`/api/image_proxy/${t.entity_id}?token=${i}`:void 0}usablePreview(){const t=this.previewUrl();return t&&!this.failed.has(li(t))?t:void 0}willUpdate(t){if(!t.has("hass")&&!t.has("printer"))return;const e=this.previewUrl();if(!e||"undefined"==typeof Image)return;const i=li(e);if(this.failed.has(i)||this.probing===i)return;this.probing=i;const s=new Image;s.onerror=()=>this.markFailed(e),s.src=e}markFailed(t){const e=li(t);this.failed.has(e)||(this.failed=new Set(this.failed).add(e))}tabs(){const t=this.printer,e=t?.camera(this.config?.cameraEntityId),i=!!e&&!this.noCamera,s=!!this.usablePreview(),r=[];return i&&r.push("camera"),s&&r.push("preview"),r.push("printer"),s&&i&&r.push("printer_model"),r}current(t){const e=this.config?.mediaView??"auto";let i,s=!1;return this.tapped?(i=this.tapped,s=!0):"auto"!==e&&"none"!==e?(i=e,s=!0):i=t.includes("preview")?"preview":"printer",t.includes(i)?{tab:i,explicit:s}:{tab:"printer",explicit:!1}}artModel(t,e){const i=this.printer,s=this.config,{body:r,minAce:n}=function(t,e){switch(t){case"kobra_s1":return{body:"enclosed",minAce:0};case"kobra_s1_combo":return{body:"enclosed",minAce:1};case"kobra_3":return{body:"bedslinger",minAce:0};case"resin":return{body:"resin",minAce:0};case"fdm":return{body:"generic",minAce:0};default:return{body:Ue(e),minAce:0}}}(s.printerArt,i.device?.model||i.name),a="resin"===r?0:Math.max(function(t){return t.aceActive(1)?2:t.aceActive(0)?1:0}(i),n),o=[Ie(i,0),Ie(i,1)],l=o.some(t=>t.loadedSlot)?Ne(o):void 0,c=[];for(let t=0;t<a;t++){const e=o[t];c.push({feeding:l?.unit===t,reels:(e?.active?e.slots:[]).map(e=>({colour:e.colour,percent:e.percent,loaded:e.loaded,feeding:l?.unit===t&&l.slot===e.slot}))})}const d=i.camera(s.cameraEntityId),p="printer"===t&&e&&!!d?.available&&!this.noCamera,h=ne(i);return{units:a,model:{uid:this.uid,body:r,ace:c,tipColour:Oe(o.filter(t=>t.active)),progress:i.num("job_progress"),printing:le(i),paused:!0===i.isOn("job_is_paused"),error:pe(h),fanOn:(i.num("fan_speed_pct")??0)>0,lightOn:"on"===i.value("printer_light","light"),nozzleHeat:ie(i.num("curr_nozzle_temp"),i.num("target_nozzle_temp")),bedHeat:ie(i.num("curr_hotbed_temp"),i.num("target_hotbed_temp")),previewUrl:this.usablePreview(),cameraInChamber:p}}}renderArtSurface(t,e){const{model:i,units:s}=this.artModel(t,e),r=function(t,e){const i=30+84*("resin"===t?0:e),s=De[t];return{width:480,height:i+330+6,y0:i,chamber:{...s,y:s.y+i}}}(i.body,s),n=r.chamber,a=(t,e)=>t/e*100+"%",o=this.printer?.camera(this.config?.cameraEntityId);return R`<div class="art-wrap">
      <div class="art-box" style="--ratio: ${r.width/r.height}">
        ${i.cameraInChamber&&o?R`<div
              class="chamber"
              style="left:${a(n.x,r.width)};top:${a(n.y,r.height)};width:${a(n.w,r.width)};height:${a(n.h,r.height)}"
            >
              <anycubic-camera .hass=${this.hass} .entityId=${o.entityId} .available=${o.available} .live=${o.isCloud}></anycubic-camera>
            </div>`:W}
        ${si(i,r)}
      </div>
    </div>`}render(){if(!this.config||"none"===this.config.mediaView||!this.printer)return W;const t=t=>Ot(this.hass?.language,`card.media_view.${t}`),e=this.tabs(),{tab:i,explicit:s}=this.current(e),r="printer"===i||"printer_model"===i;let n;if("camera"===i){const t=this.printer.camera(this.config.cameraEntityId);n=R`<anycubic-camera .hass=${this.hass} .entityId=${t.entityId} .available=${t.available} .live=${t.isCloud}></anycubic-camera>`}else if("preview"===i){const e=this.usablePreview();n=R`<img class="preview-img" src=${e} alt=${t("preview_alt")} @error=${()=>this.markFailed(e)} />`}else n=this.renderArtSurface(i,s);const a={camera:"M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z",preview:"M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z",printer:gt,printer_model:"M7,2H17V8H19V13H16.5L13,17H11L7.5,13H5V8H7V2M10,22H2V20H10A1,1 0 0,0 11,19V18H13V19A3,3 0 0,1 10,22Z"};return R`<div class="frame ${r?"art":""} ${e.length>1?"":"single"}">
      ${n}
      ${e.length>1?R`<div class="tabs">
            ${e.map(e=>R`<button
                title=${t(`tabs.${e}`)}
                aria-label=${t(`tabs.${e}`)}
                aria-pressed=${e===i?"true":"false"}
                @click=${()=>this.tapped=e}
              >
                ${Bt(a[e],20)}
              </button>`)}
          </div>`:W}
    </div>`}}ci.properties={hass:{attribute:!1},printer:{attribute:!1},config:{attribute:!1},preview:{type:Boolean},tapped:{state:!0},failed:{state:!0}},ci.styles=[Dt,ri,a`
      :host {
        display: block;
      }
      .frame {
        position: relative;
        aspect-ratio: 16 / 9;
        border-radius: var(--ac-radius);
        overflow: hidden;
        background: #000;
      }
      .frame.art {
        aspect-ratio: 4 / 3;
        background: transparent;
      }
      .preview-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        background: var(--ac-surface-2);
      }
      .art-wrap {
        position: absolute;
        inset: 0 0 44px 0;
        container-type: size;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .frame.single .art-wrap {
        inset: 0;
      }
      .art-box {
        position: relative;
        width: min(100cqw, calc(100cqh * var(--ratio)));
        height: min(100cqh, calc(100cqw / var(--ratio)));
      }
      .chamber {
        position: absolute;
        overflow: hidden;
        background: #000;
      }
      .art-box .art {
        position: absolute;
        inset: 0;
      }
      .tabs {
        position: absolute;
        left: 8px;
        bottom: 8px;
        display: flex;
        gap: 4px;
        padding: 3px;
        border-radius: 22px;
        background: rgba(0, 0, 0, 0.45);
      }
      .frame.art .tabs {
        background: rgba(0, 0, 0, 0.72);
      }
      .tabs button {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tabs button[aria-pressed="true"] {
        background: rgba(255, 255, 255, 0.92);
        color: #111;
      }
      .tabs button:focus-visible {
        outline: 2px solid #fff;
      }
    `],bt("anycubic-hero",ci);class di extends ct{constructor(){super(...arguments),this.preview=!1,this.defaults=Ce,this.raw={},this.revealed=!1,this.pending=new Set,this.config=Pe({}),this.printer=new Lt(void 0,void 0),this.ticks=new Map,this.closeDialog=()=>{this.dialog=void 0}}setConfig(t){this.raw=t&&"object"==typeof t?{...t}:{}}set cardConfig(t){this.setConfig(t)}getCardSize(){return"none"===this.config.mediaView?4:8}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}static getConfigElement(){return document.createElement("anycubic-card-editor")}static getStubConfig(t){const e=xt(t)[0];return e?{printer_id:e.id}:{}}connectedCallback(){super.connectedCallback(),this.timer=window.setInterval(()=>{de(this.printer)&&this.requestUpdate()},1e3)}disconnectedCallback(){window.clearInterval(this.timer),super.disconnectedCallback()}willUpdate(t){(t.has("raw")||t.has("defaults"))&&(this.config=Pe(this.raw,this.defaults)),(t.has("hass")||t.has("raw"))&&(this.printer=new Lt(this.hass,this.config.printer_id))}t(t,e){return Ot(this.hass?.language,t,e)}async act(t,e){if(!this.pending.has(t)){this.pending=new Set(this.pending).add(t);try{await e()}catch(t){console.error("anycubic-card:",t)}finally{const e=new Set(this.pending);e.delete(t),this.pending=e}}}ticking(t,e){const i=this.printer.entity(t),s=function(t){if(null==t)return;const e=String(t).trim();if(""===e)return;const i=Number(e);if(Number.isFinite(i))return Math.max(0,60*i);const s=/^(?:(\d+)\s+days?,\s*)?(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(e);if(!s)return;const[,r,n,a,o]=s;return 86400*Number(r??0)+3600*Number(n)+60*Number(a)+Math.floor(Number(o))}(i&&"unavailable"!==i.state&&"unknown"!==i.state?i.state:void 0);if(!i||void 0===s)return;const r=`${i.state}|${i.last_updated}`;let n=this.ticks.get(t);if(n&&n.sig===r||(n={sig:r,base:s,at:Date.now()},this.ticks.set(t,n)),!de(this.printer))return n.base=s,n.at=Date.now(),s;const a=(Date.now()-n.at)/1e3;return Math.max(0,n.base+e*a)}temp(t){const e=this.printer.entity(t),i=e?.attributes.unit_of_measurement;return function(t,e,i,s){if(void 0===t||!Number.isFinite(t))return Mt;const r=function(t,e,i){return(e&&/f/i.test(e)?"F":"C")===i?t:"F"===i?9*t/5+32:5*(t-32)/9}(t,e,i);return`${s?Math.round(r):r.toFixed(2)}°${i}`}(this.printer.num(t),i,this.config.temperatureUnit,this.config.round)}plain(t,e=""){const i=this.printer.value(t);return void 0===i?Mt:`${i}${e}`}statValue(t){const e=this.printer,i=this.config,s=this.hass?.language;switch(t){case"Status":{const t=function(t){return re(t.entity("job_state")?.state,void 0,t.entity("current_status")?.state)}(e);return Ut(this.hass,ae(e,t),t)}case"Online":{const t=e.isOn("printer_online");return void 0===t?Mt:this.t(t?"common.values.online":"common.values.offline")}case"Availability":{const t=e.value("current_status");return void 0===t?Mt:Ut(this.hass,e.entity("current_status"),t)}case"Project":return this.plain("job_name");case"Layer":return this.plain("job_current_layer");case"ETA":{const t=function(t,e,i=Date.now()){if(t){const e=Date.parse(t);if(Number.isFinite(e))return new Date(e)}if(void 0!==e&&Number.isFinite(e))return new Date(i+1e3*Math.max(0,e))}(e.value("job_eta"),this.ticking("job_time_remaining",-1));return Et(t,i.use_24hr,i.round,s)}case"Elapsed":return Ht(this.ticking("job_time_elapsed",1),i.round);case"Remaining":return Ht(this.ticking("job_time_remaining",-1),i.round);case"Hotend":return this.temp("curr_nozzle_temp");case"Bed":return this.temp("curr_hotbed_temp");case"T Hotend":return this.temp("target_nozzle_temp");case"T Bed":return this.temp("target_hotbed_temp");case"Speed Mode":{const t=e.attr("job_speed_mode","available_modes"),i=e.attr("job_speed_mode","print_speed_mode_code"),s=Array.isArray(t)?t.find(t=>t.mode===i):void 0;return s?.description??e.value("job_speed_mode")??this.t("common.messages.unknown")}case"Fan Speed":return this.plain("fan_speed_pct","%");case"Dry Status":{const t=e.isOn("dry_status_is_drying");return void 0===t?Mt:this.t(t?"common.values.drying":"common.values.not_drying")}case"Dry Time":{const t=e.num("dry_status_remaining_time"),i=Pt(t,e.num("dry_status_total_duration"));return void 0===t?Mt:R`<span class="dry-time">
          <span>${Math.round(t)} ${this.t("common.values.minutes")}</span>
          ${void 0===i?W:R`<span class="bar small"><span style="width:${i}%"></span></span>`}
        </span>`}case"On Time":return this.plain("job_on_time"," s");case"Off Time":return this.plain("job_off_time"," s");case"Bottom Time":return this.plain("job_bottom_time"," s");case"Model Height":return this.plain("job_model_height"," mm");case"Bottom Layers":return this.plain("job_bottom_layers",` ${this.t("common.values.layers")}`);case"Z Up Height":return this.plain("job_z_up_height"," mm");case"Z Up Speed":return this.plain("job_z_up_speed");case"Z Down Speed":return this.plain("job_z_down_speed");default:return Mt}}renderStats(){const t=this.config.monitoredStats??[];return t.length?R`<dl class="stats">
      ${t.map(t=>R`<div class="stat">
          <dt>${this.t(`card.monitored_stats.${t}`)}</dt>
          <dd>${this.statValue(t)}</dd>
        </div>`)}
    </dl>`:W}renderProgress(){const t=this.printer,e=t.num("job_progress");if(void 0===e||e<0)return W;const i=zt(e),s=this.config.round?`${Math.round(i)}%`:`${Number(i.toFixed(2))}%`,r=t.value("job_current_layer"),n=t.value("job_total_layers");return R`<div class="progress">
      <div class="progress-line">
        <span class="pct">${s}</span>
        ${void 0!==r&&void 0!==n?R`<span class="muted">${this.t("card.progress.layer",{current:r,total:n})}</span>`:W}
      </div>
      <div
        class="bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${Math.round(i)}
      >
        <span style="width:${i}%"></span>
      </div>
    </div>`}renderHeader(t,e){const i=this.config,s=i.lightEntityId?this.hass?.states[i.lightEntityId]:void 0,r="on"===s?.state;return R`<div class="header">
      <button
        class="title"
        aria-expanded=${e?"true":"false"}
        title=${this.t("card.buttons.toggle_body")}
        @click=${()=>this.revealed=!this.revealed}
      >
        <span class="dot"></span>
        <span class="names">
          <span class="name">${this.printer.name??this.t("card.fallback_name")}</span>
          <span class="state">${Ut(this.hass,ae(this.printer,t),t)}</span>
        </span>
      </button>
      ${i.lightEntityId?R`<button
            class="icon-btn ${r?"on":""}"
            title=${this.t("card.buttons.light")}
            aria-label=${this.t("card.buttons.light")}
            aria-pressed=${r?"true":"false"}
            ?disabled=${this.pending.has("light")}
            @click=${()=>this.act("light",()=>Yt(this.hass,i.lightEntityId))}
          >
            ${Bt(r?"M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63Z":"M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z")}
          </button>`:W}
      ${i.powerEntityId?R`<button
            class="icon-btn"
            title=${this.t("card.buttons.power")}
            aria-label=${this.t("card.buttons.power")}
            ?disabled=${this.pending.has("power")}
            @click=${()=>this.act("power",()=>Yt(this.hass,i.powerEntityId))}
          >
            ${Bt("M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13")}
          </button>`:W}
    </div>`}press(t){return()=>this.act(t,()=>Wt(this.hass,this.printer,t))}renderControls(){const t=this.printer,e=le(t),i=ce(t),s=e||this.config.showSettingsButton;return e||s?R`<div class="controls">
      ${e?R`${i?R`<button class="btn" ?disabled=${!t.usable("resume_print","button")||this.pending.has("resume_print")} @click=${this.press("resume_print")}>
                  ${Bt(ft,18)} ${this.t("card.controls.resume")}
                </button>`:R`<button class="btn" ?disabled=${!t.usable("pause_print","button")||this.pending.has("pause_print")} @click=${this.press("pause_print")}>
                  ${Bt("M14,19H18V5H14M6,19H10V5H6V19Z",18)} ${this.t("card.controls.pause")}
                </button>`}
            <button
              class="btn danger"
              ?disabled=${!t.usable("cancel_print","button")||this.pending.has("cancel_print")}
              @click=${()=>this.dialog={kind:"cancel"}}
            >
              ${Bt("M18,18H6V6H18V18Z",18)} ${this.t("card.controls.cancel")}
            </button>`:W}
      ${s?R`<button class="btn" @click=${()=>this.dialog={kind:"settings"}}>
            ${Bt("M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",18)} ${this.t("card.buttons.print_settings")}
          </button>`:W}
    </div>`:W}moveBtn(t,e,i,s=""){const r=this.printer;return R`<button
      class="pad-btn ${s}"
      title=${e}
      aria-label=${e}
      ?disabled=${!r.usable(t,"button")||this.pending.has(t)}
      @click=${this.press(t)}
    >
      ${i}
    </button>`}renderMovePad(){const t=this.printer,e=t=>this.t(`card.move.${t}`),i=t.entity("axis_step","select"),s=i&&"unavailable"!==i.state?i.attributes.options??[]:[],r=!0===t.isOn("axis_moving"),n=!0===t.isOn("axis_move_failed");return R`<div class="move">
      ${s.length?R`<div class="steps" role="group" aria-label=${e("step")}>
            ${s.map(e=>R`<button
                class="chip ${e===i?.state?"selected":""}"
                aria-pressed=${e===i?.state?"true":"false"}
                ?disabled=${this.pending.has("axis_step")}
                @click=${()=>this.act("axis_step",()=>async function(t,e,i,s){const r=e.id(i,"select");r&&await t.callService("select","select_option",{entity_id:r,option:s})}(this.hass,t,"axis_step",e))}
              >
                ${e}
              </button>`)}
          </div>`:W}
      <div class="pad">
        <div class="pad-col">
          ${this.moveBtn("axis_home_all",e("home_all"),Bt("M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"))}
          ${this.moveBtn("axis_motors_off",e("motors_off"),Bt("M3.78,2.5L21.5,20.22L20.23,21.5L18,19.27V20H10L8,18H5V15H3V18H1V10H3V13H5V10L6.87,8.14L2.5,3.77L3.78,2.5M20,9V12H18V8H12V6H15V4H7.82L22.82,19H23V9H20Z"))}
        </div>
        <div class="dial">
          ${this.moveBtn("axis_move_y_plus","Y+",R`${Bt(ut,18)}<small>Y+</small>`,"q top")}
          ${this.moveBtn("axis_move_x_minus",e("x_minus"),R`${Bt("M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",18)}<small>X−</small>`,"q left")}
          ${this.moveBtn("axis_move_x_plus",e("x_plus"),R`<small>X+</small>${Bt("M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",18)}`,"q right")}
          ${this.moveBtn("axis_move_y_minus",e("y_minus"),R`<small>Y−</small>${Bt(ht,18)}`,"q bottom")}
          ${this.moveBtn("axis_home_xy",e("home_xy"),R`${Bt(mt,18)}<small>XY</small>`,"centre")}
        </div>
        <div class="pad-col">
          ${this.moveBtn("axis_move_z_plus",e("z_plus"),R`${Bt(ut,18)}<small>Z</small>`)}
          ${this.moveBtn("axis_home_z",e("home_z"),R`${Bt(mt,18)}<small>Z</small>`,"accent")}
          ${this.moveBtn("axis_move_z_minus",e("z_minus"),R`${Bt(ht,18)}<small>Z</small>`)}
        </div>
      </div>
      ${r?R`<p class="note" role="status">${e("moving")}</p>`:n?R`<p class="warn" role="status">${Bt(pt,18)} ${e("failed")}</p>`:W}
    </div>`}renderAceStrip(t){const e=this.printer,i=Ie(e,t),s=0===t?"multi_color_box_runout_refill":"secondary_multi_color_box_runout_refill",r=e.entity(s,"switch"),n="on"===r?.state;return R`<div class="ace">
      ${r?R`<button
            class="refill ${n?"on":""}"
            role="switch"
            aria-checked=${n?"true":"false"}
            ?disabled=${"unavailable"===r.state||this.pending.has(s)}
            @click=${()=>this.act(s,()=>async function(t,e,i){const s=e.id(i,"switch");s&&await t.callService("switch","toggle",{entity_id:s})}(this.hass,e,s))}
          >
            <span>${this.t("card.buttons.runout_refill")}</span>
            <span class="toggle"><span></span></span>
          </button>`:W}
      <div class="spools">
        ${i.slots.map(e=>R`<button
            class="spool ${i.loadedSlot===e.slot?"feeding":""}"
            title=${`${e.slot}: ${e.material??"---"}`}
            @click=${()=>this.dialog={kind:"spool",unit:t,slot:e}}
          >
            <span class="ring" style="background:${e.loaded&&e.colour?e.colour:"#9e9e9e"}"><span>${e.slot}</span></span>
            <span class="material">${e.loaded?e.material??"---":"---"}</span>
          </button>`)}
      </div>
      <button class="btn dry" @click=${()=>this.dialog={kind:"drying",unit:t}}>
        ${Bt("M7.95,3L6.53,5.19L7.95,7.4H7.94L5.95,10.5L4.22,9.6L5.64,7.39L4.22,5.19L6.22,2.09L7.95,3M13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L11.95,10.4L10.22,9.5L11.64,7.3L10.22,5.1L12.22,2L13.95,2.89M20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89M2,22V14A2,2 0 0,1 4,12H20A2,2 0 0,1 22,14V22H20V20H4V22H2M6,14A1,1 0 0,0 5,15V17A1,1 0 0,0 6,18A1,1 0 0,0 7,17V15A1,1 0 0,0 6,14M10,14A1,1 0 0,0 9,15V17A1,1 0 0,0 10,18A1,1 0 0,0 11,17V15A1,1 0 0,0 10,14M14,14A1,1 0 0,0 13,15V17A1,1 0 0,0 14,18A1,1 0 0,0 15,17V15A1,1 0 0,0 14,14M18,14A1,1 0 0,0 17,15V17A1,1 0 0,0 18,18A1,1 0 0,0 19,17V15A1,1 0 0,0 18,14Z",18)} ${this.t("card.buttons.dry")}
      </button>
    </div>`}renderInsights(){const t=this.printer,e=this.hass?.language??"en",i=this.hass?.config?.currency,s=[],r=r=>{const n=t.num(r);void 0!==n&&s.push([r,Vt(n,e,i)])},n=e=>{const i=t.num(e);var r;void 0!==i&&s.push([e,(r=i,void 0!==r&&Number.isFinite(r)?`${Math.round(r)} g`:Mt)])};r("job_cost"),r("last_job_cost"),r("filament_cost_total"),n("job_filament_required"),n("job_filament_shortfall");const a=t.num("nozzle_wear_percent");var o,l;void 0!==a&&s.push(["nozzle_wear_percent",(o=a,l=1,void 0!==o&&Number.isFinite(o)?`${o.toFixed(l)}%`:Mt)]),n("spool_inventory_remaining");const c=!0===t.isOn("job_filament_insufficient");return R`${c?R`<p class="warn">${Bt(pt,18)} ${this.t("card.insights.insufficient")}</p>`:W}
    ${s.length?R`<div class="insights">
          ${s.map(([t,e])=>R`<div class="tile">
              <span class="muted">${this.t(`card.insights.${t}`)}</span><strong>${e}</strong>
            </div>`)}
        </div>`:R`<p class="note">${this.t("card.insights.empty")}</p>`}`}renderSections(){const t=this.printer,e=[];return this.config.sections.includes("filament")&&t.aceActive(0)&&e.push({id:"filament",body:()=>R`${this.renderAceStrip(0)}${t.aceActive(1)?this.renderAceStrip(1):W}`}),this.config.sections.includes("insights")&&e.push({id:"insights",body:()=>this.renderInsights()}),e.length?R`<div class="sections">
      ${e.map(t=>{const e=this.openSection===t.id;return R`<section class=${e?"open":""}>
          <button
            class="section-head"
            aria-expanded=${e?"true":"false"}
            @click=${()=>this.openSection=e?void 0:t.id}
          >
            <span>${this.t(`card.sections.${t.id}`)}</span>${Bt("M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",20)}
          </button>
          ${e?R`<div class="section-body">${t.body()}</div>`:W}
        </section>`})}
    </div>`:W}renderDialogs(){const t=this.dialog;return R`
      <anycubic-print-settings
        .hass=${this.hass}
        .printer=${this.printer}
        .open=${"settings"===t?.kind}
        @dialog-closed=${this.closeDialog}
      ></anycubic-print-settings>
      <anycubic-spool-editor
        .hass=${this.hass}
        .printer=${this.printer}
        .open=${"spool"===t?.kind}
        .unit=${"spool"===t?.kind?t.unit:0}
        .spool=${"spool"===t?.kind?t.slot:void 0}
        .presets=${this.config.slotColors}
        @dialog-closed=${this.closeDialog}
      ></anycubic-spool-editor>
      <anycubic-drying
        .hass=${this.hass}
        .printer=${this.printer}
        .open=${"drying"===t?.kind}
        .unit=${"drying"===t?.kind?t.unit:0}
        @dialog-closed=${this.closeDialog}
      ></anycubic-drying>
      <anycubic-confirm
        .hass=${this.hass}
        .open=${"cancel"===t?.kind}
        .heading=${this.t("card.print_settings.confirm_heading")}
        .message=${this.t("card.controls.confirm_cancel")}
        @dialog-closed=${this.closeDialog}
        @confirmed=${()=>{this.dialog=void 0,this.press("cancel_print")()}}
      ></anycubic-confirm>
    `}render(){const t=this.config,e=this.printer,i=ne(e),s=le(e),r=t.alwaysShow||s||this.revealed,n="none"!==t.mediaView;return R`<ha-card class="cat-${function(t){return["preheating","busy","moving"].includes(t)?"activity":se.includes(t)?"printing":["operational","finished","available","idle","free"].includes(t)?"healthy":"problem"}(i)}">
      <div class="wrap" style="--hero-fr:${t.scaleFactor}fr">
        ${this.renderHeader(i,r)}
        <div class="body ${r?"open":""}" ?inert=${!r} aria-hidden=${r?"false":"true"}>
          <div class="body-inner">
            <div class="main ${t.vertical?"vertical":""} ${n?"":"no-hero"}">
              ${n?R`<anycubic-hero .hass=${this.hass} .printer=${e} .config=${t} .preview=${this.preview}></anycubic-hero>`:W}
              <div class="summary">${this.renderProgress()} ${this.renderStats()}</div>
            </div>
            ${t.showControls?this.renderControls():W} ${t.showMoveButtons?this.renderMovePad():W}
            ${this.renderSections()}
          </div>
        </div>
      </div>
      ${this.renderDialogs()}
    </ha-card>`}}di.properties={hass:{attribute:!1},preview:{type:Boolean},defaults:{attribute:!1},raw:{state:!0},revealed:{state:!0},openSection:{state:!0},dialog:{state:!0},pending:{state:!0}},di.styles=[Dt,a`
      :host {
        display: block;
      }
      ha-card {
        display: block;
        height: 100%;
        overflow: hidden;
        color: var(--primary-text-color);
        --ac-status: var(--ac-problem);
      }
      ha-card.cat-activity {
        --ac-status: var(--ac-activity);
      }
      ha-card.cat-printing {
        --ac-status: var(--ac-printing);
      }
      ha-card.cat-healthy {
        --ac-status: var(--ac-healthy);
      }
      .wrap {
        container-type: inline-size;
        padding: 8px 16px 16px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .title {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
      }
      .dot {
        width: 12px;
        height: 12px;
        flex: none;
        border-radius: 50%;
        background: var(--ac-status);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ac-status) 25%, transparent);
      }
      .names {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .name {
        font-size: 18px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .state {
        font-size: 13px;
        color: var(--ac-muted);
      }
      .body {
        display: grid;
        grid-template-rows: 0fr;
        opacity: 0;
        transition: grid-template-rows 250ms ease, opacity 250ms ease;
        pointer-events: none;
      }
      .body.open {
        grid-template-rows: 1fr;
        opacity: 1;
        pointer-events: auto;
      }
      .body-inner {
        min-height: 0;
        overflow: hidden;
      }
      @media (prefers-reduced-motion: reduce) {
        .body,
        .bar span {
          transition: none;
        }
      }
      .main {
        display: grid;
        gap: 16px;
        padding-top: 8px;
      }
      @container (min-width: 480px) {
        .main:not(.vertical):not(.no-hero) {
          grid-template-columns: var(--hero-fr) 1fr;
          align-items: center;
        }
      }
      .summary {
        min-width: 0;
      }
      .progress {
        margin-bottom: 8px;
      }
      .progress-line {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 4px;
      }
      .pct {
        font-size: 22px;
        font-weight: 600;
      }
      .bar {
        height: 8px;
        border-radius: 4px;
        background: var(--ac-surface-2);
        overflow: hidden;
      }
      .bar span {
        display: block;
        height: 100%;
        background: var(--ac-status);
        border-radius: inherit;
        transition: width 600ms ease;
      }
      .bar.small {
        height: 5px;
        width: 100%;
        margin-top: 3px;
      }
      .bar.small span {
        background: var(--ac-accent);
      }
      .dry-time {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 80px;
      }
      .stats {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .stat {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 3px 0;
        border-bottom: 1px solid color-mix(in srgb, var(--ac-divider) 60%, transparent);
      }
      .stat:last-child {
        border-bottom: none;
      }
      dt {
        font-weight: 600;
      }
      dd {
        margin: 0;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .move {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .steps {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .pad {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .pad-col {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pad-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        width: 48px;
        height: 44px;
        border-radius: 12px;
        border: 1px solid var(--ac-divider);
        background: var(--ac-surface-2);
        cursor: pointer;
        flex-direction: column;
        font-size: 11px;
      }
      .pad-btn small {
        font-size: 11px;
        line-height: 1;
      }
      .pad-btn.accent {
        background: var(--ac-accent);
        color: var(--text-primary-color, #fff);
        border-color: transparent;
      }
      .pad-btn[disabled] {
        opacity: 0.4;
        cursor: default;
      }
      .dial {
        position: relative;
        width: 168px;
        height: 168px;
        border-radius: 50%;
        background: var(--ac-surface-2);
        border: 1px solid var(--ac-divider);
      }
      .dial .pad-btn {
        position: absolute;
        background: transparent;
        border: none;
      }
      .dial .q.top {
        top: 6px;
        left: calc(50% - 24px);
      }
      .dial .q.bottom {
        bottom: 6px;
        left: calc(50% - 24px);
      }
      .dial .q.left {
        left: 6px;
        top: calc(50% - 22px);
        flex-direction: row;
      }
      .dial .q.right {
        right: 6px;
        top: calc(50% - 22px);
        flex-direction: row;
      }
      .dial .centre {
        top: calc(50% - 26px);
        left: calc(50% - 26px);
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--ac-surface);
        border: 1px solid var(--ac-divider);
      }
      .dial .pad-btn:hover:not([disabled]) {
        color: var(--ac-accent);
      }
      @container (max-width: 360px) {
        .pad {
          gap: 8px;
        }
        .dial {
          width: 144px;
          height: 144px;
        }
        .pad-btn {
          width: 42px;
        }
      }
      .sections {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      section {
        border: 1px solid var(--ac-divider);
        border-radius: 10px;
        overflow: hidden;
      }
      .section-head {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
      }
      .section-head .mdi {
        transition: transform 200ms ease;
      }
      section.open .section-head .mdi {
        transform: rotate(180deg);
      }
      .section-body {
        padding: 0 12px 12px;
      }
      .ace {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 8px 0;
      }
      .ace + .ace {
        border-top: 1px solid var(--ac-divider);
      }
      .refill {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        background: none;
        border: 1px solid var(--ac-divider);
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
      }
      .toggle {
        width: 34px;
        height: 18px;
        border-radius: 9px;
        background: var(--ac-divider);
        position: relative;
      }
      .toggle span {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #fff;
        transition: left 150ms ease;
      }
      .refill.on .toggle {
        background: var(--ac-accent);
      }
      .refill.on .toggle span {
        left: 18px;
      }
      .spools {
        flex: 1 1 210px;
        display: flex;
        justify-content: space-around;
        gap: 4px;
      }
      .spool {
        flex: none;
      }
      .ace .dry {
        margin-left: auto;
      }
      @container (max-width: 420px) {
        .spools {
          order: 3;
          flex-basis: 100%;
        }
      }
      .spool {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
      }
      .ring {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
      }
      .spool.feeding .ring {
        outline: 3px solid var(--ac-accent);
        outline-offset: 2px;
      }
      .ring span {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        color: #111;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .material {
        font-size: 12px;
      }
      .insights {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 8px;
      }
      .tile {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 8px;
        background: var(--ac-surface-2);
        font-size: 13px;
      }
      .tile strong {
        font-size: 16px;
      }
    `],bt("anycubic-card",di);const pi=["Status","ETA","Elapsed","Remaining"],hi=["Online","Availability","Project","Layer"],ui=["Hotend","Bed","T Hotend","T Bed"];function mi(t){return void 0!==t.id("multi_color_box_fw_version","update")?[...pi,...ui,...hi,..._e]:t.isFilament?[...pi,...ui,...hi]:[...pi,...hi]}const fi=[{key:"full",config:{mediaView:"printer",showControls:!0,showMoveButtons:!0,sections:["filament"],alwaysShow:!0}},{key:"model",config:{mediaView:"printer_model",showControls:!0,showMoveButtons:!1,alwaysShow:!0}},{key:"compact",config:{mediaView:"printer",showControls:!1,showMoveButtons:!1,alwaysShow:!0,monitoredStats:["Status","ETA"]}},{key:"vertical",config:{vertical:!0,mediaView:"printer",showControls:!0,showMoveButtons:!1,alwaysShow:!0}}];class gi extends ct{constructor(){super(...arguments),this.panelConfig={}}t(t){return Ot(this.hass?.language,t)}f(t){return this.t(`panels.main.cards.main.fields.${t}`)}heroConfig(t){const e=Pe(this.panelConfig,Se);return{...this.panelConfig,printer_id:this.deviceId,monitoredStats:e.monitoredStats??mi(t)}}firmwareState(t,e){const i=t.value(e,"update");return"on"===i?this.t("common.values.update_available"):"off"===i?this.t("common.values.up_to_date"):void 0}onOff(t,e,i,s){const r=t.isOn(e);return void 0===r?void 0:this.t(r?i:s)}tile(t,e){const i=e.filter(t=>void 0!==t[1]&&null!==t[1]&&""!==t[1]);return i.length?R`<ha-card class="tile">
      <h3>${t}</h3>
      <dl>
        ${i.map(([t,e])=>R`<div><dt>${t}</dt><dd>${e}</dd></div>`)}
      </dl>
    </ha-card>`:W}renderRail(t){const e=t.device,i=t.num("dry_status_remaining_time"),s=Pt(i,t.num("dry_status_total_duration")),r=void 0!==i&&void 0!==s&&i>0?`${Ht(60*i,!0)} (${s.toFixed(2)}%)`:void 0,n=e?.connections?.[0]?.[1],a=[[this.f("printer_name"),t.name],[this.f("printer_id"),e?.serial_number],[this.f("printer_mac"),n]].filter(t=>t[1]);return R`<div class="rail">
      ${this.tile(this.t("panels.main.groups.machine"),[[this.f("printer_model"),e?.model],[this.f("printer_fw_version"),e?.sw_version],[this.f("printer_fw_update_available"),this.firmwareState(t,"fw_version")],[this.f("printer_online"),this.onOff(t,"printer_online","common.values.online","common.values.offline")],[this.f("printer_available"),this.onOff(t,"is_available","common.values.available","common.values.busy")]])}
      ${this.tile(this.t("panels.main.groups.ace"),[[this.f("ace_fw_update_available"),this.firmwareState(t,"multi_color_box_fw_version")],[this.f("drying_active"),this.onOff(t,"dry_status_is_drying","common.values.drying","common.values.not_drying")],[this.f("drying_progress"),r]])}
      ${a.length?R`<ha-card class="tile">
            <details>
              <summary>${this.t("panels.main.groups.diagnostics")}</summary>
              <dl>
                ${a.map(([t,e])=>R`<div><dt>${t}</dt><dd>${e}</dd></div>`)}
              </dl>
            </details>
          </ha-card>`:W}
    </div>`}async copy(t,e){await async function(t){try{if(navigator.clipboard&&window.isSecureContext)return await navigator.clipboard.writeText(t),!0}catch{}const e=document.createElement("textarea");e.value=t,e.setAttribute("readonly",""),e.style.position="fixed",e.style.opacity="0",document.body.appendChild(e),e.select();let i=!1;try{i=document.execCommand("copy")}catch{i=!1}return e.remove(),i}(e)&&(this.copied=t,window.setTimeout(()=>{this.copied===t&&(this.copied=void 0)},1500))}renderGallery(){return R`<section class="gallery">
      <h2>${this.t("panels.main.presets.title")}</h2>
      <p class="muted">${this.t("panels.main.presets.lede")}</p>
      <div class="grid">
        ${fi.map(({key:t,config:e})=>{const i={printer_id:this.deviceId??"<device id>",...e},s=function(t){const e=["type: custom:anycubic-card"];for(const[i,s]of Object.entries(t))if("type"!==i&&null!=s)if(Array.isArray(s))if(0===s.length)e.push(`${i}: []`);else{e.push(`${i}:`);for(const t of s)e.push(`  - ${je(t)}`)}else e.push(`${i}: ${je(s)}`);return e.join("\n")}(i),r=this.copied===t;return R`<ha-card class="preset">
            <header>
              <strong>${this.t(`panels.main.presets.${t}`)}</strong>
              <button class="btn" @click=${()=>this.copy(t,s)}>
                ${Bt(r?"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z":"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",18)}
                ${this.t(r?"panels.main.presets.copied":"panels.main.presets.copy")}
              </button>
            </header>
            <div class="preview" inert>
              <anycubic-card .hass=${this.hass} .preview=${!0} .cardConfig=${i}></anycubic-card>
            </div>
            <pre>${s}</pre>
          </ha-card>`})}
      </div>
    </section>`}render(){const t=new Lt(this.hass,this.deviceId);return R`<div class="top">
        <div class="hero">
          <anycubic-card .hass=${this.hass} .defaults=${Se} .cardConfig=${this.heroConfig(t)}></anycubic-card>
        </div>
        ${this.renderRail(t)}
      </div>
      ${this.renderGallery()}`}}gi.properties={hass:{attribute:!1},deviceId:{type:String},panelConfig:{attribute:!1},copied:{state:!0}},gi.styles=[Dt,a`
      :host {
        display: block;
      }
      .top {
        display: grid;
        gap: 16px;
      }
      @media (min-width: 1100px) {
        .top {
          grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
          align-items: start;
        }
      }
      .rail {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .tile {
        padding: 12px 16px;
      }
      h3 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 500;
      }
      dl {
        margin: 0;
      }
      dl div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 0;
        border-bottom: 1px solid color-mix(in srgb, var(--ac-divider) 60%, transparent);
      }
      dl div:last-child {
        border-bottom: none;
      }
      dt {
        color: var(--ac-muted);
      }
      dd {
        margin: 0;
        text-align: right;
        overflow-wrap: anywhere;
      }
      summary {
        cursor: pointer;
        font-weight: 500;
      }
      details[open] summary {
        margin-bottom: 8px;
      }
      .gallery {
        margin-top: 32px;
      }
      .gallery h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 500;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 380px));
        gap: 16px;
        margin-top: 12px;
      }
      .preset {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .preset header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .preview {
        pointer-events: none;
        user-select: none;
      }
      pre {
        margin: 0;
        padding: 10px;
        border-radius: 8px;
        background: var(--ac-surface-2);
        font-size: 12px;
        overflow-x: auto;
        max-width: 100%;
      }
    `],bt("anycubic-main-page",gi);class bi extends ct{constructor(){super(...arguments),this.mode="no_cloud_save",this.slots="",this.status="idle"}t(t){return Ot(this.hass?.language,t)}edited(){this.error=void 0,"working"!==this.status&&(this.status="idle")}async upload(t){const e=this.hass;if(!e.fetchWithAuth)throw new Error("File upload is not available");const i=new FormData;i.append("file",t);const s=await e.fetchWithAuth("/api/file_upload",{method:"POST",body:i});if(!s.ok)throw new Error(`${s.status} ${s.statusText}`);const r=await s.json();if(!r.file_id)throw new Error("Upload returned no file id");return r.file_id}async print(t,e){if(yt("light"),!this.file)return void(this.error=this.t("panels.print.no_file"));const i=function(t){const e=t.split(/[\s,;]+/).filter(t=>""!==t),i=e.map(Number);if(!i.some(t=>!Number.isInteger(t)||t<1))return i}(this.slots);if(!e||void 0!==i&&0!==i.length){this.status="working",this.error=void 0;try{const s={uploaded_gcode_file:await this.upload(this.file)};e&&i&&(s.slot_number=i),await qt(this.hass,t,`print_and_upload_${this.mode}`,s),this.status="done",yt("success")}catch(t){this.status="failed",this.error=t instanceof Error?t.message:String(t?.message??t),yt("failure")}}else this.error=this.t("panels.print.slots_invalid")}render(){const t=new Lt(this.hass,this.deviceId),e=t.aceActive(0),i="working"===this.status;return R`<ha-card>
      <label class="field">
        <span>${this.t("panels.print.file")}</span>
        <input
          type="file"
          accept=${".gcode,.pwsp,.pwsq,.zip"}
          ?disabled=${i}
          @change=${t=>{this.file=t.target.files?.[0],this.edited()}}
        />
      </label>
      ${e?R`<label class="field">
            <span>${this.t("panels.print.slots")}</span>
            <input
              .value=${this.slots}
              inputmode="numeric"
              placeholder="1, 2"
              ?disabled=${i}
              @input=${t=>{this.slots=t.target.value,this.edited()}}
            />
          </label>`:W}
      ${this.error?R`<div class="alert" role="alert">${this.error}</div>`:W}
      ${"done"===this.status?R`<p class="ok" role="status">${this.t("panels.print.started")}</p>`:W}
      <div class="actions">
        <button class="btn primary" ?disabled=${i||!t.exists} @click=${()=>this.print(t,e)}>
          ${i?R`<span class="spinner" aria-hidden="true"></span>`:Bt(ft,18)}
          ${i?this.t("panels.print.uploading"):this.t("common.actions.print")}
        </button>
      </div>
    </ha-card>`}}bi.properties={hass:{attribute:!1},deviceId:{type:String},mode:{type:String},file:{state:!0},slots:{state:!0},status:{state:!0},error:{state:!0}},bi.styles=[Dt,a`
      ha-card {
        display: block;
        padding: 16px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }
      .field span {
        font-weight: 500;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
      .alert {
        border-left: 4px solid var(--ac-problem);
        background: color-mix(in srgb, var(--ac-problem) 10%, transparent);
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      .ok {
        color: var(--ac-printing);
      }
      .spinner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-right-color: transparent;
        animation: spin 800ms linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `],bt("anycubic-print-page",bi);const $i=["main","local-files","udisk-files","cloud-files","print-no_cloud_save","print-save_in_cloud","debug"],vi={main:"panels.main.title","local-files":"panels.files_local.title","udisk-files":"panels.files_udisk.title","cloud-files":"panels.files_cloud.title","print-no_cloud_save":"panels.print_no_cloud_save.title","print-save_in_cloud":"panels.print_save_in_cloud.title",debug:"panels.debug.title"};function yi(t){const e=(t??"").split("/").filter(t=>""!==t);return e.length?{deviceId:decodeURIComponent(e[0]),page:e[1]??"main"}:{}}class _i extends ct{constructor(){super(...arguments),this.narrow=!1}t(t){return Ot(this.hass?.language,t)}get base(){return this.route?.prefix||"/anycubic_cloud"}pages(){return $i.filter(t=>"debug"!==t||false)}updated(t){if(!t.has("route")&&!t.has("hass"))return;const{deviceId:e}=yi(this.route?.path);if(e||!this.hass)return;const i=xt(this.hass);1===i.length&&vt(`${this.base}/${i[0].id}/main`,!0)}goto(t,e){const i=`${this.base}/${encodeURIComponent(t)}/${e}`;i!==window.location.pathname?vt(i):this.renderRoot.querySelector(".content")?.scrollTo({top:0,behavior:"smooth"})}renderSelect(){const t=xt(this.hass);return R`<div class="select">
      <p>${this.t(t.length?"panels.initial.printer_select":"panels.initial.no_printers")}</p>
      <div class="printers">
        ${t.map(t=>R`<button class="printer" @click=${()=>this.goto(t.id,"main")}>
            ${Bt(gt,48)}<span>${wt(t)??t.id}</span>
          </button>`)}
      </div>
    </div>`}renderPage(t,e){switch(e){case"main":return R`<anycubic-main-page
          .hass=${this.hass}
          .deviceId=${t}
          .panelConfig=${function(t){const e=t?.config;if(!e||"object"!=typeof e)return{};const i=e.card_config;if(i&&"object"==typeof i&&!Array.isArray(i))return{...i};const s={...e};return delete s._panel_custom,s}(this.panel)}
        ></anycubic-main-page>`;case"local-files":case"udisk-files":case"cloud-files":return R`<anycubic-files-page .hass=${this.hass} .deviceId=${t} .source=${e.split("-")[0]}></anycubic-files-page>`;case"print-no_cloud_save":case"print-save_in_cloud":return R`<anycubic-print-page .hass=${this.hass} .deviceId=${t} .mode=${e.slice(6)}></anycubic-print-page>`;default:return R`<p class="note">${this.t("common.messages.page_not_found")}</p>`}}render(){const{deviceId:t,page:e}=yi(this.route?.path),i=t&&void 0!==this.hass?.devices[t],s="main"===e;return R`<div class="toolbar">
        ${this.narrow?customElements.get("ha-menu-button")?R`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:R`<button class="icon-btn menu" @click=${()=>$t(this,"hass-toggle-menu")}>${Bt("M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z")}</button>`:W}
        <div class="title">${this.t("title")}</div>
        <div class="version">${Ft}</div>
      </div>
      ${i?R`<nav class="tabs" role="tablist">
            ${this.pages().map(i=>R`<button role="tab" aria-selected=${i===e?"true":"false"} @click=${()=>this.goto(t,i)}>
                ${this.t(vi[i])}
              </button>`)}
          </nav>`:W}
      <div class="content">
        <div class="lane ${s?"wide":""}">${i?this.renderPage(t,e):this.renderSelect()}</div>
      </div>`}}_i.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1}},_i.styles=[Dt,a`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        height: var(--header-height, 56px);
        padding: 0 16px;
        box-sizing: border-box;
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
        border-bottom: var(--app-header-border-bottom, none);
        flex: none;
      }
      .toolbar .menu {
        color: inherit;
      }
      .title {
        flex: 1;
        font-size: 20px;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .version {
        font-size: 12px;
        opacity: 0.8;
      }
      .tabs {
        display: flex;
        overflow-x: auto;
        scrollbar-width: none;
        background: var(--app-header-background-color, var(--primary-color));
        flex: none;
      }
      .tabs button {
        flex: none;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
        opacity: 0.75;
        padding: 12px 16px;
        text-transform: uppercase;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }
      .tabs button[aria-selected="true"] {
        opacity: 1;
        border-bottom-color: currentColor;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .lane {
        margin: 0 auto;
        max-width: 1024px;
      }
      .lane.wide {
        max-width: 1600px;
      }
      @media (max-width: 600px) {
        .content {
          padding: 8px;
        }
      }
      .select {
        text-align: center;
        padding-top: 32px;
      }
      .printers {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        margin-top: 16px;
      }
      .printer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 180px;
        padding: 24px 12px;
        border-radius: var(--ac-radius);
        border: 1px solid var(--ac-divider);
        background: var(--ac-surface);
        cursor: pointer;
        font-size: 16px;
      }
      .printer:hover {
        border-color: var(--ac-accent);
      }
      .debug {
        white-space: pre-wrap;
        font-size: 12px;
      }
    `],bt("anycubic-cloud-panel",_i),console.info(`%c anycubic-cloud-panel %c ${Ft} `,"background:#1976d2;color:#fff;border-radius:3px 0 0 3px","background:#555;color:#fff;border-radius:0 3px 3px 0");
