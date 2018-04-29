var app = angular.module("IRRemoteController", []);

app
    .constant('DEVICES', [{
            id: 'TOSHIBA_TV',
            name: 'Toshiba TV',
            buttons: [
                [
                    {name: 'Source', icon: 'fa fa-sign-in fa-3x', action: [50145495]},
                    {name: 'Mute', icon: 'fa fa-volume-off fa-3x', action: [50137335]},
                    {name: 'I/O', icon: 'fa fa-power-off fa-3x', action: [50153655]}
                ], [
                    {name: '\\/', action: [50152635]},
                    {name: 'Text', icon: 'fa fa-align-justify fa-2x', action: [50194455]},
                    {name: 'Subtitle', icon: 'fa fa-comments-o fa-2x', action: [50147535]},
                    {name: 'PiP', icon: 'fa fa-object-group fa-2x' , action: [50186295]}
                ], [
                    {name: '1', action: [50167935]},
                    {name: '2', action: [50151615]},
                    {name: '3', action: [50184255]}
                ], [
                    {name: '4', action: [50143455]},
                    {name: '5', action: [50176095]},
                    {name: '6', action: [50159775]}
                ], [
                    {name: '7', action: [50192415]},
                    {name: '8', action: [50139375]},
                    {name: '9', action: [50172015]}
                ], [
                    {name: 'AD', action: [50153145]},
                    {name: '0', action: [50135295]},
                    {name: 'A/D TV', action: [50143965]}
                ], [
                    {name: 'Vol+', icon: 'fa fa-volume-up fa-3x', action: [50157735]},
                    {name: 'Info', icon: 'fa fa-info-circle fa-3x', action: [50161815]},
                    {name: 'Page+', icon: 'fa fa-caret-right fa-3x fa-rotate-270', action: [50190375]}
                ], [
                    {name: 'Vol-', icon: 'fa fa-volume-down fa-3x', action: [50165895]},
                    {name: 'Quick', icon: 'fa fa-magic fa-3x', action: [50185785]},
                    {name: 'Page-', icon: 'fa fa-caret-right fa-rotate-90 fa-3x', action: [50198535]}
                ], [
                    {name: 'Guide', action: [50176605]},
                    {name: 'Up', action: [50174055]},
                    {name: 'Exit', action: [50184765]}
                ], [
                    {name: 'Left', action: [50152125]},
                    {name: 'OK', action: [50168955]},
                    {name: 'Right', action: [50135805]}
                ], [
                    {name: 'Menu', action: [50190885]},
                    {name: 'Down', action: [50182215]},
                    {name: 'Return', action: [50144985]}
                ], [
                    {name: 'Red', action: [50139885]},
                    {name: 'Green', action: [50172525]},
                    {name: 'Yellow', action: [50156205]},
                    {name: 'Blue', action: [50188845]}
                ], [
                    {name: '?1?', action: [50146005]},
                    {name: '?2?', action: [50186805]},
                    {name: '?3?', action: [50180175]},
                    {name: '?4?', action: [50178135]}
                ],
            ]
        }, {
            id: 'TV_BOX',
            name: 'TV BOX',
            buttons: [
                [
                    {name: 'I/O', action: [0x00, 0x00, 0x00]},
                    null,
                    {name: 'Mute', action: [0x00, 0x00, 0x00]}
                ], [
                    {name: '1', action: [0x00, 0x00, 0x00]},
                    {name: '2', action: [0x00, 0x00, 0x00]},
                    {name: '3', action: [0x00, 0x00, 0x00]}
                ], [
                    {name: '4', action: [0x00, 0x00, 0x00]},
                    {name: '5', action: [0x00, 0x00, 0x00]},
                    {name: '6', action: [0x00, 0x00, 0x00]}
                ], [
                    {name: '7', action: [0x00, 0x00, 0x00]},
                    {name: '8', action: [0x00, 0x00, 0x00]},
                    {name: '9', action: [0x00, 0x00, 0x00]}
                ], [
                    {name: 'FAV', action: [0x00, 0x00, 0x00]},
                    {name: '0', action: [0x00, 0x00, 0x00]},
                    {name: 'SAT', action: [0x00, 0x00, 0x00]}
                ], [
                    null,
                    {name: 'UP', action: [0x00, 0x00, 0x00]},
                    null
                ], [
                    {name: 'LEFT', action: [0x00, 0x00, 0x00]},
                    {name: 'OK', action: [0x00, 0x00, 0x00]},
                    {name: 'RIGHT', action: [0x00, 0x00, 0x00]}
                ], [
                    null,
                    {name: 'DOWN', action: [0x00, 0x00, 0x00]},
                    null
                ],
            ]
        }, {
            id: 'AIR_CONDITIONER',
            name: 'Air Conditioner',
            buttons: [
                [{name: 'I/O', action: [0x00, 0x00, 0x00]}, null, null, null],
                [{name: 'I/O', action: [0x00, 0x01, 0x00]}, null, null],
            ]
        }])
    .factory("RestService",["$http", "$log", function ($http, $log) {
        var factory = {};
        var restUrl = "/rpc/";

        function httpRequest(url, method, data){
            var startTime = new Date().getTime();
            return $http({
                method: method,
                url: restUrl + url,
                data: data
            }).then(function (response) {
                logResponse(restUrl, data, response, startTime);
                return response;
            })
        }

        factory.getDevicesConfig = function () {
            return httpRequest("GetDevicesConfig", "GET");
        };

        factory.sendIRButton = function (button) {
            return httpRequest("IRRemoteControl", "POST", button);
        };

        factory.getLastIRButtons = function (lastPressedButton) {
            return httpRequest("IRGetLastButtons", "GET");
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
    .controller("MainController",['DEVICES', '$scope', '$interval', 'RestService', function (DEVICES, $scope, $interval, restService) {
        var $ctrl = this;
        $ctrl.devices = DEVICES;
        $ctrl.dbgMessage= "";
        $ctrl.buttonsPressed = [];

        $interval(function () {
            restService.getLastIRButtons({timestamp:0})
                .then(function (response) {
                    $ctrl.buttonsPressed = $ctrl.buttonsPressed.concat(response.data);
                }, function (response) {
                    console.log("Error:",response);
                });
        }, 1000);


    }])
    .component('rcButton', {
        templateUrl: "/rc-button.component.html",
        controller: ["RestService", "$element", "$window", "$timeout", "$log", RcButtonController],
        controllerAs: "$ctrl",
        bindings: {
            button: '<'
        }
    });
function RcButtonController(restService, $element, $window, $timeout, $log) {
    var $self = this;
    $self.processing = false;

    $element.on("click", function () {
        if($self.processing) {
            return;
        }

        $self.processing = true;
        $element.addClass('_focus');

        restService.sendIRButton($self.button.action)
            .then(function (response) {
                $log.log("IR command sent: ", response);
            }, function (response) {
                $log.log("Failed to send IR command: ", response);
            }).finally(function () {
                $timeout(function () {
                    $self.processing = false;
                    $element.removeClass('_focus');
                }, 150);
            });
    });
}