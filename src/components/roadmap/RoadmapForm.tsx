'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { RoadmapFormData } from '@/types';

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
  const [formData, setFormData] = useState<RoadmapFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    courseTitle: initialData?.courseTitle || '',
    coursePlatform: initialData?.coursePlatform || '',
    nextCourseTitle: initialData?.nextCourseTitle || '',
    nextCoursePlatform: initialData?.nextCoursePlatform || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.courseTitle.trim()) {
      newErrors.courseTitle = '시작 강의명을 입력해주세요.';
    } else if (formData.courseTitle.length > 200) {
      newErrors.courseTitle = '강의명은 최대 200자까지 입력 가능합니다.';
    }

    if (!formData.coursePlatform.trim()) {
      newErrors.coursePlatform = '시작 강의 플랫폼을 입력해주세요.';
    } else if (formData.coursePlatform.length > 50) {
      newErrors.coursePlatform = '플랫폼명은 최대 50자까지 입력 가능합니다.';
    }

    // Optional next course validation
    if (formData.nextCourseTitle && formData.nextCourseTitle.length > 200) {
      newErrors.nextCourseTitle = '강의명은 최대 200자까지 입력 가능합니다.';
    }

    if (formData.nextCoursePlatform && formData.nextCoursePlatform.length > 50) {
      newErrors.nextCoursePlatform = '플랫폼명은 최대 50자까지 입력 가능합니다.';
    }

    // If next course title is provided, platform should also be provided
    if (formData.nextCourseTitle && formData.nextCourseTitle.trim() && !formData.nextCoursePlatform?.trim()) {
      newErrors.nextCoursePlatform = '다음 강의 플랫폼을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean up data
    const cleanData: RoadmapFormData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      courseTitle: formData.courseTitle.trim(),
      coursePlatform: formData.coursePlatform.trim(),
      nextCourseTitle: formData.nextCourseTitle?.trim() || undefined,
      nextCoursePlatform: formData.nextCoursePlatform?.trim() || undefined,
    };

    onSubmit(cleanData);
  };

  const handleInputChange = (field: keyof RoadmapFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
            <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-1">
              강의명 *
            </label>
            <Input
              id="courseTitle"
              value={formData.courseTitle}
              onChange={(e) => handleInputChange('courseTitle', e.target.value)}
              placeholder="예: React 완벽 가이드"
              maxLength={200}
              disabled={submitting}
              error={errors.courseTitle}
            />
            {errors.courseTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.courseTitle}</p>
            )}
          </div>

          <div>
            <label htmlFor="coursePlatform" className="block text-sm font-medium text-gray-700 mb-1">
              플랫폼 *
            </label>
            <Input
              id="coursePlatform"
              value={formData.coursePlatform}
              onChange={(e) => handleInputChange('coursePlatform', e.target.value)}
              placeholder="예: 인프런, 유데미, 패스트캠퍼스"
              maxLength={50}
              disabled={submitting}
              error={errors.coursePlatform}
            />
            {errors.coursePlatform && (
              <p className="mt-1 text-sm text-red-600">{errors.coursePlatform}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Next Course (Optional) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">다음 강의 (선택사항)</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="nextCourseTitle" className="block text-sm font-medium text-gray-700 mb-1">
              강의명
            </label>
            <Input
              id="nextCourseTitle"
              value={formData.nextCourseTitle}
              onChange={(e) => handleInputChange('nextCourseTitle', e.target.value)}
              placeholder="예: Next.js 실전 프로젝트"
              maxLength={200}
              disabled={submitting}
              error={errors.nextCourseTitle}
            />
            {errors.nextCourseTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.nextCourseTitle}</p>
            )}
          </div>

          <div>
            <label htmlFor="nextCoursePlatform" className="block text-sm font-medium text-gray-700 mb-1">
              플랫폼
            </label>
            <Input
              id="nextCoursePlatform"
              value={formData.nextCoursePlatform}
              onChange={(e) => handleInputChange('nextCoursePlatform', e.target.value)}
              placeholder="예: 인프런, 유데미, 패스트캠퍼스"
              maxLength={50}
              disabled={submitting}
              error={errors.nextCoursePlatform}
            />
            {errors.nextCoursePlatform && (
              <p className="mt-1 text-sm text-red-600">{errors.nextCoursePlatform}</p>
            )}
          </div>
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
          {submitting ? '등록 중...' : '로드맵 등록'}
        </Button>
      </div>
    </form>
  );
}