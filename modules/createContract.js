const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

module.exports = async (postData, options, config) => {
    propertyMapping.initDatabase();
    const contractCategory = await propertyMapping.getCategory(config.stage, null, postData.categoryKey);
    const contractProperties = await propertyMapping.getPropertiesByCategory(config.stage, contractCategory.categoryID);
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
                    // TODO: Change for Kundenrahmenvertrag
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
