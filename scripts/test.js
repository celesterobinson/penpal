#!/usr/bin/env node
'use strict';

const path = require('path');
const http = require('http');
const connect = require('connect');
const KarmaServer = require('karma').Server;
const serveStatic = require('serve-static');
const argv = require('yargs').argv;
const rollup = require('rollup');
const config = require('../rollup.config');

const serveChildViews = () => {
  // We'll run the child iframe on a different port from karma to
  // to properly test cross-domain iframe communication
  const childViewsApp = connect()
    .use(serveStatic(path.join(__dirname, '../node_modules/rsvp/dist')))
    .use(serveStatic('dist'))
    .use(serveStatic('test/fixtures'));

  http.createServer(childViewsApp).listen(9000);
};

const runTests = () => {
  new KarmaServer({
    configFile: path.resolve(__dirname, '../karma.conf.js'),
    singleRun: !argv.watch,
    // logLevel: 'debug'
  }).start();
};

const build = () => {
  const watcher = rollup.watch(config);

  let testsRunning = false;

  watcher.on('event', event => {
    // Wait until the first bundle is created before
    // running tests.
    if (event.code === 'BUNDLE_END') {
      if (!testsRunning) {
        runTests();
        testsRunning = true;
      }

      if (!argv.watch) {
        watcher.close();
      }
    }
  });
};

serveChildViews();
build();





