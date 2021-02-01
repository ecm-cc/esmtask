const axios = require('axios');

module.exports = async (correlationKey, options, config) => {
    const optionsHTTP = options;
    optionsHTTP.method = 'POST';
    optionsHTTP.url = `${config.host}/task/tasks/search`;
    optionsHTTP.data = {
        includeMetadata: true,
        orderColumn: 'subject',
        orderDir: 1,
        resultsPerPage: 200,
        searchParam: '', // TODO
    };
    const allTasks = await axios(optionsHTTP);
    // Reason: d.3 Syntax
    // eslint-disable-next-line no-underscore-dangle
    return allTasks.data._embedded.tasks.find((task) => task.correlationKey === correlationKey);
};
