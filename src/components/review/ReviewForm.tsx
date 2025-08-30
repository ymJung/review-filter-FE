'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { CourseSearch } from '@/components/course/CourseSearch';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { createReview, uploadCertificationImage } from '@/lib/services/reviewService';
import { createOrGetCourse } from '@/lib/services/courseService';
import { validateReviewForm } from '@/lib/services/reviewService';
import { Course, ReviewFormData } from '@/types';
import { PLATFORMS, CATEGORIES } from '@/lib/constants';
import { compressImage } from '@/lib/utils';

interface ReviewFormProps {
  initialCourse?: Course;
  onSuccess?: (reviewId: string) => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialCourse,
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    courseTitle: initialCourse?.title || '',
    coursePlatform: initialCourse?.platform || '',
    courseInstructor: initialCourse?.instructor || '',
    courseCategory: initialCourse?.category || '',
    content: '',
    rating: 5,
    studyPeriod: '',
    positivePoints: '',
    negativePoints: '',
    changes: '',
    recommendedFor: '',
    certificationImage: null,
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof ReviewFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setFormData(prev => ({
      ...prev,
      courseTitle: course.title,
      coursePlatform: course.platform,
      courseInstructor: course.instructor || '',
      courseCategory: course.category || '',
    }));
  };

  const handleCourseCreate = async (courseData: {
    title: string;
    platform: string;
    instructor?: string;
    category?: string;
  }) => {
    try {
      const course = await createOrGetCourse(courseData);
      if (course) {
        handleCourseSelect(course);
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      setErrors([`강의 정보 처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`]);
    }
  };

  const handleCourseTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, courseTitle: title }));
    // Reset selected course if title changes
    if (selectedCourse) {
      setSelectedCourse(null);
    }
    setErrors([]);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setErrors(['JPEG, JPG, PNG, GIF, HEIC 형식의 이미지만 업로드 가능합니다.']);
      return;
    }

    if (file.size > maxSize) {
      setErrors(['파일 크기는 5MB 이하여야 합니다.']);
      return;
    }

    try {
      // Compress image if needed
      const compressedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
      
      setFormData(prev => ({ ...prev, certificationImage: compressedFile }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      setErrors([]);
    } catch (error) {
      console.error('Error processing image:', error);
      setErrors(['이미지 처리 중 오류가 발생했습니다.']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser) {
      setErrors(['로그인이 필요합니다.']);
      return;
    }

    // If course title is entered but no course is selected, create the course
    let courseData = selectedCourse;
    if (formData.courseTitle && !selectedCourse) {
      try {
        courseData = await createOrGetCourse({
          title: formData.courseTitle,
          platform: formData.coursePlatform,
          instructor: formData.courseInstructor,
          category: formData.courseCategory,
        });
      } catch (error: any) {
        console.error('Error creating course:', error);
        setErrors([`강의 정보 처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`]);
        return;
      }
    }

    // Validate form
    const validation = validateReviewForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if course data is available
    if (!courseData) {
      setErrors(['강의 정보를 입력해주세요.']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Get auth token
      const token = await firebaseUser.getIdToken();

      // Create review with course data
      const reviewData = {
        ...formData,
        courseTitle: courseData.title,
        coursePlatform: courseData.platform,
        courseInstructor: courseData.instructor || '',
        courseCategory: courseData.category || '',
      };

      const review = await createReview(reviewData, token);
      
      if (!review) {
        throw new Error('리뷰 생성에 실패했습니다.');
      }

      // Upload certification image if provided
      if (formData.certificationImage) {
        await uploadCertificationImage(formData.certificationImage, review.id, token);
      }

      setSuccess('리뷰가 성공적으로 작성되었습니다. 검수 후 공개됩니다.');
      
      // Reset form
      setFormData({
        courseTitle: '',
        coursePlatform: '',
        courseInstructor: '',
        courseCategory: '',
        content: '',
        rating: 5,
        studyPeriod: '',
        positivePoints: '',
        negativePoints: '',
        changes: '',
        recommendedFor: '',
        certificationImage: null,
      });
      setSelectedCourse(null);
      setImagePreview(null);

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(review.id);
      } else {
        setTimeout(() => {
          router.push('/mypage');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error creating review:', error);
      // Check if it's a Firebase permission error
      if (error.message && error.message.includes('PERMISSION_DENIED')) {
        setErrors(['권한이 없습니다. 관리자에게 문의해주세요.']);
      } else {
        setErrors([error.message || '리뷰 작성 중 오류가 발생했습니다.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>리뷰 작성</CardTitle>
        <p className="text-gray-600">
          수강한 강의에 대한 솔직한 후기를 작성해주세요. 
          결제 인증 이미지는 검수 완료 후 자동으로 삭제됩니다.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <Alert variant="success" title="작성 완료">
              {success}
            </Alert>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="danger" title="오류가 발생했습니다">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Course Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">강의 정보</h3>
            
            <Input
              label="강의명 *"
              value={formData.courseTitle}
              onChange={handleCourseTitleChange}
              placeholder="강의명을 입력하세요"
              required
            />
            <CourseSearch
              onCourseSelect={handleCourseSelect}
              onCourseCreate={handleCourseCreate}
              placeholder="기존 강의 검색..."
              showCreateOption={true}
              className="mt-2"
            />

            {selectedCourse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedCourse.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{selectedCourse.platform}</Badge>
                      {selectedCourse.category && (
                        <Badge variant="secondary">{selectedCourse.category}</Badge>
                      )}
                      {selectedCourse.instructor && (
                        <span className="text-sm text-gray-600">{selectedCourse.instructor}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCourse(null);
                      setFormData(prev => ({
                        ...prev,
                        courseTitle: '',
                        coursePlatform: '',
                        courseInstructor: '',
                        courseCategory: '',
                      }));
                    }}
                  >
                    변경
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  플랫폼 *
                </label>
                <select
                  value={formData.coursePlatform}
                  onChange={(e) => handleInputChange('coursePlatform', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">플랫폼 선택</option>
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={formData.courseCategory}
                  onChange={(e) => handleInputChange('courseCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="강사명"
              value={formData.courseInstructor}
              onChange={(e) => handleInputChange('courseInstructor', e.target.value)}
              placeholder="강사명을 입력하세요"
            />
          </div>

          {/* Review Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">리뷰 내용</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평점 *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange('rating', star)}
                      className={`text-2xl ${
                        star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ⭐
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating}점
                  </span>
                </div>
              </div>

              <Input
                label="수강 시기"
                type="date"
                value={formData.studyPeriod}
                onChange={(e) => handleInputChange('studyPeriod', e.target.value)}
              />
            </div>

            <Textarea
              label="전체적인 후기 *"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="강의에 대한 전반적인 후기를 작성해주세요 (최소 10자)"
              rows={4}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="좋았던 점"
                value={formData.positivePoints}
                onChange={(e) => handleInputChange('positivePoints', e.target.value)}
                placeholder="강의의 장점을 구체적으로 작성해주세요"
                rows={3}
              />

              <Textarea
                label="아쉬웠던 점"
                value={formData.negativePoints}
                onChange={(e) => handleInputChange('negativePoints', e.target.value)}
                placeholder="개선되었으면 하는 점을 작성해주세요"
                rows={3}
              />
            </div>

            <Textarea
              label="수강 후 변화/적용 사례"
              value={formData.changes}
              onChange={(e) => handleInputChange('changes', e.target.value)}
              placeholder="강의를 통해 얻은 것이나 실제 적용한 사례를 공유해주세요"
              rows={3}
            />

            <Textarea
              label="추천 대상"
              value={formData.recommendedFor}
              onChange={(e) => handleInputChange('recommendedFor', e.target.value)}
              placeholder="어떤 분들에게 이 강의를 추천하고 싶은지 작성해주세요"
              rows={2}
            />
          </div>

          {/* Certification Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">결제 인증 이미지 *</h3>
            <p className="text-sm text-gray-600">
              강의 결제 내역이나 수료증 등을 업로드해주세요. 
              검수 완료 후 자동으로 삭제됩니다.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/heic"
                onChange={handleImageChange}
                className="hidden"
                id="certification-image"
                required
              />
              <label
                htmlFor="certification-image"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="인증 이미지 미리보기"
                      className="max-w-xs max-h-48 object-contain rounded"
                    />
                    <p className="text-sm text-gray-600">클릭하여 다른 이미지 선택</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-gray-600">클릭하여 이미지 업로드</p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPEG, JPG, PNG, GIF, HEIC (최대 5MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? '작성 중...' : '리뷰 작성하기'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};