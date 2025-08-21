import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReviewSummaryRequest {
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    courseTitle?: string;
    coursePlatform?: string;
    positivePoints?: string;
    negativePoints?: string;
    changes?: string;
    recommendedFor?: string;
  }>;
  category?: string;
  platform?: string;
}

export interface ReviewSummaryResponse {
  summary: string;
  keyPoints: string[];
  averageRating: number;
  totalReviews: number;
  recommendedFor: string[];
  commonPositives: string[];
  commonNegatives: string[];
}

export class OpenAIService {
  /**
   * Generate a comprehensive summary of multiple reviews
   */
  static async generateReviewSummary(request: ReviewSummaryRequest): Promise<ReviewSummaryResponse> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      if (request.reviews.length === 0) {
        throw new Error('No reviews provided for summary generation');
      }

      // Calculate average rating
      const averageRating = request.reviews.reduce((sum, review) => sum + review.rating, 0) / request.reviews.length;

      // Prepare the prompt
      const reviewsText = request.reviews.map((review, index) => {
        return `리뷰 ${index + 1}:
평점: ${review.rating}/5
내용: ${review.content}
${review.positivePoints ? `좋았던 점: ${review.positivePoints}` : ''}
${review.negativePoints ? `아쉬웠던 점: ${review.negativePoints}` : ''}
${review.changes ? `수강 후 변화: ${review.changes}` : ''}
${review.recommendedFor ? `추천 대상: ${review.recommendedFor}` : ''}
---`;
      }).join('\n\n');

      const prompt = `다음은 ${request.category || '강의'}에 대한 ${request.reviews.length}개의 리뷰입니다.

${reviewsText}

위 리뷰들을 종합하여 다음 형식의 JSON으로 요약해주세요:

{
  "summary": "전체적인 강의 요약 (200-300자)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "recommendedFor": ["추천 대상 1", "추천 대상 2"],
  "commonPositives": ["공통 장점 1", "공통 장점 2", "공통 장점 3"],
  "commonNegatives": ["공통 단점 1", "공통 단점 2"]
}

요구사항:
- 모든 텍스트는 한국어로 작성
- summary는 객관적이고 균형잡힌 시각으로 작성
- keyPoints는 3-5개의 핵심 내용
- recommendedFor는 구체적인 대상 (예: "프로그래밍 초보자", "취업 준비생")
- commonPositives와 commonNegatives는 각각 2-4개씩
- JSON 형식을 정확히 지켜주세요`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 온라인 강의 리뷰를 분석하고 요약하는 전문가입니다. 객관적이고 도움이 되는 요약을 제공해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse OpenAI response:', responseText);
        throw new Error('Invalid response format from OpenAI');
      }

      // Validate and return response
      const result: ReviewSummaryResponse = {
        summary: parsedResponse.summary || '요약을 생성할 수 없습니다.',
        keyPoints: Array.isArray(parsedResponse.keyPoints) ? parsedResponse.keyPoints : [],
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: request.reviews.length,
        recommendedFor: Array.isArray(parsedResponse.recommendedFor) ? parsedResponse.recommendedFor : [],
        commonPositives: Array.isArray(parsedResponse.commonPositives) ? parsedResponse.commonPositives : [],
        commonNegatives: Array.isArray(parsedResponse.commonNegatives) ? parsedResponse.commonNegatives : [],
      };

      return result;
    } catch (error) {
      console.error('Error generating review summary:', error);
      throw error;
    }
  }

  /**
   * Generate a quick summary for a single review (for preview purposes)
   */
  static async generateQuickSummary(content: string, maxLength = 100): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 리뷰 내용을 간결하게 요약하는 전문가입니다.'
          },
          {
            role: 'user',
            content: `다음 리뷰를 ${maxLength}자 이내로 핵심 내용만 간단히 요약해주세요:\n\n${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content || content.slice(0, maxLength);
    } catch (error) {
      console.error('Error generating quick summary:', error);
      // Fallback to simple truncation
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
  }
}