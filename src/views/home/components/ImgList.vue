<script>
export default {
  name: 'ImgList',
  props: {
    dataArray: {
      type: Array,
      default: () => {
        return []
      }
    }
  }
}
</script>

<template>
  <div class="flex items-center bg-white flex-wrap justify-around">
    <figure v-for="(item, index) in dataArray" :key="index" class="m-0.5">
      <van-image width="100" height="100" :src="item.src">
        <template v-slot:loading>
          <van-loading type="spinner" size="20" />
        </template>
      </van-image>
      <figcaption class="figcaption-set text-center">{{ item.id }}</figcaption>
    </figure>
  </div>
</template>

<style scoped lang="scss">
.figcaption-set {
  font-size: 0.4rem;
}
</style>
