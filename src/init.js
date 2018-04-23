load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_rpc.js');
load("api_ir.js");
load("api_sys.js");
load('api_timer.js');

let IR_MODE = {
  RECEIVING: 0,
  SENDING: 1
};

let currentIrMode = IR_MODE.RECEIVING;
let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';
let buttonBuffer = [];

GPIO.set_mode(led, GPIO.MODE_OUTPUT);
let ir = IR.Receiver.NEC.create(5, function(code) {
    if (IR_MODE.RECEIVING !== currentIrMode) {
      print('Removing IR self-fire.');
      return;
    }
    // GPIO.write(led, 0);
    print("IR", code);
    buttonBuffer.push({
        timestamp: Sys.uptime(),
        code: code
    });
    // GPIO.write(led, 1);
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
    currentIrMode = IR_MODE.SENDING;
    // GPIO.write(led, 0);
    print("Receive Button: ", JSON.stringify(args));
    
    for(let index = 0; index<args.length; index++) {
      IR.Sender.NEC.pwm(4, args[index]);
    }
    
    // GPIO.write(led, 1);
    currentIrMode = IR_MODE.RECEIVING;
    return true;
});

Timer.set(3000 /* 3 sec */, Timer.REPEAT, function() {
    if(buttonBuffer.length>10)
        buttonBuffer = [];
}, null);

RPC.addHandler('IRGetLastButtons', function() {
    // GPIO.write(led, 0);
    let clone = JSON.parse(JSON.stringify(buttonBuffer));
    buttonBuffer = [];
    // GPIO.write(led, 1);
    return clone;
});