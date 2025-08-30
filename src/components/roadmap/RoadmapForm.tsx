'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { CourseSearch } from '@/components/course/CourseSearch';
import { RoadmapFormData, Course } from '@/types';

interface RoadmapFormProps {
  initialData?: Partial<RoadmapFormData>;
  onSubmit: (data: RoadmapFormData) => void;
  onCancel?: () => void;
  submitting?: boolean;
  className?: string;
}

export function RoadmapForm({ 
  initialData,
  onSubmit, 
  onCancel,
  submitting = false,
  className = '' 
}: RoadmapFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    courseTitle: initialData?.courseTitle || '',
    coursePlatform: initialData?.coursePlatform || '',
    nextCourses: initialData?.nextCourses || [{ title: '', platform: '' }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialData?.courseTitle && initialData?.coursePlatform ? {
    id: '',
    title: initialData.courseTitle,
    platform: initialData.coursePlatform,
    viewCount: 0,
    createdAt: new Date()
  } as Course : null);
  const [selectedNextCourses, setSelectedNextCourses] = useState<Course[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = '로드맵 제목을 입력해주세요.';
    } else if (formData.title.length < 5) {
      newErrors.title = '제목은 최소 5자 이상 입력해주세요.';
    } else if (formData.title.length > 100) {
      newErrors.title = '제목은 최대 100자까지 입력 가능합니다.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '로드맵 설명을 입력해주세요.';
    } else if (formData.description.length < 20) {
      newErrors.description = '설명은 최소 20자 이상 입력해주세요.';
    } else if (formData.description.length > 1000) {
      newErrors.description = '설명은 최대 1000자까지 입력 가능합니다.';
    }

    // Validate starting course - check if either formData has values or a course is selected
    const hasCourseTitle = formData.courseTitle.trim() || (selectedCourse && selectedCourse.title);
    const hasCoursePlatform = formData.coursePlatform.trim() || (selectedCourse && selectedCourse.platform);

    if (!hasCourseTitle) {
      newErrors.courseTitle = '시작 강의명을 입력해주세요.';
    } else if ((formData.courseTitle.trim() || (selectedCourse?.title || '')).length > 200) {
      newErrors.courseTitle = '강의명은 최대 200자까지 입력 가능합니다.';
    }

    if (!hasCoursePlatform) {
      newErrors.coursePlatform = '시작 강의 플랫폼을 입력해주세요.';
    } else if ((formData.coursePlatform.trim() || (selectedCourse?.platform || '')).length > 50) {
      newErrors.coursePlatform = '플랫폼명은 최대 50자까지 입력 가능합니다.';
    }

    // Validate next courses
    formData.nextCourses.forEach((course, index) => {
      if (course.title && !course.platform) {
        newErrors[`nextCoursePlatform${index}`] = '플랫폼을 입력해주세요.';
      }
      if (course.platform && !course.title) {
        newErrors[`nextCourseTitle${index}`] = '강의명을 입력해주세요.';
      }
      if (course.title && course.title.length > 200) {
        newErrors[`nextCourseTitle${index}`] = '강의명은 최대 200자까지 입력 가능합니다.';
      }
      if (course.platform && course.platform.length > 50) {
        newErrors[`nextCoursePlatform${index}`] = '플랫폼명은 최대 50자까지 입력 가능합니다.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up data - use selected course if available
    const cleanData: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      courseTitle: (selectedCourse?.title || formData.courseTitle).trim(),
      coursePlatform: (selectedCourse?.platform || formData.coursePlatform).trim(),
      nextCourses: formData.nextCourses
        .filter(course => course.title || course.platform)
        .map(course => ({
          title: course.title.trim(),
          platform: course.platform.trim()
        }))
    };

    onSubmit(cleanData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCourseSelect = (course: Course) => {
    setFormData(prev => ({
      ...prev,
      courseTitle: course.title,
      coursePlatform: course.platform
    }));
    setSelectedCourse(course);
    
    // Clear errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.courseTitle;
      delete newErrors.coursePlatform;
      return newErrors;
    });
  };

  const handleNextCourseSelect = (course: Course, index: number) => {
    const updatedNextCourses = [...formData.nextCourses];
    updatedNextCourses[index] = {
      title: course.title,
      platform: course.platform
    };
    setFormData(prev => ({
      ...prev,
      nextCourses: updatedNextCourses
    }));
    
    // Update selected courses array
    const updatedSelected = [...selectedNextCourses];
    updatedSelected[index] = course;
    setSelectedNextCourses(updatedSelected);
    
    // Clear errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`nextCourseTitle${index}`];
      delete newErrors[`nextCoursePlatform${index}`];
      return newErrors;
    });
  };

  const handleAddNextCourse = () => {
    setFormData(prev => ({
      ...prev,
      nextCourses: [...prev.nextCourses, { title: '', platform: '' }]
    }));
  };

  const handleRemoveNextCourse = (index: number) => {
    const updatedNextCourses = [...formData.nextCourses];
    updatedNextCourses.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      nextCourses: updatedNextCourses
    }));
    
    // Update selected courses array
    const updatedSelected = [...selectedNextCourses];
    updatedSelected.splice(index, 1);
    setSelectedNextCourses(updatedSelected);
  };

  const handleNextCourseChange = (index: number, field: 'title' | 'platform', value: string) => {
    const updatedNextCourses = [...formData.nextCourses];
    updatedNextCourses[index] = {
      ...updatedNextCourses[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      nextCourses: updatedNextCourses
    }));
    
    // Clear error when user starts typing
    const errorKey = `nextCourse${field.charAt(0).toUpperCase() + field.slice(1)}${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Handle manual input for starting course (clears selected course)
  const handleCourseTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      courseTitle: value
    }));
    
    // If user manually types, clear the selected course
    if (selectedCourse) {
      setSelectedCourse(null);
    }
    
    // Clear error when user starts typing
    if (errors.courseTitle) {
      setErrors(prev => ({ ...prev, courseTitle: '' }));
    }
  };

  const handleCoursePlatformChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      coursePlatform: value
    }));
    
    // Clear error when user starts typing
    if (errors.coursePlatform) {
      setErrors(prev => ({ ...prev, coursePlatform: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              로드맵 제목 *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="예: React 기초부터 실전까지 완벽 로드맵"
              maxLength={100}
              disabled={submitting}
              error={errors.title}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/100자
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              로드맵 설명 *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="이 로드맵을 통해 어떤 것을 배울 수 있는지, 어떤 순서로 학습하면 좋은지 자세히 설명해주세요."
              rows={4}
              maxLength={1000}
              disabled={submitting}
              error={errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/1000자
            </p>
          </div>
        </div>
      </Card>

      {/* Starting Course */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">시작 강의</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              강의명 *
            </label>
            <CourseSearch
              onCourseSelect={handleCourseSelect}
              placeholder="강의명을 검색하세요..."
              showCreateOption={true}
            />
            {selectedCourse && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">{selectedCourse.title}</div>
                <div className="text-sm text-gray-600">{selectedCourse.platform}</div>
              </div>
            )}
            {errors.courseTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.courseTitle}</p>
            )}
          </div>

          <Input
            label="플랫폼 *"
            value={formData.coursePlatform}
            onChange={(e) => handleCoursePlatformChange(e.target.value)}
            placeholder="예: 인프런, 유데미, 패스트캠퍼스"
            maxLength={50}
            disabled={submitting}
            error={errors.coursePlatform}
          />
        </div>
      </Card>

      {/* Next Courses */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">다음 강의들</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAddNextCourse}
            disabled={submitting}
          >
            + 강의 추가
          </Button>
        </div>
        
        <div className="space-y-6">
          {formData.nextCourses.map((course, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">다음 강의 {index + 1}</h4>
                {formData.nextCourses.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveNextCourse(index)}
                    disabled={submitting}
                  >
                    삭제
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    강의명
                  </label>
                  <CourseSearch
                    onCourseSelect={(selectedCourse) => handleNextCourseSelect(selectedCourse, index)}
                    placeholder="강의명을 검색하세요..."
                    showCreateOption={true}
                  />
                  {selectedNextCourses[index] && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">{selectedNextCourses[index].title}</div>
                      <div className="text-sm text-gray-600">{selectedNextCourses[index].platform}</div>
                    </div>
                  )}
                  {errors[`nextCourseTitle${index}`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`nextCourseTitle${index}`]}</p>
                  )}
                </div>

                <Input
                  label="플랫폼"
                  value={course.platform}
                  onChange={(e) => handleNextCourseChange(index, 'platform', e.target.value)}
                  placeholder="예: 인프런, 유데미, 패스트캠퍼스"
                  maxLength={50}
                  disabled={submitting}
                  error={errors[`nextCoursePlatform${index}`]}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Guidelines */}
      <Alert variant="default">
        <div>
          <h4 className="font-medium mb-2">로드맵 작성 가이드</h4>
          <ul className="text-sm space-y-1">
            <li>• 실제 수강한 강의를 바탕으로 작성해주세요.</li>
            <li>• 학습 순서와 이유를 명확히 설명해주세요.</li>
            <li>• 다른 학습자들에게 도움이 되는 구체적인 정보를 포함해주세요.</li>
            <li>• 작성된 로드맵은 검수 후 공개됩니다.</li>
          </ul>
        </div>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting 
            ? (initialData ? '수정 중...' : '등록 중...') 
            : (initialData ? '로드맵 수정' : '로드맵 등록')
          }
        </Button>
      </div>
    </form>
  );
}