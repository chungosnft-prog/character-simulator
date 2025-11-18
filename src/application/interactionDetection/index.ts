import {Scene, BoxGeometry, BufferGeometry, Matrix4, Mesh, MeshBasicMaterial, Vector3, RingGeometry, MeshStandardMaterial, DoubleSide, Group} from "three";
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree} from "three-mesh-bvh";
import {isBVHGeometry} from "../utils/typeAssert";
import {ON_INTERSECT_TRIGGER, ON_INTERSECT_TRIGGER_STOP} from "../Constants";
import type {InteractionMesh} from "./types";
import Emitter from "../emitter";

Mesh.prototype.raycast = acceleratedRaycast;
// @ts-ignore
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-ignore
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

interface InteractionDetectionParams {
	scene: Scene;
	emitter: Emitter;
}

export default class InteractionDetection {
	private scene: Scene;
	private emitter: Emitter;

	private enabled =  true;
	private intersect_boxes: InteractionMesh[] = [];
	private intersect: InteractionMesh | undefined = undefined;
	private portal_groups: Group[] = [];

		private interaction_boxes: InteractionMesh["userData"][] = [
		{
			type: "portal",
			title: "Go to Lower Floor",
			position: new Vector3(0, 0.5, 0),
			size: new Vector3(2, 3, 0.5),
			destination: new Vector3(0, -3, 0)
		},
		{
			type: "portal",
			title: "Go to Upper Floor",
			position: new Vector3(0, -2.5, 0),
			size: new Vector3(2, 3, 0.5),
			destination: new Vector3(0, 1, 0)
		}
	];

	constructor({
		scene,
		emitter
	}: InteractionDetectionParams) {
		this.scene = scene;
		this.emitter = emitter;

		this._createGameDetectBox();
	}

	getIntersectObj() {
		return this.intersect;
	}

	disableDetection() {
		this.enabled = false;
		this.intersect = undefined;
		this.emitter.$emit(ON_INTERSECT_TRIGGER_STOP);
	}

	enableDetection() {
		this.enabled = true;
		this.intersect = undefined;
	}

	update(character_mesh: Mesh) {
		if (!this.enabled) return;

		const intersect = this.intersect_boxes.find(box => {
			if (isBVHGeometry(box.geometry)) {
				// @ts-ignore
				character_mesh.geometry.computeBoundsTree();
				const transform_matrix = new Matrix4().copy(box.matrixWorld).invert().multiply(character_mesh.matrixWorld);
				const box3 = character_mesh.geometry.boundingBox!;
				return box.geometry.boundsTree.intersectsBox(box3, transform_matrix);
			}
			return false;
		});

		if (intersect && intersect.userData.title !== this.intersect?.userData?.title) {
			this.emitter.$emit(ON_INTERSECT_TRIGGER, intersect.userData);
		}

		if (!intersect && this.intersect) {
			this.emitter.$emit(ON_INTERSECT_TRIGGER_STOP);
		}

		this.intersect = intersect;
	}

	/*
	* 创建交互盒子
	* */
	private _createGameDetectBox() {
		const material = new MeshBasicMaterial({color: 0xff0000, wireframe: true});

		for (const i_box of this.interaction_boxes) {
			const geometry = new BoxGeometry(i_box.size!.x, i_box.size!.y, i_box.size!.z);
			const box = new Mesh(
				geometry,
				material
			) as InteractionMesh;
			box.visible = false;
			box.position.copy(i_box.position!);
			// @ts-ignore
			box.geometry.computeBoundsTree();
			this.scene.add(box);
			box.userData = {
				type: i_box.type,
				title: i_box.title,
				url: i_box.url,
				destination: i_box.destination
			};
			this.intersect_boxes.push(box);

			// Create visual portal for portal type interactions
			if (i_box.type === "portal") {
				this._createPortalVisual(i_box.position!, i_box.size!);
			}
		}
	}

	/*
	* 创建传送门视觉效果
	* */
	private _createPortalVisual(position: Vector3, size: Vector3) {
		const portalGroup = new Group();
		
		// Create portal ring (vertical)
		const ringGeometry = new RingGeometry(size.x * 0.4, size.x * 0.5, 32);
		const portalMaterial = new MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x004444,
			emissiveIntensity: 0.5,
			side: DoubleSide,
			transparent: true,
			opacity: 0.8
		});

		// Front ring
		const frontRing = new Mesh(ringGeometry, portalMaterial);
		frontRing.rotation.y = Math.PI / 2;
		portalGroup.add(frontRing);

		// Back ring
		const backRing = new Mesh(ringGeometry, portalMaterial);
		backRing.rotation.y = -Math.PI / 2;
		portalGroup.add(backRing);

		// Portal center (glowing effect)
		const centerGeometry = new RingGeometry(0.1, size.x * 0.4, 32);
		const centerMaterial = new MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 1,
			side: DoubleSide,
			transparent: true,
			opacity: 0.6
		});
		const center = new Mesh(centerGeometry, centerMaterial);
		center.rotation.y = Math.PI / 2;
		portalGroup.add(center);

		portalGroup.position.copy(position);
		portalGroup.position.y = size.y * 0.5; // Center vertically
		
		this.scene.add(portalGroup);
		this.portal_groups.push(portalGroup);
	}

	/*
	* Update portal animations (called from world update loop)
	* */
	updatePortals(delta: number) {
		for (const portal of this.portal_groups) {
			portal.rotation.z += delta * 0.5; // Rotate based on delta time
		}
	}
}
