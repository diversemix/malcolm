import { Event } from '@libero/event-bus';
import { ServiceStartedHandler, UserLoggedInHandler } from './index';
import { AuditController } from '../domain/audit';
import { ServiceStartedPayload, UserLoggedInPayload, LiberoEventType } from '@libero/libero-events';

jest.mock('../logger');

beforeEach(jest.resetAllMocks);

const recordAudit = jest.fn();
const controller = {
    auditRepo: null,
    recordAudit,
} as unknown as AuditController;

beforeEach(jest.resetAllMocks);

describe('ServiceStartedHandler', () => {
    it('records audit item', () => {
        const handler = ServiceStartedHandler(controller);
        const event: Event<ServiceStartedPayload> = {
            id: 'event-started-id',
            created: new Date(),
            payload: {
              type: 'support/audit',
              name: 'servicename',
            },
            eventType: LiberoEventType.serviceStartedIdentifier,
        };

        handler(event);

        const auditItem = recordAudit.mock.calls[0][0];
        expect(recordAudit).toHaveBeenCalledTimes(1);
        expect(auditItem.entity).toBe('NONE');
        expect(auditItem.verb).toBe('STARTED');
        expect(auditItem.subject).toBe('servicename-support/audit');
    });
});

describe('UserLoggedInHandler', () => {
    it('records audit item', () => {
        const handler = UserLoggedInHandler(controller);
        const event: Event<UserLoggedInPayload> = {
            id: 'event-started-id',
            created: new Date(),
            payload: {
              name: 'name',
              userId: 'userId',
              email: 'email',
              timestamp: new Date(),
            },
            eventType: LiberoEventType.userLoggedInIdentifier,
        };

        handler(event);

        const auditItem = recordAudit.mock.calls[0][0];

        expect(recordAudit).toHaveBeenCalledTimes(1);
        expect(auditItem.entity).toBe('userId');
        expect(auditItem.verb).toBe('LOGGED_IN');
        expect(auditItem.subject).toBe('name-email');
    });
});
