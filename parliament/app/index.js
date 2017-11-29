(function() {

  'use strict';


  let interval;


  /**
   * @class ParliamentController
   * @classdesc Interacts with the parliament page
   */
  class ParliamentController {

    /* setup --------------------------------------------------------------- */
    /**
     * Initialize global variables for this controller
     *
     * @ngInject
     */
    constructor($http, $interval, $rootScope) {
      this.$http      = $http;
      this.$interval  = $interval;
      this.$rootScope = $rootScope;
    }

    /* Callback when component is mounted and ready */
    $onInit() { // initialize scope variables
      this.refreshInterval  = '15000';
      this.compactMode      = false;

      if (localStorage) {
        if (localStorage.token) {
          this.$rootScope.loggedIn = true;
        }
        if (localStorage.refreshInterval !== undefined) {
          this.refreshInterval = localStorage.refreshInterval;
        }
        if (localStorage.compactMode) {
          this.compactMode = localStorage.compactMode === 'true';
        }
      }

      this.loadData();

      if (this.refreshInterval) { this.startAutoRefresh(); }
    }


    /* controller functions ------------------------------------------------ */
    loadData() {
      this.$http({ method:'GET', url:'/api/parliament' })
        .then((response) => {
          this.error = false;
          this.updateParliament(response.data);
        }, (error) => {
          if (error.data && error.data.text) {
            this.error = error.data.text;
          } else {
            this.error = error.statusText ||
              'Error fetching health and status information about Molochs in your parliament. The information displayed below is likely out of date';
          }
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

    /**
     * Updates fetched parliament with current view flags and values
     * Assumes that groups and clusters within groups are in the same order
     */
    updateParliament(data) {
      if (!this.parliament) {
        this.parliament = data;
        return;
      }

      for(let g = 0, glen = data.groups.length; g < glen; ++g) {
        let newGroup = data.groups[g];
        let oldGroup = this.parliament.groups[g];

        newGroup.error                  = oldGroup.error;
        newGroup.newTitle               = oldGroup.newTitle;
        newGroup.newDescription         = oldGroup.newDescription;
        newGroup.filteredClusters       = oldGroup.filteredClusters;
        newGroup.showEditGroupForm      = oldGroup.showEditGroupForm;
        newGroup.showNewClusterForm     = oldGroup.showNewClusterForm;
        newGroup.newClusterTitle        = oldGroup.newClusterTitle;
        newGroup.newClusterDescription  = oldGroup.newClusterDescription;
        newGroup.newClusterUrl          = oldGroup.newClusterUrl;
        newGroup.newClusterLocalUrl     = oldGroup.newClusterLocalUrl;
        newGroup.newClusterMultiviewer  = oldGroup.newClusterMultiviewer;
        newGroup.newClusterDisabled     = oldGroup.newClusterDisabled;

        for (let c = 0, clen = newGroup.clusters.length; c < clen; ++c) {
          let newCluster = newGroup.clusters[c];
          let oldCluster = oldGroup.clusters[c];

          newCluster.error              = oldCluster.error;
          newCluster.newTitle           = oldCluster.newTitle;
          newCluster.newDescription     = oldCluster.newDescription;
          newCluster.newUrl             = oldCluster.newUrl;
          newCluster.newLocalUrl        = oldCluster.newLocalUrl;
          newCluster.newMultiviewer     = oldCluster.newMultiviewer;
          newCluster.newDisabled        = oldCluster.newDisabled;
          newCluster.showEditClusterForm= oldCluster.showEditClusterForm;
        }
      }

      this.parliament = data;
    }


    /* page functions ------------------------------------------------------ */
    login() { // TODO
      this.showLoginInput = !this.showLoginInput;

      if (!this.showLoginInput) {
        if (!this.password) {
          this.error = 'Must provide a password to login.';
          return;
        }

        let options = {
          method: 'POST',
          url   : '/api/authenticate',
          data  : { password:this.password }
        };

        this.$http(options)
          .then((response) => {
            this.error = false;
            this.password = null;
            this.$rootScope.loggedIn = true;
            localStorage.token = response.data.token;
          }, (error) => {
            this.password = null;
            this.$rootScope.loggedIn = false;
            this.error = error.data.text || 'Unable to login.';
            localStorage.token = '';
          });
      }
    }

    logout() { // TODO
      localStorage.token = '';
      this.$rootScope.loggedIn = false;
    }

    /**
     * Fired when compact mode button is pressed
     */
    toggleCompactMode() {
      this.compactMode = !this.compactMode;

      if (localStorage) {
        localStorage.compactMode = this.compactMode;
      }
    }

    /**
     * Fired when interval refresh select input is changed
     */
    changeRefreshInterval() {
      if (localStorage) {
        localStorage.refreshInterval = this.refreshInterval;
      }

      if (this.refreshInterval) {
        this.loadData();
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }

    /**
     * Creates a new group in the parliament
     * newGroupTitle is required
     */
    createNewGroup() {
      this.error = false;

      if (!this.newGroupTitle) {
        this.error = 'A group must have a title';
        return;
      }

      let options = {
        method: 'POST',
        url   : '/api/groups',
        data  : {
          title: this.newGroupTitle,
          description: this.newGroupDescription
        }
      };

      this.$http(options)
        .then((response) => {
          this.showNewGroupForm = false;
          this.parliament.groups.push(response.data.group);
        }, (error) => {
          this.error = error.data.text || 'Unable to create group';
        });
    }

    /**
     * Sends request to delete a group
     * If succesful, removes the group from the view, otherwise displays error
     * @param {object} group - the group to delete
     */
    deleteGroup(group) {
      group.error = false;

      let options = {
        method: 'DELETE',
        url   : `/api/groups/${group.id}`
      };

      this.$http(options)
        .then((response) => {
          group.error = false;
          // remove the group from the parliament
          let index = 0;
          for(let g of this.parliament.groups) {
            if (g.title === group.title) {
              this.parliament.groups.splice(index, 1);
              break;
            }
            ++index;
          }
        }, (error) => {
          group.error = error.data.text || 'Unable to delete this group';
        });
    }

    /**
     * Displays form fields to edit a group's title and description
     * Prefills the inputs with the existing group's title and description
     * @param {object} group - the group to display a form for
     */
    displayEditGroupForm(group) {
      group.showEditGroupForm = true;
      group.newTitle = group.title;
      group.newDescription = group.description;
    }

    /**
     * Sends request to edit a group
     * If succesful, updates the group in the view, otherwise displays error
     * @param {object} group - the group to edit
     */
    editGroup(group) {
      group.error = false;

      if (!group.newTitle) {
        group.error = 'A group must have a title';
        return;
      }

      let options = {
        method: 'PUT',
        url   : `/api/groups/${group.id}`,
        data  : {
          title: group.newTitle,
          description: group.newDescription
        }
      };

      this.$http(options)
        .then((response) => {
          // update group with new values and close form
          group.error = false;
          group.title = group.newTitle;
          group.description = group.newDescription;
          group.showEditGroupForm = false;
        }, (error) => {
          group.error = error.data.text || 'Unable to update this group';
        });
    }

    /**
     * Sends a request to create a new cluster within a group
     * If succesful, updates the group in the view, otherwise displays error
     * @param {object} group - the group to add the cluster
     */
    createNewCluster(group) {
      group.error = false;

      if (!group.newClusterTitle) {
        group.error = 'A cluster must have a title';
        return;
      }
      if (!group.newClusterUrl) {
        group.error = 'A cluster must have a url';
        return;
      }

      let newCluster = {
        title       : group.newClusterTitle,
        description : group.newClusterDescription,
        url         : group.newClusterUrl,
        localUrl    : group.newClusterLocalUrl,
        multiviewer : group.newClusterMultiviewer,
        disabled    : group.newClusterDisabled
      };

      let options = {
        method: 'POST',
        url   : `/api/groups/${group.id}/clusters`,
        data  : newCluster
      };

      this.$http(options)
        .then((response) => {
          group.error = false;
          group.showNewClusterForm = false;
          group.clusters.push(response.data.cluster);
          this.updateParliament(response.data.parliament);
        }, (error) => {
          group.error = error.data.text || 'Unable to add a cluster to this group';
        });
    }

    /**
     * Sends a request to delete a cluster within a group
     * If succesful, updates the group in the view, otherwise displays error
     * @param {object} group - the group to remove the cluster from
     * @param {object} cluster - the cluster to remove
     */
    deleteCluster(group, cluster) {
      group.error = false;

      let options = {
        method: 'DELETE',
        url   : `/api/groups/${group.id}/clusters/${cluster.id}`
      };

      this.$http(options)
        .then((response) => {
          group.error = false;
          let index = 0;
          for(let c of group.clusters) {
            if (c.title === cluster.title) {
              group.clusters.splice(index, 1);
              break;
            }
            ++index;
          }
        }, (error) => {
          group.error = error.data.text || 'Unable to remove cluster from this group';
        });
    }

    /**
     * Displays form fields to edit a cluster's data
     * Prefills the inputs with the existing cluster's data
     * @param {object} cluster - the cluster to display a form for
     */
    displayEditClusterForm(cluster) {
      cluster.showEditClusterForm = true;
      cluster.newTitle        = cluster.title;
      cluster.newDescription  = cluster.description;
      cluster.newUrl          = cluster.url;
      cluster.newLocalUrl     = cluster.localUrl;
      cluster.newMultiviewer  = cluster.multiviewer;
      cluster.newDisabled     = cluster.disabled;
    }

    /**
     * Sends request to edit a cluster
     * If succesful, updates the cluster in the view, otherwise displays error
     * @param {object} group - the group containing the cluster
     * @param {object} cluster - the cluster to update
     */
    editCluster(group, cluster) {
      cluster.error = false;

      if (!cluster.newTitle) {
        cluster.error = 'A cluster must have a title';
        return;
      }
      if (!cluster.newUrl) {
        cluster.error = 'A cluster must have a url';
        return;
      }

      let updatedCluster = {
        title       : cluster.newTitle,
        description : cluster.newDescription,
        url         : cluster.newUrl,
        localUrl    : cluster.newLocalUrl,
        multiviewer : cluster.newMultiviewer,
        disabled    : cluster.newDisabled
      };

      let options = {
        method: 'PUT',
        url   : `/api/groups/${group.id}/clusters/${cluster.id}`,
        data  : updatedCluster
      };

      this.$http(options)
        .then((response) => {
          cluster.error = false;
          cluster.showEditClusterForm = false;
          cluster.title       = cluster.newTitle;
          cluster.description = cluster.newDescription;
          cluster.url         = cluster.newUrl;
          cluster.localUrl    = cluster.newLocalUrl;
          cluster.multiviewer = cluster.newMultiviewer;
          cluster.disabled    = cluster.newDisabled;
        }, (error) => {
          cluster.error = error.data.text || 'Unable to update this cluster';
        });
    }

  }

  ParliamentController.$inject = ['$http','$interval','$rootScope'];


  angular.module('parliament')
    .component('molochParliament', {
      template  : require('./index.html'),
      controller: ParliamentController
    });

})();
