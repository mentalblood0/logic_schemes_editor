"use strict";

/** @jsx h */
function ModalWindow(props) {
  return h("div", {
    className: props.className
  }, h("div", {
    className: "modalWindowOverlay",
    onClick: props.close_function
  }), h("div", {
    className: "modalWindow"
  }, props.children));
}