'use strict';

const express = require('express');
const path    = require('path');
const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const favicon = require('serve-favicon');
const request = require('request');
const rp      = require('request-promise');

const app     = express();

let parliament = require(`${__dirname}/parliament.json`);
let timeout;


app.use(favicon(__dirname + '/public/favicon.ico'));

// font awesome doesn't work with webpack, so serve it up
app.use('/font-awesome', express.static(`${__dirname}/node_modules/font-awesome`, { maxAge: 600 * 1000}));

app.use('/public', express.static(`${__dirname}/public`, { maxAge: 600 * 1000 }));

// app bundles
app.use('/app.bundle.js', function(req, res) {
  res.sendFile(`${__dirname}/bundle/app.bundle.js`);
});
app.use('/vendor.bundle.js', function(req, res) {
  res.sendFile(`${__dirname}/bundle/vendor.bundle.js`);
});


/* Helper functions -------------------------------------------------------- */
function updateParliament() {
  timeout = setInterval(() => {
    let promises = [];
    for (let group of parliament) {
      if (group.clusters) {
        for (let cluster of group.clusters) {
          // only get health for online clusters
          if (!cluster.disabled) {
            promises.push(getHealth(cluster));
          }
          // don't get stats for multiviewers of offline clusters
          if (!cluster.multiviewer && !cluster.disabled) {
            promises.push(getStats(cluster));
          }
        }
      }
    }

    Promise.all(promises)
      .then(() => {
        return;
      })
      .catch((error) => {
        console.error('Parliament update error:', error.messge || error);
        return;
      });
  }, 10000);
}

function getHealth(cluster) {
  return new Promise((resolve, reject) => {

  let options = {
    url: `${cluster.localUrl || cluster.url}/eshealth.json`,
    method: 'GET',
    rejectUnauthorized: false
  };

  rp(options)
    .then((response) => {
      cluster.healthError = undefined;

      let health;
      try { health = JSON.parse(response); }
      catch (e) {
        cluster.healthError = 'ES health parse failure';
        console.error('Bad response for es health', cluster.localUrl || cluster.url);
        return resolve();
      }

      if (health) { cluster.status = health.status; }

      return resolve();
    })
    .catch((error) => {
      let message = error.message || error;
      console.error('HEALTH ERROR:', message);
      cluster.healthError = message;
      return resolve();
    });

  });

}

function getStats(cluster) {
  return new Promise((resolve, reject) => {

  let options = {
    url: `${cluster.localUrl || cluster.url}/stats.json`,
    method: 'GET',
    rejectUnauthorized: false
  };

  rp(options)
    .then((response) => {
      cluster.statsError = undefined;

      if (response.bsqErr) {
        cluster.statsError = response.bsqErr;
        console.error('Get stats error', response.bsqErr);
        return resolve();
      }

      let stats;
      try { stats = JSON.parse(response); }
      catch (e) {
        cluster.statsError = 'ES stats parse failure';
        console.error('Bad response for stats', cluster.localUrl || cluster.url);
        return resolve();
      }

      if (!stats || !stats.data) { return resolve(); }

      cluster.deltaBPS = 0;
      // sum delta bytes per second
      for (let stat of stats.data) {
        if (stat.deltaBytesPerSec) {
          cluster.deltaBPS += stat.deltaBytesPerSec;
        }
      }

      cluster.deltaTDPS = 0;
      // sum delta total dropped per second
      for (let stat of stats.data) {
        if (stat.deltaTotalDroppedPerSec) {
          cluster.deltaTDPS += stat.deltaTotalDroppedPerSec;
        }
      }

      return resolve();
    })
    .catch((error) => {
      let message = error.message || error;
      console.error('STATS ERROR:', message);
      cluster.statsError = message;
      return resolve();
    });

  });
}


/* APIs -------------------------------------------------------------------- */
app.get('/parliament.json', function(req, res) {
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }
  return res.send(JSON.stringify(parliament));
});


// app page
app.use(function(req, res) {
  res.render('app.pug');
});


/* LISTEN! ----------------------------------------------------------------- */
var server = app.listen(8008, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
  updateParliament();
});
