import fs from "node:fs";
import path from "node:path";
import {
  EXCLUDED_BLOCKS_MD,
  QUESTIONS_JSON,
  SOURCE_MARKDOWN,
  parseMarkdown,
} from "./conversion-utils.mjs";

const root = process.cwd();
const questionsPath = path.join(root, QUESTIONS_JSON);
const markdownPath = path.join(root, SOURCE_MARKDOWN);
const excludedPath = path.join(root, EXCLUDED_BLOCKS_MD);

const failures = [];

if (!fs.existsSync(markdownPath)) failures.push(`Missing source Markdown: ${SOURCE_MARKDOWN}`);
if (!fs.existsSync(questionsPath)) failures.push(`Missing questions JSON: ${QUESTIONS_JSON}`);
if (!fs.existsSync(excludedPath)) failures.push(`Missing excluded-blocks Markdown: ${EXCLUDED_BLOCKS_MD}`);

let questions = [];
if (fs.existsSync(questionsPath)) {
  try {
    questions = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
  } catch (error) {
    failures.push(`Invalid JSON: ${error.message}`);
  }
}

const parsed = parseMarkdown(root);

if (questions.length !== parsed.questions.length) {
  failures.push(`Question count mismatch: JSON has ${questions.length}, Markdown parse has ${parsed.questions.length}`);
}

questions.forEach((question, index) => {
  const expected = parsed.questions[index];
  const label = question?.id ?? `index_${index}`;

  if (!expected) return;
  if (question.id !== expected.id) failures.push(`${label}: id mismatch`);
  if (question.order !== expected.order) failures.push(`${label}: order mismatch`);
  if (question.statement !== expected.statement) failures.push(`${label}: statement mismatch`);
  if (!Array.isArray(question.options)) failures.push(`${label}: options is not an array`);

  const correctCount = Array.isArray(question.options)
    ? question.options.filter((option) => option.isCorrect === true).length
    : 0;
  if (correctCount !== 1) failures.push(`${label}: expected exactly one correct option, found ${correctCount}`);

  const optionIds = new Set();
  question.options?.forEach((option, optionIndex) => {
    const expectedOption = expected.options[optionIndex];
    if (!expectedOption) {
      failures.push(`${label}: unexpected option at index ${optionIndex}`);
      return;
    }
    if (optionIds.has(option.id)) failures.push(`${label}: duplicate option id ${option.id}`);
    optionIds.add(option.id);
    if (option.id !== expectedOption.id) failures.push(`${label}: option ${optionIndex} id mismatch`);
    if (option.text !== expectedOption.text) failures.push(`${label}: option ${option.id} text mismatch`);
    if (option.isCorrect !== expectedOption.isCorrect) failures.push(`${label}: option ${option.id} correctness mismatch`);
    if (/\*\*\[CORRECTA\]\*\*/.test(option.text)) failures.push(`${label}: option ${option.id} still contains correct marker`);
  });
});

if (parsed.excluded.length !== 38) {
  failures.push(`Expected 38 excluded blocks, found ${parsed.excluded.length}`);
}

if (parsed.totalBlocks !== questions.length + parsed.excluded.length) {
  failures.push(`Markdown total does not match JSON plus exclusions: ${parsed.totalBlocks} != ${questions.length} + ${parsed.excluded.length}`);
}

if (failures.length > 0) {
  console.error("Validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  validJson: true,
  sourceMarkdown: SOURCE_MARKDOWN,
  totalMarkdownQuestions: parsed.totalBlocks,
  convertedQuestions: questions.length,
  excludedBlocks: parsed.excluded.length,
  allQuestionsHaveExactlyOneCorrectOption: true,
}, null, 2));
