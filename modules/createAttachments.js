const axios = require('axios');
const rax = require('retry-axios');
const propertyMapping = require('@ablegroup/propertymapping');
const getRetryConfig = require('./getRetryConfig');

rax.attach();

module.exports = async (postData, config, options) => {
    propertyMapping.initDatabase();
    const promises = [];
    postData.attachments.forEach((attachmentID) => {
        promises.push(createAttachment(postData, attachmentID, config, options));
    });
    await Promise.all(promises);
};

async function createAttachment(postData, attachmentID, config, options) {
    const attachmentResponse = await downloadAttachment(attachmentID, config);
    const attachmentPayload = attachmentResponse.data;
    const attachmentFilename = getFileName(attachmentResponse.headers['content-disposition']);
    const documentURI = await uploadDocument(attachmentPayload, config, options);
    await createDocument(postData, documentURI, attachmentFilename, config, options);
}

async function downloadAttachment(attachmentID, config) {
    const ivantiOptions = {
        method: 'get',
        url: config.ivantiAttachmentURL + attachmentID,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        responseType: 'arraybuffer',
    };
    const response = await axios(ivantiOptions);
    return response;
}

function getFileName(dispositionHeader) {
    const fileName = dispositionHeader.split('filename=')[1];
    if (fileName.includes('"=?utf-8?B?')) {
        return Buffer.from(fileName.substring(11, fileName.length - 3), 'base64').toString();
    }
    if (fileName[0] === '"') {
        return fileName.substring(1, fileName.length - 1);
    }
    return fileName;
}

async function uploadDocument(attachmentPayload, config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/octet-stream';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/blob/chunk`;
    httpOptions.data = Buffer.from(attachmentPayload);
    httpOptions.raxConfig = getRetryConfig(httpOptions);
    const response = await axios(httpOptions);
    return response.headers.location;
}

async function createDocument(postData, contentLocationUri, filename, config, options) {
    const esmDocumentCategory = await propertyMapping.getCategory(config.stage, null, null, 'ESM-Dokumente');
    const esmDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, esmDocumentCategory.categoryID);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/hal+json';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2m`;
    httpOptions.data = {
        filename,
        sourceCategory: esmDocumentCategory.categoryKey,
        sourceId: `/dms/r/${config.repositoryId}/source`,
        contentLocationUri,
        sourceProperties: {
            properties: [
                {
                    key: esmDocumentProperties.find((property) => property.displayname === 'ESM ID').propertyKey,
                    values: [postData.serviceRequestID],
                },
                {
                    key: esmDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey,
                    values: [postData.serviceRequestTechnicalID],
                },
                {
                    key: esmDocumentProperties.find((property) => property.displayname === 'ESM Status').propertyKey,
                    values: ['Offen'],
                },
            ],
        },
    };
    httpOptions.raxConfig = getRetryConfig(rax, httpOptions);
    await axios(httpOptions);
}
