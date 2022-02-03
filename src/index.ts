import util from "util";
import child_process from "child_process";
import fg from "fast-glob";
import inquirer from "inquirer";
import path from "path";
import { changeExtension } from "./codemods/change-extension";

const exec = util.promisify(child_process.exec);

const source_question = {
  type: "input",
  name: "source",
  message: `Enter the path to source file/folder: (e.g. ./src/index.js  or ./**/*.js)`,
  validate(value: string) {
    if (value.length > 0) {
      return true;
    }

    return `Please enter a valid path to file/folder.
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

async function inquire() {
  let runCodemod: ((path: string) => Promise<void>) | null = null;
  const { source } = await inquirer.prompt<{ source: string }>([
    source_question,
  ]);

  const files = fg.sync(source, {
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  if (files.length === 0) {
    process.stderr.write("No files found. Please check the 'source' option\n");
    process.exit();
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
        await runJscodeshift(path, "proptypes-to-ts.ts");
      };
      break;
  }

  if (typeof runCodemod === "function") {
    for await (const file of files) {
      console.log(`Running ${codemod_type} on file - ${file}`);
      await runCodemod(file);
    }
  }
}

inquire();
