# Image processing

When creating on-chain NFTs project, there are two main steps:
- preprocessing the raw input images (e.g. resizing, compression, quantization, etc.) from any file format (e.g. .svg, .png, etc.)
- packing all the data in an hopefully efficient way (e.g. using a compression algorithm, etc.)

Though the image processing part could also be done in TypeScript, it feels like python has a much more tooling.
Especially, while the preprocessing are currently somehow naive, there is no doubt that at some point AI will be used
either to preprocess or even to generate the data itself.

For these reasons, the image processing part is currently done in python.

## Installation

The project relies on [poetry](https://python-poetry.org/) so make sure you have it installed. Then:

```bash
poetry install
```
