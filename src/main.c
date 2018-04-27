#include "mgos.h"
#include "mgos_mqtt.h"
#include "mgos_rpc.h"
#include "mgos_ir.h"

const unsigned int LED = 2;

static void led_timer_cb(void *arg) {
  bool val = mgos_gpio_toggle(LED);
  LOG(LL_INFO, ("%s uptime: %.2lf, RAM: %lu, %lu free", val ? "Tick" : "Tock",
                mgos_uptime(), (unsigned long) mgos_get_heap_size(),
                (unsigned long) mgos_get_free_heap_size()));
  (void) arg;
}

static void net_cb(int ev, void *evd, void *arg) {
  switch (ev) {
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

  (void) evd;
  (void) arg;
}

static void button_cb(int pin, void *arg) {
  char topic[100], message[100];
  struct json_out out = JSON_OUT_BUF(message, sizeof(message));
  snprintf(topic, sizeof(topic), "/devices/%s/events",
           mgos_sys_config_get_device_id());
  json_printf(&out, "{total_ram: %lu, free_ram: %lu}",
              (unsigned long) mgos_get_heap_size(),
              (unsigned long) mgos_get_free_heap_size());
  bool res = mgos_mqtt_pub(topic, message, strlen(message), 1, false);
  LOG(LL_INFO, ("Pin: %d, published: %s", pin, res ? "yes" : "no"));
  (void) arg;
}

/* RPC callback for remote call of "IRRemoteControl" */
// static void http_over_ir_send(struct mg_rpc_request_info *ri,
// 				  void *cb_arg, 
// 				  struct mg_rpc_frame_info *fi,
// 				  struct mg_str args) {
	
// }

/* IR send procedure */
// static void ir_output () {
	
// }

static void real_ir_input(int code, void *arg)
{
  LOG(LL_INFO, ("IR: %08X", code));
  (void) arg;
}



// static void mgos_sys_reboot_handler() {
//   int delay_ms = 100;
//   json_scanf(args.p, args.len, ri->args_fmt, &delay_ms);
//   if (delay_ms < 0) {
//     mg_rpc_send_errorf(ri, 400, "invalid delay value");
//     ri = NULL;
//     return;
//   }
//   mgos_system_restart_after(delay_ms);
//   mg_rpc_send_responsef(ri, NULL);
//   ri = NULL;
//   (void) cb_arg;
//   (void) fi;
// }

enum mgos_app_init_result mgos_app_init(void) {
  /* Blink built-in LED every second */
  mgos_gpio_set_mode(LED, MGOS_GPIO_MODE_INPUT);
  mgos_set_timer(1000, MGOS_TIMER_REPEAT, led_timer_cb, NULL);


  /* Publish to MQTT on button press */
  mgos_gpio_set_button_handler(mgos_sys_config_get_pins_button(),
                               MGOS_GPIO_PULL_UP, MGOS_GPIO_INT_EDGE_NEG, 200,
                               button_cb, NULL);

  /* Network connectivity events */
  mgos_event_add_group_handler(MGOS_EVENT_GRP_NET, net_cb, NULL);
  
  /* Remote HTTP call */
  // mgos_rpc_add_handler()
  // void *mgos_rpc_add_handler(const char *method, mgos_rpc_eh_t (*)(void *, char *, char *, cb_arg), cb_arg);
  // mgos_rpc_add_handler("IRRemoteControl" /* Command */, http_over_ir_send /* Callback */, NULL /* Params */);
  
  mgos_irrecv_nec_create(5 /* LED GPIO PIN */, real_ir_input /* Callback */, NULL);
 
  return MGOS_APP_INIT_SUCCESS;
}
