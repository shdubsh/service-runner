'use strict';

// A small utility to send a delta given a startTime
const timingMixin = {
    endTiming(names, startTime, samplingInterval) {
        return this.timing(names, Date.now() - startTime, samplingInterval);
    }
};

const nameCache = new Map();

function normalizeName(name) {
    // See https://github.com/etsy/statsd/issues/110
    // Only [\w_.-] allowed, with '.' being the hierarchy separator.
    let res = nameCache.get(name);
    if (res) {
        return res;
    } else {
        res = name.replace(/[^/a-zA-Z0-9.-]/g, '-').replace(/\//g, '_');
        nameCache.set(name, res);
        return res;
    }
}

// Flattens labels with their keys
function zipLabels(options, labels) {
    if (options.omitLabelNames) {
        return labels;
    }
    const output = [];
    for (let i = 0; i < labels.length; i++) {
        output.push(options.labels.keys[i]);
        output.push(labels[i] || undefined);
    }
    return output;
}

// Formats label set with metric name
function formatLabels(options, labels) {
    if (options.labels.keys) {
        labels = zipLabels(options, labels);
        if (options.labels.labelPosition === 'before') {
            labels.push(options.name);
        } else {
            labels.unshift(options.name);
        }
    }
    return labels;
}

module.exports.timingMixin = timingMixin;
module.exports.normalizeName = normalizeName;
module.exports.formatLabels = formatLabels;
