const axios = require('axios');

module.exports = async (task, contractID, options, config) => {
    const localTask = JSON.parse(JSON.stringify(task));
    const taskURL = `/task/tasks/${task.id}`;
    const HTTPOptions = options;
    HTTPOptions.url = `${config.host}${taskURL}`;
    HTTPOptions.method = 'patch';
    localTask.metadata.linkedContract.values[0] = contractID;
    HTTPOptions.data = {
        metadata: rebuildMetadata(localTask.metadata),
    };
    await axios(HTTPOptions);
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
