import { 
  Timestamp, 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  SnapshotOptions 
} from 'firebase/firestore';
import { 
  User, 
  Course, 
  Review, 
  ReviewImage, 
  Comment, 
  Roadmap, 
  ReviewSummary 
} from '@/types';

// Helper function to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: Timestamp | Date): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};

// Helper function to convert Date to Firestore Timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// User converter
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user: User) => ({
    ...user,
    createdAt: dateToTimestamp(user.createdAt),
    updatedAt: dateToTimestamp(user.updatedAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as User;
  }
};

// Course converter
export const courseConverter: FirestoreDataConverter<Course> = {
  toFirestore: (course: Course) => ({
    ...course,
    createdAt: dateToTimestamp(course.createdAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Course => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
    } as Course;
  }
};

// Review converter
export const reviewConverter: FirestoreDataConverter<Review> = {
  toFirestore: (review: Review) => ({
    ...review,
    createdAt: dateToTimestamp(review.createdAt),
    updatedAt: dateToTimestamp(review.updatedAt),
    studyPeriod: review.studyPeriod ? dateToTimestamp(review.studyPeriod) : null,
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Review => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
      studyPeriod: data.studyPeriod ? timestampToDate(data.studyPeriod) : undefined,
    } as Review;
  }
};

// ReviewImage converter
export const reviewImageConverter: FirestoreDataConverter<ReviewImage> = {
  toFirestore: (reviewImage: ReviewImage) => ({
    ...reviewImage,
    createdAt: dateToTimestamp(reviewImage.createdAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ReviewImage => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
    } as ReviewImage;
  }
};

// Comment converter
export const commentConverter: FirestoreDataConverter<Comment> = {
  toFirestore: (comment: Comment) => ({
    ...comment,
    createdAt: dateToTimestamp(comment.createdAt),
    updatedAt: dateToTimestamp(comment.updatedAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Comment => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as Comment;
  }
};

// Roadmap converter
export const roadmapConverter: FirestoreDataConverter<Roadmap> = {
  toFirestore: (roadmap: Roadmap) => ({
    ...roadmap,
    createdAt: dateToTimestamp(roadmap.createdAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Roadmap => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
    } as Roadmap;
  }
};

// ReviewSummary converter
export const reviewSummaryConverter: FirestoreDataConverter<ReviewSummary> = {
  toFirestore: (summary: ReviewSummary) => ({
    ...summary,
    createdAt: dateToTimestamp(summary.createdAt),
    expiresAt: dateToTimestamp(summary.expiresAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ReviewSummary => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: timestampToDate(data.createdAt),
      expiresAt: timestampToDate(data.expiresAt),
    } as ReviewSummary;
  }
};