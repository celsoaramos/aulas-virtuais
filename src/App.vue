<template>
  <div class="container">
    <div class="row">
      <div class="col-md-12 my-3">
        <h2>Room</h2>
        <input v-model="roomId">
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="col-md-6">
          <vue-webrtc ref="webrtc"
                      width="100%"
                      :roomId="roomId"
                      v-on:joined-room="logEvent"
                      v-on:left-room="fimTransmissao"
                      v-on:opened-room="logEvent"
                      v-on:share-started="logEvent"
                      v-on:share-stopped="logEvent"
                      @error="onError" />
        </div>
        <div class="col-md-6">
          <video id="video-gravado" controls></video>
        </div>
        <div class="row">
          <div class="col-md-12 my-3">
            <button type="button" class="btn btn-primary" @click="onJoin">Join</button>
            <button type="button" class="btn btn-primary" @click="onLeave">Leave</button>
            <button type="button" class="btn btn-primary" @click="onCapture">Capture Photo</button>
            <button type="button" class="btn btn-primary" @click="onShareScreen">Share</button>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <h2>Captured Image</h2>
        <figure class="figure">
          <img :src="img" class="img-responsive" />
        </figure>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import * as io from 'socket.io-client';
import WebRTC from './webrtc.vue';

// window.io = VueSocketIO;

Vue.use(new VueSocketIO({
  connection: io('https://rtcmulticonnection.herokuapp.com:443/'),
}));

Vue.component(WebRTC.name, WebRTC);

export default {
  name: 'app',
  components: {
  },
  data() {
    return {
      img: null,
      roomId: 'public-room',
      blob: '',
    };
  },
  computed: {
  },
  watch: {
  },
  methods: {
    onCapture() {
      this.img = this.$refs.webrtc.capture();
    },
    onJoin() {
      console.log('etrou onJoin');
      this.$refs.webrtc.join();
    },
    onLeave() {
      this.$refs.webrtc.leave();
    },
    onShareScreen() {
      this.img = this.$refs.webrtc.shareScreen();
    },
    onError(error, stream) {
      console.log('On Error Event', error, stream);
    },
    logEvent(event) {
      console.log('Event : ', event);
    },
    fimTransmissao(event) {
      console.log('evento: ', event);
      this.blob = event;
      const videoGravado = document.getElementById('video-gravado');
      videoGravado.autoplay = true;
      videoGravado.src = window.URL.createObjectURL(this.blob);
    },
  },
};
</script>
