//!create

import {EditorView, basicSetup} from "codemirror"
import {html} from "@codemirror/lang-html"
import {bidiIsolates} from "@codemirror/language"

new EditorView({
  doc: `זהו עורך קוד מימין לשמאל.
يحتوي على شريط التمرير على الجانب الأيمن
`,
  extensions: basicSetup,
  parent: document.querySelector("#rtl_editor")
})

new EditorView({
  doc: `النص <span class="blue">الأزرق</span>\n`,
  extensions: [basicSetup, html(), bidiIsolates()],
  parent: document.querySelector("#isolate_editor")
})
