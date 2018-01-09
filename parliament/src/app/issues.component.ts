import { Component, OnInit } from '@angular/core';

import { ParliamentService } from './parliament.service';
import { AuthService } from './auth.service';

@Component({
  templateUrl : './issues.html',
  providers   : [ ParliamentService ]
})
export class IssuesComponent implements OnInit {

  /* setup ----------------------------------------------------------------- */
  error = '';
  issues = [];
  loggedIn = false;

  constructor(
    private parliamentService: ParliamentService,
    private authService: AuthService
  ) {
    authService.loggedIn$.subscribe((loggedIn) => {
      this.loggedIn = loggedIn;
    });
  }

  ngOnInit() {
    this.loggedIn = this.authService.isLoggedIn();

    this.loadData();
  }

  /* controller functions -------------------------------------------------- */
  loadData() {
    this.parliamentService.getIssues()
      .subscribe(
        (response) => {
          this.issues = response.issues;
        },
        (err) => {
          this.error = err.error.text || 'Error fetching issues. The issues below are likely out of date';
        }
      );
  }

  /* page functions -------------------------------------------------------- */
  getIssueRowClass(issue) {
    if (issue.ignoreUntil) {
      return 'table-secondary text-muted';
    } else if (issue.severity === 'red') {
      return 'table-danger';
    } else if (issue.severity === 'yellow') {
      return 'table-warning';
    }

    return '';
  }

  /**
   * Sends a request to dismiss an issue
   * If succesful, updates the issue in the view, otherwise displays error
   * @param {object} issue - the issue to be dismissed
   */
  dismissIssue(issue) {
    this.parliamentService.dismissIssue(issue.groupId, issue.clusterId, issue)
      .subscribe(
        (data) => {
          issue.dismissed = data.dismissed;
        },
        (err) => {
          this.error = err.error.text || 'Unable to dismiss this issue';
        }
      );
  }

  /**
   * Sends a request to ignore an issue
   * If succesful, updates the issue in the view, otherwise displays error
   * @param {object} issue - the issue to be ignored
   * @param {number} forMs - the amount of time (in ms) that the issue should be ignored
   */
  ignoreIssue(issue, forMs) {
    this.parliamentService.ignoreIssue(issue.groupId, issue.clusterId, issue, forMs)
      .subscribe(
        (data) => {
          issue.ignoreUntil = data.ignoreUntil;
        },
        (err) => {
          this.error = err.error.text || 'Unable to ignore this issue';
        }
      );
  }

  /**
   * Sends a request to remove an ignore for an issue
   * If succesful, updates the issue in the view, otherwise displays error
   * @param {object} issue - the issue to remove the ignore for
   */
  removeIgnore(issue) {
    this.parliamentService.removeIgnoreIssue(issue.groupId, issue.clusterId, issue)
      .subscribe(
        (data) => {
          issue.ignoreUntil = undefined;
        },
        (err) => {
          this.error = err.error.text || 'Unable to ignore this issue';
        }
      );
  }

}
