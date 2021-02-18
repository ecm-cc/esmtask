const axios = require('axios');

module.exports = async (task, contractID, options, config) => {
    const localTask = JSON.parse(JSON.stringify(task));
    const taskURL = `/task/tasks/${task.id}`;
    const httpOptions = JSON.parse(JSON.stringify(options));
    httpOptions.url = `${config.host}${taskURL}`;
    httpOptions.method = 'patch';
    localTask.metadata.linkedContract.values[0] = contractID;
    httpOptions.data = {
        metadata: rebuildMetadata(localTask.metadata),
    };
    await axios(httpOptions);
};

function rebuildMetadata(metadataJSON) {
    const metadataArray = [];
    Object.keys(metadataJSON).forEach((key) => {
        metadataArray.push({
            key,
            caption: metadataJSON[key].caption,
            values: metadataJSON[key].values,
        });
    });
    return metadataArray;
}
