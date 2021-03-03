const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

module.exports = async (postData, options, config) => {
    propertyMapping.initDatabase();
    const caseCategory = await propertyMapping.getCategory(config.stage, null, postData.categoryKey);
    const caseProperties = await propertyMapping.getPropertiesByCategory(config.stage, caseCategory.categoryID);
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
            ],
        },
    };
    const response = await axios(httpOptions);
    const uri = response.headers.location.split('?')[0];
    return uri.split('/')[5];
};

async function validateCase(postData, options, config, caseCategory, caseProperties) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/storevalidate`;
    console.debug(caseProperties.find((property) => property.displayname === 'Vertragstyp').propertyKey);
    console.debug(postData.contractType);
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
