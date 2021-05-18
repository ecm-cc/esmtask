const axios = require('axios');
const rax = require('retry-axios');
const propertyMapping = require('@ablegroup/propertymapping');
const getRetryConfig = require('./getRetryConfig');

rax.attach();

module.exports = async (postData, options, config) => {
    propertyMapping.initDatabase();
    const caseCategory = await propertyMapping.getCategory(config.stage, null, postData.categoryKey);
    const caseProperties = await propertyMapping.getPropertiesByCategory(config.stage, caseCategory.categoryID);
    const caseNumberField = caseProperties.find((prop) => prop.displayname === 'Vorgangsnummer (intern)').propertyKey;
    postData.caseNumber = await getCaseNumber(caseCategory.categoryKey, caseNumberField.toString(), options, config);
    await validateCase(postData, options, config, caseCategory, caseProperties);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m`;
    httpOptions.data = {
        sourceCategory: caseCategory.categoryKey,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        sourceProperties: {
            properties: [
                {
                    key: caseProperties.find((property) => property.displayname === 'Vorgangsnummer (intern)').propertyKey,
                    values: [postData.caseNumber],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Vertragstyp').propertyKey,
                    values: [postData.contractType],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Vorgangstyp').propertyKey,
                    values: [postData.caseType],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Organisationseinheit').propertyKey,
                    values: [postData.caseOrganisationunit],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Vorgangsstatus').propertyKey,
                    values: ['VP-Bearbeitung'],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Ansprechpartner Organisationseinheit').propertyKey,
                    // TODO: Remove fourth and fifth argument when d-velop ticket 00155914 is solved
                    // eslint-disable-next-line max-len
                    values: [await getUserNameByUPN(postData.orgunitContact, config, options, caseCategory.categoryKey, caseProperties.find((property) => property.displayname === 'Ansprechpartner Organisationseinheit').propertyKey)],
                },
                {
                    key: caseProperties.find((property) => property.displayname === 'Verantwortlich').propertyKey,
                    values: [await getCurrentUserUPN(config, options)],
                },
            ],
        },
    };
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    const response = await axios(httpOptions);
    const uri = response.headers.location.split('?')[0];
    return uri.split('/')[5];
};

async function getUserNameByUPN(upn, config, options, categoryKey, propertyKey) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/scim/users/`;
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    const response = await axios(httpOptions);
    const users = response.data.resources;
    const userName = users.find((user) => user.userName === upn) ? users.find((user) => user.userName.toLowerCase() === upn.toLowerCase()).displayName : '';

    // TODO: Re-use this when d-velop ticket 00155914 is solved and delete all below this return
    // return users.find((user) => user.userName === upn) ? users.find((user) => user.userName.toLowerCase() === upn.toLowerCase()).displayName : '';

    const httpOptionsPost = JSON.parse(JSON.stringify(options));
    httpOptionsPost.url = `${config.host}/dms/r/${config.repositoryId}/validvalues/p/${propertyKey}`;
    httpOptionsPost.method = 'POST';
    httpOptionsPost.data = {
        dossierId: null,
        extendedProperties: { [propertyKey]: userName.substring(0, 45) },
        multivalueExtendedProperties: {},
        objectDefinitionId: categoryKey,
        remarks: {},
        storeObject: {
            masterFileName: null, filename: null, parentId: null, dmsObjectId: null, displayValue: null,
        },
        displayValue: null,
        dmsObjectId: null,
        filename: null,
        masterFileName: null,
        parentId: null,
        systemProperties: {},
        type: 2,
    };
    httpOptionsPost.raxConfig = getRetryConfig(rax, httpOptionsPost);
    const responsePost = await axios(httpOptionsPost);
    return responsePost.data.values[0].value;
}

async function getCurrentUserUPN(config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/validate`;
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    const response = await axios(httpOptions);
    return response.data.displayName;
}

async function getCaseNumber(categoryKey, caseNumberField, options, config) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    const urlHost = `${config.host}/dms/sr/?objectdefinitionids=["${categoryKey}"]`;
    const urlParams = `&repositoryid=${config.repositoryId}&propertysort=property_creation_date&ascending=false`;
    const url = `${urlHost}${urlParams}`;
    const internalNumberPrefix = config.internalNumberPrefix[categoryKey];
    httpOptions.url = url;
    httpOptions.method = 'get';
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    const searchResults = (await axios(httpOptions)).data;
    let latestInternalNumber;
    let found = false;
    const regEx = new RegExp(config.internalNumberRegEx[categoryKey]);
    searchResults.items.forEach((result) => {
        const internalNumber = result.displayProperties.find((prop) => prop.id === caseNumberField).value;
        if (regEx.test(internalNumber) && !found) {
            latestInternalNumber = internalNumber;
            found = true;
        }
    });
    if (!found) {
        latestInternalNumber = `${internalNumberPrefix}-${new Date().getFullYear()}-00001`;
    } else {
        const latestInternalNumberArray = latestInternalNumber.split('-');
        const internalNumberInt = parseInt(latestInternalNumberArray[2], 10) + 1;
        latestInternalNumber = `${internalNumberPrefix}-${new Date().getFullYear()}-00000`;
        latestInternalNumber = latestInternalNumber.substr(0, latestInternalNumber.length - internalNumberInt.toString().length);
        latestInternalNumber += internalNumberInt;
    }
    return latestInternalNumber;
}

async function validateCase(postData, options, config, caseCategory, caseProperties) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/storevalidate`;
    httpOptions.data = {
        type: 2,
        objectDefinitionId: caseCategory.categoryKey,
        systemProperties: {},
        remarks: {},
        multivalueExtendedProperties: {
        },
        extendedProperties: {
            [caseProperties.find((property) => property.displayname === 'Vorgangsnummer (intern)').propertyKey]: postData.caseNumber,
            [caseProperties.find((property) => property.displayname === 'Vertragstyp').propertyKey]: postData.contractType,
            [caseProperties.find((property) => property.displayname === 'Vorgangsstatus').propertyKey]: 'VP-Bearbeitung',
            [caseProperties.find((property) => property.displayname === 'Vorgangstyp').propertyKey]: postData.caseType,
            [caseProperties.find((property) => property.displayname === 'Organisationseinheit').propertyKey]: postData.caseOrganisationunit,
        },
        dossierId: null,
        storeObject: {
            masterFileName: null, filename: null, parentId: null, dmsObjectId: null, displayValue: null,
        },
    };
    await axios(httpOptions);
}
