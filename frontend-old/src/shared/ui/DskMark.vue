<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    variant?: 'mark' | 'full'
    animated?: boolean
  }>(),
  { size: 'md', variant: 'full', animated: false },
)

const logoClasses = computed(() => {
  if (props.variant === 'mark') {
    return props.size === 'sm' ? 'h-8 w-8' : props.size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'
  }
  return props.size === 'sm'
    ? 'h-8 w-[110px]'
    : props.size === 'lg'
      ? 'h-16 w-[220px]'
      : 'h-12 w-[165px]'
})

const viewBox = computed(() => (props.variant === 'mark' ? '0 0 64 64' : '0 0 220 64'))
</script>

<template>
  <span
    class="dsk-logo block shrink-0 overflow-hidden"
    :class="[logoClasses, { 'dsk-logo--animated': animated }]"
    role="img"
    aria-label="ДСК"
  >
    <svg class="block size-full overflow-visible" :viewBox="viewBox" aria-hidden="true">
      <g class="dsk-logo__cube">
        <path
          class="dsk-logo__left-face"
          d="M6 23.2 30 36.7v23L6 46.2Z"
          fill="#e7ebec"
          stroke="#cfd7da"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path
          class="dsk-logo__right-face"
          d="m30 36.7 24-13.5v23l-24 13.5Z"
          fill="#25a6df"
          stroke="#178fc8"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path class="dsk-logo__top-shadow" d="M6 19.2 30 5.6l24 13.6-24 13.6Z" fill="#d5dadd" />
        <path
          class="dsk-logo__top-face"
          d="M8.2 17.6 30 5.3l21.8 12.3L30 29.9Z"
          fill="#ff8a13"
          stroke="#f07300"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path class="dsk-logo__top-light" d="M12.3 17.6 30 7.6l17.7 10L30 27.5Z" fill="#ff9e2f" />
        <path
          class="dsk-mark__facade dsk-logo__details"
          d="M11 30.2v13.2l6 3.4V33.6Zm11 6.2v13.2l5 2.8V39.2Z"
          fill="#fff"
        />
        <path class="dsk-logo__details" d="m35 40 14-7.9v11.7L35 51.7Z" fill="#e8f7fd" />
        <path class="dsk-logo__details" d="m38.8 41.5 6.8-3.8v7.1l-6.8 3.8Z" fill="#58bce8" />
        <path class="dsk-logo__scan" d="M9 17.6 30 5.7l21 11.9" fill="none" stroke="#fff" />
      </g>

      <g v-if="variant === 'full'" class="dsk-logo__word" fill="#10456f">
        <path
          class="dsk-logo__letter dsk-logo__letter--d"
          fill-rule="evenodd"
          d="M73 47h5.2c3.9-9.4 6.1-21.1 6.6-35h31.7v35h7.5v11h-9v-5H82v5h-9Zm15.2 0h18.9V19.7H93.3c-.8 10.2-2.5 19.3-5.1 27.3"
          clip-rule="evenodd"
        />
        <path
          class="dsk-logo__letter dsk-logo__letter--s"
          d="M173.6 42.1a24.4 24.4 0 0 1-13.1 3.6c-11.5 0-18.6-5-18.6-13.1 0-8.2 7.1-13.2 18.6-13.2 4.8 0 9.2 1.2 13.1 3.6l4.2-7.4a35.6 35.6 0 0 0-17.8-4.5c-17.1 0-28.8 8.5-28.8 21.5 0 12.9 11.7 21.4 28.8 21.4 6.8 0 12.7-1.5 17.8-4.5Z"
        />
        <path
          class="dsk-logo__letter dsk-logo__letter--k"
          d="M184.2 12h9.4v16.5L208.5 12h11.7l-18.8 20.1L221 53h-12.3l-15.1-17.1V53h-9.4Z"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.dsk-logo__cube,
.dsk-logo__top-face,
.dsk-logo__top-light,
.dsk-logo__top-shadow,
.dsk-logo__left-face,
.dsk-logo__right-face,
.dsk-logo__details,
.dsk-logo__letter {
  transform-box: fill-box;
  transform-origin: center;
}

.dsk-logo__scan {
  opacity: 0;
  stroke-dasharray: 52;
  stroke-dashoffset: 52;
  stroke-linecap: round;
  stroke-width: 1.6;
}

.dsk-logo--animated .dsk-logo__top-shadow {
  animation: dsk-top-shadow-in 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__top-face,
.dsk-logo--animated .dsk-logo__top-light {
  animation: dsk-top-in 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__left-face {
  animation: dsk-left-in 720ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__right-face {
  animation: dsk-right-in 720ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__details {
  animation: dsk-details-in 420ms 330ms ease-out both;
}

.dsk-logo--animated .dsk-logo__scan {
  animation: dsk-scan-in 620ms 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__letter {
  animation: dsk-letter-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dsk-logo--animated .dsk-logo__letter--d {
  animation-delay: 280ms;
}

.dsk-logo--animated .dsk-logo__letter--s {
  animation-delay: 350ms;
}

.dsk-logo--animated .dsk-logo__letter--k {
  animation-delay: 420ms;
}

.dsk-logo:hover .dsk-logo__scan {
  animation: dsk-scan-hover 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dsk-top-shadow-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.9);
  }
}

@keyframes dsk-top-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.82);
  }
}

@keyframes dsk-left-in {
  from {
    opacity: 0;
    transform: translateX(-9px) skewY(8deg);
  }
}

@keyframes dsk-right-in {
  from {
    opacity: 0;
    transform: translateX(9px) skewY(-8deg);
  }
}

@keyframes dsk-details-in {
  from {
    opacity: 0;
    transform: scale(0.75);
  }
}

@keyframes dsk-scan-in {
  0% {
    opacity: 0;
    stroke-dashoffset: 52;
  }
  35% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    stroke-dashoffset: 0;
  }
}

@keyframes dsk-letter-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
    clip-path: inset(0 100% 0 0);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes dsk-scan-hover {
  0% {
    opacity: 0;
    stroke-dashoffset: 52;
  }
  35% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dsk-logo--animated .dsk-logo__top-shadow,
  .dsk-logo--animated .dsk-logo__top-face,
  .dsk-logo--animated .dsk-logo__top-light,
  .dsk-logo--animated .dsk-logo__left-face,
  .dsk-logo--animated .dsk-logo__right-face,
  .dsk-logo--animated .dsk-logo__details,
  .dsk-logo--animated .dsk-logo__scan,
  .dsk-logo--animated .dsk-logo__letter,
  .dsk-logo:hover .dsk-logo__scan {
    animation: none;
  }
}
</style>
