const axios = require('axios');
const rax = require('retry-axios');
const propertyMapping = require('@ablegroup/propertymapping');
const getRetryConfig = require('./getRetryConfig');

module.exports = async (postData, options, config) => {
    propertyMapping.initDatabase();
    console.log('Create new contract with postdata');
    console.log(postData);
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
                {
                    key: contractProperties.find((property) => property.displayname === 'Vertragsbezeichnung').propertyKey,
                    values: [postData.contractTitle],
                },
                {
                    key: contractProperties.find((property) => property.displayname === 'Vertragsuntertyp').propertyKey,
                    values: [postData.contractSubType],
                },
                {
                    key: contractProperties.find((property) => property.displayname === 'Verantwortlich').propertyKey,
                    values: [await getUserNameByUPN(postData.responsiblePerson, config, options)],
                },
            ],
        },
    };
    if (postData.contractValue) {
        httpOptions.data.sourceProperties.properties.push({
            key: contractProperties.find((property) => property.displayname === 'Vertragswert').propertyKey,
            values: [postData.contractValue],
        });
    }
    const response = await axios(httpOptions);
    const uri = response.headers.location.split('?')[0];
    return uri.split('/')[5];
};

async function getUserNameByUPN(upn, config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/scim/users/`;
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    const response = await axios(httpOptions);
    const users = response.data.resources;
    return users.find((user) => user.userName === upn) ? users.find((user) => user.userName.toLowerCase() === upn.toLowerCase()).id : '';
}

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
            [contractProperties.find((property) => property.displayname === 'Vertragsbezeichnung').propertyKey]: postData.contractTitle,
            [contractProperties.find((property) => property.displayname === 'Vertragsuntertyp').propertyKey]: postData.contractSubType,
            [contractProperties.find((property) => property.displayname === 'Verantwortlich').propertyKey]: postData.responsiblePerson,
        },
        dossierId: null,
        storeObject: {
            masterFileName: null, filename: null, parentId: null, dmsObjectId: null, displayValue: null,
        },
    };
    await axios(httpOptions);
}
