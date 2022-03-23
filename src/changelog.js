const fs = require("fs"), {join} = require("path")

const {core: packages} = require("../../bin/packages")

function extract(log, name) {
  let release = /(?:^|\n)## ([\d\.]+) \(([\d-]+)\)\n([^]*?)(?=\n## |$)/g
  for (let m; m = release.exec(log);) {
    let [, version, date, body] = m
    return {
      date: new Date(date),
      name: name ? `@codemirror/${name}` : '@codemirror/next',
      version,
      body,
      content: (name ? `## [@codemirror/${name}](../ref/#${name})` : `## @codemirror/next`) +
        ` ${version} (${date})\n${body}`
    }
  }
}

function buildChangelog() {
  let entries = []
  for (let name of packages) entries.push(extract(fs.readFileSync(join(__dirname, "..", "..", name, "CHANGELOG.md"), "utf8"), name))
  entries.push(extract(fs.readFileSync(join(__dirname, "historic_changelog.md"), "utf8")))
  return entries.sort((a, b) => (a.date == b.date ? 0 : a.date < b.date ? 1 : -1))
}

exports.changelog = function() {
  return buildChangelog().map(e => e.content).join("\n")
}

exports.changelogData = function() {
  return buildChangelog()
}
