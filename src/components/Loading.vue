<template>
  <div id="loading">
    <div class="loader">
      <svg class="circular" viewBox="25 25 50 50">
        <circle
          class="path"
          cx="50"
          cy="50"
          fill="none"
          r="20"
          stroke-miterlimit="10"
          stroke-width="3"
        ></circle>
      </svg>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'Loading',
});
</script>

<style lang="scss" scoped>
#loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 4;
  background: rgba(#000000, 0.75);
  // backdrop-filter: blur(vwM(10)) brightness(0.7);
  @include tablet {
  }

  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    margin: -40px 0 0 -40px;

    &::before {
      content: '';
      display: block;
      padding-top: 100%;
    }

    .circular {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: auto;
      animation: rotate 2s linear infinite;
      transform-origin: center center;

      .path {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
        animation: dash 1.5s ease-in-out infinite,
          color 4.5s ease-in-out infinite;
        stroke-linecap: round;
      }
    }
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35px;
    }
    100% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124px;
    }
  }

  @keyframes color {
    100%,
    0% {
      stroke: #fff;
    }
    // 34% {
    // 	stroke: #fd040c;
    // }
    // 67% {
    // 	stroke: #0090ff;
    // }
  }
}
</style>
