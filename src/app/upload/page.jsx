"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";



// By default, the CldImage component applies auto-format and auto-quality to all delivery URLs for optimized delivery.
export default function UploadPage() {
  const form = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    console.log("Submitting...", data); // Debug log
    setLoading(true);
    setError("");

    const file = data.zipFile;
    if (!file) {
      setError("Please select a ZIP file.");
      setLoading(false);
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
          setLoading(false);
        } else {
          setLoading(false);
          router.push("/home"); // Navigate to /home after successful upload
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Upload failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Upload ZIP File
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
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
                    Choose a ZIP file from your device to upload.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="submit"
              className="w-full mt-6 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </Form>
        {error && (
          <div className="mt-4 text-center text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
}