import * as express from 'express';
import { Request, Response } from 'express';
import { InfraLogger as logger } from './logger';
import { Event, EventType, RabbitEventBus, MockEventBus } from '@libero/event-bus';

interface TestEventPayload {
  x: number;
  y: number;
}

const initMq = async () => {
  const testEventDef: EventType = {
    kind: 'something_else',
    namespace: 'service_01',
  };

  // Mock bus
  const mockMq = await (new MockEventBus()).init([testEventDef, testEventDef], 'message-bus-test');
  logger.info('messageQueueStarted');

  mockMq.subscribe<TestEventPayload>(testEventDef, async (event) => {
    logger.info('mockEventReceived', event);
    return true;
  });

  setTimeout(() => {
    const event: Event<TestEventPayload> = {
      id: 'some-wevent-id',
      created: new Date(),
      payload: {
        x: 10,
        y: 20,
      },
      ...testEventDef,
    };

    mockMq.publish(event);
  }, 10000);

  // Rabbit bus
  const rabbitmqMq = await (new RabbitEventBus({url: 'amqp://rabbitmq'})).init([testEventDef, testEventDef], 'message-bus-test');
  logger.info('messageQueueStarted');

  rabbitmqMq.subscribe<TestEventPayload>(testEventDef, async (event: Event<TestEventPayload>) => {
    logger.info('rabbitEventRecieved', event);
    return true;
  });

  setInterval(async () => {
    const event: Event<TestEventPayload> = {
      id: 'some-wevent-id',
      created: new Date(),
      payload: {
        x: 10,
        y: 20,
      },
      ...testEventDef,
    };

    rabbitmqMq.publish(event);
  }, 500);

};

const main = () => {
  initMq();
  const app = express();
  app.use('/', (req: Request, res: Response, next) => {
    // Maybe this should be trace level logging
    logger.info(`${req.method} ${req.path}`, {});
    next();
  });

  app.get('/health', (req: Request, res: Response) => {
    logger.info('/healthcheck');
    res.json({ ok: true });
  });

  return app;
};

main().listen(3002, () => logger.info('applicationStartup'));
