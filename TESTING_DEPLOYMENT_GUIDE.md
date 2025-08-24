# Testing and Deployment Guide

## 🚀 Quick Start

### Development Setup
```bash
# 1. Set up development environment
npm run setup:dev

# 2. Start Firebase emulators (in separate terminal)
npm run emulators:start

# 3. Start development server
npm run dev

# 4. Open application
open http://localhost:3000
```

### Admin Testing
```bash
# Access admin panel (mock admin user will be used in development)
open http://localhost:3000/admin
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run only unit tests (exclude integration)
npm run test:unit
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### Firebase Rules Testing
```bash
# Test Firestore security rules
npm run test:rules
```

## 🔥 Firebase Configuration

### Development Rules (Permissive)
```bash
# Deploy development rules for testing
npm run firebase:deploy:rules:dev
```

### Production Rules (Secure)
```bash
# Deploy production rules
npm run firebase:deploy:rules
```

### Emulators
```bash
# Start all emulators
npm run emulators

# Start emulators with script (includes health checks)
npm run emulators:start
```

## 🏥 Health Monitoring

### Health Check
```bash
# Check application health
npm run health:check

# Manual health check
curl http://localhost:3000/api/health
```

### Service Health Checks
```bash
# Check Firebase connection
curl http://localhost:3000/api/health/firebase

# Check OpenAI connection
curl http://localhost:3000/api/health/openai
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Firebase Permission Errors
**Symptoms**: "Missing or insufficient permissions" errors
**Solutions**:
```bash
# Deploy development rules
npm run firebase:deploy:rules:dev

# Or start emulators
npm run emulators:start

# Check Firebase configuration
firebase projects:list
```

#### 2. Admin Panel Not Accessible
**Symptoms**: "관리자" link not showing, access denied
**Solutions**:
- In development, mock admin user is automatically used
- Check browser console for authentication errors
- Verify Firebase emulators are running
- Check `.env.local` has `NEXT_PUBLIC_USE_MOCK_AUTH=true`

#### 3. Test Failures
**Symptoms**: Jest tests failing with Firebase errors
**Solutions**:
```bash
# Ensure test environment is set up
export NODE_ENV=test

# Run tests with emulators
npm run emulators:start
npm run test
```

#### 4. Build Failures
**Symptoms**: TypeScript or build errors
**Solutions**:
```bash
# Check TypeScript errors
npm run type-check

# Check linting
npm run lint

# Clean build
rm -rf .next
npm run build
```

### Environment Variables

#### Development (.env.local)
```env
NODE_ENV=development
NEXT_PUBLIC_USE_MOCK_AUTH=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

#### Testing (.env.test)
```env
NODE_ENV=test
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
# ... other emulator config
```

#### Production (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_AUTH=false
# ... production Firebase config
```

## 📊 Performance Monitoring

### Built-in Monitoring
The application includes comprehensive monitoring:

- **Performance Monitor**: Web Vitals, navigation timing, resource loading
- **Security Auditor**: XSS detection, CSRF checks, data exposure scanning
- **Health Monitor**: API, Firebase, OpenAI service monitoring

### Accessing Monitoring Data
```bash
# View performance data in browser console (development)
# Production data is sent to /api/monitoring/health

# Check monitoring dashboard
open http://localhost:3000/admin/monitoring
```

## 🚀 Deployment

### Staging Deployment
```bash
npm run deploy:staging
```

### Production Deployment
```bash
# Deploy to Vercel
npm run deploy:production

# Deploy Firebase functions and rules
npm run firebase:deploy
```

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Production build successful
- [ ] Firebase rules updated
- [ ] Environment variables configured
- [ ] Performance monitoring enabled
- [ ] Security audit passed

## 📈 Monitoring in Production

### Health Checks
- Application health: `https://your-domain.com/api/health`
- Firebase health: `https://your-domain.com/api/health/firebase`
- OpenAI health: `https://your-domain.com/api/health/openai`

### Performance Monitoring
- Web Vitals are automatically collected
- Performance data sent to `/api/monitoring/health`
- Security violations logged to `/api/security/csp-violation`

### Alerting
Set up monitoring alerts for:
- Health check failures
- Performance degradation
- Security violations
- Error rate increases

## 🔒 Security

### Security Audit
The application includes automated security scanning:
- XSS vulnerability detection
- CSRF protection verification
- Data exposure checks
- Transport security validation

### Security Best Practices
- Use HTTPS in production
- Implement proper CSP headers
- Validate all user inputs
- Use secure authentication tokens
- Regular security audits

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Testing](https://playwright.dev/)
- [Jest Testing Framework](https://jestjs.io/)
- [Web Vitals](https://web.dev/vitals/)

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review browser console errors
3. Check Firebase emulator logs
4. Run health checks
5. Review test output
6. Check environment configuration

For persistent issues, check the application logs and monitoring data.