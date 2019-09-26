'use strict';

const PrometheusClient = require('./clients/prometheus');
const StatsDClient = require('./clients/statsd');
const LogClient = require('./clients/log');
const Metric = require('./metric');
const normalizeName = require('./utils').normalizeName;

const SUPPORTED_CLIENTS = {
    PROMETHEUS: 'prometheus',
    STATSD: 'statsd',
    LOG: 'log'
};

const DEPRECATED_METHODS = ['timing', 'increment', 'decrement', 'gauge', 'unique'];

class Metrics {
    constructor(options, logger) {
        this.logger = logger;
        this.cache = new Map();
        this.clients = [];
        options.forEach((o) => {
            if (o.type === SUPPORTED_CLIENTS.PROMETHEUS) {
                this.clients.push(new PrometheusClient(o, this.logger));
            }
            if (o.type === SUPPORTED_CLIENTS.STATSD) {
                this.clients.push(new StatsDClient(o, this.logger));
            }
            if (o.type === SUPPORTED_CLIENTS.LOG) {
                o.methods = DEPRECATED_METHODS;
                this.clients.push(new LogClient(o, this.logger));
            }
        });
    }

    fetchClient(name) {
        return this.clients.find((client) => {
            return client.constructor.name === name;
        });
    }

// Example Options:
// {
//     type: 'Counter',
//     name: 'hitcount',
//     prometheus: {
//         name: 'hitcount',
//         help: 'hit count',
//         buckets: [], // https://github.com/siimon/prom-client#histogram
//         percentiles: [], // https://github.com/siimon/prom-client#summary
//     },
//     labels: {
//         keys: [],
//         labelPosition: 'before',
//         omitLabelNames: false
//     }
// }
    makeMetric(options) {
        const metric = new Metric(this.clients, this.logger, options);
        this.cache.set(options.name, metric);
        return metric;
    }

    fetchMetric(name) {
        return this.cache.get(name);
    }

    close() {
        this.clients.some((o) => o.close());
        this.clients = [];
    }
}

// To preserve backwards compatibility, a subset of statsd and log clients
// methods are mapped into the proxy interface and a warning logged.
// Also log attempts to use unknown/unmapped functions.
// Example Options:
// [
//     {
//         type: 'log',
//         name: 'service-runner'
//     },
//     {
//         type: 'statsd',
//         host: 'localhost',
//         port: '8125',
//         name: 'service-runner'
//     },
//     {
//         type: 'prometheus',
//         port: 9000,
//         name: 'service-runner'
//     }
// ]
function makeMetrics(options, logger) {
    const metrics = new Metrics(options, logger);
    const handler = {
        get: function (target, prop) {
            if (target[prop] === undefined) {
                logger.log('error/metrics', `No such method '${prop.toString()}' in Metrics`);
                return function () {};
            } else {
                return target[prop];
            }
        }
    };
    const proxy = new Proxy(metrics, handler);

    // The metrics interface exposed the statsd clients directly
    // and many dependent applications use these functions directly.
    // Build up a backwards-compatible interface by mapping these functions
    // to the Metrics proxy instance and warn on deprecated usage.
    DEPRECATED_METHODS.forEach((o) => {
        proxy[o] = function (...args) {
            logger.log('warn/metrics', `Calling 'Metrics.${o}' directly is deprecated.`);
            metrics.clients.forEach((client) => {
                if (client.constructor.name !== 'PrometheusClient') {
                    client.client[o].apply(client.client, args);
                }
            });
        };
    });

    // Deprecated.
    // Support creating sub-metric clients with a fixed prefix. This is useful
    // for systematically categorizing metrics per-request, by using a
    // specific logger.  WARNING: if both Log and StatsD are configured, only
    // one will be returned.
    proxy.makeChild = function (name) {
        this.logger.log('warn/metrics', 'makeChild() is deprecated.');
        for (const client of this.clients) {
            if (client.constructor.name !== 'PrometheusClient') {
                const child = client.childClient();
                child.prefix = `${client.client.prefix}${normalizeName(name)}.`;
                child.normalizeName = normalizeName;
                return child;
            }
        }
    };

    return proxy;
}

module.exports = makeMetrics;
