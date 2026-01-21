/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { AnimationState, AnimationStateData, AtlasAttachmentLoader, ClippingAttachment, Color, MeshAttachment, Physics, Pool, RegionAttachment, Skeleton, SkeletonBinary, SkeletonBounds, SkeletonClipping, SkeletonData, SkeletonJson, Skin, Vector2, } from '@esotericsoftware/spine-core';
import { Assets, Cache, Container, fastCopy, Graphics, Texture, Ticker, ViewContainer, } from 'pixi.js';
;
const vectorAux = new Vector2();
Skeleton.yDown = true;
const clipper = new SkeletonClipping();
/** A bounds provider that provides a fixed size given by the user. */
export class AABBRectangleBoundsProvider {
    x;
    y;
    width;
    height;
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    calculateBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
/** A bounds provider that calculates the bounding box from the setup pose. */
export class SetupPoseBoundsProvider {
    clipping;
    /**
     * @param clipping If true, clipping attachments are used to compute the bounds. False, by default.
     */
    constructor(clipping = false) {
        this.clipping = clipping;
    }
    calculateBounds(gameObject) {
        if (!gameObject.skeleton)
            return { x: 0, y: 0, width: 0, height: 0 };
        // Make a copy of animation state and skeleton as this might be called while
        // the skeleton in the GameObject has already been heavily modified. We can not
        // reconstruct that state.
        const skeleton = new Skeleton(gameObject.skeleton.data);
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform(Physics.update);
        const bounds = skeleton.getBoundsRect(this.clipping ? new SkeletonClipping() : undefined);
        return bounds.width == Number.NEGATIVE_INFINITY
            ? { x: 0, y: 0, width: 0, height: 0 }
            : bounds;
    }
}
/** A bounds provider that calculates the bounding box by taking the maximumg bounding box for a combination of skins and specific animation. */
export class SkinsAndAnimationBoundsProvider {
    animation;
    skins;
    timeStep;
    clipping;
    /**
     * @param animation The animation to use for calculating the bounds. If null, the setup pose is used.
     * @param skins The skins to use for calculating the bounds. If empty, the default skin is used.
     * @param timeStep The time step to use for calculating the bounds. A smaller time step means more precision, but slower calculation.
     * @param clipping If true, clipping attachments are used to compute the bounds. False, by default.
     */
    constructor(animation, skins = [], timeStep = 0.05, clipping = false) {
        this.animation = animation;
        this.skins = skins;
        this.timeStep = timeStep;
        this.clipping = clipping;
    }
    calculateBounds(gameObject) {
        if (!gameObject.skeleton || !gameObject.state)
            return { x: 0, y: 0, width: 0, height: 0 };
        // Make a copy of animation state and skeleton as this might be called while
        // the skeleton in the GameObject has already been heavily modified. We can not
        // reconstruct that state.
        const animationState = new AnimationState(gameObject.state.data);
        const skeleton = new Skeleton(gameObject.skeleton.data);
        const clipper = this.clipping ? new SkeletonClipping() : undefined;
        const data = skeleton.data;
        if (this.skins.length > 0) {
            let customSkin = new Skin("custom-skin");
            for (const skinName of this.skins) {
                const skin = data.findSkin(skinName);
                if (skin == null)
                    continue;
                customSkin.addSkin(skin);
            }
            skeleton.setSkin(customSkin);
        }
        skeleton.setToSetupPose();
        const animation = this.animation != null ? data.findAnimation(this.animation) : null;
        if (animation == null) {
            skeleton.updateWorldTransform(Physics.update);
            const bounds = skeleton.getBoundsRect(clipper);
            return bounds.width == Number.NEGATIVE_INFINITY
                ? { x: 0, y: 0, width: 0, height: 0 }
                : bounds;
        }
        else {
            let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
            animationState.clearTracks();
            animationState.setAnimationWith(0, animation, false);
            const steps = Math.max(animation.duration / this.timeStep, 1.0);
            for (let i = 0; i < steps; i++) {
                const delta = i > 0 ? this.timeStep : 0;
                animationState.update(delta);
                animationState.apply(skeleton);
                skeleton.update(delta);
                skeleton.updateWorldTransform(Physics.update);
                const bounds = skeleton.getBoundsRect(clipper);
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
            const bounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
            };
            return bounds.width == Number.NEGATIVE_INFINITY
                ? { x: 0, y: 0, width: 0, height: 0 }
                : bounds;
        }
    }
}
;
const maskPool = new Pool(() => new Graphics);
/**
 * The class to instantiate a {@link Spine} game object in Pixi.
 * The static method {@link Spine.from} should be used to instantiate a Spine game object.
 */
export class Spine extends ViewContainer {
    // Pixi properties
    batched = true;
    buildId = 0;
    renderPipeId = 'spine';
    _didSpineUpdate = false;
    beforeUpdateWorldTransforms = () => { };
    afterUpdateWorldTransforms = () => { };
    // Spine properties
    /** The skeleton for this Spine game object. */
    skeleton;
    /** The animation state for this Spine game object. */
    state;
    skeletonBounds;
    darkTint = false;
    _debug = undefined;
    _slotsObject = Object.create(null);
    clippingSlotToPixiMasks = Object.create(null);
    getSlotFromRef(slotRef) {
        let slot;
        if (typeof slotRef === 'number')
            slot = this.skeleton.slots[slotRef];
        else if (typeof slotRef === 'string')
            slot = this.skeleton.findSlot(slotRef);
        else
            slot = slotRef;
        if (!slot)
            throw new Error(`No slot found with the given slot reference: ${slotRef}`);
        return slot;
    }
    spineAttachmentsDirty = true;
    spineTexturesDirty = true;
    _lastAttachments = [];
    _stateChanged = true;
    attachmentCacheData = [];
    get debug() {
        return this._debug;
    }
    /** Pass a {@link SpineDebugRenderer} or create your own {@link ISpineDebugRenderer} to render bones, meshes, ...
     * @example spineGO.debug = new SpineDebugRenderer();
     */
    set debug(value) {
        if (this._debug) {
            this._debug.unregisterSpine(this);
        }
        if (value) {
            value.registerSpine(this);
        }
        this._debug = value;
    }
    _autoUpdate = false;
    get autoUpdate() {
        return this._autoUpdate;
    }
    /** When `true`, the Spine AnimationState and the Skeleton will be automatically updated using the {@link Ticker.shared} instance. */
    set autoUpdate(value) {
        if (value && !this._autoUpdate) {
            Ticker.shared.add(this.internalUpdate, this);
        }
        else if (!value && this._autoUpdate) {
            Ticker.shared.remove(this.internalUpdate, this);
        }
        this._autoUpdate = value;
    }
    _boundsProvider;
    /** The bounds provider to use. If undefined the bounds will be dynamic, calculated when requested and based on the current frame. */
    get boundsProvider() {
        return this._boundsProvider;
    }
    set boundsProvider(value) {
        this._boundsProvider = value;
        if (value) {
            this._boundsDirty = false;
        }
        this.updateBounds();
    }
    hasNeverUpdated = true;
    constructor(options) {
        if (options instanceof SkeletonData) {
            options = {
                skeletonData: options,
            };
        }
        super({});
        this.allowChildren = true;
        const skeletonData = options instanceof SkeletonData ? options : options.skeletonData;
        this.skeleton = new Skeleton(skeletonData);
        this.state = new AnimationState(new AnimationStateData(skeletonData));
        this.autoUpdate = options?.autoUpdate ?? true;
        // dark tint can be enabled by options, otherwise is enable if at least one slot has tint black
        this.darkTint = options?.darkTint === undefined
            ? this.skeleton.slots.some(slot => !!slot.data.darkColor)
            : options?.darkTint;
        const slots = this.skeleton.slots;
        for (let i = 0; i < slots.length; i++) {
            this.attachmentCacheData[i] = Object.create(null);
        }
        this._boundsProvider = options.boundsProvider;
    }
    /** If {@link Spine.autoUpdate} is `false`, this method allows to update the AnimationState and the Skeleton with the given delta. */
    update(dt) {
        this.internalUpdate(0, dt);
    }
    internalUpdate(_deltaFrame, deltaSeconds) {
        // Because reasons, pixi uses deltaFrames at 60fps.
        // We ignore the default deltaFrames and use the deltaSeconds from pixi ticker.
        this._updateAndApplyState(deltaSeconds ?? Ticker.shared.deltaMS / 1000);
    }
    get bounds() {
        if (this._boundsDirty) {
            this.updateBounds();
        }
        return this._bounds;
    }
    /**
     * Set the position of the bone given in input through a {@link IPointData}.
     * @param bone: the bone name or the bone instance to set the position
     * @param outPos: the new position of the bone.
     * @throws {Error}: if the given bone is not found in the skeleton, an error is thrown
     */
    setBonePosition(bone, position) {
        const boneAux = bone;
        if (typeof bone === 'string') {
            bone = this.skeleton.findBone(bone);
        }
        if (!bone)
            throw Error(`Cant set bone position, bone ${String(boneAux)} not found`);
        vectorAux.set(position.x, position.y);
        if (bone.parent) {
            const aux = bone.parent.worldToLocal(vectorAux);
            bone.x = aux.x;
            bone.y = -aux.y;
        }
        else {
            bone.x = vectorAux.x;
            bone.y = vectorAux.y;
        }
    }
    /**
     * Return the position of the bone given in input into an {@link IPointData}.
     * @param bone: the bone name or the bone instance to get the position from
     * @param outPos: an optional {@link IPointData} to use to return the bone position, rathern than instantiating a new object.
     * @returns {IPointData | undefined}: the position of the bone, or undefined if no matching bone is found in the skeleton
     */
    getBonePosition(bone, outPos) {
        const boneAux = bone;
        if (typeof bone === 'string') {
            bone = this.skeleton.findBone(bone);
        }
        if (!bone) {
            console.error(`Cant set bone position! Bone ${String(boneAux)} not found`);
            return outPos;
        }
        if (!outPos) {
            outPos = { x: 0, y: 0 };
        }
        outPos.x = bone.worldX;
        outPos.y = bone.worldY;
        return outPos;
    }
    /**
     * Advance the state and skeleton by the given time, then update slot objects too.
     * The container transform is not updated.
     *
     * @param time the time at which to set the state
     */
    _updateAndApplyState(time) {
        this.hasNeverUpdated = false;
        this.state.update(time);
        this.skeleton.update(time);
        const { skeleton } = this;
        this.state.apply(skeleton);
        this.beforeUpdateWorldTransforms(this);
        skeleton.updateWorldTransform(Physics.update);
        this.afterUpdateWorldTransforms(this);
        this.updateSlotObjects();
        this._stateChanged = true;
        this.onViewUpdate();
    }
    /**
     * - validates the attachments - to flag if the attachments have changed this state
     * - transforms the attachments - to update the vertices of the attachments based on the new positions
     * @internal
     */
    _validateAndTransformAttachments() {
        if (!this._stateChanged)
            return;
        this._stateChanged = false;
        this.validateAttachments();
        this.transformAttachments();
    }
    validateAttachments() {
        const currentDrawOrder = this.skeleton.drawOrder;
        const lastAttachments = this._lastAttachments;
        let index = 0;
        let spineAttachmentsDirty = false;
        for (let i = 0; i < currentDrawOrder.length; i++) {
            const slot = currentDrawOrder[i];
            const attachment = slot.getAttachment();
            if (attachment) {
                if (attachment !== lastAttachments[index]) {
                    spineAttachmentsDirty = true;
                    lastAttachments[index] = attachment;
                }
                index++;
            }
        }
        if (index !== lastAttachments.length) {
            spineAttachmentsDirty = true;
            lastAttachments.length = index;
        }
        this.spineAttachmentsDirty ||= spineAttachmentsDirty;
    }
    currentClippingSlot;
    updateAndSetPixiMask(slot, last) {
        // assign/create the currentClippingSlot
        const attachment = slot.attachment;
        if (attachment && attachment instanceof ClippingAttachment) {
            const clip = (this.clippingSlotToPixiMasks[slot.data.name] ||= { slot, vertices: new Array() });
            clip.maskComputed = false;
            this.currentClippingSlot = clip;
            return;
        }
        // assign the currentClippingSlot mask to the slot object
        let currentClippingSlot = this.currentClippingSlot;
        let slotObject = this._slotsObject[slot.data.name];
        if (currentClippingSlot && slotObject) {
            // create the pixi mask, only the first time and if the clipped slot is the first one clipped by this currentClippingSlot
            let mask = currentClippingSlot.mask;
            if (!mask) {
                mask = maskPool.obtain();
                currentClippingSlot.mask = mask;
                this.addChild(mask);
            }
            // compute the pixi mask polygon, if the clipped slot is the first one clipped by this currentClippingSlot
            if (!currentClippingSlot.maskComputed) {
                let slotClipping = currentClippingSlot.slot;
                let clippingAttachment = slotClipping.attachment;
                currentClippingSlot.maskComputed = true;
                const worldVerticesLength = clippingAttachment.worldVerticesLength;
                const vertices = currentClippingSlot.vertices;
                clippingAttachment.computeWorldVertices(slotClipping, 0, worldVerticesLength, vertices, 0, 2);
                mask.clear().poly(vertices).stroke({ width: 0 }).fill({ alpha: .25 });
            }
            slotObject.container.mask = mask;
        }
        else if (slotObject?.container.mask) {
            // remove the mask, if slot object has a mask, but currentClippingSlot is undefined
            slotObject.container.mask = null;
        }
        // if current slot is the ending one of the currentClippingSlot mask, set currentClippingSlot to undefined
        if (currentClippingSlot && currentClippingSlot.slot.attachment.endSlot == slot.data) {
            this.currentClippingSlot = undefined;
        }
        // clean up unused masks
        if (last) {
            for (const key in this.clippingSlotToPixiMasks) {
                const clippingSlotToPixiMask = this.clippingSlotToPixiMasks[key];
                if ((!(clippingSlotToPixiMask.slot.attachment instanceof ClippingAttachment) || !clippingSlotToPixiMask.maskComputed) && clippingSlotToPixiMask.mask) {
                    this.removeChild(clippingSlotToPixiMask.mask);
                    maskPool.free(clippingSlotToPixiMask.mask);
                    clippingSlotToPixiMask.mask = undefined;
                }
            }
            this.currentClippingSlot = undefined;
        }
    }
    transformAttachments() {
        const currentDrawOrder = this.skeleton.drawOrder;
        for (let i = 0; i < currentDrawOrder.length; i++) {
            const slot = currentDrawOrder[i];
            this.updateAndSetPixiMask(slot, i === currentDrawOrder.length - 1);
            const attachment = slot.getAttachment();
            if (attachment) {
                if (attachment instanceof MeshAttachment || attachment instanceof RegionAttachment) {
                    const cacheData = this._getCachedData(slot, attachment);
                    if (attachment instanceof RegionAttachment) {
                        attachment.computeWorldVertices(slot, cacheData.vertices, 0, 2);
                    }
                    else {
                        attachment.computeWorldVertices(slot, 0, attachment.worldVerticesLength, cacheData.vertices, 0, 2);
                    }
                    // sequences uvs are known only after computeWorldVertices is invoked
                    if (cacheData.uvs.length < attachment.uvs.length) {
                        cacheData.uvs = new Float32Array(attachment.uvs.length);
                    }
                    // need to copy because attachments uvs are shared among skeletons using the same atlas
                    fastCopy(attachment.uvs.buffer, cacheData.uvs.buffer);
                    const skeleton = slot.bone.skeleton;
                    const skeletonColor = skeleton.color;
                    const slotColor = slot.color;
                    const attachmentColor = attachment.color;
                    const alpha = skeletonColor.a * slotColor.a * attachmentColor.a;
                    cacheData.color.set(skeletonColor.r * slotColor.r * attachmentColor.r, skeletonColor.g * slotColor.g * attachmentColor.g, skeletonColor.b * slotColor.b * attachmentColor.b, alpha);
                    if (this.alpha === 0 || alpha === 0) {
                        if (!cacheData.skipRender)
                            this.spineAttachmentsDirty = true;
                        cacheData.skipRender = true;
                    }
                    else {
                        if (cacheData.skipRender)
                            this.spineAttachmentsDirty = true;
                        cacheData.skipRender = cacheData.clipped = false;
                        if (slot.darkColor) {
                            cacheData.darkColor.setFromColor(slot.darkColor);
                        }
                        const texture = attachment.region?.texture.texture || Texture.EMPTY;
                        if (cacheData.texture !== texture) {
                            cacheData.texture = texture;
                            this.spineTexturesDirty = true;
                        }
                        if (clipper.isClipping()) {
                            this.updateClippingData(cacheData);
                        }
                    }
                }
                else if (attachment instanceof ClippingAttachment) {
                    clipper.clipStart(slot, attachment);
                    continue;
                }
            }
            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
    }
    updateClippingData(cacheData) {
        cacheData.clipped = true;
        clipper.clipTrianglesUnpacked(cacheData.vertices, cacheData.indices, cacheData.indices.length, cacheData.uvs);
        const { clippedVertices, clippedUVs, clippedTriangles } = clipper;
        const verticesCount = clippedVertices.length / 2;
        const indicesCount = clippedTriangles.length;
        if (!cacheData.clippedData) {
            cacheData.clippedData = {
                vertices: new Float32Array(verticesCount * 2),
                uvs: new Float32Array(verticesCount * 2),
                vertexCount: verticesCount,
                indices: new Uint16Array(indicesCount),
                indicesCount,
            };
            this.spineAttachmentsDirty = true;
        }
        const clippedData = cacheData.clippedData;
        const sizeChange = clippedData.vertexCount !== verticesCount || indicesCount !== clippedData.indicesCount;
        cacheData.skipRender = verticesCount === 0;
        if (sizeChange) {
            this.spineAttachmentsDirty = true;
            if (clippedData.vertexCount < verticesCount) {
                // buffer reuse!
                clippedData.vertices = new Float32Array(verticesCount * 2);
                clippedData.uvs = new Float32Array(verticesCount * 2);
            }
            if (clippedData.indices.length < indicesCount) {
                clippedData.indices = new Uint16Array(indicesCount);
            }
        }
        const { vertices, uvs, indices } = clippedData;
        for (let i = 0; i < verticesCount; i++) {
            vertices[i * 2] = clippedVertices[i * 2];
            vertices[(i * 2) + 1] = clippedVertices[(i * 2) + 1];
            uvs[i * 2] = clippedUVs[(i * 2)];
            uvs[(i * 2) + 1] = clippedUVs[(i * 2) + 1];
        }
        clippedData.vertexCount = verticesCount;
        for (let i = 0; i < indicesCount; i++) {
            if (indices[i] !== clippedTriangles[i]) {
                this.spineAttachmentsDirty = true;
                indices[i] = clippedTriangles[i];
            }
        }
        clippedData.indicesCount = indicesCount;
    }
    /**
     * ensure that attached containers map correctly to their slots
     * along with their position, rotation, scale, and visibility.
     */
    updateSlotObjects() {
        for (const i in this._slotsObject) {
            const slotAttachment = this._slotsObject[i];
            if (!slotAttachment)
                continue;
            this.updateSlotObject(slotAttachment);
        }
    }
    updateSlotObject(slotAttachment) {
        const { slot, container } = slotAttachment;
        const followAttachmentValue = slotAttachment.followAttachmentTimeline ? Boolean(slot.attachment) : true;
        container.visible = this.skeleton.drawOrder.includes(slot) && followAttachmentValue;
        if (container.visible) {
            let bone = slot.bone;
            container.position.set(bone.worldX, bone.worldY);
            container.angle = bone.getWorldRotationX();
            let cumulativeScaleX = 1;
            let cumulativeScaleY = 1;
            while (bone) {
                cumulativeScaleX *= bone.scaleX;
                cumulativeScaleY *= bone.scaleY;
                bone = bone.parent;
            }
            ;
            if (cumulativeScaleX < 0)
                container.angle -= 180;
            container.scale.set(slot.bone.getWorldScaleX() * Math.sign(cumulativeScaleX), slot.bone.getWorldScaleY() * Math.sign(cumulativeScaleY));
            container.alpha = this.skeleton.color.a * slot.color.a;
        }
    }
    /** @internal */
    _getCachedData(slot, attachment) {
        return this.attachmentCacheData[slot.data.index][attachment.name] || this.initCachedData(slot, attachment);
    }
    initCachedData(slot, attachment) {
        let vertices;
        if (attachment instanceof RegionAttachment) {
            vertices = new Float32Array(8);
            this.attachmentCacheData[slot.data.index][attachment.name] = {
                id: `${slot.data.index}-${attachment.name}`,
                vertices,
                clipped: false,
                indices: [0, 1, 2, 0, 2, 3],
                uvs: new Float32Array(attachment.uvs.length),
                color: new Color(1, 1, 1, 1),
                darkColor: new Color(0, 0, 0, 0),
                darkTint: this.darkTint,
                skipRender: false,
                texture: attachment.region?.texture.texture,
            };
        }
        else {
            vertices = new Float32Array(attachment.worldVerticesLength);
            this.attachmentCacheData[slot.data.index][attachment.name] = {
                id: `${slot.data.index}-${attachment.name}`,
                vertices,
                clipped: false,
                indices: attachment.triangles,
                uvs: new Float32Array(attachment.uvs.length),
                color: new Color(1, 1, 1, 1),
                darkColor: new Color(0, 0, 0, 0),
                darkTint: this.darkTint,
                skipRender: false,
                texture: attachment.region?.texture.texture,
            };
        }
        return this.attachmentCacheData[slot.data.index][attachment.name];
    }
    onViewUpdate() {
        // increment from the 12th bit!
        this._didViewChangeTick++;
        if (!this._boundsProvider) {
            this._boundsDirty = true;
        }
        if (this.didViewUpdate)
            return;
        this.didViewUpdate = true;
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.onChildViewUpdate(this);
        }
        this.debug?.renderDebug(this);
    }
    /**
     * Attaches a PixiJS container to a specified slot. This will map the world transform of the slots bone
     * to the attached container. A container can only be attached to one slot at a time.
     *
     * @param container - The container to attach to the slot
     * @param slotRef - The slot id or  slot to attach to
     * @param options - Optional settings for the attachment.
     * @param options.followAttachmentTimeline - If true, the attachment will follow the slot's attachment timeline.
     */
    addSlotObject(slot, container, options) {
        slot = this.getSlotFromRef(slot);
        // need to check in on the container too...
        for (const i in this._slotsObject) {
            if (this._slotsObject[i]?.container === container) {
                this.removeSlotObject(this._slotsObject[i].slot);
            }
        }
        this.removeSlotObject(slot);
        container.includeInBuild = false;
        this.addChild(container);
        const slotObject = {
            container,
            slot,
            followAttachmentTimeline: options?.followAttachmentTimeline || false,
        };
        this._slotsObject[slot.data.name] = slotObject;
        this.updateSlotObject(slotObject);
    }
    /**
     * Removes a PixiJS container from the slot it is attached to.
     *
     * @param container - The container to detach from the slot
     * @param slotOrContainer - The container, slot id or slot to detach from
     */
    removeSlotObject(slotOrContainer) {
        let containerToRemove;
        if (slotOrContainer instanceof Container) {
            for (const i in this._slotsObject) {
                if (this._slotsObject[i]?.container === slotOrContainer) {
                    this._slotsObject[i] = null;
                    containerToRemove = slotOrContainer;
                    break;
                }
            }
        }
        else {
            const slot = this.getSlotFromRef(slotOrContainer);
            containerToRemove = this._slotsObject[slot.data.name]?.container;
            this._slotsObject[slot.data.name] = null;
        }
        if (containerToRemove) {
            this.removeChild(containerToRemove);
            containerToRemove.includeInBuild = true;
        }
    }
    /**
     * Removes all PixiJS containers attached to any slot.
     */
    removeSlotObjects() {
        Object.entries(this._slotsObject).forEach(([slotName, slotObject]) => {
            if (slotObject)
                slotObject.container.removeFromParent();
            delete this._slotsObject[slotName];
        });
    }
    /**
     * Returns a container attached to a slot, or undefined if no container is attached.
     *
     * @param slotRef - The slot id or slot to get the attachment from
     * @returns - The container attached to the slot
     */
    getSlotObject(slot) {
        slot = this.getSlotFromRef(slot);
        return this._slotsObject[slot.data.name]?.container;
    }
    updateBounds() {
        this._boundsDirty = false;
        this.skeletonBounds ||= new SkeletonBounds();
        const skeletonBounds = this.skeletonBounds;
        skeletonBounds.update(this.skeleton, true);
        if (this._boundsProvider) {
            const boundsSpine = this._boundsProvider.calculateBounds(this);
            const bounds = this._bounds;
            bounds.clear();
            bounds.x = boundsSpine.x;
            bounds.y = boundsSpine.y;
            bounds.width = boundsSpine.width;
            bounds.height = boundsSpine.height;
        }
        else if (skeletonBounds.minX === Infinity) {
            if (this.hasNeverUpdated) {
                this._updateAndApplyState(0);
                this._boundsDirty = false;
            }
            this._validateAndTransformAttachments();
            const drawOrder = this.skeleton.drawOrder;
            const bounds = this._bounds;
            bounds.clear();
            for (let i = 0; i < drawOrder.length; i++) {
                const slot = drawOrder[i];
                const attachment = slot.getAttachment();
                if (attachment && (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment)) {
                    const cacheData = this._getCachedData(slot, attachment);
                    bounds.addVertexData(cacheData.vertices, 0, cacheData.vertices.length);
                }
            }
        }
        else {
            this._bounds.minX = skeletonBounds.minX;
            this._bounds.minY = skeletonBounds.minY;
            this._bounds.maxX = skeletonBounds.maxX;
            this._bounds.maxY = skeletonBounds.maxY;
        }
    }
    /** @internal */
    addBounds(bounds) {
        bounds.addBounds(this.bounds);
    }
    /**
     * Destroys this sprite renderable and optionally its texture.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
     * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
     */
    destroy(options = false) {
        super.destroy(options);
        Ticker.shared.remove(this.internalUpdate, this);
        this.state.clearListeners();
        this.debug = undefined;
        this.skeleton = null;
        this.state = null;
        this._slotsObject = null;
        this._lastAttachments.length = 0;
        this.attachmentCacheData = null;
    }
    /** Converts a point from the skeleton coordinate system to the Pixi world coordinate system. */
    skeletonToPixiWorldCoordinates(point) {
        this.worldTransform.apply(point, point);
    }
    /** Converts a point from the Pixi world coordinate system to the skeleton coordinate system. */
    pixiWorldCoordinatesToSkeleton(point) {
        this.worldTransform.applyInverse(point, point);
    }
    /** Converts a point from the Pixi world coordinate system to the bone's local coordinate system. */
    pixiWorldCoordinatesToBone(point, bone) {
        this.pixiWorldCoordinatesToSkeleton(point);
        if (bone.parent) {
            bone.parent.worldToLocal(point);
        }
        else {
            bone.worldToLocal(point);
        }
    }
    /**
     * Use this method to instantiate a Spine game object.
     * Before instantiating a Spine game object, the skeleton (`.skel` or `.json`) and the atlas text files must be loaded into the Assets. For example:
     * ```
     * PIXI.Assets.add("sackData", "/assets/sack-pro.skel");
     * PIXI.Assets.add("sackAtlas", "/assets/sack-pma.atlas");
     * await PIXI.Assets.load(["sackData", "sackAtlas"]);
     * ```
     * Once a Spine game object is created, its skeleton data is cached into {@link Cache} using the key:
     * `${skeletonAssetName}-${atlasAssetName}-${options?.scale ?? 1}`
     *
     * @param options - Options to configure the Spine game object. See {@link SpineFromOptions}
     * @returns {Spine} The Spine game object instantiated
     */
    static from({ skeleton, atlas, scale = 1, darkTint, autoUpdate = true, boundsProvider }) {
        const cacheKey = `${skeleton}-${atlas}-${scale}`;
        if (Cache.has(cacheKey)) {
            return new Spine({
                skeletonData: Cache.get(cacheKey),
                darkTint,
                autoUpdate,
                boundsProvider,
            });
        }
        const skeletonAsset = Assets.get(skeleton);
        const atlasAsset = Assets.get(atlas);
        const attachmentLoader = new AtlasAttachmentLoader(atlasAsset);
        const parser = skeletonAsset instanceof Uint8Array
            ? new SkeletonBinary(attachmentLoader)
            : new SkeletonJson(attachmentLoader);
        parser.scale = scale;
        const skeletonData = parser.readSkeletonData(skeletonAsset);
        Cache.set(cacheKey, skeletonData);
        return new Spine({
            skeletonData,
            darkTint,
            autoUpdate,
            boundsProvider,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3BpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU3BpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFDTixjQUFjLEVBQ2Qsa0JBQWtCLEVBQ2xCLHFCQUFxQixFQUdyQixrQkFBa0IsRUFDbEIsS0FBSyxFQUNMLGNBQWMsRUFDZCxPQUFPLEVBQ1AsSUFBSSxFQUNKLGdCQUFnQixFQUNoQixRQUFRLEVBQ1IsY0FBYyxFQUNkLGNBQWMsRUFDZCxnQkFBZ0IsRUFDaEIsWUFBWSxFQUNaLFlBQVksRUFDWixJQUFJLEVBSUosT0FBTyxHQUNQLE1BQU0sOEJBQThCLENBQUM7QUFDdEMsT0FBTyxFQUNOLE1BQU0sRUFFTixLQUFLLEVBQ0wsU0FBUyxFQUdULFFBQVEsRUFDUixRQUFRLEVBRVIsT0FBTyxFQUNQLE1BQU0sRUFDTixhQUFhLEdBQ2IsTUFBTSxTQUFTLENBQUM7QUE0QmhCLENBQUM7QUFFRixNQUFNLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBRWhDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBRXRCLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztBQWF2QyxzRUFBc0U7QUFDdEUsTUFBTSxPQUFPLDJCQUEyQjtJQUU5QjtJQUNBO0lBQ0E7SUFDQTtJQUpULFlBQ1MsQ0FBUyxFQUNULENBQVMsRUFDVCxLQUFhLEVBQ2IsTUFBYztRQUhkLE1BQUMsR0FBRCxDQUFDLENBQVE7UUFDVCxNQUFDLEdBQUQsQ0FBQyxDQUFRO1FBQ1QsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFdBQU0sR0FBTixNQUFNLENBQVE7SUFDbkIsQ0FBQztJQUNMLGVBQWU7UUFDZCxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FB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Q0FBQztRQUNyQixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFNUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFbEMsT0FBTyxJQUFJLEtBQUssQ0FBQztZQUNoQixZQUFZO1lBQ1osUUFBUTtZQUNSLFVBQVU7WUFDVixjQUFjO1NBQ2QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogU3BpbmUgUnVudGltZXMgTGljZW5zZSBBZ3JlZW1lbnRcbiAqIExhc3QgdXBkYXRlZCBBcHJpbCA1LCAyMDI1LiBSZXBsYWNlcyBhbGwgcHJpb3IgdmVyc2lvbnMuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMjUsIEVzb3RlcmljIFNvZnR3YXJlIExMQ1xuICpcbiAqIEludGVncmF0aW9uIG9mIHRoZSBTcGluZSBSdW50aW1lcyBpbnRvIHNvZnR3YXJlIG9yIG90aGVyd2lzZSBjcmVhdGluZ1xuICogZGVyaXZhdGl2ZSB3b3JrcyBvZiB0aGUgU3BpbmUgUnVudGltZXMgaXMgcGVybWl0dGVkIHVuZGVyIHRoZSB0ZXJtcyBhbmRcbiAqIGNvbmRpdGlvbnMgb2YgU2VjdGlvbiAyIG9mIHRoZSBTcGluZSBFZGl0b3IgTGljZW5zZSBBZ3JlZW1lbnQ6XG4gKiBodHRwOi8vZXNvdGVyaWNzb2Z0d2FyZS5jb20vc3BpbmUtZWRpdG9yLWxpY2Vuc2VcbiAqXG4gKiBPdGhlcndpc2UsIGl0IGlzIHBlcm1pdHRlZCB0byBpbnRlZ3JhdGUgdGhlIFNwaW5lIFJ1bnRpbWVzIGludG8gc29mdHdhcmVcbiAqIG9yIG90aGVyd2lzZSBjcmVhdGUgZGVyaXZhdGl2ZSB3b3JrcyBvZiB0aGUgU3BpbmUgUnVudGltZXMgKGNvbGxlY3RpdmVseSxcbiAqIFwiUHJvZHVjdHNcIiksIHByb3ZpZGVkIHRoYXQgZWFjaCB1c2VyIG9mIHRoZSBQcm9kdWN0cyBtdXN0IG9idGFpbiB0aGVpciBvd25cbiAqIFNwaW5lIEVkaXRvciBsaWNlbnNlIGFuZCByZWRpc3RyaWJ1dGlvbiBvZiB0aGUgUHJvZHVjdHMgaW4gYW55IGZvcm0gbXVzdFxuICogaW5jbHVkZSB0aGlzIGxpY2Vuc2UgYW5kIGNvcHlyaWdodCBub3RpY2UuXG4gKlxuICogVEhFIFNQSU5FIFJVTlRJTUVTIEFSRSBQUk9WSURFRCBCWSBFU09URVJJQyBTT0ZUV0FSRSBMTEMgXCJBUyBJU1wiIEFORCBBTllcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEVTT1RFUklDIFNPRlRXQVJFIExMQyBCRSBMSUFCTEUgRk9SIEFOWVxuICogRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAqIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUyxcbiAqIEJVU0lORVNTIElOVEVSUlVQVElPTiwgT1IgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFMpIEhPV0VWRVIgQ0FVU0VEIEFORFxuICogT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICogVEhFIFNQSU5FIFJVTlRJTUVTLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5pbXBvcnQge1xuXHRBbmltYXRpb25TdGF0ZSxcblx0QW5pbWF0aW9uU3RhdGVEYXRhLFxuXHRBdGxhc0F0dGFjaG1lbnRMb2FkZXIsXG5cdEF0dGFjaG1lbnQsXG5cdEJvbmUsXG5cdENsaXBwaW5nQXR0YWNobWVudCxcblx0Q29sb3IsXG5cdE1lc2hBdHRhY2htZW50LFxuXHRQaHlzaWNzLFxuXHRQb29sLFxuXHRSZWdpb25BdHRhY2htZW50LFxuXHRTa2VsZXRvbixcblx0U2tlbGV0b25CaW5hcnksXG5cdFNrZWxldG9uQm91bmRzLFxuXHRTa2VsZXRvbkNsaXBwaW5nLFxuXHRTa2VsZXRvbkRhdGEsXG5cdFNrZWxldG9uSnNvbixcblx0U2tpbixcblx0U2xvdCxcblx0dHlwZSBUZXh0dXJlQXRsYXMsXG5cdFRyYWNrRW50cnksXG5cdFZlY3RvcjIsXG59IGZyb20gJ0Blc290ZXJpY3NvZnR3YXJlL3NwaW5lLWNvcmUnO1xuaW1wb3J0IHtcblx0QXNzZXRzLFxuXHRCb3VuZHMsXG5cdENhY2hlLFxuXHRDb250YWluZXIsXG5cdENvbnRhaW5lck9wdGlvbnMsXG5cdERlc3Ryb3lPcHRpb25zLFxuXHRmYXN0Q29weSxcblx0R3JhcGhpY3MsXG5cdFBvaW50RGF0YSxcblx0VGV4dHVyZSxcblx0VGlja2VyLFxuXHRWaWV3Q29udGFpbmVyLFxufSBmcm9tICdwaXhpLmpzJztcbmltcG9ydCB7IElTcGluZURlYnVnUmVuZGVyZXIgfSBmcm9tICcuL1NwaW5lRGVidWdSZW5kZXJlci5qcyc7XG5cbi8qKlxuICogT3B0aW9ucyB0byBjcmVhdGUgYSB7QGxpbmsgU3BpbmV9IHVzaW5nIHtAbGluayBTcGluZS5mcm9tfS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTcGluZUZyb21PcHRpb25zIHtcblx0LyoqIHRoZSBhc3NldCBuYW1lIGZvciB0aGUgc2tlbGV0b24gYC5za2VsYCBvciBgLmpzb25gIGZpbGUgcHJldmlvdXNseSBsb2FkZWQgaW50byB0aGUgQXNzZXRzICovXG5cdHNrZWxldG9uOiBzdHJpbmc7XG5cblx0LyoqIHRoZSBhc3NldCBuYW1lIGZvciB0aGUgYXRsYXMgZmlsZSBwcmV2aW91c2x5IGxvYWRlZCBpbnRvIHRoZSBBc3NldHMgKi9cblx0YXRsYXM6IHN0cmluZztcblxuXHQvKiogIFRoZSB2YWx1ZSBwYXNzZWQgdG8gdGhlIHNrZWxldG9uIHJlYWRlci4gSWYgb21pdHRlZCwgMSBpcyBwYXNzZWQuIFNlZSB7QGxpbmsgU2tlbGV0b25CaW5hcnkuc2NhbGV9IGZvciBkZXRhaWxzLiAqL1xuXHRzY2FsZT86IG51bWJlcjtcblxuXHQvKiogIFNldCB0aGUge0BsaW5rIFNwaW5lLmF1dG9VcGRhdGV9IHZhbHVlLiBJZiBvbWl0dGVkLCBpdCBpcyBzZXQgdG8gYHRydWVgLiAqL1xuXHRhdXRvVXBkYXRlPzogYm9vbGVhbjtcblxuXHQvKipcblx0ICogSWYgYHRydWVgLCB1c2UgdGhlIGRhcmsgdGludCByZW5kZXJlciB0byByZW5kZXIgdGhlIHNrZWxldG9uXG5cdCAqIElmIGBmYWxzZWAsIHVzZSB0aGUgZGVmYXVsdCBwaXhpIHJlbmRlcmVyIHRvIHJlbmRlciB0aGUgc2tlbGV0b25cblx0ICogSWYgYHVuZGVmaW5lZGAsIHVzZSB0aGUgZGFyayB0aW50IHJlbmRlcmVyIGlmIGF0IGxlYXN0IG9uZSBzbG90IGhhcyB0aW50IGJsYWNrXG5cdCAqL1xuXHRkYXJrVGludD86IGJvb2xlYW47XG5cblx0LyoqIFRoZSBib3VuZHMgcHJvdmlkZXIgdG8gdXNlLiBJZiB1bmRlZmluZWQgdGhlIGJvdW5kcyB3aWxsIGJlIGR5bmFtaWMsIGNhbGN1bGF0ZWQgd2hlbiByZXF1ZXN0ZWQgYW5kIGJhc2VkIG9uIHRoZSBjdXJyZW50IGZyYW1lLiAqL1xuXHRib3VuZHNQcm92aWRlcj86IFNwaW5lQm91bmRzUHJvdmlkZXIsXG59O1xuXG5jb25zdCB2ZWN0b3JBdXggPSBuZXcgVmVjdG9yMigpO1xuXG5Ta2VsZXRvbi55RG93biA9IHRydWU7XG5cbmNvbnN0IGNsaXBwZXIgPSBuZXcgU2tlbGV0b25DbGlwcGluZygpO1xuXG4vKiogQSBib3VuZHMgcHJvdmlkZXIgY2FsY3VsYXRlcyB0aGUgYm91bmRpbmcgYm94IGZvciBhIHNrZWxldG9uLCB3aGljaCBpcyB0aGVuIGFzc2lnbmVkIGFzIHRoZSBzaXplIG9mIHRoZSBTcGluZUdhbWVPYmplY3QuICovXG5leHBvcnQgaW50ZXJmYWNlIFNwaW5lQm91bmRzUHJvdmlkZXIge1xuXHQvKiogUmV0dXJucyB0aGUgYm91bmRpbmcgYm94IGZvciB0aGUgc2tlbGV0b24sIGluIHNrZWxldG9uIHNwYWNlLiAqL1xuXHRjYWxjdWxhdGVCb3VuZHMgKGdhbWVPYmplY3Q6IFNwaW5lKToge1xuXHRcdHg6IG51bWJlcjtcblx0XHR5OiBudW1iZXI7XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fTtcbn1cblxuLyoqIEEgYm91bmRzIHByb3ZpZGVyIHRoYXQgcHJvdmlkZXMgYSBmaXhlZCBzaXplIGdpdmVuIGJ5IHRoZSB1c2VyLiAqL1xuZXhwb3J0IGNsYXNzIEFBQkJSZWN0YW5nbGVCb3VuZHNQcm92aWRlciBpbXBsZW1lbnRzIFNwaW5lQm91bmRzUHJvdmlkZXIge1xuXHRjb25zdHJ1Y3RvciAoXG5cdFx0cHJpdmF0ZSB4OiBudW1iZXIsXG5cdFx0cHJpdmF0ZSB5OiBudW1iZXIsXG5cdFx0cHJpdmF0ZSB3aWR0aDogbnVtYmVyLFxuXHRcdHByaXZhdGUgaGVpZ2h0OiBudW1iZXIsXG5cdCkgeyB9XG5cdGNhbGN1bGF0ZUJvdW5kcyAoKSB7XG5cdFx0cmV0dXJuIHsgeDogdGhpcy54LCB5OiB0aGlzLnksIHdpZHRoOiB0aGlzLndpZHRoLCBoZWlnaHQ6IHRoaXMuaGVpZ2h0IH07XG5cdH1cbn1cblxuLyoqIEEgYm91bmRzIHByb3ZpZGVyIHRoYXQgY2FsY3VsYXRlcyB0aGUgYm91bmRpbmcgYm94IGZyb20gdGhlIHNldHVwIHBvc2UuICovXG5leHBvcnQgY2xhc3MgU2V0dXBQb3NlQm91bmRzUHJvdmlkZXIgaW1wbGVtZW50cyBTcGluZUJvdW5kc1Byb3ZpZGVyIHtcblx0LyoqXG5cdCAqIEBwYXJhbSBjbGlwcGluZyBJZiB0cnVlLCBjbGlwcGluZyBhdHRhY2htZW50cyBhcmUgdXNlZCB0byBjb21wdXRlIHRoZSBib3VuZHMuIEZhbHNlLCBieSBkZWZhdWx0LlxuXHQgKi9cblx0Y29uc3RydWN0b3IgKFxuXHRcdHByaXZhdGUgY2xpcHBpbmcgPSBmYWxzZSxcblx0KSB7IH1cblxuXHRjYWxjdWxhdGVCb3VuZHMgKGdhbWVPYmplY3Q6IFNwaW5lKSB7XG5cdFx0aWYgKCFnYW1lT2JqZWN0LnNrZWxldG9uKSByZXR1cm4geyB4OiAwLCB5OiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwIH07XG5cdFx0Ly8gTWFrZSBhIGNvcHkgb2YgYW5pbWF0aW9uIHN0YXRlIGFuZCBza2VsZXRvbiBhcyB0aGlzIG1pZ2h0IGJlIGNhbGxlZCB3aGlsZVxuXHRcdC8vIHRoZSBza2VsZXRvbiBpbiB0aGUgR2FtZU9iamVjdCBoYXMgYWxyZWFkeSBiZWVuIGhlYXZpbHkgbW9kaWZpZWQuIFdlIGNhbiBub3Rcblx0XHQvLyByZWNvbnN0cnVjdCB0aGF0IHN0YXRlLlxuXHRcdGNvbnN0IHNrZWxldG9uID0gbmV3IFNrZWxldG9uKGdhbWVPYmplY3Quc2tlbGV0b24uZGF0YSk7XG5cdFx0c2tlbGV0b24uc2V0VG9TZXR1cFBvc2UoKTtcblx0XHRza2VsZXRvbi51cGRhdGVXb3JsZFRyYW5zZm9ybShQaHlzaWNzLnVwZGF0ZSk7XG5cdFx0Y29uc3QgYm91bmRzID0gc2tlbGV0b24uZ2V0Qm91bmRzUmVjdCh0aGlzLmNsaXBwaW5nID8gbmV3IFNrZWxldG9uQ2xpcHBpbmcoKSA6IHVuZGVmaW5lZCk7XG5cdFx0cmV0dXJuIGJvdW5kcy53aWR0aCA9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFlcblx0XHRcdD8geyB4OiAwLCB5OiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwIH1cblx0XHRcdDogYm91bmRzO1xuXHR9XG59XG5cbi8qKiBBIGJvdW5kcyBwcm92aWRlciB0aGF0IGNhbGN1bGF0ZXMgdGhlIGJvdW5kaW5nIGJveCBieSB0YWtpbmcgdGhlIG1heGltdW1nIGJvdW5kaW5nIGJveCBmb3IgYSBjb21iaW5hdGlvbiBvZiBza2lucyBhbmQgc3BlY2lmaWMgYW5pbWF0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIFNraW5zQW5kQW5pbWF0aW9uQm91bmRzUHJvdmlkZXJcblx0aW1wbGVtZW50cyBTcGluZUJvdW5kc1Byb3ZpZGVyIHtcblx0LyoqXG5cdCAqIEBwYXJhbSBhbmltYXRpb24gVGhlIGFuaW1hdGlvbiB0byB1c2UgZm9yIGNhbGN1bGF0aW5nIHRoZSBib3VuZHMuIElmIG51bGwsIHRoZSBzZXR1cCBwb3NlIGlzIHVzZWQuXG5cdCAqIEBwYXJhbSBza2lucyBUaGUgc2tpbnMgdG8gdXNlIGZvciBjYWxjdWxhdGluZyB0aGUgYm91bmRzLiBJZiBlbXB0eSwgdGhlIGRlZmF1bHQgc2tpbiBpcyB1c2VkLlxuXHQgKiBAcGFyYW0gdGltZVN0ZXAgVGhlIHRpbWUgc3RlcCB0byB1c2UgZm9yIGNhbGN1bGF0aW5nIHRoZSBib3VuZHMuIEEgc21hbGxlciB0aW1lIHN0ZXAgbWVhbnMgbW9yZSBwcmVjaXNpb24sIGJ1dCBzbG93ZXIgY2FsY3VsYXRpb24uXG5cdCAqIEBwYXJhbSBjbGlwcGluZyBJZiB0cnVlLCBjbGlwcGluZyBhdHRhY2htZW50cyBhcmUgdXNlZCB0byBjb21wdXRlIHRoZSBib3VuZHMuIEZhbHNlLCBieSBkZWZhdWx0LlxuXHQgKi9cblx0Y29uc3RydWN0b3IgKFxuXHRcdHByaXZhdGUgYW5pbWF0aW9uOiBzdHJpbmcgfCBudWxsLFxuXHRcdHByaXZhdGUgc2tpbnM6IHN0cmluZ1tdID0gW10sXG5cdFx0cHJpdmF0ZSB0aW1lU3RlcDogbnVtYmVyID0gMC4wNSxcblx0XHRwcml2YXRlIGNsaXBwaW5nID0gZmFsc2UsXG5cdCkgeyB9XG5cblx0Y2FsY3VsYXRlQm91bmRzIChnYW1lT2JqZWN0OiBTcGluZSk6IHtcblx0XHR4OiBudW1iZXI7XG5cdFx0eTogbnVtYmVyO1xuXHRcdHdpZHRoOiBudW1iZXI7XG5cdFx0aGVpZ2h0OiBudW1iZXI7XG5cdH0ge1xuXHRcdGlmICghZ2FtZU9iamVjdC5za2VsZXRvbiB8fCAhZ2FtZU9iamVjdC5zdGF0ZSlcblx0XHRcdHJldHVybiB7IHg6IDAsIHk6IDAsIHdpZHRoOiAwLCBoZWlnaHQ6IDAgfTtcblx0XHQvLyBNYWtlIGEgY29weSBvZiBhbmltYXRpb24gc3RhdGUgYW5kIHNrZWxldG9uIGFzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIHdoaWxlXG5cdFx0Ly8gdGhlIHNrZWxldG9uIGluIHRoZSBHYW1lT2JqZWN0IGhhcyBhbHJlYWR5IGJlZW4gaGVhdmlseSBtb2RpZmllZC4gV2UgY2FuIG5vdFxuXHRcdC8vIHJlY29uc3RydWN0IHRoYXQgc3RhdGUuXG5cdFx0Y29uc3QgYW5pbWF0aW9uU3RhdGUgPSBuZXcgQW5pbWF0aW9uU3RhdGUoZ2FtZU9iamVjdC5zdGF0ZS5kYXRhKTtcblx0XHRjb25zdCBza2VsZXRvbiA9IG5ldyBTa2VsZXRvbihnYW1lT2JqZWN0LnNrZWxldG9uLmRhdGEpO1xuXHRcdGNvbnN0IGNsaXBwZXIgPSB0aGlzLmNsaXBwaW5nID8gbmV3IFNrZWxldG9uQ2xpcHBpbmcoKSA6IHVuZGVmaW5lZDtcblx0XHRjb25zdCBkYXRhID0gc2tlbGV0b24uZGF0YTtcblx0XHRpZiAodGhpcy5za2lucy5sZW5ndGggPiAwKSB7XG5cdFx0XHRsZXQgY3VzdG9tU2tpbiA9IG5ldyBTa2luKFwiY3VzdG9tLXNraW5cIik7XG5cdFx0XHRmb3IgKGNvbnN0IHNraW5OYW1lIG9mIHRoaXMuc2tpbnMpIHtcblx0XHRcdFx0Y29uc3Qgc2tpbiA9IGRhdGEuZmluZFNraW4oc2tpbk5hbWUpO1xuXHRcdFx0XHRpZiAoc2tpbiA9PSBudWxsKSBjb250aW51ZTtcblx0XHRcdFx0Y3VzdG9tU2tpbi5hZGRTa2luKHNraW4pO1xuXHRcdFx0fVxuXHRcdFx0c2tlbGV0b24uc2V0U2tpbihjdXN0b21Ta2luKTtcblx0XHR9XG5cdFx0c2tlbGV0b24uc2V0VG9TZXR1cFBvc2UoKTtcblxuXHRcdGNvbnN0IGFuaW1hdGlvbiA9IHRoaXMuYW5pbWF0aW9uICE9IG51bGwgPyBkYXRhLmZpbmRBbmltYXRpb24odGhpcy5hbmltYXRpb24hKSA6IG51bGw7XG5cblx0XHRpZiAoYW5pbWF0aW9uID09IG51bGwpIHtcblx0XHRcdHNrZWxldG9uLnVwZGF0ZVdvcmxkVHJhbnNmb3JtKFBoeXNpY3MudXBkYXRlKTtcblx0XHRcdGNvbnN0IGJvdW5kcyA9IHNrZWxldG9uLmdldEJvdW5kc1JlY3QoY2xpcHBlcik7XG5cdFx0XHRyZXR1cm4gYm91bmRzLndpZHRoID09IE51bWJlci5ORUdBVElWRV9JTkZJTklUWVxuXHRcdFx0XHQ/IHsgeDogMCwgeTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCB9XG5cdFx0XHRcdDogYm91bmRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgbWluWCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcblx0XHRcdFx0bWluWSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcblx0XHRcdFx0bWF4WCA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcblx0XHRcdFx0bWF4WSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblx0XHRcdGFuaW1hdGlvblN0YXRlLmNsZWFyVHJhY2tzKCk7XG5cdFx0XHRhbmltYXRpb25TdGF0ZS5zZXRBbmltYXRpb25XaXRoKDAsIGFuaW1hdGlvbiwgZmFsc2UpO1xuXHRcdFx0Y29uc3Qgc3RlcHMgPSBNYXRoLm1heChhbmltYXRpb24uZHVyYXRpb24gLyB0aGlzLnRpbWVTdGVwLCAxLjApO1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGRlbHRhID0gaSA+IDAgPyB0aGlzLnRpbWVTdGVwIDogMDtcblx0XHRcdFx0YW5pbWF0aW9uU3RhdGUudXBkYXRlKGRlbHRhKTtcblx0XHRcdFx0YW5pbWF0aW9uU3RhdGUuYXBwbHkoc2tlbGV0b24pO1xuXHRcdFx0XHRza2VsZXRvbi51cGRhdGUoZGVsdGEpO1xuXHRcdFx0XHRza2VsZXRvbi51cGRhdGVXb3JsZFRyYW5zZm9ybShQaHlzaWNzLnVwZGF0ZSk7XG5cblx0XHRcdFx0Y29uc3QgYm91bmRzID0gc2tlbGV0b24uZ2V0Qm91bmRzUmVjdChjbGlwcGVyKTtcblx0XHRcdFx0bWluWCA9IE1hdGgubWluKG1pblgsIGJvdW5kcy54KTtcblx0XHRcdFx0bWluWSA9IE1hdGgubWluKG1pblksIGJvdW5kcy55KTtcblx0XHRcdFx0bWF4WCA9IE1hdGgubWF4KG1heFgsIGJvdW5kcy54ICsgYm91bmRzLndpZHRoKTtcblx0XHRcdFx0bWF4WSA9IE1hdGgubWF4KG1heFksIGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBib3VuZHMgPSB7XG5cdFx0XHRcdHg6IG1pblgsXG5cdFx0XHRcdHk6IG1pblksXG5cdFx0XHRcdHdpZHRoOiBtYXhYIC0gbWluWCxcblx0XHRcdFx0aGVpZ2h0OiBtYXhZIC0gbWluWSxcblx0XHRcdH07XG5cdFx0XHRyZXR1cm4gYm91bmRzLndpZHRoID09IE51bWJlci5ORUdBVElWRV9JTkZJTklUWVxuXHRcdFx0XHQ/IHsgeDogMCwgeTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCB9XG5cdFx0XHRcdDogYm91bmRzO1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNwaW5lT3B0aW9ucyBleHRlbmRzIENvbnRhaW5lck9wdGlvbnMge1xuXHQvKiogdGhlIHtAbGluayBTa2VsZXRvbkRhdGF9IHVzZWQgdG8gaW5zdGFudGlhdGUgdGhlIHNrZWxldG9uICovXG5cdHNrZWxldG9uRGF0YTogU2tlbGV0b25EYXRhO1xuXG5cdC8qKiAgU2VlIHtAbGluayBTcGluZUZyb21PcHRpb25zLmF1dG9VcGRhdGV9LiAqL1xuXHRhdXRvVXBkYXRlPzogYm9vbGVhbjtcblxuXHQvKiogIFNlZSB7QGxpbmsgU3BpbmVGcm9tT3B0aW9ucy5kYXJrVGludH0uICovXG5cdGRhcmtUaW50PzogYm9vbGVhbjtcblxuXHQvKiogIFNlZSB7QGxpbmsgU3BpbmVGcm9tT3B0aW9ucy5ib3VuZHNQcm92aWRlcn0uICovXG5cdGJvdW5kc1Byb3ZpZGVyPzogU3BpbmVCb3VuZHNQcm92aWRlcixcbn1cblxuLyoqXG4gKiBBbmltYXRpb25TdGF0ZUxpc3RlbmVyIHtAbGluayBodHRwczovL2VuLmVzb3Rlcmljc29mdHdhcmUuY29tL3NwaW5lLWFwaS1yZWZlcmVuY2UjQW5pbWF0aW9uU3RhdGVMaXN0ZW5lciBldmVudHN9IGV4cG9zZWQgZm9yIFBpeGkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3BpbmVFdmVudHMge1xuXHRjb21wbGV0ZTogW3RyYWNrRW50cnk6IFRyYWNrRW50cnldO1xuXHRkaXNwb3NlOiBbdHJhY2tFbnRyeTogVHJhY2tFbnRyeV07XG5cdGVuZDogW3RyYWNrRW50cnk6IFRyYWNrRW50cnldO1xuXHRldmVudDogW3RyYWNrRW50cnk6IFRyYWNrRW50cnksIGV2ZW50OiBFdmVudF07XG5cdGludGVycnVwdDogW3RyYWNrRW50cnk6IFRyYWNrRW50cnldO1xuXHRzdGFydDogW3RyYWNrRW50cnk6IFRyYWNrRW50cnldO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEF0dGFjaG1lbnRDYWNoZURhdGEge1xuXHRpZDogc3RyaW5nO1xuXHRjbGlwcGVkOiBib29sZWFuO1xuXHR2ZXJ0aWNlczogRmxvYXQzMkFycmF5O1xuXHR1dnM6IEZsb2F0MzJBcnJheTtcblx0aW5kaWNlczogbnVtYmVyW107XG5cdGNvbG9yOiBDb2xvcjtcblx0ZGFya0NvbG9yOiBDb2xvcjtcblx0ZGFya1RpbnQ6IGJvb2xlYW47XG5cdHNraXBSZW5kZXI6IGJvb2xlYW47XG5cdHRleHR1cmU6IFRleHR1cmU7XG5cdGNsaXBwZWREYXRhPzoge1xuXHRcdHZlcnRpY2VzOiBGbG9hdDMyQXJyYXk7XG5cdFx0dXZzOiBGbG9hdDMyQXJyYXk7XG5cdFx0aW5kaWNlczogVWludDE2QXJyYXk7XG5cdFx0dmVydGV4Q291bnQ6IG51bWJlcjtcblx0XHRpbmRpY2VzQ291bnQ6IG51bWJlcjtcblx0fTtcbn1cblxuaW50ZXJmYWNlIFNsb3RzVG9DbGlwcGluZyB7XG5cdHNsb3Q6IFNsb3QsXG5cdG1hc2s/OiBHcmFwaGljcyxcblx0bWFza0NvbXB1dGVkPzogYm9vbGVhbixcblx0dmVydGljZXM6IEFycmF5PG51bWJlcj4sXG59O1xuXG5jb25zdCBtYXNrUG9vbCA9IG5ldyBQb29sPEdyYXBoaWNzPigoKSA9PiBuZXcgR3JhcGhpY3MpO1xuXG4vKipcbiAqIFRoZSBjbGFzcyB0byBpbnN0YW50aWF0ZSBhIHtAbGluayBTcGluZX0gZ2FtZSBvYmplY3QgaW4gUGl4aS5cbiAqIFRoZSBzdGF0aWMgbWV0aG9kIHtAbGluayBTcGluZS5mcm9tfSBzaG91bGQgYmUgdXNlZCB0byBpbnN0YW50aWF0ZSBhIFNwaW5lIGdhbWUgb2JqZWN0LlxuICovXG5leHBvcnQgY2xhc3MgU3BpbmUgZXh0ZW5kcyBWaWV3Q29udGFpbmVyIHtcblx0Ly8gUGl4aSBwcm9wZXJ0aWVzXG5cdHB1YmxpYyBiYXRjaGVkID0gdHJ1ZTtcblx0cHVibGljIGJ1aWxkSWQgPSAwO1xuXHRwdWJsaWMgb3ZlcnJpZGUgcmVhZG9ubHkgcmVuZGVyUGlwZUlkID0gJ3NwaW5lJztcblx0cHVibGljIF9kaWRTcGluZVVwZGF0ZSA9IGZhbHNlO1xuXG5cdHB1YmxpYyBiZWZvcmVVcGRhdGVXb3JsZFRyYW5zZm9ybXM6IChvYmplY3Q6IFNwaW5lKSA9PiB2b2lkID0gKCkgPT4geyAvKiogKi8gfTtcblx0cHVibGljIGFmdGVyVXBkYXRlV29ybGRUcmFuc2Zvcm1zOiAob2JqZWN0OiBTcGluZSkgPT4gdm9pZCA9ICgpID0+IHsgLyoqICovIH07XG5cblx0Ly8gU3BpbmUgcHJvcGVydGllc1xuXHQvKiogVGhlIHNrZWxldG9uIGZvciB0aGlzIFNwaW5lIGdhbWUgb2JqZWN0LiAqL1xuXHRwdWJsaWMgc2tlbGV0b246IFNrZWxldG9uO1xuXHQvKiogVGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3IgdGhpcyBTcGluZSBnYW1lIG9iamVjdC4gKi9cblx0cHVibGljIHN0YXRlOiBBbmltYXRpb25TdGF0ZTtcblx0cHVibGljIHNrZWxldG9uQm91bmRzPzogU2tlbGV0b25Cb3VuZHM7XG5cblx0cHJpdmF0ZSBkYXJrVGludCA9IGZhbHNlO1xuXHRwcml2YXRlIF9kZWJ1Zz86IElTcGluZURlYnVnUmVuZGVyZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cblx0cmVhZG9ubHkgX3Nsb3RzT2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCB7IHNsb3Q6IFNsb3QsIGNvbnRhaW5lcjogQ29udGFpbmVyLCBmb2xsb3dBdHRhY2htZW50VGltZWxpbmU6IGJvb2xlYW4gfSB8IG51bGw+ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblx0cHJpdmF0ZSBjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrczogUmVjb3JkPHN0cmluZywgU2xvdHNUb0NsaXBwaW5nPiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0cHJpdmF0ZSBnZXRTbG90RnJvbVJlZiAoc2xvdFJlZjogbnVtYmVyIHwgc3RyaW5nIHwgU2xvdCk6IFNsb3Qge1xuXHRcdGxldCBzbG90OiBTbG90IHwgbnVsbDtcblxuXHRcdGlmICh0eXBlb2Ygc2xvdFJlZiA9PT0gJ251bWJlcicpIHNsb3QgPSB0aGlzLnNrZWxldG9uLnNsb3RzW3Nsb3RSZWZdO1xuXHRcdGVsc2UgaWYgKHR5cGVvZiBzbG90UmVmID09PSAnc3RyaW5nJykgc2xvdCA9IHRoaXMuc2tlbGV0b24uZmluZFNsb3Qoc2xvdFJlZik7XG5cdFx0ZWxzZSBzbG90ID0gc2xvdFJlZjtcblxuXHRcdGlmICghc2xvdCkgdGhyb3cgbmV3IEVycm9yKGBObyBzbG90IGZvdW5kIHdpdGggdGhlIGdpdmVuIHNsb3QgcmVmZXJlbmNlOiAke3Nsb3RSZWZ9YCk7XG5cblx0XHRyZXR1cm4gc2xvdDtcblx0fVxuXG5cdHB1YmxpYyBzcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRwdWJsaWMgc3BpbmVUZXh0dXJlc0RpcnR5ID0gdHJ1ZTtcblxuXHRwcml2YXRlIF9sYXN0QXR0YWNobWVudHM6IEF0dGFjaG1lbnRbXSA9IFtdO1xuXG5cdHByaXZhdGUgX3N0YXRlQ2hhbmdlZCA9IHRydWU7XG5cdHByaXZhdGUgYXR0YWNobWVudENhY2hlRGF0YTogUmVjb3JkPHN0cmluZywgQXR0YWNobWVudENhY2hlRGF0YT5bXSA9IFtdO1xuXG5cdHB1YmxpYyBnZXQgZGVidWcgKCk6IElTcGluZURlYnVnUmVuZGVyZXIgfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLl9kZWJ1Zztcblx0fVxuXG5cdC8qKiBQYXNzIGEge0BsaW5rIFNwaW5lRGVidWdSZW5kZXJlcn0gb3IgY3JlYXRlIHlvdXIgb3duIHtAbGluayBJU3BpbmVEZWJ1Z1JlbmRlcmVyfSB0byByZW5kZXIgYm9uZXMsIG1lc2hlcywgLi4uXG5cdCAqIEBleGFtcGxlIHNwaW5lR08uZGVidWcgPSBuZXcgU3BpbmVEZWJ1Z1JlbmRlcmVyKCk7XG5cdCAqL1xuXHRwdWJsaWMgc2V0IGRlYnVnICh2YWx1ZTogSVNwaW5lRGVidWdSZW5kZXJlciB8IHVuZGVmaW5lZCkge1xuXHRcdGlmICh0aGlzLl9kZWJ1Zykge1xuXHRcdFx0dGhpcy5fZGVidWcudW5yZWdpc3RlclNwaW5lKHRoaXMpO1xuXHRcdH1cblx0XHRpZiAodmFsdWUpIHtcblx0XHRcdHZhbHVlLnJlZ2lzdGVyU3BpbmUodGhpcyk7XG5cdFx0fVxuXHRcdHRoaXMuX2RlYnVnID0gdmFsdWU7XG5cdH1cblxuXHRwcml2YXRlIF9hdXRvVXBkYXRlID0gZmFsc2U7XG5cblx0cHVibGljIGdldCBhdXRvVXBkYXRlICgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5fYXV0b1VwZGF0ZTtcblx0fVxuXHQvKiogV2hlbiBgdHJ1ZWAsIHRoZSBTcGluZSBBbmltYXRpb25TdGF0ZSBhbmQgdGhlIFNrZWxldG9uIHdpbGwgYmUgYXV0b21hdGljYWxseSB1cGRhdGVkIHVzaW5nIHRoZSB7QGxpbmsgVGlja2VyLnNoYXJlZH0gaW5zdGFuY2UuICovXG5cdHB1YmxpYyBzZXQgYXV0b1VwZGF0ZSAodmFsdWU6IGJvb2xlYW4pIHtcblx0XHRpZiAodmFsdWUgJiYgIXRoaXMuX2F1dG9VcGRhdGUpIHtcblx0XHRcdFRpY2tlci5zaGFyZWQuYWRkKHRoaXMuaW50ZXJuYWxVcGRhdGUsIHRoaXMpO1xuXHRcdH0gZWxzZSBpZiAoIXZhbHVlICYmIHRoaXMuX2F1dG9VcGRhdGUpIHtcblx0XHRcdFRpY2tlci5zaGFyZWQucmVtb3ZlKHRoaXMuaW50ZXJuYWxVcGRhdGUsIHRoaXMpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2F1dG9VcGRhdGUgPSB2YWx1ZTtcblx0fVxuXG5cdHByaXZhdGUgX2JvdW5kc1Byb3ZpZGVyPzogU3BpbmVCb3VuZHNQcm92aWRlcjtcblx0LyoqIFRoZSBib3VuZHMgcHJvdmlkZXIgdG8gdXNlLiBJZiB1bmRlZmluZWQgdGhlIGJvdW5kcyB3aWxsIGJlIGR5bmFtaWMsIGNhbGN1bGF0ZWQgd2hlbiByZXF1ZXN0ZWQgYW5kIGJhc2VkIG9uIHRoZSBjdXJyZW50IGZyYW1lLiAqL1xuXHRwdWJsaWMgZ2V0IGJvdW5kc1Byb3ZpZGVyICgpOiBTcGluZUJvdW5kc1Byb3ZpZGVyIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gdGhpcy5fYm91bmRzUHJvdmlkZXI7XG5cdH1cblx0cHVibGljIHNldCBib3VuZHNQcm92aWRlciAodmFsdWU6IFNwaW5lQm91bmRzUHJvdmlkZXIgfCB1bmRlZmluZWQpIHtcblx0XHR0aGlzLl9ib3VuZHNQcm92aWRlciA9IHZhbHVlO1xuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0dGhpcy5fYm91bmRzRGlydHkgPSBmYWxzZTtcblx0XHR9XG5cdFx0dGhpcy51cGRhdGVCb3VuZHMoKTtcblx0fVxuXG5cdHByaXZhdGUgaGFzTmV2ZXJVcGRhdGVkID0gdHJ1ZTtcblx0Y29uc3RydWN0b3IgKG9wdGlvbnM6IFNwaW5lT3B0aW9ucyB8IFNrZWxldG9uRGF0YSkge1xuXHRcdGlmIChvcHRpb25zIGluc3RhbmNlb2YgU2tlbGV0b25EYXRhKSB7XG5cdFx0XHRvcHRpb25zID0ge1xuXHRcdFx0XHRza2VsZXRvbkRhdGE6IG9wdGlvbnMsXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHN1cGVyKHt9KTtcblxuXHRcdHRoaXMuYWxsb3dDaGlsZHJlbiA9IHRydWU7XG5cblx0XHRjb25zdCBza2VsZXRvbkRhdGEgPSBvcHRpb25zIGluc3RhbmNlb2YgU2tlbGV0b25EYXRhID8gb3B0aW9ucyA6IG9wdGlvbnMuc2tlbGV0b25EYXRhO1xuXG5cdFx0dGhpcy5za2VsZXRvbiA9IG5ldyBTa2VsZXRvbihza2VsZXRvbkRhdGEpO1xuXHRcdHRoaXMuc3RhdGUgPSBuZXcgQW5pbWF0aW9uU3RhdGUobmV3IEFuaW1hdGlvblN0YXRlRGF0YShza2VsZXRvbkRhdGEpKTtcblx0XHR0aGlzLmF1dG9VcGRhdGUgPSBvcHRpb25zPy5hdXRvVXBkYXRlID8/IHRydWU7XG5cblx0XHQvLyBkYXJrIHRpbnQgY2FuIGJlIGVuYWJsZWQgYnkgb3B0aW9ucywgb3RoZXJ3aXNlIGlzIGVuYWJsZSBpZiBhdCBsZWFzdCBvbmUgc2xvdCBoYXMgdGludCBibGFja1xuXHRcdHRoaXMuZGFya1RpbnQgPSBvcHRpb25zPy5kYXJrVGludCA9PT0gdW5kZWZpbmVkXG5cdFx0XHQ/IHRoaXMuc2tlbGV0b24uc2xvdHMuc29tZShzbG90ID0+ICEhc2xvdC5kYXRhLmRhcmtDb2xvcilcblx0XHRcdDogb3B0aW9ucz8uZGFya1RpbnQ7XG5cblx0XHRjb25zdCBzbG90cyA9IHRoaXMuc2tlbGV0b24uc2xvdHM7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNsb3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmF0dGFjaG1lbnRDYWNoZURhdGFbaV0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2JvdW5kc1Byb3ZpZGVyID0gb3B0aW9ucy5ib3VuZHNQcm92aWRlcjtcblx0fVxuXG5cdC8qKiBJZiB7QGxpbmsgU3BpbmUuYXV0b1VwZGF0ZX0gaXMgYGZhbHNlYCwgdGhpcyBtZXRob2QgYWxsb3dzIHRvIHVwZGF0ZSB0aGUgQW5pbWF0aW9uU3RhdGUgYW5kIHRoZSBTa2VsZXRvbiB3aXRoIHRoZSBnaXZlbiBkZWx0YS4gKi9cblx0cHVibGljIHVwZGF0ZSAoZHQ6IG51bWJlcik6IHZvaWQge1xuXHRcdHRoaXMuaW50ZXJuYWxVcGRhdGUoMCwgZHQpO1xuXHR9XG5cblx0cHJvdGVjdGVkIGludGVybmFsVXBkYXRlIChfZGVsdGFGcmFtZTogYW55LCBkZWx0YVNlY29uZHM/OiBudW1iZXIpOiB2b2lkIHtcblx0XHQvLyBCZWNhdXNlIHJlYXNvbnMsIHBpeGkgdXNlcyBkZWx0YUZyYW1lcyBhdCA2MGZwcy5cblx0XHQvLyBXZSBpZ25vcmUgdGhlIGRlZmF1bHQgZGVsdGFGcmFtZXMgYW5kIHVzZSB0aGUgZGVsdGFTZWNvbmRzIGZyb20gcGl4aSB0aWNrZXIuXG5cdFx0dGhpcy5fdXBkYXRlQW5kQXBwbHlTdGF0ZShkZWx0YVNlY29uZHMgPz8gVGlja2VyLnNoYXJlZC5kZWx0YU1TIC8gMTAwMCk7XG5cdH1cblxuXHRvdmVycmlkZSBnZXQgYm91bmRzICgpIHtcblx0XHRpZiAodGhpcy5fYm91bmRzRGlydHkpIHtcblx0XHRcdHRoaXMudXBkYXRlQm91bmRzKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX2JvdW5kcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBib25lIGdpdmVuIGluIGlucHV0IHRocm91Z2ggYSB7QGxpbmsgSVBvaW50RGF0YX0uXG5cdCAqIEBwYXJhbSBib25lOiB0aGUgYm9uZSBuYW1lIG9yIHRoZSBib25lIGluc3RhbmNlIHRvIHNldCB0aGUgcG9zaXRpb25cblx0ICogQHBhcmFtIG91dFBvczogdGhlIG5ldyBwb3NpdGlvbiBvZiB0aGUgYm9uZS5cblx0ICogQHRocm93cyB7RXJyb3J9OiBpZiB0aGUgZ2l2ZW4gYm9uZSBpcyBub3QgZm91bmQgaW4gdGhlIHNrZWxldG9uLCBhbiBlcnJvciBpcyB0aHJvd25cblx0ICovXG5cdHB1YmxpYyBzZXRCb25lUG9zaXRpb24gKGJvbmU6IHN0cmluZyB8IEJvbmUsIHBvc2l0aW9uOiBQb2ludERhdGEpOiB2b2lkIHtcblx0XHRjb25zdCBib25lQXV4ID0gYm9uZTtcblxuXHRcdGlmICh0eXBlb2YgYm9uZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGJvbmUgPSB0aGlzLnNrZWxldG9uLmZpbmRCb25lKGJvbmUpIGFzIEJvbmU7XG5cdFx0fVxuXG5cdFx0aWYgKCFib25lKSB0aHJvdyBFcnJvcihgQ2FudCBzZXQgYm9uZSBwb3NpdGlvbiwgYm9uZSAke1N0cmluZyhib25lQXV4KX0gbm90IGZvdW5kYCk7XG5cdFx0dmVjdG9yQXV4LnNldChwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcblxuXHRcdGlmIChib25lLnBhcmVudCkge1xuXHRcdFx0Y29uc3QgYXV4ID0gYm9uZS5wYXJlbnQud29ybGRUb0xvY2FsKHZlY3RvckF1eCk7XG5cblx0XHRcdGJvbmUueCA9IGF1eC54O1xuXHRcdFx0Ym9uZS55ID0gLWF1eC55O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGJvbmUueCA9IHZlY3RvckF1eC54O1xuXHRcdFx0Ym9uZS55ID0gdmVjdG9yQXV4Lnk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGJvbmUgZ2l2ZW4gaW4gaW5wdXQgaW50byBhbiB7QGxpbmsgSVBvaW50RGF0YX0uXG5cdCAqIEBwYXJhbSBib25lOiB0aGUgYm9uZSBuYW1lIG9yIHRoZSBib25lIGluc3RhbmNlIHRvIGdldCB0aGUgcG9zaXRpb24gZnJvbVxuXHQgKiBAcGFyYW0gb3V0UG9zOiBhbiBvcHRpb25hbCB7QGxpbmsgSVBvaW50RGF0YX0gdG8gdXNlIHRvIHJldHVybiB0aGUgYm9uZSBwb3NpdGlvbiwgcmF0aGVybiB0aGFuIGluc3RhbnRpYXRpbmcgYSBuZXcgb2JqZWN0LlxuXHQgKiBAcmV0dXJucyB7SVBvaW50RGF0YSB8IHVuZGVmaW5lZH06IHRoZSBwb3NpdGlvbiBvZiB0aGUgYm9uZSwgb3IgdW5kZWZpbmVkIGlmIG5vIG1hdGNoaW5nIGJvbmUgaXMgZm91bmQgaW4gdGhlIHNrZWxldG9uXG5cdCAqL1xuXHRwdWJsaWMgZ2V0Qm9uZVBvc2l0aW9uIChib25lOiBzdHJpbmcgfCBCb25lLCBvdXRQb3M/OiBQb2ludERhdGEpOiBQb2ludERhdGEgfCB1bmRlZmluZWQge1xuXHRcdGNvbnN0IGJvbmVBdXggPSBib25lO1xuXG5cdFx0aWYgKHR5cGVvZiBib25lID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ym9uZSA9IHRoaXMuc2tlbGV0b24uZmluZEJvbmUoYm9uZSkgYXMgQm9uZTtcblx0XHR9XG5cblx0XHRpZiAoIWJvbmUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYENhbnQgc2V0IGJvbmUgcG9zaXRpb24hIEJvbmUgJHtTdHJpbmcoYm9uZUF1eCl9IG5vdCBmb3VuZGApO1xuXG5cdFx0XHRyZXR1cm4gb3V0UG9zO1xuXHRcdH1cblxuXHRcdGlmICghb3V0UG9zKSB7XG5cdFx0XHRvdXRQb3MgPSB7IHg6IDAsIHk6IDAgfTtcblx0XHR9XG5cblx0XHRvdXRQb3MueCA9IGJvbmUud29ybGRYO1xuXHRcdG91dFBvcy55ID0gYm9uZS53b3JsZFk7XG5cblx0XHRyZXR1cm4gb3V0UG9zO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkdmFuY2UgdGhlIHN0YXRlIGFuZCBza2VsZXRvbiBieSB0aGUgZ2l2ZW4gdGltZSwgdGhlbiB1cGRhdGUgc2xvdCBvYmplY3RzIHRvby5cblx0ICogVGhlIGNvbnRhaW5lciB0cmFuc2Zvcm0gaXMgbm90IHVwZGF0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB0aW1lIHRoZSB0aW1lIGF0IHdoaWNoIHRvIHNldCB0aGUgc3RhdGVcblx0ICovXG5cdHByaXZhdGUgX3VwZGF0ZUFuZEFwcGx5U3RhdGUgKHRpbWU6IG51bWJlcikge1xuXHRcdHRoaXMuaGFzTmV2ZXJVcGRhdGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLnN0YXRlLnVwZGF0ZSh0aW1lKTtcblx0XHR0aGlzLnNrZWxldG9uLnVwZGF0ZSh0aW1lKTtcblxuXHRcdGNvbnN0IHsgc2tlbGV0b24gfSA9IHRoaXM7XG5cblx0XHR0aGlzLnN0YXRlLmFwcGx5KHNrZWxldG9uKTtcblxuXHRcdHRoaXMuYmVmb3JlVXBkYXRlV29ybGRUcmFuc2Zvcm1zKHRoaXMpO1xuXHRcdHNrZWxldG9uLnVwZGF0ZVdvcmxkVHJhbnNmb3JtKFBoeXNpY3MudXBkYXRlKTtcblx0XHR0aGlzLmFmdGVyVXBkYXRlV29ybGRUcmFuc2Zvcm1zKHRoaXMpO1xuXG5cdFx0dGhpcy51cGRhdGVTbG90T2JqZWN0cygpO1xuXG5cdFx0dGhpcy5fc3RhdGVDaGFuZ2VkID0gdHJ1ZTtcblxuXHRcdHRoaXMub25WaWV3VXBkYXRlKCk7XG5cdH1cblxuXHQvKipcblx0ICogLSB2YWxpZGF0ZXMgdGhlIGF0dGFjaG1lbnRzIC0gdG8gZmxhZyBpZiB0aGUgYXR0YWNobWVudHMgaGF2ZSBjaGFuZ2VkIHRoaXMgc3RhdGVcblx0ICogLSB0cmFuc2Zvcm1zIHRoZSBhdHRhY2htZW50cyAtIHRvIHVwZGF0ZSB0aGUgdmVydGljZXMgb2YgdGhlIGF0dGFjaG1lbnRzIGJhc2VkIG9uIHRoZSBuZXcgcG9zaXRpb25zXG5cdCAqIEBpbnRlcm5hbFxuXHQgKi9cblx0X3ZhbGlkYXRlQW5kVHJhbnNmb3JtQXR0YWNobWVudHMgKCkge1xuXHRcdGlmICghdGhpcy5fc3RhdGVDaGFuZ2VkKSByZXR1cm47XG5cdFx0dGhpcy5fc3RhdGVDaGFuZ2VkID0gZmFsc2U7XG5cblx0XHR0aGlzLnZhbGlkYXRlQXR0YWNobWVudHMoKTtcblxuXHRcdHRoaXMudHJhbnNmb3JtQXR0YWNobWVudHMoKTtcblx0fVxuXG5cdHByaXZhdGUgdmFsaWRhdGVBdHRhY2htZW50cyAoKSB7XG5cblx0XHRjb25zdCBjdXJyZW50RHJhd09yZGVyID0gdGhpcy5za2VsZXRvbi5kcmF3T3JkZXI7XG5cblx0XHRjb25zdCBsYXN0QXR0YWNobWVudHMgPSB0aGlzLl9sYXN0QXR0YWNobWVudHM7XG5cblx0XHRsZXQgaW5kZXggPSAwO1xuXG5cdFx0bGV0IHNwaW5lQXR0YWNobWVudHNEaXJ0eSA9IGZhbHNlO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50RHJhd09yZGVyLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBzbG90ID0gY3VycmVudERyYXdPcmRlcltpXTtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBzbG90LmdldEF0dGFjaG1lbnQoKTtcblxuXHRcdFx0aWYgKGF0dGFjaG1lbnQpIHtcblx0XHRcdFx0aWYgKGF0dGFjaG1lbnQgIT09IGxhc3RBdHRhY2htZW50c1tpbmRleF0pIHtcblx0XHRcdFx0XHRzcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRcdGxhc3RBdHRhY2htZW50c1tpbmRleF0gPSBhdHRhY2htZW50O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5kZXgrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaW5kZXggIT09IGxhc3RBdHRhY2htZW50cy5sZW5ndGgpIHtcblx0XHRcdHNwaW5lQXR0YWNobWVudHNEaXJ0eSA9IHRydWU7XG5cdFx0XHRsYXN0QXR0YWNobWVudHMubGVuZ3RoID0gaW5kZXg7XG5cdFx0fVxuXG5cdFx0dGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgfHw9IHNwaW5lQXR0YWNobWVudHNEaXJ0eTtcblx0fVxuXG5cdHByaXZhdGUgY3VycmVudENsaXBwaW5nU2xvdDogU2xvdHNUb0NsaXBwaW5nIHwgdW5kZWZpbmVkO1xuXHRwcml2YXRlIHVwZGF0ZUFuZFNldFBpeGlNYXNrIChzbG90OiBTbG90LCBsYXN0OiBib29sZWFuKSB7XG5cdFx0Ly8gYXNzaWduL2NyZWF0ZSB0aGUgY3VycmVudENsaXBwaW5nU2xvdFxuXHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBzbG90LmF0dGFjaG1lbnQ7XG5cdFx0aWYgKGF0dGFjaG1lbnQgJiYgYXR0YWNobWVudCBpbnN0YW5jZW9mIENsaXBwaW5nQXR0YWNobWVudCkge1xuXHRcdFx0Y29uc3QgY2xpcCA9ICh0aGlzLmNsaXBwaW5nU2xvdFRvUGl4aU1hc2tzW3Nsb3QuZGF0YS5uYW1lXSB8fD0geyBzbG90LCB2ZXJ0aWNlczogbmV3IEFycmF5PG51bWJlcj4oKSB9KTtcblx0XHRcdGNsaXAubWFza0NvbXB1dGVkID0gZmFsc2U7XG5cdFx0XHR0aGlzLmN1cnJlbnRDbGlwcGluZ1Nsb3QgPSBjbGlwO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIGFzc2lnbiB0aGUgY3VycmVudENsaXBwaW5nU2xvdCBtYXNrIHRvIHRoZSBzbG90IG9iamVjdFxuXHRcdGxldCBjdXJyZW50Q2xpcHBpbmdTbG90ID0gdGhpcy5jdXJyZW50Q2xpcHBpbmdTbG90O1xuXHRcdGxldCBzbG90T2JqZWN0ID0gdGhpcy5fc2xvdHNPYmplY3Rbc2xvdC5kYXRhLm5hbWVdO1xuXHRcdGlmIChjdXJyZW50Q2xpcHBpbmdTbG90ICYmIHNsb3RPYmplY3QpIHtcblx0XHRcdC8vIGNyZWF0ZSB0aGUgcGl4aSBtYXNrLCBvbmx5IHRoZSBmaXJzdCB0aW1lIGFuZCBpZiB0aGUgY2xpcHBlZCBzbG90IGlzIHRoZSBmaXJzdCBvbmUgY2xpcHBlZCBieSB0aGlzIGN1cnJlbnRDbGlwcGluZ1Nsb3Rcblx0XHRcdGxldCBtYXNrID0gY3VycmVudENsaXBwaW5nU2xvdC5tYXNrO1xuXHRcdFx0aWYgKCFtYXNrKSB7XG5cdFx0XHRcdG1hc2sgPSBtYXNrUG9vbC5vYnRhaW4oKTtcblx0XHRcdFx0Y3VycmVudENsaXBwaW5nU2xvdC5tYXNrID0gbWFzaztcblx0XHRcdFx0dGhpcy5hZGRDaGlsZChtYXNrKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gY29tcHV0ZSB0aGUgcGl4aSBtYXNrIHBvbHlnb24sIGlmIHRoZSBjbGlwcGVkIHNsb3QgaXMgdGhlIGZpcnN0IG9uZSBjbGlwcGVkIGJ5IHRoaXMgY3VycmVudENsaXBwaW5nU2xvdFxuXHRcdFx0aWYgKCFjdXJyZW50Q2xpcHBpbmdTbG90Lm1hc2tDb21wdXRlZCkge1xuXHRcdFx0XHRsZXQgc2xvdENsaXBwaW5nID0gY3VycmVudENsaXBwaW5nU2xvdC5zbG90O1xuXHRcdFx0XHRsZXQgY2xpcHBpbmdBdHRhY2htZW50ID0gc2xvdENsaXBwaW5nLmF0dGFjaG1lbnQgYXMgQ2xpcHBpbmdBdHRhY2htZW50O1xuXHRcdFx0XHRjdXJyZW50Q2xpcHBpbmdTbG90Lm1hc2tDb21wdXRlZCA9IHRydWU7XG5cdFx0XHRcdGNvbnN0IHdvcmxkVmVydGljZXNMZW5ndGggPSBjbGlwcGluZ0F0dGFjaG1lbnQud29ybGRWZXJ0aWNlc0xlbmd0aDtcblx0XHRcdFx0Y29uc3QgdmVydGljZXMgPSBjdXJyZW50Q2xpcHBpbmdTbG90LnZlcnRpY2VzO1xuXHRcdFx0XHRjbGlwcGluZ0F0dGFjaG1lbnQuY29tcHV0ZVdvcmxkVmVydGljZXMoc2xvdENsaXBwaW5nLCAwLCB3b3JsZFZlcnRpY2VzTGVuZ3RoLCB2ZXJ0aWNlcywgMCwgMik7XG5cdFx0XHRcdG1hc2suY2xlYXIoKS5wb2x5KHZlcnRpY2VzKS5zdHJva2UoeyB3aWR0aDogMCB9KS5maWxsKHsgYWxwaGE6IC4yNSB9KTtcblx0XHRcdH1cblx0XHRcdHNsb3RPYmplY3QuY29udGFpbmVyLm1hc2sgPSBtYXNrO1xuXHRcdH0gZWxzZSBpZiAoc2xvdE9iamVjdD8uY29udGFpbmVyLm1hc2spIHtcblx0XHRcdC8vIHJlbW92ZSB0aGUgbWFzaywgaWYgc2xvdCBvYmplY3QgaGFzIGEgbWFzaywgYnV0IGN1cnJlbnRDbGlwcGluZ1Nsb3QgaXMgdW5kZWZpbmVkXG5cdFx0XHRzbG90T2JqZWN0LmNvbnRhaW5lci5tYXNrID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBpZiBjdXJyZW50IHNsb3QgaXMgdGhlIGVuZGluZyBvbmUgb2YgdGhlIGN1cnJlbnRDbGlwcGluZ1Nsb3QgbWFzaywgc2V0IGN1cnJlbnRDbGlwcGluZ1Nsb3QgdG8gdW5kZWZpbmVkXG5cdFx0aWYgKGN1cnJlbnRDbGlwcGluZ1Nsb3QgJiYgKGN1cnJlbnRDbGlwcGluZ1Nsb3Quc2xvdC5hdHRhY2htZW50IGFzIENsaXBwaW5nQXR0YWNobWVudCkuZW5kU2xvdCA9PSBzbG90LmRhdGEpIHtcblx0XHRcdHRoaXMuY3VycmVudENsaXBwaW5nU2xvdCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHQvLyBjbGVhbiB1cCB1bnVzZWQgbWFza3Ncblx0XHRpZiAobGFzdCkge1xuXHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gdGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrcykge1xuXHRcdFx0XHRjb25zdCBjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrID0gdGhpcy5jbGlwcGluZ1Nsb3RUb1BpeGlNYXNrc1trZXldO1xuXHRcdFx0XHRpZiAoKCEoY2xpcHBpbmdTbG90VG9QaXhpTWFzay5zbG90LmF0dGFjaG1lbnQgaW5zdGFuY2VvZiBDbGlwcGluZ0F0dGFjaG1lbnQpIHx8ICFjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2tDb21wdXRlZCkgJiYgY2xpcHBpbmdTbG90VG9QaXhpTWFzay5tYXNrKSB7XG5cdFx0XHRcdFx0dGhpcy5yZW1vdmVDaGlsZChjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2spO1xuXHRcdFx0XHRcdG1hc2tQb29sLmZyZWUoY2xpcHBpbmdTbG90VG9QaXhpTWFzay5tYXNrKTtcblx0XHRcdFx0XHRjbGlwcGluZ1Nsb3RUb1BpeGlNYXNrLm1hc2sgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMuY3VycmVudENsaXBwaW5nU2xvdCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHRyYW5zZm9ybUF0dGFjaG1lbnRzICgpIHtcblx0XHRjb25zdCBjdXJyZW50RHJhd09yZGVyID0gdGhpcy5za2VsZXRvbi5kcmF3T3JkZXI7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnREcmF3T3JkZXIubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IHNsb3QgPSBjdXJyZW50RHJhd09yZGVyW2ldO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZUFuZFNldFBpeGlNYXNrKHNsb3QsIGkgPT09IGN1cnJlbnREcmF3T3JkZXIubGVuZ3RoIC0gMSk7XG5cblx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBzbG90LmdldEF0dGFjaG1lbnQoKTtcblxuXHRcdFx0aWYgKGF0dGFjaG1lbnQpIHtcblx0XHRcdFx0aWYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBNZXNoQXR0YWNobWVudCB8fCBhdHRhY2htZW50IGluc3RhbmNlb2YgUmVnaW9uQXR0YWNobWVudCkge1xuXHRcdFx0XHRcdGNvbnN0IGNhY2hlRGF0YSA9IHRoaXMuX2dldENhY2hlZERhdGEoc2xvdCwgYXR0YWNobWVudCk7XG5cblx0XHRcdFx0XHRpZiAoYXR0YWNobWVudCBpbnN0YW5jZW9mIFJlZ2lvbkF0dGFjaG1lbnQpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuY29tcHV0ZVdvcmxkVmVydGljZXMoc2xvdCwgY2FjaGVEYXRhLnZlcnRpY2VzLCAwLCAyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmNvbXB1dGVXb3JsZFZlcnRpY2VzKFxuXHRcdFx0XHRcdFx0XHRzbG90LFxuXHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LndvcmxkVmVydGljZXNMZW5ndGgsXG5cdFx0XHRcdFx0XHRcdGNhY2hlRGF0YS52ZXJ0aWNlcyxcblx0XHRcdFx0XHRcdFx0MCxcblx0XHRcdFx0XHRcdFx0Mixcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gc2VxdWVuY2VzIHV2cyBhcmUga25vd24gb25seSBhZnRlciBjb21wdXRlV29ybGRWZXJ0aWNlcyBpcyBpbnZva2VkXG5cdFx0XHRcdFx0aWYgKGNhY2hlRGF0YS51dnMubGVuZ3RoIDwgYXR0YWNobWVudC51dnMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRjYWNoZURhdGEudXZzID0gbmV3IEZsb2F0MzJBcnJheShhdHRhY2htZW50LnV2cy5sZW5ndGgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIG5lZWQgdG8gY29weSBiZWNhdXNlIGF0dGFjaG1lbnRzIHV2cyBhcmUgc2hhcmVkIGFtb25nIHNrZWxldG9ucyB1c2luZyB0aGUgc2FtZSBhdGxhc1xuXHRcdFx0XHRcdGZhc3RDb3B5KChhdHRhY2htZW50LnV2cyBhcyBGbG9hdDMyQXJyYXkpLmJ1ZmZlciwgY2FjaGVEYXRhLnV2cy5idWZmZXIpO1xuXG5cdFx0XHRcdFx0Y29uc3Qgc2tlbGV0b24gPSBzbG90LmJvbmUuc2tlbGV0b247XG5cdFx0XHRcdFx0Y29uc3Qgc2tlbGV0b25Db2xvciA9IHNrZWxldG9uLmNvbG9yO1xuXHRcdFx0XHRcdGNvbnN0IHNsb3RDb2xvciA9IHNsb3QuY29sb3I7XG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudENvbG9yID0gYXR0YWNobWVudC5jb2xvcjtcblx0XHRcdFx0XHRjb25zdCBhbHBoYSA9IHNrZWxldG9uQ29sb3IuYSAqIHNsb3RDb2xvci5hICogYXR0YWNobWVudENvbG9yLmE7XG5cblx0XHRcdFx0XHRjYWNoZURhdGEuY29sb3Iuc2V0KFxuXHRcdFx0XHRcdFx0c2tlbGV0b25Db2xvci5yICogc2xvdENvbG9yLnIgKiBhdHRhY2htZW50Q29sb3Iucixcblx0XHRcdFx0XHRcdHNrZWxldG9uQ29sb3IuZyAqIHNsb3RDb2xvci5nICogYXR0YWNobWVudENvbG9yLmcsXG5cdFx0XHRcdFx0XHRza2VsZXRvbkNvbG9yLmIgKiBzbG90Q29sb3IuYiAqIGF0dGFjaG1lbnRDb2xvci5iLFxuXHRcdFx0XHRcdFx0YWxwaGEsXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmICh0aGlzLmFscGhhID09PSAwIHx8IGFscGhhID09PSAwKSB7XG5cdFx0XHRcdFx0XHRpZiAoIWNhY2hlRGF0YS5za2lwUmVuZGVyKSB0aGlzLnNwaW5lQXR0YWNobWVudHNEaXJ0eSA9IHRydWU7XG5cdFx0XHRcdFx0XHRjYWNoZURhdGEuc2tpcFJlbmRlciA9IHRydWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChjYWNoZURhdGEuc2tpcFJlbmRlcikgdGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRcdFx0Y2FjaGVEYXRhLnNraXBSZW5kZXIgPSBjYWNoZURhdGEuY2xpcHBlZCA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoc2xvdC5kYXJrQ29sb3IpIHtcblx0XHRcdFx0XHRcdFx0Y2FjaGVEYXRhLmRhcmtDb2xvci5zZXRGcm9tQ29sb3Ioc2xvdC5kYXJrQ29sb3IpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjb25zdCB0ZXh0dXJlID0gYXR0YWNobWVudC5yZWdpb24/LnRleHR1cmUudGV4dHVyZSB8fCBUZXh0dXJlLkVNUFRZO1xuXG5cdFx0XHRcdFx0XHRpZiAoY2FjaGVEYXRhLnRleHR1cmUgIT09IHRleHR1cmUpIHtcblx0XHRcdFx0XHRcdFx0Y2FjaGVEYXRhLnRleHR1cmUgPSB0ZXh0dXJlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNwaW5lVGV4dHVyZXNEaXJ0eSA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChjbGlwcGVyLmlzQ2xpcHBpbmcoKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUNsaXBwaW5nRGF0YShjYWNoZURhdGEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGF0dGFjaG1lbnQgaW5zdGFuY2VvZiBDbGlwcGluZ0F0dGFjaG1lbnQpIHtcblx0XHRcdFx0XHRjbGlwcGVyLmNsaXBTdGFydChzbG90LCBhdHRhY2htZW50KTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2xpcHBlci5jbGlwRW5kV2l0aFNsb3Qoc2xvdCk7XG5cdFx0fVxuXHRcdGNsaXBwZXIuY2xpcEVuZCgpO1xuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVDbGlwcGluZ0RhdGEgKGNhY2hlRGF0YTogQXR0YWNobWVudENhY2hlRGF0YSkge1xuXHRcdGNhY2hlRGF0YS5jbGlwcGVkID0gdHJ1ZTtcblxuXHRcdGNsaXBwZXIuY2xpcFRyaWFuZ2xlc1VucGFja2VkKFxuXHRcdFx0Y2FjaGVEYXRhLnZlcnRpY2VzLFxuXHRcdFx0Y2FjaGVEYXRhLmluZGljZXMsXG5cdFx0XHRjYWNoZURhdGEuaW5kaWNlcy5sZW5ndGgsXG5cdFx0XHRjYWNoZURhdGEudXZzLFxuXHRcdCk7XG5cblx0XHRjb25zdCB7IGNsaXBwZWRWZXJ0aWNlcywgY2xpcHBlZFVWcywgY2xpcHBlZFRyaWFuZ2xlcyB9ID0gY2xpcHBlcjtcblxuXHRcdGNvbnN0IHZlcnRpY2VzQ291bnQgPSBjbGlwcGVkVmVydGljZXMubGVuZ3RoIC8gMjtcblx0XHRjb25zdCBpbmRpY2VzQ291bnQgPSBjbGlwcGVkVHJpYW5nbGVzLmxlbmd0aDtcblxuXHRcdGlmICghY2FjaGVEYXRhLmNsaXBwZWREYXRhKSB7XG5cdFx0XHRjYWNoZURhdGEuY2xpcHBlZERhdGEgPSB7XG5cdFx0XHRcdHZlcnRpY2VzOiBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKSxcblx0XHRcdFx0dXZzOiBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKSxcblx0XHRcdFx0dmVydGV4Q291bnQ6IHZlcnRpY2VzQ291bnQsXG5cdFx0XHRcdGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzQ291bnQpLFxuXHRcdFx0XHRpbmRpY2VzQ291bnQsXG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLnNwaW5lQXR0YWNobWVudHNEaXJ0eSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2xpcHBlZERhdGEgPSBjYWNoZURhdGEuY2xpcHBlZERhdGE7XG5cblx0XHRjb25zdCBzaXplQ2hhbmdlID0gY2xpcHBlZERhdGEudmVydGV4Q291bnQgIT09IHZlcnRpY2VzQ291bnQgfHwgaW5kaWNlc0NvdW50ICE9PSBjbGlwcGVkRGF0YS5pbmRpY2VzQ291bnQ7XG5cblx0XHRjYWNoZURhdGEuc2tpcFJlbmRlciA9IHZlcnRpY2VzQ291bnQgPT09IDA7XG5cblx0XHRpZiAoc2l6ZUNoYW5nZSkge1xuXHRcdFx0dGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXG5cdFx0XHRpZiAoY2xpcHBlZERhdGEudmVydGV4Q291bnQgPCB2ZXJ0aWNlc0NvdW50KSB7XG5cdFx0XHRcdC8vIGJ1ZmZlciByZXVzZSFcblx0XHRcdFx0Y2xpcHBlZERhdGEudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzQ291bnQgKiAyKTtcblx0XHRcdFx0Y2xpcHBlZERhdGEudXZzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlc0NvdW50ICogMik7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjbGlwcGVkRGF0YS5pbmRpY2VzLmxlbmd0aCA8IGluZGljZXNDb3VudCkge1xuXHRcdFx0XHRjbGlwcGVkRGF0YS5pbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KGluZGljZXNDb3VudCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB2ZXJ0aWNlcywgdXZzLCBpbmRpY2VzIH0gPSBjbGlwcGVkRGF0YTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmVydGljZXNDb3VudDsgaSsrKSB7XG5cdFx0XHR2ZXJ0aWNlc1tpICogMl0gPSBjbGlwcGVkVmVydGljZXNbaSAqIDJdO1xuXHRcdFx0dmVydGljZXNbKGkgKiAyKSArIDFdID0gY2xpcHBlZFZlcnRpY2VzWyhpICogMikgKyAxXTtcblxuXHRcdFx0dXZzW2kgKiAyXSA9IGNsaXBwZWRVVnNbKGkgKiAyKV07XG5cdFx0XHR1dnNbKGkgKiAyKSArIDFdID0gY2xpcHBlZFVWc1soaSAqIDIpICsgMV07XG5cdFx0fVxuXG5cdFx0Y2xpcHBlZERhdGEudmVydGV4Q291bnQgPSB2ZXJ0aWNlc0NvdW50O1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbmRpY2VzQ291bnQ7IGkrKykge1xuXHRcdFx0aWYgKGluZGljZXNbaV0gIT09IGNsaXBwZWRUcmlhbmdsZXNbaV0pIHtcblx0XHRcdFx0dGhpcy5zcGluZUF0dGFjaG1lbnRzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRpbmRpY2VzW2ldID0gY2xpcHBlZFRyaWFuZ2xlc1tpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjbGlwcGVkRGF0YS5pbmRpY2VzQ291bnQgPSBpbmRpY2VzQ291bnQ7XG5cdH1cblxuXHQvKipcblx0ICogZW5zdXJlIHRoYXQgYXR0YWNoZWQgY29udGFpbmVycyBtYXAgY29ycmVjdGx5IHRvIHRoZWlyIHNsb3RzXG5cdCAqIGFsb25nIHdpdGggdGhlaXIgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgYW5kIHZpc2liaWxpdHkuXG5cdCAqL1xuXHRwcml2YXRlIHVwZGF0ZVNsb3RPYmplY3RzICgpIHtcblx0XHRmb3IgKGNvbnN0IGkgaW4gdGhpcy5fc2xvdHNPYmplY3QpIHtcblx0XHRcdGNvbnN0IHNsb3RBdHRhY2htZW50ID0gdGhpcy5fc2xvdHNPYmplY3RbaV07XG5cblx0XHRcdGlmICghc2xvdEF0dGFjaG1lbnQpIGNvbnRpbnVlO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZVNsb3RPYmplY3Qoc2xvdEF0dGFjaG1lbnQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlU2xvdE9iamVjdCAoc2xvdEF0dGFjaG1lbnQ6IHsgc2xvdDogU2xvdCwgY29udGFpbmVyOiBDb250YWluZXIsIGZvbGxvd0F0dGFjaG1lbnRUaW1lbGluZTogYm9vbGVhbiB9KSB7XG5cdFx0Y29uc3QgeyBzbG90LCBjb250YWluZXIgfSA9IHNsb3RBdHRhY2htZW50O1xuXG5cdFx0Y29uc3QgZm9sbG93QXR0YWNobWVudFZhbHVlID0gc2xvdEF0dGFjaG1lbnQuZm9sbG93QXR0YWNobWVudFRpbWVsaW5lID8gQm9vbGVhbihzbG90LmF0dGFjaG1lbnQpIDogdHJ1ZTtcblx0XHRjb250YWluZXIudmlzaWJsZSA9IHRoaXMuc2tlbGV0b24uZHJhd09yZGVyLmluY2x1ZGVzKHNsb3QpICYmIGZvbGxvd0F0dGFjaG1lbnRWYWx1ZTtcblxuXHRcdGlmIChjb250YWluZXIudmlzaWJsZSkge1xuXHRcdFx0bGV0IGJvbmU6IEJvbmUgfCBudWxsID0gc2xvdC5ib25lO1xuXG5cdFx0XHRjb250YWluZXIucG9zaXRpb24uc2V0KGJvbmUud29ybGRYLCBib25lLndvcmxkWSk7XG5cdFx0XHRjb250YWluZXIuYW5nbGUgPSBib25lLmdldFdvcmxkUm90YXRpb25YKCk7XG5cblx0XHRcdGxldCBjdW11bGF0aXZlU2NhbGVYID0gMTtcblx0XHRcdGxldCBjdW11bGF0aXZlU2NhbGVZID0gMTtcblx0XHRcdHdoaWxlIChib25lKSB7XG5cdFx0XHRcdGN1bXVsYXRpdmVTY2FsZVggKj0gYm9uZS5zY2FsZVg7XG5cdFx0XHRcdGN1bXVsYXRpdmVTY2FsZVkgKj0gYm9uZS5zY2FsZVk7XG5cdFx0XHRcdGJvbmUgPSBib25lLnBhcmVudDtcblx0XHRcdH07XG5cblx0XHRcdGlmIChjdW11bGF0aXZlU2NhbGVYIDwgMCkgY29udGFpbmVyLmFuZ2xlIC09IDE4MDtcblxuXHRcdFx0Y29udGFpbmVyLnNjYWxlLnNldChcblx0XHRcdFx0c2xvdC5ib25lLmdldFdvcmxkU2NhbGVYKCkgKiBNYXRoLnNpZ24oY3VtdWxhdGl2ZVNjYWxlWCksXG5cdFx0XHRcdHNsb3QuYm9uZS5nZXRXb3JsZFNjYWxlWSgpICogTWF0aC5zaWduKGN1bXVsYXRpdmVTY2FsZVkpLFxuXHRcdFx0KTtcblxuXHRcdFx0Y29udGFpbmVyLmFscGhhID0gdGhpcy5za2VsZXRvbi5jb2xvci5hICogc2xvdC5jb2xvci5hO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBAaW50ZXJuYWwgKi9cblx0X2dldENhY2hlZERhdGEgKHNsb3Q6IFNsb3QsIGF0dGFjaG1lbnQ6IFJlZ2lvbkF0dGFjaG1lbnQgfCBNZXNoQXR0YWNobWVudCk6IEF0dGFjaG1lbnRDYWNoZURhdGEge1xuXHRcdHJldHVybiB0aGlzLmF0dGFjaG1lbnRDYWNoZURhdGFbc2xvdC5kYXRhLmluZGV4XVthdHRhY2htZW50Lm5hbWVdIHx8IHRoaXMuaW5pdENhY2hlZERhdGEoc2xvdCwgYXR0YWNobWVudCk7XG5cdH1cblxuXHRwcml2YXRlIGluaXRDYWNoZWREYXRhIChzbG90OiBTbG90LCBhdHRhY2htZW50OiBSZWdpb25BdHRhY2htZW50IHwgTWVzaEF0dGFjaG1lbnQpOiBBdHRhY2htZW50Q2FjaGVEYXRhIHtcblx0XHRsZXQgdmVydGljZXM6IEZsb2F0MzJBcnJheTtcblxuXHRcdGlmIChhdHRhY2htZW50IGluc3RhbmNlb2YgUmVnaW9uQXR0YWNobWVudCkge1xuXHRcdFx0dmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDgpO1xuXG5cdFx0XHR0aGlzLmF0dGFjaG1lbnRDYWNoZURhdGFbc2xvdC5kYXRhLmluZGV4XVthdHRhY2htZW50Lm5hbWVdID0ge1xuXHRcdFx0XHRpZDogYCR7c2xvdC5kYXRhLmluZGV4fS0ke2F0dGFjaG1lbnQubmFtZX1gLFxuXHRcdFx0XHR2ZXJ0aWNlcyxcblx0XHRcdFx0Y2xpcHBlZDogZmFsc2UsXG5cdFx0XHRcdGluZGljZXM6IFswLCAxLCAyLCAwLCAyLCAzXSxcblx0XHRcdFx0dXZzOiBuZXcgRmxvYXQzMkFycmF5KGF0dGFjaG1lbnQudXZzLmxlbmd0aCksXG5cdFx0XHRcdGNvbG9yOiBuZXcgQ29sb3IoMSwgMSwgMSwgMSksXG5cdFx0XHRcdGRhcmtDb2xvcjogbmV3IENvbG9yKDAsIDAsIDAsIDApLFxuXHRcdFx0XHRkYXJrVGludDogdGhpcy5kYXJrVGludCxcblx0XHRcdFx0c2tpcFJlbmRlcjogZmFsc2UsXG5cdFx0XHRcdHRleHR1cmU6IGF0dGFjaG1lbnQucmVnaW9uPy50ZXh0dXJlLnRleHR1cmUsXG5cdFx0XHR9O1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShhdHRhY2htZW50LndvcmxkVmVydGljZXNMZW5ndGgpO1xuXG5cdFx0XHR0aGlzLmF0dGFjaG1lbnRDYWNoZURhdGFbc2xvdC5kYXRhLmluZGV4XVthdHRhY2htZW50Lm5hbWVdID0ge1xuXHRcdFx0XHRpZDogYCR7c2xvdC5kYXRhLmluZGV4fS0ke2F0dGFjaG1lbnQubmFtZX1gLFxuXHRcdFx0XHR2ZXJ0aWNlcyxcblx0XHRcdFx0Y2xpcHBlZDogZmFsc2UsXG5cdFx0XHRcdGluZGljZXM6IGF0dGFjaG1lbnQudHJpYW5nbGVzLFxuXHRcdFx0XHR1dnM6IG5ldyBGbG9hdDMyQXJyYXkoYXR0YWNobWVudC51dnMubGVuZ3RoKSxcblx0XHRcdFx0Y29sb3I6IG5ldyBDb2xvcigxLCAxLCAxLCAxKSxcblx0XHRcdFx0ZGFya0NvbG9yOiBuZXcgQ29sb3IoMCwgMCwgMCwgMCksXG5cdFx0XHRcdGRhcmtUaW50OiB0aGlzLmRhcmtUaW50LFxuXHRcdFx0XHRza2lwUmVuZGVyOiBmYWxzZSxcblx0XHRcdFx0dGV4dHVyZTogYXR0YWNobWVudC5yZWdpb24/LnRleHR1cmUudGV4dHVyZSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuYXR0YWNobWVudENhY2hlRGF0YVtzbG90LmRhdGEuaW5kZXhdW2F0dGFjaG1lbnQubmFtZV07XG5cdH1cblxuXHRwcm90ZWN0ZWQgb25WaWV3VXBkYXRlICgpIHtcblx0XHQvLyBpbmNyZW1lbnQgZnJvbSB0aGUgMTJ0aCBiaXQhXG5cdFx0dGhpcy5fZGlkVmlld0NoYW5nZVRpY2srKztcblx0XHRpZiAoIXRoaXMuX2JvdW5kc1Byb3ZpZGVyKSB7XG5cdFx0XHR0aGlzLl9ib3VuZHNEaXJ0eSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuZGlkVmlld1VwZGF0ZSkgcmV0dXJuO1xuXHRcdHRoaXMuZGlkVmlld1VwZGF0ZSA9IHRydWU7XG5cblx0XHRjb25zdCByZW5kZXJHcm91cCA9IHRoaXMucmVuZGVyR3JvdXAgfHwgdGhpcy5wYXJlbnRSZW5kZXJHcm91cDtcblxuXHRcdGlmIChyZW5kZXJHcm91cCkge1xuXHRcdFx0cmVuZGVyR3JvdXAub25DaGlsZFZpZXdVcGRhdGUodGhpcyk7XG5cdFx0fVxuXG5cdFx0dGhpcy5kZWJ1Zz8ucmVuZGVyRGVidWcodGhpcyk7XG5cdH1cblxuXHQvKipcblx0ICogQXR0YWNoZXMgYSBQaXhpSlMgY29udGFpbmVyIHRvIGEgc3BlY2lmaWVkIHNsb3QuIFRoaXMgd2lsbCBtYXAgdGhlIHdvcmxkIHRyYW5zZm9ybSBvZiB0aGUgc2xvdHMgYm9uZVxuXHQgKiB0byB0aGUgYXR0YWNoZWQgY29udGFpbmVyLiBBIGNvbnRhaW5lciBjYW4gb25seSBiZSBhdHRhY2hlZCB0byBvbmUgc2xvdCBhdCBhIHRpbWUuXG5cdCAqXG5cdCAqIEBwYXJhbSBjb250YWluZXIgLSBUaGUgY29udGFpbmVyIHRvIGF0dGFjaCB0byB0aGUgc2xvdFxuXHQgKiBAcGFyYW0gc2xvdFJlZiAtIFRoZSBzbG90IGlkIG9yICBzbG90IHRvIGF0dGFjaCB0b1xuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIHNldHRpbmdzIGZvciB0aGUgYXR0YWNobWVudC5cblx0ICogQHBhcmFtIG9wdGlvbnMuZm9sbG93QXR0YWNobWVudFRpbWVsaW5lIC0gSWYgdHJ1ZSwgdGhlIGF0dGFjaG1lbnQgd2lsbCBmb2xsb3cgdGhlIHNsb3QncyBhdHRhY2htZW50IHRpbWVsaW5lLlxuXHQgKi9cblx0cHVibGljIGFkZFNsb3RPYmplY3QgKHNsb3Q6IG51bWJlciB8IHN0cmluZyB8IFNsb3QsIGNvbnRhaW5lcjogQ29udGFpbmVyLCBvcHRpb25zPzogeyBmb2xsb3dBdHRhY2htZW50VGltZWxpbmU/OiBib29sZWFuIH0pIHtcblx0XHRzbG90ID0gdGhpcy5nZXRTbG90RnJvbVJlZihzbG90KTtcblxuXHRcdC8vIG5lZWQgdG8gY2hlY2sgaW4gb24gdGhlIGNvbnRhaW5lciB0b28uLi5cblx0XHRmb3IgKGNvbnN0IGkgaW4gdGhpcy5fc2xvdHNPYmplY3QpIHtcblx0XHRcdGlmICh0aGlzLl9zbG90c09iamVjdFtpXT8uY29udGFpbmVyID09PSBjb250YWluZXIpIHtcblx0XHRcdFx0dGhpcy5yZW1vdmVTbG90T2JqZWN0KHRoaXMuX3Nsb3RzT2JqZWN0W2ldLnNsb3QpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMucmVtb3ZlU2xvdE9iamVjdChzbG90KTtcblxuXHRcdGNvbnRhaW5lci5pbmNsdWRlSW5CdWlsZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5hZGRDaGlsZChjb250YWluZXIpO1xuXG5cdFx0Y29uc3Qgc2xvdE9iamVjdCA9IHtcblx0XHRcdGNvbnRhaW5lcixcblx0XHRcdHNsb3QsXG5cdFx0XHRmb2xsb3dBdHRhY2htZW50VGltZWxpbmU6IG9wdGlvbnM/LmZvbGxvd0F0dGFjaG1lbnRUaW1lbGluZSB8fCBmYWxzZSxcblx0XHR9O1xuXHRcdHRoaXMuX3Nsb3RzT2JqZWN0W3Nsb3QuZGF0YS5uYW1lXSA9IHNsb3RPYmplY3Q7XG5cblx0XHR0aGlzLnVwZGF0ZVNsb3RPYmplY3Qoc2xvdE9iamVjdCk7XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIFBpeGlKUyBjb250YWluZXIgZnJvbSB0aGUgc2xvdCBpdCBpcyBhdHRhY2hlZCB0by5cblx0ICpcblx0ICogQHBhcmFtIGNvbnRhaW5lciAtIFRoZSBjb250YWluZXIgdG8gZGV0YWNoIGZyb20gdGhlIHNsb3Rcblx0ICogQHBhcmFtIHNsb3RPckNvbnRhaW5lciAtIFRoZSBjb250YWluZXIsIHNsb3QgaWQgb3Igc2xvdCB0byBkZXRhY2ggZnJvbVxuXHQgKi9cblx0cHVibGljIHJlbW92ZVNsb3RPYmplY3QgKHNsb3RPckNvbnRhaW5lcjogbnVtYmVyIHwgc3RyaW5nIHwgU2xvdCB8IENvbnRhaW5lcikge1xuXHRcdGxldCBjb250YWluZXJUb1JlbW92ZTogQ29udGFpbmVyIHwgdW5kZWZpbmVkO1xuXG5cdFx0aWYgKHNsb3RPckNvbnRhaW5lciBpbnN0YW5jZW9mIENvbnRhaW5lcikge1xuXHRcdFx0Zm9yIChjb25zdCBpIGluIHRoaXMuX3Nsb3RzT2JqZWN0KSB7XG5cdFx0XHRcdGlmICh0aGlzLl9zbG90c09iamVjdFtpXT8uY29udGFpbmVyID09PSBzbG90T3JDb250YWluZXIpIHtcblx0XHRcdFx0XHR0aGlzLl9zbG90c09iamVjdFtpXSA9IG51bGw7XG5cblx0XHRcdFx0XHRjb250YWluZXJUb1JlbW92ZSA9IHNsb3RPckNvbnRhaW5lcjtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNvbnN0IHNsb3QgPSB0aGlzLmdldFNsb3RGcm9tUmVmKHNsb3RPckNvbnRhaW5lcik7XG5cblx0XHRcdGNvbnRhaW5lclRvUmVtb3ZlID0gdGhpcy5fc2xvdHNPYmplY3Rbc2xvdC5kYXRhLm5hbWVdPy5jb250YWluZXI7XG5cdFx0XHR0aGlzLl9zbG90c09iamVjdFtzbG90LmRhdGEubmFtZV0gPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmIChjb250YWluZXJUb1JlbW92ZSkge1xuXHRcdFx0dGhpcy5yZW1vdmVDaGlsZChjb250YWluZXJUb1JlbW92ZSk7XG5cblx0XHRcdGNvbnRhaW5lclRvUmVtb3ZlLmluY2x1ZGVJbkJ1aWxkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgUGl4aUpTIGNvbnRhaW5lcnMgYXR0YWNoZWQgdG8gYW55IHNsb3QuXG5cdCAqL1xuXHRwdWJsaWMgcmVtb3ZlU2xvdE9iamVjdHMgKCkge1xuXHRcdE9iamVjdC5lbnRyaWVzKHRoaXMuX3Nsb3RzT2JqZWN0KS5mb3JFYWNoKChbc2xvdE5hbWUsIHNsb3RPYmplY3RdKSA9PiB7XG5cdFx0XHRpZiAoc2xvdE9iamVjdCkgc2xvdE9iamVjdC5jb250YWluZXIucmVtb3ZlRnJvbVBhcmVudCgpO1xuXHRcdFx0ZGVsZXRlIHRoaXMuX3Nsb3RzT2JqZWN0W3Nsb3ROYW1lXTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgY29udGFpbmVyIGF0dGFjaGVkIHRvIGEgc2xvdCwgb3IgdW5kZWZpbmVkIGlmIG5vIGNvbnRhaW5lciBpcyBhdHRhY2hlZC5cblx0ICpcblx0ICogQHBhcmFtIHNsb3RSZWYgLSBUaGUgc2xvdCBpZCBvciBzbG90IHRvIGdldCB0aGUgYXR0YWNobWVudCBmcm9tXG5cdCAqIEByZXR1cm5zIC0gVGhlIGNvbnRhaW5lciBhdHRhY2hlZCB0byB0aGUgc2xvdFxuXHQgKi9cblx0cHVibGljIGdldFNsb3RPYmplY3QgKHNsb3Q6IG51bWJlciB8IHN0cmluZyB8IFNsb3QpIHtcblx0XHRzbG90ID0gdGhpcy5nZXRTbG90RnJvbVJlZihzbG90KTtcblxuXHRcdHJldHVybiB0aGlzLl9zbG90c09iamVjdFtzbG90LmRhdGEubmFtZV0/LmNvbnRhaW5lcjtcblx0fVxuXG5cdHByb3RlY3RlZCB1cGRhdGVCb3VuZHMgKCkge1xuXHRcdHRoaXMuX2JvdW5kc0RpcnR5ID0gZmFsc2U7XG5cblx0XHR0aGlzLnNrZWxldG9uQm91bmRzIHx8PSBuZXcgU2tlbGV0b25Cb3VuZHMoKTtcblxuXHRcdGNvbnN0IHNrZWxldG9uQm91bmRzID0gdGhpcy5za2VsZXRvbkJvdW5kcztcblxuXHRcdHNrZWxldG9uQm91bmRzLnVwZGF0ZSh0aGlzLnNrZWxldG9uLCB0cnVlKTtcblxuXHRcdGlmICh0aGlzLl9ib3VuZHNQcm92aWRlcikge1xuXHRcdFx0Y29uc3QgYm91bmRzU3BpbmUgPSB0aGlzLl9ib3VuZHNQcm92aWRlci5jYWxjdWxhdGVCb3VuZHModGhpcyk7XG5cblx0XHRcdGNvbnN0IGJvdW5kcyA9IHRoaXMuX2JvdW5kcztcblx0XHRcdGJvdW5kcy5jbGVhcigpO1xuXG5cdFx0XHRib3VuZHMueCA9IGJvdW5kc1NwaW5lLng7XG5cdFx0XHRib3VuZHMueSA9IGJvdW5kc1NwaW5lLnk7XG5cdFx0XHRib3VuZHMud2lkdGggPSBib3VuZHNTcGluZS53aWR0aDtcblx0XHRcdGJvdW5kcy5oZWlnaHQgPSBib3VuZHNTcGluZS5oZWlnaHQ7XG5cblx0XHR9IGVsc2UgaWYgKHNrZWxldG9uQm91bmRzLm1pblggPT09IEluZmluaXR5KSB7XG5cdFx0XHRpZiAodGhpcy5oYXNOZXZlclVwZGF0ZWQpIHtcblx0XHRcdFx0dGhpcy5fdXBkYXRlQW5kQXBwbHlTdGF0ZSgwKTtcblx0XHRcdFx0dGhpcy5fYm91bmRzRGlydHkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX3ZhbGlkYXRlQW5kVHJhbnNmb3JtQXR0YWNobWVudHMoKTtcblxuXHRcdFx0Y29uc3QgZHJhd09yZGVyID0gdGhpcy5za2VsZXRvbi5kcmF3T3JkZXI7XG5cdFx0XHRjb25zdCBib3VuZHMgPSB0aGlzLl9ib3VuZHM7XG5cblx0XHRcdGJvdW5kcy5jbGVhcigpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGRyYXdPcmRlci5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBzbG90ID0gZHJhd09yZGVyW2ldO1xuXG5cdFx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBzbG90LmdldEF0dGFjaG1lbnQoKTtcblxuXHRcdFx0XHRpZiAoYXR0YWNobWVudCAmJiAoYXR0YWNobWVudCBpbnN0YW5jZW9mIFJlZ2lvbkF0dGFjaG1lbnQgfHwgYXR0YWNobWVudCBpbnN0YW5jZW9mIE1lc2hBdHRhY2htZW50KSkge1xuXHRcdFx0XHRcdGNvbnN0IGNhY2hlRGF0YSA9IHRoaXMuX2dldENhY2hlZERhdGEoc2xvdCwgYXR0YWNobWVudCk7XG5cblx0XHRcdFx0XHRib3VuZHMuYWRkVmVydGV4RGF0YShjYWNoZURhdGEudmVydGljZXMsIDAsIGNhY2hlRGF0YS52ZXJ0aWNlcy5sZW5ndGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5fYm91bmRzLm1pblggPSBza2VsZXRvbkJvdW5kcy5taW5YO1xuXHRcdFx0dGhpcy5fYm91bmRzLm1pblkgPSBza2VsZXRvbkJvdW5kcy5taW5ZO1xuXHRcdFx0dGhpcy5fYm91bmRzLm1heFggPSBza2VsZXRvbkJvdW5kcy5tYXhYO1xuXHRcdFx0dGhpcy5fYm91bmRzLm1heFkgPSBza2VsZXRvbkJvdW5kcy5tYXhZO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBAaW50ZXJuYWwgKi9cblx0YWRkQm91bmRzIChib3VuZHM6IEJvdW5kcykge1xuXHRcdGJvdW5kcy5hZGRCb3VuZHModGhpcy5ib3VuZHMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIERlc3Ryb3lzIHRoaXMgc3ByaXRlIHJlbmRlcmFibGUgYW5kIG9wdGlvbmFsbHkgaXRzIHRleHR1cmUuXG5cdCAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyBwYXJhbWV0ZXIuIEEgYm9vbGVhbiB3aWxsIGFjdCBhcyBpZiBhbGwgb3B0aW9uc1xuXHQgKiAgaGF2ZSBiZWVuIHNldCB0byB0aGF0IHZhbHVlXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudGV4dHVyZT1mYWxzZV0gLSBTaG91bGQgaXQgZGVzdHJveSB0aGUgY3VycmVudCB0ZXh0dXJlIG9mIHRoZSByZW5kZXJhYmxlIGFzIHdlbGxcblx0ICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50ZXh0dXJlU291cmNlPWZhbHNlXSAtIFNob3VsZCBpdCBkZXN0cm95IHRoZSB0ZXh0dXJlU291cmNlIG9mIHRoZSByZW5kZXJhYmxlIGFzIHdlbGxcblx0ICovXG5cdHB1YmxpYyBvdmVycmlkZSBkZXN0cm95IChvcHRpb25zOiBEZXN0cm95T3B0aW9ucyA9IGZhbHNlKSB7XG5cdFx0c3VwZXIuZGVzdHJveShvcHRpb25zKTtcblxuXHRcdFRpY2tlci5zaGFyZWQucmVtb3ZlKHRoaXMuaW50ZXJuYWxVcGRhdGUsIHRoaXMpO1xuXHRcdHRoaXMuc3RhdGUuY2xlYXJMaXN0ZW5lcnMoKTtcblx0XHR0aGlzLmRlYnVnID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuc2tlbGV0b24gPSBudWxsIGFzIGFueTtcblx0XHR0aGlzLnN0YXRlID0gbnVsbCBhcyBhbnk7XG5cdFx0KHRoaXMuX3Nsb3RzT2JqZWN0IGFzIGFueSkgPSBudWxsO1xuXHRcdHRoaXMuX2xhc3RBdHRhY2htZW50cy5sZW5ndGggPSAwO1xuXHRcdHRoaXMuYXR0YWNobWVudENhY2hlRGF0YSA9IG51bGwgYXMgYW55O1xuXHR9XG5cblx0LyoqIENvbnZlcnRzIGEgcG9pbnQgZnJvbSB0aGUgc2tlbGV0b24gY29vcmRpbmF0ZSBzeXN0ZW0gdG8gdGhlIFBpeGkgd29ybGQgY29vcmRpbmF0ZSBzeXN0ZW0uICovXG5cdHB1YmxpYyBza2VsZXRvblRvUGl4aVdvcmxkQ29vcmRpbmF0ZXMgKHBvaW50OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pIHtcblx0XHR0aGlzLndvcmxkVHJhbnNmb3JtLmFwcGx5KHBvaW50LCBwb2ludCk7XG5cdH1cblxuXHQvKiogQ29udmVydHMgYSBwb2ludCBmcm9tIHRoZSBQaXhpIHdvcmxkIGNvb3JkaW5hdGUgc3lzdGVtIHRvIHRoZSBza2VsZXRvbiBjb29yZGluYXRlIHN5c3RlbS4gKi9cblx0cHVibGljIHBpeGlXb3JsZENvb3JkaW5hdGVzVG9Ta2VsZXRvbiAocG9pbnQ6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSkge1xuXHRcdHRoaXMud29ybGRUcmFuc2Zvcm0uYXBwbHlJbnZlcnNlKHBvaW50LCBwb2ludCk7XG5cdH1cblxuXHQvKiogQ29udmVydHMgYSBwb2ludCBmcm9tIHRoZSBQaXhpIHdvcmxkIGNvb3JkaW5hdGUgc3lzdGVtIHRvIHRoZSBib25lJ3MgbG9jYWwgY29vcmRpbmF0ZSBzeXN0ZW0uICovXG5cdHB1YmxpYyBwaXhpV29ybGRDb29yZGluYXRlc1RvQm9uZSAocG9pbnQ6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSwgYm9uZTogQm9uZSkge1xuXHRcdHRoaXMucGl4aVdvcmxkQ29vcmRpbmF0ZXNUb1NrZWxldG9uKHBvaW50KTtcblx0XHRpZiAoYm9uZS5wYXJlbnQpIHtcblx0XHRcdGJvbmUucGFyZW50LndvcmxkVG9Mb2NhbChwb2ludCBhcyBWZWN0b3IyKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRib25lLndvcmxkVG9Mb2NhbChwb2ludCBhcyBWZWN0b3IyKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVXNlIHRoaXMgbWV0aG9kIHRvIGluc3RhbnRpYXRlIGEgU3BpbmUgZ2FtZSBvYmplY3QuXG5cdCAqIEJlZm9yZSBpbnN0YW50aWF0aW5nIGEgU3BpbmUgZ2FtZSBvYmplY3QsIHRoZSBza2VsZXRvbiAoYC5za2VsYCBvciBgLmpzb25gKSBhbmQgdGhlIGF0bGFzIHRleHQgZmlsZXMgbXVzdCBiZSBsb2FkZWQgaW50byB0aGUgQXNzZXRzLiBGb3IgZXhhbXBsZTpcblx0ICogYGBgXG5cdCAqIFBJWEkuQXNzZXRzLmFkZChcInNhY2tEYXRhXCIsIFwiL2Fzc2V0cy9zYWNrLXByby5za2VsXCIpO1xuXHQgKiBQSVhJLkFzc2V0cy5hZGQoXCJzYWNrQXRsYXNcIiwgXCIvYXNzZXRzL3NhY2stcG1hLmF0bGFzXCIpO1xuXHQgKiBhd2FpdCBQSVhJLkFzc2V0cy5sb2FkKFtcInNhY2tEYXRhXCIsIFwic2Fja0F0bGFzXCJdKTtcblx0ICogYGBgXG5cdCAqIE9uY2UgYSBTcGluZSBnYW1lIG9iamVjdCBpcyBjcmVhdGVkLCBpdHMgc2tlbGV0b24gZGF0YSBpcyBjYWNoZWQgaW50byB7QGxpbmsgQ2FjaGV9IHVzaW5nIHRoZSBrZXk6XG5cdCAqIGAke3NrZWxldG9uQXNzZXROYW1lfS0ke2F0bGFzQXNzZXROYW1lfS0ke29wdGlvbnM/LnNjYWxlID8/IDF9YFxuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgdG8gY29uZmlndXJlIHRoZSBTcGluZSBnYW1lIG9iamVjdC4gU2VlIHtAbGluayBTcGluZUZyb21PcHRpb25zfVxuXHQgKiBAcmV0dXJucyB7U3BpbmV9IFRoZSBTcGluZSBnYW1lIG9iamVjdCBpbnN0YW50aWF0ZWRcblx0ICovXG5cdHN0YXRpYyBmcm9tICh7IHNrZWxldG9uLCBhdGxhcywgc2NhbGUgPSAxLCBkYXJrVGludCwgYXV0b1VwZGF0ZSA9IHRydWUsIGJvdW5kc1Byb3ZpZGVyIH06IFNwaW5lRnJvbU9wdGlvbnMpIHtcblx0XHRjb25zdCBjYWNoZUtleSA9IGAke3NrZWxldG9ufS0ke2F0bGFzfS0ke3NjYWxlfWA7XG5cblx0XHRpZiAoQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuXHRcdFx0cmV0dXJuIG5ldyBTcGluZSh7XG5cdFx0XHRcdHNrZWxldG9uRGF0YTogQ2FjaGUuZ2V0PFNrZWxldG9uRGF0YT4oY2FjaGVLZXkpLFxuXHRcdFx0XHRkYXJrVGludCxcblx0XHRcdFx0YXV0b1VwZGF0ZSxcblx0XHRcdFx0Ym91bmRzUHJvdmlkZXIsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBza2VsZXRvbkFzc2V0ID0gQXNzZXRzLmdldDxhbnkgfCBVaW50OEFycmF5Pihza2VsZXRvbik7XG5cblx0XHRjb25zdCBhdGxhc0Fzc2V0ID0gQXNzZXRzLmdldDxUZXh0dXJlQXRsYXM+KGF0bGFzKTtcblx0XHRjb25zdCBhdHRhY2htZW50TG9hZGVyID0gbmV3IEF0bGFzQXR0YWNobWVudExvYWRlcihhdGxhc0Fzc2V0KTtcblx0XHRjb25zdCBwYXJzZXIgPSBza2VsZXRvbkFzc2V0IGluc3RhbmNlb2YgVWludDhBcnJheVxuXHRcdFx0PyBuZXcgU2tlbGV0b25CaW5hcnkoYXR0YWNobWVudExvYWRlcilcblx0XHRcdDogbmV3IFNrZWxldG9uSnNvbihhdHRhY2htZW50TG9hZGVyKTtcblxuXHRcdHBhcnNlci5zY2FsZSA9IHNjYWxlO1xuXHRcdGNvbnN0IHNrZWxldG9uRGF0YSA9IHBhcnNlci5yZWFkU2tlbGV0b25EYXRhKHNrZWxldG9uQXNzZXQpO1xuXG5cdFx0Q2FjaGUuc2V0KGNhY2hlS2V5LCBza2VsZXRvbkRhdGEpO1xuXG5cdFx0cmV0dXJuIG5ldyBTcGluZSh7XG5cdFx0XHRza2VsZXRvbkRhdGEsXG5cdFx0XHRkYXJrVGludCxcblx0XHRcdGF1dG9VcGRhdGUsXG5cdFx0XHRib3VuZHNQcm92aWRlcixcblx0XHR9KTtcblx0fVxufVxuIl19