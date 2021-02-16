const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');

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
    const attachmentFilename = attachmentResponse.headers['content-disposition'].split('filename=')[1];
    const documentURI = await uploadDocument(attachmentPayload, config, options);
    await createDocument(postData, documentURI, attachmentFilename, config, options);
}

async function downloadAttachment(attachmentID, config) {
    const ivantiOptions = {
        method: 'get',
        url: config.ivantiURL + attachmentID,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        responseType: 'arraybuffer',
    };
    const response = await axios(ivantiOptions);
    return response;
}

async function uploadDocument(attachmentPayload, config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.method = 'post';
    httpOptions.headers['Content-Type'] = 'application/octet-stream';
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/blob/chunk`;
    httpOptions.data = Buffer.from(attachmentPayload);
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
    await axios(httpOptions);
}
