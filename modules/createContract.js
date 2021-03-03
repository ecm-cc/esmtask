const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

module.exports = async (postData, options, config) => {
    propertyMapping.initDatabase();
    const contractCategory = await propertyMapping.getCategory(config.stage, null, postData.categoryKey);
    const contractProperties = await propertyMapping.getPropertiesByCategory(config.stage, contractCategory.categoryID);
    await validateContract(postData, options, config, contractCategory, contractProperties);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m`;
    httpOptions.data = {
        sourceCategory: contractCategory.categoryKey,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        sourceProperties: {
            properties: [
                {
                    key: contractProperties.find((property) => property.displayname === 'Vertragsnummer (intern)').propertyKey,
                    values: [postData.contractNumber],
                },
                {
                    key: contractProperties.find((property) => property.displayname === 'Vertragsstatus').propertyKey,
                    values: [postData.contractStatus],
                },
                {
                    key: contractProperties.find((property) => property.displayname === 'Vertragstyp Lieferant').propertyKey,
                    values: [postData.contractType],
                },
                {
                    key: contractProperties.find((property) => property.displayname === 'Geschäftspartnername').propertyKey,
                    values: [postData.partnerName],
                },
            ],
        },
    };
    const response = await axios(httpOptions);
    const uri = response.headers.location.split('?')[0];
    return uri.split('/')[5];
};

async function validateContract(postData, options, config, contractCategory, contractProperties) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/storevalidate`;
    httpOptions.data = {
        type: 2,
        objectDefinitionId: contractCategory.categoryKey,
        systemProperties: {},
        remarks: {},
        multivalueExtendedProperties: {
            [contractProperties.find((property) => property.displayname === 'Geschäftspartnername').propertyKey]: { 1: postData.partnerName },
        },
        extendedProperties: {
            [contractProperties.find((property) => property.displayname === 'Vertragsnummer (intern)').propertyKey]: postData.contractNumber,
            [contractProperties.find((property) => property.displayname === 'Vertragsstatus').propertyKey]: postData.contractStatus,
            [contractProperties.find((property) => property.displayname === 'Geschäftspartnername').propertyKey]: postData.partnerName,
            [contractProperties.find((property) => property.displayname === 'Vertragstyp Lieferant').propertyKey]: postData.contractType,
        },
        dossierId: null,
        storeObject: {
            masterFileName: null, filename: null, parentId: null, dmsObjectId: null, displayValue: null,
        },
    };
    await axios(httpOptions);
}
