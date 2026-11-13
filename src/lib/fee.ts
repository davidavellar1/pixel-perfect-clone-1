/**
 * Single source of truth for the DHC Market success-fee rule.
 * Render this constant everywhere the fee is mentioned. Do not paraphrase it.
 */
export const FEE_SENTENCE =
  "Listing is free to the developer. A success fee of 1% of the amount invested is payable by the investor on financial close with a developer introduced here, within 36 months of the logged introduction. Either party may report a close; the other confirms before any invoice is raised.";

export const FEE_RATE = 0.01;

export const calculateSuccessFee = (amountInvested: number) => amountInvested * FEE_RATE;
