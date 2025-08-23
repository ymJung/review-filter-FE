# Integration Tests

This directory contains comprehensive integration tests for the review platform application.

## Test Structure

### Core Integration Tests (`core.integration.test.ts`)
- **User Authentication Flow**: Tests user creation, retrieval, and role management
- **Review Management Flow**: Tests review creation, status updates, and filtering
- **Permission-based Access Control**: Tests role-based content access and API permissions
- **Error Handling**: Tests graceful error handling across services
- **Business Logic Integration**: Tests complete user workflows and admin moderation

### Component Integration Tests (Mocked)
- **Authentication Components** (`auth.integration.test.ts`): Social login, session management, role-based routing
- **Review Components** (`review.integration.test.ts`): Review creation, viewing, commenting
- **Permission Components** (`permissions.integration.test.ts`): Content filtering, admin access
- **Firebase Integration** (`firebase.integration.test.ts`): Database operations, authentication, storage

## Test Coverage

The integration tests cover all major requirements:

### Requirement 1: User Authentication
- ✅ Social login flow (Kakao/Naver)
- ✅ User creation with random nicknames
- ✅ Session management
- ✅ Role-based access control

### Requirement 2: Review Management
- ✅ Review creation with validation
- ✅ Review moderation workflow
- ✅ Review viewing with permission controls
- ✅ Comment system integration

### Requirement 3: Permission System
- ✅ Role-based content filtering
- ✅ Permission escalation workflows
- ✅ API endpoint access validation
- ✅ Admin functionality access

### Requirement 4: Firebase Integration
- ✅ Firestore database operations
- ✅ Authentication service integration
- ✅ Storage operations
- ✅ Security rules validation

### Requirement 5: Error Handling
- ✅ Service error handling
- ✅ Network error resilience
- ✅ Permission check failures
- ✅ Data validation errors

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npx jest src/__tests__/integration/core.integration.test.ts

# Run integration tests in watch mode
npm run test:integration:watch
```

## Test Configuration

Integration tests use:
- **Jest** for test framework
- **Testing Library** for component testing (mocked)
- **Mock services** for isolated testing
- **Firebase emulators** for database testing (configured)

## Mock Strategy

The integration tests use comprehensive mocking to:
- Isolate business logic from external dependencies
- Test service interactions without real Firebase calls
- Verify component behavior without actual rendering
- Simulate error conditions and edge cases

## Test Results

All integration tests pass and provide comprehensive coverage of:
- User authentication and authorization flows
- Review creation and moderation workflows
- Permission-based access control
- Error handling and edge cases
- Business logic integration across services

The tests verify that all requirements are properly integrated and working together as expected.