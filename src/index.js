import Vue from 'vue';

import App from './App.vue';

Vue.config.productionTip = true;

new Vue({
  render: function (h) {
    return h(App);
  },
}).$mount('#app');
