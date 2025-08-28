import { 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference 
} from 'firebase/firestore';
import { db } from './config';
import { 
  User, 
  Course, 
  Review, 
  ReviewImage, 
  Comment, 
  Roadmap, 
  ReviewSummary 
} from '@/types';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  REVIEWS: 'reviews',
  REVIEW_IMAGES: 'reviewImages',
  COMMENTS: 'comments',
  ROADMAPS: 'roadmaps',
  REVIEW_SUMMARIES: 'reviewSummaries',
} as const;

// Helper function to ensure db is initialized
const getDb = () => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

// Lazy-loaded collection references (functions that return collection references)
export const getUsersCollection = () => collection(getDb(), COLLECTIONS.USERS) as CollectionReference<User>;
export const getCoursesCollection = () => collection(getDb(), COLLECTIONS.COURSES) as CollectionReference<Course>;
export const getReviewsCollection = () => collection(getDb(), COLLECTIONS.REVIEWS) as CollectionReference<Review>;
export const getReviewImagesCollection = () => collection(getDb(), COLLECTIONS.REVIEW_IMAGES) as CollectionReference<ReviewImage>;
export const getCommentsCollection = () => collection(getDb(), COLLECTIONS.COMMENTS) as CollectionReference<Comment>;
export const getRoadmapsCollection = () => collection(getDb(), COLLECTIONS.ROADMAPS) as CollectionReference<Roadmap>;
export const getReviewSummariesCollection = () => collection(getDb(), COLLECTIONS.REVIEW_SUMMARIES) as CollectionReference<ReviewSummary>;

// Helper functions for document references
export const getUserDoc = (userId: string): DocumentReference<User> => 
  doc(getUsersCollection(), userId);

export const getCourseDoc = (courseId: string): DocumentReference<Course> => 
  doc(getCoursesCollection(), courseId);

export const getReviewDoc = (reviewId: string): DocumentReference<Review> => 
  doc(getReviewsCollection(), reviewId);

export const getReviewImageDoc = (imageId: string): DocumentReference<ReviewImage> => 
  doc(getReviewImagesCollection(), imageId);

export const getCommentDoc = (commentId: string): DocumentReference<Comment> => 
  doc(getCommentsCollection(), commentId);

export const getRoadmapDoc = (roadmapId: string): DocumentReference<Roadmap> => 
  doc(getRoadmapsCollection(), roadmapId);

export const getReviewSummaryDoc = (summaryId: string): DocumentReference<ReviewSummary> => 
  doc(getReviewSummariesCollection(), summaryId);