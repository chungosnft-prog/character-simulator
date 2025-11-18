import Loader from "../loader";
import {COLLISION_SCENE_URL, ON_LOAD_SCENE_FINISH, SCENE_BACKGROUND_TEXTURE} from "../Constants";
import {Scene, AmbientLight, DirectionalLight, EquirectangularReflectionMapping, Fog, Group, HemisphereLight, Mesh} from "three";
import type {BVHGeometry} from "../utils/typeAssert";
import {MeshBVH, StaticGeometryGenerator, type MeshBVHOptions} from "three-mesh-bvh";
import Emitter from "../emitter";

interface EnvironmentParams {
	scene: Scene;
	loader: Loader;
	emitter: Emitter
}

export default class Environment {
	private scene: Scene;
	private loader: Loader;
	private emitter: Emitter;

	private collision_scene: Group | undefined;
	collider: Mesh | undefined;
	is_load_finished = false;

	constructor({
		scene,
		loader,
		emitter,
	}: EnvironmentParams) {
		this.scene = scene;
		this.loader = loader;
		this.emitter = emitter;

		this._loadEnvironment();
	}

	/*
	* 加载场景全部物体
	* */
	private async _loadEnvironment() {
		try {
			await this._loadCollisionScene();
			this._initSceneOtherEffects();
			// Removed water creation for restaurant environment
			this.is_load_finished = true;
			this.emitter.$emit(ON_LOAD_SCENE_FINISH);
		} catch (e) {
			console.error("Failed to load environment:", e);
			this.emitter.$emit("environment_load_error", e);
		}
	}

	/*
	* 加载地图并绑定碰撞
	* */
	private _loadCollisionScene(): Promise<void> {
		return new Promise(resolve => {
			this.loader.gltf_loader.load(COLLISION_SCENE_URL, (gltf) => {
				this.collision_scene = gltf.scene;

				this.collision_scene.updateMatrixWorld(true);

				this.collision_scene.traverse(item => {
					item.castShadow = true;
					item.receiveShadow = true;
				});

				const static_generator = new StaticGeometryGenerator(this.collision_scene);
				static_generator.attributes = ["position"];

				const generate_geometry = static_generator.generate() as BVHGeometry;
				generate_geometry.boundsTree = new MeshBVH(generate_geometry, {lazyGeneration: false} as MeshBVHOptions);

				this.collider = new Mesh(generate_geometry);
				this.scene.add(this.collision_scene);

				resolve();
			});
		});
	}

	/*
	* 创建环境灯光、场景贴图、场景雾
	* */
	private _initSceneOtherEffects() {
		// Enhanced lighting for indoor restaurant environment
		const direction_light = new DirectionalLight(0xffffff, 1.2);
		direction_light.position.set(5, 10, 5);
		direction_light.castShadow = true;
		direction_light.shadow.camera.near = 0.01;
		direction_light.shadow.camera.far = 500;
		direction_light.shadow.camera.right = 50;
		direction_light.shadow.camera.left = -50;
		direction_light.shadow.camera.top	= 50;
		direction_light.shadow.camera.bottom = -50;
		direction_light.shadow.mapSize.width = 2048;
		direction_light.shadow.mapSize.height = 2048;
		direction_light.shadow.radius = 4;
		direction_light.shadow.bias = -0.0001;
		this.scene.add(direction_light);

		// Softer fill light for indoor ambiance
		const fill_light = new HemisphereLight(0xffffff, 0x888888, 0.8);
		fill_light.position.set(0, 10, 0);
		this.scene.add(fill_light);

		// Ambient light for better indoor visibility
		this.scene.add(new AmbientLight(0xffffff, 0.6));

		// Reduced fog for indoor environment
		this.scene.fog = new Fog(0xcccccc, 5, 200);

		// Keep background texture but make it optional
		try {
			const texture = this.loader.texture_loader.load(SCENE_BACKGROUND_TEXTURE);
			texture.mapping = EquirectangularReflectionMapping;
			this.scene.background = texture;
		} catch (e) {
			// If background texture fails, use solid color
			this.scene.background = null;
		}
	}

	// Water creation removed - not needed for restaurant environment
}
