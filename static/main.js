(function () {

  'use strict';

  angular.module('TransversalLookupApp', ['ngMaterial', 'md.data.table', 'chart.js'])

  .controller('LookupController', ['$scope', '$log', '$http',
    function($scope, $log, $http) {
      $log.log("controller init");
      $scope.data = {
        "uid": null,
        "databases": null,
        "nodes": null,
        "attributes": null,
        "lookups": null,
        "headers": [],
      };

      $scope.selection = {
        "database": null,
        "node": null,
        "attributes": []
      };

      $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
      $scope.series = ['Series A', 'Series B'];
      $scope.data = [
        [65, 59, 80, 81, 56, 55, 40],
        [28, 48, 40, 19, 86, 27, 90]
      ];
      $scope.onClick = function (points, evt) {
        console.log(points, evt);
      };

      $http.post('/login').
        success(function(results) {
          $log.log(results);
          $scope.data.uid = results["uid"];
          $http.get('/databases', {params: {uid: $scope.data.uid}}).
            success(function(results) {
              $scope.data.databases = results;
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
      $scope.selection.database = db;
      $http.post('/databases', {uid: $scope.data.uid, database: $scope.selection.database}).
        success(function(results) {
          $log.log(results);
          $scope.getNodes();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getNodes = function() {
      $http.get('/nodes', {params: {uid: $scope.data.uid}}).
        success(function(results) {
          $log.log("nodes: " + results);
          $scope.data.nodes = results;
          $scope.getNodesGroups();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getNodesGroups = function() {
      $http.get('/groups', {params: {uid: $scope.data.uid}}).
        success(function(results) {
          $log.log("groups: " + results);
          $scope.data.groups = results;
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getAttrs = function() {
      $log.log("getting");
      $http.get('/attributes', {params: {uid: $scope.data.uid, node: $scope.selection.node.id}}).
        success(function(results) {
          $log.log("attributes: " + results);
          $scope.data.attributes = results;
        }).
        error(function(error) {
          $log.log(error);
        });
    }

    $scope.getLookup = function() {
      var attributes_names = [];
      for (var i= 0; i<$scope.selection.attributes.length; i++) {
        attributes_names.push($scope.selection.attributes[i].name);
      };
      $http.get('/lookups', {params: {uid: $scope.data.uid, node: $scope.selection.node.id, attributes: attributes_names}}).
        success(function(results) {
          $log.log("lookups : " + results);
          $scope.data.lookups = results;
          $scope.data.headers = []
          $scope.data.headers.concat([$scope.selection.node])
          $scope.data.headers.concat($scope.selection.attributes);
          $log.log("headers" + $scope.data.headers);
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.transformChip = function(chip) {
      $log.log("transform chip" + chip)
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }
    };
    /**
     * Search for vegetables.
     */
    $scope.attrSearch = function (query) {
      $log.log("searching for "+ query)
      $log.log($scope.data.attributes);
        var results = query ? $scope.data.attributes.filter($scope.createFilterFor(query)) : [];
      return results;
    };
    /**
     * Create filter function for a query string
     */
    $scope.createFilterFor = function(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(attribute) {
        return (attribute.name.toLowerCase().indexOf(lowercaseQuery) === 0);
      };
    };

    $scope.groupFilter = function (item) {
        return true
        return $scope.selection.group.indexOf(item) !== 0;
    };

  }

  ]);

}());
