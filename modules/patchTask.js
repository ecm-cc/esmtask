const axios = require('axios');
const login = require('@ablegroup/login');

module.exports = async (task, abortText, options, config) => {
    const localTask = JSON.parse(JSON.stringify(task));
    const taskURL = `/task/tasks/${task.id}`;
    const httpOptions = JSON.parse(JSON.stringify(options));
    const authSessionId = await login(config.host, config.serviceUserAPIKey);
    httpOptions.headers.Authorization = `Bearer ${authSessionId}`;
    delete httpOptions.headers.Cookie;
    httpOptions.url = `${config.host}${taskURL}`;
    httpOptions.method = 'patch';

    localTask.metadata.patchState = { caption: 'Patchstatus', values: ['patched'] };
    localTask.metadata.abortText = { caption: 'Nachricht an Ersteller', values: [abortText] };

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
