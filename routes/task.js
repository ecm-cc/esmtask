const express = require('express');
const getHTTPOptions = require('@ablegroup/httpoptions');
const propertyMapping = require('@ablegroup/propertymapping');
const loadTask = require('../modules/loadTask');
const moveDocuments = require('../modules/moveDocuments');
const setTaskState = require('../modules/setTaskState');
const configLoader = require('../global.config');

module.exports = (assetBasePath) => {
    const router = express.Router();

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
            },
            default() {
                res.status(406).send('Not Acceptable');
            },
        });
    });

    router.put('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        const config = configLoader.getLocalConfig(req.tenantId);
        const options = getHTTPOptions(req);
        const { contract } = req.query;
        const { taskID } = req.query;
        const task = await loadTask(taskID, options, config);
        const documentURL = await getDocumentURL(task, config);
        await moveDocuments(contract, documentURL, options, config);
        await setTaskState(task, options, config);
        res.sendStatus(200);
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
    return {
        keys: {
            generalContractCategory: generalContractCategory.categoryKey,
            singleContractCategory: singleContractCategory.categoryKey,
            contractNumberInternal,
            contractDesignation,
        },
        documentURL: await getDocumentURL(task, config),
        config,
    };
}

async function getDocumentURL(task, config) {
    const esmDocumentCategory = await propertyMapping.getCategory(config.stage, null, null, 'ESM-Dokumente');
    const esmDocumentProperties = await propertyMapping.getPropertiesByCategory(config.stage, esmDocumentCategory.categoryID);
    const technicalIDProperty = esmDocumentProperties.find((property) => property.displayname === 'ESM techn. ID').propertyKey;
    const technicalID = task.metadata.serviceRequestTechnicalID.values[0];
    const searchHost = `${config.host}/dms/r/${config.repositoryId}/sr/?objectdefinitionids=`;
    const searchParams = `%5B%22${esmDocumentCategory.categoryKey}%22%5D&properties=%7B"${technicalIDProperty}"%3A%5B"${technicalID}"%5D%7D`;
    return searchHost + searchParams;
}
