'use strict';
const normalizeName = require('./utils').normalizeName;
const formatLabels = require('./utils').formatLabels;

// Metric logger implementation
class LogMetric {
    constructor(options, client) {
        this.options = options;
        this.client = client;
    }

    increment(amount, labels) {
        labels = formatLabels(this.options, labels);
        this.client.increment(normalizeName(labels.join('.')), amount);
    }

    decrement(amount, labels) {
        labels = formatLabels(this.options, labels);
        this.client.decrement(normalizeName(labels.join('.')), amount);
    }

    observe(value, labels) {
        labels = formatLabels(this.options, labels);
        this.client.gauge(normalizeName(labels.join('.')), value);
    }

    gauge(amount, labels) {
        labels = formatLabels(this.options, labels);
        this.client.gauge(normalizeName(labels.join('.')), amount);
    }

    set(value, labels) {
        labels = formatLabels(this.options, labels);
        this.client.gauge(normalizeName(labels.join('.')), value);
    }

    timing(value, labels) {
        labels = formatLabels(this.options, labels);
        this.client.timing(normalizeName(labels.join('.')), value);
    }
}

module.exports = LogMetric;
