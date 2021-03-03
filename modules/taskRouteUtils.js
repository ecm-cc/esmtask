const axios = require('axios');
const propertyMapping = require('@ablegroup/propertymapping');
const moveDocuments = require('./moveDocuments');
const setTaskState = require('./setTaskState');
const createContract = require('./createContract');
const createCase = require('./createCase');
const loadTask = require('./loadTask');
const updateServiceRequest = require('./updateServiceRequest');

function isDebug(task) {
    return task.metadata.isDebug && task.metadata.isDebug.values[0] && (task.metadata.isDebug.values[0] === 'true' || task.metadata.isDebug.values[0] === true);
}

async function getMetaData(task, assetBasePath, config) {
    propertyMapping.initDatabase();
    const generalContractCategory = await propertyMapping.getCategory(config.stage, null, null, 'Lieferanten IND - Rahmenvertrag');
    const singleContractCategory = await propertyMapping.getCategory(config.stage, null, null, 'Lieferanten IND - Einzelvertrag');
    const contractProperties = await propertyMapping.getPropertiesByCategory(config.stage, generalContractCategory.categoryID);
    const contractNumberInternal = contractProperties.find((property) => property.displayname === 'Vertragsnummer (intern)').propertyKey;
    const contractDesignation = contractProperties.find((property) => property.displayname === 'Vertragsbezeichnung').propertyKey;
    const contractStatus = contractProperties.find((property) => property.displayname === 'Vertragsstatus').propertyKey;
    const contractType = contractProperties.find((property) => property.displayname === 'Vertragstyp Lieferant').propertyKey;
    const partnerName = contractProperties.find((property) => property.displayname === 'Geschäftspartnername').propertyKey;
    const caseCategory = await propertyMapping.getCategory(config.stage, null, null, 'Legal - Vorgangsakte');
    const caseProperties = await propertyMapping.getPropertiesByCategory(config.stage, caseCategory.categoryID);
    const caseNumberInternal = caseProperties.find((property) => property.displayname === 'Vorgangsnummer (intern)').propertyKey;
    const caseDesignation = caseProperties.find((property) => property.displayname === 'Vorgangsbezeichnung').propertyKey;
    const caseStatus = caseProperties.find((property) => property.displayname === 'Vorgangsstatus').propertyKey;
    const caseType = caseProperties.find((property) => property.displayname === 'Vorgangstyp').propertyKey;
    const caseContractType = caseProperties.find((property) => property.displayname === 'Vertragstyp').propertyKey;
    const organisationUnit = caseProperties.find((property) => property.displayname === 'Organisationseinheit').propertyKey;
    return {
        keys: {
            generalContractCategory: generalContractCategory.categoryKey,
            singleContractCategory: singleContractCategory.categoryKey,
            caseCategory: caseCategory.categoryKey,
            contractNumberInternal,
            contractDesignation,
            contractStatus,
            contractType,
            partnerName,
            caseNumberInternal,
            caseDesignation,
            caseStatus,
            caseType,
            caseContractType,
            organisationUnit,
        },
        documentURL: await getDocumentURL(task, config),
        assetBasePath,
        config,
    };
}

async function getDocumentURL(task, config) {
    propertyMapping.initDatabase();
    const esmDocumentCategory = await propertyMapping.getCategory(config.stage, null, null, 'ESM-Dokumente');
    const esmDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, esmDocumentCategory.categoryID);
    const technicalIDProperty = esmDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey;
    const technicalID = task.metadata.serviceRequestTechnicalID.values[0];
    const searchHost = `${config.host}/dms/r/${config.repositoryId}/sr/?objectdefinitionids=`;
    const searchParams = `%5B%22${esmDocumentCategory.categoryKey}%22%5D&properties=%7B"${technicalIDProperty}"%3A%5B"${technicalID}"%5D%7D`;
    return searchHost + searchParams;
}

async function getIvantiBody(contractID, config, options, type) {
    return {
        link: `${config.host}/dms/r/${config.repositoryId}/o2/${contractID}`,
        caseID: await getCaseNumber(contractID, config, options, type),
        owner: await getCurrentUserUPN(config, options),
    };
}

async function getCaseNumber(contractID, config, options, type) {
    let caseNumber = '';
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${contractID}`;
    const response = await axios(httpOptions);
    propertyMapping.initDatabase();
    const category = await propertyMapping.getCategory(config.stage, null, null, response.data.category);
    const properties = await propertyMapping.getPropertiesByCategory(config.stage, category.categoryID);
    let caseNumberProperty;
    if (type === 'contract') {
        caseNumberProperty = properties.find((prop) => prop.displayname === 'Vertragsnummer (intern)');
    } else {
        caseNumberProperty = properties.find((prop) => prop.displayname === 'Vorgangsnummer (intern)');
    }
    response.data.objectProperties.forEach((prop) => {
        if (prop.id === caseNumberProperty.propertyKey.toString()) {
            caseNumber = prop.value;
        }
    });
    return caseNumber;
}

async function getCurrentUserUPN(config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/validate`;
    const response = await axios(httpOptions);
    return response.data.userName;
}

async function createDossier(postData, options, config, type) {
    let dossierID;
    if (type === 'contract') {
        dossierID = await createContract(postData, options, config);
    } else {
        dossierID = await createCase(postData, options, config);
    }
    return dossierID;
}

async function attachDossier(taskID, dossierID, type, options, config) {
    const task = await loadTask(taskID, options, config);
    const documentURL = await getDocumentURL(task, config);
    await moveDocuments(dossierID, documentURL, options, config, type);
    if (!isDebug(task)) {
        const ivantiBody = await getIvantiBody(dossierID, config, options, type);
        await updateServiceRequest(false, task.metadata.serviceRequestTechnicalID.values[0], ivantiBody, config, options);
    }
    await setTaskState(task, dossierID, options, config);
}

module.exports = {
    isDebug,
    getMetaData,
    getDocumentURL,
    getIvantiBody,
    getCaseNumber,
    getCurrentUserUPN,
    createDossier,
    attachDossier,
};
