const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

module.exports = async (dossierID, esmLink, options, config) => {
    propertyMapping.initDatabase();
    const caseCategory = await propertyMapping.getCategory(config.stage, null, null, 'Legal - Vorgangsakte');
    const caseProperties = await propertyMapping.getPropertiesByCategory(config.stage, caseCategory.categoryID);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'PUT';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m/${dossierID}`;
    httpOptions.data = {
        sourceCategory: caseCategory.categoryKey,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        sourceProperties: {
            properties: [
                {
                    key: caseProperties.find((property) => property.displayname === 'ESM Link').propertyKey,
                    values: [esmLink],
                },
            ],
        },
    };
    await axios(httpOptions);
};
