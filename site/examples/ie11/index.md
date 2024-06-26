!{"type": "examples", "title": "CodeMirror IE11 Example"}

# Example: Running On Internet Explorer 11

CodeMirror is entirely written with ECMAScript 2018 syntax (avoiding
some constructs that are awkward or verbose to compile down to ES5)
using, almost entirely, the ES5 standard library.

That means that you don't have to polyfill a lot, to run it on
Internet Explorer, but you do have to compile the syntax down to
ES5—the distributed files are in ES2015 syntax. Since you'll need to
use some kind of
[bundler](https://medium.freecodecamp.org/javascript-modules-part-2-module-bundling-5020383cf306)
to load the modules anyway, you could use a bundler plugin that wires
in [Babel](https://babeljs.io) or another syntax-downgrader.

A [rollup](https://rollupjs.org/) setup that does this using
might look like this:

```javascript
import babel from "@rollup/plugin-babel"
import resolve from "@rollup/plugin-node-resolve"

export default {
  input: "./editor.js",
  output: {
    file: "./www/editor.js",
    format: "umd"
  },
  plugins: [
    babel(),
    resolve()
  ]
}
```

All `for/of` loops in the library are on arrays, so you can optimize
by using a Babel plugin like
[transform-for-of-as-array](https://github.com/jridgewell/babel-plugin-transform-for-of-as-array)
if you want.

There are three library features that the library uses but IE11
doesn't support. For these you'll need to load
[polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)) of
some kind.

 - [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
 - [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
 - [`ChildNode.remove`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove)
