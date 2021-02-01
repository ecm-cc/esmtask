const express = require('express');
const getHTTPOptions = require('@ablegroup/httpoptions');
const loadTask = require('../modules/loadTask');
const configLoader = require('../global.config');

module.exports = (assetBasePath) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        const config = configLoader.getLocalConfig(req.tenantId);
        const { correlationKey } = req.query;
        const options = getHTTPOptions(req);
        const task = await loadTask(correlationKey, options, config);
        console.log(task);
        res.format({
            'application/hal+json': () => {
                res.send({
                });
            },
            'text/html': () => {
                res.render('root', {
                    title: 'ESM Aufgabe',
                    stylesheet: `${assetBasePath}/global.css`,
                    script: `${assetBasePath}/root.js`,
                    body: '/../views/root.hbs',
                    task,
                });
            },
            default() {
                res.status(406).send('Not Acceptable');
            },
        });
    });
    return router;
};
