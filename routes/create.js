const express = require('express');
const getHTTPOptions = require('@ablegroup/httpoptions');
const login = require('@ablegroup/login');
const createAttachments = require('../modules/createAttachments');
const createTask = require('../modules/createTask');
const configLoader = require('../global.config');

module.exports = () => {
    const router = express.Router();

    router.post('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        try {
            console.log('Starting request');
            const postData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            console.log('Request Payload: ', JSON.stringify(postData));
            const config = configLoader.getLocalConfig(req.tenantId);
            const options = getHTTPOptions();
            const authSessionId = await login(config.host, req.get('Authorization').split(' ')[1]);
            options.headers.Authorization = `Bearer ${authSessionId}`;
            await createAttachments(postData, config, options);
            await createTask(postData, config, options);
            console.log('Completion, sending Code 200');
            res.sendStatus(200);
        } catch (err) {
            console.error(err);
            console.log('Error, sending Code 500');
            res.sendStatus(500);
        }
    });
    return router;
};
