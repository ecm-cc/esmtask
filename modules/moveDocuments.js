const axios = require('axios');
const login = require('@ablegroup/login');
const propertyMapping = require('@ablegroup/propertymapping');

let options;
let config;

module.exports = async (dossierID, documentURL, documentProperties, givenOptions, localConfig, type) => {
    config = localConfig;
    options = givenOptions;
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = documentURL;
    const response = await axios(httpOptions);
    const promises = [];
    response.data.items.forEach((document) => {
        if (documentProperties && documentProperties[document.id]) {
            promises.push(moveDocument(document, dossierID, type, documentProperties[document.id]));
        } else {
            promises.push(forceDeleteDocument(document.id));
        }
    });
    await Promise.all(promises);
};

async function moveDocument(document, dossierID, type, documentProperties) {
    const documentBuffer = await downloadDocument(document);
    const documentUri = await uploadDocument(documentBuffer);
    const documentMeta = await getDocumentMeta(document.id);
    await createDocument(documentMeta, dossierID, documentUri, type, documentProperties);
    try {
        await deleteDocument(documentMeta);
    } catch (err) {
        console.error(err);
    }
}

async function forceDeleteDocument(documentID) {
    const documentMeta = await getDocumentMeta(documentID);
    await deleteDocument(documentMeta);
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
    httpOptions.maxBodyLength = config.maxBodyLength;
    httpOptions.maxContentLength = config.maxContentLength;
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

async function createDocument(documentMeta, dossierID, contentLocationUri, type, documentProperties) {
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
        alterationText: documentProperties.version ? documentProperties.version : '',
        contentLocationUri,
        parentId: dossierID,
        sourceProperties: {
            properties: type === 'contract' ? getContractSourceProperties(dossierDocumentProperties, documentMeta, documentProperties)
                : getCaseSourceProperties(dossierDocumentProperties, documentMeta, documentProperties),
        },
    };
    await axios(httpOptions);
}

function getContractSourceProperties(dossierDocumentProperties, documentMeta, documentProperties) {
    return [
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Typ Vertragsunterlage (Lieferant)').propertyKey,
            values: documentProperties ? [documentProperties.type] : ['Sonstige'],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Betreff').propertyKey,
            values: documentProperties ? [documentProperties.subject] : [''],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Ordner').propertyKey,
            values: documentProperties ? [documentProperties.folder] : [''],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Belegdatum').propertyKey,
            values: documentProperties ? [documentProperties.date] : [''],
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

function getCaseSourceProperties(dossierDocumentProperties, documentMeta, documentProperties) {
    return [
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Betreff').propertyKey,
            values: documentProperties ? [documentProperties.subject] : [''],
        },
        {
            key: dossierDocumentProperties.find((property) => property.displayname === 'Typ Vorgangsunterlage').propertyKey,
            values: documentProperties ? [documentProperties.type] : ['zu definieren'],
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
    const authSessionId = await login(config.host, config.serviceUserAPIKey);
    httpOptions.headers.Authorization = `Bearer ${authSessionId}`;
    delete httpOptions.headers.Cookie;
    httpOptions.method = 'delete';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${documentMeta.id}`;
    httpOptions.data = { reason: 'ESM-Document moved.' };
    await axios(httpOptions);
}
