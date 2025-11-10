# Quick Testing Guide - PDF Template Editor

## 🚀 Quick Start (5 minutes)

### 1. Set Up Appwrite Collection (2 min)

1. Go to Appwrite Console → Database → Your Database
2. Create collection: `pdf-templates`
3. Add these attributes:
   - `name` (string, 255, required)
   - `description` (string, 1000, optional)
   - `category` (string, 100, optional)
   - `templateConfig` (string, 10000, required)
   - `workspaceId` (string, 255, required)
   - `isDefault` (boolean, default: false)
   - `createdBy` (string, 255, required)
   - `version` (string, 20, default: "1.0.0")

4. Add indexes:
   - `workspaceId` (key)
   - `category` (key)

5. Set permissions: Allow authenticated users to read/write

6. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_APPWRITE_PDF_TEMPLATES_ID=pdf-templates
   ```

### 2. Access the Editor (30 sec)

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/workspaces/[your-workspace-id]/pdf-editor`
3. You should see the PDF Template Editor page

### 3. Test Basic Flow (2 min)

1. **Select Template**: Choose "Standard Invoice" from dropdown
2. **Fill Form**: 
   - Company Name: "Test Company"
   - Invoice Number: "INV-001"
   - Invoice Date: Today
   - Client Name: "John Doe"
   - Add 1 item: "Service", Price: 100
3. **Check Preview**: PDF should update automatically on the right
4. **Download**: Click "Download" button - PDF should download
5. **Save**: Click "Save Template" - Template should save to database

### 4. Verify (30 sec)

✅ Preview shows your data
✅ PDF downloads correctly
✅ Template saves successfully
✅ No console errors

## 🧪 Test Scenarios

### Test 1: Invoice Template
- Select "Standard Invoice"
- Fill all fields
- Add 3 items to table
- Verify preview matches input
- Download and check PDF

### Test 2: Letter Template
- Select "Standard Letter"
- Fill recipient info
- Add body content
- Verify formatting in preview
- Download PDF

### Test 3: Save & Load
- Create and save a template
- Refresh page
- Load saved template from dropdown
- Verify data loads correctly

### Test 4: Table Functionality
- Add 5 rows to items table
- Remove 2 rows
- Verify only 3 rows in preview
- Check table formatting in PDF

## 🐛 Common Issues

**Preview not showing?**
- Check browser console for errors
- Verify template config is valid
- Check network tab for failed requests

**Template not saving?**
- Verify `NEXT_PUBLIC_APPWRITE_PDF_TEMPLATES_ID` is set
- Check Appwrite collection permissions
- Verify you're authenticated

**Form fields not working?**
- Check React DevTools for state
- Verify no console errors
- Try refreshing the page

## 📍 Access URL

```
/workspaces/[workspaceId]/pdf-editor
```

Replace `[workspaceId]` with your actual workspace ID from the URL when you're in a workspace.

## ✅ Success Checklist

- [ ] Can access `/pdf-editor` page
- [ ] Can select default templates
- [ ] Form fields render correctly
- [ ] Preview updates automatically
- [ ] Can download PDF
- [ ] Can save template
- [ ] Can load saved template
- [ ] No console errors

## 🎯 Next Steps

Once basic testing passes:
1. Test with real data
2. Create custom templates
3. Integrate into your workflow
4. Add to navigation menu

