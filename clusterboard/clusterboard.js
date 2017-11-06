'use strict';

(function() {

angular.module('clusterboard', [])
.controller('ClusterboardController', ['$timeout', function($timeout) {
  /* setup --------------------------------------------------------------- */
  // get the clusters within their groups
  this.clusterGroups = clusterGroups;

  // setup tooltips after clusters render
  $timeout(() => {
    $('[data-toggle="tooltip"]').tooltip();
  });

  /* exposed functions --------------------------------------------------- */

}]);


}());
