# Excel Upload Format Guide for CertiFy

## Required Columns

The Excel file should contain the following columns (column names are case-insensitive and support multiple variations):

### Essential Fields (Required)

- **Name** - Full name of the candidate

### Identification Fields

- **CertificateId / Certificate ID** - Unique certificate identifier (auto-generated if not provided)
- **ApaarId / APAAR ID** - Automated Permanent Academic Account Registry ID
- **EnrolmentNo / Enrolment No / Enrollment Number** - Student enrollment number

### Personal Information

- **DateOfBirth / Date of Birth / dob** - Date of birth (supports Excel date format or DD/MM/YYYY)
- **FatherName / Father Name / Son/Daughter/Ward of** - Parent/Guardian name
- **District** - District name
- **State** - State name

### Course/Qualification Details

- **CourseName / Course Name** - Name of the course
- **Degree / Job Role / Qualification** - Job role or qualification title
- **CourseId / Course ID / NQR Code / nqrCode** - National Qualification Register Code
- **Year** - Year of completion

### Assessment Information

- **NsqfLevel / NSQF Level** - National Skills Qualifications Framework Level
- **AssessedBy / Assessed By / Assessment Agency** - Name of assessment body
- **Duration** - Course duration (e.g., "300 Hours", "6 Months")
- **Grade / Grade/Percentage / percentage** - Grade or percentage scored
- **CreditsAtTrainingCentre / Credits at Training Centre / credits** - Credits earned

### Issuance Details

- **PlaceOfIssue / Place of Issue** - Place where certificate was issued
- **DateOfIssue / Date of Issue** - Date of certificate issuance (supports Excel date format or DD/MM/YYYY)

## Optional Image Upload

You can upload the following images through the web interface:

- **Candidate Photo** - Photo of the certificate recipient
- **Organisation Logo** - Logo of the issuing organization
- **QR Code** - QR code for verification
- **Scheme Logo** - Logo of the scheme (e.g., Skill India, NCVET)
- **Awarding Body Logo** - Logo of the awarding authority
- **Blockchain Seal** - Blockchain verification seal/badge

## Example Excel Format

| Name       | CertificateId | APAAR ID | Date of Birth | Father Name   | Enrolment No | Course Name     | Job Role             | NSQF Level | Assessed By | District | State       | Duration  | Grade | Credits at Training Centre | Place of Issue | Date of Issue |
| ---------- | ------------- | -------- | ------------- | ------------- | ------------ | --------------- | -------------------- | ---------- | ----------- | -------- | ----------- | --------- | ----- | -------------------------- | -------------- | ------------- |
| John Doe   | CERT001       | APAAR123 | 15/03/2000    | Robert Doe    | ENR2024001   | Web Development | Junior Web Developer | Level 4    | NSDC        | Mumbai   | Maharashtra | 300 Hours | A+    | 30                         | Mumbai         | 10/12/2024    |
| Jane Smith | CERT002       | APAAR456 | 22/07/1999    | Michael Smith | ENR2024002   | Data Analytics  | Data Analyst         | Level 5    | NASSCOM     | Pune     | Maharashtra | 400 Hours | A     | 40                         | Pune           | 10/12/2024    |

## Date Formats Supported

The system supports:

1. **Excel Date Serial Numbers** - Automatically converted to proper dates
2. **DD/MM/YYYY** - Standard date format
3. **ISO Date Strings** - YYYY-MM-DD format

Dates will be automatically formatted as DD/MM/YYYY on the certificate.

## Notes

1. All text fields support empty values except for **Name** which is mandatory
2. If CertificateId is not provided, it will be auto-generated as `CERT_[timestamp]_[row_number]`
3. Images uploaded through the web interface will be applied to all certificates in the batch
4. The system will generate blockchain hashes automatically
5. Certificates are uploaded to Cloudinary and backed up locally
6. Each certificate will have steganographic data embedded for verification

## Blockchain Integration

After certificate generation, you can deploy the certificates to the blockchain which will:

- Store file hash (SHA-256 of certificate image)
- Store data hash (SHA-256 of identity data)
- Store encrypted steganographic data
- Link to organization's blockchain contract

## Troubleshooting

- **"Missing name" error**: Ensure every row has a name value
- **Date format issues**: Use Excel's date format or DD/MM/YYYY text format
- **Image upload fails**: Ensure images are in JPG, PNG, or GIF format
- **Duplicate certificate error**: Check for duplicate CertificateId values
