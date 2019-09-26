'use strict';

const timingMixin = require('../utils').timingMixin;
const LogMetric = require('../log');

// A simple console reporter. Useful for development.
class LogClient {
    constructor(options, logger) {
        this._logger = logger;
        this._serviceName = options.name ? `${options.name}.` : 'service-runner.';
        this.methods = options.methods;
        // For compatibility with hot-shots this will be set externally by makeChild
        this.prefix = this._serviceName;
        this.methods.forEach((method) => {
            this[method] = (name, value, samplingInterval) => {
                name = this.prefix + name;
                logger.log('trace/metrics', {
                    message: [method, name, value].join(':'),
                    method,
                    name,
                    value,
                    samplingInterval
                });
            };
        });

        this.client = this;
    }

    childClient() {
        return new LogClient({ name: this._serviceName, methods: this.methods }, this._logger);
    }

    makeMetric(options) {
        return new LogMetric(options, this.client);
    }

    close() {}
}

Object.assign(LogClient.prototype, timingMixin);

module.exports = LogClient;
