require('dotenv').config();

function getLocalConfig(tenant) {
    switch (tenant) {
    // DEV
    case '14q': return {
        stage: 'dev',
        host: 'https://able-group-dev.d-velop.cloud',
        repositoryId: '1a2cde3f-2913-3dc2-4a2e-e623459ac23a',
        documentCategory: 'ESMD',
        ivantiURL: 'https://ablegroup-stg.saasiteu.com/api/rest/Attachment?ID=',
        ivantiAPIKey: process.env.IVANTI_API_KEY_STG,
    };
    // QAS
    case '197': return {
        host: 'https://able-group-qas.d-velop.cloud',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_STG,
    };
    // Version
    case '1ha': return {
        host: 'https://able-group-version.d-velop.cloud',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_STG,
    };
    // Default: PROD
    default: return {
        host: 'https://able-group.d-velop.cloud',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_PROD,
    };
    }
}

module.exports = {
    getLocalConfig,
};
