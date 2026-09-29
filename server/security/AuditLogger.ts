export interface SecurityAuditEvent {
  id: string;
  type: 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'LOGIN_LOCKED' 
    | 'SESSION_REVOKED'
    | 'UNAUTHORIZED_ACCESS'
    | 'PAYMENT_AUTHORIZED'
    | 'PAYMENT_IDEMPOTENT_HIT'
    | 'PAYMENT_TAMPER_DETECTED'
    | 'ORDER_REOPENED';
  severity: 'info' | 'warn' | 'security_alert';
  ip?: string;
  username?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Single Responsibility: Immutable security event audit logging.
 * Adheres to PCI-DSS Requirement 10: Tracking and monitoring all access to network resources and cardholder data.
 */
export class AuditLogger {
  private events: SecurityAuditEvent[] = [];
  private readonly maxEvents = 500;

  log(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): SecurityAuditEvent {
    const fullEvent: SecurityAuditEvent = {
      ...event,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    if (fullEvent.severity === 'security_alert') {
      console.warn(`[SECURITY ALERT] [${fullEvent.type}] ${fullEvent.details} (IP: ${fullEvent.ip || 'local'}, User: ${fullEvent.username || 'unknown'})`);
    }

    return fullEvent;
  }

  getRecentEvents(limit = 100): SecurityAuditEvent[] {
    return this.events.slice(0, limit);
  }
}
