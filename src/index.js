const fileSystem = require('fs').promises;
const argv = require('minimist')(process.argv.slice(2));
const parse = require('csv-parse/lib/sync');
const lodash = require('lodash');

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
 * Read the content of given file and return it in a raw string.
 * 
 * @param {string} fileName
 * @returns string
 */
async function readInput(fileName) {
    try {
        const rawData = await (await fileSystem.readFile(`src/${fileName}`, { encoding: 'utf-8' }));   
        
        return rawData;
    } catch (err) {
        throw err;
    }
}

function removeDuplicateColumnsAndTransform(header, content) {
    const columns = header.split(',');

    const indexes = {};
    columns.forEach((column, index) => {
            if(!indexes[column])
                indexes[column] = [];
            indexes[column].push(index);
    });
    
    const data = [];
    let registry;
    let personInfo;

    content.forEach(line => {
        registry = line.split(',');
        personInfo = {...indexes};
        for(index in indexes) {
            personInfo[index] = '';
            if(indexes[index].length > 1) {
                indexes[index].forEach((value) => {
                    if(registry[value])
                        personInfo[index] = personInfo[index]+"/"+registry[value];
                });
            }
            else {
                personInfo[index] = registry[indexes[index][0]];
            }
        }
        data.push(personInfo); 
    });

    return data;
}

async function removeDuplicatesAndConvert(data) {
    const dataSplited = data.split('\n');

    const header = dataSplited[0];
    const content = dataSplited.slice(1);

    const dataArray = removeDuplicateColumnsAndTransform(header, content);

    return dataArray;
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
 * 
 * @param {Array} registries 
 */
async function removeRegistryDuplicates(registries) {

    return lodash.unionBy(registries, "eid");
}

function writeOutput(data, fileName) {
    try {
        const stringContent = JSON.stringify(data, null, 2);
    
        fileSystem.writeFile(`src/${fileName}`, stringContent, { encoding: 'utf-8' });
    } catch (err) {
        throw err;
    }
}

/**
 * Main function
 */
(async function () {
    try {
        const inputFile = await verifyInputEntry();
        
        const rawData = await readInput(inputFile);

        const peopleInfo = await removeDuplicatesAndConvert(rawData);

        // const objects = await transformCSV(rawData);

        // const uniqueRegistries = await removeRegistryDuplicates(objects);
        
        writeOutput(peopleInfo, 'output.json');
        
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
    }
})();
