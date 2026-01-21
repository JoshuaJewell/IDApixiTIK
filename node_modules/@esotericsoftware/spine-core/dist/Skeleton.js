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
import { ClippingAttachment } from "./attachments/ClippingAttachment.js";
import { MeshAttachment } from "./attachments/MeshAttachment.js";
import { PathAttachment } from "./attachments/PathAttachment.js";
import { RegionAttachment } from "./attachments/RegionAttachment.js";
import { Bone } from "./Bone.js";
import { IkConstraint } from "./IkConstraint.js";
import { PathConstraint } from "./PathConstraint.js";
import { PhysicsConstraint } from "./PhysicsConstraint.js";
import { Slot } from "./Slot.js";
import { TransformConstraint } from "./TransformConstraint.js";
import { Color, Utils, MathUtils, Vector2 } from "./Utils.js";
/** Stores the current pose for a skeleton.
 *
 * See [Instance objects](http://esotericsoftware.com/spine-runtime-architecture#Instance-objects) in the Spine Runtimes Guide. */
export class Skeleton {
    static quadTriangles = [0, 1, 2, 2, 3, 0];
    static yDown = false;
    /** The skeleton's setup pose data. */
    data;
    /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
    bones;
    /** The skeleton's slots in the setup pose draw order. */
    slots;
    /** The skeleton's slots in the order they should be drawn. The returned array may be modified to change the draw order. */
    drawOrder;
    /** The skeleton's IK constraints. */
    ikConstraints;
    /** The skeleton's transform constraints. */
    transformConstraints;
    /** The skeleton's path constraints. */
    pathConstraints;
    /** The skeleton's physics constraints. */
    physicsConstraints;
    /** The list of bones and constraints, sorted in the order they should be updated, as computed by {@link #updateCache()}. */
    _updateCache = new Array();
    /** The skeleton's current skin. May be null. */
    skin = null;
    /** The color to tint all the skeleton's attachments. */
    color;
    /** Scales the entire skeleton on the X axis. This affects all bones, even if the bone's transform mode disallows scale
      * inheritance. */
    scaleX = 1;
    /** Scales the entire skeleton on the Y axis. This affects all bones, even if the bone's transform mode disallows scale
      * inheritance. */
    _scaleY = 1;
    get scaleY() {
        return Skeleton.yDown ? -this._scaleY : this._scaleY;
    }
    set scaleY(scaleY) {
        this._scaleY = scaleY;
    }
    /** Sets the skeleton X position, which is added to the root bone worldX position. */
    x = 0;
    /** Sets the skeleton Y position, which is added to the root bone worldY position. */
    y = 0;
    /** Returns the skeleton's time. This is used for time-based manipulations, such as {@link PhysicsConstraint}.
     * <p>
     * See {@link #update(float)}. */
    time = 0;
    constructor(data) {
        if (!data)
            throw new Error("data cannot be null.");
        this.data = data;
        this.bones = new Array();
        for (let i = 0; i < data.bones.length; i++) {
            let boneData = data.bones[i];
            let bone;
            if (!boneData.parent)
                bone = new Bone(boneData, this, null);
            else {
                let parent = this.bones[boneData.parent.index];
                bone = new Bone(boneData, this, parent);
                parent.children.push(bone);
            }
            this.bones.push(bone);
        }
        this.slots = new Array();
        this.drawOrder = new Array();
        for (let i = 0; i < data.slots.length; i++) {
            let slotData = data.slots[i];
            let bone = this.bones[slotData.boneData.index];
            let slot = new Slot(slotData, bone);
            this.slots.push(slot);
            this.drawOrder.push(slot);
        }
        this.ikConstraints = new Array();
        for (let i = 0; i < data.ikConstraints.length; i++) {
            let ikConstraintData = data.ikConstraints[i];
            this.ikConstraints.push(new IkConstraint(ikConstraintData, this));
        }
        this.transformConstraints = new Array();
        for (let i = 0; i < data.transformConstraints.length; i++) {
            let transformConstraintData = data.transformConstraints[i];
            this.transformConstraints.push(new TransformConstraint(transformConstraintData, this));
        }
        this.pathConstraints = new Array();
        for (let i = 0; i < data.pathConstraints.length; i++) {
            let pathConstraintData = data.pathConstraints[i];
            this.pathConstraints.push(new PathConstraint(pathConstraintData, this));
        }
        this.physicsConstraints = new Array();
        for (let i = 0; i < data.physicsConstraints.length; i++) {
            let physicsConstraintData = data.physicsConstraints[i];
            this.physicsConstraints.push(new PhysicsConstraint(physicsConstraintData, this));
        }
        this.color = new Color(1, 1, 1, 1);
        this.updateCache();
    }
    /** Caches information about bones and constraints. Must be called if the {@link #getSkin()} is modified or if bones,
     * constraints, or weighted path attachments are added or removed. */
    updateCache() {
        let updateCache = this._updateCache;
        updateCache.length = 0;
        let bones = this.bones;
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            bone.sorted = bone.data.skinRequired;
            bone.active = !bone.sorted;
        }
        if (this.skin) {
            let skinBones = this.skin.bones;
            for (let i = 0, n = this.skin.bones.length; i < n; i++) {
                let bone = this.bones[skinBones[i].index];
                do {
                    bone.sorted = false;
                    bone.active = true;
                    bone = bone.parent;
                } while (bone);
            }
        }
        // IK first, lowest hierarchy depth first.
        let ikConstraints = this.ikConstraints;
        let transformConstraints = this.transformConstraints;
        let pathConstraints = this.pathConstraints;
        let physicsConstraints = this.physicsConstraints;
        let ikCount = ikConstraints.length, transformCount = transformConstraints.length, pathCount = pathConstraints.length, physicsCount = this.physicsConstraints.length;
        let constraintCount = ikCount + transformCount + pathCount + physicsCount;
        outer: for (let i = 0; i < constraintCount; i++) {
            for (let ii = 0; ii < ikCount; ii++) {
                let constraint = ikConstraints[ii];
                if (constraint.data.order == i) {
                    this.sortIkConstraint(constraint);
                    continue outer;
                }
            }
            for (let ii = 0; ii < transformCount; ii++) {
                let constraint = transformConstraints[ii];
                if (constraint.data.order == i) {
                    this.sortTransformConstraint(constraint);
                    continue outer;
                }
            }
            for (let ii = 0; ii < pathCount; ii++) {
                let constraint = pathConstraints[ii];
                if (constraint.data.order == i) {
                    this.sortPathConstraint(constraint);
                    continue outer;
                }
            }
            for (let ii = 0; ii < physicsCount; ii++) {
                const constraint = physicsConstraints[ii];
                if (constraint.data.order == i) {
                    this.sortPhysicsConstraint(constraint);
                    continue outer;
                }
            }
        }
        for (let i = 0, n = bones.length; i < n; i++)
            this.sortBone(bones[i]);
    }
    sortIkConstraint(constraint) {
        constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || (this.skin && Utils.contains(this.skin.constraints, constraint.data, true)));
        if (!constraint.active)
            return;
        let target = constraint.target;
        this.sortBone(target);
        let constrained = constraint.bones;
        let parent = constrained[0];
        this.sortBone(parent);
        if (constrained.length == 1) {
            this._updateCache.push(constraint);
            this.sortReset(parent.children);
        }
        else {
            let child = constrained[constrained.length - 1];
            this.sortBone(child);
            this._updateCache.push(constraint);
            this.sortReset(parent.children);
            child.sorted = true;
        }
    }
    sortPathConstraint(constraint) {
        constraint.active = constraint.target.bone.isActive() && (!constraint.data.skinRequired || (this.skin && Utils.contains(this.skin.constraints, constraint.data, true)));
        if (!constraint.active)
            return;
        let slot = constraint.target;
        let slotIndex = slot.data.index;
        let slotBone = slot.bone;
        if (this.skin)
            this.sortPathConstraintAttachment(this.skin, slotIndex, slotBone);
        if (this.data.defaultSkin && this.data.defaultSkin != this.skin)
            this.sortPathConstraintAttachment(this.data.defaultSkin, slotIndex, slotBone);
        for (let i = 0, n = this.data.skins.length; i < n; i++)
            this.sortPathConstraintAttachment(this.data.skins[i], slotIndex, slotBone);
        let attachment = slot.getAttachment();
        if (attachment instanceof PathAttachment)
            this.sortPathConstraintAttachmentWith(attachment, slotBone);
        let constrained = constraint.bones;
        let boneCount = constrained.length;
        for (let i = 0; i < boneCount; i++)
            this.sortBone(constrained[i]);
        this._updateCache.push(constraint);
        for (let i = 0; i < boneCount; i++)
            this.sortReset(constrained[i].children);
        for (let i = 0; i < boneCount; i++)
            constrained[i].sorted = true;
    }
    sortTransformConstraint(constraint) {
        constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || (this.skin && Utils.contains(this.skin.constraints, constraint.data, true)));
        if (!constraint.active)
            return;
        this.sortBone(constraint.target);
        let constrained = constraint.bones;
        let boneCount = constrained.length;
        if (constraint.data.local) {
            for (let i = 0; i < boneCount; i++) {
                let child = constrained[i];
                this.sortBone(child.parent);
                this.sortBone(child);
            }
        }
        else {
            for (let i = 0; i < boneCount; i++) {
                this.sortBone(constrained[i]);
            }
        }
        this._updateCache.push(constraint);
        for (let i = 0; i < boneCount; i++)
            this.sortReset(constrained[i].children);
        for (let i = 0; i < boneCount; i++)
            constrained[i].sorted = true;
    }
    sortPathConstraintAttachment(skin, slotIndex, slotBone) {
        let attachments = skin.attachments[slotIndex];
        if (!attachments)
            return;
        for (let key in attachments) {
            this.sortPathConstraintAttachmentWith(attachments[key], slotBone);
        }
    }
    sortPathConstraintAttachmentWith(attachment, slotBone) {
        if (!(attachment instanceof PathAttachment))
            return;
        let pathBones = attachment.bones;
        if (!pathBones)
            this.sortBone(slotBone);
        else {
            let bones = this.bones;
            for (let i = 0, n = pathBones.length; i < n;) {
                let nn = pathBones[i++];
                nn += i;
                while (i < nn)
                    this.sortBone(bones[pathBones[i++]]);
            }
        }
    }
    sortPhysicsConstraint(constraint) {
        const bone = constraint.bone;
        constraint.active = bone.active && (!constraint.data.skinRequired || (this.skin != null && Utils.contains(this.skin.constraints, constraint.data, true)));
        if (!constraint.active)
            return;
        this.sortBone(bone);
        this._updateCache.push(constraint);
        this.sortReset(bone.children);
        bone.sorted = true;
    }
    sortBone(bone) {
        if (!bone)
            return;
        if (bone.sorted)
            return;
        let parent = bone.parent;
        if (parent)
            this.sortBone(parent);
        bone.sorted = true;
        this._updateCache.push(bone);
    }
    sortReset(bones) {
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            if (!bone.active)
                continue;
            if (bone.sorted)
                this.sortReset(bone.children);
            bone.sorted = false;
        }
    }
    /** Updates the world transform for each bone and applies all constraints.
     *
     * See [World transforms](http://esotericsoftware.com/spine-runtime-skeletons#World-transforms) in the Spine
     * Runtimes Guide. */
    updateWorldTransform(physics) {
        if (physics === undefined || physics === null)
            throw new Error("physics is undefined");
        let bones = this.bones;
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            bone.ax = bone.x;
            bone.ay = bone.y;
            bone.arotation = bone.rotation;
            bone.ascaleX = bone.scaleX;
            bone.ascaleY = bone.scaleY;
            bone.ashearX = bone.shearX;
            bone.ashearY = bone.shearY;
        }
        let updateCache = this._updateCache;
        for (let i = 0, n = updateCache.length; i < n; i++)
            updateCache[i].update(physics);
    }
    updateWorldTransformWith(physics, parent) {
        if (!parent)
            throw new Error("parent cannot be null.");
        let bones = this.bones;
        for (let i = 1, n = bones.length; i < n; i++) { // Skip root bone.
            let bone = bones[i];
            bone.ax = bone.x;
            bone.ay = bone.y;
            bone.arotation = bone.rotation;
            bone.ascaleX = bone.scaleX;
            bone.ascaleY = bone.scaleY;
            bone.ashearX = bone.shearX;
            bone.ashearY = bone.shearY;
        }
        // Apply the parent bone transform to the root bone. The root bone always inherits scale, rotation and reflection.
        let rootBone = this.getRootBone();
        if (!rootBone)
            throw new Error("Root bone must not be null.");
        let pa = parent.a, pb = parent.b, pc = parent.c, pd = parent.d;
        rootBone.worldX = pa * this.x + pb * this.y + parent.worldX;
        rootBone.worldY = pc * this.x + pd * this.y + parent.worldY;
        const rx = (rootBone.rotation + rootBone.shearX) * MathUtils.degRad;
        const ry = (rootBone.rotation + 90 + rootBone.shearY) * MathUtils.degRad;
        const la = Math.cos(rx) * rootBone.scaleX;
        const lb = Math.cos(ry) * rootBone.scaleY;
        const lc = Math.sin(rx) * rootBone.scaleX;
        const ld = Math.sin(ry) * rootBone.scaleY;
        rootBone.a = (pa * la + pb * lc) * this.scaleX;
        rootBone.b = (pa * lb + pb * ld) * this.scaleX;
        rootBone.c = (pc * la + pd * lc) * this.scaleY;
        rootBone.d = (pc * lb + pd * ld) * this.scaleY;
        // Update everything except root bone.
        let updateCache = this._updateCache;
        for (let i = 0, n = updateCache.length; i < n; i++) {
            let updatable = updateCache[i];
            if (updatable != rootBone)
                updatable.update(physics);
        }
    }
    /** Sets the bones, constraints, and slots to their setup pose values. */
    setToSetupPose() {
        this.setBonesToSetupPose();
        this.setSlotsToSetupPose();
    }
    /** Sets the bones and constraints to their setup pose values. */
    setBonesToSetupPose() {
        for (const bone of this.bones)
            bone.setToSetupPose();
        for (const constraint of this.ikConstraints)
            constraint.setToSetupPose();
        for (const constraint of this.transformConstraints)
            constraint.setToSetupPose();
        for (const constraint of this.pathConstraints)
            constraint.setToSetupPose();
        for (const constraint of this.physicsConstraints)
            constraint.setToSetupPose();
    }
    /** Sets the slots and draw order to their setup pose values. */
    setSlotsToSetupPose() {
        let slots = this.slots;
        Utils.arrayCopy(slots, 0, this.drawOrder, 0, slots.length);
        for (let i = 0, n = slots.length; i < n; i++)
            slots[i].setToSetupPose();
    }
    /** @returns May return null. */
    getRootBone() {
        if (this.bones.length == 0)
            return null;
        return this.bones[0];
    }
    /** @returns May be null. */
    findBone(boneName) {
        if (!boneName)
            throw new Error("boneName cannot be null.");
        let bones = this.bones;
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            if (bone.data.name == boneName)
                return bone;
        }
        return null;
    }
    /** Finds a slot by comparing each slot's name. It is more efficient to cache the results of this method than to call it
     * repeatedly.
     * @returns May be null. */
    findSlot(slotName) {
        if (!slotName)
            throw new Error("slotName cannot be null.");
        let slots = this.slots;
        for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (slot.data.name == slotName)
                return slot;
        }
        return null;
    }
    /** Sets a skin by name.
     *
     * See {@link #setSkin()}. */
    setSkinByName(skinName) {
        let skin = this.data.findSkin(skinName);
        if (!skin)
            throw new Error("Skin not found: " + skinName);
        this.setSkin(skin);
    }
    /** Sets the skin used to look up attachments before looking in the {@link SkeletonData#defaultSkin default skin}. If the
     * skin is changed, {@link #updateCache()} is called.
     *
     * Attachments from the new skin are attached if the corresponding attachment from the old skin was attached. If there was no
     * old skin, each slot's setup mode attachment is attached from the new skin.
     *
     * After changing the skin, the visible attachments can be reset to those attached in the setup pose by calling
     * {@link #setSlotsToSetupPose()}. Also, often {@link AnimationState#apply()} is called before the next time the
     * skeleton is rendered to allow any attachment keys in the current animation(s) to hide or show attachments from the new skin.
     * @param newSkin May be null. */
    setSkin(newSkin) {
        if (newSkin == this.skin)
            return;
        if (newSkin) {
            if (this.skin)
                newSkin.attachAll(this, this.skin);
            else {
                let slots = this.slots;
                for (let i = 0, n = slots.length; i < n; i++) {
                    let slot = slots[i];
                    let name = slot.data.attachmentName;
                    if (name) {
                        let attachment = newSkin.getAttachment(i, name);
                        if (attachment)
                            slot.setAttachment(attachment);
                    }
                }
            }
        }
        this.skin = newSkin;
        this.updateCache();
    }
    /** Finds an attachment by looking in the {@link #skin} and {@link SkeletonData#defaultSkin} using the slot name and attachment
     * name.
     *
     * See {@link #getAttachment()}.
     * @returns May be null. */
    getAttachmentByName(slotName, attachmentName) {
        let slot = this.data.findSlot(slotName);
        if (!slot)
            throw new Error(`Can't find slot with name ${slotName}`);
        return this.getAttachment(slot.index, attachmentName);
    }
    /** Finds an attachment by looking in the {@link #skin} and {@link SkeletonData#defaultSkin} using the slot index and
     * attachment name. First the skin is checked and if the attachment was not found, the default skin is checked.
     *
     * See [Runtime skins](http://esotericsoftware.com/spine-runtime-skins) in the Spine Runtimes Guide.
     * @returns May be null. */
    getAttachment(slotIndex, attachmentName) {
        if (!attachmentName)
            throw new Error("attachmentName cannot be null.");
        if (this.skin) {
            let attachment = this.skin.getAttachment(slotIndex, attachmentName);
            if (attachment)
                return attachment;
        }
        if (this.data.defaultSkin)
            return this.data.defaultSkin.getAttachment(slotIndex, attachmentName);
        return null;
    }
    /** A convenience method to set an attachment by finding the slot with {@link #findSlot()}, finding the attachment with
     * {@link #getAttachment()}, then setting the slot's {@link Slot#attachment}.
     * @param attachmentName May be null to clear the slot's attachment. */
    setAttachment(slotName, attachmentName) {
        if (!slotName)
            throw new Error("slotName cannot be null.");
        let slots = this.slots;
        for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (slot.data.name == slotName) {
                let attachment = null;
                if (attachmentName) {
                    attachment = this.getAttachment(i, attachmentName);
                    if (!attachment)
                        throw new Error("Attachment not found: " + attachmentName + ", for slot: " + slotName);
                }
                slot.setAttachment(attachment);
                return;
            }
        }
        throw new Error("Slot not found: " + slotName);
    }
    /** Finds an IK constraint by comparing each IK constraint's name. It is more efficient to cache the results of this method
     * than to call it repeatedly.
     * @return May be null. */
    findIkConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        return this.ikConstraints.find((constraint) => constraint.data.name == constraintName) ?? null;
    }
    /** Finds a transform constraint by comparing each transform constraint's name. It is more efficient to cache the results of
     * this method than to call it repeatedly.
     * @return May be null. */
    findTransformConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        return this.transformConstraints.find((constraint) => constraint.data.name == constraintName) ?? null;
    }
    /** Finds a path constraint by comparing each path constraint's name. It is more efficient to cache the results of this method
     * than to call it repeatedly.
     * @return May be null. */
    findPathConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        return this.pathConstraints.find((constraint) => constraint.data.name == constraintName) ?? null;
    }
    /** Finds a physics constraint by comparing each physics constraint's name. It is more efficient to cache the results of this
     * method than to call it repeatedly. */
    findPhysicsConstraint(constraintName) {
        if (constraintName == null)
            throw new Error("constraintName cannot be null.");
        return this.physicsConstraints.find((constraint) => constraint.data.name == constraintName) ?? null;
    }
    /** Returns the axis aligned bounding box (AABB) of the region and mesh attachments for the current pose as `{ x: number, y: number, width: number, height: number }`.
     * Note that this method will create temporary objects which can add to garbage collection pressure. Use `getBounds()` if garbage collection is a concern. */
    getBoundsRect(clipper) {
        let offset = new Vector2();
        let size = new Vector2();
        this.getBounds(offset, size, undefined, clipper);
        return { x: offset.x, y: offset.y, width: size.x, height: size.y };
    }
    /** Returns the axis aligned bounding box (AABB) of the region and mesh attachments for the current pose.
     * @param offset An output value, the distance from the skeleton origin to the bottom left corner of the AABB.
     * @param size An output value, the width and height of the AABB.
     * @param temp Working memory to temporarily store attachments' computed world vertices.
     * @param clipper {@link SkeletonClipping} to use. If <code>null</code>, no clipping is applied. */
    getBounds(offset, size, temp = new Array(2), clipper = null) {
        if (!offset)
            throw new Error("offset cannot be null.");
        if (!size)
            throw new Error("size cannot be null.");
        let drawOrder = this.drawOrder;
        let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
            let slot = drawOrder[i];
            if (!slot.bone.active)
                continue;
            let verticesLength = 0;
            let vertices = null;
            let triangles = null;
            let attachment = slot.getAttachment();
            if (attachment instanceof RegionAttachment) {
                verticesLength = 8;
                vertices = Utils.setArraySize(temp, verticesLength, 0);
                attachment.computeWorldVertices(slot, vertices, 0, 2);
                triangles = Skeleton.quadTriangles;
            }
            else if (attachment instanceof MeshAttachment) {
                let mesh = attachment;
                verticesLength = mesh.worldVerticesLength;
                vertices = Utils.setArraySize(temp, verticesLength, 0);
                mesh.computeWorldVertices(slot, 0, verticesLength, vertices, 0, 2);
                triangles = mesh.triangles;
            }
            else if (attachment instanceof ClippingAttachment && clipper != null) {
                clipper.clipStart(slot, attachment);
                continue;
            }
            if (vertices && triangles) {
                if (clipper != null && clipper.isClipping()) {
                    clipper.clipTriangles(vertices, triangles, triangles.length);
                    vertices = clipper.clippedVertices;
                    verticesLength = clipper.clippedVertices.length;
                }
                for (let ii = 0, nn = vertices.length; ii < nn; ii += 2) {
                    let x = vertices[ii], y = vertices[ii + 1];
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
            if (clipper != null)
                clipper.clipEndWithSlot(slot);
        }
        if (clipper != null)
            clipper.clipEnd();
        offset.set(minX, minY);
        size.set(maxX - minX, maxY - minY);
    }
    /** Increments the skeleton's {@link #time}. */
    update(delta) {
        this.time += delta;
    }
    physicsTranslate(x, y) {
        const physicsConstraints = this.physicsConstraints;
        for (let i = 0, n = physicsConstraints.length; i < n; i++)
            physicsConstraints[i].translate(x, y);
    }
    /** Calls {@link PhysicsConstraint#rotate(float, float, float)} for each physics constraint. */
    physicsRotate(x, y, degrees) {
        const physicsConstraints = this.physicsConstraints;
        for (let i = 0, n = physicsConstraints.length; i < n; i++)
            physicsConstraints[i].rotate(x, y, degrees);
    }
}
/** Determines how physics and other non-deterministic updates are applied. */
export var Physics;
(function (Physics) {
    /** Physics are not updated or applied. */
    Physics[Physics["none"] = 0] = "none";
    /** Physics are reset to the current pose. */
    Physics[Physics["reset"] = 1] = "reset";
    /** Physics are updated and the pose from physics is applied. */
    Physics[Physics["update"] = 2] = "update";
    /** Physics are not updated but the pose from physics is applied. */
    Physics[Physics["pose"] = 3] = "pose";
})(Physics || (Physics = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU2tlbGV0b24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRy9FLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFDckUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBSTNELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFL0QsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBbUIsTUFBTSxZQUFZLENBQUM7QUFFL0U7O2tJQUVrSTtBQUNsSSxNQUFNLE9BQU8sUUFBUTtJQUNaLE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBRXJCLHNDQUFzQztJQUN0QyxJQUFJLENBQWU7SUFFbkIseUZBQXlGO0lBQ3pGLEtBQUssQ0FBYztJQUVuQix5REFBeUQ7SUFDekQsS0FBSyxD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LEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUN6RSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDMUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQzFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUMxQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDMUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0MsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0MsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0MsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFL0Msc0NBQXNDO1FBQ3RDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3BELElBQUksU0FBUyxHQUFHLFdBQVcs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QUFDLGtCQUFrQixDQUFDO1FBQ25ELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDeEQsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsK0ZBQStGO0lBQy9GLGFBQWEsQ0FBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLE9BQWU7UUFDbkQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDbkQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUN4RCxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5QyxDQUFDOztBQUdGLDhFQUE4RTtBQUM5RSxNQUFNLENBQU4sSUFBWSxPQVlYO0FBWkQsV0FBWSxPQUFPO0lBQ2xCLDBDQUEwQztJQUMxQyxxQ0FBSSxDQUFBO0lBRUosNkNBQTZDO0lBQzdDLHVDQUFLLENBQUE7SUFFTCxnRUFBZ0U7SUFDaEUseUNBQU0sQ0FBQTtJQUVOLG9FQUFvRTtJQUNwRSxxQ0FBSSxDQUFBO0FBQ0wsQ0FBQyxFQVpXLE9BQU8sS0FBUCxPQUFPLFFBWWxCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogU3BpbmUgUnVudGltZXMgTGljZW5zZSBBZ3JlZW1lbnRcbiAqIExhc3QgdXBkYXRlZCBBcHJpbCA1LCAyMDI1LiBSZXBsYWNlcyBhbGwgcHJpb3IgdmVyc2lvbnMuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMjUsIEVzb3RlcmljIFNvZnR3YXJlIExMQ1xuICpcbiAqIEludGVncmF0aW9uIG9mIHRoZSBTcGluZSBSdW50aW1lcyBpbnRvIHNvZnR3YXJlIG9yIG90aGVyd2lzZSBjcmVhdGluZ1xuICogZGVyaXZhdGl2ZSB3b3JrcyBvZiB0aGUgU3BpbmUgUnVudGltZXMgaXMgcGVybWl0dGVkIHVuZGVyIHRoZSB0ZXJtcyBhbmRcbiAqIGNvbmRpdGlvbnMgb2YgU2VjdGlvbiAyIG9mIHRoZSBTcGluZSBFZGl0b3IgTGljZW5zZSBBZ3JlZW1lbnQ6XG4gKiBodHRwOi8vZXNvdGVyaWNzb2Z0d2FyZS5jb20vc3BpbmUtZWRpdG9yLWxpY2Vuc2VcbiAqXG4gKiBPdGhlcndpc2UsIGl0IGlzIHBlcm1pdHRlZCB0byBpbnRlZ3JhdGUgdGhlIFNwaW5lIFJ1bnRpbWVzIGludG8gc29mdHdhcmVcbiAqIG9yIG90aGVyd2lzZSBjcmVhdGUgZGVyaXZhdGl2ZSB3b3JrcyBvZiB0aGUgU3BpbmUgUnVudGltZXMgKGNvbGxlY3RpdmVseSxcbiAqIFwiUHJvZHVjdHNcIiksIHByb3ZpZGVkIHRoYXQgZWFjaCB1c2VyIG9mIHRoZSBQcm9kdWN0cyBtdXN0IG9idGFpbiB0aGVpciBvd25cbiAqIFNwaW5lIEVkaXRvciBsaWNlbnNlIGFuZCByZWRpc3RyaWJ1dGlvbiBvZiB0aGUgUHJvZHVjdHMgaW4gYW55IGZvcm0gbXVzdFxuICogaW5jbHVkZSB0aGlzIGxpY2Vuc2UgYW5kIGNvcHlyaWdodCBub3RpY2UuXG4gKlxuICogVEhFIFNQSU5FIFJVTlRJTUVTIEFSRSBQUk9WSURFRCBCWSBFU09URVJJQyBTT0ZUV0FSRSBMTEMgXCJBUyBJU1wiIEFORCBBTllcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEVTT1RFUklDIFNPRlRXQVJFIExMQyBCRSBMSUFCTEUgRk9SIEFOWVxuICogRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAqIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUyxcbiAqIEJVU0lORVNTIElOVEVSUlVQVElPTiwgT1IgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFMpIEhPV0VWRVIgQ0FVU0VEIEFORFxuICogT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICogVEhFIFNQSU5FIFJVTlRJTUVTLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5pbXBvcnQgeyBBdHRhY2htZW50IH0gZnJvbSBcIi4vYXR0YWNobWVudHMvQXR0YWNobWVudC5qc1wiO1xuaW1wb3J0IHsgQ2xpcHBpbmdBdHRhY2htZW50IH0gZnJvbSBcIi4vYXR0YWNobWVudHMvQ2xpcHBpbmdBdHRhY2htZW50LmpzXCI7XG5pbXBvcnQgeyBNZXNoQXR0YWNobWVudCB9IGZyb20gXCIuL2F0dGFjaG1lbnRzL01lc2hBdHRhY2htZW50LmpzXCI7XG5pbXBvcnQgeyBQYXRoQXR0YWNobWVudCB9IGZyb20gXCIuL2F0dGFjaG1lbnRzL1BhdGhBdHRhY2htZW50LmpzXCI7XG5pbXBvcnQgeyBSZWdpb25BdHRhY2htZW50IH0gZnJvbSBcIi4vYXR0YWNobWVudHMvUmVnaW9uQXR0YWNobWVudC5qc1wiO1xuaW1wb3J0IHsgQm9uZSB9IGZyb20gXCIuL0JvbmUuanNcIjtcbmltcG9ydCB7IElrQ29uc3RyYWludCB9IGZyb20gXCIuL0lrQ29uc3RyYWludC5qc1wiO1xuaW1wb3J0IHsgUGF0aENvbnN0cmFpbnQgfSBmcm9tIFwiLi9QYXRoQ29uc3RyYWludC5qc1wiO1xuaW1wb3J0IHsgUGh5c2ljc0NvbnN0cmFpbnQgfSBmcm9tIFwiLi9QaHlzaWNzQ29uc3RyYWludC5qc1wiO1xuaW1wb3J0IHsgU2tlbGV0b25DbGlwcGluZyB9IGZyb20gXCIuL1NrZWxldG9uQ2xpcHBpbmcuanNcIjtcbmltcG9ydCB7IFNrZWxldG9uRGF0YSB9IGZyb20gXCIuL1NrZWxldG9uRGF0YS5qc1wiO1xuaW1wb3J0IHsgU2tpbiB9IGZyb20gXCIuL1NraW4uanNcIjtcbmltcG9ydCB7IFNsb3QgfSBmcm9tIFwiLi9TbG90LmpzXCI7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db25zdHJhaW50IH0gZnJvbSBcIi4vVHJhbnNmb3JtQ29uc3RyYWludC5qc1wiO1xuaW1wb3J0IHsgVXBkYXRhYmxlIH0gZnJvbSBcIi4vVXBkYXRhYmxlLmpzXCI7XG5pbXBvcnQgeyBDb2xvciwgVXRpbHMsIE1hdGhVdGlscywgVmVjdG9yMiwgTnVtYmVyQXJyYXlMaWtlIH0gZnJvbSBcIi4vVXRpbHMuanNcIjtcblxuLyoqIFN0b3JlcyB0aGUgY3VycmVudCBwb3NlIGZvciBhIHNrZWxldG9uLlxuICpcbiAqIFNlZSBbSW5zdGFuY2Ugb2JqZWN0c10oaHR0cDovL2Vzb3Rlcmljc29mdHdhcmUuY29tL3NwaW5lLXJ1bnRpbWUtYXJjaGl0ZWN0dXJlI0luc3RhbmNlLW9iamVjdHMpIGluIHRoZSBTcGluZSBSdW50aW1lcyBHdWlkZS4gKi9cbmV4cG9ydCBjbGFzcyBTa2VsZXRvbiB7XG5cdHByaXZhdGUgc3RhdGljIHF1YWRUcmlhbmdsZXMgPSBbMCwgMSwgMiwgMiwgMywgMF07XG5cdHN0YXRpYyB5RG93biA9IGZhbHNlO1xuXG5cdC8qKiBUaGUgc2tlbGV0b24ncyBzZXR1cCBwb3NlIGRhdGEuICovXG5cdGRhdGE6IFNrZWxldG9uRGF0YTtcblxuXHQvKiogVGhlIHNrZWxldG9uJ3MgYm9uZXMsIHNvcnRlZCBwYXJlbnQgZmlyc3QuIFRoZSByb290IGJvbmUgaXMgYWx3YXlzIHRoZSBmaXJzdCBib25lLiAqL1xuXHRib25lczogQXJyYXk8Qm9uZT47XG5cblx0LyoqIFRoZSBza2VsZXRvbidzIHNsb3RzIGluIHRoZSBzZXR1cCBwb3NlIGRyYXcgb3JkZXIuICovXG5cdHNsb3RzOiBBcnJheTxTbG90PjtcblxuXHQvKiogVGhlIHNrZWxldG9uJ3Mgc2xvdHMgaW4gdGhlIG9yZGVyIHRoZXkgc2hvdWxkIGJlIGRyYXduLiBUaGUgcmV0dXJuZWQgYXJyYXkgbWF5IGJlIG1vZGlmaWVkIHRvIGNoYW5nZSB0aGUgZHJhdyBvcmRlci4gKi9cblx0ZHJhd09yZGVyOiBBcnJheTxTbG90PjtcblxuXHQvKiogVGhlIHNrZWxldG9uJ3MgSUsgY29uc3RyYWludHMuICovXG5cdGlrQ29uc3RyYWludHM6IEFycmF5PElrQ29uc3RyYWludD47XG5cblx0LyoqIFRoZSBza2VsZXRvbidzIHRyYW5zZm9ybSBjb25zdHJhaW50cy4gKi9cblx0dHJhbnNmb3JtQ29uc3RyYWludHM6IEFycmF5PFRyYW5zZm9ybUNvbnN0cmFpbnQ+O1xuXG5cdC8qKiBUaGUgc2tlbGV0b24ncyBwYXRoIGNvbnN0cmFpbnRzLiAqL1xuXHRwYXRoQ29uc3RyYWludHM6IEFycmF5PFBhdGhDb25zdHJhaW50PjtcblxuXG5cdC8qKiBUaGUgc2tlbGV0b24ncyBwaHlzaWNzIGNvbnN0cmFpbnRzLiAqL1xuXHRwaHlzaWNzQ29uc3RyYWludHM6IEFycmF5PFBoeXNpY3NDb25zdHJhaW50PjtcblxuXHQvKiogVGhlIGxpc3Qgb2YgYm9uZXMgYW5kIGNvbnN0cmFpbnRzLCBzb3J0ZWQgaW4gdGhlIG9yZGVyIHRoZXkgc2hvdWxkIGJlIHVwZGF0ZWQsIGFzIGNvbXB1dGVkIGJ5IHtAbGluayAjdXBkYXRlQ2FjaGUoKX0uICovXG5cdF91cGRhdGVDYWNoZSA9IG5ldyBBcnJheTxVcGRhdGFibGU+KCk7XG5cblx0LyoqIFRoZSBza2VsZXRvbidzIGN1cnJlbnQgc2tpbi4gTWF5IGJlIG51bGwuICovXG5cdHNraW46IFNraW4gfCBudWxsID0gbnVsbDtcblxuXHQvKiogVGhlIGNvbG9yIHRvIHRpbnQgYWxsIHRoZSBza2VsZXRvbidzIGF0dGFjaG1lbnRzLiAqL1xuXHRjb2xvcjogQ29sb3I7XG5cblx0LyoqIFNjYWxlcyB0aGUgZW50aXJlIHNrZWxldG9uIG9uIHRoZSBYIGF4aXMuIFRoaXMgYWZmZWN0cyBhbGwgYm9uZXMsIGV2ZW4gaWYgdGhlIGJvbmUncyB0cmFuc2Zvcm0gbW9kZSBkaXNhbGxvd3Mgc2NhbGVcblx0ICAqIGluaGVyaXRhbmNlLiAqL1xuXHRzY2FsZVggPSAxO1xuXG5cdC8qKiBTY2FsZXMgdGhlIGVudGlyZSBza2VsZXRvbiBvbiB0aGUgWSBheGlzLiBUaGlzIGFmZmVjdHMgYWxsIGJvbmVzLCBldmVuIGlmIHRoZSBib25lJ3MgdHJhbnNmb3JtIG1vZGUgZGlzYWxsb3dzIHNjYWxlXG5cdCAgKiBpbmhlcml0YW5jZS4gKi9cblx0cHJpdmF0ZSBfc2NhbGVZID0gMTtcblxuXHRwdWJsaWMgZ2V0IHNjYWxlWSAoKSB7XG5cdFx0cmV0dXJuIFNrZWxldG9uLnlEb3duID8gLXRoaXMuX3NjYWxlWSA6IHRoaXMuX3NjYWxlWTtcblx0fVxuXG5cdHB1YmxpYyBzZXQgc2NhbGVZIChzY2FsZVk6IG51bWJlcikge1xuXHRcdHRoaXMuX3NjYWxlWSA9IHNjYWxlWTtcblx0fVxuXG5cdC8qKiBTZXRzIHRoZSBza2VsZXRvbiBYIHBvc2l0aW9uLCB3aGljaCBpcyBhZGRlZCB0byB0aGUgcm9vdCBib25lIHdvcmxkWCBwb3NpdGlvbi4gKi9cblx0eCA9IDA7XG5cblx0LyoqIFNldHMgdGhlIHNrZWxldG9uIFkgcG9zaXRpb24sIHdoaWNoIGlzIGFkZGVkIHRvIHRoZSByb290IGJvbmUgd29ybGRZIHBvc2l0aW9uLiAqL1xuXHR5ID0gMDtcblxuXHQvKiogUmV0dXJucyB0aGUgc2tlbGV0b24ncyB0aW1lLiBUaGlzIGlzIHVzZWQgZm9yIHRpbWUtYmFzZWQgbWFuaXB1bGF0aW9ucywgc3VjaCBhcyB7QGxpbmsgUGh5c2ljc0NvbnN0cmFpbnR9LlxuXHQgKiA8cD5cblx0ICogU2VlIHtAbGluayAjdXBkYXRlKGZsb2F0KX0uICovXG5cdHRpbWUgPSAwO1xuXG5cdGNvbnN0cnVjdG9yIChkYXRhOiBTa2VsZXRvbkRhdGEpIHtcblx0XHRpZiAoIWRhdGEpIHRocm93IG5ldyBFcnJvcihcImRhdGEgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdHRoaXMuZGF0YSA9IGRhdGE7XG5cblx0XHR0aGlzLmJvbmVzID0gbmV3IEFycmF5PEJvbmU+KCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJvbmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgYm9uZURhdGEgPSBkYXRhLmJvbmVzW2ldO1xuXHRcdFx0bGV0IGJvbmU6IEJvbmU7XG5cdFx0XHRpZiAoIWJvbmVEYXRhLnBhcmVudClcblx0XHRcdFx0Ym9uZSA9IG5ldyBCb25lKGJvbmVEYXRhLCB0aGlzLCBudWxsKTtcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRsZXQgcGFyZW50ID0gdGhpcy5ib25lc1tib25lRGF0YS5wYXJlbnQuaW5kZXhdO1xuXHRcdFx0XHRib25lID0gbmV3IEJvbmUoYm9uZURhdGEsIHRoaXMsIHBhcmVudCk7XG5cdFx0XHRcdHBhcmVudC5jaGlsZHJlbi5wdXNoKGJvbmUpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5ib25lcy5wdXNoKGJvbmUpO1xuXHRcdH1cblxuXHRcdHRoaXMuc2xvdHMgPSBuZXcgQXJyYXk8U2xvdD4oKTtcblx0XHR0aGlzLmRyYXdPcmRlciA9IG5ldyBBcnJheTxTbG90PigpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5zbG90cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IHNsb3REYXRhID0gZGF0YS5zbG90c1tpXTtcblx0XHRcdGxldCBib25lID0gdGhpcy5ib25lc1tzbG90RGF0YS5ib25lRGF0YS5pbmRleF07XG5cdFx0XHRsZXQgc2xvdCA9IG5ldyBTbG90KHNsb3REYXRhLCBib25lKTtcblx0XHRcdHRoaXMuc2xvdHMucHVzaChzbG90KTtcblx0XHRcdHRoaXMuZHJhd09yZGVyLnB1c2goc2xvdCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5pa0NvbnN0cmFpbnRzID0gbmV3IEFycmF5PElrQ29uc3RyYWludD4oKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEuaWtDb25zdHJhaW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGlrQ29uc3RyYWludERhdGEgPSBkYXRhLmlrQ29uc3RyYWludHNbaV07XG5cdFx0XHR0aGlzLmlrQ29uc3RyYWludHMucHVzaChuZXcgSWtDb25zdHJhaW50KGlrQ29uc3RyYWludERhdGEsIHRoaXMpKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyYW5zZm9ybUNvbnN0cmFpbnRzID0gbmV3IEFycmF5PFRyYW5zZm9ybUNvbnN0cmFpbnQ+KCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLnRyYW5zZm9ybUNvbnN0cmFpbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgdHJhbnNmb3JtQ29uc3RyYWludERhdGEgPSBkYXRhLnRyYW5zZm9ybUNvbnN0cmFpbnRzW2ldO1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1Db25zdHJhaW50cy5wdXNoKG5ldyBUcmFuc2Zvcm1Db25zdHJhaW50KHRyYW5zZm9ybUNvbnN0cmFpbnREYXRhLCB0aGlzKSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5wYXRoQ29uc3RyYWludHMgPSBuZXcgQXJyYXk8UGF0aENvbnN0cmFpbnQ+KCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLnBhdGhDb25zdHJhaW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IHBhdGhDb25zdHJhaW50RGF0YSA9IGRhdGEucGF0aENvbnN0cmFpbnRzW2ldO1xuXHRcdFx0dGhpcy5wYXRoQ29uc3RyYWludHMucHVzaChuZXcgUGF0aENvbnN0cmFpbnQocGF0aENvbnN0cmFpbnREYXRhLCB0aGlzKSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5waHlzaWNzQ29uc3RyYWludHMgPSBuZXcgQXJyYXk8UGh5c2ljc0NvbnN0cmFpbnQ+KCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLnBoeXNpY3NDb25zdHJhaW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IHBoeXNpY3NDb25zdHJhaW50RGF0YSA9IGRhdGEucGh5c2ljc0NvbnN0cmFpbnRzW2ldO1xuXHRcdFx0dGhpcy5waHlzaWNzQ29uc3RyYWludHMucHVzaChuZXcgUGh5c2ljc0NvbnN0cmFpbnQocGh5c2ljc0NvbnN0cmFpbnREYXRhLCB0aGlzKSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb2xvciA9IG5ldyBDb2xvcigxLCAxLCAxLCAxKTtcblx0XHR0aGlzLnVwZGF0ZUNhY2hlKCk7XG5cdH1cblxuXHQvKiogQ2FjaGVzIGluZm9ybWF0aW9uIGFib3V0IGJvbmVzIGFuZCBjb25zdHJhaW50cy4gTXVzdCBiZSBjYWxsZWQgaWYgdGhlIHtAbGluayAjZ2V0U2tpbigpfSBpcyBtb2RpZmllZCBvciBpZiBib25lcyxcblx0ICogY29uc3RyYWludHMsIG9yIHdlaWdodGVkIHBhdGggYXR0YWNobWVudHMgYXJlIGFkZGVkIG9yIHJlbW92ZWQuICovXG5cdHVwZGF0ZUNhY2hlICgpIHtcblx0XHRsZXQgdXBkYXRlQ2FjaGUgPSB0aGlzLl91cGRhdGVDYWNoZTtcblx0XHR1cGRhdGVDYWNoZS5sZW5ndGggPSAwO1xuXG5cdFx0bGV0IGJvbmVzID0gdGhpcy5ib25lcztcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IGJvbmVzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IGJvbmUgPSBib25lc1tpXTtcblx0XHRcdGJvbmUuc29ydGVkID0gYm9uZS5kYXRhLnNraW5SZXF1aXJlZDtcblx0XHRcdGJvbmUuYWN0aXZlID0gIWJvbmUuc29ydGVkO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnNraW4pIHtcblx0XHRcdGxldCBza2luQm9uZXMgPSB0aGlzLnNraW4uYm9uZXM7XG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHRoaXMuc2tpbi5ib25lcy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcblx0XHRcdFx0bGV0IGJvbmU6IEJvbmUgfCBudWxsID0gdGhpcy5ib25lc1tza2luQm9uZXNbaV0uaW5kZXhdO1xuXHRcdFx0XHRkbyB7XG5cdFx0XHRcdFx0Ym9uZS5zb3J0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRib25lLmFjdGl2ZSA9IHRydWU7XG5cdFx0XHRcdFx0Ym9uZSA9IGJvbmUucGFyZW50O1xuXHRcdFx0XHR9IHdoaWxlIChib25lKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJSyBmaXJzdCwgbG93ZXN0IGhpZXJhcmNoeSBkZXB0aCBmaXJzdC5cblx0XHRsZXQgaWtDb25zdHJhaW50cyA9IHRoaXMuaWtDb25zdHJhaW50cztcblx0XHRsZXQgdHJhbnNmb3JtQ29uc3RyYWludHMgPSB0aGlzLnRyYW5zZm9ybUNvbnN0cmFpbnRzO1xuXHRcdGxldCBwYXRoQ29uc3RyYWludHMgPSB0aGlzLnBhdGhDb25zdHJhaW50cztcblx0XHRsZXQgcGh5c2ljc0NvbnN0cmFpbnRzID0gdGhpcy5waHlzaWNzQ29uc3RyYWludHM7XG5cdFx0bGV0IGlrQ291bnQgPSBpa0NvbnN0cmFpbnRzLmxlbmd0aCwgdHJhbnNmb3JtQ291bnQgPSB0cmFuc2Zvcm1Db25zdHJhaW50cy5sZW5ndGgsIHBhdGhDb3VudCA9IHBhdGhDb25zdHJhaW50cy5sZW5ndGgsIHBoeXNpY3NDb3VudCA9IHRoaXMucGh5c2ljc0NvbnN0cmFpbnRzLmxlbmd0aDtcblx0XHRsZXQgY29uc3RyYWludENvdW50ID0gaWtDb3VudCArIHRyYW5zZm9ybUNvdW50ICsgcGF0aENvdW50ICsgcGh5c2ljc0NvdW50O1xuXG5cdFx0b3V0ZXI6XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb25zdHJhaW50Q291bnQ7IGkrKykge1xuXHRcdFx0Zm9yIChsZXQgaWkgPSAwOyBpaSA8IGlrQ291bnQ7IGlpKyspIHtcblx0XHRcdFx0bGV0IGNvbnN0cmFpbnQgPSBpa0NvbnN0cmFpbnRzW2lpXTtcblx0XHRcdFx0aWYgKGNvbnN0cmFpbnQuZGF0YS5vcmRlciA9PSBpKSB7XG5cdFx0XHRcdFx0dGhpcy5zb3J0SWtDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuXHRcdFx0XHRcdGNvbnRpbnVlIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGxldCBpaSA9IDA7IGlpIDwgdHJhbnNmb3JtQ291bnQ7IGlpKyspIHtcblx0XHRcdFx0bGV0IGNvbnN0cmFpbnQgPSB0cmFuc2Zvcm1Db25zdHJhaW50c1tpaV07XG5cdFx0XHRcdGlmIChjb25zdHJhaW50LmRhdGEub3JkZXIgPT0gaSkge1xuXHRcdFx0XHRcdHRoaXMuc29ydFRyYW5zZm9ybUNvbnN0cmFpbnQoY29uc3RyYWludCk7XG5cdFx0XHRcdFx0Y29udGludWUgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGZvciAobGV0IGlpID0gMDsgaWkgPCBwYXRoQ291bnQ7IGlpKyspIHtcblx0XHRcdFx0bGV0IGNvbnN0cmFpbnQgPSBwYXRoQ29uc3RyYWludHNbaWldO1xuXHRcdFx0XHRpZiAoY29uc3RyYWludC5kYXRhLm9yZGVyID09IGkpIHtcblx0XHRcdFx0XHR0aGlzLnNvcnRQYXRoQ29uc3RyYWludChjb25zdHJhaW50KTtcblx0XHRcdFx0XHRjb250aW51ZSBvdXRlcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Zm9yIChsZXQgaWkgPSAwOyBpaSA8IHBoeXNpY3NDb3VudDsgaWkrKykge1xuXHRcdFx0XHRjb25zdCBjb25zdHJhaW50ID0gcGh5c2ljc0NvbnN0cmFpbnRzW2lpXTtcblx0XHRcdFx0aWYgKGNvbnN0cmFpbnQuZGF0YS5vcmRlciA9PSBpKSB7XG5cdFx0XHRcdFx0dGhpcy5zb3J0UGh5c2ljc0NvbnN0cmFpbnQoY29uc3RyYWludCk7XG5cdFx0XHRcdFx0Y29udGludWUgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IGJvbmVzLmxlbmd0aDsgaSA8IG47IGkrKylcblx0XHRcdHRoaXMuc29ydEJvbmUoYm9uZXNbaV0pO1xuXHR9XG5cblx0c29ydElrQ29uc3RyYWludCAoY29uc3RyYWludDogSWtDb25zdHJhaW50KSB7XG5cdFx0Y29uc3RyYWludC5hY3RpdmUgPSBjb25zdHJhaW50LnRhcmdldC5pc0FjdGl2ZSgpICYmICghY29uc3RyYWludC5kYXRhLnNraW5SZXF1aXJlZCB8fCAodGhpcy5za2luICYmIFV0aWxzLmNvbnRhaW5zKHRoaXMuc2tpbi5jb25zdHJhaW50cywgY29uc3RyYWludC5kYXRhLCB0cnVlKSkpITtcblx0XHRpZiAoIWNvbnN0cmFpbnQuYWN0aXZlKSByZXR1cm47XG5cblx0XHRsZXQgdGFyZ2V0ID0gY29uc3RyYWludC50YXJnZXQ7XG5cdFx0dGhpcy5zb3J0Qm9uZSh0YXJnZXQpO1xuXG5cdFx0bGV0IGNvbnN0cmFpbmVkID0gY29uc3RyYWludC5ib25lcztcblx0XHRsZXQgcGFyZW50ID0gY29uc3RyYWluZWRbMF07XG5cdFx0dGhpcy5zb3J0Qm9uZShwYXJlbnQpO1xuXG5cdFx0aWYgKGNvbnN0cmFpbmVkLmxlbmd0aCA9PSAxKSB7XG5cdFx0XHR0aGlzLl91cGRhdGVDYWNoZS5wdXNoKGNvbnN0cmFpbnQpO1xuXHRcdFx0dGhpcy5zb3J0UmVzZXQocGFyZW50LmNoaWxkcmVuKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IGNoaWxkID0gY29uc3RyYWluZWRbY29uc3RyYWluZWQubGVuZ3RoIC0gMV07XG5cdFx0XHR0aGlzLnNvcnRCb25lKGNoaWxkKTtcblxuXHRcdFx0dGhpcy5fdXBkYXRlQ2FjaGUucHVzaChjb25zdHJhaW50KTtcblxuXHRcdFx0dGhpcy5zb3J0UmVzZXQocGFyZW50LmNoaWxkcmVuKTtcblx0XHRcdGNoaWxkLnNvcnRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0c29ydFBhdGhDb25zdHJhaW50IChjb25zdHJhaW50OiBQYXRoQ29uc3RyYWludCkge1xuXHRcdGNvbnN0cmFpbnQuYWN0aXZlID0gY29uc3RyYWludC50YXJnZXQuYm9uZS5pc0FjdGl2ZSgpICYmICghY29uc3RyYWludC5kYXRhLnNraW5SZXF1aXJlZCB8fCAodGhpcy5za2luICYmIFV0aWxzLmNvbnRhaW5zKHRoaXMuc2tpbi5jb25zdHJhaW50cywgY29uc3RyYWludC5kYXRhLCB0cnVlKSkpITtcblx0XHRpZiAoIWNvbnN0cmFpbnQuYWN0aXZlKSByZXR1cm47XG5cblx0XHRsZXQgc2xvdCA9IGNvbnN0cmFpbnQudGFyZ2V0O1xuXHRcdGxldCBzbG90SW5kZXggPSBzbG90LmRhdGEuaW5kZXg7XG5cdFx0bGV0IHNsb3RCb25lID0gc2xvdC5ib25lO1xuXHRcdGlmICh0aGlzLnNraW4pIHRoaXMuc29ydFBhdGhDb25zdHJhaW50QXR0YWNobWVudCh0aGlzLnNraW4sIHNsb3RJbmRleCwgc2xvdEJvbmUpO1xuXHRcdGlmICh0aGlzLmRhdGEuZGVmYXVsdFNraW4gJiYgdGhpcy5kYXRhLmRlZmF1bHRTa2luICE9IHRoaXMuc2tpbilcblx0XHRcdHRoaXMuc29ydFBhdGhDb25zdHJhaW50QXR0YWNobWVudCh0aGlzLmRhdGEuZGVmYXVsdFNraW4sIHNsb3RJbmRleCwgc2xvdEJvbmUpO1xuXHRcdGZvciAobGV0IGkgPSAwLCBuID0gdGhpcy5kYXRhLnNraW5zLmxlbmd0aDsgaSA8IG47IGkrKylcblx0XHRcdHRoaXMuc29ydFBhdGhDb25zdHJhaW50QXR0YWNobWVudCh0aGlzLmRhdGEuc2tpbnNbaV0sIHNsb3RJbmRleCwgc2xvdEJvbmUpO1xuXG5cdFx0bGV0IGF0dGFjaG1lbnQgPSBzbG90LmdldEF0dGFjaG1lbnQoKTtcblx0XHRpZiAoYXR0YWNobWVudCBpbnN0YW5jZW9mIFBhdGhBdHRhY2htZW50KSB0aGlzLnNvcnRQYXRoQ29uc3RyYWludEF0dGFjaG1lbnRXaXRoKGF0dGFjaG1lbnQsIHNsb3RCb25lKTtcblxuXHRcdGxldCBjb25zdHJhaW5lZCA9IGNvbnN0cmFpbnQuYm9uZXM7XG5cdFx0bGV0IGJvbmVDb3VudCA9IGNvbnN0cmFpbmVkLmxlbmd0aDtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJvbmVDb3VudDsgaSsrKVxuXHRcdFx0dGhpcy5zb3J0Qm9uZShjb25zdHJhaW5lZFtpXSk7XG5cblx0XHR0aGlzLl91cGRhdGVDYWNoZS5wdXNoKGNvbnN0cmFpbnQpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBib25lQ291bnQ7IGkrKylcblx0XHRcdHRoaXMuc29ydFJlc2V0KGNvbnN0cmFpbmVkW2ldLmNoaWxkcmVuKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJvbmVDb3VudDsgaSsrKVxuXHRcdFx0Y29uc3RyYWluZWRbaV0uc29ydGVkID0gdHJ1ZTtcblx0fVxuXG5cdHNvcnRUcmFuc2Zvcm1Db25zdHJhaW50IChjb25zdHJhaW50OiBUcmFuc2Zvcm1Db25zdHJhaW50KSB7XG5cdFx0Y29uc3RyYWludC5hY3RpdmUgPSBjb25zdHJhaW50LnRhcmdldC5pc0FjdGl2ZSgpICYmICghY29uc3RyYWludC5kYXRhLnNraW5SZXF1aXJlZCB8fCAodGhpcy5za2luICYmIFV0aWxzLmNvbnRhaW5zKHRoaXMuc2tpbi5jb25zdHJhaW50cywgY29uc3RyYWludC5kYXRhLCB0cnVlKSkpITtcblx0XHRpZiAoIWNvbnN0cmFpbnQuYWN0aXZlKSByZXR1cm47XG5cblx0XHR0aGlzLnNvcnRCb25lKGNvbnN0cmFpbnQudGFyZ2V0KTtcblxuXHRcdGxldCBjb25zdHJhaW5lZCA9IGNvbnN0cmFpbnQuYm9uZXM7XG5cdFx0bGV0IGJvbmVDb3VudCA9IGNvbnN0cmFpbmVkLmxlbmd0aDtcblx0XHRpZiAoY29uc3RyYWludC5kYXRhLmxvY2FsKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJvbmVDb3VudDsgaSsrKSB7XG5cdFx0XHRcdGxldCBjaGlsZCA9IGNvbnN0cmFpbmVkW2ldO1xuXHRcdFx0XHR0aGlzLnNvcnRCb25lKGNoaWxkLnBhcmVudCEpO1xuXHRcdFx0XHR0aGlzLnNvcnRCb25lKGNoaWxkKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBib25lQ291bnQ7IGkrKykge1xuXHRcdFx0XHR0aGlzLnNvcnRCb25lKGNvbnN0cmFpbmVkW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl91cGRhdGVDYWNoZS5wdXNoKGNvbnN0cmFpbnQpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBib25lQ291bnQ7IGkrKylcblx0XHRcdHRoaXMuc29ydFJlc2V0KGNvbnN0cmFpbmVkW2ldLmNoaWxkcmVuKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJvbmVDb3VudDsgaSsrKVxuXHRcdFx0Y29uc3RyYWluZWRbaV0uc29ydGVkID0gdHJ1ZTtcblx0fVxuXG5cdHNvcnRQYXRoQ29uc3RyYWludEF0dGFjaG1lbnQgKHNraW46IFNraW4sIHNsb3RJbmRleDogbnVtYmVyLCBzbG90Qm9uZTogQm9uZSkge1xuXHRcdGxldCBhdHRhY2htZW50cyA9IHNraW4uYXR0YWNobWVudHNbc2xvdEluZGV4XTtcblx0XHRpZiAoIWF0dGFjaG1lbnRzKSByZXR1cm47XG5cdFx0Zm9yIChsZXQga2V5IGluIGF0dGFjaG1lbnRzKSB7XG5cdFx0XHR0aGlzLnNvcnRQYXRoQ29uc3RyYWludEF0dGFjaG1lbnRXaXRoKGF0dGFjaG1lbnRzW2tleV0sIHNsb3RCb25lKTtcblx0XHR9XG5cdH1cblxuXHRzb3J0UGF0aENvbnN0cmFpbnRBdHRhY2htZW50V2l0aCAoYXR0YWNobWVudDogQXR0YWNobWVudCwgc2xvdEJvbmU6IEJvbmUpIHtcblx0XHRpZiAoIShhdHRhY2htZW50IGluc3RhbmNlb2YgUGF0aEF0dGFjaG1lbnQpKSByZXR1cm47XG5cdFx0bGV0IHBhdGhCb25lcyA9ICg8UGF0aEF0dGFjaG1lbnQ+YXR0YWNobWVudCkuYm9uZXM7XG5cdFx0aWYgKCFwYXRoQm9uZXMpXG5cdFx0XHR0aGlzLnNvcnRCb25lKHNsb3RCb25lKTtcblx0XHRlbHNlIHtcblx0XHRcdGxldCBib25lcyA9IHRoaXMuYm9uZXM7XG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHBhdGhCb25lcy5sZW5ndGg7IGkgPCBuOykge1xuXHRcdFx0XHRsZXQgbm4gPSBwYXRoQm9uZXNbaSsrXTtcblx0XHRcdFx0bm4gKz0gaTtcblx0XHRcdFx0d2hpbGUgKGkgPCBubilcblx0XHRcdFx0XHR0aGlzLnNvcnRCb25lKGJvbmVzW3BhdGhCb25lc1tpKytdXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0c29ydFBoeXNpY3NDb25zdHJhaW50IChjb25zdHJhaW50OiBQaHlzaWNzQ29uc3RyYWludCkge1xuXHRcdGNvbnN0IGJvbmUgPSBjb25zdHJhaW50LmJvbmU7XG5cdFx0Y29uc3RyYWludC5hY3RpdmUgPSBib25lLmFjdGl2ZSAmJiAoIWNvbnN0cmFpbnQuZGF0YS5za2luUmVxdWlyZWQgfHwgKHRoaXMuc2tpbiAhPSBudWxsICYmIFV0aWxzLmNvbnRhaW5zKHRoaXMuc2tpbi5jb25zdHJhaW50cywgY29uc3RyYWludC5kYXRhLCB0cnVlKSkpO1xuXHRcdGlmICghY29uc3RyYWludC5hY3RpdmUpIHJldHVybjtcblxuXHRcdHRoaXMuc29ydEJvbmUoYm9uZSk7XG5cblx0XHR0aGlzLl91cGRhdGVDYWNoZS5wdXNoKGNvbnN0cmFpbnQpO1xuXG5cdFx0dGhpcy5zb3J0UmVzZXQoYm9uZS5jaGlsZHJlbik7XG5cdFx0Ym9uZS5zb3J0ZWQgPSB0cnVlO1xuXHR9XG5cblx0c29ydEJvbmUgKGJvbmU6IEJvbmUpIHtcblx0XHRpZiAoIWJvbmUpIHJldHVybjtcblx0XHRpZiAoYm9uZS5zb3J0ZWQpIHJldHVybjtcblx0XHRsZXQgcGFyZW50ID0gYm9uZS5wYXJlbnQ7XG5cdFx0aWYgKHBhcmVudCkgdGhpcy5zb3J0Qm9uZShwYXJlbnQpO1xuXHRcdGJvbmUuc29ydGVkID0gdHJ1ZTtcblx0XHR0aGlzLl91cGRhdGVDYWNoZS5wdXNoKGJvbmUpO1xuXHR9XG5cblx0c29ydFJlc2V0IChib25lczogQXJyYXk8Qm9uZT4pIHtcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IGJvbmVzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IGJvbmUgPSBib25lc1tpXTtcblx0XHRcdGlmICghYm9uZS5hY3RpdmUpIGNvbnRpbnVlO1xuXHRcdFx0aWYgKGJvbmUuc29ydGVkKSB0aGlzLnNvcnRSZXNldChib25lLmNoaWxkcmVuKTtcblx0XHRcdGJvbmUuc29ydGVkID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0LyoqIFVwZGF0ZXMgdGhlIHdvcmxkIHRyYW5zZm9ybSBmb3IgZWFjaCBib25lIGFuZCBhcHBsaWVzIGFsbCBjb25zdHJhaW50cy5cblx0ICpcblx0ICogU2VlIFtXb3JsZCB0cmFuc2Zvcm1zXShodHRwOi8vZXNvdGVyaWNzb2Z0d2FyZS5jb20vc3BpbmUtcnVudGltZS1za2VsZXRvbnMjV29ybGQtdHJhbnNmb3JtcykgaW4gdGhlIFNwaW5lXG5cdCAqIFJ1bnRpbWVzIEd1aWRlLiAqL1xuXHR1cGRhdGVXb3JsZFRyYW5zZm9ybSAocGh5c2ljczogUGh5c2ljcykge1xuXHRcdGlmIChwaHlzaWNzID09PSB1bmRlZmluZWQgfHwgcGh5c2ljcyA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwicGh5c2ljcyBpcyB1bmRlZmluZWRcIik7XG5cdFx0bGV0IGJvbmVzID0gdGhpcy5ib25lcztcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IGJvbmVzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IGJvbmUgPSBib25lc1tpXTtcblx0XHRcdGJvbmUuYXggPSBib25lLng7XG5cdFx0XHRib25lLmF5ID0gYm9uZS55O1xuXHRcdFx0Ym9uZS5hcm90YXRpb24gPSBib25lLnJvdGF0aW9uO1xuXHRcdFx0Ym9uZS5hc2NhbGVYID0gYm9uZS5zY2FsZVg7XG5cdFx0XHRib25lLmFzY2FsZVkgPSBib25lLnNjYWxlWTtcblx0XHRcdGJvbmUuYXNoZWFyWCA9IGJvbmUuc2hlYXJYO1xuXHRcdFx0Ym9uZS5hc2hlYXJZID0gYm9uZS5zaGVhclk7XG5cdFx0fVxuXG5cdFx0bGV0IHVwZGF0ZUNhY2hlID0gdGhpcy5fdXBkYXRlQ2FjaGU7XG5cdFx0Zm9yIChsZXQgaSA9IDAsIG4gPSB1cGRhdGVDYWNoZS5sZW5ndGg7IGkgPCBuOyBpKyspXG5cdFx0XHR1cGRhdGVDYWNoZVtpXS51cGRhdGUocGh5c2ljcyk7XG5cdH1cblxuXHR1cGRhdGVXb3JsZFRyYW5zZm9ybVdpdGggKHBoeXNpY3M6IFBoeXNpY3MsIHBhcmVudDogQm9uZSkge1xuXHRcdGlmICghcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoXCJwYXJlbnQgY2Fubm90IGJlIG51bGwuXCIpO1xuXG5cdFx0bGV0IGJvbmVzID0gdGhpcy5ib25lcztcblx0XHRmb3IgKGxldCBpID0gMSwgbiA9IGJvbmVzLmxlbmd0aDsgaSA8IG47IGkrKykgeyAvLyBTa2lwIHJvb3QgYm9uZS5cblx0XHRcdGxldCBib25lID0gYm9uZXNbaV07XG5cdFx0XHRib25lLmF4ID0gYm9uZS54O1xuXHRcdFx0Ym9uZS5heSA9IGJvbmUueTtcblx0XHRcdGJvbmUuYXJvdGF0aW9uID0gYm9uZS5yb3RhdGlvbjtcblx0XHRcdGJvbmUuYXNjYWxlWCA9IGJvbmUuc2NhbGVYO1xuXHRcdFx0Ym9uZS5hc2NhbGVZID0gYm9uZS5zY2FsZVk7XG5cdFx0XHRib25lLmFzaGVhclggPSBib25lLnNoZWFyWDtcblx0XHRcdGJvbmUuYXNoZWFyWSA9IGJvbmUuc2hlYXJZO1xuXHRcdH1cblxuXHRcdC8vIEFwcGx5IHRoZSBwYXJlbnQgYm9uZSB0cmFuc2Zvcm0gdG8gdGhlIHJvb3QgYm9uZS4gVGhlIHJvb3QgYm9uZSBhbHdheXMgaW5oZXJpdHMgc2NhbGUsIHJvdGF0aW9uIGFuZCByZWZsZWN0aW9uLlxuXHRcdGxldCByb290Qm9uZSA9IHRoaXMuZ2V0Um9vdEJvbmUoKTtcblx0XHRpZiAoIXJvb3RCb25lKSB0aHJvdyBuZXcgRXJyb3IoXCJSb290IGJvbmUgbXVzdCBub3QgYmUgbnVsbC5cIik7XG5cdFx0bGV0IHBhID0gcGFyZW50LmEsIHBiID0gcGFyZW50LmIsIHBjID0gcGFyZW50LmMsIHBkID0gcGFyZW50LmQ7XG5cdFx0cm9vdEJvbmUud29ybGRYID0gcGEgKiB0aGlzLnggKyBwYiAqIHRoaXMueSArIHBhcmVudC53b3JsZFg7XG5cdFx0cm9vdEJvbmUud29ybGRZID0gcGMgKiB0aGlzLnggKyBwZCAqIHRoaXMueSArIHBhcmVudC53b3JsZFk7XG5cblx0XHRjb25zdCByeCA9IChyb290Qm9uZS5yb3RhdGlvbiArIHJvb3RCb25lLnNoZWFyWCkgKiBNYXRoVXRpbHMuZGVnUmFkO1xuXHRcdGNvbnN0IHJ5ID0gKHJvb3RCb25lLnJvdGF0aW9uICsgOTAgKyByb290Qm9uZS5zaGVhclkpICogTWF0aFV0aWxzLmRlZ1JhZDtcblx0XHRjb25zdCBsYSA9IE1hdGguY29zKHJ4KSAqIHJvb3RCb25lLnNjYWxlWDtcblx0XHRjb25zdCBsYiA9IE1hdGguY29zKHJ5KSAqIHJvb3RCb25lLnNjYWxlWTtcblx0XHRjb25zdCBsYyA9IE1hdGguc2luKHJ4KSAqIHJvb3RCb25lLnNjYWxlWDtcblx0XHRjb25zdCBsZCA9IE1hdGguc2luKHJ5KSAqIHJvb3RCb25lLnNjYWxlWTtcblx0XHRyb290Qm9uZS5hID0gKHBhICogbGEgKyBwYiAqIGxjKSAqIHRoaXMuc2NhbGVYO1xuXHRcdHJvb3RCb25lLmIgPSAocGEgKiBsYiArIHBiICogbGQpICogdGhpcy5zY2FsZVg7XG5cdFx0cm9vdEJvbmUuYyA9IChwYyAqIGxhICsgcGQgKiBsYykgKiB0aGlzLnNjYWxlWTtcblx0XHRyb290Qm9uZS5kID0gKHBjICogbGIgKyBwZCAqIGxkKSAqIHRoaXMuc2NhbGVZO1xuXG5cdFx0Ly8gVXBkYXRlIGV2ZXJ5dGhpbmcgZXhjZXB0IHJvb3QgYm9uZS5cblx0XHRsZXQgdXBkYXRlQ2FjaGUgPSB0aGlzLl91cGRhdGVDYWNoZTtcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHVwZGF0ZUNhY2hlLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IHVwZGF0YWJsZSA9IHVwZGF0ZUNhY2hlW2ldO1xuXHRcdFx0aWYgKHVwZGF0YWJsZSAhPSByb290Qm9uZSkgdXBkYXRhYmxlLnVwZGF0ZShwaHlzaWNzKTtcblx0XHR9XG5cdH1cblxuXHQvKiogU2V0cyB0aGUgYm9uZXMsIGNvbnN0cmFpbnRzLCBhbmQgc2xvdHMgdG8gdGhlaXIgc2V0dXAgcG9zZSB2YWx1ZXMuICovXG5cdHNldFRvU2V0dXBQb3NlICgpIHtcblx0XHR0aGlzLnNldEJvbmVzVG9TZXR1cFBvc2UoKTtcblx0XHR0aGlzLnNldFNsb3RzVG9TZXR1cFBvc2UoKTtcblx0fVxuXG5cdC8qKiBTZXRzIHRoZSBib25lcyBhbmQgY29uc3RyYWludHMgdG8gdGhlaXIgc2V0dXAgcG9zZSB2YWx1ZXMuICovXG5cdHNldEJvbmVzVG9TZXR1cFBvc2UgKCkge1xuXHRcdGZvciAoY29uc3QgYm9uZSBvZiB0aGlzLmJvbmVzKSBib25lLnNldFRvU2V0dXBQb3NlKCk7XG5cdFx0Zm9yIChjb25zdCBjb25zdHJhaW50IG9mIHRoaXMuaWtDb25zdHJhaW50cykgY29uc3RyYWludC5zZXRUb1NldHVwUG9zZSgpO1xuXHRcdGZvciAoY29uc3QgY29uc3RyYWludCBvZiB0aGlzLnRyYW5zZm9ybUNvbnN0cmFpbnRzKSBjb25zdHJhaW50LnNldFRvU2V0dXBQb3NlKCk7XG5cdFx0Zm9yIChjb25zdCBjb25zdHJhaW50IG9mIHRoaXMucGF0aENvbnN0cmFpbnRzKSBjb25zdHJhaW50LnNldFRvU2V0dXBQb3NlKCk7XG5cdFx0Zm9yIChjb25zdCBjb25zdHJhaW50IG9mIHRoaXMucGh5c2ljc0NvbnN0cmFpbnRzKSBjb25zdHJhaW50LnNldFRvU2V0dXBQb3NlKCk7XG5cdH1cblxuXHQvKiogU2V0cyB0aGUgc2xvdHMgYW5kIGRyYXcgb3JkZXIgdG8gdGhlaXIgc2V0dXAgcG9zZSB2YWx1ZXMuICovXG5cdHNldFNsb3RzVG9TZXR1cFBvc2UgKCkge1xuXHRcdGxldCBzbG90cyA9IHRoaXMuc2xvdHM7XG5cdFx0VXRpbHMuYXJyYXlDb3B5KHNsb3RzLCAwLCB0aGlzLmRyYXdPcmRlciwgMCwgc2xvdHMubGVuZ3RoKTtcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHNsb3RzLmxlbmd0aDsgaSA8IG47IGkrKylcblx0XHRcdHNsb3RzW2ldLnNldFRvU2V0dXBQb3NlKCk7XG5cdH1cblxuXHQvKiogQHJldHVybnMgTWF5IHJldHVybiBudWxsLiAqL1xuXHRnZXRSb290Qm9uZSAoKSB7XG5cdFx0aWYgKHRoaXMuYm9uZXMubGVuZ3RoID09IDApIHJldHVybiBudWxsO1xuXHRcdHJldHVybiB0aGlzLmJvbmVzWzBdO1xuXHR9XG5cblx0LyoqIEByZXR1cm5zIE1heSBiZSBudWxsLiAqL1xuXHRmaW5kQm9uZSAoYm9uZU5hbWU6IHN0cmluZykge1xuXHRcdGlmICghYm9uZU5hbWUpIHRocm93IG5ldyBFcnJvcihcImJvbmVOYW1lIGNhbm5vdCBiZSBudWxsLlwiKTtcblx0XHRsZXQgYm9uZXMgPSB0aGlzLmJvbmVzO1xuXHRcdGZvciAobGV0IGkgPSAwLCBuID0gYm9uZXMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG5cdFx0XHRsZXQgYm9uZSA9IGJvbmVzW2ldO1xuXHRcdFx0aWYgKGJvbmUuZGF0YS5uYW1lID09IGJvbmVOYW1lKSByZXR1cm4gYm9uZTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHQvKiogRmluZHMgYSBzbG90IGJ5IGNvbXBhcmluZyBlYWNoIHNsb3QncyBuYW1lLiBJdCBpcyBtb3JlIGVmZmljaWVudCB0byBjYWNoZSB0aGUgcmVzdWx0cyBvZiB0aGlzIG1ldGhvZCB0aGFuIHRvIGNhbGwgaXRcblx0ICogcmVwZWF0ZWRseS5cblx0ICogQHJldHVybnMgTWF5IGJlIG51bGwuICovXG5cdGZpbmRTbG90IChzbG90TmFtZTogc3RyaW5nKSB7XG5cdFx0aWYgKCFzbG90TmFtZSkgdGhyb3cgbmV3IEVycm9yKFwic2xvdE5hbWUgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdGxldCBzbG90cyA9IHRoaXMuc2xvdHM7XG5cdFx0Zm9yIChsZXQgaSA9IDAsIG4gPSBzbG90cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcblx0XHRcdGxldCBzbG90ID0gc2xvdHNbaV07XG5cdFx0XHRpZiAoc2xvdC5kYXRhLm5hbWUgPT0gc2xvdE5hbWUpIHJldHVybiBzbG90O1xuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8qKiBTZXRzIGEgc2tpbiBieSBuYW1lLlxuXHQgKlxuXHQgKiBTZWUge0BsaW5rICNzZXRTa2luKCl9LiAqL1xuXHRzZXRTa2luQnlOYW1lIChza2luTmFtZTogc3RyaW5nKSB7XG5cdFx0bGV0IHNraW4gPSB0aGlzLmRhdGEuZmluZFNraW4oc2tpbk5hbWUpO1xuXHRcdGlmICghc2tpbikgdGhyb3cgbmV3IEVycm9yKFwiU2tpbiBub3QgZm91bmQ6IFwiICsgc2tpbk5hbWUpO1xuXHRcdHRoaXMuc2V0U2tpbihza2luKTtcblx0fVxuXG5cdC8qKiBTZXRzIHRoZSBza2luIHVzZWQgdG8gbG9vayB1cCBhdHRhY2htZW50cyBiZWZvcmUgbG9va2luZyBpbiB0aGUge0BsaW5rIFNrZWxldG9uRGF0YSNkZWZhdWx0U2tpbiBkZWZhdWx0IHNraW59LiBJZiB0aGVcblx0ICogc2tpbiBpcyBjaGFuZ2VkLCB7QGxpbmsgI3VwZGF0ZUNhY2hlKCl9IGlzIGNhbGxlZC5cblx0ICpcblx0ICogQXR0YWNobWVudHMgZnJvbSB0aGUgbmV3IHNraW4gYXJlIGF0dGFjaGVkIGlmIHRoZSBjb3JyZXNwb25kaW5nIGF0dGFjaG1lbnQgZnJvbSB0aGUgb2xkIHNraW4gd2FzIGF0dGFjaGVkLiBJZiB0aGVyZSB3YXMgbm9cblx0ICogb2xkIHNraW4sIGVhY2ggc2xvdCdzIHNldHVwIG1vZGUgYXR0YWNobWVudCBpcyBhdHRhY2hlZCBmcm9tIHRoZSBuZXcgc2tpbi5cblx0ICpcblx0ICogQWZ0ZXIgY2hhbmdpbmcgdGhlIHNraW4sIHRoZSB2aXNpYmxlIGF0dGFjaG1lbnRzIGNhbiBiZSByZXNldCB0byB0aG9zZSBhdHRhY2hlZCBpbiB0aGUgc2V0dXAgcG9zZSBieSBjYWxsaW5nXG5cdCAqIHtAbGluayAjc2V0U2xvdHNUb1NldHVwUG9zZSgpfS4gQWxzbywgb2Z0ZW4ge0BsaW5rIEFuaW1hdGlvblN0YXRlI2FwcGx5KCl9IGlzIGNhbGxlZCBiZWZvcmUgdGhlIG5leHQgdGltZSB0aGVcblx0ICogc2tlbGV0b24gaXMgcmVuZGVyZWQgdG8gYWxsb3cgYW55IGF0dGFjaG1lbnQga2V5cyBpbiB0aGUgY3VycmVudCBhbmltYXRpb24ocykgdG8gaGlkZSBvciBzaG93IGF0dGFjaG1lbnRzIGZyb20gdGhlIG5ldyBza2luLlxuXHQgKiBAcGFyYW0gbmV3U2tpbiBNYXkgYmUgbnVsbC4gKi9cblx0c2V0U2tpbiAobmV3U2tpbjogU2tpbikge1xuXHRcdGlmIChuZXdTa2luID09IHRoaXMuc2tpbikgcmV0dXJuO1xuXHRcdGlmIChuZXdTa2luKSB7XG5cdFx0XHRpZiAodGhpcy5za2luKVxuXHRcdFx0XHRuZXdTa2luLmF0dGFjaEFsbCh0aGlzLCB0aGlzLnNraW4pO1xuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGxldCBzbG90cyA9IHRoaXMuc2xvdHM7XG5cdFx0XHRcdGZvciAobGV0IGkgPSAwLCBuID0gc2xvdHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG5cdFx0XHRcdFx0bGV0IHNsb3QgPSBzbG90c1tpXTtcblx0XHRcdFx0XHRsZXQgbmFtZSA9IHNsb3QuZGF0YS5hdHRhY2htZW50TmFtZTtcblx0XHRcdFx0XHRpZiAobmFtZSkge1xuXHRcdFx0XHRcdFx0bGV0IGF0dGFjaG1lbnQgPSBuZXdTa2luLmdldEF0dGFjaG1lbnQoaSwgbmFtZSk7XG5cdFx0XHRcdFx0XHRpZiAoYXR0YWNobWVudCkgc2xvdC5zZXRBdHRhY2htZW50KGF0dGFjaG1lbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLnNraW4gPSBuZXdTa2luO1xuXHRcdHRoaXMudXBkYXRlQ2FjaGUoKTtcblx0fVxuXG5cblx0LyoqIEZpbmRzIGFuIGF0dGFjaG1lbnQgYnkgbG9va2luZyBpbiB0aGUge0BsaW5rICNza2lufSBhbmQge0BsaW5rIFNrZWxldG9uRGF0YSNkZWZhdWx0U2tpbn0gdXNpbmcgdGhlIHNsb3QgbmFtZSBhbmQgYXR0YWNobWVudFxuXHQgKiBuYW1lLlxuXHQgKlxuXHQgKiBTZWUge0BsaW5rICNnZXRBdHRhY2htZW50KCl9LlxuXHQgKiBAcmV0dXJucyBNYXkgYmUgbnVsbC4gKi9cblx0Z2V0QXR0YWNobWVudEJ5TmFtZSAoc2xvdE5hbWU6IHN0cmluZywgYXR0YWNobWVudE5hbWU6IHN0cmluZyk6IEF0dGFjaG1lbnQgfCBudWxsIHtcblx0XHRsZXQgc2xvdCA9IHRoaXMuZGF0YS5maW5kU2xvdChzbG90TmFtZSk7XG5cdFx0aWYgKCFzbG90KSB0aHJvdyBuZXcgRXJyb3IoYENhbid0IGZpbmQgc2xvdCB3aXRoIG5hbWUgJHtzbG90TmFtZX1gKTtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50KHNsb3QuaW5kZXgsIGF0dGFjaG1lbnROYW1lKTtcblx0fVxuXG5cdC8qKiBGaW5kcyBhbiBhdHRhY2htZW50IGJ5IGxvb2tpbmcgaW4gdGhlIHtAbGluayAjc2tpbn0gYW5kIHtAbGluayBTa2VsZXRvbkRhdGEjZGVmYXVsdFNraW59IHVzaW5nIHRoZSBzbG90IGluZGV4IGFuZFxuXHQgKiBhdHRhY2htZW50IG5hbWUuIEZpcnN0IHRoZSBza2luIGlzIGNoZWNrZWQgYW5kIGlmIHRoZSBhdHRhY2htZW50IHdhcyBub3QgZm91bmQsIHRoZSBkZWZhdWx0IHNraW4gaXMgY2hlY2tlZC5cblx0ICpcblx0ICogU2VlIFtSdW50aW1lIHNraW5zXShodHRwOi8vZXNvdGVyaWNzb2Z0d2FyZS5jb20vc3BpbmUtcnVudGltZS1za2lucykgaW4gdGhlIFNwaW5lIFJ1bnRpbWVzIEd1aWRlLlxuXHQgKiBAcmV0dXJucyBNYXkgYmUgbnVsbC4gKi9cblx0Z2V0QXR0YWNobWVudCAoc2xvdEluZGV4OiBudW1iZXIsIGF0dGFjaG1lbnROYW1lOiBzdHJpbmcpOiBBdHRhY2htZW50IHwgbnVsbCB7XG5cdFx0aWYgKCFhdHRhY2htZW50TmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiYXR0YWNobWVudE5hbWUgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdGlmICh0aGlzLnNraW4pIHtcblx0XHRcdGxldCBhdHRhY2htZW50ID0gdGhpcy5za2luLmdldEF0dGFjaG1lbnQoc2xvdEluZGV4LCBhdHRhY2htZW50TmFtZSk7XG5cdFx0XHRpZiAoYXR0YWNobWVudCkgcmV0dXJuIGF0dGFjaG1lbnQ7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmRhdGEuZGVmYXVsdFNraW4pIHJldHVybiB0aGlzLmRhdGEuZGVmYXVsdFNraW4uZ2V0QXR0YWNobWVudChzbG90SW5kZXgsIGF0dGFjaG1lbnROYW1lKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8qKiBBIGNvbnZlbmllbmNlIG1ldGhvZCB0byBzZXQgYW4gYXR0YWNobWVudCBieSBmaW5kaW5nIHRoZSBzbG90IHdpdGgge0BsaW5rICNmaW5kU2xvdCgpfSwgZmluZGluZyB0aGUgYXR0YWNobWVudCB3aXRoXG5cdCAqIHtAbGluayAjZ2V0QXR0YWNobWVudCgpfSwgdGhlbiBzZXR0aW5nIHRoZSBzbG90J3Mge0BsaW5rIFNsb3QjYXR0YWNobWVudH0uXG5cdCAqIEBwYXJhbSBhdHRhY2htZW50TmFtZSBNYXkgYmUgbnVsbCB0byBjbGVhciB0aGUgc2xvdCdzIGF0dGFjaG1lbnQuICovXG5cdHNldEF0dGFjaG1lbnQgKHNsb3ROYW1lOiBzdHJpbmcsIGF0dGFjaG1lbnROYW1lOiBzdHJpbmcpIHtcblx0XHRpZiAoIXNsb3ROYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJzbG90TmFtZSBjYW5ub3QgYmUgbnVsbC5cIik7XG5cdFx0bGV0IHNsb3RzID0gdGhpcy5zbG90cztcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHNsb3RzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IHNsb3QgPSBzbG90c1tpXTtcblx0XHRcdGlmIChzbG90LmRhdGEubmFtZSA9PSBzbG90TmFtZSkge1xuXHRcdFx0XHRsZXQgYXR0YWNobWVudDogQXR0YWNobWVudCB8IG51bGwgPSBudWxsO1xuXHRcdFx0XHRpZiAoYXR0YWNobWVudE5hbWUpIHtcblx0XHRcdFx0XHRhdHRhY2htZW50ID0gdGhpcy5nZXRBdHRhY2htZW50KGksIGF0dGFjaG1lbnROYW1lKTtcblx0XHRcdFx0XHRpZiAoIWF0dGFjaG1lbnQpIHRocm93IG5ldyBFcnJvcihcIkF0dGFjaG1lbnQgbm90IGZvdW5kOiBcIiArIGF0dGFjaG1lbnROYW1lICsgXCIsIGZvciBzbG90OiBcIiArIHNsb3ROYW1lKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzbG90LnNldEF0dGFjaG1lbnQoYXR0YWNobWVudCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2xvdCBub3QgZm91bmQ6IFwiICsgc2xvdE5hbWUpO1xuXHR9XG5cblxuXHQvKiogRmluZHMgYW4gSUsgY29uc3RyYWludCBieSBjb21wYXJpbmcgZWFjaCBJSyBjb25zdHJhaW50J3MgbmFtZS4gSXQgaXMgbW9yZSBlZmZpY2llbnQgdG8gY2FjaGUgdGhlIHJlc3VsdHMgb2YgdGhpcyBtZXRob2Rcblx0ICogdGhhbiB0byBjYWxsIGl0IHJlcGVhdGVkbHkuXG5cdCAqIEByZXR1cm4gTWF5IGJlIG51bGwuICovXG5cdGZpbmRJa0NvbnN0cmFpbnQgKGNvbnN0cmFpbnROYW1lOiBzdHJpbmcpIHtcblx0XHRpZiAoIWNvbnN0cmFpbnROYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJjb25zdHJhaW50TmFtZSBjYW5ub3QgYmUgbnVsbC5cIik7XG5cdFx0cmV0dXJuIHRoaXMuaWtDb25zdHJhaW50cy5maW5kKChjb25zdHJhaW50KSA9PiBjb25zdHJhaW50LmRhdGEubmFtZSA9PSBjb25zdHJhaW50TmFtZSkgPz8gbnVsbDtcblx0fVxuXG5cdC8qKiBGaW5kcyBhIHRyYW5zZm9ybSBjb25zdHJhaW50IGJ5IGNvbXBhcmluZyBlYWNoIHRyYW5zZm9ybSBjb25zdHJhaW50J3MgbmFtZS4gSXQgaXMgbW9yZSBlZmZpY2llbnQgdG8gY2FjaGUgdGhlIHJlc3VsdHMgb2Zcblx0ICogdGhpcyBtZXRob2QgdGhhbiB0byBjYWxsIGl0IHJlcGVhdGVkbHkuXG5cdCAqIEByZXR1cm4gTWF5IGJlIG51bGwuICovXG5cdGZpbmRUcmFuc2Zvcm1Db25zdHJhaW50IChjb25zdHJhaW50TmFtZTogc3RyaW5nKSB7XG5cdFx0aWYgKCFjb25zdHJhaW50TmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiY29uc3RyYWludE5hbWUgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdHJldHVybiB0aGlzLnRyYW5zZm9ybUNvbnN0cmFpbnRzLmZpbmQoKGNvbnN0cmFpbnQpID0+IGNvbnN0cmFpbnQuZGF0YS5uYW1lID09IGNvbnN0cmFpbnROYW1lKSA/PyBudWxsO1xuXHR9XG5cblx0LyoqIEZpbmRzIGEgcGF0aCBjb25zdHJhaW50IGJ5IGNvbXBhcmluZyBlYWNoIHBhdGggY29uc3RyYWludCdzIG5hbWUuIEl0IGlzIG1vcmUgZWZmaWNpZW50IHRvIGNhY2hlIHRoZSByZXN1bHRzIG9mIHRoaXMgbWV0aG9kXG5cdCAqIHRoYW4gdG8gY2FsbCBpdCByZXBlYXRlZGx5LlxuXHQgKiBAcmV0dXJuIE1heSBiZSBudWxsLiAqL1xuXHRmaW5kUGF0aENvbnN0cmFpbnQgKGNvbnN0cmFpbnROYW1lOiBzdHJpbmcpIHtcblx0XHRpZiAoIWNvbnN0cmFpbnROYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJjb25zdHJhaW50TmFtZSBjYW5ub3QgYmUgbnVsbC5cIik7XG5cdFx0cmV0dXJuIHRoaXMucGF0aENvbnN0cmFpbnRzLmZpbmQoKGNvbnN0cmFpbnQpID0+IGNvbnN0cmFpbnQuZGF0YS5uYW1lID09IGNvbnN0cmFpbnROYW1lKSA/PyBudWxsO1xuXHR9XG5cblx0LyoqIEZpbmRzIGEgcGh5c2ljcyBjb25zdHJhaW50IGJ5IGNvbXBhcmluZyBlYWNoIHBoeXNpY3MgY29uc3RyYWludCdzIG5hbWUuIEl0IGlzIG1vcmUgZWZmaWNpZW50IHRvIGNhY2hlIHRoZSByZXN1bHRzIG9mIHRoaXNcblx0ICogbWV0aG9kIHRoYW4gdG8gY2FsbCBpdCByZXBlYXRlZGx5LiAqL1xuXHRmaW5kUGh5c2ljc0NvbnN0cmFpbnQgKGNvbnN0cmFpbnROYW1lOiBzdHJpbmcpIHtcblx0XHRpZiAoY29uc3RyYWludE5hbWUgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29uc3RyYWludE5hbWUgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdHJldHVybiB0aGlzLnBoeXNpY3NDb25zdHJhaW50cy5maW5kKChjb25zdHJhaW50KSA9PiBjb25zdHJhaW50LmRhdGEubmFtZSA9PSBjb25zdHJhaW50TmFtZSkgPz8gbnVsbDtcblx0fVxuXG5cdC8qKiBSZXR1cm5zIHRoZSBheGlzIGFsaWduZWQgYm91bmRpbmcgYm94IChBQUJCKSBvZiB0aGUgcmVnaW9uIGFuZCBtZXNoIGF0dGFjaG1lbnRzIGZvciB0aGUgY3VycmVudCBwb3NlIGFzIGB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9YC5cblx0ICogTm90ZSB0aGF0IHRoaXMgbWV0aG9kIHdpbGwgY3JlYXRlIHRlbXBvcmFyeSBvYmplY3RzIHdoaWNoIGNhbiBhZGQgdG8gZ2FyYmFnZSBjb2xsZWN0aW9uIHByZXNzdXJlLiBVc2UgYGdldEJvdW5kcygpYCBpZiBnYXJiYWdlIGNvbGxlY3Rpb24gaXMgYSBjb25jZXJuLiAqL1xuXHRnZXRCb3VuZHNSZWN0IChjbGlwcGVyPzogU2tlbGV0b25DbGlwcGluZykge1xuXHRcdGxldCBvZmZzZXQgPSBuZXcgVmVjdG9yMigpO1xuXHRcdGxldCBzaXplID0gbmV3IFZlY3RvcjIoKTtcblx0XHR0aGlzLmdldEJvdW5kcyhvZmZzZXQsIHNpemUsIHVuZGVmaW5lZCwgY2xpcHBlcik7XG5cdFx0cmV0dXJuIHsgeDogb2Zmc2V0LngsIHk6IG9mZnNldC55LCB3aWR0aDogc2l6ZS54LCBoZWlnaHQ6IHNpemUueSB9O1xuXHR9XG5cblx0LyoqIFJldHVybnMgdGhlIGF4aXMgYWxpZ25lZCBib3VuZGluZyBib3ggKEFBQkIpIG9mIHRoZSByZWdpb24gYW5kIG1lc2ggYXR0YWNobWVudHMgZm9yIHRoZSBjdXJyZW50IHBvc2UuXG5cdCAqIEBwYXJhbSBvZmZzZXQgQW4gb3V0cHV0IHZhbHVlLCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgc2tlbGV0b24gb3JpZ2luIHRvIHRoZSBib3R0b20gbGVmdCBjb3JuZXIgb2YgdGhlIEFBQkIuXG5cdCAqIEBwYXJhbSBzaXplIEFuIG91dHB1dCB2YWx1ZSwgdGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgdGhlIEFBQkIuXG5cdCAqIEBwYXJhbSB0ZW1wIFdvcmtpbmcgbWVtb3J5IHRvIHRlbXBvcmFyaWx5IHN0b3JlIGF0dGFjaG1lbnRzJyBjb21wdXRlZCB3b3JsZCB2ZXJ0aWNlcy5cblx0ICogQHBhcmFtIGNsaXBwZXIge0BsaW5rIFNrZWxldG9uQ2xpcHBpbmd9IHRvIHVzZS4gSWYgPGNvZGU+bnVsbDwvY29kZT4sIG5vIGNsaXBwaW5nIGlzIGFwcGxpZWQuICovXG5cdGdldEJvdW5kcyAob2Zmc2V0OiBWZWN0b3IyLCBzaXplOiBWZWN0b3IyLCB0ZW1wOiBBcnJheTxudW1iZXI+ID0gbmV3IEFycmF5PG51bWJlcj4oMiksIGNsaXBwZXI6IFNrZWxldG9uQ2xpcHBpbmcgfCBudWxsID0gbnVsbCkge1xuXHRcdGlmICghb2Zmc2V0KSB0aHJvdyBuZXcgRXJyb3IoXCJvZmZzZXQgY2Fubm90IGJlIG51bGwuXCIpO1xuXHRcdGlmICghc2l6ZSkgdGhyb3cgbmV3IEVycm9yKFwic2l6ZSBjYW5ub3QgYmUgbnVsbC5cIik7XG5cdFx0bGV0IGRyYXdPcmRlciA9IHRoaXMuZHJhd09yZGVyO1xuXHRcdGxldCBtaW5YID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBtaW5ZID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBtYXhYID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBtYXhZID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXHRcdGZvciAobGV0IGkgPSAwLCBuID0gZHJhd09yZGVyLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXHRcdFx0bGV0IHNsb3QgPSBkcmF3T3JkZXJbaV07XG5cdFx0XHRpZiAoIXNsb3QuYm9uZS5hY3RpdmUpIGNvbnRpbnVlO1xuXHRcdFx0bGV0IHZlcnRpY2VzTGVuZ3RoID0gMDtcblx0XHRcdGxldCB2ZXJ0aWNlczogTnVtYmVyQXJyYXlMaWtlIHwgbnVsbCA9IG51bGw7XG5cdFx0XHRsZXQgdHJpYW5nbGVzOiBOdW1iZXJBcnJheUxpa2UgfCBudWxsID0gbnVsbDtcblx0XHRcdGxldCBhdHRhY2htZW50ID0gc2xvdC5nZXRBdHRhY2htZW50KCk7XG5cdFx0XHRpZiAoYXR0YWNobWVudCBpbnN0YW5jZW9mIFJlZ2lvbkF0dGFjaG1lbnQpIHtcblx0XHRcdFx0dmVydGljZXNMZW5ndGggPSA4O1xuXHRcdFx0XHR2ZXJ0aWNlcyA9IFV0aWxzLnNldEFycmF5U2l6ZSh0ZW1wLCB2ZXJ0aWNlc0xlbmd0aCwgMCk7XG5cdFx0XHRcdGF0dGFjaG1lbnQuY29tcHV0ZVdvcmxkVmVydGljZXMoc2xvdCwgdmVydGljZXMsIDAsIDIpO1xuXHRcdFx0XHR0cmlhbmdsZXMgPSBTa2VsZXRvbi5xdWFkVHJpYW5nbGVzO1xuXHRcdFx0fSBlbHNlIGlmIChhdHRhY2htZW50IGluc3RhbmNlb2YgTWVzaEF0dGFjaG1lbnQpIHtcblx0XHRcdFx0bGV0IG1lc2ggPSAoPE1lc2hBdHRhY2htZW50PmF0dGFjaG1lbnQpO1xuXHRcdFx0XHR2ZXJ0aWNlc0xlbmd0aCA9IG1lc2gud29ybGRWZXJ0aWNlc0xlbmd0aDtcblx0XHRcdFx0dmVydGljZXMgPSBVdGlscy5zZXRBcnJheVNpemUodGVtcCwgdmVydGljZXNMZW5ndGgsIDApO1xuXHRcdFx0XHRtZXNoLmNvbXB1dGVXb3JsZFZlcnRpY2VzKHNsb3QsIDAsIHZlcnRpY2VzTGVuZ3RoLCB2ZXJ0aWNlcywgMCwgMik7XG5cdFx0XHRcdHRyaWFuZ2xlcyA9IG1lc2gudHJpYW5nbGVzO1xuXHRcdFx0fSBlbHNlIGlmIChhdHRhY2htZW50IGluc3RhbmNlb2YgQ2xpcHBpbmdBdHRhY2htZW50ICYmIGNsaXBwZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRjbGlwcGVyLmNsaXBTdGFydChzbG90LCBhdHRhY2htZW50KTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRpZiAodmVydGljZXMgJiYgdHJpYW5nbGVzKSB7XG5cdFx0XHRcdGlmIChjbGlwcGVyICE9IG51bGwgJiYgY2xpcHBlci5pc0NsaXBwaW5nKCkpIHtcblx0XHRcdFx0XHRjbGlwcGVyLmNsaXBUcmlhbmdsZXModmVydGljZXMsIHRyaWFuZ2xlcywgdHJpYW5nbGVzLmxlbmd0aCk7XG5cdFx0XHRcdFx0dmVydGljZXMgPSBjbGlwcGVyLmNsaXBwZWRWZXJ0aWNlcztcblx0XHRcdFx0XHR2ZXJ0aWNlc0xlbmd0aCA9IGNsaXBwZXIuY2xpcHBlZFZlcnRpY2VzLmxlbmd0aDtcblx0XHRcdFx0fVxuXHRcdFx0XHRmb3IgKGxldCBpaSA9IDAsIG5uID0gdmVydGljZXMubGVuZ3RoOyBpaSA8IG5uOyBpaSArPSAyKSB7XG5cdFx0XHRcdFx0bGV0IHggPSB2ZXJ0aWNlc1tpaV0sIHkgPSB2ZXJ0aWNlc1tpaSArIDFdO1xuXHRcdFx0XHRcdG1pblggPSBNYXRoLm1pbihtaW5YLCB4KTtcblx0XHRcdFx0XHRtaW5ZID0gTWF0aC5taW4obWluWSwgeSk7XG5cdFx0XHRcdFx0bWF4WCA9IE1hdGgubWF4KG1heFgsIHgpO1xuXHRcdFx0XHRcdG1heFkgPSBNYXRoLm1heChtYXhZLCB5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGNsaXBwZXIgIT0gbnVsbCkgY2xpcHBlci5jbGlwRW5kV2l0aFNsb3Qoc2xvdCk7XG5cdFx0fVxuXHRcdGlmIChjbGlwcGVyICE9IG51bGwpIGNsaXBwZXIuY2xpcEVuZCgpO1xuXHRcdG9mZnNldC5zZXQobWluWCwgbWluWSk7XG5cdFx0c2l6ZS5zZXQobWF4WCAtIG1pblgsIG1heFkgLSBtaW5ZKTtcblx0fVxuXG5cdC8qKiBJbmNyZW1lbnRzIHRoZSBza2VsZXRvbidzIHtAbGluayAjdGltZX0uICovXG5cdHVwZGF0ZSAoZGVsdGE6IG51bWJlcikge1xuXHRcdHRoaXMudGltZSArPSBkZWx0YTtcblx0fVxuXG5cdHBoeXNpY3NUcmFuc2xhdGUgKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG5cdFx0Y29uc3QgcGh5c2ljc0NvbnN0cmFpbnRzID0gdGhpcy5waHlzaWNzQ29uc3RyYWludHM7XG5cdFx0Zm9yIChsZXQgaSA9IDAsIG4gPSBwaHlzaWNzQ29uc3RyYWludHMubGVuZ3RoOyBpIDwgbjsgaSsrKVxuXHRcdFx0cGh5c2ljc0NvbnN0cmFpbnRzW2ldLnRyYW5zbGF0ZSh4LCB5KTtcblx0fVxuXG5cdC8qKiBDYWxscyB7QGxpbmsgUGh5c2ljc0NvbnN0cmFpbnQjcm90YXRlKGZsb2F0LCBmbG9hdCwgZmxvYXQpfSBmb3IgZWFjaCBwaHlzaWNzIGNvbnN0cmFpbnQuICovXG5cdHBoeXNpY3NSb3RhdGUgKHg6IG51bWJlciwgeTogbnVtYmVyLCBkZWdyZWVzOiBudW1iZXIpIHtcblx0XHRjb25zdCBwaHlzaWNzQ29uc3RyYWludHMgPSB0aGlzLnBoeXNpY3NDb25zdHJhaW50cztcblx0XHRmb3IgKGxldCBpID0gMCwgbiA9IHBoeXNpY3NDb25zdHJhaW50cy5sZW5ndGg7IGkgPCBuOyBpKyspXG5cdFx0XHRwaHlzaWNzQ29uc3RyYWludHNbaV0ucm90YXRlKHgsIHksIGRlZ3JlZXMpO1xuXHR9XG59XG5cbi8qKiBEZXRlcm1pbmVzIGhvdyBwaHlzaWNzIGFuZCBvdGhlciBub24tZGV0ZXJtaW5pc3RpYyB1cGRhdGVzIGFyZSBhcHBsaWVkLiAqL1xuZXhwb3J0IGVudW0gUGh5c2ljcyB7XG5cdC8qKiBQaHlzaWNzIGFyZSBub3QgdXBkYXRlZCBvciBhcHBsaWVkLiAqL1xuXHRub25lLFxuXG5cdC8qKiBQaHlzaWNzIGFyZSByZXNldCB0byB0aGUgY3VycmVudCBwb3NlLiAqL1xuXHRyZXNldCxcblxuXHQvKiogUGh5c2ljcyBhcmUgdXBkYXRlZCBhbmQgdGhlIHBvc2UgZnJvbSBwaHlzaWNzIGlzIGFwcGxpZWQuICovXG5cdHVwZGF0ZSxcblxuXHQvKiogUGh5c2ljcyBhcmUgbm90IHVwZGF0ZWQgYnV0IHRoZSBwb3NlIGZyb20gcGh5c2ljcyBpcyBhcHBsaWVkLiAqL1xuXHRwb3NlXG59XG4iXX0=