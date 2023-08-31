/* eslint-env es6 */
class CustomElement extends HTMLElement {
  connectedCallback() {
    this.style.backgroundImage = 'url("' + this.getAttribute("data-src-base") + '")';
  }
}

window.customElements.define("custom-element", CustomElement);
