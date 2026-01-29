import store from '@/store'

export const mixins = {
  methods: {
    isDev() {
      return process.env.VUE_APP_ENV === 'development'
    },
    isStage() {
      return process.env.VUE_APP_ENV === 'stage'
    },
    isProduction() {
      return process.env.VUE_APP_ENV === 'production'
    },
    getParameterByName(search) {
      let name = search.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
      let regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },
    getRandomInt(min, max) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const randomNumber = randomBuffer[0] / (0xffffffff + 1);
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(randomNumber * (max - min + 1)) + min;
    },
    getRandomFloat(min, max) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const randomNumber = randomBuffer[0] / (0xfffffffff + 1);
      min = Math.ceil(min);
      max = Math.floor(max);
      return randomNumber * (min - max) + max;
    },
    // getRandomInt(min, max) {
    //   return Math.floor(Math.random() * (max - min + 1)) + min;
    // },
    // shuffle(array) {
    //   var j, x, i;
    //   for (i = array.length - 1; i > 0; i--) {
    //     j = Math.floor(Math.random() * (i + 1));
    //     x = array[i];
    //     array[i] = array[j];
    //     array[j] = x;
    //   }
    //   return array;
    // },
    setMoveInDelay() {
      const elems = document.querySelectorAll('.move-in');
      elems.forEach((elem, index) => {
        elem.style.transitionDelay = `${index * 0.1}s`;
      })
    },
    preload(array) {
      array.forEach(item => {
        const image = new Image;
        image.src = item;
      })
    },
    loadImages(images) {
      return new Promise((resolve, reject) => {
        let count = 0;
        images.forEach(url => {
          const img = new Image();
          img.addEventListener('load', () => {
            count++;
            if (count === images.length) resolve(images);
          })
          img.addEventListener('error', (e) => { reject(e); })
          img.src = url;
        });
      })
    },
    jumpToTarget(elem) {
      store.dispatch('toggleJump', true)
      store.dispatch('saveJumpTarget', elem)

      // 使用改變 hash 的方式移動頁面時 Chrome 偶爾會有卡住的問題，所以改成以下方式
      // const section = document.getElementById(id);
      // const target = document.querySelector(`#${id} .anchor-target`);
      // const offsetTop = (target !== null) ? section.offsetTop + target.offsetTop : section.offsetTop;

      const header = document.querySelector('#header');
      const isMobile = window.matchMedia('(max-width: 1080px)').matches;
      const offsetTop = elem.offsetTop - (isMobile ? header.offsetHeight : 66.5);

      setTimeout(() => { window.scrollTo({ top: offsetTop, behavior: 'smooth' }) }, 75)

      let promise = new Promise((resolve) => {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.unobserve(elem);
            resolve();
          }
        }, { threshold: 0.5 });
        observer.observe(elem);

        // let timer = setInterval(() => {
        //   const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;
        //   if (
        //     Math.ceil(scrollTop) >= offsetTop - 1 &&
        //     Math.ceil(scrollTop) <= offsetTop + 1
        //     // Math.ceil(scrollTop) == offsetTop ||
        //     // Math.ceil(scrollTop) == offsetTop + 1 ||
        //     // Math.ceil(scrollTop) == offsetTop - 1
        //   ) {
        //     clearInterval(timer);
        //     resolve();
        //   }
        // }, 50)
      })

      promise.then(() => {
        store.dispatch('toggleJump', false)
        store.dispatch('clearJumpTarget')
      });
    },

    sectionInView() {

      const { section } = this.$refs
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.isInView = true;
          this.isViewed = true;
        } else {
          this.isInView = false;
        }
      }, { threshold: 0.1, rootMargin: '-5% 0px -5% 0px' });
      observer.observe(section);

    },

  }
}
