/* -------------------------------------------------------------------------- */
/* SAMPLE COMMAND STRUCTURE                                                   */
/* -------------------------------------------------------------------------- */

const toTS = (program: any) => {
    program
        .command('pts')
        .description('Migrate from js(x) to ts(x)')
        .option('-s, --source [source]', 'Source to the file(s)')
        .option('-ext, --extension [source]', 'Change extension of the file')
        .action(async (options: any) => {
            console.log(options);
        });
};

export default toTS;
