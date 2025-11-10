# PDF Template Editor - Testing Guide

## Step 1: Set Up Appwrite Collection

### Create Collection in Appwrite Console

1. Go to your Appwrite Console → Database → Your Database
2. Create a new collection with ID: `pdf-templates` (or use your preferred ID)
3. Add the following attributes:

#### Attributes:

| Attribute ID | Type | Size | Required | Default | Array |
|-------------|------|------|----------|---------|-------|
| `name` | string | 255 | ✅ Yes | - | ❌ No |
| `description` | string | 1000 | ❌ No | - | ❌ No |
| `category` | string | 100 | ❌ No | - | ❌ No |
| `templateConfig` | string | 10000 | ✅ Yes | - | ❌ No |
| `workspaceId` | string | 255 | ✅ Yes | - | ❌ No |
| `isDefault` | boolean | - | ❌ No | false | ❌ No |
| `createdBy` | string | 255 | ✅ Yes | - | ❌ No |
| `version` | string | 20 | ❌ No | "1.0.0" | ❌ No |

#### Indexes:

1. **workspaceId** (key: `workspaceId`, type: `key`)
2. **category** (key: `category`, type: `key`)
3. **workspaceId + category** (keys: `workspaceId`, `category`, type: `key`)

### Set Permissions

- **Create**: Any authenticated user
- **Read**: Any authenticated user
- **Update**: Any authenticated user (server-side checks creator/admin)
- **Delete**: Any authenticated user (server-side checks creator/admin)

### Update Environment Variables

Add to your `.env.local` file:
```env
NEXT_PUBLIC_APPWRITE_PDF_TEMPLATES_ID=pdf-templates
```

## Step 2: Create Test Page

I'll create a test page for you to use the editor.

## Step 3: Testing Checklist

### ✅ Basic Functionality

1. **Template Selection**
   - [ ] Can select from default templates (Invoice, Letter)
   - [ ] Template name and description update correctly
   - [ ] Form fields populate based on selected template

2. **Form Builder**
   - [ ] All field types render correctly:
     - [ ] Text input
     - [ ] Textarea
     - [ ] Number input
     - [ ] Date picker
     - [ ] Email input
     - [ ] Phone input
     - [ ] Select dropdown
     - [ ] Checkbox
     - [ ] Table (add/remove rows)
   - [ ] Required fields are marked with asterisk
   - [ ] Placeholder text displays correctly
   - [ ] Default values populate correctly

3. **Live Preview**
   - [ ] PDF preview generates automatically when data changes
   - [ ] Preview updates after 500ms debounce
   - [ ] Preview shows correct content with placeholders replaced
   - [ ] Preview displays all sections (header, body, table, signature)
   - [ ] Preview handles empty/null values gracefully

4. **Template Saving**
   - [ ] Can save template to database
   - [ ] Success toast appears
   - [ ] Template appears in list after saving
   - [ ] Template can be loaded and edited

5. **PDF Download**
   - [ ] Download button works
   - [ ] PDF downloads with correct filename
   - [ ] Downloaded PDF matches preview
   - [ ] Activity log entry created for download

### ✅ Advanced Features

6. **Table Functionality**
   - [ ] Can add rows to table
   - [ ] Can remove rows from table
   - [ ] Table data displays correctly in preview
   - [ ] Table columns render with correct types (text, number, date)

7. **Placeholder Replacement**
   - [ ] `{{fieldName}}` placeholders are replaced with actual values
   - [ ] Empty values show as empty (not "undefined")
   - [ ] Default values work: `{{fieldName.defaultValue}}`

8. **Conditional Sections**
   - [ ] Sections with `showIf` only appear when condition is met
   - [ ] Sections with `hideIf` are hidden when condition is met

9. **Template Management**
   - [ ] Can fetch templates by workspace
   - [ ] Can filter templates by category
   - [ ] Can update existing template
   - [ ] Can delete template (non-default only)
   - [ ] Version increments on template config update

### ✅ Error Handling

10. **Error Scenarios**
    - [ ] Invalid template config shows error
    - [ ] Missing required fields shows validation
    - [ ] Network errors are handled gracefully
    - [ ] Unauthorized access returns 401/403
    - [ ] Preview errors display user-friendly message

### ✅ UI/UX

11. **User Experience**
    - [ ] Loading states show during PDF generation
    - [ ] Form is responsive (mobile/tablet/desktop)
    - [ ] Preview is scrollable
    - [ ] All buttons have proper disabled states
    - [ ] Tooltips/help text where needed

## Step 4: Test Scenarios

### Scenario 1: Create Invoice PDF

1. Select "Standard Invoice" template
2. Fill in:
   - Company Name: "Test Company"
   - Invoice Number: "INV-001"
   - Invoice Date: Today's date
   - Client Name: "John Doe"
   - Client Email: "john@example.com"
   - Add 2 items to table:
     - Item 1: "Web Development", Qty: 1, Price: 1000
     - Item 2: "Design", Qty: 2, Price: 500
   - Subtotal: 2000
   - Tax: 0
   - Total: 2000
3. Verify preview shows all data correctly
4. Download PDF and verify it matches preview
5. Save template

### Scenario 2: Create Letter PDF

1. Select "Standard Letter" template
2. Fill in:
   - Company Name: "Test Company"
   - Date: Today's date
   - Recipient Name: "Jane Smith"
   - Recipient Address: "123 Main St, City, State"
   - Subject: "Test Letter"
   - Body Content: "This is a test letter content."
   - Signer Name: "John Admin"
3. Verify preview shows formatted letter
4. Download and verify PDF

### Scenario 3: Custom Template

1. Start with default Invoice template
2. Modify template name to "Custom Invoice"
3. Add custom fields
4. Save template
5. Reload page and verify template is saved
6. Edit template and verify version increments

### Scenario 4: Table Data

1. Use Invoice template
2. Add 5 items to items table
3. Verify all items appear in preview
4. Remove 2 items
5. Verify only 3 items remain in preview
6. Download and verify table in PDF

## Step 5: API Testing

### Test API Endpoints Directly

You can test the API endpoints using curl or Postman:

```bash
# Get templates
curl -X GET "http://localhost:3000/api/pdf-templates?workspaceId=YOUR_WORKSPACE_ID" \
  -H "Cookie: your-session-cookie"

# Create template
curl -X POST "http://localhost:3000/api/pdf-templates" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Test Template",
    "description": "Test description",
    "templateConfig": "{\"id\":\"test\",\"name\":\"Test\",\"sections\":[],\"fields\":[]}",
    "workspaceId": "YOUR_WORKSPACE_ID"
  }'
```

## Step 6: Browser Console Checks

Open browser DevTools and check:

1. **No Console Errors**
   - No React errors
   - No TypeScript errors
   - No network errors (except expected 401s for unauthorized)

2. **Network Tab**
   - API calls succeed with 200 status
   - PDF generation completes successfully
   - No failed requests

3. **Performance**
   - Preview generates within 1-2 seconds
   - No memory leaks (check memory usage over time)
   - Smooth scrolling and interactions

## Step 7: Edge Cases

Test these edge cases:

- [ ] Empty template (no sections)
- [ ] Template with only header
- [ ] Template with very long text content
- [ ] Template with special characters in field names
- [ ] Template with 50+ table rows
- [ ] Very large PDF (multiple pages)
- [ ] Concurrent edits (two tabs open)
- [ ] Offline mode (network disconnected)

## Troubleshooting

### Issue: Preview not showing
- Check browser console for errors
- Verify template config is valid JSON
- Check that all required fields are filled

### Issue: Template not saving
- Verify `NEXT_PUBLIC_APPWRITE_PDF_TEMPLATES_ID` is set
- Check Appwrite collection permissions
- Verify user is authenticated

### Issue: PDF download fails
- Check browser console for errors
- Verify `useDownloadWithLogging` hook is working
- Check workspace ID is valid

### Issue: Form fields not updating
- Check React DevTools for state updates
- Verify `onChange` handler is called
- Check for console errors

## Success Criteria

✅ All basic functionality works
✅ No console errors
✅ PDFs generate correctly
✅ Templates save and load
✅ UI is responsive
✅ Error handling works
✅ Activity logs are created

## Next Steps After Testing

1. Create a proper page/route for the editor (not just test page)
2. Add template management UI (list, edit, delete)
3. Add template categories/filtering
4. Add template duplication feature
5. Add template import/export


