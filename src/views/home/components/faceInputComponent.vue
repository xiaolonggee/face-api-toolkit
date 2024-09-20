<template>
  <div class="Camera-wrapper" :style="{ width: width + 7 + 'px', height: height + 7 + 'px' }">
    <div class="canvas-wrapper" :style="{ width: width + 'px', height: height + 'px' }">
      <video
        ref="videoEl"
        id="videoEl"
        :webkit-playsinline="true"
        :playsinline="true"
        preload
        autoplay
        loop
        muted
      ></video>
      <canvas ref="trackBox" id="trackBox" :width="width" :height="height" style="opacity: unset"></canvas>
    </div>
    <canvas ref="canvasImg" id="canvasImg"></canvas>
    <van-dialog
      v-model="showDialog"
      title="保存人脸图"
      show-cancel-button
      cancelButtonText="重试"
      @confirm="confirmDialog"
      @cancel="cancelDialog"
    >
      <div class="flex flex-col justify-center">
        <van-notice-bar text="请保存无口罩无墨镜的正脸照。" class="text-center" />
        <div class="flex items-center justify-center mt-2 mb-2">
          <van-image :src="faceImg" width="127" height="145" />
        </div>
        <van-cell-group>
          <van-field v-model="userid" error required label="用户Id" placeholder="请输入自定义用户Id" />
        </van-cell-group>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { imageCompress } from '@/utils/imageUtils'
export default {
  name: 'FaceDetection',
  data() {
    return {
      userid: '',
      faceImg: null,
      width: 280,
      height: 280,
      showDialog: false,
      options: {
        matchedScore: 0.9,
        mediaSize: {
          width: 280,
          height: 280
        }
      },
      timer: null,
      mediaStreamTrack: null
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    confirmDialog() {
      let currentUserFaceInfo = {
        id: this.userid,
        src: this.faceImg
      }
      let arrUser = []
      arrUser.push(currentUserFaceInfo)
      localStorage.setItem('currentImg', JSON.stringify(arrUser))
      // this.retry()
      this.showDialog = false
      this.$parent.$parent.faceDetectionFlag = false
    },
    cancelDialog() {
      this.retry()
    },
    init() {
      this.resize()
      this.initDetection()
    },
    resize() {
      const elements = [this.$refs.videoEl, this.$refs.canvasImg]
      elements.forEach(el => {
        el.width = this.options.mediaSize.width
        el.height = this.options.mediaSize.height
      })
      const wraperEl = this.$el
      wraperEl.style.width = `${this.options.mediaSize.width}px`
      wraperEl.style.height = `${this.options.mediaSize.height}px`
    },
    async initDetection() {
      await faceapi.loadTinyFaceDetectorModel('/face-api/models')
      const mediaOpt = { video: true }
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.mediaStreamTrack = await navigator.mediaDevices.getUserMedia(mediaOpt)
        } else if (navigator.webkitGetUserMedia) {
          this.mediaStreamTrack = await navigator.webkitGetUserMedia(mediaOpt)
        } else if (navigator.mozGetUserMedia) {
          this.mediaStreamTrack = await navigator.mozGetUserMedia(mediaOpt)
        } else if (navigator.getUserMedia) {
          this.mediaStreamTrack = await navigator.getUserMedia(mediaOpt)
        }
        this.initVideo()
      } catch (error) {
        this.mediaErrorCallback(error)
      }
    },
    initVideo() {
      this.$refs.videoEl.onplay = () => {
        this.onPlay()
      }
      this.$refs.videoEl.srcObject = this.mediaStreamTrack
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
      if (this.$refs.videoEl && (this.$refs.videoEl.paused || this.$refs.videoEl.ended)) {
        this.timer = setTimeout(() => this.onPlay())
        return
      }

      const faceDetectionTask = await faceapi.detectSingleFace(
        this.$refs.videoEl,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.6
        })
      )

      if (faceDetectionTask) {
        this.drawFaceBox(this.$refs.videoEl, this.$refs.trackBox, [faceDetectionTask], faceDetectionTask.score)
        if (faceDetectionTask.score > this.options.matchedScore) {
          console.log(`检测到人脸，匹配度大于 ${this.options.matchedScore}`)
          // this.showEl(this.$el.querySelector('.operation'))
          this.$refs.videoEl.pause()
          this.compare()
          return
        }
      }
      this.timer = setTimeout(() => this.onPlay())
    },
    drawFaceBox(dimensions, trackBox, detections, score) {
      this.showEl(trackBox)
      trackBox.width = this.options.mediaSize.width
      trackBox.height = this.options.mediaSize.height
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
    },
    showEl(el) {
      el.style.visibility = 'visible'
    },
    hideEl(el) {
      el.style.visibility = 'hidden'
    },
    retry() {
      if (this.$refs.videoEl.paused || this.$refs.videoEl.ended) {
        this.showDialog = false
        this.$refs.videoEl.play()
      }
    },
    async compare() {
      this.$refs.canvasImg
        .getContext('2d')
        .drawImage(this.$refs.videoEl, 0, 0, this.$refs.canvasImg.width, this.$refs.canvasImg.height)
      let images = this.$refs.canvasImg.toDataURL('image/png')
      try {
        const base64 = await new Promise((resolve, reject) => {
          imageCompress(images, 0.9, 600, 600, base64 => {
            resolve(base64)
          })
        })
        const imgElement = document.createElement('img')
        imgElement.src = base64
        imgElement.alt = 'Base64 Image'
        const options = this.getFaceDetectorOptions(512, 0.5)
        const detections = await faceapi.detectAllFaces(imgElement, options)
        const faceImages = await faceapi.extractFaces(imgElement, detections)
        let img = faceImages[0].toDataURL('image/png')
        this.showDialog = true
        this.faceImg = img
      } catch (e) {
        this.retry()
      }
    },
    getFaceDetectorOptions(inputSize, scoreThreshold) {
      return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
    },
    displayExtractedFaces(faceImages) {
      const facesContainer = this.$refs.facesContainer
      facesContainer.innerHTML = ''
      faceImages.forEach(canvas => {
        facesContainer.appendChild(canvas)
      })
    }
  }
}
</script>

<style scoped>
img,
video {
  width: 100%;
  height: 100%;
}
.Camera-wrapper {
  margin: 3rem auto;
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
::v-deep .van-notice-bar__wrap {
  justify-content: center;
}
</style>
