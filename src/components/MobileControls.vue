<template>
  <div v-if="isMobile" class="mobile-controls">
    <!-- Virtual Joystick -->
    <div 
      class="joystick-container"
      @touchstart="onJoystickStart"
      @touchmove="onJoystickMove"
      @touchend="onJoystickEnd"
      @touchcancel="onJoystickEnd"
      @mousedown="onJoystickStart"
      @mousemove="onJoystickMoveMouse"
      @mouseup="onJoystickEnd"
      @mouseleave="onJoystickEnd"
    >
      <div class="joystick-base">
        <div 
          class="joystick-stick"
          :style="joystickStyle"
        ></div>
      </div>
    </div>

    <!-- Interact Button -->
    <button
      class="interact-btn"
      @touchstart="onInteractStart"
      @touchend="onInteractEnd"
      @touchcancel="onInteractEnd"
      @mousedown="onInteractStart"
      @mouseup="onInteractEnd"
      @mouseleave="onInteractEnd"
    >
      <span>Interact</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Core from "@/application/core";

const props = defineProps<{
  core?: Core;
}>();

const isMobile = ref(false);
const joystickActive = ref(false);
const joystickPosition = ref({ x: 0, y: 0 });
const joystickCenter = ref({ x: 0, y: 0 });
const joystickMaxDistance = 50;
const joystickTouchId = ref<number | null>(null);

const joystickStyle = computed(() => {
  return {
    transform: `translate(${joystickPosition.value.x}px, ${joystickPosition.value.y}px)`,
    opacity: joystickActive.value ? 1 : 0.5
  };
});

const detectMobile = () => {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  isMobile.value = hasTouch || isMobileDevice || isSmallScreen;
};

const emitKeyDown = (key: string) => {
  if (props.core) {
    props.core.control.simulateKeyDown(key as any);
  }
};

const emitKeyUp = (key: string) => {
  if (props.core) {
    props.core.control.simulateKeyUp(key as any);
  }
};

const onJoystickStart = (e: TouchEvent | MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  let clientX: number, clientY: number;
  
  if (e instanceof TouchEvent) {
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
    joystickTouchId.value = touch.identifier;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
    joystickTouchId.value = -1;
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  joystickCenter.value = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  joystickActive.value = true;
  updateJoystickPosition(clientX, clientY);
};

const onJoystickMove = (e: TouchEvent) => {
  if (!joystickActive.value || joystickTouchId.value === null) return;
  e.preventDefault();
  e.stopPropagation();
  
  let touch = null;
  if (joystickTouchId.value !== -1) {
    touch = Array.from(e.touches).find(t => t.identifier === joystickTouchId.value);
  }
  if (!touch) {
    touch = e.touches[0] || e.changedTouches[0];
  }
  if (!touch) return;
  
  updateJoystickPosition(touch.clientX, touch.clientY);
};

const onJoystickMoveMouse = (e: MouseEvent) => {
  if (!joystickActive.value || joystickTouchId.value !== -1) return;
  e.preventDefault();
  e.stopPropagation();
  
  if (e.buttons === 1) {
    updateJoystickPosition(e.clientX, e.clientY);
  }
};

const onJoystickEnd = (e: TouchEvent | MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  let shouldEnd = false;
  if (e instanceof TouchEvent) {
    const touch = e.changedTouches[0];
    if (touch && joystickTouchId.value !== null && touch.identifier === joystickTouchId.value) {
      shouldEnd = true;
    }
  } else {
    shouldEnd = true;
  }
  
  if (shouldEnd) {
    joystickActive.value = false;
    joystickTouchId.value = null;
    joystickPosition.value = { x: 0, y: 0 };
    emitKeyUp("KeyW");
    emitKeyUp("KeyS");
    emitKeyUp("KeyA");
    emitKeyUp("KeyD");
  }
};

const updateJoystickPosition = (clientX: number, clientY: number) => {
  const deltaX = clientX - joystickCenter.value.x;
  const deltaY = clientY - joystickCenter.value.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  let x = deltaX;
  let y = deltaY;
  
  if (distance > joystickMaxDistance) {
    x = (deltaX / distance) * joystickMaxDistance;
    y = (deltaY / distance) * joystickMaxDistance;
  }
  
  joystickPosition.value = { x, y };
  
  const threshold = 15;
  
  emitKeyUp("KeyW");
  emitKeyUp("KeyS");
  emitKeyUp("KeyA");
  emitKeyUp("KeyD");
  
  if (Math.abs(y) > threshold) {
    if (y < 0) {
      emitKeyDown("KeyW");
    } else {
      emitKeyDown("KeyS");
    }
  }
  
  if (Math.abs(x) > threshold) {
    if (x < 0) {
      emitKeyDown("KeyA");
    } else {
      emitKeyDown("KeyD");
    }
  }
};

const onInteractStart = (e: TouchEvent | MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  emitKeyDown("KeyF");
  
  // Trigger interaction immediately
  if (props.core) {
    const intersect = props.core.world.interaction_detection.getIntersectObj();
    if (intersect && intersect.userData.type === "portal") {
      if (intersect.userData.destination) {
        props.core.world.character.teleport(intersect.userData.destination);
      }
    }
  }
};

const onInteractEnd = (e: TouchEvent | MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  emitKeyUp("KeyF");
};

onMounted(() => {
  detectMobile();
  window.addEventListener("resize", detectMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", detectMobile);
  if (props.core) {
    emitKeyUp("KeyW");
    emitKeyUp("KeyS");
    emitKeyUp("KeyA");
    emitKeyUp("KeyD");
    emitKeyUp("KeyF");
  }
});
</script>

<style scoped>
.mobile-controls {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.joystick-container {
  position: fixed;
  bottom: 120px;
  left: 30px;
  width: 120px;
  height: 120px;
  pointer-events: auto;
  touch-action: none;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.joystick-base {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.joystick-stick {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 255, 255, 1);
  position: absolute;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: opacity 0.2s;
}

.interact-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  min-width: 100px;
  height: 60px;
  border: none;
  border-radius: 12px;
  background: rgba(33, 150, 243, 0.9);
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0.3);
}

.interact-btn:active {
  transform: scale(0.95);
  background: rgba(33, 150, 243, 0.7);
}

.interact-btn span {
  pointer-events: none;
}

@media (max-width: 480px) {
  .joystick-container {
    bottom: 100px;
    left: 20px;
    width: 100px;
    height: 100px;
  }
  
  .joystick-stick {
    width: 40px;
    height: 40px;
  }
  
  .interact-btn {
    bottom: 20px;
    right: 20px;
    min-width: 90px;
    height: 50px;
    font-size: 14px;
  }
}
</style>