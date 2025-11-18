import type {Mesh, Vector3} from "three";

export type InteractionType = "portal"

export type InteractionMesh = Mesh & {
	userData: {
		type?: InteractionType,
		title?: string,
		url?: string,
		size?: Vector3,
		position?: Vector3,
		destination?: Vector3 // For portal teleportation
	}
}
