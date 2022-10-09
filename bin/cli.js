#!/usr/bin/env node
'use strict';

var commander = require('commander');
var util = require('util');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var fg = require('fast-glob');
var isGitDirty = require('is-git-dirty');
var enquirer = require('enquirer');
var child_process = require('child_process');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var commander__default = /*#__PURE__*/_interopDefaultLegacy(commander);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var fg__default = /*#__PURE__*/_interopDefaultLegacy(fg);
var isGitDirty__default = /*#__PURE__*/_interopDefaultLegacy(isGitDirty);
var child_process__default = /*#__PURE__*/_interopDefaultLegacy(child_process);

/* -------------------------------------------------------------------------- */

/* PROMPTS                                                                    */

/* -------------------------------------------------------------------------- */
const source = {
  type: 'input',
  name: 'source',
  message: 'Enter the path to source file(s):',
  hint: 'You can pass single file: ./packages/trader/index.jsx or using glob: ./packages/trader/**/*.jsx',

  validate(value) {
    if (value.length > 0) {
      return true;
    }

    return `Please enter a valid path to file(s).
Examples:
To select single file: deriv-app/packages/account/src/Modules/Page404/Components/Icon404.jsx
To select multiple files: deriv-app/packages/account/**/*.jsx`;
  }

};
const select_target_extension = {
  type: 'input',
  name: 'extension',
  message: 'Enter the new extension: (e.g. jsx or tsx)'
};

/* -------------------------------------------------------------------------- */
const handleResponse = async (options, stdout, q) => {
  const hasDot = stdout.args.includes('.');
  const questions = [];
  const response = {
    extension: '',
    source: ''
  };
  Object.keys(options).forEach(key => {
    if (options[key].startsWith('-')) {
      console.log(chalk__default["default"].red(`Invalid arguments passed to: ${key}`));
      process.exit(1);
    }
  }); // Add Questions

  if (!options.source && hasDot === false && q.includes('source') || typeof options.source === 'boolean') {
    questions.push(source);
  }

  if (!options.extension && q.includes('extension') || typeof options.extension === 'boolean') {
    questions.push(select_target_extension);
  } // Assign Response


  if (questions.length) {
    const prp = await enquirer.prompt(questions);
    response.extension = prp.extension;
    response.source = prp.source;
  } else {
    response.extension = options.extension;
    response.source = hasDot ? process.cwd() : options.source;
  }

  return response;
};
const files = source => {
  return fg__default["default"].sync(source.trim(), {
    absolute: true,
    ignore: ['**/node_modules/**']
  });
};
const checkFileExistence = (files, checkGit) => {
  if (files.length === 0) {
    process.stderr.write('Error: No files found. Please check the path option.\n');
    process.exit();
  }

  if (checkGit) {
    checkGitDirty(files);
  }
};
const checkGitDirty = files => {
  return isGitDirty__default["default"](path__default["default"].dirname(files[0]));
};

/* -------------------------------------------------------------------------- */
const rename = util__default["default"].promisify(fs__default["default"].rename);
const changeFileExtension = async (file_path, extension) => {
  const current_extension = path__default["default"].extname(file_path);
  const new_extension = extension.startsWith('.') ? extension.slice(1) : extension;

  if (current_extension.length > 0) {
    const new_path = file_path.replace(current_extension, `.${new_extension}`);
    await rename(file_path, new_path);
    console.log(chalk__default["default"].green('    ✔ File Extension Changed.'));
  }
};

const changeExtension = program => {
  program.command('ext').description('Change extension of the file(s)').option('-s, --source <source>', 'Source to the file(s)').option('-e, --extension <ext>', 'Target Extension').action(async (options, stdout) => {
    const response = await handleResponse(options, stdout, ['source', 'extension']); // Process Files

    const inputFiles = files(response.source);
    await checkFileExistence(inputFiles, true); // Run Command

    let i = 1;
    console.log(chalk__default["default"].yellow(`Changing file extension to ${chalk__default["default"].green.bold(response.extension)}:`));

    for await (const file of inputFiles) {
      console.log(chalk__default["default"].blue(`${i}/${inputFiles.length} File: ${file}`));
      await changeFileExtension(file, response.extension);
      i++;
    } // Finish Messages


    process.stdout.write(`\n${chalk__default["default"].green('Codemod ran successfully.')}\n`);
    process.stdout.write(`${chalk__default["default"].red('Please make sure to commit the changes after running each codemod to get better git diff.')}\n`);
    console.log();
  });
};

/* -------------------------------------------------------------------------- */
const exec = util__default["default"].promisify(child_process__default["default"].exec);
const runJscodeshift = async (file_path, file_extension) => {
  const codemod_full_path = path__default["default"].join(__dirname, '../src/utils/transform.js');
  const {
    stdout,
    stderr
  } = await exec(`jscodeshift -t ${codemod_full_path} ${file_path} --parser=tsx`);

  if (stdout.indexOf('ERR') > -1) {
    console.log(`stdout: ${stdout}`);
  } else if (stderr.indexOf('ERR') > -1) {
    console.log(`stderr: ${stderr}`);
  } else if (file_extension !== '') {
    await changeFileExtension(file_path, file_extension);
  }

  if (stderr.indexOf('ERR') === -1) {
    console.log(chalk__default["default"].green('    ✔ File Migrated.'));
  }
};

const toTS = program => {
  program.command('pts').description('Migrate from js(x) to ts(x)').option('-s, --source <source>', 'Source to the file(s)').option('-e, --extension <extension>', 'Change extension of the file').action(async (options, stdout) => {
    const response = await handleResponse(options, stdout, ['source', 'extension']); // Process Files

    const inputFiles = files(response.source);
    await checkFileExistence(inputFiles, true); // Run Command

    let i = 1;
    console.log(chalk__default["default"].yellow(`Migrating files to TypeScript ${chalk__default["default"].green.bold(response.extension)}:`));

    for await (const file of inputFiles) {
      console.log(chalk__default["default"].blue(`${i}/${inputFiles.length} File: ${file}`));
      await runJscodeshift(file, response.extension);
      i++;
    } // Finish Messages


    process.stdout.write(`${chalk__default["default"].red('Please make sure to commit the changes after running each codemod to get better git diff.')}\n`);
    console.log();
  });
};

var name = "deriv-codemod";
var version = "1.1.0";

const program = new commander__default["default"].Command(); // Commands

changeExtension(program);
toTS(program);
program.name(name);
program.version(version);
program.parse();
