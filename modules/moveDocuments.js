const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

let options;
let config;

module.exports = async (contract, documentURL, givenOptions, localConfig) => {
    config = localConfig;
    options = givenOptions;
    const httpOptions = options;
    httpOptions.url = documentURL;
    const response = await axios(httpOptions);
    const promises = [];
    response.data.items.forEach((document) => {
        promises.push(moveDocument(document, contract, options, config));
    });
    await Promise.all(promises);
};

async function moveDocument(document, contract) {
    const documentBuffer = await downloadDocument(document, options, config);
    const documentUri = await uploadDocument(documentBuffer, config, options);
    const documentMeta = await getDocumentMeta(document.id);
    await createDocument(documentMeta, contract, documentUri, config, options);
    await deleteDocument(documentMeta, config, options);
}

async function downloadDocument(document) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${document.id}/v/current/b/main/c`;
    httpOptions.responseType = 'arraybuffer';
    const response = await axios(httpOptions);
    return Buffer.from(response.data);
}

async function uploadDocument(documentBuffer) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/octet-stream';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/blob/chunk`;
    httpOptions.data = documentBuffer;
    const response = await axios(httpOptions);
    return response.headers.location;
}

async function getDocumentMeta(documentID) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'get';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${documentID}`;
    const response = await axios(httpOptions);
    return response.data;
}

async function createDocument(documentMeta, contract, contentLocationUri) {
    const filename = documentMeta.systemProperties.find((prop) => prop.id === 'property_filename').value;
    propertyMapping.initDatabase();
    const contractCategoryName = await getContractCategory(contract, config, options);
    const contractDocumentCategories = await propertyMapping.getCategoryByParent(config.stage, null, null, contractCategoryName);
    const contractDocumentCategory = contractDocumentCategories.find((category) => category.displayname.includes('unterlage')); // Needed, but not good
    const contractDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, contractDocumentCategory.categoryID);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m`;
    httpOptions.data = {
        filename,
        // sourceCategory: esmDocumentCategory.categoryKey,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        contentLocationUri,
        parentId: contract,
        sourceProperties: {
            properties: [
                {
                    // TODO: Change for Kundenrahmenvertrag
                    key: contractDocumentProperties.find((property) => property.displayname === 'Typ Vertragsunterlage (Lieferant)').propertyKey,
                    values: ['Anlage'],
                },
                {
                    key: contractDocumentProperties.find((property) => property.displayname === 'ESM ID').propertyKey,
                    values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM ID').value],
                },
                {
                    key: contractDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey,
                    values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM techn. ID').value],
                },
                {
                    key: contractDocumentProperties.find((property) => property.displayname === 'ESM Status').propertyKey,
                    values: ['Offen'],
                },
            ],
        },
    };
    await axios(httpOptions);
}

async function getContractCategory(contract) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${contract}`;
    const response = await axios(httpOptions);
    return response.data.category;
}

async function deleteDocument(documentMeta) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'delete';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${documentMeta.id}`;
    httpOptions.data = { reason: 'ESM-Document moved.' };
    await axios(httpOptions);
}
