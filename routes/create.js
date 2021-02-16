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
            const postData = req.body;
            const config = configLoader.getLocalConfig(req.tenantId);
            const options = getHTTPOptions();
            const authSessionId = await login(config.host, req.get('Authorization').split(' ')[1]);
            options.headers.Authorization = `Bearer ${authSessionId}`;
            await createAttachments(postData, config, options);
            await createTask(postData, config, options);
            res.sendStatus(200);
        } catch (err) {
            console.error(err);
            res.status(500).send(err.response ? err.response.data : err);
        }
    });
    return router;
};
