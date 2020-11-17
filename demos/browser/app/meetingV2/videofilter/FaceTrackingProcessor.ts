/* eslint-disable @typescript-eslint/no-explicit-any */
declare let bodyPix: any;

import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from '../../../../../src';
export default class FaceTrackingProcessor implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;

  init: boolean = true;
  model: any | undefined = undefined;
  constructor() {}

  name(): string {
    return 'FaceTrackingProcessor';
  }

  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    if (!this.model) {
      this.model = await bodyPix.load();
      console.log(this.model);
    }

    const inputCanvas = buffers[0].asCanvasElement();

    const frameWidth = inputCanvas.width;
    const frameHeight = inputCanvas.height;

    if (frameWidth === 0 || frameHeight === 0) {
      return buffers;
    }

    if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
      this.sourceWidth = frameWidth;
      this.sourceHeight = frameHeight;

      // update target canvas size to match the frame size
      this.targetCanvas.width = this.sourceWidth;
      this.targetCanvas.height = this.sourceHeight;
    }

    const image = inputCanvas
      .getContext('2d')
      .getImageData(0, 0, inputCanvas.width, inputCanvas.height);

    let preds: any;

    try {
      preds = await this.model.segmentPerson(image);
    } catch (error) {
      console.log(error);
    }
    const foregroundColor = { r: 255, g: 255, b: 255, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const mask = bodyPix.toMask(preds, foregroundColor, backgroundColor, true);

    if (!!preds) {
      bodyPix.drawMask(this.targetCanvas, inputCanvas as HTMLCanvasElement, mask);
      buffers[0] = this.canvasVideoFrameBuffer;
    }

    return buffers;
  }

  destroy(): Promise<void> {
    this.model.dispose();
    return;
  }
}
