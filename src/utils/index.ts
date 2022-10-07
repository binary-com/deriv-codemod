/* -------------------------------------------------------------------------- */
/* UTILS                                                                      */
/* -------------------------------------------------------------------------- */
import fg from 'fast-glob';
import isGitDirty from 'is-git-dirty';
import chalk from 'chalk';
import path from 'path';
import { prompt } from 'enquirer';
import { source, select_target_extension } from '../utils/prompt';

export type TResponse = {
    source: string;
    extension: string;
}

export const handleResponse = async (options: any, stdout: any, q: string[]) => {
    const hasDot = stdout.args.includes('.');
    const questions = [];
    const response: TResponse = {
        extension: '',
        source   : '',
    };

    Object.keys(options).forEach((key) => {
        if (options[key].startsWith('-')) {
            console.log(chalk.red(`Invalid arguments passed to: ${key}`));
            process.exit(1);
        }
    });

    // Add Questions
    if (!options.source && hasDot === false && q.includes('source') || typeof options.source === 'boolean') {
        questions.push(source);
    }
    if (!options.extension && q.includes('extension') || typeof options.extension === 'boolean') {
        questions.push(select_target_extension);
    }

    // Assign Response
    if (questions.length) {
        const prp: TResponse = await prompt(questions);
        response.extension = prp.extension;
        response.source = prp.source;
    } else {
        response.extension = options.extension;
        response.source = hasDot ? process.cwd() : options.source;
    }

    return response;
};

export const files = (source: string) => {
    return fg.sync(source.trim(), {
        absolute: true,
        ignore  : ['**/node_modules/**'],
    });
};

const checkFileExistence = (files: Array<string>, checkGit: boolean) => {
    if (files.length === 0) {
        process.stderr.write(
            'Error: No files found. Please check the path option.\n',
        );
        process.exit();
    }

    if (checkGit) {
        checkGitDirty(files);
    }
};

const checkGitDirty = (files: any) => {
    return isGitDirty(path.dirname(files[0]));
};

export {
    checkFileExistence,
    checkGitDirty,
};
