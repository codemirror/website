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
[Bublé](https://buble.surge.sh) might look like this:

```javascript
import buble from "@rollup/plugin-buble"
import resolve from "@rollup/plugin-node-resolve"

module.exports = {
  input: "./editor.js",
  output: {
    file: "./www/editor.js",
    format: "umd"
  },
  plugins: [
    buble({transforms: {dangerousForOf: true}}),
    resolve()
  ]
}
```

(All `for/of` loops in the library are on arrays, so crude `for/of`
compilation like Bublé's `dangerousForOf` can safely be used.)

There are three library features that the library uses but IE11
doesn't support. For these you'll need to load
[polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)) of
some kind.

 - [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
 - [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
 - [`ChildNode.remove`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove)

You can either manually include code that defines these when they
aren't already available, or use a service like
[polyfill.io](https://polyfill.io/) to get them...

```text/html
<script src=
  "https://polyfill.io/v3/polyfill.min.js?features=Promise%2CObject.assign%2CElement.prototype.remove"
></script>
```
