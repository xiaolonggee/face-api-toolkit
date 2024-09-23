<template>
  <div v-cloak>
    <div class="Camera-wrapper" :style="{ width: width + 7 + 'px', height: height + 7 + 'px' }">
      <div class="canvas-wrapper" :style="{ width: width + 'px', height: height + 'px' }">
        <video
          ref="video"
          :width="width"
          :height="height"
          webkit-playsinline="true"
          playsinline="true"
          preload
          autoplay
          loop
          muted
        ></video>
        <canvas ref="canvas" :width="width" :height="height"></canvas>
      </div>
      <van-circle
        v-model="currentRate"
        :style="{ width: width + 7 + 'px', height: height + 7 + 'px' }"
        :rate="0"
        :speed="100"
        stroke-width="20"
        layer-color="#ebedf0"
      ></van-circle>
      <canvas ref="canvasImg" id="canvasImg"></canvas>
    </div>
  </div>
</template>
<script>
import * as vant from 'vant'
import { imageCompress } from '@/utils/imageUtils'
export default {
  name: 'FaceDetection',
  data() {
    return {
      width: 280,
      height: 280,
      currentRate: 0,
      timer: 0,
      mediaStreamTrack: null,
      options: {
        matchedScore: 0.9,
        mediaSize: {
          width: 280,
          height: 280
        }
      }
    }
  },
  mounted() {
    const size = (document.documentElement.clientWidth || window.innerWidth) * 0.6
    this.width = size > 280 ? 280 : size
    this.height = size > 280 ? 280 : size
    // 一堆兼容代码
    this.compatible()
    this.openUserMedia()
  },
  methods: {
    // 一堆兼容代码
    compatible() {
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {}
      }
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = constraints => {
          var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
          if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
          }
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject)
          })
        }
      }
    },
    //打开摄像头
    async openUserMedia() {
      const isOpen = await this.getUserMedia()
      if (isOpen.code == 'ok') {
        await this.createDetector()
        this.$toast(`摄像头已打开`)
      } else {
        vant.Dialog.alert({
          title: '失败',
          message: `打开摄像头失败：${isOpen.errMsg}`,
          theme: 'round-button'
        }).then(() => {
          location.replace(`${location.pathname}?s=${new Date().getTime()}`)
        })
        return
      }
    },
    isObjEmpty(obj) {
      return (
        obj === undefined ||
        obj === 'undefined' ||
        obj == null ||
        obj === '' ||
        obj.length === 0 ||
        (typeof obj === 'object' && Object.keys(obj).length === 0)
      )
    },
    getUserMedia() {
      return new Promise(async resolve => {
        this.inProgress = false
        this.isCameraOpen = false
        this.blob = null
        const toast = vant.Toast.loading({
          duration: 0, // 持续展示 toast
          forbidClick: true,
          message: '打开摄像头'
        })
        let mediaOpts = {
          audio: false,
          video: {
            width: this.width,
            height: this.height,
            frameRate: {
              ideal: 100,
              max: 150
            } //最佳帧率
          }
        }
        if (this.isObjEmpty(this.deviceId)) {
          mediaOpts.video.facingMode = 'user' //前置摄像头
          // mediaOpts.video.facingMode = "environment"; //后置摄像头
        } else {
          mediaOpts.video.deviceId = this.deviceId
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia(mediaOpts)
          this.mediaStreamTrack = stream
          //获取设备
          this.deviceList = (await this.getDevice()) || []
          let video = this.$refs['video']
          video.pause()
          video.setAttribute('playsinline', true) // required to tell iOS safari we don't want fullscreen
          if ('srcObject' in video) {
            video.srcObject = stream
          } else {
            video.src = (window.URL && window.URL.createObjectURL(stream)) || stream
          }
          video.play()
          video.onplay = () => {
            toast.clear()
            this.isCameraOpen = true
            resolve({ code: `ok` })
          }
        } catch (error) {
          toast.clear()
          console.error(error)
          resolve({ errMsg: error })
        }
      })
    },
    //获取设备信息
    getDevice() {
      return new Promise(async resolve => {
        const toast = vant.Toast.loading({
          duration: 0, // 持续展示 toast
          forbidClick: true,
          message: '获取设备中'
        })
        try {
          const devicesList = await navigator.mediaDevices.enumerateDevices()
          const arr = []
          ;(devicesList || []).forEach(e => {
            e.name = e.label || e.deviceId
            if (e.kind === 'videoinput' && e.deviceId && !e.name.includes('麦克风')) {
              e.color = e.deviceId == this.deviceId ? '#1989fa' : '#323233'
              arr.push(e)
            }
          })
          toast.clear()
          console.log(arr)
          resolve(arr)
        } catch (error) {
          toast.clear()
          console.log(error)
          resolve([])
        }
      })
    },
    async createDetector() {
      await faceapi.loadTinyFaceDetectorModel('/face-api/models')
      let mediaOpts = {
        audio: false,
        video: {
          width: this.width,
          height: this.height,
          frameRate: {
            ideal: 100,
            max: 150
          } //最佳帧率
        }
      }
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.mediaStreamTrack = await navigator.mediaDevices.getUserMedia(mediaOpts)
        } else if (navigator.webkitGetUserMedia) {
          this.mediaStreamTrack = await navigator.webkitGetUserMedia(mediaOpts)
        } else if (navigator.mozGetUserMedia) {
          this.mediaStreamTrack = await navigator.mozGetUserMedia(mediaOpts)
        } else if (navigator.getUserMedia) {
          this.mediaStreamTrack = await navigator.getUserMedia(mediaOpts)
        }
        let video = this.$refs['video']
        video.pause()
        video.setAttribute('playsinline', true) // required to tell iOS safari we don't want fullscreen
        if ('srcObject' in video) {
          video.srcObject = this.mediaStreamTrack
        } else {
          video.src = (window.URL && window.URL.createObjectURL(this.mediaStreamTrack)) || this.mediaStreamTrack
        }
        video.play()
        video.onplay = () => {
          this.isCameraOpen = true
          this.initVideo()
        }
      } catch (error) {
        this.mediaErrorCallback(error)
      }
    },
    initVideo() {
      this.$refs.video.onplay = () => {
        this.onPlay()
      }
      this.$refs.video.srcObject = this.mediaStreamTrack
      setTimeout(() => this.onPlay(), 300)
    },
    mediaErrorCallback(error) {
      const errorMap = {
        NotAllowedError: '摄像头已被禁用，请在当前浏览器设置中开启后重试',
        AbortError: '硬件问题，导致无法访问摄像头',
        NotFoundError: '未检测到可用摄像头',
        NotReadableError: '操作系统上某个硬件、浏览器或者网页层面发生错误，导致无法访问摄像头',
        OverConstrainedError: '未检测到可用摄像头',
        SecurityError: '摄像头已被禁用，请在系统设置或者浏览器设置中开启后重试',
        TypeError: '类型错误，未检测到可用摄像头'
      }
      alert(errorMap[error.name] || '未知错误')
    },
    async onPlay() {
      if (this.$refs.video && (this.$refs.video.paused || this.$refs.video.ended)) {
        this.timer = setTimeout(() => this.onPlay())
        return
      }
      const faceDetectionTask = await faceapi.detectSingleFace(
        this.$refs.video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.6
        })
      )

      if (faceDetectionTask) {
        this.drawFaceBox(this.$refs.video, this.$refs.canvas, [faceDetectionTask], faceDetectionTask.score)
        if (faceDetectionTask.score > this.options.matchedScore) {
          console.log(`检测到人脸，匹配度大于 ${this.options.matchedScore}`)
          // this.showEl(this.$el.querySelector('.operation'))
          // this.$refs.video.pause()
          // this.compare()
          // return
        }
      }
      this.timer = setTimeout(() => this.onPlay())
    },
    drawFaceBox(dimensions, trackBox, detections, score) {
      // this.showEl(trackBox)
      trackBox.width = this.width
      trackBox.height = this.height
      const resizedDetections = detections.map(res => res.forSize(trackBox.width, trackBox.height))
      const faceBoxOpts =
        score > this.options.matchedScore
          ? {
              lineWidth: 2,
              textColor: 'green',
              boxColor: 'green',
              withScore: true
            }
          : {
              lineWidth: 2,
              textColor: 'red',
              boxColor: 'red',
              withScore: true
            }
      faceapi.drawDetection(trackBox, resizedDetections, faceBoxOpts)
      // this.currentRate = 100
      this.compare()
    },
    async compare() {
      this.$refs.canvasImg
        .getContext('2d')
        .drawImage(this.$refs.video, 0, 0, this.$refs.canvasImg.width, this.$refs.canvasImg.height)
      let images = this.$refs.canvasImg.toDataURL('image/png')
      try {
        const base64 = await new Promise((resolve, reject) => {
          imageCompress(images, 0.9, 300, 400, base64 => {
            resolve(base64)
          })
        })
        const imgElement = document.createElement('img')
        imgElement.src = base64
        imgElement.alt = 'Base64 Image'
        const options = this.getFaceDetectorOptions(512, 0.5)
        const detections = await faceapi.detectAllFaces(imgElement, options)
        if (detections.length > 0) {
          const faceImages = await faceapi.extractFaces(imgElement, detections)
          let img = faceImages[0].toDataURL('image/png')
          const input = await faceapi.fetchImage(img)
          let descriptors = await faceapi.computeFaceDescriptor(input)
          faceapi.euclideanDistance(descriptors, descriptors.desc2)
          console.log('11111', descriptors)
        }
      } catch (e) {
        console.log(e)
        // this.retry()
      }
    },
    getFaceDetectorOptions(inputSize, scoreThreshold) {
      return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
    }
  }
}
</script>

<style scoped lang="scss">
[v-cloak] {
  opacity: 0 !important;
}
.Camera-wrapper {
  margin: 1em auto;
  position: relative;
  overflow: hidden;
}
.van-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.canvas-wrapper {
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
}

.canvas-wrapper > video {
  background: #000;
  border-radius: 50%;
  overflow: hidden;
}

.canvas-wrapper > canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  border-radius: 50%;
  overflow: hidden;
}
</style>
