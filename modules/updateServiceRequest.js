// const axios = require('axios');

module.exports = async (isCompleted, serviceRequestID, postData, config) => {
    const ivantiOptions = {
        method: 'put',
        url: `${config.ivantiStatusURL}('${serviceRequestID}')`,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        body: isCompleted ? getCompleteBody(postData) : getUpdateBody(postData),
    };
    // TODO: Right URL and body
    // await axios(ivantiOptions);
    console.log(ivantiOptions);
};

function getCompleteBody() {
    return {
        ECM_ExternalStatus_pmx: 'Finished', // TODO
    };
}

function getUpdateBody(postData) {
    return {
        ECM_CaseID_pmx: postData.caseID,
        ECM_ExternalStatus_pmx: 'Active', // TODO
        ECM_Link_pmx: postData.link,
        ECM_Owner_pmx: postData.owner,
    };
}
