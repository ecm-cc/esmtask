const express = require('express');
const getHTTPOptions = require('@ablegroup/httpoptions');
const loadTask = require('../modules/loadTask');
const updateServiceRequest = require('../modules/updateServiceRequest');
const util = require('../modules/taskRouteUtils');
const configLoader = require('../global.config');

module.exports = (assetBasePath) => {
    const router = express.Router();

    // Task UI
    router.get('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        const config = configLoader.getLocalConfig(req.tenantId);
        const { taskID } = req.query;
        const type = req.query.type || '';
        let options;
        let task;
        let metaData;
        if (type === 'task') {
            options = getHTTPOptions(req);
            task = await loadTask(taskID, options, config);
            metaData = await util.getMetaData(task, assetBasePath, config);
        }
        res.format({
            'application/hal+json': () => {
                res.send({
                });
            },
            'text/html': () => {
                if (type === '') {
                    res.render('loading', {
                        title: 'Lädt..',
                        stylesheet: `${assetBasePath}/global.css`,
                        script: `${assetBasePath}/loading.js`,
                        body: '/../views/loading.hbs',
                        taskID,
                    });
                } else if (task.metadata.linkedContract.values[0] === '0') {
                    res.render('task', {
                        title: task.subject,
                        stylesheet: `${assetBasePath}/global.css`,
                        script: `${assetBasePath}/task.js`,
                        fontawesome: `${assetBasePath}/fontawesome.js`,
                        body: '/../views/task.hbs',
                        task,
                        subject: task.subject,
                        taskString: JSON.stringify(task),
                        metaData: JSON.stringify(metaData),
                    });
                } else {
                    res.render('succeded', {
                        title: task.subject,
                        stylesheet: `${assetBasePath}/global.css`,
                        script: `${assetBasePath}/succeded.js`,
                        body: '/../views/succeded.hbs',
                        subject: task.subject,
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
            const { type } = req.query;
            const { taskID } = req.query;
            const documentProperties = postData.documentProperties ? JSON.parse(postData.documentProperties) : null;
            const dossierID = await util.createDossier(postData, options, config, type);
            await util.attachDossier(taskID, dossierID, type, documentProperties, postData.esmLink, options, config);
            res.status(200).send('OK');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                console.error(err.response.data.message);
            }
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
            const postData = req.body;
            const documentProperties = postData.documentProperties ? JSON.parse(postData.documentProperties) : null;
            const { type } = req.query;
            const { dossierID } = req.query;
            const { taskID } = req.query;
            await util.attachDossier(taskID, dossierID, type, documentProperties, postData.esmLink, options, config);
            res.status(200).send('OK');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                console.error(err.response.data.message);
            }
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
            if (!util.isDebug(task)) {
                await updateServiceRequest(true, task.metadata.serviceRequestTechnicalID.values[0], null, config);
            }
            res.status(200).send({});
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                console.error(err.response.data.message);
            }
            console.error(err);
            res.status(400).send(err.response.data ? err.response.data : err);
        }
    });
    return router;
};
