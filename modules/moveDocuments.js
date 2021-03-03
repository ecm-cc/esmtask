const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

let options;
let config;

module.exports = async (dossierID, documentURL, givenOptions, localConfig, type) => {
    config = localConfig;
    options = givenOptions;
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = documentURL;
    const response = await axios(httpOptions);
    const promises = [];
    response.data.items.forEach((document) => {
        promises.push(moveDocument(document, dossierID, type, options, config));
    });
    await Promise.all(promises);
};

async function moveDocument(document, dossierID, type) {
    const documentBuffer = await downloadDocument(document, options, config);
    const documentUri = await uploadDocument(documentBuffer, config, options);
    const documentMeta = await getDocumentMeta(document.id);
    await createDocument(documentMeta, dossierID, documentUri, type, config, options);
    try {
        await deleteDocument(documentMeta, config, options);
    } catch (err) {
        console.error(err);
    }
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

async function createDocument(documentMeta, dossierID, contentLocationUri, type) {
    const filename = documentMeta.systemProperties.find((prop) => prop.id === 'property_filename').value;
    propertyMapping.initDatabase();
    const dossierCategoryName = await getDossierCategory(dossierID, config, options);
    const dossierDocumentCategories = await propertyMapping.getCategoryByParent(config.stage, null, null, dossierCategoryName);
    let dossierDocumentCategory;
    let dossierDocumentProperties;
    if (type === 'contract') {
        dossierDocumentCategory = dossierDocumentCategories.find((category) => category.displayname.includes('unterlage')); // Needed, but not good
        dossierDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, dossierDocumentCategory.categoryID);
    } else {
        dossierDocumentCategory = dossierDocumentCategories.find((category) => category.displayname.includes('dokument')); // Needed, but not good
        dossierDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, dossierDocumentCategory.categoryID);
    }
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m`;
    httpOptions.data = {
        filename,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        contentLocationUri,
        parentId: dossierID,
        sourceProperties: {
            properties: type === 'contract' ? getContractSourceProperties(dossierDocumentProperties, documentMeta)
                : getCaseSourceProperties(dossierDocumentProperties, documentMeta),
        },
    };
    await axios(httpOptions);
}

function getContractSourceProperties(dossierDocumentProperties, documentMeta) {
    return [
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Typ Vertragsunterlage (Lieferant)').propertyKey,
            values: ['Anlage'],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM ID').propertyKey,
            values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM ID').value],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey,
            values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM techn. ID').value],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM Status').propertyKey,
            values: ['Offen'],
        },
    ];
}

function getCaseSourceProperties(dossierDocumentProperties, documentMeta) {
    return [
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Typ Vorgangsunterlage').propertyKey,
            values: ['Vertragsanlage'],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM ID').propertyKey,
            values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM ID').value],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey,
            values: [documentMeta.objectProperties.find((prop) => prop.name === 'ESM techn. ID').value],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'ESM Status').propertyKey,
            values: ['Offen'],
        },
    ];
}

async function getDossierCategory(dossier) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${dossier}`;
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
