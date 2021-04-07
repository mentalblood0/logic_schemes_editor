'use strict';

function ModalWindow(props) {
  return /*#__PURE__*/React.createElement("div", {
    className: props.className
  }, /*#__PURE__*/React.createElement("div", {
    className: "modalWindowOverlay",
    onClick: props.close_function
  }), /*#__PURE__*/React.createElement("div", {
    className: "modalWindow"
  }, props.children));
}