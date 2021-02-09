const axios = require('axios');

module.exports = async (taskID, options, config) => {
    const optionsHTTP = options;
    optionsHTTP.method = 'GET';
    optionsHTTP.url = `${config.host}/task/tasks/${taskID}`;
    const task = await axios(optionsHTTP);
    return convertMetadataToJSON(task.data);
};

function convertMetadataToJSON(task) {
    const newMetaData = {};
    const taskCopy = task;
    task.metadata.forEach((meta) => {
        newMetaData[meta.key] = meta;
    });
    taskCopy.metadata = newMetaData;
    return taskCopy;
}
