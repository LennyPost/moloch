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

// TODO maybe store map of groups? and clusters?
let parliament = require(`${__dirname}/parliament.json`);
let parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
let groupId = 0, clusterId = 0;
let timeout;


app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

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
  if (!parliamentWithData) { return res.status(500).send('Unable to get parliament'); }
  return res.send(JSON.stringify(parliamentWithData));
});

app.post('/groups', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  // TODO - make this general middleware?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let newGroup = { title:req.body.title, id:groupId++, clusters:[] };
  if (req.body.description) { newGroup.description = req.body.description; }

  parliament.groups.push(newGroup);

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({success:true, group:newGroup}));
      })
      .catch((error) => {
        return res.status(500).send('Unable to update parliament with your new group');
      });
  }); // TODO - error?
});

app.delete('/groups/:id', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

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
    return res.status(500).send('Unable to find group to delete');
  }

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({success:true, text:'Successfully removed the requested group'}));
      })
      .catch((error) => {
        return res.status(500).send('Unable to remove that group from the parliament');
      });
  }); // TODO - error?
});

app.put('/groups/:id', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

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
    return res.status(500).send('Unable to find group to edit');
  }

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({success:true, text:'Successfully updated the requested group'}));
      })
      .catch((error) => {
        return res.status(500).send('Unable to update this group in your parliament');
      });
  }); // TODO - error?
});

app.post('/groups/:id/clusters', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let newCluster = {
    title       : req.body.title,
    description : req.body.description,
    url         : req.body.url,
    localUrl    : req.body.localUrl,
    multiviewer : req.body.multiviewer,
    disabled    : req.body.disabled,
    id          : clusterId++
  }

  let foundGroup = false;
  for(let group of parliament.groups) {
    if (group.id === parseInt(req.params.id)) {
      group.clusters.push(newCluster);
      foundGroup = true;
      break;
    }
  }

  if (!foundGroup) {
    return res.status(500).send('Unable to find group to place cluster');
  }

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({
          success   :true,
          cluster   :newCluster,
          parliament:parliamentWithData
        }));
      })
      .catch((error) => {
        return res.status(500).send('Unable to update parliament with your new cluster');
      });
  }); // TODO - error?
});

app.delete('/groups/:groupId/clusters/:clusterId', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

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
    return res.status(500).send('Unable to find cluster to delete');
  }

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({success:true, text:'Successfully removed the requested cluster'}));
      })
      .catch((error) => {
        return res.status(500).send('Unable to remove that cluster from your parliament');
      });
  }); // TODO - error?
});

app.put('/groups/:groupId/clusters/:clusterId', function(req, res) {
  // TODO - validate inputs
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

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
    return res.status(500).send('Unable to find cluster to update');
  }

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send(JSON.stringify({success:true, text:'Successfully updated the requested cluster'}));
      })
      .catch((error) => {
        return res.status(500).send('Unable to update the cluster');
      });
  }); // TODO - error?
});


// app page
app.use(function(req, res) {
  res.render('app.pug');
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
