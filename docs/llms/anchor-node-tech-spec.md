# Anchor Node Technical Specification

## Overview

This document describes the plan to introduce an "anchor" node type to the Inanda content model. The anchor node will function similarly to an HTML `<a>` tag, allowing navigation to URLs when clicked. It will be a sibling to other block nodes (e.g., `h1`, `p`), not an inline/embedded node (for now).

## Goals

- Add a new `anchor` node type for linking.
- Support default and hover styles for anchor nodes.
- Allow anchor nodes to specify a URL and a target (e.g., `_blank`).
- Attach click event logic to anchor nodes for navigation.
- Integrate anchor nodes into the existing content and style system.

## Node Structure

Example anchor node in JSON:
```json
{
  "type": "anchor",
  "text": "Visit our site",
  "url": "https://example.com",
  "target": "_blank",
  "_id": "anchor-1"
}
```

### Properties

- `type`: `"anchor"`
- `text`: The link text to display.
- `url`: The destination URL.
- `target`: (optional) The target for navigation (`_blank`, `_self`, etc.).
- `_id`: Unique node identifier.

## Style Schema

Add default and hover styles for anchors in the styles collection:

```json
{
  "style_id": "anchor",
  "properties": {
    "foregroundColor": "#0074d9",
    "textDecoration": "underline",
    "cursor": "pointer"
  }
},
{
  "style_id": "anchor-hover",
  "properties": {
    "foregroundColor": "#005fa3",
    "textDecoration": "underline"
  }
}
```

## Rendering Logic

- Recognize `anchor` nodes in the rendering pipeline.
- Render as a clickable control with anchor styles.
- On hover, apply the hover style.
- On click, open the specified `url` in the specified `target` (using `window.open(url, target)` or equivalent).
- If the URL is an internal route, optionally handle with client-side navigation.

## Implementation Steps

1. **Node Definition**:  
   - Create an `AnchorNode` class, similar to `TextNode`, with `text`, `url`, `target`, and `_id`.
2. **Schema Update**:  
   - Update JSON schema and TypeScript types to support the new node.
3. **Style Update**:  
   - Add default and hover styles for anchors.
4. **Rendering Update**:  
   - Update GUI rendering logic to handle anchor nodes, apply styles, and attach events.
5. **Event Handling**:  
   - Implement click and hover event logic for anchor controls.
6. **Data Update**:  
   - Add anchor node examples to site data for testing.
7. **Testing**:  
   - Verify anchor nodes render, style, and navigate as expected.

## Notes

- For now, anchor nodes are block-level siblings, not inline/embedded.
- Only allow a controlled set of properties for anchors.
- Update this document as implementation progresses.

---

_Last updated: 2025-06-25_