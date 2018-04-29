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
let irReceiverPin = Cfg.get('pins.receiver');
let irSenderPin = Cfg.get('pins.sender');
let topic = '/devices/' + Cfg.get('device.id') + '/events';
let buttonBuffer = [];

GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(irSenderPin, GPIO.MODE_OUTPUT);

//GPIO.set_mode(irSenderPin, GPIO.);
let ir = IR.Receiver.NEC.create(irReceiverPin, function(code) {
	if (IR_MODE.RECEIVING !== currentIrMode) {
		print('Removing IR self-fire.');
		return;
	}
	
	print("IR", code);
	buttonBuffer.push({
		timestamp: Sys.uptime(),
		code: code
	});
}, null);

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
	print("Receive Button: ", JSON.stringify(args));
	
	for(let index = 0; index<args.length; index++) {
		IR.Sender.NEC.pwm(irSenderPin, args[index]);
	}
	
	currentIrMode = IR_MODE.RECEIVING;
	return true;
});

Timer.set(3000, Timer.REPEAT, function() {
	if (buttonBuffer.length > 5) {
		buttonBuffer = [];
	}
}, null);

RPC.addHandler('IRGetLastButtons', function() {
	let clone = JSON.parse(JSON.stringify(buttonBuffer));
	buttonBuffer = [];
	return clone;
});

function getInfo() {
	return JSON.stringify({
		total_ram: Sys.total_ram(),
		free_ram: Sys.free_ram()
	});
};

Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
	let value = GPIO.toggle(led);
	print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
}, null); 
