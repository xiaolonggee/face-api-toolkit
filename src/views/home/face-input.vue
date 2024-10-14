<template>
  <div>
    <van-uploader v-model="fileList" result-type="dataUrl" capture :max-count="1" />
    <van-image :src="headImg" width="30%" />
    <van-uploader v-model="fileLists" result-type="dataUrl" capture :max-count="1" />
    <van-image :src="headImgRri" width="30%" />
    <van-button @click="updateResult">识别</van-button>
    {{ text }}
  </div>
</template>
<script>
export default {
  name: 'FaceInput',
  data() {
    return {
      fileList: [],
      fileLists: [],
      headImg: null,
      headImgRri: null,
      minConfidence: 0.5,
      descriptors: { desc1: null, desc2: null },
      threshold: 0.4,
      text: ''
    }
  },
  watch: {
    fileList: {
      immediate: true,
      deep: true,
      handler: function (fileList) {
        if (fileList.length > 0) {
          this.checkImg(fileList[0].content)
        }
      }
    },
    fileLists: {
      immediate: true,
      deep: true,
      handler: function (fileLists) {
        if (fileLists.length > 0) {
          this.checkImgs(fileLists[0].content)
        }
      }
    }
  },
  created() {
    this.initModal()
  },
  methods: {
    async sameImg(val) {
      const headImg = new Image()
      headImg.src = this.headImg
      this.descriptors.desc1 = await faceapi.computeFaceDescriptor(headImg)
      const headImgRri = new Image()
      headImgRri.src = val
      this.descriptors.desc2 = await faceapi.computeFaceDescriptor(val)
    },
    /**
     * 加载模型
     */
    async initModal() {
      await faceapi.loadSsdMobilenetv1Model('/face-api/models')
      await faceapi.loadFaceRecognitionModel('/face-api/models')
    },

    async checkImgs(val) {
      debugger
      const options = this.getFaceDetectorOptions()
      const img = new Image()
      // 设置img的src属性为base64字符串
      img.src = val

      const detections = await faceapi.detectAllFaces(img, options)
      const faceImages = await faceapi.extractFaces(img, detections)
      const imgs = new Image()
      // 将canvas的内容转换为Data URL
      imgs.src = faceImages[0].toDataURL()
      this.sameImg(imgs)
    },
    async checkImg(val) {
      debugger
      const options = this.getFaceDetectorOptions()
      const img = new Image()
      // 设置img的src属性为base64字符串
      img.src = val

      const detections = await faceapi.detectAllFaces(img, options)
      const faceImages = await faceapi.extractFaces(img, detections)
      const imgs = new Image()
      // 将canvas的内容转换为Data URL
      imgs.src = faceImages[0].toDataURL()
      this.headImg = imgs.src
    },
    getFaceDetectorOptions() {
      return new faceapi.SsdMobilenetv1Options({ minConfidence: this.minConfidence })
    },
    updateResult() {
      const distance = faceapi.utils.round(faceapi.euclideanDistance(this.descriptors.desc1, this.descriptors.desc2))
      let text = distance
      if (distance > this.threshold) {
        text += ' (不匹配)'
      } else {
        text += ' (匹配)'
      }
      this.text = text
    }
  }
}
</script>

<style scoped lang="scss"></style>
