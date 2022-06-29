//!html

import {parser as htmlParser} from "@lezer/html"
import {parser as jsParser} from "@lezer/javascript"
import {parseMixed} from "@lezer/common"
import {LRLanguage} from "@codemirror/language"

const mixedHTMLParser = htmlParser.configure({
  wrap: parseMixed(node => {
    return node.name == "ScriptText" ? {parser: jsParser} : null
  })
})

const mixedHTML = LRLanguage.define({parser: mixedHTMLParser})

//!showHTML

import {EditorView, basicSetup} from "codemirror"

new EditorView({
  doc: "<!doctype html>\n<script>\n  function foo() { return true }\n</script>",
  extensions: [basicSetup, mixedHTML],
  parent: document.querySelector("#html-editor")!
})

//!twig

import {parser as twigParser} from "./twig-parser.js"
import {htmlLanguage} from "@codemirror/lang-html"
import {foldNodeProp, foldInside, indentNodeProp} from "@codemirror/language"

const mixedTwigParser = twigParser.configure({
  props: [
    // Add basic folding/indent metadata
    foldNodeProp.add({Conditional: foldInside}),
    indentNodeProp.add({Conditional: cx => {
      let closed = /^\s*\{% endif/.test(cx.textAfter)
      return cx.lineIndent(cx.node.from) + (closed ? 0 : cx.unit)
    }})
  ],
  wrap: parseMixed(node => {
    return node.type.isTop ? {
      parser: htmlLanguage.parser,
      overlay: node => node.type.name == "Text"
    } : null
  })
})

const twigLanguage = LRLanguage.define({parser: mixedTwigParser})

//!showTwig

new EditorView({
  doc: `<div>
  {{ content }}
{% if extra_content %}
  <hr></div><div class=extra>{{ extra_content }}
{% endif %}
  <hr>
</div>
`,
  extensions: [basicSetup, twigLanguage],
  parent: document.querySelector("#twig-editor")!
})

//!twigCompletion

const twigAutocompletion = twigLanguage.data.of({
  autocomplete: context => /* Twig completion logic here */ null 
})

//!twigExtension

import {html} from "@codemirror/lang-html"

export function twig() {
  return [
    twigLanguage,
    twigAutocompletion,
    html().support
  ]
}

//!showTwig2

new EditorView({
  doc: `<h2>hello {{ name }}</h2>
<script>
  let myVar = 100
  my
</script>
`,
  extensions: [basicSetup, twig()],
  parent: document.querySelector("#twig2-editor")!
})
