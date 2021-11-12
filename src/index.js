import Vue from 'vue';

import App from '@/App.vue';

Vue.config.productionTip = true;

document.addEventListener('DOMContentLoaded', () => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  new Vue({
    el,
    render: (h) => h(App),
  });
});
