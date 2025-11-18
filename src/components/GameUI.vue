<template>
  <div class="game-ui">
    <!-- FPS Counter -->
    <div v-if="showFPS" class="fps-counter">
      FPS: {{ fps }}
    </div>

    <!-- Controls Help -->
    <div v-if="showControls" class="controls-help nes-container is-rounded is-dark">
      <h3>Controls</h3>
      <div class="controls-list">
        <div class="control-item">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> - Move
        </div>
        <div class="control-item">
          <kbd>Space</kbd> - Jump
        </div>
        <div class="control-item">
          <kbd>C</kbd> - Crouch
        </div>
        <div class="control-item">
          <kbd>Mouse</kbd> - Look around
        </div>
        <div class="control-item">
          <kbd>V</kbd> - Switch perspective
        </div>
        <div class="control-item">
          <kbd>F</kbd> - Interact
        </div>
        <div class="control-item">
          <kbd>H</kbd> - Toggle this help
        </div>
      </div>
    </div>

    <!-- Toggle Help Button -->
    <button
      v-if="!showControls"
      class="help-toggle nes-btn is-primary"
      @click="toggleControls"
      title="Press H to toggle controls help"
    >
      ?
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const showControls = ref(false);
const showFPS = ref(true);
const fps = ref(0);

let frameCount = 0;
let lastTime = performance.now();
let fpsInterval: number;

const updateFPS = () => {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    fps.value = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;
  }

  fpsInterval = requestAnimationFrame(updateFPS);
};

const toggleControls = () => {
  showControls.value = !showControls.value;
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.code === "KeyH" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    toggleControls();
  }
};

onMounted(() => {
  updateFPS();
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(fpsInterval);
  window.removeEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.fps-counter {
  position: absolute;
  top: 10px;
  left: 10px;
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border-radius: 4px;
  pointer-events: none;
}

.controls-help {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 20px;
  min-width: 300px;
  pointer-events: auto;
}

.controls-help h3 {
  margin: 0 0 15px 0;
  color: #fff;
  text-align: center;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
}

.control-item kbd {
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.help-toggle {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  padding: 0;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s;
}

.help-toggle:hover {
  transform: scale(1.1);
}
</style>

