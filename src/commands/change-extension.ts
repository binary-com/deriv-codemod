/* -------------------------------------------------------------------------- */
/* SAMPLE COMMAND STRUCTURE                                                   */
/* -------------------------------------------------------------------------- */
import { prompt } from 'enquirer';
import chalk from 'chalk';
import { source, select_target_extension } from '../utils/prompt';
import { files, checkFileExistence } from '../utils';
import util from 'util';
import fs from 'fs';
import path from 'path';

interface TResponse {
    source: string;
    extension: string;
}

const rename = util.promisify(fs.rename);

export const changeFileExtension = async (file_path: string, extension: string) => {
    const current_extension = path.extname(file_path);

    const new_extension = extension.startsWith('.')
        ? extension.slice(1)
        : extension;

    if (current_extension.length > 0) {
        const new_path = file_path.replace(current_extension, `.${new_extension}`);
        await rename(file_path, new_path);
        console.log(chalk.green('    ✔ Done'));
    }
};

const changeExtension = (program: any) => {
    program
        .command('ext')
        .description('Change extension of the file(s)')
        .option('-s, --source [source]', 'Source to the file(s)')
        .option('-e, --extension [ext]', 'Target Extension')
        .action(async (options: any, stdout: any) => {
            const hasDot = stdout.args.includes('.');
            console.log(options);
            const questions = [];
            const response: TResponse = {
                extension: 'tsx',
                source   : '',
            };

            // Add Questions
            if (!options.source && hasDot === false) {
                questions.push(source);
            }
            if (!options.extension) {
                questions.push(select_target_extension);
            }

            // Assign Response
            if (questions.length) {
                const prp: TResponse = await prompt(questions);
                response.extension = prp.extension;
                response.source = prp.source;
            } else {
                response.extension = options.extension;
                response.source = options.source;
            }

            // Process Files
            const inputFiles = files(response.source);
            await checkFileExistence(inputFiles, true);

            // Run Command
            let i = 1;
            console.log(chalk.yellow(`Changing file extension to ${chalk.green.bold(response.extension)}:`));
            for await (const file of inputFiles) {
                console.log(chalk.blue(`${i}/${inputFiles.length} File: ${file}`));
                await changeFileExtension(file, response.extension);
                i++;
            }

            // Finish Messages
            process.stdout.write(`\n${chalk.green('Codemod ran successfully.')}\n`);
            process.stdout.write(`${chalk.red('Please make sure to commit the changes after running each codemod to get better git diff.')}\n`);
            console.log();
        });
};

export default changeExtension;
