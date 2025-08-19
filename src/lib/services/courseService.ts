import { Course, CategoryStats, ApiResponse, PaginatedResponse } from '@/types';

// Get courses with pagination and filtering
export const getCourses = async (params: {
  page?: number;
  limit?: number;
  platform?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResponse<Course> | null> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.platform) searchParams.set('platform', params.platform);
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`/api/courses?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    const result: ApiResponse<PaginatedResponse<Course>> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return null;
  }
};

// Get specific course by ID
export const getCourse = async (id: string): Promise<Course | null> => {
  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch course');
    }

    const result: ApiResponse<Course> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

// Create or get existing course
export const createOrGetCourse = async (courseData: {
  title: string;
  platform: string;
  instructor?: string;
  category?: string;
}): Promise<Course | null> => {
  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create course');
    }

    const result: ApiResponse<Course> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Update course (admin only)
export const updateCourse = async (
  id: string, 
  updates: Partial<Course>
): Promise<Course | null> => {
  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update course');
    }

    const result: ApiResponse<Course> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

// Get category statistics
export const getCategoryStats = async (params: {
  limit?: number;
  source?: 'reviews' | 'courses';
}): Promise<CategoryStats[] | null> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.source) searchParams.set('source', params.source);

    const response = await fetch(`/api/categories/stats?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch category stats');
    }

    const result: ApiResponse<CategoryStats[]> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return null;
  }
};

// Search courses by title
export const searchCourses = async (
  query: string,
  filters?: {
    platform?: string;
    category?: string;
    limit?: number;
  }
): Promise<Course[]> => {
  try {
    const params = {
      search: query,
      limit: filters?.limit || 20,
      ...(filters?.platform && { platform: filters.platform }),
      ...(filters?.category && { category: filters.category }),
    };

    const result = await getCourses(params);
    return result?.data || [];
  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
};

// Get popular courses (by view count)
export const getPopularCourses = async (limit: number = 10): Promise<Course[]> => {
  try {
    const result = await getCourses({
      limit,
      sortBy: 'viewCount',
      sortOrder: 'desc',
    });

    return result?.data || [];
  } catch (error) {
    console.error('Error fetching popular courses:', error);
    return [];
  }
};

// Get recent courses
export const getRecentCourses = async (limit: number = 10): Promise<Course[]> => {
  try {
    const result = await getCourses({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result?.data || [];
  } catch (error) {
    console.error('Error fetching recent courses:', error);
    return [];
  }
};

// Validate course data
export const validateCourseData = (data: {
  title?: string;
  platform?: string;
  instructor?: string;
  category?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('강의명을 입력해주세요.');
  } else if (data.title.trim().length < 2) {
    errors.push('강의명은 2자 이상이어야 합니다.');
  } else if (data.title.trim().length > 200) {
    errors.push('강의명은 200자 이하여야 합니다.');
  }

  if (!data.platform?.trim()) {
    errors.push('플랫폼을 선택해주세요.');
  }

  if (data.instructor && data.instructor.trim().length > 100) {
    errors.push('강사명은 100자 이하여야 합니다.');
  }

  if (data.category && data.category.trim().length > 50) {
    errors.push('카테고리는 50자 이하여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};