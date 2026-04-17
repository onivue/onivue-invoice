// react 19 breaking change: react/jsx-dev-runtime production bundle sets jsxDEV = void 0
// tanstack start ssr build uses the dev jsx transform (jsxDEV calls) even in production
// this shim forwards jsxDEV to jsx from react/jsx-runtime which is always a real function
// extra dev-only args (isStaticChildren, source, self) are safely ignored by jsx
export { Fragment, jsx as jsxDEV, jsxs } from "react/jsx-runtime";
