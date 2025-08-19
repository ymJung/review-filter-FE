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

// Typed collection references
export const usersCollection = collection(db, COLLECTIONS.USERS) as CollectionReference<User>;
export const coursesCollection = collection(db, COLLECTIONS.COURSES) as CollectionReference<Course>;
export const reviewsCollection = collection(db, COLLECTIONS.REVIEWS) as CollectionReference<Review>;
export const reviewImagesCollection = collection(db, COLLECTIONS.REVIEW_IMAGES) as CollectionReference<ReviewImage>;
export const commentsCollection = collection(db, COLLECTIONS.COMMENTS) as CollectionReference<Comment>;
export const roadmapsCollection = collection(db, COLLECTIONS.ROADMAPS) as CollectionReference<Roadmap>;
export const reviewSummariesCollection = collection(db, COLLECTIONS.REVIEW_SUMMARIES) as CollectionReference<ReviewSummary>;

// Helper functions for document references
export const getUserDoc = (userId: string): DocumentReference<User> => 
  doc(usersCollection, userId);

export const getCourseDoc = (courseId: string): DocumentReference<Course> => 
  doc(coursesCollection, courseId);

export const getReviewDoc = (reviewId: string): DocumentReference<Review> => 
  doc(reviewsCollection, reviewId);

export const getReviewImageDoc = (imageId: string): DocumentReference<ReviewImage> => 
  doc(reviewImagesCollection, imageId);

export const getCommentDoc = (commentId: string): DocumentReference<Comment> => 
  doc(commentsCollection, commentId);

export const getRoadmapDoc = (roadmapId: string): DocumentReference<Roadmap> => 
  doc(roadmapsCollection, roadmapId);

export const getReviewSummaryDoc = (summaryId: string): DocumentReference<ReviewSummary> => 
  doc(reviewSummariesCollection, summaryId);