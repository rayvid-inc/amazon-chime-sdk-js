// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CanvasVideoFrameBuffer,
  VideoFrameBuffer,
  VideoFrameProcessor,
} from '../../../../../src/index';

/**
 * [[CircularCut]] updates the input {@link VideoFrameBuffer} and cut out a circular frame in the middle for sending.
 */
export default class CircularCut implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext(
    '2d'
  ) as CanvasRenderingContext2D;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;

  constructor(private radius: number = 150) {}

  process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    // assuming one video stream
    const canvas = buffers[0].asCanvasElement();

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;

    if (frameWidth === 0 || frameHeight === 0) {
      return Promise.resolve(buffers);
    }

    if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
      this.sourceWidth = frameWidth;
      this.sourceHeight = frameHeight;

      this.targetCanvas.width = this.sourceWidth;
      this.targetCanvas.height = this.sourceHeight;

      this.targetCanvasCtx.beginPath();
      this.targetCanvasCtx.arc(
        this.sourceWidth / 2,
        this.sourceHeight / 2,
        this.radius,
        0,
        2 * Math.PI
      );
      this.targetCanvasCtx.clip();
      this.targetCanvasCtx.stroke();
      this.targetCanvasCtx.closePath();
    }

    this.targetCanvasCtx.drawImage(canvas, 0, 0);

    buffers[0] = this.canvasVideoFrameBuffer;
    return Promise.resolve(buffers);
  }
}
