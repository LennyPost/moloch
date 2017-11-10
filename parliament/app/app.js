(function() {

  'use strict';


  require('../node_modules/bootstrap/js/dist/tooltip');
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
        .otherwise({
          title    : 'Not Found',
          template : '<moloch-404></moloch-404>'
        });

      $locationProvider.html5Mode(true); // activate HTML5 Mode

      $httpProvider.defaults.withCredentials  = true;
      $httpProvider.defaults.xsrfCookieName   = 'MOLOCH-COOKIE';
      $httpProvider.defaults.xsrfHeaderName   = 'X-MOLOCH-COOKIE';
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
