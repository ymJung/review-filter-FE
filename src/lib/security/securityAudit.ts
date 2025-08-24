// Security audit utilities for vulnerability detection

export interface SecurityIssue {
  type: 'XSS' | 'CSRF' | 'INJECTION' | 'EXPOSURE' | 'WEAK_AUTH' | 'INSECURE_TRANSPORT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location?: string;
  recommendation: string;
  timestamp: number;
}

export interface SecurityAuditResult {
  issues: SecurityIssue[];
  score: number; // 0-100, higher is better
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];

  auditApplication(): SecurityAuditResult {
    this.issues = [];

    // Run all security checks
    this.checkXSSVulnerabilities();
    this.checkCSRFProtection();
    this.checkAuthenticationSecurity();
    this.checkDataExposure();
    this.checkTransportSecurity();
    this.checkInputValidation();

    return this.generateReport();
  }

  private checkXSSVulnerabilities() {
    // Check for potential XSS vulnerabilities
    const dangerousElements = document.querySelectorAll('[onclick], [onload], [onerror]');
    if (dangerousElements.length > 0) {
      this.addIssue({
        type: 'XSS',
        severity: 'HIGH',
        description: `Found ${dangerousElements.length} elements with inline event handlers`,
        recommendation: 'Use addEventListener instead of inline event handlers',
      });
    }

    // Check for innerHTML usage (potential XSS)
    const scripts = Array.from(document.querySelectorAll('script'));
    scripts.forEach((script, index) => {
      if (script.innerHTML.includes('innerHTML') || script.innerHTML.includes('outerHTML')) {
        this.addIssue({
          type: 'XSS',
          severity: 'MEDIUM',
          description: 'Potential XSS vulnerability through innerHTML usage',
          location: `Script ${index + 1}`,
          recommendation: 'Use textContent or proper sanitization when setting HTML content',
        });
      }
    });
  }

  private checkCSRFProtection() {
    // Check for CSRF tokens in forms
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const hasCSRFToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
      if (!hasCSRFToken && form.method.toLowerCase() === 'post') {
        this.addIssue({
          type: 'CSRF',
          severity: 'HIGH',
          description: 'Form without CSRF protection detected',
          location: `Form ${index + 1}`,
          recommendation: 'Add CSRF token to all POST forms',
        });
      }
    });
  }

  private checkAuthenticationSecurity() {
    // Check for weak authentication patterns
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input, index) => {
      const form = input.closest('form');
      if (form && !form.hasAttribute('autocomplete')) {
        this.addIssue({
          type: 'WEAK_AUTH',
          severity: 'MEDIUM',
          description: 'Password form without autocomplete attribute',
          location: `Password input ${index + 1}`,
          recommendation: 'Add autocomplete="current-password" or "new-password" to password inputs',
        });
      }
    });

    // Check for session storage of sensitive data
    if (typeof window !== 'undefined') {
      const sensitiveKeys = ['password', 'token', 'secret', 'key'];
      sensitiveKeys.forEach(key => {
        if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
          this.addIssue({
            type: 'EXPOSURE',
            severity: 'CRITICAL',
            description: `Sensitive data "${key}" found in browser storage`,
            recommendation: 'Store sensitive data securely on the server, use httpOnly cookies for tokens',
          });
        }
      });
    }
  }

  private checkDataExposure() {
    // Check for exposed API keys or secrets in client-side code
    const scripts = Array.from(document.querySelectorAll('script'));
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /private[_-]?key/i,
    ];

    scripts.forEach((script, index) => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(script.innerHTML)) {
          this.addIssue({
            type: 'EXPOSURE',
            severity: 'CRITICAL',
            description: 'Potential sensitive data exposure in client-side code',
            location: `Script ${index + 1}`,
            recommendation: 'Move sensitive data to server-side environment variables',
          });
        }
      });
    });
  }

  private checkTransportSecurity() {
    // Check for mixed content (HTTP resources on HTTPS page)
    if (location.protocol === 'https:') {
      const httpResources = Array.from(document.querySelectorAll('[src^="http:"], [href^="http:"]'));
      if (httpResources.length > 0) {
        this.addIssue({
          type: 'INSECURE_TRANSPORT',
          severity: 'HIGH',
          description: `Found ${httpResources.length} HTTP resources on HTTPS page`,
          recommendation: 'Use HTTPS for all resources to prevent mixed content warnings',
        });
      }
    }

    // Check for missing security headers (client-side detection is limited)
    if (typeof window !== 'undefined') {
      // Check if CSP is present
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        this.addIssue({
          type: 'INSECURE_TRANSPORT',
          severity: 'MEDIUM',
          description: 'Content Security Policy not detected',
          recommendation: 'Implement CSP headers to prevent XSS attacks',
        });
      }
    }
  }

  private checkInputValidation() {
    // Check for inputs without proper validation attributes
    const inputs = document.querySelectorAll('input[type="email"], input[type="url"], input[type="tel"]');
    inputs.forEach((input, index) => {
      if (!input.hasAttribute('pattern') && !input.hasAttribute('required')) {
        this.addIssue({
          type: 'INJECTION',
          severity: 'LOW',
          description: 'Input field without validation attributes',
          location: `Input ${index + 1} (${input.getAttribute('type')})`,
          recommendation: 'Add pattern, required, or other validation attributes to inputs',
        });
      }
    });
  }

  private addIssue(issue: Omit<SecurityIssue, 'timestamp'>) {
    this.issues.push({
      ...issue,
      timestamp: Date.now(),
    });
  }

  private generateReport(): SecurityAuditResult {
    const summary = {
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      high: this.issues.filter(i => i.severity === 'HIGH').length,
      medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
      low: this.issues.filter(i => i.severity === 'LOW').length,
    };

    // Calculate security score (0-100)
    const totalIssues = this.issues.length;
    const weightedScore = (
      summary.critical * 25 +
      summary.high * 10 +
      summary.medium * 5 +
      summary.low * 1
    );

    const score = Math.max(0, 100 - weightedScore);

    return {
      issues: this.issues,
      score,
      summary,
    };
  }
}

// Singleton instance
export const securityAuditor = new SecurityAuditor();

// Automated security monitoring
export const startSecurityMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Run initial audit
  const initialResult = securityAuditor.auditApplication();
  console.log('Security Audit Result:', initialResult);

  // Monitor for new security issues periodically
  setInterval(() => {
    const result = securityAuditor.auditApplication();
    
    // Only log if new critical or high severity issues are found
    const criticalOrHigh = result.issues.filter(i => 
      i.severity === 'CRITICAL' || i.severity === 'HIGH'
    );
    
    if (criticalOrHigh.length > 0) {
      console.warn('New security issues detected:', criticalOrHigh);
    }
  }, 60000); // Check every minute
};

// Content Security Policy violation handler
export const setupCSPViolationHandler = () => {
  if (typeof window === 'undefined') return;

  document.addEventListener('securitypolicyviolation', (event) => {
    const issue: SecurityIssue = {
      type: 'XSS',
      severity: 'HIGH',
      description: `CSP violation: ${event.violatedDirective}`,
      location: event.sourceFile,
      recommendation: 'Review and update Content Security Policy',
      timestamp: Date.now(),
    };

    console.error('CSP Violation:', issue);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/security/csp-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue),
      }).catch(console.error);
    }
  });
};

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && !email.includes('..');
};

export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};