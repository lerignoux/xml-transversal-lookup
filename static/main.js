(function () {

  'use strict';

  angular.module('TransversalLookupApp', [])

  .controller('LookupController', ['$scope', '$log', '$http',
    function($scope, $log, $http) {
      $log.log("controller init");

      $http.post('/login').
        success(function(results) {
          $log.log(results);
          $scope.uid = results["uid"];
          $http.get('/databases', {params: {uid: $scope.uid}}).
            success(function(results) {
              $scope.databases = results;
              $log.log(results);
            }).
            error(function(error) {
              $log.log(error);
            });
        }).
        error(function(error) {
          $log.log(error);
        });

    $scope.selectDb = function(db) {
      $log.log("selected db:" + db);
      $http.post('/databases', {uid: $scope.uid, database: db}).
        success(function(results) {
          $log.log(results);
          $scope.loadNodes();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.loadNodes = function() {
      $http.get('/nodes', {params: {uid: $scope.uid}}).
        success(function(results) {
          $log.log(results);
          $scope.nodes = results;
          $log.log(results)
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.nodeSelected = function() {
      $scope.loadAttrs()
    };

    $scope.loadAttrs = function() {
      $http.get('/attributes', {params: {uid: $scope.uid, node_name: $scope.selectedNode}}).
        success(function(results) {
          $log.log(results);
          $scope.attributes = results;
          $scope.selectedAttributes = [];
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.attributeSelected = function() {
      $scope.lookup();
    };

    $scope.lookup = function() {
      $http.get('/lookups', {params: {uid: $scope.uid, node_name: $scope.selectedNode, attributes: $scope.selectedAttributes}}).
        success(function(results) {
          $log.log(results);
          $scope.lookups = results;
        }).
        error(function(error) {
          $log.log(error);
        });
    };

  }

  ]);

}());
