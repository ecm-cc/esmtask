const express = require('express');

module.exports = () => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        console.log(`TenantId:${req.tenantId}`);
        console.log(`SystemBaseUri:${req.systemBaseUri}`);
        res.sendStatus(200);
    });
    return router;
};
