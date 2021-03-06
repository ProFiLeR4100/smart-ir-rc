#include "mgos.h"
#include "mgos_mqtt.h"
#include "mgos_ir.h"
#include "mgos_rpc.h"
// #include "config.h"
#include "PressedButton.h"
#include<string>
#include<sstream>
#include<cmath>

#define pressed_button_buffer_length 10
#define pressed_button_buffer_allowed_length std::floor(pressed_button_buffer_length*0.8d)

PressedButton pressed_button_buffer[pressed_button_buffer_length];


static void fill_buffer_with_zeros()
{
	LOG(LL_DEBUG, ("Filling pressed button buffer with zeros"));
	for (int i = 0; i < pressed_button_buffer_length; i++)
	{
		if (pressed_button_buffer[i].timestamp != 0 || pressed_button_buffer[i].value != 0)
		{
			pressed_button_buffer[i].timestamp = 0;
			pressed_button_buffer[i].value = 0;
		}
	}
}

static unsigned int calc_buffer_filled_items_count()
{
	int length = 0;
	for (int i = 0; i < pressed_button_buffer_length; i++)
	{
		if (pressed_button_buffer[i].timestamp != 0 || pressed_button_buffer[i].value != 0)
		{
			length++;
		}
	}
	return length;
}

/* RPC callback for remote call of "IRGetLastButtons" */
static void http_last_received_ir_cb(struct mg_rpc_request_info *ri, void *cb_arg,
                   struct mg_rpc_frame_info *fi, struct mg_str args) 
{
	std::stringstream sstm;
	sstm << "[";
	// bool first = true;
	for (struct {int iterator; bool first;} s = {0, false}; s.iterator < pressed_button_buffer_length; s.iterator++)
	{
		if (pressed_button_buffer[s.iterator].timestamp != 0 && pressed_button_buffer[s.iterator].value != 0)
		{
			if(!s.first) {
				sstm << ",";
			}

			sstm 
				<< "{timestamp:" 
				<< pressed_button_buffer[s.iterator].timestamp 
				<< ",value:"
				<< pressed_button_buffer[s.iterator].value
				<< "}";

			s.first = false;
		}
	}
	sstm << "]";
	std::string result = sstm.str();
	LOG(LL_INFO, ("RPC call result: %s",result.c_str()));
	fill_buffer_with_zeros();
	mg_rpc_send_responsef(ri, result.c_str());
	
    (void) fi;
    (void) args;
    (void) cb_arg;
}

static void http_get_device_config_cb(struct mg_rpc_request_info *ri, void *cb_arg,
                   struct mg_rpc_frame_info *fi, struct mg_str args) 
{
	mg_rpc_send_responsef(ri, mgos_sys_config_get_rc_devices_config());
    (void) fi;
    (void) args;
    (void) cb_arg;
}

static void http_set_device_config_cb(struct mg_rpc_request_info *ri, void *cb_arg,
                   struct mg_rpc_frame_info *fi, struct mg_str args) 
{

	// std::stringstream sstm;
	// sstm << args.p;

	
	mgos_rpc_send_response(ri, args.p);
    (void) fi;
    (void) args;
    (void) cb_arg;
}


static void led_timer_cb(void *arg)
{
	bool val = mgos_gpio_toggle(mgos_sys_config_get_pins_led());
	LOG(LL_INFO, ("%s uptime: %.2lf, RAM: %lu, %lu free", val ? "Tick" : "Tock",
				  mgos_uptime(), (unsigned long)mgos_get_heap_size(),
				  (unsigned long)mgos_get_free_heap_size()));
	(void)arg;
}


static void led_timer_cb3(void *arg)
{
	mgos_irsend_nec(mgos_sys_config_get_pins_sender(), (int) 0x80BFD12E, 0);
	(void)arg;
}

static void net_cb(int ev, void *evd, void *arg)
{
	switch (ev)
	{
		case MGOS_NET_EV_DISCONNECTED:
			LOG(LL_INFO, ("%s", "Net disconnected"));
			break;
		case MGOS_NET_EV_CONNECTING:
			LOG(LL_INFO, ("%s", "Net connecting..."));
			break;
		case MGOS_NET_EV_CONNECTED:
			LOG(LL_INFO, ("%s", "Net connected"));
			break;
		case MGOS_NET_EV_IP_ACQUIRED:
			LOG(LL_INFO, ("%s", "Net got IP address"));
			break;
	}

	(void)evd;
	(void)arg;
}

static void real_ir_input(int code, void *arg)
{
	LOG(LL_INFO, ("Received IR code: %08X", (unsigned int)code));
	for (int i = 0; i < pressed_button_buffer_length; i++)
	{
		if (pressed_button_buffer[i].timestamp == 0 && pressed_button_buffer[i].value == 0)
		{
			pressed_button_buffer[i].timestamp = mgos_uptime();
			pressed_button_buffer[i].value = (unsigned int)code;
			break;
		}
	}
	(void)arg;
}

static void clear_buffer_cb(void *arg)
{
	if (calc_buffer_filled_items_count() > pressed_button_buffer_allowed_length)
	{
		LOG(LL_DEBUG, ("Ammount of buttons in buffer is exceeded.\nCleaning buffer"));
		fill_buffer_with_zeros();
	}
	(void)arg;
}

enum mgos_app_init_result mgos_app_init(void)
{
	/* Blink built-in LED every second */
	mgos_gpio_set_mode(mgos_sys_config_get_pins_led(), MGOS_GPIO_MODE_OUTPUT);
	mgos_gpio_set_mode(mgos_sys_config_get_pins_sender(), MGOS_GPIO_MODE_OUTPUT);
	mgos_gpio_set_mode(mgos_sys_config_get_pins_receiver(), MGOS_GPIO_MODE_INPUT);

	/* Remove at PROD release */
	mgos_set_timer(1000, MGOS_TIMER_REPEAT, led_timer_cb, NULL);
	mgos_set_timer(5000, MGOS_TIMER_REPEAT, led_timer_cb3, NULL);
	
	mgos_set_timer(3000, MGOS_TIMER_REPEAT, clear_buffer_cb, NULL);

	/* Network connectivity events */
	mgos_event_add_group_handler(MGOS_EVENT_GRP_NET, net_cb, NULL);

	/* IR Receiver events */
	mgos_irrecv_nec_create(mgos_sys_config_get_pins_receiver(), real_ir_input, NULL);

	struct mg_rpc *c = mgos_rpc_get_global();
	mg_rpc_add_handler(c, "ir.get-config", "", http_get_device_config_cb, NULL);
	mg_rpc_add_handler(c, "ir.set-config", "", http_set_device_config_cb, NULL);
	mg_rpc_add_handler(c, "ir.last-received-ir", "", http_last_received_ir_cb, NULL);

	return MGOS_APP_INIT_SUCCESS;
}
