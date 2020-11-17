// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import DefaultVideoTransformDeviceObserver from '../../src/videoframeprocessor/DefaultVideoTransformDeviceObserver';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../../src/videoframeprocessor/VideoFrameProcessor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoTransformDevice', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    domMockBehavior.createElementCaptureStream = new MediaStream();
    mockVideoStream = new MediaStream();
    // @ts-ignore
    mockVideoStream.id = 'sample';
    // @ts-ignore
    mockVideoTrack = new MediaStreamTrack('test', 'video');
    mockVideoStream.addTrack(mockVideoTrack);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      assert.exists(device);
    });
  });

  describe('getter outputMediaStream', () => {
    it('returns null if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(await device.outputMediaStream).to.be.null;
    });
  });

  describe('applyProcessors', () => {
    it('returns null if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await device.applyProcessors();
    });

    it('does not start if processors is null', async () => {
      const device = new DefaultVideoTransformDevice(logger, 'test', []);
      await device.applyProcessors();
      await device.applyProcessors();
    });

    it('returns null if device is not started', done => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(200).start(() => {
        // assert.exists(device.outputMediaStream);
        device.stop();
      });

      new TimeoutScheduler(50).start(() => {
        done();
      });
    });
  });

  describe('stop', () => {
    it('returns null if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await device.stop();
    });
  });

  describe('addObserver', () => {
    it('returns null if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await device.stop();
    });
  });

  describe('getInnerDevice', () => {
    it('returns null if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(device.getInnerDevice()).to.equal('test');
    });
  });

  describe('intrinsicDevice', () => {
    it('returns the intrinsicDevice', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(JSON.stringify(await device.intrinsicDevice())).to.equal(
        JSON.stringify({ deviceId: { exact: 'test' } })
      );
    });

    it('returns the correct intrinsicDevice', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'ios12.1';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(JSON.stringify(await device.intrinsicDevice())).to.equal(
        JSON.stringify({ deviceId: 'test' })
      );
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, null, []);
      expect(JSON.stringify(await device.intrinsicDevice())).to.equal(JSON.stringify({}));
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, mockVideoStream, []);
      expect(JSON.stringify(await device.intrinsicDevice())).to.equal(
        JSON.stringify(mockVideoStream)
      );
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, { width: 1280 }, []);
      expect(JSON.stringify(await device.intrinsicDevice())).to.equal(
        JSON.stringify({ width: 1280 })
      );
    });
  });

  describe('observer callback', () => {
    it('processingDidStart', done => {
      let started = 0;
      let stopped = 0;
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingDidStart(): void {
          started = 1;
        }

        processingDidStop(): void {
          stopped = 1;
        }
      }
      const obs = new Observer();
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(300).start(() => {
        expect(started).to.equal(1);
        domMockBehavior.createElementCaptureStream = mockVideoStream;
        assert.exists(device.outputMediaStream);
        device.stop();
      });

      new TimeoutScheduler(350).start(() => {
        expect(stopped).to.equal(1);
        done();
      });
    });

    it('processingDidStart', done => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(300).start(() => {
        device.stop();
        done();
      });
    });

    it('processingDidFailToStart', done => {
      class WrongProcessor implements VideoFrameProcessor {
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      let called = true;
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingDidFailToStart(): void {
          called = true;
        }
      }
      const obs = new Observer();
      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(300).start(() => {
        expect(called).to.equal(true);
        device.stop();
      });

      new TimeoutScheduler(350).start(() => {
        done();
      });
    });

    it('processingDidFailToStart', done => {
      class WrongProcessor implements VideoFrameProcessor {
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      let called = true;
      let notCalled = true;
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingDidFailToStart(): void {
          called = true;
        }
      }

      class Observer2 implements DefaultVideoTransformDeviceObserver {
        processingDidStart(): void {
          notCalled = false;
        }
      }
      const obs = new Observer();
      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      device.addObserver(new Observer2());
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(300).start(() => {
        expect(called).to.equal(true);
        expect(notCalled).to.equal(true);
        device.stop();
      });

      new TimeoutScheduler(350).start(() => {
        done();
      });
    });

    it('processingDidFailToStart', done => {
      class WrongProcessor implements VideoFrameProcessor {
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      let called = true;
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingDidFailToStart(): void {
          called = true;
        }
      }
      const obs = new Observer();
      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      device.applyProcessors(mockVideoStream);

      new TimeoutScheduler(300).start(() => {
        expect(called).to.equal(true);
        device.stop();
      });

      new TimeoutScheduler(350).start(() => {
        device.removeObserver(obs);
        done();
      });
    });

    it('processingLatencyTooHigh', done => {
      let called = false;
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingLatencyTooHigh(_latency: number): void {
          called = true;
        }
      }

      class Observer2 implements DefaultVideoTransformDeviceObserver {}
      const obs = new Observer();

      class WrongProcessor implements VideoFrameProcessor {
        async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          await new Promise(resolve => setTimeout(resolve, (1000 / 15) * 3));
          return buffers;
        }
      }

      const procs = [new WrongProcessor()];
      const device = new DefaultVideoTransformDevice(logger, 'test', procs);
      device.addObserver(obs);
      device.addObserver(new Observer2());
      device.applyProcessors(mockVideoStream);
      new TimeoutScheduler(800).start(() => {
        expect(called).to.equal(true);
        device.stop();
        done();
      });
    });
  });
});
