const axios = require('axios');

module.exports = async (postData, config, options) => {
    const taskJSON = buildTaskJSON(postData);
    const taskURL = await createTask(taskJSON, config, options);
    await changeTaskID(taskURL, config, options);
};

function buildTaskJSON(postData) {
    const task = {};
    task.subject = postData.serviceRequestTitle;
    const commentsField = postData.form.find((field) => field.key === 'comments');
    task.description = commentsField.values[0] || '';
    task.assignees = ['E6140B53-FF0D-4AA2-8F3B-79962F85EB61']; // TODO
    task.correlationKey = `esm_${postData.serviceRequestTechnicalID}_${Date.now()}`;
    task.metadata = postData.form;
    task.metadata.push({
        key: 'contractType',
        caption: 'Vertragsart',
        values: [postData.contractType],
    });
    // Reason: d.velop API
    // eslint-disable-next-line no-underscore-dangle
    task._links = {
        form: { href: '/able-esmtask/task' },
    };
    return task;
}

async function createTask(data, config, options) {
    const HTTPOptions = options;
    HTTPOptions.url = `${config.host}/task/tasks`;
    HTTPOptions.method = 'post';
    HTTPOptions.data = data;
    const response = await axios(HTTPOptions);
    return response.headers.location;
}

async function changeTaskID(taskURL, config, options) {
    const taskID = taskURL.split('/tasks/')[1];
    const HTTPOptions = options;
    HTTPOptions.url = `${config.host}${taskURL}`;
    HTTPOptions.method = 'patch';
    HTTPOptions.data = {
        _links: {
            form: { href: `/able-esmtask/task?taskID=${taskID}` },
        },
    };
    await axios(HTTPOptions);
}
