import WebRTC from './webrtc.vue';

// eslint-disable-next-line no-unused-vars
const install = (Vue, _opts = {}) => {
  if (install.installed) {
    return;
  }
  Vue.component(WebRTC.name, WebRTC);
};

export default {
  install,
  WebRTC,
};

// module.exports.default = module.exports;
