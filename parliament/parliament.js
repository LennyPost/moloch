'use strict';


const express = require('express');
const path    = require('path');
const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const favicon = require('serve-favicon');
const request = require('request');
const rp      = require('request-promise');
const bp      = require('body-parser');

const app     = express();
const router  = express.Router();


// global variables
let parliament = require(`${__dirname}/parliament.json`);
let parliamentWithData = JSON.parse(JSON.stringify(parliament));
let groupId = 0, clusterId = 0;
let timeout;
// TODO maybe store map of groups? and clusters?

/* app setup --------------------------------------------------------------- */
// serve parliament app page
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.get('/', (req, res) => { res.render('app'); });

app.use(favicon(__dirname + '/public/favicon.ico'));

// font awesome doesn't work with webpack, so serve it up
app.use('/font-awesome', express.static(`${__dirname}/node_modules/font-awesome`, { maxAge:600*1000 }));

// serve public files
app.use('/public', express.static(`${__dirname}/public`, { maxAge:600*1000 }));

// serve app bundles
app.use('/app.bundle.js', express.static(`${__dirname}/bundle/app.bundle.js`, { maxAge:600*1000 }));
app.use('/vendor.bundle.js', express.static(`${__dirname}/bundle/vendor.bundle.js`, { maxAge:600*1000 }));

// define router to mount api related functions
app.use('/', router);
router.use(bp.json());
router.use(bp.urlencoded({ extended: true }));


/* Middleware -------------------------------------------------------------- */
// App should always have parliament data
router.use((req, res, next) => {
  if (!parliamentWithData) {
    return res.status(500).json({
      success : false,
      text    : 'Unable to fetch parliament data.'
    });
  }

  next();
});


/* Helper functions -------------------------------------------------------- */
// Retrieves the health of each cluster and updates the cluster with that info
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

// Retrieves, then calculates stats for each cluster and updates the cluster with that info
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

// Initializes the parliament with ids for each group and cluster
function initalizeParliament() {
  return new Promise((resolve, reject) => {
    for (let group of parliament.groups) {
      group.id = groupId++;
      if (group.clusters) {
        for (let cluster of group.clusters) {
          cluster.id = clusterId++;
        }
      }
    }

    let json = JSON.stringify(parliament);
    fs.writeFile('parliament.json', json, 'utf8', () => {
      return resolve();
    }); // TODO - error?
  });
}

// Chains all promises for requests for health and stats to update each cluster
// in the parliament
function updateParliament() {
  return new Promise((resolve, reject) => {

    let promises = [];
    for (let group of parliamentWithData.groups) {
      if (group.clusters) {
        for (let cluster of group.clusters) {
          // only get health for online clusters
          if (!cluster.disabled) {
            promises.push(getHealth(cluster));
          }
          // don't get stats for multiviewers or offline clusters
          if (!cluster.multiviewer && !cluster.disabled) {
            promises.push(getStats(cluster));
          }
        }
      }
    }

    Promise.all(promises)
      .then(() => {
        return resolve();
      })
      .catch((error) => {
        console.error('Parliament update error:', error.messge || error);
        return resolve();
      });

  });
}

// Sends an error
function sendError(req, res, status, errorText) {
  res.status(status || 500).json({
    success : false,
    text    : errorText || 'Error'
  });
}

// Writes the parliament to the parliament json file, updates the parliament
// with health and stats, then sends success or error
function writeParliament(req, res, successObj, errorText, sendParliament) {
  fs.writeFile('parliament.json', JSON.stringify(parliament), 'utf8', () => {

    parliamentWithData = JSON.parse(JSON.stringify(parliament));

    updateParliament()
      .then(() => {
        // send the updated parliament with the response
        if (sendParliament && successObj.parliament) {
          successObj.parliament = parliamentWithData;
        }
        return res.json(successObj);
      })
      .catch((error) => {
        return sendError(req, res, 500, errorText);
      });

  }); // TODO - handle error with json file writing
}


/* APIs -------------------------------------------------------------------- */
// Get parliament with stats
router.get('/api/parliament', (req, res) => {
  return res.json(parliamentWithData);
});

// Create a new group in the parliament
router.post('/api/groups', (req, res) => {
  if (!req.body.title) {
    return sendError(req, res, 422, 'A group must have a title.');
  }

  let newGroup = { title:req.body.title, id:groupId++, clusters:[] };
  if (req.body.description) { newGroup.description = req.body.description; }

  parliament.groups.push(newGroup);

  let successObj  = { success:true, group:newGroup, text: 'Successfully added new group.' };
  let errorText   = 'Unable to add that group to your parliament.';
  writeParliament(req, res, successObj, errorText);
});

// Delete a group in the parliament
router.delete('/api/groups/:id', (req, res) => {
  let foundGroup = false, index = 0;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.id)) {
      parliament.groups.splice(index, 1);
      foundGroup = true;
      break;
    }
    ++index;
  }

  if (!foundGroup) {
    return sendError(req, res, 500, 'Unable to find group to delete.');
  }

  let successObj  = { success:true, text:'Successfully removed the requested group.' };
  let errorText   = 'Unable to remove that group from the parliament.';
  writeParliament(req, res, successObj, errorText);
});

// Update a group in the parliament
router.put('/api/groups/:id', (req, res) => {
  if (!req.body.title) {
    return sendError(req, res, 422, 'A group must have a title.');
  }

  let foundGroup = false;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.id)) {
      group.title = req.body.title;
      if (req.body.description) {
        group.description = req.body.description;
      }
      foundGroup = true;
      break;
    }
  }

  if (!foundGroup) {
    return sendError(req, res, 500, 'Unable to find group to edit.');
  }

  let successObj  = { success:true, text:'Successfully updated the requested group.' };
  let errorText   = 'Unable to update that group in the parliament.';
  writeParliament(req, res, successObj, errorText);
});

// Create a new cluster within an existing group
router.post('/api/groups/:id/clusters', (req, res) => {
  if (!req.body.title) {
    return sendError(req, res, 422, 'A cluster must have a title.');
  }
  if (!req.body.url) {
    return sendError(req, res, 422, 'A cluster must have a url.');
  }

  let newCluster = {
    title       : req.body.title,
    description : req.body.description,
    url         : req.body.url,
    localUrl    : req.body.localUrl,
    multiviewer : req.body.multiviewer,
    disabled    : req.body.disabled,
    id          : clusterId++
  };

  let foundGroup = false;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.id)) {
      group.clusters.push(newCluster);
      foundGroup = true;
      break;
    }
  }

  if (!foundGroup) {
    return sendError(req, res, 500, 'Unable to find group to place cluster.');
  }

  let successObj  = {
    success   : true,
    cluster   : newCluster,
    parliament: parliamentWithData,
    text      : 'Successfully added the requested cluster.'
  };
  let errorText   = 'Unable to add that cluster to the parliament.';
  writeParliament(req, res, successObj, errorText, true);
});

// Delete a cluster
router.delete('/api/groups/:groupId/clusters/:clusterId', (req, res) => {
  let foundCluster = false, clusterIndex = 0;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.groupId)) {
      for (let cluster of group.clusters) {
        if (cluster.id === parseInt(req.params.clusterId)) {
          group.clusters.splice(clusterIndex, 1);
          foundCluster = true;
          break;
        }
        ++clusterIndex;
      }
    }
  }

  if (!foundCluster) {
    return sendError(req, res, 500, 'Unable to find cluster to delete.');
  }

  let successObj  = { success:true, text: 'Successfully removed the requested cluster.' };
  let errorText   = 'Unable to remove that cluster from your parliament.';
  writeParliament(req, res, successObj, errorText);
});

// Update a cluster
router.put('/api/groups/:groupId/clusters/:clusterId', (req, res) => {
  if (!req.body.title) {
    return sendError(req, res, 422, 'A cluster must have a title.');
  }
  if (!req.body.url) {
    return sendError(req, res, 422, 'A cluster must have a url.');
  }

  let foundCluster = false;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.groupId)) {
      for (let cluster of group.clusters) {
        if (cluster.id === parseInt(req.params.clusterId)) {
          cluster.title       = req.body.title;
          cluster.description = req.body.description;
          cluster.url         = req.body.url;
          cluster.localUrl    = req.body.localUrl;
          cluster.multiviewer = req.body.multiviewer;
          cluster.disabled    = req.body.disabled;
          foundCluster = true;
          break;
        }
      }
    }
  }

  if (!foundCluster) {
    return sendError(req, res, 500, 'Unable to find cluster to update.');
  }

  let successObj  = { success:true, text: 'Successfully updated the requested cluster.' };
  let errorText   = 'Unable to update that cluster in your parliament.';
  writeParliament(req, res, successObj, errorText);
});


/* LISTEN! ----------------------------------------------------------------- */
let server = app.listen(8008, () => {
  let host = server.address().address;
  let port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);

  initalizeParliament()
    .then(() => { updateParliament(); });

  timeout = setInterval(() => {
    updateParliament();
  }, 10000);
});
