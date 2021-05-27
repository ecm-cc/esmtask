module.exports = (rax, httpOptions) => ({
    onRetryAttempt: (err) => {
        const cfg = rax.getConfig(err);
        console.log(`Retry #${cfg.currentRetryAttempt} on ${httpOptions.method} at ${httpOptions.url}`);
    },
    httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
    backoffType: 'static',
    retryDelay: 15000,
});
