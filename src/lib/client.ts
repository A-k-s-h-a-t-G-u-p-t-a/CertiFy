
import { createThirdwebClient } from "thirdweb";
import {
    getContract,
  } from "thirdweb";
  import { defineChain } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: "46d711b3df7e82f546ee080b590da647", // Get this from your thirdweb dashboard
  // 792b2a1edc81ec4d80a147aa5b4bf753
});
export const contract = getContract({
    client,
    chain: defineChain(11155111),
    address: "0x6601b9e1272d02bC3AdC4353fC11b5c57BF2C22d",
  });