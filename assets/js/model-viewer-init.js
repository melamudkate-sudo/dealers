import { ModelViewerElement } from '../vendor/model-viewer/model-viewer.min.js';

// Resolve relative to this module so both /dealers/ and a custom domain work.
ModelViewerElement.dracoDecoderLocation = new URL('../vendor/draco/', import.meta.url).href;
