// const axios = require('axios');

module.exports = async (serviceRequestID, config) => {
    const ivantiOptions = {
        method: 'put',
        url: `${config.ivantiStatusURL}('${serviceRequestID}')`,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        body: {
            ECM_CaseID_pmx: '',
            ECM_ExternalStatus_pmx: 'aa',
            ECM_Link_pmx: '',
            ECM_Owner_pmx: '',
        },
    };
    // TODO: Right URL and body
    // await axios(ivantiOptions);
    console.log(ivantiOptions);
};
