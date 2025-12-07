# Certificate Upload System - Excel Format Guide

## Overview

The certificate upload system allows organizations to bulk upload certificate data via Excel files and automatically generate certificate images for each entry.

## Excel File Format

### Required Columns

- **Name**: The full name of the certificate recipient (Required)
- **Certificate ID**: A unique identifier for the certificate (Required)

### Optional Columns

- **Course Name**: Name of the course or program completed
- **Course ID**: Course code or NQR (National Qualifications Register) code
- **Year**: Year of completion
- **APAAR ID**: Student's APAAR (Automated Permanent Academic Account Registry) ID

### Example Excel Structure

| Name         | Certificate ID | Course Name      | Course ID | Year | APAAR ID    |
| ------------ | -------------- | ---------------- | --------- | ---- | ----------- |
| John Smith   | CERT001        | Web Development  | WEB101    | 2023 | APAAR123456 |
| Jane Doe     | CERT002        | Data Science     | DS201     | 2023 | APAAR789012 |
| Mike Johnson | CERT003        | Machine Learning | ML301     | 2024 | APAAR345678 |

### Column Name Variations Supported

The system can recognize multiple column name formats:

- **Name**: "Name", "name"
- **Certificate ID**: "Certificate ID", "CertificateId", "certificateId"
- **Course Name**: "Course Name", "CourseName", "courseName"
- **Course ID**: "Course ID", "CourseId", "courseId", "Course Code"
- **Year**: "Year", "year"
- **APAAR ID**: "APAAR ID", "ApaarId", "apaarId"

## Upload Process

1. **Prepare Excel File**: Create an Excel file (.xlsx or .xls) with the required columns
2. **Login as Organization**: Only organization accounts can upload certificates
3. **Access Upload Page**: Navigate to "Upload Certificates" from the user menu
4. **Select File**: Choose your Excel file using the file selector
5. **Upload & Generate**: Click "Upload & Generate Certificates" to process the file

## What Happens During Upload

1. **Excel Processing**: The Excel file is sent to a Python OCR service for data extraction
2. **Certificate Generation**: For each row, a certificate image is generated using a template
3. **Database Storage**: Certificate data and generated image URLs are stored in the database
4. **Results Display**: A summary showing successful and failed certificate creations

## Certificate Generation Details

Each certificate includes:

- Recipient name
- Certificate ID
- Course information (if provided)
- Year of completion (if provided)
- APAAR ID (if provided)

The certificate text is dynamically generated as:
"This is to certify that [Name], bearing certificate ID [Certificate ID] (Course Code: [Course ID]), has successfully completed the [Course Name] course in the year [Year]. APAAR ID: [APAAR ID]."

## Error Handling

- Invalid Excel files are rejected
- Missing required fields (Name, Certificate ID) will cause that row to be skipped
- Processing continues even if some certificates fail
- Detailed error reporting shows which certificates failed and why

## API Endpoints Used

- `/api/uploadxl`: Handles Excel file processing and database storage
- `/api/certificate/generate`: Generates certificate images from data

## Technical Notes

- File size limit depends on your server configuration
- Only .xlsx and .xls files are accepted
- Certificate images are stored in Cloudinary
- MongoDB is used for data persistence
- The system uses Prisma as the ORM

## Security

- Only authenticated organization users can upload certificates
- Session validation is performed on each request
- File type validation prevents malicious uploads
