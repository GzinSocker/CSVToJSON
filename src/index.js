const fileSystem = require('fs').promises;
const argv = require('minimist')(process.argv.slice(2));
const parse = require('csv-parse/lib/sync');

/**
 * Verifies if a input file name was given via comand line. Otherwise, the default input file name 'input.csv' will be used.
 * 
 * @returns string
 */
async function verifyInputEntry() {
    if(argv['_'][0])
        return argv['_'];
    
    return 'input.csv';
}

/**
 * Read the content of filePath and return it in a raw string.
 * 
 * @param {string} filePath 
 * @returns string
 */
async function readInput(filePath) {
    try {
        const rawData = await fileSystem.readFile(`src/${filePath}`, { encoding: 'utf-8' });   
        
        return rawData;
    } catch (err) {
        throw err;
    }
}

async function transformCSV(rawData) {
    try {
        const preFormatedData = parse(rawData, {
            columns: true,
            skip_empty_lines: false
        });

        return preFormatedData;
    } catch(err) {
        throw err;
    }
}

/**
 * Main function
 */
(async function () {
    try {
        const inputFilePath = await verifyInputEntry();
        
        const rawData = await readInput(inputFilePath);

        const formatedData = await transformCSV(rawData);
    
        
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
    }
})();
