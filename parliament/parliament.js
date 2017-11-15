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

let parliament = require(`${__dirname}/parliament.json`);
let parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
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
function updateParliament() {
  return new Promise((resolve, reject) => {

    let promises = [];
    for (let group of parliamentWithData) {
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

  let newGroup = { title:req.body.title, clusters:[] };
  if (req.body.description) { newGroup.description = req.body.description; }

  parliament.push(newGroup);

  let json = JSON.stringify(parliament);

  fs.writeFile('parliament.json', json, 'utf8', () => {
    parliamentWithData = JSON.parse(JSON.stringify(parliament)); // TODO - this is hacky
    updateParliament()
      .then(() => {
        return res.send('success');
      })
      .catch((error) => {
        return res.status(500).send('Unable to update parliament with your new group');
      });
  }); // TODO - error?
});

// TODO use a unique id for the group instead of the title
app.delete('/groups/:groupTitle', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let foundGroup = false, index = 0;
  for(let group of parliament) {
    if (group.title === req.params.groupTitle) {
      parliament.splice(index, 1);
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
        return res.send('success');
      })
      .catch((error) => {
        return res.status(500).send('Unable to remove that group from the parliament');
      });
  }); // TODO - error?
});

// TODO use a unique id for the group instead of the title
app.put('/groups/:groupTitle', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let foundGroup = false;
  for(let group of parliament) {
    if (group.title === req.params.groupTitle) {
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
        return res.send('success');
      })
      .catch((error) => {
        return res.status(500).send('Unable to update this group in your parliament');
      });
  }); // TODO - error?
});

// TODO use a unique id for the group instead of the title
// TODO maybe store map of groups? and clusters?
app.post('/groups/:groupTitle/clusters', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let cluster = {
    title: req.body.title,
    description: req.body.description,
    url: req.body.url,
    localUrl: req.body.localUrl,
    multiviewer: req.body.multiviewer,
    disabled: req.body.distabed
  }

  let foundGroup = false;
  for(let group of parliament) {
    if (group.title === req.params.groupTitle) {
      group.clusters.push(cluster);
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
        return res.send(JSON.stringify(parliamentWithData));
      })
      .catch((error) => {
        return res.status(500).send('Unable to update parliament with your new cluster');
      });
  }); // TODO - error?
});

// TODO use a unique id for the cluster instead of the title
app.delete('/groups/:groupTitle/clusters/:clusterTitle', function(req, res) {
  // TODO - validate inputs - require a unique name/title?
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let foundCluster = false, clusterIndex = 0;
  for(let group of parliament) {
    if (group.title === req.params.groupTitle) {
      for (let cluster of group.clusters) {
        if (cluster.title === req.params.clusterTitle) {
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
        return res.send('success');
      })
      .catch((error) => {
        return res.status(500).send('Unable to remove that cluster from your parliament');
      });
  }); // TODO - error?
});

// TODO use a unique id for the cluster instead of the title
app.put('/groups/:groupTitle/clusters/:clusterTitle', function(req, res) {
  // TODO - validate inputs
  if (!parliament) { return res.status(500).send('Unable to get parliament'); }

  let foundCluster = false;
  for(let group of parliament) {
    if (group.title === req.params.groupTitle) {
      for (let cluster of group.clusters) {
        if (cluster.title === req.params.clusterTitle) {
          cluster.title = req.body.title;
          cluster.description = req.body.description;
          cluster.url = req.body.url;
          cluster.localUrl = req.body.localUrl;
          cluster.multiviewer = req.body.multiviewer;
          cluster.disabled = req.body.disabled;
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
        return res.send('success');
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

  timeout = setInterval(() => {
    updateParliament();
  }, 10000);
});
