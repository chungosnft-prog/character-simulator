<template>
  <div id="webgl" />

  <notify-tips ref="notify_ref" />

  <game-ui v-if="gameStarted" />
  
  <mobile-controls v-if="gameStarted" :core="core" />

  <load-progress
    v-model="percentage"
    :text="loading_text"
    @on-enter="onEnterApp"
  />
</template>

<script setup lang="ts">
import LoadProgress from "@/components/LoadProgress.vue";
import NotifyTips from "@/components/NotifyTips.vue";
import GameUI from "@/components/GameUI.vue";
import MobileControls from "@/components/MobileControls.vue";
import Core from "@/application/core";
import {onMounted, onBeforeUnmount, ref} from "vue";
import {ON_INTERSECT_TRIGGER, ON_INTERSECT_TRIGGER_STOP, ON_KEY_DOWN, ON_LOAD_PROGRESS} from "@/application/Constants";
import type {InteractionMesh} from "@/application/interactionDetection/types";

const notify_ref = ref<InstanceType<typeof NotifyTips>>();

// Loading related
const percentage = ref(0);
const loading_text = ref("Loading...");
const gameStarted = ref(false);

let core: Core | undefined = undefined;

/*
* 触发场景交互提示
* */
const onIntersectTrigger = ([user_data]: [user_date: InteractionMesh["userData"]]) => {
	notify_ref.value!.openNotify(user_data.title!);
};

/*
* 结束场景交互提示时
* */
const onIntersectTriggerStop = () => {
	notify_ref.value!.closeNotify();
};

const onKeyDown = ([key]: [key: string]) => {
	if (key === "KeyF" && core) {
		const intersect = core.world.interaction_detection.getIntersectObj();
		if (intersect) {
			handleInteraction(intersect);
		}
	}
};

/*
* 处理不同交互盒子的交互事件
* */
const handleInteraction = (intersect: InteractionMesh) => {
	if (!core) return;

	switch (intersect.userData.type) {
	case "portal":
		// Teleport player to destination
		if (intersect.userData.destination) {
			core.world.character.teleport(intersect.userData.destination);
		}
		break;
	}
};

const onLoadProgress = ([{url, loaded, total}]: [{url: string, loaded: number, total: number}]) => {
	percentage.value = +(loaded / total * 100).toFixed(2);
	if (/.*\.(blob|glb|fbx)$/i.test(url)) {
		loading_text.value = "Loading models...";
	}
	if (url.includes("wasm")) {
		loading_text.value = "Loading WASM...";
	}
	if (/.*\.(jpg|png|jpeg)$/i.test(url)) {
		loading_text.value = "Loading textures...";
	}
};

const onEnterApp = () => {
	if (core) {
		// Enable character control when entering
		core.control.enabled();
		// Unregister loading progress event listener
		core.emitter.$off(ON_LOAD_PROGRESS);
		gameStarted.value = true;
	}
};

onMounted(() => {
	core = new Core();
	core.render();

	core.emitter.$on(ON_INTERSECT_TRIGGER, onIntersectTrigger);
	core.emitter.$on(ON_INTERSECT_TRIGGER_STOP, onIntersectTriggerStop);
	core.emitter.$on(ON_KEY_DOWN, onKeyDown);
	core.emitter.$on(ON_LOAD_PROGRESS, onLoadProgress);
});

onBeforeUnmount(() => {
	if (core) {
		// Cleanup event listeners to prevent memory leaks
		core.emitter.$off(ON_INTERSECT_TRIGGER, onIntersectTrigger);
		core.emitter.$off(ON_INTERSECT_TRIGGER_STOP, onIntersectTriggerStop);
		core.emitter.$off(ON_KEY_DOWN, onKeyDown);
		core.emitter.$off(ON_LOAD_PROGRESS, onLoadProgress);
		
		// Dispose of core resources
		core.dispose?.();
	}
});
</script>

<style scoped>
#webgl {
	width: 100%;
	height: 100%;

}
</style>
