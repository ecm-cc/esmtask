const axios = require('axios');

module.exports = async (postData, config, options) => {
    const userID = await getUserID(postData.serviceRequestorUPN, config, options);
    const taskJSON = await buildTaskJSON(postData, userID, config, options);
    const taskURL = await createTask(taskJSON, config, options);
    await changeTaskID(taskURL, config, options);
};

async function buildTaskJSON(postData, userID, config, options) {
    const task = {};
    task.subject = postData.serviceRequestTitle;
    const commentsField = postData.form.find((field) => field.key === 'comments');
    const notesField = postData.form.find((field) => field.key === 'notes');
    task.description = commentsField ? (commentsField.values[0] || '') : (notesField.values[0] || '');
    task.assignees = await getAssignedGroup(postData.contractType, postData.isDebug, config, options);
    task.correlationKey = `esm_${postData.serviceRequestTechnicalID}_${Date.now()}`;
    task.sender = userID;
    task.retentionTime = 'P365D';
    task.metadata = postData.form.map((form) => ({
        key: form.key,
        caption: form.caption,
        values: form.values[0] ? form.values : [''],
    }));
    task.metadata.push({
        key: 'contractType',
        caption: 'Vertragsart',
        values: [postData.contractType || ''],
    });
    task.metadata.push({
        key: 'serviceRequestTechnicalID',
        caption: 'Techn. Service Request ID',
        values: [postData.serviceRequestTechnicalID || ''],
    });
    task.metadata.push({
        key: 'serviceRequestID',
        caption: 'Service Request ID',
        values: [postData.serviceRequestID || ''],
    });
    task.metadata.push({
        key: 'linkedContract',
        caption: 'Verknüpfter Vertrag',
        values: [0],
    });
    task.metadata.push({
        key: 'isDebug',
        caption: 'Testaufgabe',
        values: [postData.isDebug || false],
    });
    // Reason: d.velop API
    // eslint-disable-next-line no-underscore-dangle
    task._links = {
        form: { href: '/able-esmtask/task' },
    };
    return task;
}

async function getUserID(userUPN, config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/scim/users`;
    const userSCIM = await axios(httpOptions);
    const userID = userSCIM.data.resources.find((user) => user.userName.toLowerCase() === userUPN.toLowerCase()).id;
    return userID;
}

async function createTask(data, config, options) {
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/task/tasks`;
    httpOptions.method = 'post';
    httpOptions.data = data;
    const response = await axios(httpOptions);
    return response.headers.location;
}

async function changeTaskID(taskURL, config, options) {
    const taskID = taskURL.split('/tasks/')[1];
    console.log(`Creating task ${taskID}`);
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}${taskURL}`;
    httpOptions.method = 'patch';
    httpOptions.data = {
        _links: {
            form: { href: `/able-esmtask/task?taskID=${taskID}` },
        },
    };
    await axios(httpOptions);
}

async function getAssignedGroup(contractType, isDebug, config, options) {
    if (isDebug) {
        return config.debugAssignees;
    }
    const groupName = config.groupName[contractType];
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}/identityprovider/scim/groups`;
    const response = await axios(httpOptions);
    const groupID = response.data.resources.find((group) => group.displayName === groupName).id;
    return [groupID];
}
