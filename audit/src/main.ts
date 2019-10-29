// Startup the audit service
import { InfraLogger as logger } from './logger';
import * as express from 'express';
import { Express, Request, Response } from 'express';
import { v4 } from 'uuid';
import { EventBus, RabbitEventBus } from '@libero/event-bus';
import { UserLoggedInPayload, userLoggedInIdentifier } from '@libero/libero-events';
import { UserLoggedInHandler } from './handlers';
import { HealthCheck } from './endpoints';
import { AuditController } from './domain/audit';
import { KnexAuditRepository } from './repo/audit';
import Config from './config';
import { InfraLogger as Logger } from './logger';

import * as Knex from 'knex';

const auditController = new AuditController(new KnexAuditRepository(Knex(Config.knex)));

const setupEventBus = async (freshEventBus: EventBus) => {
  const eventBus = await freshEventBus.init(
    [userLoggedInIdentifier],
    'audit',
  );

  // setup subscribers
  eventBus.subscribe<UserLoggedInPayload>(
    userLoggedInIdentifier,
    UserLoggedInHandler(auditController),
  );

  Logger.info('Audit service started');

  return eventBus;
};

const setupWebServer = (server: Express) => {
  server.use('/', (req: Request, res: Response, next: () => void) => {
    logger.info(`${req.method} ${req.path}`, {});
    next();
  });

  server.get('/health', HealthCheck());

  return server;
};

const main = async () => {
  logger.info('serviceInit');

  const eventBus = await setupEventBus(new RabbitEventBus({url: `amqp://${ Config.eventBus.url }`}));
  // TODO: Eventually turn this into a factory method on the EventBus abstract class so that the instance of
  // the message bus can be created from config.
  // Create message bus instance

  // Create express instance
  const app = setupWebServer(express());
  return app;
};

main().then(app =>
  app.listen(Config.port, () => {
    logger.info(`Audit service listening on port ${Config.port}`);
  }),
);
