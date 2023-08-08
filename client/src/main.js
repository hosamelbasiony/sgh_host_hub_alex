import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./registerServiceWorker";
import vuetify from "./plugins/vuetify";
import moment from 'moment'

Vue.config.productionTip = false;
Vue.config.silent = true;

Vue.prototype.moment = moment

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
