'use strict';

// Prometheus metrics implementation
class PrometheusMetric {
    constructor(options, client) {
        this.client = client;
        this.metric = new this.client[options.type]({
            name: options.prometheus.name,
            help: options.prometheus.help,
            labelNames: options.labels.keys,
            buckets: options.prometheus.buckets,
            percentiles: options.prometheus.percentiles
        });
    }

    increment(amount, labels) {
        this.metric
            .labels
            .apply(this.metric, labels)
            .inc(amount);
    }

    decrement(amount, labels) {
        this.metric
            .labels
            .apply(this.metric, labels)
            .dec(amount);
    }

    observe(value, labels) {
        this.metric
            .labels
            .apply(this.metric, labels)
            .observe(value);
    }

    gauge(amount, labels) {
        if (amount < 0) {
            this.metric
                .labels
                .apply(this.metric, labels)
                .dec(Math.abs(amount));
        } else {
            this.metric
                .labels
                .apply(this.metric, labels)
                .inc(amount);
        }
    }

    set(value, labels) {
        this.metric
            .labels
            .apply(this.metric, labels)
            .set(value);
    }

    timing(value, labels) {
        this.metric
            .labels
            .apply(this.metric, labels)
            .set(value);
    }
}

module.exports = PrometheusMetric;
