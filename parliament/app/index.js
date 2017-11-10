(function() {

  'use strict';


  let interval;


  /**
   * @class ParliamentController
   * @classdesc Interacts with session list
   */
  class ParliamentController {

    /* setup --------------------------------------------------------------- */
    /**
     * Initialize global variables for this controller
     *
     * @ngInject
     */
    constructor($http, $timeout, $interval) {
      this.$http      = $http;
      this.$timeout   = $timeout;
      this.$interval  = $interval;
    }

    /* Callback when component is mounted and ready */
    $onInit() { // initialize scope variables
      this.refreshInterval = '15000';  // TODO: save this

      this.loadData();

      if (this.refreshInterval) { this.startAutoRefresh(); }

      // setup tooltips after parliament renders
      this.$timeout(() => { $('[data-toggle="tooltip"]').tooltip(); });
    }


    /* controller functions ------------------------------------------------ */
    loadData() {
      this.$http({ method:'GET', url:'parliament.json' })
        .then((response) => {
          this.parliament = response.data;
        }, (error) => {
          this.error = error.statusText ||
            'Error fetching health and status information about Molochs in your parliament. The information displayed below is likely out of date';
        });
    }

    startAutoRefresh() {
      interval = this.$interval(() => {
        if (this.refreshInterval) { this.loadData(); }
      }, this.refreshInterval);
    }

    stopAutoRefresh() {
      this.$interval.cancel(interval);
    }


    /* page functions ------------------------------------------------------ */
    changeRefreshInterval() {
      if (this.refreshInterval) {
        this.loadData();
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }

  }

  ParliamentController.$inject = ['$http','$timeout','$interval'];


  angular.module('parliament')
    .component('molochParliament', {
      template  : require('./index.html'),
      controller: ParliamentController
    });

})();
