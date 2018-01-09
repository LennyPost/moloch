import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

import { Parliament, GroupCreated, ClusterCreated, Response, Issues } from './parliament';

@Injectable()
export class ParliamentService {

  constructor(private http: HttpClient) {}

  getParliament(): Observable<Parliament> {
    return this.http.get<Parliament>('api/parliament');
  }

  createGroup(group): Observable<GroupCreated> {
    return this.http.post<GroupCreated>('api/groups', group);
  }

  editGroup(id, group): Observable<Response> {
    return this.http.put<Response>(`api/groups/${id}`, group);
  }

  deleteGroup(id): Observable<Response> {
    return this.http.delete<Response>(`api/groups/${id}`);
  }

  createCluster(id, cluster): Observable<ClusterCreated> {
    return this.http.post<ClusterCreated>(`api/groups/${id}/clusters`, cluster);
  }

  editCluster(groupId, clusterId, cluster): Observable<Response> {
    return this.http.put<Response>(`api/groups/${groupId}/clusters/${clusterId}`, cluster);
  }

  deleteCluster(groupId, clusterId): Observable<Response> {
    return this.http.delete<Response>(`api/groups/${groupId}/clusters/${clusterId}`);
  }

  updateClusterOrder(reorderedParliament): Observable<Response> {
    return this.http.put<Response>(`api/parliament`, { reorderedParliament: reorderedParliament });
  }

  getIssues(): Observable<Issues> {
    return this.http.get<Issues>(`api/issues`);
  }

  dismissIssue(groupId, clusterId, issue): Observable<any> {
    return this.http.put<Response>(
      `api/groups/${groupId}/clusters/${clusterId}/dismissIssue`,
      { type: issue.type, node: issue.node }
    );
  }

  ignoreIssue(groupId, clusterId, issue, forMs): Observable<any> {
    return this.http.put<Response>(
      `api/groups/${groupId}/clusters/${clusterId}/ignoreIssue`,
      { type: issue.type, node: issue.node, ms: forMs }
    );
  }

  removeIgnoreIssue(groupId, clusterId, issue): Observable<any> {
    return this.http.put<Response>(
      `api/groups/${groupId}/clusters/${clusterId}/removeIgnoreIssue`,
      { type: issue.type, node: issue.node }
    );
  }
}
