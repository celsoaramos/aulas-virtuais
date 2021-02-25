<template>
  <div class='video-list'>
    <div
      v-for='item in videoList'
      v-bind:video='item'
      v-bind:key='item.id'
      class='video-item'
    >
      <video
        controls
        autoplay
        playsinline
        ref='videos'
        :height='cameraHeight'
        :muted='item.muted'
        :id='item.id'
      ></video>
    </div>
  </div>
</template>

<script>
import RTCMultiConnection from 'rtcmulticonnection';
import RecordRTCPromisesHandler from 'recordrtc';

require('adapterjs');

export default {
  name: 'vue-webrtc',
  components: {
    // RTCMultiConnection,
  },
  data() {
    return {
      rtcmConnection: null,
      localVideo: null,
      videoList: [],
      canvas: null,
      recorder: null,
      stream: null,
    };
  },
  props: {
    roomId: {
      type: String,
      default: 'public-room',
    },
    socketURL: {
      type: String,
      default: 'https://rtcmulticonnection.herokuapp.com:443/',
    },
    cameraHeight: {
      type: [Number, String],
      default: 160,
    },
    autoplay: {
      type: Boolean,
      default: true,
    },
    screenshotFormat: {
      type: String,
      default: 'image/jpeg',
    },
    enableAudio: {
      type: Boolean,
      default: true,
    },
    enableVideo: {
      type: Boolean,
      default: true,
    },
    enableLogs: {
      type: Boolean,
      default: false,
    },
    stunServer: {
      type: String,
      default: null,
    },
    turnServer: {
      type: String,
      default: null,
    },
  },
  watch: {},
  mounted() {
    const that = this;

    this.rtcmConnection = new RTCMultiConnection();
    this.rtcmConnection.socketURL = this.socketURL;
    this.rtcmConnection.autoCreateMediaElement = false;
    this.rtcmConnection.enableLogs = this.enableLogs;
    this.rtcmConnection.session = {
      audio: this.enableAudio,
      video: this.enableVideo,
    };
    this.rtcmConnection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: this.enableAudio,
      OfferToReceiveVideo: this.enableVideo,
    };
    if (this.stunServer !== null || this.turnServer !== null) {
      this.rtcmConnection.iceServers = []; // clear all defaults
    }
    if (this.stunServer !== null) {
      this.rtcmConnection.iceServers.push({
        urls: this.stunServer,
      });
    }
    if (this.turnServer !== null) {
      const parse = this.turnServer.split('%');
      const username = parse[0].split('@')[0];
      const password = parse[0].split('@')[1];
      const turn = parse[1];
      this.rtcmConnection.iceServers.push({
        urls: turn,
        credential: password,
        username,
      });
    }
    this.rtcmConnection.onstream = (stream) => {
      const found = that.videoList.find(
        (video) => video.id === stream.streamid,
      );
      if (found === undefined) {
        const video = {
          id: stream.streamid,
          muted: stream.type === 'local',
        };

        that.videoList.push(video);

        if (stream.type === 'local') {
          that.localVideo = video;
        }
      }

      setTimeout(() => {
        // eslint-disable-next-line no-plusplus
        for (let i = 0, len = that.$refs.videos.length; i < len; i++) {
          if (that.$refs.videos[i].id === stream.streamid) {
            that.$refs.videos[i].srcObject = stream.stream;
            break;
          }
        }
      }, 1000);

      that.$emit('joined-room', stream.streamid);
    };
    this.rtcmConnection.onstreamended = (stream) => {
      const newList = [];
      that.videoList.forEach((item) => {
        if (item.id !== stream.streamid) {
          newList.push(item);
        }
      });
      that.videoList = newList;
      that.$emit('left-room', stream.streamid);
    };

    this.stream = navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    this.recorder = new RecordRTCPromisesHandler(this.stream, {
      type: 'video',
    });
  },
  methods: {
    join() {
      const that = this;
      console.log('this.rtcmConnection', this.rtcmConnection.socketURL);
      console.log('this.roomId', this.roomId);
      this.rtcmConnection.openOrJoin(this.roomId, (isRoomExist, roomid) => {
        console.log('isRoomExist', isRoomExist);
        console.log('roomid', roomid);
        if (isRoomExist === false && that.rtcmConnection.isInitiator === true) {
          that.$emit('opened-room', roomid);
        }
      });
      this.startRecord();
    },
    async startRecord() {
      console.log('entrou!!');
      // const stream = await navigator.mediaDevices.getUserMedia({
      // video: true,
      // audio: true,
      // });
      // const recorder = new RecordRTCPromisesHandler(stream, {
      // type: 'video',
      // });
      console.log('startRecord() - recorder =======');
      this.recorder.startRecording();
      // const sleep = (m) => new Promise((r) => setTimeout(r, m));
      // await sleep(3000);
      // await recorder.stopRecording();
      // const blob = await recorder.getBlob();
      // console.log(blob);
      // invokeSaveAsDialog(blob);
      console.log(this.recorder);
      // this.stream = stream;
      // this.recorder = recorder;
      this.recorder.startRecording();
    },
    leave() {
      this.rtcmConnection.attachStreams.forEach((localStream) => {
        localStream.stop();
      });
      this.videoList = [];
      this.stopRecorder();
    },
    async stopRecorder() {
      this.recorder.stopRecording();
      const blob = await this.recorder.getBlob();
      console.log('blob', blob);
      // invokeSaveAsDialog(blob);
    },
    capture() {
      return this.getCanvas().toDataURL(this.screenshotFormat);
    },
    getCanvas() {
      const video = this.getCurrentVideo();
      if (video !== null && !this.ctx) {
        const canvas = document.createElement('canvas');
        canvas.height = video.clientHeight;
        canvas.width = video.clientWidth;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
      }
      const { ctx, canvas } = this;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas;
    },
    getCurrentVideo() {
      if (this.localVideo === null) {
        return null;
      }
      // eslint-disable-next-line no-plusplus
      for (let i = 0, len = this.$refs.videos.length; i < len; i++) {
        if (this.$refs.videos[i].id === this.localVideo.id) {
          return this.$refs.videos[i];
        }
      }
      return null;
    },
    shareScreen() {
      const that = this;
      if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
        // eslint-disable-next-line no-inner-declarations
        function addStreamStopListener(stream, callback) {
          let streamEndedEvent = 'ended';
          if ('oninactive' in stream) {
            streamEndedEvent = 'inactive';
          }
          stream.addEventListener(
            streamEndedEvent,
            () => {
              callback();
              // eslint-disable-next-line func-names
              // eslint-disable-next-line no-param-reassign
              callback = () => {};
            },
            false,
          );
        }

        // eslint-disable-next-line no-inner-declarations
        function onGettingSteam(stream) {
          that.rtcmConnection.addStream(stream);
          that.$emit('share-started', stream.streamid);

          addStreamStopListener(stream, () => {
            that.rtcmConnection.removeStream(stream.streamid);
            that.$emit('share-stopped', stream.streamid);
          });
        }

        // eslint-disable-next-line no-inner-declarations
        function getDisplayMediaError(error) {
          console.log(`Media error: ${JSON.stringify(error)}`);
        }

        if (navigator.mediaDevices.getDisplayMedia) {
          navigator.mediaDevices
            .getDisplayMedia({ video: true, audio: false })
            .then((stream) => {
              onGettingSteam(stream);
            }, getDisplayMediaError)
            .catch(getDisplayMediaError);
        } else if (navigator.getDisplayMedia) {
          navigator
            .getDisplayMedia({ video: true })
            .then((stream) => {
              onGettingSteam(stream);
            }, getDisplayMediaError)
            .catch(getDisplayMediaError);
        }
      }
    },
  },
};
</script>
<style scoped>
.video-list {
  background: whitesmoke;
  height: auto;
}

.video-list div {
  padding: 0px;
}

.video-item {
  background: #c5c4c4;
  display: inline-block;
}
</style>
