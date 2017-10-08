(function () {

  'use strict';

  angular.module('TransversalLookupApp', ['ngMaterial', 'md.data.table', 'chart.js'])

  .controller('LookupController', ['$scope', '$log', '$http', '$filter',
    function($scope, $log, $http, $filter) {
      $log.log("Controller initialiation");
      $scope.data = {
        "uid": null,
        "databases": null,
        "nodes": null,
        "names": [],
        "groups": [],
        "attributes": null,
        "lookups": null,
        "headers": []
      };

      $scope.selection = {
        "database": null,
        "node": null,
        "group": null,
        "names": [],
        "attributes": []
      };

      $http.post('/login').
        success(function(results) {
          $scope.data.uid = results["uid"];
          $http.get('/databases', {params: {uid: $scope.data.uid}}).
            success(function(results) {
              $log.log("Database fetched");
              $scope.data.databases = results.all;
              $scope.selection.database = results.default;
              $scope.selectDb();
            }).
            error(function(error) {
              $log.log(error);
            });
        }).
        error(function(error) {
          $log.log(error);
        });

    $scope.selectDb = function() {
      $http.post('/databases', {uid: $scope.data.uid, database: $scope.selection.database}).
        success(function(results) {
          $log.log("Database selected");
          $scope.getNodes();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getNodes = function() {
      $http.get('/nodes', {params: {uid: $scope.data.uid}}).
        success(function(results) {
          $log.log("Nodes fetched");
          $scope.data.nodes = results.all;
          $scope.selection.node = results.default;
          $scope.getNodesNames();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getNodesNames = function() {
      $http.get('/nodes/names', {params: {uid: $scope.data.uid}}).
        success(function(results) {
          $log.log("Nodes names fetched");
          $scope.data.names = results;
          $scope.getNodesGroups();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.nodeSelected = function(name) {
      return ($scope.selection.names.indexOf(name) >= 0)
    }

    $scope.toggleNode = function(name) {
      var idx = $scope.selection.names.indexOf(name);
      if (idx !== -1) {
        $scope.selection.names.splice(idx, 1);
      }
      else {
        $scope.selection.names.push(name)
      }
    }

    $scope.getNodesGroups = function() {
      $http.get('/nodes/groups', {params: {uid: $scope.data.uid}}).
        success(function(results) {
          $log.log("Nodes groups fetched");
          $scope.data.groups = results;
          $scope.getAttrs();
          $scope.$watch('selection.group', function(newValue, oldValue) {
            $log.log("New group selected: " + newValue)
            if ($scope.data.groups[newValue] !== undefined) {
              $scope.selection.names = $scope.data.groups[newValue];
            }
            $scope.filterLookups();
          }, true);

          $scope.$watch('selection.names', function(newValue, oldValue) {
            $log.log("Name selection updated")
            $scope.filterLookups();
          }, true);

        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getAttrs = function() {
      $http.get('/attributes', {params: {uid: $scope.data.uid, node: $scope.selection.node.id}}).
        success(function(results) {
          $log.log("Attributes fetched");
          $scope.data.attributes = results;

          $scope.$watchCollection('selection.attributes', function(newValue, oldValue) {$scope.getLookup()});
        }).
        error(function(error) {
          $log.log(error);
        });
    }

    $scope.getLookup = function() {
      // Not ready yet
      if ($scope.selection.node === null) {return};
      var attributes_names = [];
      for (var i= 0; i<$scope.selection.attributes.length; i++) {
        attributes_names.push($scope.selection.attributes[i].name);
      };
      $http.get('/lookups', {params: {uid: $scope.data.uid, node: $scope.selection.node.id, attributes: attributes_names}}).
        success(function(results) {
          $log.log("Lookups fetched");
          $scope.data.lookups = [];


          angular.forEach(results, function(element) {
            $scope.data.lookups.push(element);
          });
          $scope.filterLookups();

        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.filterLookups = function() {
      if ($scope.data.lookups === null) {return;}
      $log.log("Refreshing filtered lookups.")
      $scope.data.filteredLookups = $scope.data.lookups.filter($scope.nodesFilter);

      $scope.refreshGraph();
    };

    $scope.refreshGraph = function() {

      // Setup data tabel headers
      $scope.data.headers = []
      $scope.data.headers.concat([$scope.selection.node])
      $scope.data.headers.concat($scope.selection.attributes);

      // setup graph data
      $scope.data.chartLabels = [];
      $scope.data.chartData = [];
      $scope.data.datasetOverride = [];
      for (var i= 0; i<$scope.selection.attributes.length; i++) {
        $scope.data.chartData.push([]);
        $scope.data.datasetOverride.push({label: $scope.selection.attributes[i].name, borderWidth: 1, type: 'bar'});
      };
      angular.forEach($scope.data.filteredLookups, function(value, key) {
        $scope.data.chartLabels.push(value.name.split(".").slice(-1)[0])
        for (var i= 0; i<$scope.selection.attributes.length; i++) {
          var attr = $scope.selection.attributes[i].name;
          if (angular.isArray(value.attributes[attr])){
            if (value.attributes[attr].length >= 1) {
              $log.log("multiple values, the first one will be used ");
              $scope.data.chartData[i].push(value.attributes[attr][0]);
            }
            else {
              $scope.data.chartData[i].push(0);
            }
          }
          else {
            $scope.data.chartData[i].push(value.attributes[attr]);
          }
        }
      })

      $log.log($scope.data.datasetOverride);
      $log.log($scope.data.chartLabels);
      $log.log($scope.data.chartData);
    };



    $scope.toggleNodesFilter = function() {
      $scope.nodesFiltered = !$scope.nodesFiltered;
    };

    $scope.nodesFilter = function(node) {
      if ($scope.selection.names === undefined) {
        return true;
      }
      return $scope.selection.names.indexOf(node.name) !== -1;
    };

    $scope.transformChip = function(chip) {
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }
    };
    /**
     * Search for entries.
     */
    $scope.attrSearch = function (query) {
        var results = query ? $scope.data.attributes.filter($scope.createFilterFor(query)) : [];
      return results;
    };
    /**
     * Create filter function for a query string
     */
    $scope.createFilterFor = function(query) {
      var lowercaseQueries = angular.lowercase(query).split(' ');

      return function filterFn(attribute) {
        var match = true;
        angular.forEach(lowercaseQueries, function(lowercaseWord) {
          if (attribute.name.toLowerCase().indexOf(lowercaseWord) == -1) {match = false; return};
        });
        return match;
      };

      return function filterFn(attribute) {
        return (attribute.name.toLowerCase().indexOf(lowercaseQuery) > 0);
      };
    };

    $scope.groupFilter = function (item) {
        return true;
        return $scope.selection.group.indexOf(item) !== 0;
    };
  }
  ]);

}());
