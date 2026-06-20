# Task: Admin - Delete Question

**Endpoint**: `DELETE /api/admin/questions/:questionHash`

## 1. API Documentation

- **Method**: `DELETE`
- **URL**: `/api/admin/questions/:questionHash`
- **Access**: Private (Admin only)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Question deleted successfully"
  }
  ```

## 2. Instructions

1. Implement `adminController` in `admin.controller.js`.
2. In `admin.service.js`, write `deleteQuestionService`:
   - Check if requester is admin.
   - Delete question and all related answers/comments.
   - Return success message.

## 3. Logic Diagram

```mermaid
flowchart TD
    A["DELETE /api/admin/questions/:hash"] --> B{"Is Admin?"}
    B -- No --> C["Return 403 Forbidden"]
    B -- Yes --> D["Delete question + answers + comments"]
    D --> E["Return 200 Success"]
```
