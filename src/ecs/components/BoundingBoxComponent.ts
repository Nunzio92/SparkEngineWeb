import { Type, Vec2 } from "../../core";
import { Physx } from "../../physx";
import { BaseComponent } from "./BaseComponent";
import { TransformComponent } from "./TransformComponent";
import { CollisionCallback, CollisionCallbackParams, ICollidableComponent } from "./interfaces";

/**
 * @category Components
 */
interface AABB {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * @category Components
 */
export interface BoundingBoxComponentProps {
    matchContainerTransform?: boolean;
    isContainer?: boolean;
    aabb?: AABB;
    onCollisionCb?: CollisionCallback;
}

/**
 * @category Components
 */
@Type('BoundingBoxComponent')
export class BoundingBoxComponent extends BaseComponent implements ICollidableComponent {
    private defaultAABB: AABB = { x: 0, y: 0, width: 0, height: 0 }; 

    /**
     * Callback to invoke when a collision with another physical object is detected
     */
    public onCollisionCb: CollisionCallback | undefined;

    /**
     * If set to true it will automatically align the BoundingBox AABB to the parent entity transform
     */
    public matchContainerTransform: boolean = false;

    /**
     * Set to true if the bounding box component should act as a container for other objects to not escape from
     */
    public isContainer: boolean = false;

    /**
     * Returns the Axis Aligned Bounding Box of the component.
     * The returned value is overridden with the parent entity transform when `.matchContainerTransform` is set to true
     */
    public get aabb(): AABB { 

        const container = this.getContainer();
        const containerTransform = container ? container.getComponent<TransformComponent>('TransformComponent') : undefined;

        return this.matchContainerTransform && containerTransform
            ? { ...containerTransform.position, ...containerTransform.size }
            : this.defaultAABB
    }

    public set aabb(value: AABB) { 
        this.defaultAABB = value;
    }

    public constructor(props?: BoundingBoxComponentProps) {
        super();

        if(props?.aabb) this.aabb = props.aabb;
        if(props?.isContainer) this.isContainer = props.isContainer;
        if(props?.onCollisionCb) this.onCollisionCb = props.onCollisionCb;
        if(props?.matchContainerTransform) this.matchContainerTransform = props.matchContainerTransform;
    }

    /**
     * Pushes the physical object to the physics engine for the next update cycle.
     * 
     * @param physx - the physics engine where to push the physical object for the next update cycle
     */
    public update(physx: Physx): void {
        const velocity: Vec2 = this.getContainer()?.getComponent<TransformComponent>('TransformComponent')?.velocity ?? new Vec2();

        physx.pushPhysicalObject({
            object: {
                aabb: [this.aabb.x, this.aabb.y, this.aabb.width, this.aabb.height],
                isContainer: this.isContainer,
                uuid: this.uuid,
                velocity
            },
            onCollisionCallback: ({
                otherObject,
                postSimulation: simulationResult
            }) => this.onCollision({
                collider: otherObject,
                postSimulation: simulationResult,
            }),
        });
    }

    private onCollision(params: CollisionCallbackParams) { 
        this.onCollisionCb && this.onCollisionCb(params);
    }
}