function getLocalConfig(tenant) {
    switch (tenant) {
    // DEV
    case '14q': return {
    };
    // QAS
    case '197': return {
    };
    // Version
    case '1ha': return {
    };
    // Default: PROD
    default: return {
    };
    }
}

module.exports = {
    getLocalConfig,
};
