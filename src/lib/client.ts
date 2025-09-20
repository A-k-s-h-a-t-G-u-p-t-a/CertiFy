
import { createThirdwebClient } from "thirdweb";
import {
    getContract,
  } from "thirdweb";
  import { defineChain } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: "46d711b3df7e82f546ee080b590da647", // Get this from your thirdweb dashboard
});
export const contract = getContract({
    client,
    chain: defineChain(11155111),
    address: "0xFF1F0D5f4c27B22dB93B2c1334BBD1BD4bE07A99",
  });