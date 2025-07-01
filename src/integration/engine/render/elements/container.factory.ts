import { ElementNode } from 'src/domain/entities/page/element.entity.interface';
import { StyleService } from 'src/integration/engine/render/services/style.service';
import { Control, Rectangle, StackPanel, TextBlock } from '@babylonjs/gui';
import { SiteContent } from 'src/domain/aggregates/site-content.aggregate';
import { AnchorNode } from 'src/domain/entities/page/content/items/text/anchor.entity';
import { CoreNode } from 'src/domain/entities/page/containers/core.entity';
import { EmbeddableContainerNode } from 'src/domain/entities/page/content/embeddable-container.entity';
import { PreviewNode } from 'src/domain/entities/page/containers/preview.entity';
import { ContentNode } from 'src/domain/entities/page/content.entity.interface';
import { TextBlockFactory } from 'src/integration/engine/render/elements/text.factory';
import { AnchorBlockFactory } from 'src/integration/engine/render/elements/anchor.factory';
import { Injectable } from '@angular/core';
import { Mesh, Scene } from '@babylonjs/core';
import { GuiHelper } from '../services/helpers/gui.helper';

@Injectable({ providedIn: 'root' })
export class ContainerFactory {
    constructor(
        private styleService: StyleService,
         private textBlockFactory: TextBlockFactory,
         private anchorBlockFactory: AnchorBlockFactory,
         private guiHelper: GuiHelper
    ) { }


    public async createContainer(
        scene: Scene,
        mesh: Mesh,
        meshMap: Map<string, { preview: Control; core: Control }>,
        pageId: string,
        node: ElementNode,
        siteContent?: SiteContent | null,
        parentPanelSize?: { width: number, height: number } 
    ): Promise<Rectangle> {
        const rect = new Rectangle(node.type);
        (rect as any)._parentMesh = mesh; // Attach mesh reference for fillSpace sizing
        rect.clipChildren = false; // Ensure children are never clipped

        // Get the full style chain and merge properties to determine sizing intent
        const styleChain = this.styleService.getStyleChain(pageId, node);
        const mergedProps = this.styleService.getMergedProperties(styleChain);

        const hasFillSpace = mergedProps.fillSpace === true;
        const styledWidth = mergedProps.width;
        const styledHeight = mergedProps.height;

        // The GUI texture has a fixed resolution. All GUI element sizes are relative to this texture.
        // In gui.helper.ts, this is hardcoded to 1024x1024. This is our coordinate space.
        const textureWidth = parentPanelSize?.width ?? 1024;
        const textureHeight = parentPanelSize?.height ?? 1024;

        // Determine the final pixel dimensions for the container based on styling intent
        let finalWidth = textureWidth;
        let finalHeight = textureHeight;

        // Only apply hex-flower panel size reduction and border hiding to top-level core/preview panels
        const isHexFlower = siteContent?.site?.sitemapType === 'HEX_FLOWER';
        // Detect if this is a top-level core or preview panel (not a nested container)
        const isTopLevelCoreOrPreviewPanel = node.type === 'core' || node.type === 'preview';

        if (hasFillSpace) {
            finalWidth = textureWidth;
            finalHeight = textureHeight;
        } else {
            if (typeof styledWidth === 'string' && styledWidth.endsWith('%')) {
                finalWidth = textureWidth * (parseFloat(styledWidth) / 100);
            } else if (typeof styledWidth === 'string' && styledWidth.endsWith('px')) {
                finalWidth = parseFloat(styledWidth);
            }
            if (typeof styledHeight === 'string' && styledHeight.endsWith('%')) {
                finalHeight = textureHeight * (parseFloat(styledHeight) / 100);
            } else if (typeof styledHeight === 'string' && styledHeight.endsWith('px')) {
                finalHeight = parseFloat(styledHeight);
            }
        }

        // For hex-flower, reduce panel size by 33% (0.67x) ONLY for top-level core/preview panels
        if (isHexFlower && isTopLevelCoreOrPreviewPanel) {
            finalWidth = Math.round(finalWidth * 0.67);
            finalHeight = Math.round(finalHeight * 0.67);
        }

        // Scale all padding/margin/fontSize in mergedProps from % to px if needed
        this.styleService.scaleSpacingProperties(mergedProps, textureWidth, textureHeight);

        // Apply all other styles first, then override width/height with our calculated final values
        this.styleService.applyStyles(rect, styleChain);
        rect.width = `${finalWidth}px`;
        rect.height = `${finalHeight}px`;

        // Hide rectangle border ONLY for top-level core/preview panels in hex-flower
        if (isHexFlower && isTopLevelCoreOrPreviewPanel) {
            rect.thickness = 0;
            rect.color = 'transparent';
            // Also apply or remove the mesh border for preview/core panels
            if (node.type === 'preview') {
                this.styleService.applyPreviewHoverBorder(mesh, scene, 'HEX_FLOWER', false);
            } 
        }

        // When using material backgrounds, GUI should always be transparent to show the mesh material
        if (siteContent?.site?.backgroundType === 'material') {
            // Always make GUI transparent when site uses materials - the mesh provides the background
            rect.background = "transparent";
        } else {
            // Only check individual node styles if site doesn't use materials
            const nodeStyle = styleChain.find(s => s._id === node._id); // Get the specific style for this node
            if (nodeStyle?.properties?.backgroundType === 'material' ||
                nodeStyle?.properties?.borderType === 'material') {
                rect.background = "transparent";
            }
        }

        // Handle children
        const children = this.getChildNodes(node);
        if (children && children.length > 0) {
            // Group text nodes in a StackPanel, add non-text children directly
            const textNodes: ElementNode[] = [];
            const otherNodes: ElementNode[] = [];
            for (const childNode of children) {
                if (!this.isElementNode(childNode)) continue;
                (childNode as any).parent = node;
                if (childNode.type === 'h1' || childNode.type === 'p' || childNode.type === 'anchor') {
                    textNodes.push(childNode);
                } else {
                    otherNodes.push(childNode);
                }
            }


            // Pass parent rect's pixel width/height to children for sizing (always define for all children)
            const childPanelSize = { width: finalWidth, height: finalHeight };

            if (textNodes.length > 0) {
                const stackPanel = new StackPanel("text-stack");
                stackPanel.isVertical = true;
                stackPanel.clipChildren = false;

                // Set width for the StackPanel based on container dimensions
                const spWidth = Math.round(finalWidth * 0.95);
                stackPanel.width = `${spWidth}px`;
             
                // Add padding to the StackPanel
                stackPanel.paddingTop = "10px";
                stackPanel.paddingBottom = "10px";

                // Center the StackPanel in its parent container
                stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                stackPanel.spacing = 0;

                // Add all text nodes to the StackPanel and calculate total height
                let totalHeight = stackPanel.paddingTop ? parseInt(stackPanel.paddingTop) : 0;
                totalHeight += stackPanel.paddingBottom ? parseInt(stackPanel.paddingBottom) : 0;

                for (const textNode of textNodes) {
                    const textBlockPanelSize = { width: spWidth, height: childPanelSize.height };

                    if (textNode.type === 'anchor') {
                        const anchorBlock = this.anchorBlockFactory.createAnchorBlock(
                            pageId,
                            textNode as AnchorNode,
                            textBlockPanelSize,
                            mesh
                        );
                        if (anchorBlock.height && typeof anchorBlock.height === 'string' && anchorBlock.height.endsWith('px')) {
                            totalHeight += parseInt(anchorBlock.height) + stackPanel.spacing;
                        }
                        stackPanel.addControl(anchorBlock);
                    } else {
                        
                        const textBlock = this.textBlockFactory.createTextBlock(
                            pageId,
                            textNode,
                            textBlockPanelSize,
                            mesh
                        );
                        textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                        if (
                          textBlock instanceof Rectangle &&
                          textBlock.children &&
                          textBlock.children.length > 0 &&
                          textBlock.children[0] instanceof Control &&
                          'textHorizontalAlignment' in textBlock.children[0]
                        ) {
                          (textBlock.children[0] as TextBlock).textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                        }
                        if (textBlock.height && typeof textBlock.height === 'string' && textBlock.height.endsWith('px')) {
                            totalHeight += parseInt(textBlock.height) + stackPanel.spacing;
                        }
                        stackPanel.addControl(textBlock);
                    }
                }


                // Set explicit height for the stack panel based on total content height
                const extraPadding = textNodes.length > 1 ? 30 : 20;
                let stackPanelHeight = totalHeight + extraPadding;

                stackPanel.height = stackPanelHeight + 'px';

                rect.addControl(stackPanel);
            }
            for (const childNode of otherNodes) {
                let childControl: Control | null = null;
                if (childNode.type === 'container' || childNode.type === 'panel') {
                    childControl = await this.createContainer(
                        scene,
                        mesh,
                        meshMap,
                        pageId,
                        childNode,
                        siteContent,
                        childPanelSize
                    );
                }
                if (childControl) {
                    rect.addControl(childControl);
                }
            }
        }
        return rect;
    }

    private getChildNodes(node: ElementNode): ContentNode[] | undefined {
        if (node instanceof CoreNode || node instanceof PreviewNode || node instanceof EmbeddableContainerNode) {
            return node.children;
        } else if ('children' in node && Array.isArray((node as any).children)) {
            return (node as any).children;
        }
        return undefined;
    }

    // Helper method to check if node is an ElementNode
    private isElementNode(node: any): node is ElementNode {
        return node && typeof node === 'object' && 'type' in node;
    }
}