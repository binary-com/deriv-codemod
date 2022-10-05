/* -------------------------------------------------------------------------- */
/* SAMPLE COMMAND STRUCTURE                                                   */
/* -------------------------------------------------------------------------- */
import chalk from 'chalk';
import path from 'path';
import util from 'util';
import child_process from 'child_process';
import { prompt } from 'enquirer';
import { source } from '../utils/prompt';
import { files, checkFileExistence } from '../utils';
import { changeFileExtension } from './change-extension';

interface TResponse {
    source: string;
    extension: string;
}

const exec = util.promisify(child_process.exec);

export const runJscodeshift = async (file_path: string, file_extension: string) => {
    const codemod_full_path = path.join(__dirname, '../src/utils/transform.js');
    const { stdout, stderr } = await exec(
        `jscodeshift -t ${codemod_full_path} ${file_path} --parser=tsx`,
    );
    
    if (stdout.indexOf('ERR') > -1) {
        console.log(`stdout: ${stdout}`);
    } else if (stderr.indexOf('ERR') > -1) {
        console.log(`stderr: ${stderr}`);
    } else if (file_extension !== '') {
        await changeFileExtension(file_path, file_extension);
    }

    if (stderr.indexOf('ERR') === -1) {
        console.log(chalk.green('    ✔ File Migrated.'));
    }
};

const toTS = (program: any) => {
    program
        .command('pts')
        .description('Migrate from js(x) to ts(x)')
        .option('-s, --source [source]', 'Source to the file(s)')
        .option('-e, --extension [extension]', 'Change extension of the file')
        .action(async (options: any, stdout: any) => {
            const hasDot = stdout.args.includes('.');
            const questions = [];
            const response: TResponse = {
                extension: '',
                source   : '',
            };

            // Add Questions
            if (!options.source && hasDot === false) {
                questions.push(source);
            }
            if (options.extension !== '') {
                response.extension = options.extension;
            }

            // Assign Response
            if (questions.length) {
                const prp: TResponse = await prompt(questions);
                response.source = prp.source;
            } else {
                response.source = hasDot ? process.cwd() : options.source;
            }
            
            // Process Files
            const inputFiles = files(response.source);
            await checkFileExistence(inputFiles, true);

            // Run Command
            let i = 1;
            console.log(chalk.yellow(`Migrating files to TypeScript ${chalk.green.bold(response.extension)}:`));
            for await (const file of inputFiles) {
                console.log(chalk.blue(`${i}/${inputFiles.length} File: ${file}`));
                await runJscodeshift(file, response.extension);
                i++;
            }

            // Finish Messages
            process.stdout.write(`${chalk.red('Please make sure to commit the changes after running each codemod to get better git diff.')}\n`);
            console.log();
        });
};

export default toTS;
