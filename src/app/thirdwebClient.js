import { createThirdwebClient } from "thirdweb";

// Configure the client with your necessary settings
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "YOUR_CLIENT_ID", // replace with your client ID
  secretKey: process.env.THIRDWEB_SECRET_KEY, // optional: only if using on server-side
  supportedChains: ["ethereum", "polygon"], // Add chains you want to support
});