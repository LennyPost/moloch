import { Component, OnInit } from '@angular/core';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { AuthService } from './auth.service';
import { ParliamentService } from './parliament.service';
import { Auth, Login } from './auth';

@Component({
  selector    : 'app-root',
  templateUrl : './parliament.html',
  styleUrls   : [ './parliament.css' ],
  providers   : [ AuthService, ParliamentService ]
})
export class ParliamentComponent implements OnInit{

  /* setup --------------------------------------------------------------- */
  private sub;

  // TODO organize these better
  parliament = { groups:[] };
  initialized: boolean = false;
  password: string = '';
  error: string = '';
  loggedIn: boolean = false;
  showLoginInput: boolean = false;
  auth: Auth = { hasAuth:false };
  refreshInterval: string = '1500';
  searchTerm:string = '';
  showNewGroupForm:boolean = false;
  newGroupTitle:string = '';
  newGroupDescription:string = '';

  constructor(
    private parliamentService: ParliamentService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.hasAuth()
      .subscribe((response) => {
        this.auth.hasAuth = response.hasAuth;
      });

    this.loggedIn = this.authService.isLoggedIn();

    if (localStorage.getItem('refreshInterval') !== undefined) {
      this.refreshInterval = localStorage.getItem('refreshInterval');
    }

    this.loadData();

    if (this.refreshInterval) { this.startAutoRefresh(); }
  }


  /* controller functions ------------------------------------------------ */
  /**
   * Loads the parliament or displays an error
   */
  loadData() {
    this.parliamentService.getParliament()
      .subscribe(
        (data) => {
          this.error = '';
          this.updateParliament(data);
        },
        (err) => {
          this.error = err.error.text ||
            'Error fetching health and status information about Molochs in your parliament. The information displayed below is likely out of date';
        }
      );
  }

  startAutoRefresh() {
    let timer = TimerObservable.create(0, parseInt(this.refreshInterval));
    this.sub = timer.subscribe(() => {
      if (this.refreshInterval) { this.loadData(); }
    });
  }

  stopAutoRefresh() {
    this.sub.unsubscribe();
  }

  /**
   * Updates fetched parliament with current view flags and values
   * Assumes that groups and clusters within groups are in the same order
   */
  updateParliament(data) { // TODO test this
    if (!this.initialized) {
      this.parliament   = data;
      this.initialized  = true;
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
  login() {
    this.showLoginInput = !this.showLoginInput;

    if (!this.showLoginInput) {
      if (!this.password) {
        this.error = 'Must provide a password to login.';
        return;
      }

      this.authService.login(this.password)
        .subscribe(
          (data) => {
            this.error    = '';
            this.password = '';
            this.loggedIn = this.authService.saveToken(data.token);
          },
          (err) => {
            console.log('login error:', err);
            this.password = '';
            this.loggedIn = false;
            this.error    = err.error.text || 'Unable to login';
            this.loggedIn = this.authService.saveToken('');
          }
        );
    }
  }

  logout() {
    this.loggedIn = false;
    localStorage.setItem('token', ''); // clear token
  }

  /**
   * Fired when interval refresh select input is changed
   */
  changeRefreshInterval() {
    localStorage.setItem('refreshInterval', this.refreshInterval);

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
    this.error = '';

    if (!this.newGroupTitle) {
      this.error = 'A group must have a title';
      return;
    }

    let newGroup = {
      title       : this.newGroupTitle,
      description : this.newGroupDescription
    };

    this.parliamentService.createGroup(newGroup)
      .subscribe(
        (data) => {
          this.showNewGroupForm = false;
          this.parliament.groups.push(data.group);
        },
        (err) => {
          this.error = err.error.text || 'Unable to create group';
        }
      );
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

    let updatedGroup = {
      title       : group.newTitle,
      description : group.newDescription
    }

    this.parliamentService.editGroup(group.id, updatedGroup)
      .subscribe(
        (data) => {
          // update group with new values and close form
          group.error = false;
          group.title = group.newTitle;
          group.description = group.newDescription;
          group.showEditGroupForm = false;
        },
        (err) => {
          group.error = err.error.text || 'Unable to udpate this group';
        }
      );
  }

  /**
   * Sends request to delete a group
   * If succesful, removes the group from the view, otherwise displays error
   * @param {object} group - the group to delete
   */
  deleteGroup(group) {
    group.error = false;

    this.parliamentService.deleteGroup(group.id)
      .subscribe(
        (data) => {
          group.error = false;
          let index = 0; // remove the group from the parliament
          for(let g of this.parliament.groups) {
            if (g.title === group.title) {
              this.parliament.groups.splice(index, 1);
              break;
            }
            ++index;
          }
        },
        (err) => {
          group.error = err.error.text || 'Unable to delete this group';
        }
      );
  }

}
