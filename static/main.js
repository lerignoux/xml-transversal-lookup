(function () {

  'use strict';

  angular.module('TransversalLookupApp', ['ngMaterial', 'md.data.table', 'chart.js'])
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .dark();
  })
  .controller('LookupController', ['$scope', '$log', '$http', '$filter',
    function($scope, $log, $http, $filter) {
      $log.log("Controller initialiation");
      $scope.data = {
        "uid": null,
        "databases": null,
        "node_types": null,
        "nodes": [],
        "nodesGroups": [],
        "attributes": [],
        "attributesGroups": [],
        "headers": []
      };

      $scope.selection = {
        "database": null,
        "node_type": null,
        "nodes": [],
        "nodesGroup": null,
        "attributes": [],
        "attributesGroup": null,
      };

      $scope.filteredData = {
        "all": {},
        "nodes": [],
        "attributes": [],
        "values": []
      };

      $scope.selectionChanged = false;
      $scope.advancedSearch = false;

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
      $scope.getNodeTypes();
    };

    $scope.getNodeTypes = function() {
      $http.get('/nodes', {params: {uid: $scope.data.uid, database: $scope.selection.database}}).
        success(function(results) {
          $log.log("Nodes fetched");
          $scope.data.node_types = results.all;
          $scope.selection.node_type = results.default;
          $scope.getNodes();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getNodes = function() {
      $http.get('/nodes/names', {params: {uid: $scope.data.uid, database: $scope.selection.database}}).
        success(function(results) {
          $log.log("Nodes fetched");
          $scope.data.nodes = results;
          $scope.$watch('selection.nodes', function(newValue, oldValue) {
            $log.log("Node selected: " + newValue);
            $scope.refreshContent();
          }, true);

          $scope.selection.nodes = results;

          $scope.getNodesGroups();
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.nodeSelected = function(name) {
      return ($scope.selection.nodes.indexOf(name) >= 0)
    }

    $scope.toggleNode = function(name) {
      var idx = $scope.selection.nodes.indexOf(name);
      if (idx !== -1) {
        $scope.selection.nodes.splice(idx, 1);
      }
      else {
        $scope.selection.nodes.push(name)
      }
    }

    $scope.getNodesGroups = function() {
      $http.get('/nodes/groups', {params: {uid: $scope.data.uid, database: $scope.selection.database}}).
        success(function(results) {
          $log.log("Nodes groups fetched");
          $scope.data.nodesGroups = results;
          $scope.getAttributes();

          $scope.$watch('selection.nodesGroup', function(newValue, oldValue) {
            $log.log("New node group selected: " + newValue);
            if (newValue == "All") {
              $scope.selection.nodes = $scope.data.nodes;
              return;
            }
            if (newValue == "None") {
              $scope.selection.nodes = [];
              return;
            }
            if ($scope.data.nodesGroups[newValue] !== undefined) {
              $scope.selection.nodes = $scope.data.nodesGroups[newValue];
            }
          }, true);

        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.getAttributes = function() {
      $http.get('/nodes/attributes', {params: {uid: $scope.data.uid, database: $scope.selection.database, node: $scope.selection.node_type.id}}).
        success(function(results) {
          $log.log("Attributes fetched");
          $scope.data.attributes = results;
          $scope.transformAttributes();

          $scope.$watch('selection.attributes', function(newValue, oldValue) {
            $log.log("Attribute selected: " + newValue);
            $scope.selectionChanged = true;
            $scope.refreshContent();
          }, true);

          $scope.getAttributesGroups()
        }).
        error(function(error) {
          $log.log(error);
        });
    }

    $scope.transformAttributes = function() {
    $log.log("transform attributes");
      // Transform attributes objects into list to make search easier
      $scope.data.attributesList = [];
      angular.forEach($scope.data.attributes, function(attributes, node) {
        var attrList = [];
        angular.forEach(attributes, function(value, attr) {
          attrList.push({'attribute': attr, 'value': value});
        });
        if (node != 'all') {
          $scope.data.attributesList.push({'node': node, 'attributes': attrList});
        }
      });
    }

    $scope.getAttributesGroups = function() {
      $http.get('/nodes/attributes/groups', {params: {uid: $scope.data.uid, database: $scope.selection.database}}).
        success(function(results) {
          $log.log("Attributes groups fetched");
          $scope.data.attributesGroups = results;

          $scope.$watch('selection.attributesGroup', function(newValue, oldValue) {
            $log.log("New attributes group selected: " + newValue);
            if (newValue !== undefined && $scope.data.attributesGroups[newValue] !== undefined) {
              $scope.selection.attributes = $scope.data.attributesGroups[newValue];
            }
          }, true);

          $log.log("Watchers initialized");
        }).
        error(function(error) {
          $log.log(error);
        });
    };

    $scope.filterNodes = function() {
      if ($scope.selection.nodes === null) {return;}
      $log.log("Filtering nodes.")
      $scope.data.filteredNodes = $scope.data.nodes.filter($scope.nodesFilter);

      //$scope.refreshGraph();
    };

    $scope.refreshContent = function() {
      if ($scope.selection.nodes.length == 0) {
        $log.log("No nodes selected");
        return;
      }
      if ($scope.data.nodes === null) {
        $log.log("No nodes;");
        return;
      }
      if ($scope.selection.attributes.length == 0) {
        $log.log("No attributes selected");
        return;
      }
      if ($scope.data.attributes === null) {
        $log.log("No attributes;");
        return;
      }
      //$scope.data.filteredAttributes = $scope.data.attributes.all.filter($scope.attributesFilter);
      $scope.refreshTable();
      $scope.refreshGraph();
    };


    $scope.refreshTable = function() {
      $scope.filteredData.all= {};
      angular.forEach($scope.data.attributes, function(attributes, node){
        if ($scope.selection.nodes.length == 0 || $scope.selection.nodes.indexOf(node) !== -1) {
          $scope.filteredData.all[node] = {};
          angular.forEach(attributes, function(value, attr){
            if ($scope.selection.attributes.indexOf(attr) !== -1) {
              $scope.filteredData.all[node][attr] = value;
            }
          });
        }
      });
    };

    $scope.refreshGraph = function() {

      // Setup data tabel headers
      $scope.data.headers = []
      $scope.data.headers.concat([$scope.selection.node_type])
      $scope.data.headers.concat($scope.selection.attributes);

      // setup graph data
      $scope.data.chartLabels = [];
      $scope.data.chartData = [];
      $scope.data.datasetOverride = [];
      for (var i= 0; i<$scope.selection.attributes.length; i++) {
        $scope.data.chartData.push([]);
        $scope.data.datasetOverride.push({label: $scope.selection.attributes[i], borderWidth: 1, type: 'bar'});
      };

      angular.forEach($scope.data.attributes, function(attributes, node){
        if ($scope.selection.nodes.length == 0 || $scope.selection.nodes.indexOf(node) !== -1) {
          $scope.data.chartLabels.push(node.split(".").slice(-1)[0])
          for (var i= 0; i<$scope.selection.attributes.length; i++) {
            let attr = $scope.selection.attributes[i];
            if (angular.isArray(attributes[attr])){
              if (attributes[attr].length >= 1) {
                $log.log("multiple values, the first one will be used ");
                $scope.data.chartData[i].push(attributes[attr][0]);
              }
              else {
                $scope.data.chartData[i].push(0);
              }
            }
            else {
              $scope.data.chartData[i].push(attributes[attr]);
            }
          };
        }
      });
    };

    $scope.toggleNodesFilter = function() {
      $scope.nodesFiltered = !$scope.nodesFiltered;
      if ($scope.nodesFiltered == true) {
        $scope.attributesFiltered = false;
      }
    };

    $scope.toggleAttributesFilter = function() {
      $scope.attributesFiltered = !$scope.attributesFiltered;
      if ($scope.attributesFiltered == true) {
        $scope.nodesFiltered = false;
      }
    };

    $scope.toggleAdvancedSearch = function() {
      $scope.advancedSearch = !$scope.advancedSearch;
    };

    $scope.nodesFilter = function(entry) {
      // entry = {"node":"test", "attributes": {"attribute" : "test", "value": }}
      if ($scope.selection.nodes.length == 0) {
        return true;
      }
      return $scope.selection.nodes.indexOf(entry.node) !== -1;
    };

    $scope.attributesFilter = function(entry) {
      // entry = {"attribute" : "test", "value": }
      if ($scope.selection.attributes.length == 0) {
        return false;
      }
      return $scope.selection.attributes.indexOf(entry.attribute) !== -1;
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
    $scope.attrSearch = function (query, selected) {
      if ($scope.data.attributes.all === undefined) {
        return [];
      }
      var results = query ? $scope.data.attributes.all.filter($scope.createFilterFor(query)) : [];

      return results.filter(function (attr) {
        return selected.indexOf(attr) == -1;
      });

    };

    /**
     * Create filter function for a query string
     */
    $scope.createFilterFor = function(query) {
      var lowercaseQueries = angular.lowercase(query).split(' ');

      if ($scope.advancedSearch) {
        return function filterFn(attribute) {
          var match = true;
          angular.forEach(lowercaseQueries, function(lowercaseWord) {
            if (attribute.toLowerCase().indexOf(lowercaseWord) == -1) {match = false; return};
          });
          return match;
        };
      }
      else {
        return function filterFn(attribute) {
          return (attribute.toLowerCase().indexOf(lowercaseQueries) > 0);
        };
      }

    };

    $scope.clearCache = function () {
        if ($scope.selectionChanged == true) {
          $scope.selectionChanged = false;
          return true;
        }
        return false;
    };

    $scope.groupFilter = function (item) {
        return true;
        return $scope.selection.group.indexOf(item) !== 0;
    };
  }
  ]);

}());
