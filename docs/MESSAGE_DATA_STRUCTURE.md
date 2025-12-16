# Complete Message Data Structure from Backend

## API Endpoint: GET /api/chat/messages/:chatRoomId

### Full Response Structure

```json
{
  "success": true,
  "message": "تم جلب الرسائل بنجاح",
  "data": {
    "messages": [
      {
        // ===== CORE FIELDS =====
        "_id": "673e5f8a1234567890abcdef",
        "id": "673e5f8a1234567890abcdef",  // Virtual field (same as _id)
        
        // ===== RELATIONSHIPS =====
        "chatRoom": "673e5f8a1234567890abcd00",  // ObjectId of chat room
        "sender": {  // Populated user object
          "_id": "673e5f8a1234567890abcd11",
          "firstname": "أحمد",
          "lastname": "محمد"
        },
        "senderId": "673e5f8a1234567890abcd11",  // Direct sender ID (if not populated)
        
        // ===== MESSAGE CONTENT =====
        "content": {
          "text": "السلام عليكم ورحمة الله",  // Message text (max 1000 chars)
          "messageType": "text",  // "text" | "media" | "system"
          
          // Optional media fields (if messageType is "media")
          "media": {
            "type": "image",  // "image" | "video" | "document"
            "url": "https://imagekit.io/...",
            "filename": "photo.jpg",
            "size": 245678  // bytes
          }
        },
        
        // ===== READ RECEIPTS =====
        "readBy": [
          {
            "user": "673e5f8a1234567890abcd11",  // User who read
            "readAt": "2025-11-25T11:05:30.123Z",  // When they read it
            "_id": "673e5f8a1234567890abcd22"
          },
          {
            "user": "673e5f8a1234567890abcd33",
            "readAt": "2025-11-25T11:06:15.456Z",
            "_id": "673e5f8a1234567890abcd44"
          }
        ],
        
        // ===== EDIT STATUS =====
        "isEdited": false,  // true if message was edited
        "editedAt": null,  // Date when edited (if isEdited is true)
        
        // ===== DELETE STATUS =====
        "isDeleted": false,  // true if soft deleted
        "deletedAt": null,  // Date when deleted
        
        // ===== REPLY FEATURE =====
        "replyTo": null,  // ObjectId of message being replied to (or populated message object)
        
        // ===== ISLAMIC COMPLIANCE =====
        "islamicCompliance": {
          "isAppropriate": true,  // false if flagged
          "checkedBy": "system",  // "system" | "moderator"
          "flaggedContent": []  // Array of flagged words (if inappropriate)
        },
        
        // ===== MODERATION STATUS =====
        "status": "approved",  // "pending" | "approved" | "rejected" | "flagged"
        "approvedAt": "2025-11-25T11:05:30.123Z",  // When approved
        "approvedBy": "673e5f8a1234567890abcd11",  // Who approved (usually sender for auto-approve)
        "rejectionReason": null,  // String reason if rejected
        "rejectedAt": null,  // Date when rejected
        "rejectedBy": null,  // Who rejected
        
        // ===== TIMESTAMPS =====
        "createdAt": "2025-11-25T11:05:30.123Z",  // When message was sent
        "updatedAt": "2025-11-25T11:05:30.123Z",  // Last update time
        
        // ===== MONGOOSE METADATA =====
        "__v": 0  // Version key
      }
    ],
    
    // ===== PAGINATION =====
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 127,  // Total messages in chat
      "totalPages": 3
    }
  }
}
```

---

## API Endpoint: POST /api/chat/messages (Send Message)

### Request Body
```json
{
  "chatRoomId": "673e5f8a1234567890abcd00",
  "content": "السلام عليكم",
  "type": "text"
}
```

### Response (Single Message)
```json
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "data": {
    "message": {
      // Same structure as above, but single message
      "_id": "673e5f8a1234567890abcdef",
      "chatRoom": "673e5f8a1234567890abcd00",
      "sender": {
        "_id": "673e5f8a1234567890abcd11",
        "firstname": "أحمد",
        "lastname": "محمد"
      },
      "content": {
        "text": "السلام عليكم",
        "messageType": "text"
      },
      "readBy": [
        {
          "user": "673e5f8a1234567890abcd11",  // Sender auto-reads
          "readAt": "2025-11-25T11:05:30.123Z"
        }
      ],
      "isEdited": false,
      "isDeleted": false,
      "replyTo": null,
      "islamicCompliance": {
        "isAppropriate": true,
        "checkedBy": "system",
        "flaggedContent": []
      },
      "status": "approved",
      "approvedAt": "2025-11-25T11:05:30.123Z",
      "approvedBy": "673e5f8a1234567890abcd11",
      "createdAt": "2025-11-25T11:05:30.123Z",
      "updatedAt": "2025-11-25T11:05:30.123Z"
    }
  }
}
```

---

## Field Usage Summary

### ✅ Currently Used in Frontend
- `_id` / `id` - Message identifier
- `content.text` - Message text
- `sender` - Sender info (firstname, lastname)
- `createdAt` - Timestamp
- `status` - For status icon
- `readBy` - For read receipts (✓✓)

### 🔶 Available but NOT Used Yet
- `isEdited` / `editedAt` - **NOW USED** ✓
- `replyTo` - **NOW USED** ✓ (shows "رد على رسالة")
- `content.media` - Media attachments (images/videos/docs)
- `islamicCompliance.flaggedContent` - Show warning if inappropriate
- `rejectionReason` - Show why message was rejected
- `deletedAt` - Show "Message deleted" placeholder
- `readBy[].readAt` - Show exact read time on hover
- `approvedBy` / `approvedAt` - Moderation info

### 📊 Metadata Fields
- `chatRoom` - Parent chat room ID
- `__v` - Mongoose version (ignore)
- `updatedAt` - Last modification time

---

## How to Access in Frontend

```typescript
// In chat-window.tsx
roomMessages.map((message) => {
  // Basic info
  message.id                    // "673e5f8a..."
  message.content.text          // "السلام عليكم"
  message.createdAt             // "2025-11-25T11:05:30.123Z"
  
  // Sender info
  message.sender.firstname      // "أحمد"
  message.sender.lastname       // "محمد"
  
  // Status
  message.status                // "approved"
  message.isEdited              // false
  message.isDeleted             // false
  
  // Read receipts
  message.readBy.length         // 2 (sender + recipient)
  message.readBy[0].readAt      // "2025-11-25T11:05:30.123Z"
  
  // Reply
  message.replyTo               // null or message object
  
  // Compliance
  message.islamicCompliance.isAppropriate  // true
  message.islamicCompliance.flaggedContent // []
  
  // Media (if exists)
  message.content.media?.url    // "https://..."
  message.content.media?.type   // "image"
})
```

---

## Notes

1. **Populated Fields**: `sender` is populated with user info (firstname, lastname only)
2. **Read Receipts**: Sender is automatically added to `readBy` when sending
3. **Auto-Approval**: Messages are auto-approved unless flagged by compliance check
4. **Soft Delete**: `isDeleted` marks messages as deleted without removing from DB
5. **Pagination**: Default 50 messages per page, sorted by `createdAt` (oldest first)
