require('dotenv').config();

function getLocalConfig(tenant) {
    switch (tenant) {
    // DEV
    case '14q': return {
        stage: 'dev',
        host: 'https://able-group-dev.d-velop.cloud',
        repositoryId: '1a2cde3f-2913-3dc2-4a2e-e623459ac23a',
        documentCategory: 'ESMD',
        ivantiBaseURL: 'https://ablegroup-stg.saasiteu.com',
        ivantiAttachmentURL: 'https://ablegroup-stg.saasiteu.com/api/rest/Attachment?ID=',
        ivantiStatusURL: 'https://ablegroup-stg.saasiteu.com/api/odata/businessobject/ServiceReqs',
        ivantiAPIKey: process.env.IVANTI_API_KEY_STG,
        serviceUserAPIKey: process.env.SERVICE_USER_API_KEY_DEV,
        groupName: {
            rentalContract: 'BA_ECM_CS_IMMO',
            supplierContract: 'BA_ECM_CS_EINKAUF',
            customerContract: 'BA_LEGAL_DEPARTMENT',
            customerContractDefaultDocuments: 'BA_LEGAL_DEPARTMENT',
        },
        internalNumberPrefix: {
            XLEV: 'LEV',
            XLRV: 'LRV',
            XCASE: 'VG',
        },
        internalNumberRegEx: {
            XLEV: `LEV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XLRV: `LRV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XCASE: `VG-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
        },
        longFields: ['contractualRelation', 'targetBusiness', 'risks', 'notes', 'customizing', 'changes'],
        debugAssignees: ['E6140B53-FF0D-4AA2-8F3B-79962F85EB61', '50931705-1A37-41A5-BAE5-25020D56604F'],
    };
    // QAS
    case '197': return {
        stage: 'qas',
        host: 'https://able-group-qas.d-velop.cloud',
        repositoryId: '64bdf712-b328-5f46-8fd0-b8e67aaf8bec',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_UAT,
        ivantiBaseURL: 'https://ablegroup-uat.saasiteu.com',
        ivantiAttachmentURL: 'https://ablegroup-uat.saasiteu.com/api/rest/Attachment?ID=',
        ivantiStatusURL: 'https://ablegroup-uat.saasiteu.com/api/odata/businessobject/ServiceReqs',
        serviceUserAPIKey: process.env.SERVICE_USER_API_KEY_QAS,
        groupName: {
            rentalContract: 'BA_ECM_CS_IMMO',
            supplierContract: 'BA_ECM_CS_EINKAUF',
            customerContract: 'BA_LEGAL_DEPARTMENT',
            customerContractDefaultDocuments: 'BA_LEGAL_DEPARTMENT',
        },
        internalNumberPrefix: {
            XLEV: 'LEV',
            XLRV: 'LRV',
            XCASE: 'VG',
        },
        internalNumberRegEx: {
            XLEV: `LEV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XLRV: `LRV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XCASE: `VG-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
        },
        longFields: ['contractualRelation', 'targetBusiness', 'risks', 'notes', 'customizing', 'changes'],
        debugAssignees: ['3F8875B7-B60A-43C7-92BB-6A67E39F1504', '50931705-1A37-41A5-BAE5-25020D56604F'],
    };
    // Version
    case '1ha': return {
        stage: 'version',
        host: 'https://able-group-version.d-velop.cloud',
        repositoryId: '576583f0-8cd0-5796-bc94-e49426e7bbfb',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_UAT,
        ivantiBaseURL: 'https://ablegroup-uat.saasiteu.com',
        ivantiAttachmentURL: 'https://ablegroup-uat.saasiteu.com/api/rest/Attachment?ID=',
        ivantiStatusURL: 'https://ablegroup-uat.saasiteu.com/api/odata/businessobject/ServiceReqs',
        serviceUserAPIKey: process.env.SERVICE_USER_API_KEY_VERSION,
        groupName: {
            rentalContract: 'BA_ECM_CS_IMMO',
            supplierContract: 'BA_ECM_CS_EINKAUF',
            customerContract: 'BA_LEGAL_DEPARTMENT',
            customerContractDefaultDocuments: 'BA_LEGAL_DEPARTMENT',
        },
        internalNumberPrefix: {
            XLEV: 'LEV',
            XLRV: 'LRV',
            XCASE: 'VG',
        },
        internalNumberRegEx: {
            XLEV: `LEV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XLRV: `LRV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XCASE: `VG-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
        },
        longFields: ['contractualRelation', 'targetBusiness', 'risks', 'notes', 'customizing', 'changes'],
        debugAssignees: ['F3CA1284-55C6-435F-9D7B-F2A60A256757', '616DE90F-8223-493B-A3DD-D3B74E9AFF7A'],

    };
    // Default: PROD
    default: return {
        stage: 'prod',
        host: 'https://able-group.d-velop.cloud',
        repositoryId: '16d943a8-4683-5ffb-b564-f3bf1903a967',
        documentCategory: 'ESMD',
        ivantiAPIKey: process.env.IVANTI_API_KEY_PROD,
        ivantiBaseURL: 'https://ablegroup.saasiteu.com',
        ivantiAttachmentURL: 'https://ablegroup.saasiteu.com/api/rest/Attachment?ID=',
        ivantiStatusURL: 'https://ablegroup.saasiteu.com/api/odata/businessobject/ServiceReqs',
        serviceUserAPIKey: process.env.SERVICE_USER_API_KEY_PROD,
        groupName: {
            rentalContract: 'BA_ECM_CS_IMMO',
            supplierContract: 'BA_ECM_CS_EINKAUF',
            customerContract: 'BA_LEGAL_DEPARTMENT',
            customerContractDefaultDocuments: 'BA_LEGAL_DEPARTMENT',
        },
        internalNumberPrefix: {
            XLEV: 'LEV',
            XLRV: 'LRV',
            XCASE: 'VG',
        },
        internalNumberRegEx: {
            XLEV: `LEV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XLRV: `LRV-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
            XCASE: `VG-${new Date().getFullYear()}-\\d\\d\\d\\d\\d`,
        },
        longFields: ['contractualRelation', 'targetBusiness', 'risks', 'notes', 'customizing', 'changes'],
        debugAssignees: ['F3CA1284-55C6-435F-9D7B-F2A60A256757', 'F6800838-724A-48BF-B9BF-952CC935741D'],
    };
    }
}

module.exports = {
    getLocalConfig,
};
