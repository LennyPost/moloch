'use strict';

const express = require('express');
const path    = require('path');
const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const favicon = require('serve-favicon');
const axios   = require('axios');

const app     = express();

let parliament = require(`${__dirname}/parliament.json`);


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


function getHealth(cluster) {
  axios.get(`${cluster.url}/eshealth.json`)
    .then((response) => {
      // TODO append health to cluster
      console.log('health success', response);
    })
    .catch((error) => {
      // TODO append error to cluster
      console.log('error with health request:', error.message);
    });
}

function getStats(cluster) {
  axios.get(`${cluster.url}/stats.json`)
    .then((response) => {
      // TODO append stats to cluster
      console.log('stats success', response);
    })
    .catch((error) => {
      // TODO append error to cluster
      console.log('error with stats request:', error.message);
    })
}


// APIs
app.get('/parliament.json', function(req, res) {
  for (let group of parliament) {
    if (group.clusters) {
      for (let cluster of group.clusters) {
        // only get health for online clusters
        if (!cluster.disabled) {
          // TODO - fetch health and append data to cluster
          getHealth(cluster);
        }
        if (!cluster.multiviewer && !cluster.disabled) {
          // TODO - fetch stats and append data to cluster
          getStats(cluster);
        }
      }
    }
  }
  res.send(JSON.stringify(parliament));
});


// app page
app.use(function(req, res) {
  res.render('app.pug');
});


/* LISTEN! */
var server = app.listen(8008, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
