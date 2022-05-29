(function() {
  // Search box

  let space = document.querySelector("#toc").appendChild(document.createElement("div"))
  space.id = "searchbox"
  let box = space.appendChild(document.createElement("input"))
  box.setAttribute("aria-label", "search")
  box.placeholder = "search"
  let runTimeout = -1
  box.oninput = () => {
    clearTimeout(runTimeout)
    runTimeout = setTimeout(() => runSearch(box.value.trim()), 200)
  }
  let results = space.appendChild(document.createElement("ul"))
  results.className = "results"
  results.setAttribute("aria-live", "polite")

  function runSearch(query) {
    results.textContent = ""
    box.className = query ? "active" : ""
    if (!query) return
    query = query.toLowerCase()

    let result = new ResultSet
    if (/^\w+$/.test(query)) { // Simple single word
      result.match(query, true)
    } else {
      query = query.replace(/'[^']*'|"[^"]*"/g, m => {
        let inner = m.slice(1, m.length - 1)
        if (inner) result.match(inner.replace(/\W+/g, " "), false)
        return ""
      })
      let words = query.match(/\w+/g)
      for (let i = 0; i < words.length; i++) if (words[i]) result.match(words[i], false)
    }

    let matches = result.matches ? result.matches.sort((a, b) => b[1] - a[1]) : []
    for (let i = 0; i < Math.min(matches.length, 10); i++) {
      let item = matches[i][0], elt = results.appendChild(document.createElement("li"))
      let link = elt.appendChild(document.createElement("a"))
      link.href = "#" + encodeURIComponent(item.node.id)
      link.textContent = item.name
    }
  }

  class Item {
    constructor(node, name) {
      this.node = node
      let match = /^[\w$]+\.(.*)/.exec(node.id)
      if (match) match = /((?:[\w$]+[.^])?[\w$]+)$/.exec(match[1])
      this.name = match ? match[1].replace(/\^/g, ".") : name
      if (!node.id) node.id = "i_" + Math.floor(Math.random() * 0xffffffff).toString(16)
      this.text = []
      this.weight = []
    }

    add(text, weight) {
      this.text.push(text.toLowerCase().replace(/\W+/g, " ").trim())
      this.weight.push(weight)
    }

    addFromLink(node) {
      let text = node.textContent
      this.add(text, NAME)
      let words = text.split(/(?<=[a-z])(?=[A-Z])/).filter(x => x)
      if (words.length > 1) for (let i = 0; i < words.length; i++) this.add(words[i].toLowerCase(), NAME >> 1)
      let context = this.node.id && this.node.id.match(/[\w$]+[.^]/g)
      if (context) for (let i = 0; i < context.length; i++) this.add(context[i].toLowerCase(), CONTEXT)
    }
  }

  const NAME = 30, TITLE = 20, CONTEXT = 10, TEXT = 1

  function retrieveText() {
    let items = []
    let curItem = null
    function explore(node) {
      if (node.nodeType != 1) return
      if (/^(DT|H.)$/.test(node.nodeName)) {
        let main = node.querySelector(`a[href^="#"]`)
        items.push(curItem = new Item(node, main ? main.textContent : node.textContent))
        if (main) curItem.addFromLink(main)
        else curItem.add(node.textContent, TITLE)
      } else if (/^(P|LI)$/.test(node.nodeName) && curItem) {
        curItem.add(node.textContent, TEXT)
      } else if (!/^(PRE)$/.test(node.nodeName)) {
        for (let ch = node.firstChild; ch; ch = ch.nextSibling) explore(ch)
      }
    }
    explore(document.querySelector("article"))
    return items
  }

  let text = null

  class ResultSet {
    constructor() {
      this.matches = null
    }

    match(term, single) {
      if (!text) text = retrieveText()
      let re = new RegExp("(^| )" + term + "($| )"), singleRE = single ? new RegExp("(^| )" + term) : null
      let prev = this.matches
      this.matches = []
      let handle = (item, score) => {
        let match = 0
        for (let i = 0; i < item.text.length; i++) {
          if (single && item.weight[i] == NAME && singleRE.test(item.text[i]))
            match += item.weight[i] * (term == item.text[i] ? 2 : 1)
          else if (re.test(item.text[i]))
            match += item.weight[i]
        }
        if (match > 0) this.matches.push([item, score + match])
      }
      if (prev) for (let i = 0; i < prev.length; i++) handle(prev[i][0], prev[i][1])
      else for (let i = 0; i < text.length; i++) handle(text[i], 0)
    }
  }

  // Highlight module currently scrolled into view

  let sections = document.querySelectorAll("#toc a[href]")

  function nodeAt(x, y) {
    if (document.caretPositionFromPoint) {
      let pos = document.caretPositionFromPoint(x, y)
      if (pos) return pos.offsetNode
    } else if (document.caretRangeFromPoint) {
      let range = document.caretRangeFromPoint(x, y)
      if (range) return range.startContainer
    }
  }

  function updateCurrentSection() {
    let node = nodeAt(innerWidth / 2, innerHeight / 8)
    for (; node; node = node.parentNode) {
      if (node.nodeName == "SECTION") {
        let href = "#" + encodeURIComponent(node.id)
        for (let i = 0; i < sections.length; i++) {
          sections[i].classList.toggle("current-section", sections[i].getAttribute("href") == href)
        }
      }
    }
  }

  setTimeout(updateCurrentSection, 200)
  let updating = false
  window.onscroll = () => {
    if (updating) return
    updating = true
    setTimeout(() => {
      updating = false
      updateCurrentSection()
    }, 200)
  }
})()
