var roombaSimApp = angular.module(
  'roombaSimApp', ['ngCookies', 'ngWebSocket', 'ui.codemirror']
);
roombaSimApp.controller('roombaSimController', function ($scope, $cookies, $http, $websocket, $window, $timeout) {
  var robotRadiusMm = 173.5, pxPerMm = 0.1, dataStream;

  function processRobotInstruction(instruction) {
    switch (instruction.c) {
      case 'mv':
        $scope.pos.top = (instruction.t - robotRadiusMm) * pxPerMm + 'px';
        $scope.pos.left = (instruction.l - robotRadiusMm) * pxPerMm + 'px';
        $scope.pos.transform = 'rotate(' + instruction.o + 'rad)';
        break;

      case 'msg':
        $timeout(
          function() {$window.alert(instruction.m)},
          300
        );
        break;
    }
  }

  function establishWebsocketConnection() {
    dataStream = $websocket(
      (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/simulation'
    );
    dataStream.onMessage(function(message) {
      processRobotInstruction(JSON.parse(message.data));
    });
    dataStream.onClose(function() {
      dataStream = null;
    });
  }

  // TODO Initialize from server
  $scope.pos = {
    left: '233px',
    top: '233px'
  };

  $scope.editorOptions = {
    lineWrapping: true,
    lineNumbers: true,
    matchBrackets: true,
    mode: 'text/x-java'
  };

  $scope.runSimulation = function() {
    if (!dataStream) establishWebsocketConnection();
    dataStream.send($scope.code);
  };


  $scope.code = $cookies.get('code');
  if (!$scope.code) {
    $http({
      method: 'GET',
      url: location.protocol + '//' + location.host + '/assets/java/TemplateRobot.java'
    }).
    then(
      function successCallback(response) {
        $scope.code = response.data;
      },
      function errorCallback(response) {
        console.log('Error obtaining template source:');
        console.log('status: ' + response.status);
        console.log('data: ' + response.data);
      }
    )
  }
});
