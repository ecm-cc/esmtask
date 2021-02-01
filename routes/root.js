const express = require('express');

module.exports = (assetBasePath) => {
    const router = express.Router();

    router.get('/', (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
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
                });
            },
            default() {
                res.status(406).send('Not Acceptable');
            },
        });
    });
    return router;
};
