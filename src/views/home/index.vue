<template>
  <div>
    <van-cell-group title="活体检测">
      <van-cell title="活体检测" is-link to="bioassay" />
    </van-cell-group>
    <van-cell-group title="人脸识别">
      <van-cell title="1:N识别" is-link to="faceDetection" />
      <van-cell title="人脸录入" is-link to="faceInput" />
      <van-cell title="人脸库管理" is-link to="faceStore" />
    </van-cell-group>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {}
  },

  methods: {}
}
</script>

<style lang="scss" scoped></style>
