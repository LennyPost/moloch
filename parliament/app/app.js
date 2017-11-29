(function() {

  'use strict';


  require('../node_modules/bootstrap/js/dist/dropdown');
  require('../node_modules/bootstrap/dist/css/bootstrap.css');
  require('./app.css');
  require('angular-route');
  require('angular-animate');
  require('angular-resource');


  /**
   * Parliament Angular Application Definition
   */
  angular.module('parliament', [
    // angular dependencies
    'ngResource', 'ngRoute', 'ngAnimate'
  ])

  .config(['$routeProvider','$locationProvider','$httpProvider',
    function($routeProvider, $locationProvider, $httpProvider) {
      $routeProvider
        .when('/', {
          title    : 'Parliament',
          template : '<moloch-parliament></moloch-parliament>',
        })
        .otherwise({ // TODO
          title    : 'Not Found',
          template : '<moloch-404></moloch-404>'
        });

      $locationProvider.html5Mode(true); // activate HTML5 Mode

      $httpProvider.defaults.withCredentials  = true;
      $httpProvider.interceptors.push(['$q','$rootScope', ($q, $rootScope) => {
        return {
          request: function(req) { // append token to headers of every request
            const token = localStorage.token;
            if (token) { req.headers['x-access-token'] = token; }
            return req;
          },
          responseError: function(res) { // watch for token revocation
            if (res.data && !res.data.success && res.data.tokenError) {
              $rootScope.loggedIn = false;
              localStorage.token  = '';
            }
            return $q.reject(res);
          }
        };
      }]);
    }]
  )

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


  require('./app.js');
  require('./index.js');

})();
