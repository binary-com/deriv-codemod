/* -------------------------------------------------------------------------- */
/* UTILS                                                                      */
/* -------------------------------------------------------------------------- */
import fg from 'fast-glob';
import isGitDirty from 'is-git-dirty';
import path from 'path';

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
