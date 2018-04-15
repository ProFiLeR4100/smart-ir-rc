load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_rpc.js');
load("api_ir.js");

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';

// print('LED GPIO:', led, 'button GPIO:', button);

let ir = IR.Receiver.NEC.create(5, function(code) {
    GPIO.toggle(led);
    print("IR", code);
    GPIO.toggle(led);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

RPC.addHandler('IRRemoteControl', function(args) {
    GPIO.toggle(led);
    print("Receive Button: ", JSON.stringify(args));
    
    for(let index = 0; index<args.length; index++) {
      IR.Sender.NEC.pwm(4, args[index]);
    }
    
    GPIO.toggle(led);
    return true;
});