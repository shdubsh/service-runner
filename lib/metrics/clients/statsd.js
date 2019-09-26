'use strict';

const StatsD = require('hot-shots');
const timingMixin = require('../utils').timingMixin;
const normalizeName = require('../utils').normalizeName;
const StatsDMetric = require('../statsd');

/**
 * Maximum size of a metrics batch used by default.
 *
 * @const
 * @type {number}
 */
const DEFAULT_MAX_BATCH_SIZE = 1450;

class StatsDClient {
    constructor(options, logger) {
        this.logger = logger;
        const srvName = options._prefix ? options._prefix : normalizeName(options.name);
        const statsdOptions = {
            host: options.host,
            port: options.port,
            prefix: `${srvName}.`,
            suffix: '',
            globalize: false,
            cacheDns: false,
            mock: false
        };

        // Batch metrics unless `batch` option is `false`
        if (typeof options.batch !== 'boolean' || options.batch) {
            options.batch = options.batch || {};
            statsdOptions.maxBufferSize = options.batch.max_size || DEFAULT_MAX_BATCH_SIZE;
            statsdOptions.bufferFlushInterval = options.batch.max_delay || 1000;
        }
        this.client = new StatsD(statsdOptions);
        this.client.normalizeName = normalizeName;
    }

    childClient() {
        return this.client.childClient();
    }

    makeMetric(options) {
        return new StatsDMetric(options, this.client);
    }

    close() {
        this.client.close();
    }
}

// Also add a small utility to send a delta given a startTime
Object.assign(StatsD.prototype, timingMixin);

module.exports = StatsDClient;
