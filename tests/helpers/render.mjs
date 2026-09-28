import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function render(Component, props = {}) {
  return renderToStaticMarkup(createElement(Component, props));
}
