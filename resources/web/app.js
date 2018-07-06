var app = angular.module("IRRemoteController", ["ngPatternRestrict"]);

app
    .config(['$httpProvider', function($httpProvider) {
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};    
        }

        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }])
    .factory("RestService",["$http", "$log", "$q", function ($http, $log, $q) {
        var factory = {};

        function httpRequest(url, method, data){
            var startTime = new Date().getTime();
            return $http({
                method: method,
                url: url,
                data: data
            }).then(function (response) {
                logResponse(url, data, response, startTime);
                return response;
            })
        }

        factory.getDevicesConfig = function () {
            return httpRequest("/rc-config.json", "GET");
        };

        factory.saveDevicesConfig = function (object) {
            var objectJson = JSON.stringify(object);
            var chunks = objectJson.match(/.{1,200}/g);
            var promise = $q.all([]);
            var first = chunks.length;
            angular.forEach(chunks, function (chunk) {
                promise = promise.then(function () {
                    return httpRequest("/rpc/FS.Put", "POST", {
                        "filename": "rc-config.json",
                        "append": (first--)<chunks.length,
                        "data": btoa(chunk)
                    });
                });
            });
            
            return promise;
        };

        factory.sendIRButton = function (button) {
            return httpRequest("/rpc/IRRemoteControl", "POST", button);
        };

        factory.getLastIRButtons = function (lastPressedButton) {
            return httpRequest("/rpc/IRGetLastButtons", "GET");
        };

        function logResponse(url, data, response, startTime) {
            try {
                var format = "[%1$s]: ";
                if (data) {
                    format += "data:%2$o, ";
                }
                format += "response:%3$o, time: %4$dms";
                $log.log(format, url, data, response.data, (new Date().getTime() - startTime));
            } catch (ignore) {}
        }

        return factory;
    }])
    .controller("MainController",['$scope', '$interval', 'RestService', function ($scope, $interval, restService) {
        var $ctrl = this;
        $ctrl.state = {
            page: 'USAGE',
            isLoading: true,
            isError: false,
            isTimeout: false
        };
        $ctrl.devices = [];
        $ctrl.buttonsPressed = [];
        $ctrl.dbgMessage= "";

        restService
            .getDevicesConfig()
            .then(function(response) {
                $ctrl.devices = response.data;
                selectDevice($ctrl.devices[0]);
            }, function(response) {
                console.error(response);
            })
            .finally(function(){
                $ctrl.state.isLoading = false;
            });    
        
        $ctrl.useDevice = function(device) {
            selectDevice(device);
            $ctrl.state.page = "USAGE";
        };

        $ctrl.configureDevice = function(device) {
            selectDevice(device);
            $ctrl.state.page = "CONFIGURE";
        };

        function selectDevice(device) {
            $ctrl.selectedDevice = device;
        }

        $ctrl.moveObject = function(array, start, delta) {
            var newIndex = start + delta;
            while (start < 0) {
                start += array.length;
            }
            while (newIndex < 0) {
                newIndex += array.length;
            }
            if (newIndex >= array.length) {
                var k = newIndex - array.length + 1;
                while (k--) {
                    array.push(undefined);
                }
            }
            array.splice(newIndex, 0, array.splice(start, 1)[0]);
        };

        $ctrl.addRow = function (index) {
            var arr = $ctrl.selectedDevice.buttons;
            arr.splice(index, 0, []);
        };

        $ctrl.removeRow = function (index) {
            var arr = $ctrl.selectedDevice.buttons;
            arr.splice(index, 1);
        };

        $ctrl.addButton = function (buttonRow) {
            var arr = $ctrl.selectedDevice.buttons;
            buttonRow.push({});
        };

        $ctrl.removeButton = function (buttonRow) {
            buttonRow.pop();
        };

        $ctrl.saveChanges = function () {
            $ctrl.state.isLoading = true;
            restService
                .saveDevicesConfig($ctrl.devices)
                .then(function (response){
                    console.log('success');
                }, function(){

                })
                .finally(function() {
                    $ctrl.state.isLoading = false;
                });
        };
        
        

        // $interval(function () {
        //     restService.getLastIRButtons()
        //         .then(function (response) {
        //             $ctrl.buttonsPressed = $ctrl.buttonsPressed.concat(response.data);
        //         }, function (response) {
        //             console.log("Error:",response);
        //         });
        // }, 1000);


    }])
    .component('rcButton', {
        templateUrl: "/rc-button.component.html",
        controller: ["RestService", "$element", "$window", "$timeout", "$log", RcButtonController],
        controllerAs: "$ctrl",
        bindings: {
            button: '<'
        }
    })
    .component('rcButtonConfigure', {
        templateUrl: "/rc-button-configure.component.html",
        controller: ["RestService", "$element", "$window", "$timeout", "$log", "$scope", RcButtonConfigureController],
        controllerAs: "$ctrl", 
        bindings: {
            button: '='
        }
    });
function RcButtonController(restService, $element, $window, $timeout, $log) {
    var $ctrl = this;
    $ctrl.processing = false;

    $element.on("click", function () {
        if($ctrl.processing || $ctrl.button.hidden) {
            return;
        }

        $ctrl.processing = true;
        $element.addClass('_focus');

        restService.sendIRButton($ctrl.button.action)
            .then(function (response) {
                $log.log("IR command sent: ", response);
            }, function (response) {
                $log.log("Failed to send IR command: ", response);
            }).finally(function () {
                $timeout(function () {
                    $ctrl.processing = false;
                    $element.removeClass('_focus');
                }, 150);
            });
    });
}
function RcButtonConfigureController(restService, $element, $window, $timeout, $log, $scope) {
    var $ctrl = this;
    var actionPattern = /^(\d+[,]{0,1}){0,}$/;
    var prevAction = {};

    $ctrl.$onInit = function() {
        initActionString();
    };

    $ctrl.$doCheck = function() {
        if(!angular.equals($ctrl.button.action, prevAction)) {
            initActionString();
        }
    };

    function initActionString() {
        prevAction = angular.copy($ctrl.button.action);
        $ctrl.actionString = $ctrl.button.action.join(',');
    }

    $ctrl.recalcAction = function () {
        // avoid run before symbols are replaced
        if(!$ctrl.actionString.match(actionPattern))
            return;

        $ctrl.button.action = $ctrl.actionString
                                .replace(/\,{2,}/gm, ",")
                                .replace(/(^\,+|\,+$)/gm, "")
                                .split(',').map(function(item){ return Number(item.trim()); });
    };
}