'use strict';

(function() {

angular.module('clusterboard', [])
.controller('ClusterboardController', ['$http','$timeout','$interval',
function($http, $timeout, $interval) {

  /* setup ---------------------------------------------------------------- */
  this.clusterGroups  = clusterGroups;  // get the clusters within their groups
  this.autoRefresh    = true;           // auto refresh on by default

  // setup tooltips after clusters render
  $timeout(() => { $('[data-toggle="tooltip"]').tooltip(); });


  /* internal functions ---------------------------------------------------- */
  // retrieve information about clusters every 10 seconds
  let startAutoRefresh = () => {
    interval = $interval(() => {
      if (this.autoRefresh) { getAllInfo(); }
    }, 10000);
  }

  // stop recurring retrieval of cluster information
  let stopAutoRefresh = () => {
    $interval.cancel(interval);
  }

  // get stats information for a cluster
  let getStats = (cluster) => {
    $http({ method:'GET', url:`${cluster.url}/stats.json` })
      .then((response) => {
        cluster.statsError = false;

        if (response.data.bsqErr) {
          cluster.statsError = response.data.bsqErr;
          return;
        }

        cluster.deltaBPS = 0;
        // sum delta bytes per second
        for (let stat of response.data.data) {
          if (stat.deltaBytesPerSec) {
            cluster.deltaBPS += stat.deltaBytesPerSec;
          }
        }

        cluster.deltaTDPS = 0;
        // sum delta total dropped per second
        for (let stat of response.data.data) {
          if (stat.deltaTotalDroppedPerSec) {
            cluster.deltaTDPS += stat.deltaTotalDroppedPerSec;
          }
        }
      }, (error) => {
        cluster.statsError = error.statusText || 'error retrieving stats';
      });
  }

  // get health information for a clusters
  let getHealth = (cluster) => {
    $http({ method:'GET', url:`${cluster.url}/eshealth.json` })
      .then((response) => {
        cluster.healthError = false;

        if (response.data.bsqErr) {
          cluster.healthError = response.data.bsqErr;
          return;
        }

        // TODO display these and the number of master and ingest nodes
        cluster.status = response.data.status;
        cluster.number_of_nodes = response.data.number_of_nodes;
        cluster.number_of_data_nodes = response.data.number_of_data_nodes;
      }, (error) => {
        cluster.healthError = error.statusText || 'error retrieving health';
      });
  }

  // get information about all clusters
  let getAllInfo = () => {
    for (let group of this.clusterGroups) {
      if (group.clusters) {
        for (let cluster of group.clusters) {
          // only get health for online clusters
          if (!cluster.disabled) { getHealth(cluster); }
          // don't get stats for multiviewers and disabled clusters
          if (!cluster.multiviewer && !cluster.disabled) { getStats(cluster); }
        }
      }
    }
  }


  /* exposed functions ---------------------------------------------------- */
  this.toggleAutoRefresh = () => {
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      getAllInfo();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }


  /* load data ------------------------------------------------------------ */
  getAllInfo();       // initial data load

  let interval;       // saved interval to cancel later
  startAutoRefresh(); // recurring data load

}
])

/**
 * http://stackoverflow.com/questions/2901102
 * separate number with commas
 * @param {number} input the number to add commas to
 * @returns {string} number string with appropriate commas
 */
.filter('commaString', () => {
  return (input) => {
    if (isNaN(input)) { return '0'; }
    return input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
});


}());
