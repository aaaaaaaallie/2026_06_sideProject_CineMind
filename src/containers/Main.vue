<template>
    <main id="main">
        <router-view></router-view>
    </main>
</template>
<style lang="scss">
#main {

    position: relative;
    width: 100%;
    height: auto;
    min-height: calc(var(--vh, 1vh) * 100);
    margin: 0 auto;
    z-index: 1;

    // padding-top: 64px;
    .page {
        width: 100%;
        height: auto;
        min-height: calc(var(--vh, 1vh) * 100);
    }

}

.section {
    position: relative;

    @include tablet {}
}

.section__inner {
    position: relative;
    @include inner;
    @include tablet {}
}
</style>