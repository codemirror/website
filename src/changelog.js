const fs = require("fs"), {join} = require("path")

const {core: packages} = require("../../bin/packages")

exports.changelog = function() {
  let entries = []
  function extract(log, name) {
    let release = /(?:^|\n)## ([\d\.]+) \(([\d-]+)\)\n([^]*?)(?=\n## |$)/g
    for (let m; m = release.exec(log);) {
      let [, version, date, body] = m
      entries.push({
        date,
        content: (name ? `## [${name == "codemirror" ? name : "@codemirror/" + name}](../ref/#${name})` : `## @codemirror/next`) +
          ` ${version} (${date})\n${body}`
      })
    }
  }
  for (let name of packages) extract(fs.readFileSync(join(__dirname, "..", "..", name, "CHANGELOG.md"), "utf8"), name)
  extract(fs.readFileSync(join(__dirname, "historic_changelog.md"), "utf8"))
  return entries.sort((a, b) => (a.date == b.date ? 0 : a.date < b.date ? 1 : -1)).map(e => e.content).join("\n")
}
