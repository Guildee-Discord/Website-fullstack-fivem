function stripAnsi(s) {
  return String(s).replace(/\x1b\[[0-9;]*m/g, "");
}

function printBox(lines, color = "\x1b[36m") {
  const reset = "\x1b[0m";
  const max = Math.max(...lines.map((l) => stripAnsi(l).length));
  const width = max + 6;

  const top = "╔" + "═".repeat(width - 2) + "╗";
  const mid = "╠" + "═".repeat(width - 2) + "╣";
  const bot = "╚" + "═".repeat(width - 2) + "╝";

  console.log(color + top + reset);

  lines.forEach((l, i) => {
    if (i === 1) console.log(color + mid + reset);

    const pad = " ".repeat(max - stripAnsi(l).length);
    console.log(color + "║  " + reset + l + pad + color + "  ║" + reset);
  });

  console.log(color + bot + reset);
}

module.exports = { printBox };