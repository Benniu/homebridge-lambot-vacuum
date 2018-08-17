var request = require('request');
var uuid = require('uuid');
var Service, Characteristic;

module.exports = function (homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-lambot-vacuum", "Lambot vacuum", myLambot);
};

myLambot.prototype = {

    getServices: function() {
        const me = this;
        let informationService = new Service.AccessoryInformation();
        informationService
          .setCharacteristic(Characteristic.Manufacturer, "Lambot")
          .setCharacteristic(Characteristic.Model, "Lambot V1")
          .setCharacteristic(Characteristic.SerialNumber, me.deviceSn);

        let vacuumService = new Service.Switch(me.deviceName);
        vacuumService
          .getCharacteristic(Characteristic.On)
          .on('get', this.getSwitchOnCharacteristic.bind(this))
          .on('set', this.setSwitchOnCharacteristic.bind(this));

        this.informationService = informationService;
        this.switchService = vacuumService;
        return [informationService, vacuumService];
    },

    getSwitchOnCharacteristic: function (next) {
        const me = this;
        console.log("get status");

        // ToDo: Get device status from Lambot cloud service
        return next(null, 'on');
    },

    setSwitchOnCharacteristic: function (on, next) {
        const me = this;
        const endpoint = "https://cloud.slamtec.com/api/smarthome";

        // Send TurnOn/Off directives to Lambot cloud service
        var requestData = {
           "header": {
               "namespace": "Slamtec.Iot.Device.Control",
               "name": on?"TurnOn":"TurnOff",
               "messageId": uuid.v4(),
               "payLoadVersion": "1"
            },
            "payload": {
                "accessToken":me.apikey,
                "deviceId": me.deviceId
            }
        };
        console.log(JSON.stringify(requestData));
        request({
          url: endpoint,
          body: requestData,
          method: 'POST',
          json: true,
          headers: {'Content-type': 'application/json'}
        },
        function (error, response, body) {
          console.log('body:', body);
          if (error) {
            me.log('STATUS: ' + response.statusCode);
            me.log(error.message);
            return next(error);
          }
          return next();
        });
    }
}

function myLambot(log, config) {
  this.log = log;
  this.apikey = config['apikey'];
  this.deviceId = config['deviceId'];
  this.deviceSn = config['deviceSn'];
  this.deviceName = config['name'];
}
