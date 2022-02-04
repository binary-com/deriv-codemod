#!/usr/bin/env node

import util from "util";
import child_process from "child_process";
import fg from "fast-glob";
import inquirer from "inquirer";
import isGitDirty from "is-git-dirty";
import path from "path";
import { changeExtension } from "./codemods/change-extension";

const exec = util.promisify(child_process.exec);

const source_question = {
  type: "input",
  name: "source",
  message: `Enter the path to source file(s): (e.g. ./packages/trader/index.jsx  or ./packages/trader/**/*.jsx)`,
  validate(value: string) {
    if (value.length > 0) {
      return true;
    }

    return `Please enter a valid path to file(s).
Examples:
To select single file: deriv-app/packages/account/src/Modules/Page404/Components/Icon404.jsx
To select multiple files: deriv-app/packages/account/**/*.jsx`;
  },
};

const type_of_codemod_question = {
  type: "list",
  name: "codemod_type",
  message: "What codemod do you want to use?",
  choices: ["Change extension", "Convert proptypes to TS"] as const,
};

const extension_question = {
  type: "input",
  name: "extension",
  message: "Enter the new extension: (e.g. jsx or tsx)",
};

const runJscodeshift = async (file_path: string, codemod_path: string) => {
  const codemod_full_path = path.join(__dirname, `codemods/${codemod_path}`);
  const { stdout, stderr } = await exec(
    `jscodeshift -t ${codemod_full_path} ${file_path} --parser=tsx`
  );

  if (stdout.indexOf("ERR") > -1) {
    console.log(`stdout: ${stdout}`);
  }
  if (stderr.indexOf("ERR") > -1) {
    console.log(`stderr: ${stderr}`);
  }
};

async function init() {
  let runCodemod: ((path: string) => Promise<void>) | null = null;

  process.stdout.write("Welcome to deriv-codemod! :D\n");

  const { source } = await inquirer.prompt<{ source: string }>([
    source_question,
  ]);

  const files = fg.sync(source.trim(), {
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  if (files.length === 0) {
    process.stderr.write(
      "Error: No files found. Please check the path option.\n"
    );
    process.exit();
  }

  const is_git_dirty = isGitDirty(path.dirname(files[0]));

  if (is_git_dirty) {
    process.stderr.write(
      `Error: Git is not in a clean slate.
Run \`git status\` to make sure you have no local changes that may get lost.
Commit your changes, then re-run this script.
`
    );
    return;
  }

  const { codemod_type } = await inquirer.prompt<{
    codemod_type: typeof type_of_codemod_question.choices[number];
  }>([type_of_codemod_question]);

  switch (codemod_type) {
    case "Change extension":
      const { extension: new_extension } = await inquirer.prompt<{
        extension: string;
      }>([extension_question]);

      runCodemod = async (path: string) => {
        await changeExtension(path, new_extension);
      };
      break;
    case "Convert proptypes to TS":
      runCodemod = async (path: string) => {
        await runJscodeshift(path, "proptypes-to-ts.js");
      };
      break;
  }

  if (typeof runCodemod === "function") {
    let i = 1;
    for await (const file of files) {
      console.log(
        `${i}/${files.length} Running \`${codemod_type}\` codemod on file - ${file}`
      );
      await runCodemod(file);
      i++;
    }
    process.stdout.write("\nCodemod ran successfully.\n");

    process.stdout.write(
      "\nPlease make sure to commit the changes after running each codemod to get better git diff.\n"
    );
  }
}

init();
