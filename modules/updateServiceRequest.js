const axios = require('axios');

module.exports = async (isCompleted, serviceRequestID, postData, config, specialStatus = null) => {
    const ivantiOptions = {
        method: 'put',
        url: `${config.ivantiStatusURL}('${serviceRequestID}')`,
        headers: {
            Authorization: `rest_api_key=${config.ivantiAPIKey}`,
        },
        data: getRequestData(isCompleted, postData, specialStatus),
    };
    await axios(ivantiOptions);
};

function getRequestData(isCompleted, postData, specialStatus) {
    if (isCompleted) {
        return getCompleteBody(postData);
    }
    if (specialStatus === 'abort') {
        return getAbortBody(postData);
    }
    return getUpdateBody(postData);
}

function getCompleteBody(postData) {
    return {
        ECM_ExternalStatus_pmx: 90,
        ECM_AbortText_pmx: postData.abortText,
    };
}

function getAbortBody(postData) {
    return {
        ECM_ExternalStatus_pmx: 20,
        ECM_AbortText_pmx: postData.abortText,
    };
}

function getUpdateBody(postData) {
    return {
        ECM_CaseID_pmx: postData.internalNumber,
        ECM_ExternalStatus_pmx: 10,
        ECM_Link_pmx: postData.link,
        ECM_Owner_pmx: postData.owner,
    };
}
