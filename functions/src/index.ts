import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Scheduled function to clean up expired review summaries
 * Runs daily at 2 AM UTC
 */
export const cleanupExpiredSummaries = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
    memory: "256MiB",
  },
  async (event) => {
    console.log("Starting cleanup of expired summaries...");
    
    try {
      const now = new Date();
      const expiredSummariesQuery = db
        .collection("reviewSummaries")
        .where("expiresAt", "<=", now);
      
      const expiredSummaries = await expiredSummariesQuery.get();
      
      if (expiredSummaries.empty) {
        console.log("No expired summaries found");
        return;
      }
      
      const batch = db.batch();
      expiredSummaries.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${expiredSummaries.size} expired summaries`);
    } catch (error) {
      console.error("Error cleaning up expired summaries:", error);
      throw error;
    }
  }
);

/**
 * Scheduled function to generate daily review summaries
 * Runs daily at 1 AM UTC
 */
export const generateDailySummaries = onSchedule(
  {
    schedule: "0 1 * * *",
    timeZone: "UTC",
    memory: "512MiB",
  },
  async (event) => {
    console.log("Starting daily summary generation...");
    
    try {
      // Get recent approved reviews (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentReviewsQuery = db
        .collection("reviews")
        .where("status", "==", "APPROVED")
        .where("updatedAt", ">=", yesterday)
        .orderBy("updatedAt", "desc")
        .limit(50);
      
      const recentReviews = await recentReviewsQuery.get();
      
      if (recentReviews.empty) {
        console.log("No recent reviews found for summary generation");
        return;
      }
      
      console.log(`Found ${recentReviews.size} recent reviews for summary`);
      
      // This would typically call OpenAI API to generate summaries
      // For now, we'll create a placeholder summary
      const reviewIds = recentReviews.docs.map(doc => doc.id);
      const summary = `최근 ${recentReviews.size}개의 리뷰가 등록되었습니다. 다양한 강의에 대한 후기가 공유되고 있습니다.`;
      
      // Create summary document
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days
      
      await db.collection("reviewSummaries").add({
        summary,
        reviewIds,
        createdAt: new Date(),
        expiresAt,
      });
      
      console.log("Daily summary generated successfully");
    } catch (error) {
      console.error("Error generating daily summary:", error);
      throw error;
    }
  }
);

/**
 * HTTP function for health check
 */
export const healthCheck = onRequest(
  {
    cors: true,
    memory: "128MiB",
  },
  async (req, res) => {
    try {
      // Check Firestore connection
      await db.collection("health").doc("check").get();
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * HTTP function for manual summary generation
 */
export const generateSummaryManual = onRequest(
  {
    cors: true,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    
    try {
      // Verify admin authorization (in production, implement proper auth)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      
      // Get recent approved reviews
      const recentReviewsQuery = db
        .collection("reviews")
        .where("status", "==", "APPROVED")
        .orderBy("updatedAt", "desc")
        .limit(20);
      
      const recentReviews = await recentReviewsQuery.get();
      
      if (recentReviews.empty) {
        res.status(404).json({ error: "No reviews found" });
        return;
      }
      
      const reviewIds = recentReviews.docs.map(doc => doc.id);
      const summary = `수동으로 생성된 요약: ${recentReviews.size}개의 최근 리뷰`;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const summaryDoc = await db.collection("reviewSummaries").add({
        summary,
        reviewIds,
        createdAt: new Date(),
        expiresAt,
      });
      
      res.status(201).json({
        id: summaryDoc.id,
        summary,
        reviewCount: recentReviews.size,
      });
    } catch (error) {
      console.error("Error generating manual summary:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);