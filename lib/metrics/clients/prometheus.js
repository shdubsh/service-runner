'use strict';

const Prometheus = require('prom-client');
const PrometheusMetric = require('../prometheus');

class PrometheusClient {
    constructor(options, logger) {
        this.options = options;
        this.logger = logger;
        this.client = Prometheus;
    }

    makeMetric(options) {
        return new PrometheusMetric(options, this.client);
    }

    close() {}
}

module.exports = PrometheusClient;
