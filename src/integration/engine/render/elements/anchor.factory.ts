import { StyleService } from 'src/integration/engine/render/services/style.service';
import { TextBlock, Control, Rectangle } from '@babylonjs/gui';
import { AnchorNode } from 'src/domain/entities/page/content/items/text/anchor.entity';
import { Injectable } from '@angular/core';
import { Mesh } from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class AnchorBlockFactory {
    constructor(
        private styleService: StyleService
    ) { }

    public createAnchorBlock(pageId: string, node: AnchorNode, parentPanelSize?: { width: number; height: number }, mesh?: Mesh): Rectangle {
        const anchorBlock = new TextBlock(node.type);
        anchorBlock.text = node.text;
        anchorBlock.name = node._id || node.text;
        anchorBlock.clipContent = false;
        anchorBlock.paddingTop = "8px";
        anchorBlock.paddingBottom = "8px";
        anchorBlock.paddingLeft = "6px";
        anchorBlock.paddingRight = "6px";
        anchorBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        anchorBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        anchorBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const normalStyleChain = this.styleService.getStyleChain(pageId, node);
        const hoverStyleChain = this.styleService.getHoverStyleChain(pageId, node, normalStyleChain);

        anchorBlock.resizeToFit = true;
        anchorBlock.textWrapping = true;
        if (parentPanelSize && typeof parentPanelSize.width === 'number') {
            anchorBlock.width = parentPanelSize.width + 'px';
        } else {
            throw new Error(`No width on anchorBlock parent`);
        }
        // If width is not a string ending with 'px', throw
        if (typeof anchorBlock.width !== 'string' || !anchorBlock.width.endsWith('px')) {
            throw new Error(`[ERROR] anchorBlock.width must be a string ending with 'px'. Got: ${anchorBlock.width}`);
        }

        anchorBlock.onPointerUpObservable.add((event) => {
            if (event.buttonIndex !== 0) {
                // don't trigger unless it's the left mouse button
                return;
            }
            if (node.url) {
                window.open(node.url, node.target || '_blank');
            }
        });

        anchorBlock.isPointerBlocker = true;

        // Wrap the anchorBlock in a Rectangle for background/border support
        const anchorRect = this.styleService.wrapTextInRectangle(
            anchorBlock,
            normalStyleChain, // container styles
            normalStyleChain, // text styles (can be separated if needed)
            mesh
        );

        // Apply hover effects to the wrapping rectangle, which is the element that receives pointer events.
        anchorRect.onPointerEnterObservable.add(() => {
            // Apply the hover styles to both the Rectangle and the TextBlock child.
            // The style service will apply the correct properties to each control type.
            this.styleService.applyStyles(anchorRect, hoverStyleChain);
            this.styleService.applyStyles(anchorBlock, hoverStyleChain);
            // After applying styles, the anchorBlock's height might have changed.
            // We need to update the parent rectangle's height and mark it as dirty for redraw.
            anchorRect.height = anchorBlock.height;
            anchorRect.markAsDirty();
        });

        anchorRect.onPointerOutObservable.add(() => {
            // Revert to normal styles for both.
            this.styleService.applyStyles(anchorRect, normalStyleChain);
            this.styleService.applyStyles(anchorBlock, normalStyleChain);
            anchorRect.height = anchorBlock.height;
            anchorRect.markAsDirty();
        });

        return anchorRect;
    }
}