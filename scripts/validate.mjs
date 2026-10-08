#!/usr/bin/env node
// Validates every manifest, skill, and eval in this repo against the published
// schemas and the directory rules of ChatGPT, Claude, Cursor, and Grok.
// Usage: node scripts/validate.mjs [--offline]

import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const offline = process.argv.includes('--offline');

const SCHEMAS = {
  agentPlugin: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  agentMcp: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  cursorPlugin: 'https://raw.githubusercontent.com/cursor/plugins/main/schemas/plugin.schema.json',
  cursorMarketplace: 'https://raw.githubusercontent.com/cursor/plugins/main/schemas/marketplace.schema.json',
};

const MCP_URL = 'https://api.emailit.com/mcp';
const MAX_FILE_BYTES = 256 * 1024;
const MAX_FILES = 512;
const MAX_SKILL_WORDS = 2000;
const TEXT_EXTENSIONS = new Set(['.md', '.mdc', '.json', '.mjs', '.js', '.yml', '.yaml', '.svg', '.txt']);
const IGNORED_DIRS = new Set(['.git', 'node_modules']);
const TOOL_VERBS = 'get|list|create|update|delete|send|verify|cancel|retry|forward|publish|unpublish|add|remove|bulk|export|test|reset|regenerate|switch|start|pause|stop|trigger|upload';
const TOOL_TOKEN = new RegExp(`\`((?:${TOOL_VERBS})-[a-z0-9-]+)\``, 'g');

let failures = 0;
let warnings = 0;
const fail = (message) => { failures += 1; console.error(`  x ${message}`); };
const warn = (message) => { warnings += 1; console.warn(`  ! ${message}`); };
let sectionStart = 0;
const section = (title) => { sectionStart = failures; console.log(`\n${title}`); };
const pass = (message) => { if (failures === sectionStart) console.log(`  ok ${message}`); };

const rel = (path) => relative(root, path) || '.';
const readText = (path) => readFileSync(join(root, path), 'utf8');

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    fail(`${path}: ${error.message}`);
    return null;
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      fail(`${rel(full)}: symlinks are not allowed`);
    } else if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function wordCount(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (pair) fields[pair[1]] = pair[2].replace(/^["']|["']$/g, '');
  }
  return { fields, body: markdown.slice(match[0].length) };
}

async function loadSchema(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function checkSchemas(manifests) {
  section('Schemas');
  if (offline) {
    warn('skipped (--offline)');
    return;
  }
  const draft7 = addFormats(new Ajv({ allErrors: true, strict: false }));
  const draft2020 = addFormats(new Ajv2020({ allErrors: true, strict: false }));
  const targets = [
    ['plugin.json', manifests.agent, SCHEMAS.agentPlugin, draft2020],
    ['mcp.json', manifests.agentMcp, SCHEMAS.agentMcp, draft2020],
    ['.cursor-plugin/plugin.json', manifests.cursor, SCHEMAS.cursorPlugin, draft7],
    ['.cursor-plugin/marketplace.json', manifests.cursorMarketplace, SCHEMAS.cursorMarketplace, draft7],
  ];
  for (const [path, data, url, ajv] of targets) {
    if (!data) continue;
    let schema;
    try {
      schema = await loadSchema(url);
    } catch (error) {
      fail(`${path}: could not load ${url} (${error.message}). Use --offline to skip.`);
      continue;
    }
    const validate = ajv.compile(schema);
    if (validate(data)) {
      console.log(`  ok ${path}`);
    } else {
      for (const error of validate.errors) fail(`${path}${error.instancePath || ''}: ${error.message}`);
    }
  }
}

function checkFiles(files) {
  section('Files');
  if (files.length > MAX_FILES) fail(`${files.length} files, the Claude directory allows ${MAX_FILES}`);
  for (const file of files) {
    const path = rel(file);
    const name = path.split('/').pop();
    if (name === '.DS_Store') fail(`${path}: remove OS metadata files`);
    if (path.split('/').includes('bin')) fail(`${path}: a bin/ folder blocks claude.ai installs`);
    if (statSync(file).size > MAX_FILE_BYTES) fail(`${path}: larger than 256 KiB`);
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!TEXT_EXTENSIONS.has(extension)) continue;
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, index) => {
      if (/[\u2013\u2014]/.test(line)) fail(`${path}:${index + 1}: replace the en or em dash with a period, comma, or colon`);
    });
    if (/\bsecret_[A-Za-z0-9]{16,}|\bwhsec_[a-f0-9]{16,}/.test(text)) fail(`${path}: looks like a real Emailit key or webhook secret`);
  }
  // Claude Code runs a package install for every user when the plugin root has
  // package.json and a lockfile, and the Claude directory holds such plugins
  // for review. The validation tooling lives in scripts/ instead.
  const lockfile = ['package-lock.json', 'npm-shrinkwrap.json', 'bun.lock', 'bun.lockb'].find((name) => existsSync(join(root, name)));
  if (lockfile && existsSync(join(root, 'package.json'))) fail(`package.json and ${lockfile} at the plugin root: Claude Code would install packages for every user. Keep tooling in scripts/`);
  pass(`${files.length} files checked`);
}

function checkVersions(manifests) {
  section('Names and versions');
  const version = manifests.agent?.version;
  const entries = [
    ['.cursor-plugin/plugin.json', manifests.cursor],
    ['.claude-plugin/plugin.json', manifests.claude],
    ['.grok-plugin/plugin.json', manifests.grok],
  ];
  for (const [path, data] of entries) {
    if (!data) continue;
    if (data.name !== 'emailit') fail(`${path}: name must be "emailit"`);
    if (data.version !== version) fail(`${path}: version ${data.version} does not match plugin.json ${version}. Run node scripts/sync-version.mjs.`);
  }
  if (!readText('CHANGELOG.md').includes(`## ${version}`)) fail(`CHANGELOG.md has no "## ${version}" entry`);
  const cursorEntry = manifests.cursorMarketplace?.plugins?.find((plugin) => plugin.name === 'emailit');
  if (!cursorEntry) fail('.cursor-plugin/marketplace.json does not list the emailit plugin');
  const claudeEntry = manifests.claudeMarketplace?.plugins?.find((plugin) => plugin.name === 'emailit');
  if (!claudeEntry) fail('.claude-plugin/marketplace.json does not list the emailit plugin');
  const codexEntry = manifests.codexMarketplace?.plugins?.find((plugin) => plugin.name === 'emailit');
  if (!codexEntry) fail('.agents/plugins/marketplace.json does not list the emailit plugin');
  pass(`emailit ${version}`);
}

function checkMcp(manifests) {
  section('MCP servers');
  const configs = [
    ['mcp.json', manifests.agentMcp?.mcpServers],
    ['.mcp.json', manifests.claudeMcp?.mcpServers],
  ];
  for (const [path, servers] of configs) {
    const server = servers?.emailit;
    if (!server) {
      fail(`${path}: missing mcpServers.emailit`);
      continue;
    }
    if (server.url !== MCP_URL) fail(`${path}: url must be ${MCP_URL}`);
    if (server.headers) fail(`${path}: no headers; the plugin authenticates with OAuth`);
    if (server.command || server.args) fail(`${path}: remote server only, no local command`);
  }
  if (manifests.agentMcp?.mcpServers?.emailit?.type !== 'streamable-http') fail('mcp.json: type must be "streamable-http"');
  if (manifests.claudeMcp?.mcpServers?.emailit?.type !== 'http') fail('.mcp.json: type must be "http"');
  if (manifests.cursor?.mcpServers !== './mcp.json') fail('.cursor-plugin/plugin.json: mcpServers must point to ./mcp.json');
  pass(MCP_URL);
}

function checkAssets(manifests) {
  section('Assets');
  const iface = manifests.agent?.extensions?.['com.openai']?.interface || {};
  const paths = [
    iface.composerIcon, iface.composerIconDark, iface.logo, iface.logoDark,
    manifests.cursor?.logo, manifests.grok?.logo,
    manifests.agent?.extensions?.['com.openai']?.onboardingSkill,
  ].filter(Boolean);
  for (const path of paths) {
    if (!existsSync(join(root, path))) fail(`${path} does not exist`);
  }
  pass(`${paths.length} paths`);
}

function checkOpenAi(manifests, toolNames) {
  section('ChatGPT and Codex listing');
  const openai = manifests.agent?.extensions?.['com.openai'];
  if (!openai) {
    fail('plugin.json: missing extensions.com.openai');
    return;
  }
  const iface = openai.interface || {};
  const limit = (field, max) => {
    const value = iface[field];
    if (!value) fail(`interface.${field} is required`);
    else if (value.length > max) fail(`interface.${field} is ${value.length} characters, max ${max}`);
  };
  limit('displayName', 30);
  limit('shortDescription', 30);
  limit('longDescription', 4000);
  const prompts = iface.defaultPrompt || [];
  if (prompts.length === 0 || prompts.length > 3) fail('interface.defaultPrompt needs 1 to 3 prompts');
  prompts.forEach((prompt, index) => { if (prompt.length > 128) fail(`interface.defaultPrompt[${index}] is over 128 characters`); });
  for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    if (!/^https:\/\//.test(iface[field] || '')) fail(`interface.${field} must be an https URL`);
  }
  const cases = openai.review?.test_cases || {};
  if ((cases.positive || []).length !== 5) fail('review.test_cases.positive needs exactly 5 cases');
  if ((cases.negative || []).length !== 3) fail('review.test_cases.negative needs exactly 3 cases');
  for (const testCase of cases.positive || []) {
    for (const tool of String(testCase.tools_triggered || '').split(',').map((name) => name.trim()).filter(Boolean)) {
      if (!toolNames.has(tool)) fail(`review test case "${testCase.description}" names unknown tool ${tool}`);
    }
  }
  pass(`${iface.displayName}: ${prompts.length} prompts, ${(cases.positive || []).length} positive and ${(cases.negative || []).length} negative cases`);
}

function loadToolNames() {
  const path = 'skills/emailit/references/tools.md';
  const names = new Set();
  for (const match of readText(path).matchAll(/^\| `([a-z0-9-]+)` \|/gm)) names.add(match[1]);
  if (names.size === 0) fail(`${path}: no tools found`);
  return names;
}

function checkSkills(toolNames) {
  section('Skills');
  const skillsDir = join(root, 'skills');
  const skills = readdirSync(skillsDir).filter((name) => statSync(join(skillsDir, name)).isDirectory());
  const referenceFiles = new Set(walk(skillsDir).map((file) => rel(file).split('/').slice(2).join('/')));
  for (const skill of skills) {
    const start = failures;
    const path = `skills/${skill}/SKILL.md`;
    if (!existsSync(join(root, path))) {
      fail(`${path} is missing`);
      continue;
    }
    const text = readText(path);
    const parsed = frontmatter(text);
    if (!parsed) {
      fail(`${path}: missing frontmatter`);
      continue;
    }
    const { name, description } = parsed.fields;
    if (name !== skill) fail(`${path}: name "${name}" must match the folder "${skill}"`);
    if (!description) fail(`${path}: description is required`);
    else {
      if (!description.startsWith('This skill should be used when')) fail(`${path}: description should start with "This skill should be used when"`);
      if (description.length > 1024) fail(`${path}: description is ${description.length} characters, max 1024`);
    }
    const words = wordCount(parsed.body);
    if (words > MAX_SKILL_WORDS) fail(`${path}: ${words} words, keep SKILL.md under ${MAX_SKILL_WORDS} and move detail to references/`);
    for (const match of text.matchAll(/`(references\/[A-Za-z0-9_.-]+\.md)`/g)) {
      if (!referenceFiles.has(match[1])) fail(`${path}: ${match[1]} does not exist`);
    }
    if (!existsSync(join(root, 'skill-evals', skill, 'evals.json'))) fail(`skill-evals/${skill}/evals.json is missing`);
    if (failures === start) console.log(`  ok ${skill} (${words} words)`);
  }

  for (const file of walk(skillsDir).filter((path) => path.endsWith('.md'))) {
    if (rel(file) === 'skills/emailit/references/tools.md') continue;
    for (const match of readFileSync(file, 'utf8').matchAll(TOOL_TOKEN)) {
      const token = match[1];
      if (token.endsWith('-') || skills.includes(token)) continue;
      if (!toolNames.has(token)) fail(`${rel(file)}: \`${token}\` is not an Emailit MCP tool`);
    }
  }
  return skills;
}

function checkEvals(skills) {
  section('Skill evals');
  const evalsDir = join(root, 'skill-evals');
  for (const dir of readdirSync(evalsDir)) {
    const start = failures;
    const path = `skill-evals/${dir}/evals.json`;
    if (!skills.includes(dir)) fail(`${path}: no skill named ${dir}`);
    const data = readJson(path);
    if (!data) continue;
    if (data.skill_name !== dir) fail(`${path}: skill_name must be "${dir}"`);
    if (!Array.isArray(data.evals) || data.evals.length === 0) {
      fail(`${path}: evals must be a non-empty array`);
      continue;
    }
    const ids = new Set();
    for (const item of data.evals) {
      if (ids.has(item.id)) fail(`${path}: duplicate id ${item.id}`);
      ids.add(item.id);
      if (!item.prompt || !item.expected_output) fail(`${path}: eval ${item.id} needs prompt and expected_output`);
      if (!Array.isArray(item.files)) fail(`${path}: eval ${item.id} files must be an array`);
      if (!Array.isArray(item.expectations) || item.expectations.length === 0) fail(`${path}: eval ${item.id} needs expectations`);
    }
    if (failures === start) console.log(`  ok ${dir} (${data.evals.length} evals)`);
  }
}

function checkReadme() {
  section('README');
  const readme = readText('README.md');
  const words = wordCount(readme);
  if (words < 40) fail(`README.md has ${words} words outside code blocks, the Claude directory needs 40`);
  for (const endpoint of ['https://api.emailit.com/mcp', 'https://api.emailit.com/v2', 'https://api.emailit.com/oauth/authorize', 'https://api.emailit.com/oauth/token']) {
    if (!readme.includes(endpoint)) fail(`README.md must disclose ${endpoint}`);
  }
  if (!existsSync(join(root, 'LICENSE'))) fail('LICENSE is missing');
  pass(`${words} words`);
}

const manifests = {
  agent: readJson('plugin.json'),
  agentMcp: readJson('mcp.json'),
  claudeMcp: readJson('.mcp.json'),
  cursor: readJson('.cursor-plugin/plugin.json'),
  cursorMarketplace: readJson('.cursor-plugin/marketplace.json'),
  claude: readJson('.claude-plugin/plugin.json'),
  claudeMarketplace: readJson('.claude-plugin/marketplace.json'),
  grok: readJson('.grok-plugin/plugin.json'),
  codexMarketplace: readJson('.agents/plugins/marketplace.json'),
};

const files = walk(root);
const toolNames = loadToolNames();
checkFiles(files);
checkVersions(manifests);
checkMcp(manifests);
checkAssets(manifests);
checkOpenAi(manifests, toolNames);
const skills = checkSkills(toolNames);
checkEvals(skills);
checkReadme();
await checkSchemas(manifests);

console.log(`\n${failures ? `${failures} problem(s)` : 'All checks passed'}${warnings ? `, ${warnings} warning(s)` : ''}.`);
process.exit(failures ? 1 : 0);
