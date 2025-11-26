import { v2 as cloudinary } from "cloudinary";
import {prisma} from "@/lib/prisma";
import { getSession } from "next-auth/react";
import AdmZip from "adm-zip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connect } from "http2";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Access user data securely
  const { id, username, role, name } = session.user;


  const org=await prisma.organisation.findUnique({
    where:{id:id}
  });

  try {
    // Receive zip file as base64 string in JSON body
    const { zipBase64 } = await request.json();

    // Convert base64 to buffer
    const zipBuffer = Buffer.from(zipBase64, "base64");

    // Extract PDFs, JPGs, and PNGs from zip
    const zip = new AdmZip(zipBuffer);
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const entries = zip.getEntries().filter((entry) =>
      allowedExtensions.some(ext => entry.entryName.toLowerCase().endsWith(ext))
    );

    const uploadResults = [];

    for (const entry of entries) {
      const fileBuffer = entry.getData();
      const base64Data = fileBuffer.toString("base64");
      console.log(`Processing file: ${entry.entryName}`);
      
      const ocrResponse = await fetch("http://localhost:5001/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: entry.entryName,
          b64: base64Data,
        }),
      });

      console.log(`OCR Response Status: ${ocrResponse.status}`);

      if (!ocrResponse.ok) {
        console.error(`OCR request failed for ${entry.entryName}:`, ocrResponse.status);
        continue;
      }

      const res = await ocrResponse.json();
      console.log(`OCR Response:`, res);

      if (!res.results || !res.results[0] || !res.results[0].fields) {
        console.error(`Invalid OCR response structure:`, res);
        continue;
      }

      const fields = res.results[0].fields;
      fields.organisation_id = org.id;

      const finalFields = {
        name: String(fields.name || ""),                  // required
        degree: fields.degree ? String(fields.degree) : null,
        certificateId: fields.certificateId ? String(fields.certificateId) : null,
        rollNo: fields.roll_no ? String(fields.roll_no) : null,
        year: fields.year ? String(fields.year) : null,
        honors: fields.honors ? String(fields.honors) : null,
        grade: fields.grade ? String(fields.grade) : null,
        organisation: {
          connect: { id: org.id }  // keep as is
        }
      };


      const ext = entry.entryName.split('.').pop().toLowerCase();
      let resourceType = "raw";
      let fileName = entry.entryName;
      
      if (["jpg", "jpeg", "png"].includes(ext)) {
        resourceType = "image";
        // For images, we can remove extension from public_id
        fileName = entry.entryName.replace(/\.(jpg|jpeg|png)$/i, "");
      }
      // For PDFs and other raw files, keep the full filename with extension

      const publicId = `${name}/${fileName}`;

      // Check if file exists
      let exists = false;
      try {
        await cloudinary.api.resource(publicId, { resource_type: resourceType });
        exists = true;
      } catch (err) {
        if (err.error && err.error.http_code !== 404) throw err;
      }

      if (exists) {
        console.log(`File ${publicId} already exists. Skipping upload.`);
        const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
        uploadResults.push({
          fileName: entry.entryName,
          url: resource.secure_url,
        });
        continue;
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: name,
            public_id: fileName,
            unique_filename: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(fileBuffer);
      });

      finalFields.url=uploadResult.secure_url;

      await prisma.certificate.create({
        data:finalFields,
      });

      uploadResults.push({
        fileName: entry.entryName,
        url: uploadResult.secure_url,
      });
    }

    return new Response(JSON.stringify({ files: uploadResults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// "use client";
// import { useEffect,useState } from "react";
// import { useForm } from "react-hook-form";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {useTranslation} from react-i18next;
// import { translateDynamic } from "@/lib/translator";

// const { t } = useTranslation();

// export default function UploadPage() {
//   const { data: session } = useSession();
//   const username = session?.user?.username || "Unknown";

//   const zipForm = useForm();
//   const excelForm = useForm();
//   const router = useRouter();
//   const [zipLoading, setZipLoading] = useState(false);
//   const [excelLoading, setExcelLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Handle ZIP file upload
//   const onZipSubmit = async (data) => {
//     setZipLoading(true);
//     setError("");

//     const file = data.zipFile;
//     if (!file) {
//       setError(t("pleaseSelectZip"));
//       setZipLoading(false);
//       return;
//     }

//     try {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         const zipBase64 = reader.result.split(",")[1];
//         const response = await fetch("/api/upload", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ zipBase64 }),
//         });

//         if (!response.ok) {
//           const result = await response.json();
//           setError(result.error || t("uploadFailed"));
//           setZipLoading(false);
//         } else {
//           setZipLoading(false);
//           router.push("/");
//         }
//       };
//       reader.onerror = () => {
//         setError(t("failedToReadFile"));
//         setZipLoading(false);
//       };
//       reader.readAsDataURL(file);
//     } catch (err) {
//       setError("Upload failed");
//       setZipLoading(false);
//     }
//   };

//   // Handle Excel file upload
//   const onExcelSubmit = async (data) => {
//     setExcelLoading(true);
//     setError("");

//     const file = data.excelFile;
//     if (!file) {
//       setError("Please select an Excel file.");
//       setExcelLoading(false);
//       return;
//     }

//     try {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         const excelBase64 = reader.result.split(",")[1];
//         const response = await fetch("/api/uploadxl", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ excelBase64 }),
//         });

//         if (!response.ok) {
//           const result = await response.json();
//           setError(result.error || "Excel upload failed");
//           setExcelLoading(false);
//         } else {
//           const result = await response.json();
//           console.log("Excel upload success:", result);
//           setExcelLoading(false);
//           router.push("/");
//         }
//       };
//       reader.onerror = () => {
//         setError("Failed to read Excel file.");
//         setExcelLoading(false);
//       };
//       reader.readAsDataURL(file);
//     } catch (err) {
//       setError("Excel upload failed");
//       setExcelLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
//       <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
//         <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
//           {t('uploadFiles')}
//         </h2>

//         {/* Display logged-in username */}
//         <p className="mb-6 text-center text-gray-700 dark:text-gray-300">
//           {t('loggedInAs')}: <strong>{username}</strong>
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* ZIP Upload Form */}
//           <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
//             <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
//               {t('uploadZipFile')}
//             </h3>
//             <Form {...zipForm}>
//               <form onSubmit={zipForm.handleSubmit(onZipSubmit)}>
//                 <FormField
//                   control={zipForm.control}
//                   name="zipFile"
//                   render={({ field }) => (
//                     <FormItem>
//                       const {t} = useTranslation();
//                       <FormLabel>{t('selectZipFile')}</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="file"
//                           accept=".zip"
//                           onChange={e => field.onChange(e.target.files[0])}
//                         />
//                       </FormControl>
//                       <FormDescription>
//                         {t('chooseZipFileDesc')}
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <button
//                   type="submit"
//                   className="w-full mt-4 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none"
//                   disabled={zipLoading || excelLoading}
//                 >
//                   const {t} = useTranslation();
//                   {zipLoading ? t('uploadingZip') : t('uploadZip')}
//                 </button>
//               </form>
//             </Form>
//           </div>

//           {/* Excel Upload Form */}
//           <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
//             <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
//             t{('uploadExcelFile')}
//             </h3>
//             <Form {...excelForm}>
//               <form onSubmit={excelForm.handleSubmit(onExcelSubmit)}>
//                 <FormField
//                   control={excelForm.control}
//                   name="excelFile"
//                   render={({ field }) => (
//                     <FormItem>
//                       const {t} = useTranslation()
//                       <FormLabel>t{('selectExcelFile')}</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="file"
//                           accept=".xlsx,.xls"
//                           onChange={e => field.onChange(e.target.files[0])}
//                         />
//                       </FormControl>
//                       <FormDescription>
//                         t{('chooseExcelFileDesc')}
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <button
//                   type="submit"
//                   className="w-full mt-4 rounded-md bg-green-600 p-2 text-white hover:bg-green-700 focus:outline-none"
//                   disabled={zipLoading || excelLoading}
//                 >
//                   const {t} = useTranslation()
//                   {excelLoading ? t('uploadingExcel') : t('uploadExcel')}
//                 </button>
//               </form>
//             </Form>
//           </div>
//         </div>

//         {/* Error Display */}
//         {error && (
//           <div className="mt-6 text-center text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
//             {error}
//           </div>
//         )}

//         {/* Loading Status */}
//         {(zipLoading || excelLoading) && (
//           <div className="mt-4 text-center text-blue-600 dark:text-blue-400">
//             const {t} = useTranslation()
//             t{('processingFile')}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
