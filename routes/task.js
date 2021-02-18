const express = require('express');
const getHTTPOptions = require('@ablegroup/httpoptions');
const propertyMapping = require('@ablegroup/propertymapping');
const { default: axios } = require('axios');
const loadTask = require('../modules/loadTask');
const moveDocuments = require('../modules/moveDocuments');
const setTaskState = require('../modules/setTaskState');
const createContract = require('../modules/createContract');
const updateServiceRequest = require('../modules/updateServiceRequest');
const configLoader = require('../global.config');

module.exports = (assetBasePath) => {
    const router = express.Router();

    // Task UI
    router.get('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        const config = configLoader.getLocalConfig(req.tenantId);
        const { taskID } = req.query;
        const options = getHTTPOptions(req);
        const task = await loadTask(taskID, options, config);
        const metaData = await getMetaData(task, config);
        res.format({
            'application/hal+json': () => {
                res.send({
                });
            },
            'text/html': () => {
                if (task.metadata.linkedContract.values[0] === '0') {
                    res.render('task', {
                        title: task.subject,
                        stylesheet: `${assetBasePath}/global.css`,
                        script: `${assetBasePath}/task.js`,
                        fontawesome: `${assetBasePath}/fontawesome.js`,
                        body: '/../views/task.hbs',
                        task,
                        taskString: JSON.stringify(task),
                        metaData: JSON.stringify(metaData),
                    });
                } else {
                    res.render('succeded', {
                        title: task.subject,
                        stylesheet: `${assetBasePath}/global.css`,
                        script: `${assetBasePath}/succeded.js`,
                        body: '/../views/succeded.hbs',
                        task,
                        taskString: JSON.stringify(task),
                        metaData: JSON.stringify(metaData),
                    });
                }
            },
            default() {
                res.status(406).send('Not Acceptable');
            },
        });
    });

    // Create new contract and attach documents
    router.post('/', async (req, res) => {
        try {
            console.log(`TenantId:${req.tenantId}`);
            console.log(`SystemBaseUri:${req.systemBaseUri}`);
            const config = configLoader.getLocalConfig(req.tenantId);
            const options = getHTTPOptions(req);
            const postData = req.body;
            const { taskID } = req.query;
            const task = await loadTask(taskID, options, config);
            const documentURL = await getDocumentURL(task, config);
            const contractID = await createContract(postData, options, config);
            await moveDocuments(contractID, documentURL, options, config);
            const ivantiBody = await getIvantiBody(contractID, config, options);
            await updateServiceRequest(false, task.metadata.serviceRequestTechnicalID.values[0], ivantiBody, config, options);
            await setTaskState(task, contractID, options, config);
            res.status(200).send('OK');
        } catch (err) {
            console.error(err);
            res.status(400).send(err.response ? err.response.data : err);
        }
    });

    // Attach documents to existing contract
    router.put('/', async (req, res) => {
        try {
            console.log(`TenantId:${req.tenantId}`);
            console.log(`SystemBaseUri:${req.systemBaseUri}`);
            const config = configLoader.getLocalConfig(req.tenantId);
            const options = getHTTPOptions(req);
            const { contract } = req.query;
            const { taskID } = req.query;
            const task = await loadTask(taskID, options, config);
            const documentURL = await getDocumentURL(task, config);
            await moveDocuments(contract, documentURL, options, config);
            const ivantiBody = await getIvantiBody(contract, config, options);
            await updateServiceRequest(false, task.metadata.serviceRequestTechnicalID.values[0], ivantiBody, config, options);
            await setTaskState(task, contract, options, config);
            res.status(200).send('OK');
        } catch (err) {
            console.error(err);
            res.status(400).send(err.response.data ? err.response.data : err);
        }
    });

    // Complete task
    router.delete('/', async (req, res) => {
        try {
            console.log(`TenantId:${req.tenantId}`);
            console.log(`SystemBaseUri:${req.systemBaseUri}`);
            const config = configLoader.getLocalConfig(req.tenantId);
            const options = getHTTPOptions(req);
            const { taskID } = req.query;
            const task = await loadTask(taskID, options, config);
            await updateServiceRequest(true, task.metadata.serviceRequestTechnicalID.values[0], null, config);
            res.status(200).send({});
        } catch (err) {
            console.error(err);
            res.status(400).send(err.response.data ? err.response.data : err);
        }
    });
    return router;
};

async function getMetaData(task, config) {
    propertyMapping.initDatabase();
    const generalContractCategory = await propertyMapping.getCategory(config.stage, null, null, 'Lieferanten IND - Rahmenvertrag');
    const singleContractCategory = await propertyMapping.getCategory(config.stage, null, null, 'Lieferanten IND - Einzelvertrag');
    const contractProperties = await propertyMapping.getPropertiesByCategory(config.stage, generalContractCategory.categoryID);
    const contractNumberInternal = contractProperties.find((property) => property.displayname === 'Vertragsnummer (intern)').propertyKey;
    const contractDesignation = contractProperties.find((property) => property.displayname === 'Vertragsbezeichnung').propertyKey;
    const contractStatus = contractProperties.find((property) => property.displayname === 'Vertragsstatus').propertyKey;
    const contractType = contractProperties.find((property) => property.displayname === 'Vertragstyp Lieferant').propertyKey;
    const partnerName = contractProperties.find((property) => property.displayname === 'Geschäftspartnername').propertyKey;
    return {
        keys: {
            generalContractCategory: generalContractCategory.categoryKey,
            singleContractCategory: singleContractCategory.categoryKey,
            contractNumberInternal,
            contractDesignation,
            contractStatus,
            contractType,
            partnerName,
        },
        documentURL: await getDocumentURL(task, config),
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

async function getIvantiBody(contractID, config, options) {
    return {
        link: `${config.host}/dms/r/${config.repositoryId}/o2/${contractID}`,
        caseID: await getCaseNumber(contractID, config, options),
        owner: await getCurrentUserUPN(config, options),
    };
}

async function getCaseNumber(contractID, config, options) {
    let caseNumber = '';
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/dms/r/${config.repositoryId}/o2/${contractID}`;
    const response = await axios(httpOptions);
    propertyMapping.initDatabase();
    const category = await propertyMapping.getCategory(config.stage, null, null, response.data.category);
    const properties = await propertyMapping.getPropertiesByCategory(config.stage, category.categoryID);
    const caseNumberProperty = properties.find((prop) => prop.displayname === 'Vertragsnummer (intern)');
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
