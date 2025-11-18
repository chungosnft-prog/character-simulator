<template>
  <div id="webgl" />

  <nes-game-dialog
    ref="game_dialog_ref"
    @on-close-dialog="onCloseNesGameDialog"
  />

  <notify-tips ref="notify_ref" />

  <game-ui v-if="gameStarted" />

  <load-progress
    v-model="percentage"
    :text="loading_text"
    @on-enter="onEnterApp"
  />
</template>

<script setup lang="ts">
import LoadProgress from "@/components/LoadProgress.vue";
import NesGameDialog from "@/components/NesGameDialog.vue";
import NotifyTips from "@/components/NotifyTips.vue";
import GameUI from "@/components/GameUI.vue";
import Core from "@/application/core";
import {onMounted, onBeforeUnmount, ref} from "vue";
import {ON_INTERSECT_TRIGGER, ON_INTERSECT_TRIGGER_STOP, ON_KEY_DOWN, ON_LOAD_PROGRESS} from "@/application/Constants";
import type {InteractionMesh} from "@/application/interactionDetection/types";

const notify_ref = ref<InstanceType<typeof NotifyTips>>();
const game_dialog_ref = ref<InstanceType<typeof NesGameDialog>>();

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
	case "game":
		// 处于nes游戏交互中，需禁用core.control中的按键触发，避免持续驱动character更新
		core.control.disabled();
		// 重置按键状态，防止键盘某个键锁死，持续驱动character更新
		core.control.resetStatus();
		// 进入游戏交互中后，关闭交互检测，优化性能
		core.world.interaction_detection.disableDetection();
		game_dialog_ref.value!.openDialog(intersect.userData.title!, intersect.userData.url!);
		break;
	case "music":
		core.world.audio.togglePlayAudio();
		break;
	case "portal":
		// Teleport player to destination
		if (intersect.userData.destination) {
			core.world.character.teleport(intersect.userData.destination);
		}
		break;
	}
};

const onCloseNesGameDialog = () => {
	if (core) {
		core.control.enabled();
		core.world.interaction_detection.enableDetection();
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
	if (/.*\.(m4a|mp3)$/i.test(url)) {
		loading_text.value = "Loading audio...";
	}
};

const onEnterApp = () => {
	if (core) {
		// Enable character control when entering
		core.control.enabled();
		// Audio autoplay is limited by browser initialization interaction, so play after entry
		core.world.audio.playAudio();
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
