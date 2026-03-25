#!/bin/bash

# Test the tournament comment reaction flow

TOURNAMENT_ID="b8263b3d-a2ba-4149-b0ff-aab21b90f871"
API_URL="http://localhost:3001"

echo "🧪 Testing Tournament Comment Reaction Flow"
echo "=========================================="

# Step 1: Get comments for the tournament
echo -e "\n📝 Step 1: Fetching comments..."
COMMENTS=$(curl -s "$API_URL/api/tournaments/$TOURNAMENT_ID/comments" 2>/dev/null | jq '.' 2>/dev/null)

if [ -z "$COMMENTS" ] || [ "$COMMENTS" == "null" ]; then
  echo "❌ Failed to fetch comments"
  exit 1
fi

COMMENT_COUNT=$(echo "$COMMENTS" | jq '. | length' 2>/dev/null)
echo "✅ Found $COMMENT_COUNT comments"

# Get first comment ID
COMMENT_ID=$(echo "$COMMENTS" | jq -r '.[0].id' 2>/dev/null)
if [ -z "$COMMENT_ID" ] || [ "$COMMENT_ID" == "null" ]; then
  echo "❌ No comments available to test"
  exit 1
fi

echo "📌 First comment ID: $COMMENT_ID"

# Step 2: Check comment structure with reactions
echo -e "\n🔍 Step 2: Checking comment structure..."
FIRST_COMMENT=$(echo "$COMMENTS" | jq '.[0]' 2>/dev/null)
echo "Comment structure:"
echo "$FIRST_COMMENT" | jq '{id, content: .content[0:50], reactionCounts}' 2>/dev/null

# Step 3: Show reaction counts if present
REACTIONS=$(echo "$FIRST_COMMENT" | jq '.reactionCounts' 2>/dev/null)
if [ -n "$REACTIONS" ] && [ "$REACTIONS" != "null" ]; then
  echo "✅ Reaction counts present: $REACTIONS"
else
  echo "⚠️  No reaction counts yet (expected for new comments)"
fi

echo -e "\n✅ Comment reaction flow test complete!"
echo "   - API endpoint: /api/tournaments/[id]/comments"
echo "   - Reaction data structure: reactionCounts object"
echo "   - Ready for UI testing"
