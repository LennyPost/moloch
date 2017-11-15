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
    constructor($http, $interval) {
      this.$http      = $http;
      this.$interval  = $interval;
    }

    /* Callback when component is mounted and ready */
    $onInit() { // initialize scope variables
      this.refreshInterval  = '15000';  // TODO: save this
      this.compactMode      = false;    // TODO: save this

      this.loadData();

      if (this.refreshInterval) { this.startAutoRefresh(); }
    }


    /* controller functions ------------------------------------------------ */
    loadData() {
      this.$http({ method:'GET', url:'parliament.json' })
        .then((response) => {
          this.error      = false;
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
    login() { // TODO
      this.showLoginInput = !this.showLoginInput;

      if (!this.showLoginInput) { this.loggedIn = true; }
    }

    logout() { // TODO
      this.loggedIn = false;
    }

    changeRefreshInterval() {
      if (this.refreshInterval) {
        this.loadData();
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }

    createNewGroup() {
      // TODO validate inputs
      let options = {
        method: 'POST',
        url   : '/groups',
        data  : {
          title: this.newGroupTitle,
          description: this.newGroupDescription
        }
      };

      this.$http(options)
        .then((response) => {
          this.showNewGroupForm = false;
          this.parliament = response.data;
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

    deleteGroup(group) {
      // TODO validate input
      let options = {
        method: 'DELETE',
        url   : `/groups/${group.title}`
      };

      this.$http(options)
        .then((response) => {
          this.parliament = response.data; // TODO don't need this
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

    displayEditGroupForm(group) {
      group.showEditGroupForm = true;
      group.newTitle = group.title;
      group.newDescription = group.description;
    }

    editGroup(group) {
      // TODO validate inputs
      let options = {
        method: 'PUT',
        url   : `/groups/${group.title}`,
        data  : {
          title: group.newTitle,
          description: group.newDescription
        }
      };

      this.$http(options)
        .then((response) => {
          this.showEditGroupForm = false;
          this.parliament = response.data; // TODO don't need this
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

    createNewCluster(group) {
      // TODO validate inputs
      let options = {
        method: 'POST',
        url   : `/groups/${group.title}/clusters`,
        data  : {
          title       : this.newClusterTitle,
          description : this.newClusterDescription,
          url         : this.newClusterUrl,
          localUrl    : this.newClusterLocalUrl,
          multiviewer : this.newClusterMultiviewer,
          disabled    : this.newClusterDisabled
        }
      };

      this.$http(options)
        .then((response) => {
          this.showNewGroupForm = false;
          this.parliament = response.data;
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

    deleteCluster(group, cluster) {
      let options = {
        method: 'DELETE',
        url   : `/groups/${group.title}/clusters/${cluster.title}`
      };

      this.$http(options)
        .then((response) => {
          this.parliament = response.data; // TODO don't need this
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

    displayEditClusterForm(cluster) {
      cluster.showEditClusterForm = true;
      cluster.newTitle = cluster.title;
      cluster.newDescription = cluster.description;
      cluster.newUrl = cluster.url;
      cluster.newLocalUrl = cluster.localUrl;
      cluster.newMultiviewer = cluster.multiviewer;
      cluster.newDisabled = cluster.disabled;
    }

    editCluster(group, cluster) {
      // TODO validate inputs
      let options = {
        method: 'PUT',
        url   : `/groups/${group.title}/clusters/${cluster.title}`,
        data  : {
          title       : cluster.newTitle,
          description : cluster.newDescription,
          url         : cluster.newUrl,
          localUrl    : cluster.newLocalUrl,
          multiviewer : cluster.newMultiviewer,
          disabled    : cluster.newDisabled
        }
      };

      this.$http(options)
        .then((response) => {
          cluster.showEditClusterForm = false;
          this.parliament = response.data; // TODO don't need this
        }, (error) => {
          // TODO display error
          console.log(error);
        });
    }

  }

  ParliamentController.$inject = ['$http','$interval'];


  angular.module('parliament')
    .component('molochParliament', {
      template  : require('./index.html'),
      controller: ParliamentController
    });

})();
