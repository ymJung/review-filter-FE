#!/bin/bash

# Deploy development Firebase rules for testing
echo "Deploying development Firebase security rules..."

# Backup current rules
cp firestore.rules firestore.rules.backup

# Copy development rules
cp firestore.rules.dev firestore.rules

# Deploy to Firebase
firebase deploy --only firestore:rules

echo "Development rules deployed successfully!"
echo "Remember to restore production rules before deploying to production:"
echo "  cp firestore.rules.backup firestore.rules"
echo "  firebase deploy --only firestore:rules"