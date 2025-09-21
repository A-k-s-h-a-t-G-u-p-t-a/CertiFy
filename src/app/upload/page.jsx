"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UploadPage() {
  const { data: session } = useSession(); // ✅ Get session info
  const username = session?.user?.username || "Unknown"; // ✅ Logged-in username

  const form = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
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
          router.push("/"); // Navigate after success
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
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Upload ZIP File
        </h2>

        {/* Display logged-in username */}
        <p className="mb-4 text-center text-gray-700 dark:text-gray-300">
          Logged in as: <strong>{username}</strong>
        </p>

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

        {error && <div className="mt-4 text-center text-red-600">{error}</div>}
      </div>
    </div>
  );
}
