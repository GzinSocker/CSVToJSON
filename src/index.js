// Functionalty packages
const argv = require('minimist')(process.argv.slice(2));
const lodash = require('lodash');

// File manipulation packages
const fileSystem = require('fs').promises;
const parse = require('csv-parse/lib/sync');

// Addresses validation áckages
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const emailValidator = require("email-validator");

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

/**
 * Transform the string rawData into a Object.
 * @param {string} rawData 
 * @returns JS Object converted data.
 */
async function transformCSV(rawData) {
    try {
        const preFormatedData = parse(rawData, {
            columns: true,
            skip_empty_lines: false,
            columnsDuplicatesToArray: true
        });

        return preFormatedData;
    } catch(err) {
        throw err;
    }
}

/**
 * Merge registries with the same id.
 * @param {Array} registries 
 * @returns A sigle object with the registries attributes merged.
 */
function mergeRepeatedRegistries(registries) {
    try {
        const unifiedRegistry = {};
    
        unifiedRegistry['fullname'] = registries[0]['fullname'];
        unifiedRegistry['eid'] = registries[0]['eid'];
        registries.forEach(registry => {
            for(key in registry) {
                if(key.indexOf('email') != -1 || key.indexOf('phone') != -1) {
                    if(!unifiedRegistry[key]) unifiedRegistry[key] = registry[key];
                    else unifiedRegistry[key] =  unifiedRegistry[key]+'/'+registry[key];
                }
            }
        });
        unifiedRegistry['group'] = [];
        registries.forEach(registry => {
            for(key in registry) {
                if(key == 'group') {
                    unifiedRegistry[key] = lodash.concat(unifiedRegistry['group'],  registry[key]);
                }
            }
        });
        unifiedRegistry['group'] = lodash.join(unifiedRegistry['group'], '/');
        unifiedRegistry['invisible'] = registries[0]['invisible'];
        unifiedRegistry['see_all'] = registries[0]['see_all'];
    
        return unifiedRegistry
    } catch (err) {
        throw err;
    }
}

/**
 * Transform the array to have unique registries based on the attribute *eid*.
 * @param {Array} registries 
 */
async function removeRegistryDuplicates(registries) {
    try {
        const organizedRegistries = lodash.groupBy(registries, "eid");
        
        const uniqueRegistries = [];
        for( registry in organizedRegistries ) {
    
            // Checks if that id has a single registry
            if(organizedRegistries[registry].length == 1) {
                uniqueRegistries.push(organizedRegistries[registry][0]);
            }
            else {
                // Unifies the duplicated registries.
                uniqueRegistries.push(mergeRepeatedRegistries(organizedRegistries[registry]));
            }
        }
    
        return uniqueRegistries;
    } catch (err) {
        throw err;
    }
}

/**
 * Validate and format the `groups` attribute.
 * @param {Array} registries 
 * @returns Registries with the `groups` attribute formatted.
 */
async function formatGroupAttribute(registries) {
    try {
        let formattedGroups;
        registries.forEach((registry, index) => {
            
            // Stringfy group arrays
            if(Array.isArray(registry['group'])) {
                registry['group'] = lodash.join(registry['group'], '/');
            }
    
            // Transform string group into array through a regex
            formattedGroups = registry['group'].split(/[/,]/);
            
            // Clear the registry
            delete registries[index]['group']
            registries[index]['groups'] = [];

            // Trim the splited strings
            formattedGroups.forEach((group) => {
                if(group != '')
                     registries[index]['groups'].push(group.trim());
            });
    
            // Remove a repeated group
            registries[index]['groups'] = registries[index]['groups'].filter((value, index, self) => {
                return self.indexOf(value) == index;
            })
    
            // Sort the groups
            registries[index]['groups'].sort();
        });
        
        return registries;
    } catch(err) {
        throw err;
    }
}

/**
 * Separate and clear bad formatted addresses.
 * @param {string} address 
 * @param {string} type 
 * @returns Adresses array which addresses are separated and clean.
 */
function separateAndClearAddresses(address, type) {
    try {
        // Separate
        const separated =
        type == 'phone' ? address.split(/[/,]/)
                        : address.split(/[\s/,-]/);
        address = [];

        // Clear
        separated.forEach((item) => {
            if(item != '')
                address.push(item.trim());
        });

        return address;
    } catch(err) {
        throw err;
    }
}

/**
 * Validate, format and transform the Object structure of phone number.
 * @param {string} tags 
 * @param {string} content 
 * @returns Object with the phone number formatted and ready to be indexed.
 */
function validateAndFormatPhone(tags, content) {
    try {
        const phoneAddressArray = [];
        let phoneAddress;
        
        content = separateAndClearAddresses(content, 'phone');

        let rawNumbers;
        let number;
        let splitedTags;
        content.forEach((possiblePhone) => {
            // Extracting just the numbers
            rawNumbers = possiblePhone.replace(/\D/g, "");
            if(rawNumbers != '') {
                number = phoneUtil.parse(rawNumbers, 'BR');
                if(phoneUtil.isPossibleNumber(number)) {
                    // Clean old informations
                    phoneAddress = {};

                    // Fill phone address
                    splitedTags = tags.split(' ');
                    phoneAddress['type'] = splitedTags[0];
                    phoneAddress['tags'] = splitedTags.slice(1);
                    phoneAddress['address'] = phoneUtil.format(number, PNF.E164).slice(1);
                    phoneAddressArray.push(phoneAddress);
                }
            }
        })
        return phoneAddressArray;
    } catch(err) {
        throw err;
    }
}

/**
 * Validate, format and transform the Object structure of phone number.
 * @param {string} tags 
 * @param {string} content 
 * @returns Object with the email formatted and ready to be indexed.
 */
function validateAndFormatEmail(tags, content) {
    try {
        const emailAddressArray = [];
        let emailAddress;
        
        content = separateAndClearAddresses(content, 'email');

        content.forEach( possibleEmail => {
            if(emailValidator.validate(possibleEmail)) {
                // Clean old informations
                emailAddress = {};

                // Fill email address
                splitedTags = tags.split(' ');
                emailAddress['type'] = splitedTags[0];
                emailAddress['tags'] = splitedTags.slice(1);
                emailAddress['address'] = possibleEmail;
                emailAddressArray.push(emailAddress);
            }
        });

        return emailAddressArray;
    } catch(err) {
        throw err;
    }
}

/**
 * Transform the `addresses` attribute structure to the output format needed.
 * @param {Object} addresses 
 * @returns Object with the right *addresses* structure.
 */
function validateAndFormatAddresses(addresses) {
    let formattedAddresses = [];
    let formattedAddressArray;
    for (address in addresses) {
        if(addresses[address] != '') {
            if(address.indexOf('phone') != -1) {
                formattedAddressArray = validateAndFormatPhone(address, addresses[address]);
                formattedAddresses = formattedAddresses.concat(formattedAddressArray);
            }
            else if (address.indexOf('email') != -1) {
                formattedAddressArray = validateAndFormatEmail(address, addresses[address]);
                formattedAddresses = formattedAddresses.concat(formattedAddressArray);
            }
        }
    }

    return formattedAddresses;
}

/**
 * Build the `addresses` attribute.
 * @param {Array} registries 
 * @returns Registries array with the `addressess` attribute.
 */
async function formatAddressAttribute(registries) {
    try {
        let addresses;
        let formattedAddresses;
        registries.forEach((registry, registryIndex) => {
            addresses = {};
            for(attributeIndex in registry) {
                // Check if the attribute is an address
                if(attributeIndex.indexOf('phone') != -1 || attributeIndex.indexOf('email') != -1) {
                    addresses[attributeIndex] = registry[attributeIndex];
                    // Clear the original registry information to be added later
                    delete registries[registryIndex][attributeIndex];
                }
            };
            formattedAddresses = validateAndFormatAddresses(addresses);

            registries[registryIndex]['addresses'] = formattedAddresses;
        });

        return registries;
    } catch(err) {
        throw err;
    }
}

/**
 * Set the visibilities attributes with real boolean values.
 * @param {Array} registries 
 * @returns Registries array with visibilities attributes formatted.
 */
async function formatVisibilityAtributes(registries) {
    try {
        const trueList = ["true", "1", "yes"]

        for(registryIndex in registries) {
            // Checks invisible attribute
            if(trueList.includes(registries[registryIndex]['invisible']))
                registries[registryIndex]['invisible'] = true;
            else
                registries[registryIndex]['invisible'] = false;

            //Check see_all attribute
            if(trueList.includes(registries[registryIndex]['see_all']))
                registries[registryIndex]['see_all'] = true;
            else
                registries[registryIndex]['see_all'] = false;
        }

        return registries;
    } catch(err) {
        throw err;
    }
}

/**
 * Write the `data` content into the `fileName` file. If `fileName` does not exist in *src* directory, it will be created.
 * @param {Array} data 
 * @param {string} fileName 
 */
function writeOutput(data, fileName) {
    try {
        const stringContent = JSON.stringify(data, null, 2);
    
        fileSystem.writeFile(`src/${fileName}`, stringContent, { encoding: 'utf-8' });
    } catch(err) {
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

        const objects = await transformCSV(rawData);

        const uniqueRegistries = await removeRegistryDuplicates(objects);

        const groupFormatted = await formatGroupAttribute(uniqueRegistries);

        const addressFormatted = await formatAddressAttribute(groupFormatted);

        const visibilityFormated = await formatVisibilityAtributes(addressFormatted)

        writeOutput(visibilityFormated, 'output.json');
        
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
    }
})();
