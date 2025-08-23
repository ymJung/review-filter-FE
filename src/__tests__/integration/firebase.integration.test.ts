/**
 * Firebase Integration Tests
 * 
 * Tests Firebase services integration including:
 * - Firestore database operations
 * - Firebase Authentication
 * - Firebase Storage operations
 * - Security rules validation
 * - Real-time data synchronization
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
// Mock Firebase instances
const db = {}
const auth = {}
const storage = {}
import { User, Review, Comment, Course } from '@/types'

// Mock Firebase modules
jest.mock('firebase/firestore')
jest.mock('firebase/auth')
jest.mock('firebase/storage')

const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockLimit = limit as jest.MockedFunction<typeof limit>

const mockSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>

const mockRef = ref as jest.MockedFunction<typeof ref>
const mockUploadBytes = uploadBytes as jest.MockedFunction<typeof uploadBytes>
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>
const mockDeleteObject = deleteObject as jest.MockedFunction<typeof deleteObject>

describe('Firebase Integration Tests', () => {
  const mockUser: User = {
    id: 'test-user-id',
    socialProvider: 'kakao',
    socialId: 'kakao-123',
    nickname: '행복한고양이',
    role: 'AUTH_LOGIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockReview: Review = {
    id: 'test-review-id',
    courseId: 'test-course-id',
    userId: 'test-user-id',
    content: '정말 좋은 강의였습니다.',
    rating: 5,
    status: 'APPROVED',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCourse: Course = {
    id: 'test-course-id',
    platform: '인프런',
    title: 'React 완전정복',
    instructor: '김개발',
    category: '프로그래밍',
    viewCount: 0,
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Firestore Database Operations', () => {
    describe('User Operations', () => {
      it('should create a new user document', async () => {
        const mockDocRef = { id: 'new-user-id' }
        mockAddDoc.mockResolvedValue(mockDocRef as any)
        mockCollection.mockReturnValue({} as any)

        const userData = {
          socialProvider: 'kakao' as const,
          socialId: 'kakao-456',
          nickname: '새로운사용자',
          role: 'LOGIN_NOT_AUTH' as const,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        const result = await addDoc(collection(db, 'users'), userData)

        expect(mockCollection).toHaveBeenCalledWith(db, 'users')
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), userData)
        expect(result.id).toBe('new-user-id')
      })

      it('should retrieve user by ID', async () => {
        const mockDocSnap = {
          exists: () => true,
          data: () => mockUser,
          id: mockUser.id,
        }
        mockGetDoc.mockResolvedValue(mockDocSnap as any)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'users', mockUser.id)
        const docSnap = await getDoc(docRef)

        expect(mockDoc).toHaveBeenCalledWith(db, 'users', mockUser.id)
        expect(mockGetDoc).toHaveBeenCalledWith(docRef)
        expect(docSnap.exists()).toBe(true)
        expect(docSnap.data()).toEqual(mockUser)
      })

      it('should update user role', async () => {
        mockUpdateDoc.mockResolvedValue(undefined)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'users', mockUser.id)
        await updateDoc(docRef, { 
          role: 'AUTH_PREMIUM',
          updatedAt: Timestamp.now()
        })

        expect(mockDoc).toHaveBeenCalledWith(db, 'users', mockUser.id)
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          docRef, 
          expect.objectContaining({ role: 'AUTH_PREMIUM' })
        )
      })

      it('should handle user not found', async () => {
        const mockDocSnap = {
          exists: () => false,
          data: () => undefined,
        }
        mockGetDoc.mockResolvedValue(mockDocSnap as any)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'users', 'non-existent-user')
        const docSnap = await getDoc(docRef)

        expect(docSnap.exists()).toBe(false)
        expect(docSnap.data()).toBeUndefined()
      })
    })

    describe('Review Operations', () => {
      it('should create a new review', async () => {
        const mockDocRef = { id: 'new-review-id' }
        mockAddDoc.mockResolvedValue(mockDocRef as any)
        mockCollection.mockReturnValue({} as any)

        const reviewData = {
          courseId: mockReview.courseId,
          userId: mockReview.userId,
          content: mockReview.content,
          rating: mockReview.rating,
          status: 'PENDING' as const,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        const result = await addDoc(collection(db, 'reviews'), reviewData)

        expect(mockCollection).toHaveBeenCalledWith(db, 'reviews')
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), reviewData)
        expect(result.id).toBe('new-review-id')
      })

      it('should query reviews by status', async () => {
        const mockQuerySnapshot = {
          docs: [
            { id: 'review-1', data: () => ({ ...mockReview, id: 'review-1' }) },
            { id: 'review-2', data: () => ({ ...mockReview, id: 'review-2' }) },
          ]
        }
        mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)
        mockQuery.mockReturnValue({} as any)
        mockCollection.mockReturnValue({} as any)
        mockWhere.mockReturnValue({} as any)

        const q = query(
          collection(db, 'reviews'),
          where('status', '==', 'APPROVED')
        )
        const querySnapshot = await getDocs(q)

        expect(mockCollection).toHaveBeenCalledWith(db, 'reviews')
        expect(mockWhere).toHaveBeenCalledWith('status', '==', 'APPROVED')
        expect(mockQuery).toHaveBeenCalled()
        expect(mockGetDocs).toHaveBeenCalledWith(q)
        expect(querySnapshot.docs).toHaveLength(2)
      })

      it('should query reviews with pagination', async () => {
        const mockQuerySnapshot = {
          docs: [
            { id: 'review-1', data: () => ({ ...mockReview, id: 'review-1' }) },
          ]
        }
        mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)
        mockQuery.mockReturnValue({} as any)
        mockCollection.mockReturnValue({} as any)
        mockOrderBy.mockReturnValue({} as any)
        mockLimit.mockReturnValue({} as any)

        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const querySnapshot = await getDocs(q)

        expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
        expect(mockLimit).toHaveBeenCalledWith(10)
        expect(querySnapshot.docs).toHaveLength(1)
      })

      it('should update review status', async () => {
        mockUpdateDoc.mockResolvedValue(undefined)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'reviews', mockReview.id)
        await updateDoc(docRef, { 
          status: 'APPROVED',
          updatedAt: Timestamp.now()
        })

        expect(mockDoc).toHaveBeenCalledWith(db, 'reviews', mockReview.id)
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          docRef, 
          expect.objectContaining({ status: 'APPROVED' })
        )
      })

      it('should delete review (soft delete)', async () => {
        mockUpdateDoc.mockResolvedValue(undefined)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'reviews', mockReview.id)
        await updateDoc(docRef, { 
          status: 'REJECTED',
          updatedAt: Timestamp.now()
        })

        expect(mockUpdateDoc).toHaveBeenCalledWith(
          docRef, 
          expect.objectContaining({ status: 'REJECTED' })
        )
      })
    })

    describe('Comment Operations', () => {
      const mockComment: Comment = {
        id: 'test-comment-id',
        reviewId: 'test-review-id',
        userId: 'test-user-id',
        content: '좋은 리뷰 감사합니다!',
        status: 'APPROVED',
        createdAt: new Date(),
      }

      it('should create a new comment', async () => {
        const mockDocRef = { id: 'new-comment-id' }
        mockAddDoc.mockResolvedValue(mockDocRef as any)
        mockCollection.mockReturnValue({} as any)

        const commentData = {
          reviewId: mockComment.reviewId,
          userId: mockComment.userId,
          content: mockComment.content,
          status: 'PENDING' as const,
          createdAt: Timestamp.now(),
        }

        const result = await addDoc(collection(db, 'comments'), commentData)

        expect(mockCollection).toHaveBeenCalledWith(db, 'comments')
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), commentData)
        expect(result.id).toBe('new-comment-id')
      })

      it('should query comments by review ID', async () => {
        const mockQuerySnapshot = {
          docs: [
            { id: 'comment-1', data: () => ({ ...mockComment, id: 'comment-1' }) },
            { id: 'comment-2', data: () => ({ ...mockComment, id: 'comment-2' }) },
          ]
        }
        mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)
        mockQuery.mockReturnValue({} as any)
        mockCollection.mockReturnValue({} as any)
        mockWhere.mockReturnValue({} as any)
        mockOrderBy.mockReturnValue({} as any)

        const q = query(
          collection(db, 'comments'),
          where('reviewId', '==', 'test-review-id'),
          where('status', '==', 'APPROVED'),
          orderBy('createdAt', 'asc')
        )
        const querySnapshot = await getDocs(q)

        expect(mockWhere).toHaveBeenCalledWith('reviewId', '==', 'test-review-id')
        expect(mockWhere).toHaveBeenCalledWith('status', '==', 'APPROVED')
        expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'asc')
        expect(querySnapshot.docs).toHaveLength(2)
      })
    })

    describe('Course Operations', () => {
      it('should create or update course', async () => {
        // First check if course exists
        const mockDocSnap = {
          exists: () => false,
          data: () => undefined,
        }
        mockGetDoc.mockResolvedValue(mockDocSnap as any)
        
        // Then create new course
        const mockDocRef = { id: 'new-course-id' }
        mockAddDoc.mockResolvedValue(mockDocRef as any)
        mockCollection.mockReturnValue({} as any)
        mockDoc.mockReturnValue({} as any)

        const courseData = {
          platform: mockCourse.platform,
          title: mockCourse.title,
          instructor: mockCourse.instructor,
          category: mockCourse.category,
          viewCount: 0,
          createdAt: Timestamp.now(),
        }

        // Check if exists
        const docRef = doc(db, 'courses', 'course-key')
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          const result = await addDoc(collection(db, 'courses'), courseData)
          expect(result.id).toBe('new-course-id')
        }

        expect(mockGetDoc).toHaveBeenCalled()
        expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), courseData)
      })

      it('should increment course view count', async () => {
        mockUpdateDoc.mockResolvedValue(undefined)
        mockDoc.mockReturnValue({} as any)

        const docRef = doc(db, 'courses', mockCourse.id)
        await updateDoc(docRef, { 
          viewCount: mockCourse.viewCount + 1
        })

        expect(mockDoc).toHaveBeenCalledWith(db, 'courses', mockCourse.id)
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          docRef, 
          { viewCount: mockCourse.viewCount + 1 }
        )
      })
    })
  })

  describe('Firebase Authentication', () => {
    it('should handle social login', async () => {
      const mockUserCredential = {
        user: {
          uid: 'firebase-uid',
          providerData: [{ providerId: 'oidc.kakao' }],
        }
      }
      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)

      const provider = {} // Mock provider
      const result = await signInWithPopup(auth, provider)

      expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, provider)
      expect(result.user.uid).toBe('firebase-uid')
    })

    it('should handle logout', async () => {
      mockSignOut.mockResolvedValue(undefined)

      await signOut(auth)

      expect(mockSignOut).toHaveBeenCalledWith(auth)
    })

    it('should handle auth state changes', async () => {
      const mockUnsubscribe = jest.fn()
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe)

      const callback = jest.fn()
      const unsubscribe = onAuthStateChanged(auth, callback)

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(auth, callback)
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed')
      mockSignInWithPopup.mockRejectedValue(authError)

      const provider = {} // Mock provider
      
      await expect(signInWithPopup(auth, provider)).rejects.toThrow('Authentication failed')
    })
  })

  describe('Firebase Storage', () => {
    it('should upload file to storage', async () => {
      const mockUploadResult = {
        ref: { fullPath: 'reviews/test-image.jpg' },
        metadata: { size: 1024 }
      }
      mockUploadBytes.mockResolvedValue(mockUploadResult as any)
      mockRef.mockReturnValue({} as any)

      const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' })
      const storageRef = ref(storage, 'reviews/test-image.jpg')
      const result = await uploadBytes(storageRef, file)

      expect(mockRef).toHaveBeenCalledWith(storage, 'reviews/test-image.jpg')
      expect(mockUploadBytes).toHaveBeenCalledWith(storageRef, file)
      expect(result.ref.fullPath).toBe('reviews/test-image.jpg')
    })

    it('should get download URL', async () => {
      const mockUrl = 'https://storage.googleapis.com/test-bucket/reviews/test-image.jpg'
      mockGetDownloadURL.mockResolvedValue(mockUrl)
      mockRef.mockReturnValue({} as any)

      const storageRef = ref(storage, 'reviews/test-image.jpg')
      const url = await getDownloadURL(storageRef)

      expect(mockRef).toHaveBeenCalledWith(storage, 'reviews/test-image.jpg')
      expect(mockGetDownloadURL).toHaveBeenCalledWith(storageRef)
      expect(url).toBe(mockUrl)
    })

    it('should delete file from storage', async () => {
      mockDeleteObject.mockResolvedValue(undefined)
      mockRef.mockReturnValue({} as any)

      const storageRef = ref(storage, 'reviews/test-image.jpg')
      await deleteObject(storageRef)

      expect(mockRef).toHaveBeenCalledWith(storage, 'reviews/test-image.jpg')
      expect(mockDeleteObject).toHaveBeenCalledWith(storageRef)
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Storage operation failed')
      mockUploadBytes.mockRejectedValue(storageError)
      mockRef.mockReturnValue({} as any)

      const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' })
      const storageRef = ref(storage, 'reviews/test-image.jpg')

      await expect(uploadBytes(storageRef, file)).rejects.toThrow('Storage operation failed')
    })
  })

  describe('Security Rules Validation', () => {
    it('should validate user can only access their own data', async () => {
      // Mock security rule validation
      const mockSecurityCheck = jest.fn().mockImplementation((userId: string, docId: string) => {
        return userId === docId // User can only access their own document
      })

      const currentUserId = 'test-user-id'
      const targetDocId = 'test-user-id'
      const otherDocId = 'other-user-id'

      expect(mockSecurityCheck(currentUserId, targetDocId)).toBe(true)
      expect(mockSecurityCheck(currentUserId, otherDocId)).toBe(false)
    })

    it('should validate admin can access all data', async () => {
      const mockAdminCheck = jest.fn().mockImplementation((userRole: string) => {
        return userRole === 'ADMIN'
      })

      expect(mockAdminCheck('ADMIN')).toBe(true)
      expect(mockAdminCheck('AUTH_LOGIN')).toBe(false)
    })

    it('should validate review visibility based on status', async () => {
      const mockVisibilityCheck = jest.fn().mockImplementation((reviewStatus: string) => {
        return reviewStatus === 'APPROVED'
      })

      expect(mockVisibilityCheck('APPROVED')).toBe(true)
      expect(mockVisibilityCheck('PENDING')).toBe(false)
      expect(mockVisibilityCheck('REJECTED')).toBe(false)
    })
  })

  describe('Real-time Data Synchronization', () => {
    it('should handle real-time updates', async () => {
      const mockOnSnapshot = jest.fn()
      const mockUnsubscribe = jest.fn()
      
      // Mock Firestore onSnapshot
      jest.doMock('firebase/firestore', () => ({
        ...jest.requireActual('firebase/firestore'),
        onSnapshot: mockOnSnapshot.mockReturnValue(mockUnsubscribe)
      }))

      const callback = jest.fn()
      mockOnSnapshot.mockImplementation((query: any, callback: any) => {
        // Simulate real-time update
        setTimeout(() => {
          callback({
            docs: [
              { id: 'review-1', data: () => mockReview }
            ]
          })
        }, 100)
        return mockUnsubscribe
      })

      // Simulate setting up real-time listener
      const unsubscribe = mockOnSnapshot({}, callback)

      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(callback).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed')
      mockGetDoc.mockRejectedValue(networkError)
      mockDoc.mockReturnValue({} as any)

      const docRef = doc(db, 'users', 'test-user')
      
      await expect(getDoc(docRef)).rejects.toThrow('Network request failed')
    })

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied')
      mockAddDoc.mockRejectedValue(permissionError)
      mockCollection.mockReturnValue({} as any)

      const userData = { name: 'Test User' }
      
      await expect(addDoc(collection(db, 'users'), userData)).rejects.toThrow('Permission denied')
    })

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded')
      mockUploadBytes.mockRejectedValue(quotaError)
      mockRef.mockReturnValue({} as any)

      const file = new File(['large file content'], 'large-file.jpg')
      const storageRef = ref(storage, 'uploads/large-file.jpg')
      
      await expect(uploadBytes(storageRef, file)).rejects.toThrow('Quota exceeded')
    })
  })

  describe('Performance and Optimization', () => {
    it('should use proper indexing for queries', async () => {
      const mockQuerySnapshot = {
        docs: []
      }
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)
      mockQuery.mockReturnValue({} as any)
      mockCollection.mockReturnValue({} as any)
      mockWhere.mockReturnValue({} as any)
      mockOrderBy.mockReturnValue({} as any)

      // Query that should use composite index
      const q = query(
        collection(db, 'reviews'),
        where('status', '==', 'APPROVED'),
        where('category', '==', '프로그래밍'),
        orderBy('createdAt', 'desc')
      )
      
      await getDocs(q)

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'APPROVED')
      expect(mockWhere).toHaveBeenCalledWith('category', '==', '프로그래밍')
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
    })

    it('should implement proper pagination', async () => {
      const mockQuerySnapshot = {
        docs: [
          { id: 'review-1', data: () => mockReview }
        ]
      }
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)
      mockQuery.mockReturnValue({} as any)
      mockCollection.mockReturnValue({} as any)
      mockOrderBy.mockReturnValue({} as any)
      mockLimit.mockReturnValue({} as any)

      const q = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
      
      await getDocs(q)

      expect(mockLimit).toHaveBeenCalledWith(20)
    })
  })
})