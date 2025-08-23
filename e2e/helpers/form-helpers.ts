/**
 * Form helper functions for E2E tests
 */

import { Page } from '@playwright/test'

export interface ReviewFormData {
  platform?: string
  title: string
  instructor?: string
  category?: string
  content: string
  rating: string
  studyPeriod?: string
  positivePoints?: string
  negativePoints?: string
  changes?: string
  recommendedFor?: string
}

export interface RoadmapFormData {
  title: string
  description: string
  category?: string
  difficulty?: string
  estimatedTime?: string
}

/**
 * Fill out a review form with the provided data
 */
export async function fillReviewForm(page: Page, data: ReviewFormData) {
  if (data.platform) {
    await page.fill('input[name="platform"]', data.platform)
  }
  
  await page.fill('input[name="title"]', data.title)
  
  if (data.instructor) {
    await page.fill('input[name="instructor"]', data.instructor)
  }
  
  if (data.category) {
    await page.selectOption('select[name="category"]', data.category)
  }
  
  await page.fill('textarea[name="content"]', data.content)
  await page.selectOption('select[name="rating"]', data.rating)
  
  if (data.studyPeriod) {
    await page.fill('input[name="studyPeriod"]', data.studyPeriod)
  }
  
  if (data.positivePoints) {
    await page.fill('textarea[name="positivePoints"]', data.positivePoints)
  }
  
  if (data.negativePoints) {
    await page.fill('textarea[name="negativePoints"]', data.negativePoints)
  }
  
  if (data.changes) {
    await page.fill('textarea[name="changes"]', data.changes)
  }
  
  if (data.recommendedFor) {
    await page.fill('textarea[name="recommendedFor"]', data.recommendedFor)
  }
}

/**
 * Fill out a roadmap form with the provided data
 */
export async function fillRoadmapForm(page: Page, data: RoadmapFormData) {
  await page.fill('input[name="title"]', data.title)
  await page.fill('textarea[name="description"]', data.description)
  
  if (data.category) {
    await page.selectOption('select[name="category"]', data.category)
  }
  
  if (data.difficulty) {
    await page.selectOption('select[name="difficulty"]', data.difficulty)
  }
  
  if (data.estimatedTime) {
    await page.fill('input[name="estimatedTime"]', data.estimatedTime)
  }
}

/**
 * Submit a form and wait for response
 */
export async function submitForm(page: Page, buttonText: string = '작성') {
  await page.click(`button:has-text("${buttonText}")`)
}

/**
 * Upload a file to a file input
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector)
  if (await fileInput.isVisible()) {
    await fileInput.setInputFiles(filePath)
  }
}

/**
 * Fill out a comment form
 */
export async function addComment(page: Page, content: string) {
  await page.fill('textarea[placeholder*="댓글"]', content)
  await page.click('button:has-text("댓글 작성")')
}

/**
 * Search for content
 */
export async function search(page: Page, query: string) {
  const searchInput = page.locator('input[placeholder*="검색"]')
  await searchInput.fill(query)
  await searchInput.press('Enter')
}

/**
 * Filter content by category
 */
export async function filterByCategory(page: Page, category: string) {
  await page.selectOption('select[name="category"]', category)
}

/**
 * Sort content
 */
export async function sortBy(page: Page, sortOption: string) {
  await page.selectOption('select[name="sort"]', sortOption)
}