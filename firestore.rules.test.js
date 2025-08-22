const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'review-filter-test',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helper function to get authenticated context
function getAuthedDb(uid, role = 'LOGIN_NOT_AUTH') {
  return testEnv.authenticatedContext(uid, {
    role: role
  }).firestore();
}

// Helper function to get unauthenticated context
function getUnauthedDb() {
  return testEnv.unauthenticatedContext().firestore();
}

describe('Users Collection Security Rules', () => {
  test('users can read their own data', async () => {
    const db = getAuthedDb('user1');
    
    // First create the user document
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'users', 'user1'), {
        socialProvider: 'kakao',
        socialId: 'kakao123',
        nickname: 'testuser',
        role: 'LOGIN_NOT_AUTH',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(db, 'users', 'user1')));
  });

  test('users cannot read other users data', async () => {
    const db = getAuthedDb('user1');
    
    // Create another user's document
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'users', 'user2'), {
        socialProvider: 'kakao',
        socialId: 'kakao456',
        nickname: 'otheruser',
        role: 'LOGIN_NOT_AUTH',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertFails(getDoc(doc(db, 'users', 'user2')));
  });

  test('admins can read all user data', async () => {
    const adminDb = getAuthedDb('admin1', 'ADMIN');
    
    // Create admin user document
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'admin1'), {
        socialProvider: 'kakao',
        socialId: 'admin123',
        nickname: 'admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await setDoc(doc(db, 'users', 'user1'), {
        socialProvider: 'kakao',
        socialId: 'user123',
        nickname: 'testuser',
        role: 'LOGIN_NOT_AUTH',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(adminDb, 'users', 'user1')));
  });

  test('users can create their own profile', async () => {
    const db = getAuthedDb('user1');
    
    await assertSucceeds(setDoc(doc(db, 'users', 'user1'), {
      socialProvider: 'kakao',
      socialId: 'kakao123',
      nickname: 'testuser',
      role: 'LOGIN_NOT_AUTH',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('users cannot create profile with invalid role', async () => {
    const db = getAuthedDb('user1');
    
    await assertFails(setDoc(doc(db, 'users', 'user1'), {
      socialProvider: 'kakao',
      socialId: 'kakao123',
      nickname: 'testuser',
      role: 'ADMIN', // Invalid role for regular user
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });
});

describe('Reviews Collection Security Rules', () => {
  beforeEach(async () => {
    // Create test users
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'user1'), {
        socialProvider: 'kakao',
        socialId: 'user123',
        nickname: 'testuser',
        role: 'AUTH_LOGIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await setDoc(doc(db, 'users', 'admin1'), {
        socialProvider: 'kakao',
        socialId: 'admin123',
        nickname: 'admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  test('authenticated users can create reviews', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertSucceeds(addDoc(collection(db, 'reviews'), {
      courseId: 'course1',
      userId: 'user1',
      content: 'Great course!',
      rating: 5,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('users cannot create reviews for other users', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertFails(addDoc(collection(db, 'reviews'), {
      courseId: 'course1',
      userId: 'user2', // Different user
      content: 'Great course!',
      rating: 5,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  test('unauthenticated users can read approved reviews', async () => {
    const unauthedDb = getUnauthedDb();
    
    // Create an approved review
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(unauthedDb, 'reviews', 'review1')));
  });

  test('unauthenticated users cannot read pending reviews', async () => {
    const unauthedDb = getUnauthedDb();
    
    // Create a pending review
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertFails(getDoc(doc(unauthedDb, 'reviews', 'review1')));
  });

  test('review owners can read their own pending reviews', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    // Create a pending review
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(db, 'reviews', 'review1')));
  });

  test('admins can read all reviews', async () => {
    const adminDb = getAuthedDb('admin1', 'ADMIN');
    
    // Create a pending review
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(adminDb, 'reviews', 'review1')));
  });
});

describe('Roadmaps Collection Security Rules', () => {
  beforeEach(async () => {
    // Create test users
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'user1'), {
        socialProvider: 'kakao',
        socialId: 'user123',
        nickname: 'testuser',
        role: 'AUTH_LOGIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  test('authenticated users can create roadmaps', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertSucceeds(addDoc(collection(db, 'roadmaps'), {
      title: 'Web Development Path',
      description: 'Complete web development learning path',
      courseTitle: 'HTML Basics',
      coursePlatform: 'Udemy',
      userId: 'user1',
      status: 'PENDING',
      viewCount: 0,
      createdAt: new Date()
    }));
  });

  test('unauthenticated users can read approved roadmaps', async () => {
    const unauthedDb = getUnauthedDb();
    
    // Create an approved roadmap
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'roadmaps', 'roadmap1'), {
        title: 'Web Development Path',
        description: 'Complete web development learning path',
        courseTitle: 'HTML Basics',
        coursePlatform: 'Udemy',
        userId: 'user1',
        status: 'APPROVED',
        viewCount: 0,
        createdAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(unauthedDb, 'roadmaps', 'roadmap1')));
  });

  test('view count can be incremented for approved roadmaps', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    // Create an approved roadmap
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'roadmaps', 'roadmap1'), {
        title: 'Web Development Path',
        description: 'Complete web development learning path',
        courseTitle: 'HTML Basics',
        coursePlatform: 'Udemy',
        userId: 'user1',
        status: 'APPROVED',
        viewCount: 5,
        createdAt: new Date()
      });
    });
    
    await assertSucceeds(updateDoc(doc(db, 'roadmaps', 'roadmap1'), {
      viewCount: 6
    }));
  });
});

describe('Comments Collection Security Rules', () => {
  beforeEach(async () => {
    // Create test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Create user
      await setDoc(doc(db, 'users', 'user1'), {
        socialProvider: 'kakao',
        socialId: 'user123',
        nickname: 'testuser',
        role: 'AUTH_LOGIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create review
      await setDoc(doc(db, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  test('authenticated users can create comments on existing reviews', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertSucceeds(addDoc(collection(db, 'comments'), {
      reviewId: 'review1',
      userId: 'user1',
      content: 'I agree with this review!',
      status: 'PENDING',
      createdAt: new Date()
    }));
  });

  test('users cannot create comments on non-existent reviews', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertFails(addDoc(collection(db, 'comments'), {
      reviewId: 'nonexistent-review',
      userId: 'user1',
      content: 'This should fail',
      status: 'PENDING',
      createdAt: new Date()
    }));
  });

  test('unauthenticated users can read approved comments', async () => {
    const unauthedDb = getUnauthedDb();
    
    // Create an approved comment
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'comments', 'comment1'), {
        reviewId: 'review1',
        userId: 'user1',
        content: 'Great review!',
        status: 'APPROVED',
        createdAt: new Date()
      });
    });
    
    await assertSucceeds(getDoc(doc(unauthedDb, 'comments', 'comment1')));
  });
});

describe('Admin Operations', () => {
  beforeEach(async () => {
    // Create admin user
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'admin1'), {
        socialProvider: 'kakao',
        socialId: 'admin123',
        nickname: 'admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  test('admins can access admin collection', async () => {
    const adminDb = getAuthedDb('admin1', 'ADMIN');
    
    await assertSucceeds(setDoc(doc(adminDb, 'admin', 'config'), {
      setting: 'value'
    }));
    
    await assertSucceeds(getDoc(doc(adminDb, 'admin', 'config')));
  });

  test('regular users cannot access admin collection', async () => {
    const db = getAuthedDb('user1', 'AUTH_LOGIN');
    
    await assertFails(getDoc(doc(db, 'admin', 'config')));
    await assertFails(setDoc(doc(db, 'admin', 'config'), {
      setting: 'value'
    }));
  });

  test('admins can update any review status', async () => {
    const adminDb = getAuthedDb('admin1', 'ADMIN');
    
    // Create a pending review
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'reviews', 'review1'), {
        courseId: 'course1',
        userId: 'user1',
        content: 'Great course!',
        rating: 5,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await assertSucceeds(updateDoc(doc(adminDb, 'reviews', 'review1'), {
      status: 'APPROVED',
      moderatedBy: 'admin1',
      moderatedAt: new Date()
    }));
  });
});