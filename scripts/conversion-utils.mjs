import fs from "node:fs";
import path from "node:path";

export const SOURCE_MARKDOWN = "PFO CORRECTAS VVIC.md";
export const QUESTIONS_JSON = path.join("src", "data", "questions.json");
export const EXCLUDED_BLOCKS_MD = "conversion-excluded-blocks.md";

const questionStartPattern = /^\s*(\d{1,3})([.)])\s*(\S.*)$/;
const optionStartPattern = /^\s*([a-eA-E])\)\s*(.*)$/;
const correctMarkerPattern = /\*\*\[CORRECTA\]\*\*/g;

export function readSource(root = process.cwd()) {
  const markdownPath = path.join(root, SOURCE_MARKDOWN);
  const markdown = fs.readFileSync(markdownPath, "utf8");
  return {
    markdownPath,
    markdown,
    lines: markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"),
  };
}

export function countCorrectMarkers(text) {
  return [...text.matchAll(correctMarkerPattern)].length;
}

export function looksLikeQuestionStart(line, previousNumber) {
  const match = line.match(questionStartPattern);
  if (!match) return false;

  const number = Number(match[1]);
  const text = match[3] ?? "";

  if (/^PFO\b/i.test(text) || /^PFO/i.test(text)) return true;

  if (previousNumber !== null && (number === previousNumber + 1 || number === 1)) {
    return /[A-ZÁÉÍÓÚÑÜ¿]/.test(text[0] ?? "");
  }

  return false;
}

export function detectQuestionBlocks(lines) {
  const starts = [];
  let previousNumber = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!looksLikeQuestionStart(line, previousNumber)) continue;

    const match = line.match(questionStartPattern);
    const number = Number(match[1]);
    starts.push({
      lineIndex: index,
      lineNumber: index + 1,
      number,
      rawStartLine: line,
    });
    previousNumber = number;
  }

  return starts.map((start, index) => ({
    ...start,
    endLineIndex: index + 1 < starts.length ? starts[index + 1].lineIndex : lines.length,
  }));
}

function trimEmptyEdges(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;

  return lines.slice(start, end);
}

function normalizeText(lines) {
  return trimEmptyEdges(lines.map((line) => line.replace(/[ \t]+$/u, ""))).join("\n");
}

function removeQuestionPrefix(line) {
  return line.replace(questionStartPattern, "$3");
}

function removeCorrectMarker(line) {
  return line.replace(correctMarkerPattern, "").replace(/[ \t]+$/u, "");
}

function optionLineIndexes(blockLines) {
  const indexes = [];
  let expectedCode = "a".charCodeAt(0);

  for (let index = 0; index < blockLines.length; index += 1) {
    const match = blockLines[index].match(optionStartPattern);
    if (!match) continue;

    const optionCode = match[1].toLowerCase().charCodeAt(0);
    if (optionCode === expectedCode) {
      indexes.push(index);
      expectedCode += 1;
      continue;
    }

    if (indexes.length >= 2) break;
  }

  return indexes;
}

function findLastOptionEnd(blockLines, lastOptionStartIndex) {
  for (let index = lastOptionStartIndex + 1; index < blockLines.length; index += 1) {
    const line = blockLines[index];

    if (/^\s*\*/.test(line)) return index;

    if (line.trim() === "") {
      let next = index + 1;
      while (next < blockLines.length && blockLines[next].trim() === "") next += 1;
      if (next >= blockLines.length || !optionStartPattern.test(blockLines[next])) {
        return index;
      }
    }
  }

  return blockLines.length;
}

function parseOptions(blockLines) {
  const indexes = optionLineIndexes(blockLines);
  if (indexes.length === 0) return [];

  const lastOptionEnd = findLastOptionEnd(blockLines, indexes[indexes.length - 1]);

  return indexes.map((startIndex, index) => {
    const nextOptionIndex = index + 1 < indexes.length ? indexes[index + 1] : lastOptionEnd;
    const firstLine = blockLines[startIndex];
    const match = firstLine.match(optionStartPattern);
    const rawOptionLines = [
      match[2],
      ...blockLines.slice(startIndex + 1, nextOptionIndex),
    ];

    const rawText = rawOptionLines.join("\n");
    const cleanedLines = rawOptionLines.map(removeCorrectMarker);

    return {
      id: match[1].toLowerCase(),
      text: normalizeText(cleanedLines),
      isCorrect: countCorrectMarkers(rawText) > 0,
      markerCount: countCorrectMarkers(rawText),
      startLineOffset: startIndex,
    };
  });
}

function issueSummary(issues) {
  return [...new Set(issues)];
}

export function analyzeBlock(lines, block, order) {
  const blockLines = lines.slice(block.lineIndex, block.endLineIndex);
  const optionIndexes = optionLineIndexes(blockLines);
  const firstOptionIndex = optionIndexes[0] ?? -1;
  const markerCount = countCorrectMarkers(blockLines.join("\n"));
  const issues = [];
  const options = parseOptions(blockLines);

  if (firstOptionIndex === -1) {
    issues.push("no_options");
  }

  if (options.length > 0) {
    const correctCount = options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) issues.push(`correct_count_${correctCount}`);
    if (options.length < 2) issues.push(`option_count_${options.length}`);

    const duplicateIds = new Set();
    const seenIds = new Set();
    for (const option of options) {
      if (seenIds.has(option.id)) duplicateIds.add(option.id);
      seenIds.add(option.id);
    }
    if (duplicateIds.size > 0) issues.push(`duplicate_option_ids_${[...duplicateIds].join("_")}`);
  }

  if (markerCount !== 1) issues.push(`block_marker_count_${markerCount}`);

  const statementLines = firstOptionIndex === -1
    ? blockLines
    : blockLines.slice(0, firstOptionIndex);
  if (statementLines.length > 0) {
    statementLines[0] = removeQuestionPrefix(statementLines[0]);
  }

  return {
    order,
    sourceNumber: block.number,
    lineNumber: block.lineNumber,
    firstLine: blockLines[0] ?? "",
    rawBlock: normalizeText(blockLines),
    statement: normalizeText(statementLines),
    options,
    markerCount,
    issues: issueSummary(issues),
  };
}

function questionId(order) {
  return `q${String(order).padStart(3, "0")}`;
}

function escapeTableCell(value) {
  return String(value)
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function renderExcludedMarkdown(problemBlocks, totalBlocks, totalMarkers) {
  const issueCounts = problemBlocks.reduce((accumulator, block) => {
    for (const issue of block.issues) {
      accumulator[issue] = (accumulator[issue] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const summaryRows = Object.entries(issueCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([issue, count]) => `- \`${issue}\`: ${count}`);

  const tableRows = problemBlocks.map((block, index) => (
    `| ${index + 1} | ${block.order} | ${block.sourceNumber} | ${block.lineNumber} | ${block.options.length} | ${block.markerCount} | ${escapeTableCell(block.issues.join(", "))} | ${escapeTableCell(block.firstLine)} |`
  ));

  const blocks = problemBlocks.map((block, index) => [
    `## Bloque excluido ${String(index + 1).padStart(2, "0")}`,
    "",
    `- Orden detectado: ${block.order}`,
    `- Numero fuente: ${block.sourceNumber}`,
    `- Linea inicial: ${block.lineNumber}`,
    `- Opciones detectadas: ${block.options.length}`,
    `- Marcadores \`**[CORRECTA]**\`: ${block.markerCount}`,
    `- Problemas: ${block.issues.map((issue) => `\`${issue}\``).join(", ")}`,
    "",
    "~~~markdown",
    block.rawBlock,
    "~~~",
    "",
  ].join("\n"));

  return [
    "# Bloques Excluidos De La Conversion",
    "",
    "Estos bloques fueron excluidos de `src/data/questions.json` para poder construir el cuestionario solo con preguntas que tienen opciones detectables y exactamente una opcion correcta.",
    "",
    "El contenido se copio desde `PFO CORRECTAS VVIC.md` sin editar el archivo original.",
    "",
    "## Resumen",
    "",
    `- Preguntas numeradas detectadas en el Markdown: ${totalBlocks}`,
    `- Marcadores \`**[CORRECTA]**\` detectados en el Markdown: ${totalMarkers}`,
    `- Bloques excluidos: ${problemBlocks.length}`,
    "",
    "## Conteo Por Tipo De Problema",
    "",
    ...summaryRows,
    "",
    "## Indice",
    "",
    "| # | Orden detectado | Numero fuente | Linea | Opciones | Correctas | Problemas | Primera linea |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...tableRows,
    "",
    ...blocks,
  ].join("\n");
}

export function parseMarkdown(root = process.cwd()) {
  const { markdown, lines } = readSource(root);
  const blocks = detectQuestionBlocks(lines);
  const analyzed = blocks.map((block, index) => analyzeBlock(lines, block, index + 1));
  const excluded = analyzed.filter((block) => block.issues.length > 0);
  const valid = analyzed.filter((block) => block.issues.length === 0);

  const questions = valid.map((block, index) => ({
    id: questionId(index + 1),
    order: index + 1,
    statement: block.statement,
    options: block.options.map((option) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  }));

  return {
    totalBlocks: blocks.length,
    totalMarkers: countCorrectMarkers(markdown),
    valid,
    excluded,
    questions,
    excludedMarkdown: renderExcludedMarkdown(excluded, blocks.length, countCorrectMarkers(markdown)),
  };
}

export function writeConversion(root = process.cwd()) {
  const parsed = parseMarkdown(root);
  const questionsPath = path.join(root, QUESTIONS_JSON);
  const excludedPath = path.join(root, EXCLUDED_BLOCKS_MD);

  fs.mkdirSync(path.dirname(questionsPath), { recursive: true });
  fs.writeFileSync(questionsPath, `${JSON.stringify(parsed.questions, null, 2)}\n`, "utf8");
  fs.writeFileSync(excludedPath, parsed.excludedMarkdown, "utf8");

  return {
    ...parsed,
    questionsPath,
    excludedPath,
  };
}
