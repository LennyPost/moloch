'use strict';

(function() {

/* initialization ------------------------------- */

// define clusters and their grouping
let clusterGroups = [
  {
    "clusters": [
      {
        "title": "daha",
        "href": "daha"
      },
      {
        "title": "egress",
        "href": "egress"
      },
      {
        "title": "all",
        "description": "Both daha and egress",
        "href": "daha",
        "multiviewer": true
      },
      {
        "title": "black",
        "href": "black"
      },
      {
        "title": "inv",
        "description": "investigate",
        "href": "inv"
      }
    ]
  },
  {
    "title": "Production",
    "description": "Most production sites are not recording icmp, port 443 or port 80",
    "clusters": [
      {
        "title": "atc",
        "href": "atcprod"
      },
      {
        "title": "amt",
        "href": "amtprod"
      },
      {
        "title": "frr",
        "href": "frrprod"
      },
      {
        "title": "lcd",
        "href": "lcdprod"
      },
      {
        "title": "mtc",
        "href": "mtcprod"
      },
      {
        "title": "scd",
        "href": "scdprod"
      },
      {
        "title": "all",
        "description": "all production molochs, please be gentle",
        "href": "allprod",
        "multiviewer": true
      }
    ]
  },
  {
    "title": "DASS",
    "description": "AOL to VZW, Studios to AWS, AWS private subnets to internet, Public DNS",
    "clusters": [
      {
        "title": "ash",
        "href": "ashdass"
      },
      {
        "title": "scd",
        "href": "scddass",
        "offline": true
      },
      {
        "title": "frr",
        "href": "frrdass",
        "offline": true
      },
      {
        "title": "all",
        "description": "all dass molochs, please be gentle",
        "href": "alldass",
        "multiviewer": true
      }
    ]
  },
  {
    "title": "Sniffernet",
    "clusters": [
      {
        "title": "mtc",
        "href": "mtcsniffernet"
      },
      {
        "title": "scd",
        "href": "scdsniffernet",
        "offline": true
      },
      {
        "title": "atc",
        "href": "atcsniffernet",
        "offline": true
      },
      {
        "title": "lcd",
        "href": "lcdsniffernet",
        "offline": true
      },
      {
        "title": "all",
        "description": "all sniffernet molochs, please be gentle",
        "href": "allsniffernet",
        "multiviewer": true
      }
    ]
  },
  {
    "title": "Test",
    "clusters": [
      {
        "title": "dmh",
        "href": "dmh"
      }
    ]
  }
];


angular.module('clusterboard', [])
.controller('ClusterboardController', function() {
  this.clusterGroups = clusterGroups;
});


}());
