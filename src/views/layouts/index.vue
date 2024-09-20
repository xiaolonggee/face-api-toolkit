<template>
  <div class="app-container">
    <van-nav-bar
      fixed
      :placeholder="true"
      :safe-area-inset-top="true"
      :title="$route.meta.title"
      :left-text="calcLeftText"
      @click-left="onClickLeft"
      @click-right="onClickRight"
    >
      <template #right v-if="$route.meta.title === '人脸库管理'">
        <van-icon :name="iconRef" size="25" />
      </template>
    </van-nav-bar>
    <div class="layout-content">
      <keep-alive v-if="$route.meta.keepAlive">
        <router-view></router-view>
      </keep-alive>
      <router-view v-else></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppLayout',
  data() {
    return {
      iconRef: require('/static/camera.svg')
    }
  },
  computed: {
    calcLeftText() {
      let leftText = ''
      if (this.$route.meta.title === '首页') {
        leftText = ''
      } else {
        leftText = '返回'
      }
      return leftText
    },
    calcRightText() {
      let rightText = ''
      if (this.$route.meta.title === '人脸库管理') {
        rightText = '添加'
      } else {
        rightText = ''
      }
      return rightText
    }
  },
  methods: {
    onClickLeft() {
      this.$router.back()
    },
    onClickRight() {
      this.$bus.$emit('addUserFace')
    }
  }
}
</script>
