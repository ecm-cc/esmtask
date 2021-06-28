const axios = require('axios');

module.exports = async (isCompleted, serviceRequestID, postData, config) => {
    const ivantiOptions = {
        method: 'put',
        url: `${config.ivantiStatusURL}('${serviceRequestID}')`,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        //TODO: Change this for new CS values
        data: isCompleted ? getCompleteBody(postData) : getUpdateBody(postData),
    };
    await axios(ivantiOptions);
};

// TODO: Make this for CS as well
function getCompleteBody() {
    return {
        ECM_ExternalStatus_pmx: 90,
    };
}

// TODO: Make this for CS as well
function getUpdateBody(postData) {
    return {
        ECM_CaseID_pmx: postData.caseID,
        ECM_ExternalStatus_pmx: 10,
        ECM_Link_pmx: postData.link,
        ECM_Owner_pmx: postData.owner,
    };
}
