import { ElementNode } from 'src/domain/entities/page/element.entity.interface';
import { StyleService } from 'src/integration/engine/render/services/style.service';
import { TextBlock, Control, Rectangle } from '@babylonjs/gui';
import { Injectable } from '@angular/core';
import { Mesh } from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class TextBlockFactory {
    constructor(
        private styleService: StyleService,
    ) { }

    public createTextBlock(pageId: string, node: ElementNode, parentPanelSize?: { width: number, height: number }, mesh?: Mesh): Rectangle {
        const textBlock = new TextBlock(node.type);
        textBlock.clipContent = false;
        if ('text' in node && typeof node.text === 'string') {
            textBlock.text = node.text;
        } else {
            textBlock.text = node.type === 'h1' ? 'Header' : 'Text content';
        }
        const styleChain = this.styleService.getStyleChain(pageId, node);

        this.styleService.applyStyles(textBlock, styleChain);
        // Always use style for fontSize/height; only set width if provided
        textBlock.resizeToFit = node.type === 'h1';
        textBlock.textWrapping = node.type !== 'h1';
        if (parentPanelSize && typeof parentPanelSize.width === 'number' && parentPanelSize.width > 0) {
            textBlock.width = parentPanelSize.width + 'px';
        } else {
            // No fallback, log error and throw
            throw new Error('[ERROR] No valid parentPanelSize.width provided to text block.');
        }
        // If width is not a string ending with 'px', throw
        if (typeof textBlock.width !== 'string' || !textBlock.width.endsWith('px')) {
            throw new Error(`[ERROR] textBlock.width must be a string ending with 'px'. Got: ${textBlock.width}`);
        }
        if (textBlock.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER) {
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        }
        if (textBlock.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER) {
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        }

        textBlock.isPointerBlocker = true;

        // Wrap the textBlock in a Rectangle for background/border support
        return this.styleService.wrapTextInRectangle(
            textBlock,
            styleChain, // container styles
            styleChain, // text styles (can be separated if needed)
            mesh
        );
    }
}