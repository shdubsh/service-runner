'use strict';

const http = require('http');
const P = require('bluebird');

module.exports = (options) => {
    this.hitcounter = options.metrics.makeMetric({
        type: 'Gauge',
        name: 'simple_server.hitcount',
        prometheus: {
            name: 'hitcount',
            help: 'a hit counter'
        },
        labels: {
            keys: ['worker_id']
        }
    });

    const server = http.createServer((req, res) => {
        // supported interface
        this.hitcounter.increment(1, [options.config.worker_id]);
        // deprecated interface
        options.metrics.increment(`simple_server.deprecated_interface.worker_${options.config.worker_id}.hitcount`);
        res.end('ok\n');
    });
    return new P((resolve, reject) => {
        server.listen(options.config.port, 'localhost', (err) => {
            if (err) {
                return reject(err);
            }
            return resolve(server);
        });
    });
};
