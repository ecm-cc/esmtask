function getLocalConfig(tenant) {
    switch (tenant) {
    // DEV
    case '14q': return {
        host: 'https://able-group-dev.d-velop.cloud',
    };
    // QAS
    case '197': return {
        host: 'https://able-group-qas.d-velop.cloud',
    };
    // Version
    case '1ha': return {
        host: 'https://able-group-version.d-velop.cloud',
    };
    // Default: PROD
    default: return {
        host: 'https://able-group.d-velop.cloud',
    };
    }
}

module.exports = {
    getLocalConfig,
};
