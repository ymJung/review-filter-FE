/**
 * Mock services for integration tests
 */

// Mock userService
export const userService = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  updateUserRole: jest.fn(),
  generateRandomNickname: jest.fn(),
  getAllUsers: jest.fn(),
}

// Mock reviewService
export const reviewService = {
  createReview: jest.fn(),
  getReviewById: jest.fn(),
  updateReviewStatus: jest.fn(),
  getPendingReviews: jest.fn(),
  getReviewsByCategory: jest.fn(),
  searchReviews: jest.fn(),
}

// Mock commentService
export const commentService = {
  createComment: jest.fn(),
  getCommentsByReviewId: jest.fn(),
  updateCommentStatus: jest.fn(),
}

// Mock courseService
export const courseService = {
  createCourse: jest.fn(),
  getCourseById: jest.fn(),
}

// Mock accessControlService
export const accessControlService = {
  getVisibleReviews: jest.fn(),
  checkPermissionUpgrade: jest.fn(),
  filterContentByRole: jest.fn(),
  validateAPIAccess: jest.fn(),
}