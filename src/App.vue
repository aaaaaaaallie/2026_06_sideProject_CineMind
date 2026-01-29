<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Loading from './components/Loading.vue';
import Main from './containers/Main.vue';
import Header from './components/Header.vue';
import PleaseNote from './components/PleaseNote.vue';
import Warning from './popups/Warning.vue';
import { useMainStore } from '@/store/main';

const mainStore = useMainStore();
const isLoading = computed(() => mainStore.isLoading);
const isPopup = ref(false);
const isPopupReady = ref(false);
const popupEl = ref(null);
const container = ref(null);

const setCssVariable = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

const onResize = () => {
  setCssVariable();
};
const onPopupBeforeEnter = () => {
  let scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop || 0;
  isPopup.value = true;
  // isPopupReady.value = true;
  container.value.style.top = -scrollTop + 'px';
  window.scrollTo(0, 0);
};
const onPopupAfterEnter = () => {
  isPopupReady.value = true;
};
const onPopupBeforeLeave = () => {
  isPopupReady.value = false;
  popupEl.value.classList.remove('popup--ready');
};
const onPopupAfterLeave = async () => {
  const containerTop = Math.abs(parseInt(container.value.style.top));
  isPopup.value = false;
  isPopupReady.value = false;
  container.value.style.top = 0 + 'px';
  await nextTick();
  window.scrollTo(0, containerTop);
};

onMounted(() => {
  setCssVariable();
  window.addEventListener('resize', onResize);
  console.log(container);

  window.addEventListener('load', () => {
    setTimeout(() => {
      mainStore.setLoading(false); // 關閉 loading
    }, 250);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <div id="app">
    <transition name="fade">
      <Loading v-if="isLoading"></Loading>
    </transition>

    <div id="container" :class="{ 'is-popup': isPopup }" ref="container">
      <Header></Header>
      <Main></Main>
      <PleaseNote></PleaseNote>
    </div>
    <transition
      name="fade"
      @before-enter="onPopupBeforeEnter"
      @after-enter="onPopupAfterEnter"
      @before-leave="onPopupBeforeLeave"
      @after-leave="onPopupAfterLeave"
    >
      <div
        id="popup"
        v-if="mainStore.popup"
        :class="[{ 'popup--ready': isPopupReady }]"
        ref="popupEl"
      >
        <div class="popup__container">
          <Warning v-if="mainStore.popup === 'warning'"></Warning>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
:root {
  --move-y: 50px;
  --header-height: #{vhX(135)};

  @include tablet {
    --move-y: #{vw(50)};
    --header-height: #{vw(100)};
  }
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @include tablet {
  }
}

#container {
  position: relative;
  width: 100%;
  margin: 0 auto;

  @include tablet {
  }

  &.is-popup {
    position: fixed;
  }
}

.disabled {
  position: relative;

  a {
    opacity: 0.2;
    pointer-events: none;
  }
}

input[type='text'],
select,
button {
  font-family: $fontFamilyNotoSans;
  font-weight: 500;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  outline: 0;
  appearance: none;
}

select {
  // height: vwXL(70);
  // color: #eb623c;
  // font-size: vwXL(27);
  // font-weight: 700;
  // letter-spacing: vwXL(letterSpacing(50, 27));
  // padding-right: vwXL(70);
  // padding-bottom: vwXL(2);
  // padding-left: vwXL(15);
  // border: #f8e577 vwXL(4) solid;
  // background: url('~@/assets/images/common/dropdowns_arrow.png') right vwXL(17) top vwXL(20) #fff no-repeat;
  // background-size: vwXL(49) vwXL(25);
  // cursor: pointer;

  @include tablet {
    // height: vwM(70);
    // font-size: vwM(40);
    // letter-spacing: vwM(letterSpacing(50, 40));
    // padding-right: vwM(0);
    // padding-bottom: vwM(2);
    // padding-left: vwM(25);
    // border-width: vwM(4);
    // background-position: right vwM(16) top vwM(20);
    // background-size: vwM(49) vwM(25);
  }
}

button {
  height: vwXL(70);
  color: #eb623c;
  font-size: vwXL(27);
  font-weight: 700;
  letter-spacing: vwXL(letterSpacing(50, 27));
  padding-right: vwXL(22);
  padding-bottom: vwXL(2);
  padding-left: vwXL(24);
  background: #f8e577;
  cursor: pointer;

  @include tablet {
    height: vwM(70);
    font-size: vwM(36);
    letter-spacing: vwM(letterSpacing(50, 36));
    padding-right: vwM(0);
    padding-bottom: vwM(2);
    padding-left: vwM(0);
  }
}

::placeholder {
  color: #999999;
  opacity: 1;
}

:-ms-input-placeholder {
  color: #999999;
}

::-ms-input-placeholder {
  color: #999999;
}

#popup {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  // min-height: 100%;
  min-height: calc(var(--vh, 1vh) * 100);
  z-index: 2;

  &.fade-leave-active {
  }
}

.popup__container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  height: auto;
  // min-height: 100%;
  min-height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;
  background: rgba(#000, 0.7);
  // background: rgba(#eb623c, 0.9);

  @include tablet {
  }
}

.popup__main {
  display: flex;
  flex-direction: column;
  position: relative;
  color: #fff;
  margin: vwXL(100) 0;

  @include tablet {
    margin: vwM(100) 0;
  }
}

.popup__basic {
  width: vwXL(1175);
  min-height: vwXL(588);
  background: #fdf2ef;

  @include tablet {
    width: vwM(884);
    height: auto;
    // height: calc(var(--vh, 1vh) * 100 - vwM(170 * 2));
    min-height: 0;
    // min-height: vwM(900);
    margin: vwM(170) 0;
  }

  &--full {
    @include tablet {
      // min-height: calc(var(--vh, 1vh) * 100 - vwM(170 * 2));
      height: calc(var(--vh, 1vh) * 100 - vwM(170 * 2));
      min-height: vwM(900);
    }
  }

  .popup__content {
    color: #eb623c;
    padding: 0 vwXL(80);

    @include tablet {
      padding: 0 vwM(74);
    }
  }

  .popup__title {
    display: flex;
    align-items: center;
    justify-content: center;

    padding: vwXL(60) 0 0;

    @include tablet {
      padding: vwM(78) 0 0;
    }

    p {
      color: #e72910;
      font-size: vwXL(47);
      font-weight: 700;
      text-align: center;
      letter-spacing: vwXL(letterSpacing(50, 47));
      transform: scaleX(1.05);

      @include tablet {
        font-size: vwM(68);
        letter-spacing: vwM(letterSpacing(50, 68));
      }
    }
  }
}

.popup__header {
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.popup__close {
  position: absolute;
  top: 0;
  right: 0;
  width: vwXL(78);
  height: vwXL(78);
  // background: url('~@/assets/images/common/popup_close.png') center center no-repeat;
  background-size: contain;
  z-index: 1;

  @include tablet {
    width: vwM(68);
    height: vwM(68);
  }
}

// .popup__main .popup__content {
.popup__main {
  opacity: 0;
  transform: translateY(vwM(0));
  transition: all 0.5s ease;
  transition-property: opacity, transform;
}

// #popup.popup--ready .popup__main .popup__content {
#popup.popup--ready .popup__main {
  opacity: 1;
  transform: translateY(0);
}

.move-in {
  @include moveFadeDefault($value: var(--move-y));

  @at-root .section.play .move-in {
    @include moveFadeIn();
  }
}

.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
  transition-duration: 0.5s;
  transition-timing-function: ease;
}

.fade-enter-active {
  transition-delay: 0s;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
