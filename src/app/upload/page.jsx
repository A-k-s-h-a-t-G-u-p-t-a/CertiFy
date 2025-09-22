"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UploadPage() {
  const { data: session } = useSession();
  const username = session?.user?.username || "Unknown";

  const zipForm = useForm();
  const excelForm = useForm();
  const router = useRouter();
  const [zipLoading, setZipLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle ZIP file upload
  const onZipSubmit = async (data) => {
    setZipLoading(true);
    setError("");

    const file = data.zipFile;
    if (!file) {
      setError("Please select a ZIP file.");
      setZipLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const zipBase64 = reader.result.split(",")[1];
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipBase64 }),
        });

        if (!response.ok) {
          const result = await response.json();
          setError(result.error || "Upload failed");
          setZipLoading(false);
        } else {
          setZipLoading(false);
          router.push("/");
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setZipLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Upload failed");
      setZipLoading(false);
    }
  };

  // Handle Excel file upload
  const onExcelSubmit = async (data) => {
    setExcelLoading(true);
    setError("");

    const file = data.excelFile;
    if (!file) {
      setError("Please select an Excel file.");
      setExcelLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const excelBase64 = reader.result.split(",")[1];
        const response = await fetch("/api/uploadxl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excelBase64 }),
        });

        if (!response.ok) {
          const result = await response.json();
          setError(result.error || "Excel upload failed");
          setExcelLoading(false);
        } else {
          const result = await response.json();
          console.log("Excel upload success:", result);
          setExcelLoading(false);
          router.push("/");
        }
      };
      reader.onerror = () => {
        setError("Failed to read Excel file.");
        setExcelLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Excel upload failed");
      setExcelLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Upload Files
        </h2>

        {/* Display logged-in username */}
        <p className="mb-6 text-center text-gray-700 dark:text-gray-300">
          Logged in as: <strong>{username}</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ZIP Upload Form */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upload ZIP File
            </h3>
            <Form {...zipForm}>
              <form onSubmit={zipForm.handleSubmit(onZipSubmit)}>
                <FormField
                  control={zipForm.control}
                  name="zipFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select ZIP File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".zip"
                          onChange={e => field.onChange(e.target.files[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a ZIP file containing certificates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <button
                  type="submit"
                  className="w-full mt-4 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none"
                  disabled={zipLoading || excelLoading}
                >
                  {zipLoading ? "Uploading ZIP..." : "Upload ZIP"}
                </button>
              </form>
            </Form>
          </div>

          {/* Excel Upload Form */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upload Excel File
            </h3>
            <Form {...excelForm}>
              <form onSubmit={excelForm.handleSubmit(onExcelSubmit)}>
                <FormField
                  control={excelForm.control}
                  name="excelFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Excel File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={e => field.onChange(e.target.files[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose an Excel file with certificate data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <button
                  type="submit"
                  className="w-full mt-4 rounded-md bg-green-600 p-2 text-white hover:bg-green-700 focus:outline-none"
                  disabled={zipLoading || excelLoading}
                >
                  {excelLoading ? "Uploading Excel..." : "Upload Excel"}
                </button>
              </form>
            </Form>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 text-center text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Loading Status */}
        {(zipLoading || excelLoading) && (
          <div className="mt-4 text-center text-blue-600 dark:text-blue-400">
            Processing file... Please wait.
          </div>
        )}
      </div>
    </div>
  );
}
