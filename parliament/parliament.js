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
  return new Promise((resolve, reject) => {

  console.log('get health!');

  let options = {
    url: `${cluster.url}/eshealth.json`,
    method: 'GET',
    rejectUnauthorized: false
  };

  rp(options)
    .then((response) => {
      console.log('HEALTH SUCCESS', response);
      resolve(response);
    })
    .catch((error) => {
      console.log('HEALTH ERROR:', error); // TODO show error on cluster
      reject(error);
    });

  });

}

function getStats(cluster) {
  return new Promise((resolve, reject) => {

  console.log('get stats!');

  let options = {
    url: `${cluster.url}/stats.json`,
    method: 'GET',
    rejectUnauthorized: false
  };

  rp(options)
    .then((response) => {
      console.log('STATS SUCCESS', response);
      resolve(response);
    })
    .catch((error) => {
      console.log('STATS ERROR:', error); // TODO show error on cluster
      reject(error);
    });

  });
}

// APIs
app.get('/parliament.json', function(req, res) {
  for (let group of parliament) {
    if (group.clusters) {
      for (let cluster of group.clusters) {
        // only get health for online clusters
        if (!cluster.disabled) {
          // TODO - create chain of promises
          getHealth(cluster)
            .then((response) => {
               let health = JSON.parse(response);
               cluster.status = health.status;
               res.send(JSON.stringify(parliament));
            })
            .catch((error) => {
              // TODO
            });
        }
        if (!cluster.multiviewer && !cluster.disabled) {
          // TODO - fetch stats and append data to cluster
          //getStats(cluster);
        }
      }
    }
  }
  //res.send(JSON.stringify(parliament));
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
