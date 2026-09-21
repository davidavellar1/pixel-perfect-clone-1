/**
 * Single source of truth for the DHC Market success-fee rule.
 * Render this constant everywhere the fee is mentioned. Do not paraphrase it.
 */
export const FEE_SENTENCE =
  "Listing is free to the developer. A success fee of 1% of the amount invested is payable by the investor on financial close with a developer introduced here, within 36 months of the logged introduction. Either party may report a close; the other confirms before any invoice is raised.";

/** Fee base is the amount invested, not project capex and not enterprise value. */
export const FEE_BASE_NOTE =
  "The fee base is the amount invested. Invest 8M and the fee is 80k.";

export const FEE_PAYER_LINE = "Payable by: Investor";

export const FEE_RATE = 0.01;

export const calculateSuccessFee = (amountInvested: number) => amountInvested * FEE_RATE;

/** Wording used on the confidentiality gate and the wizard mandate. */
export const NDA_DOCUMENT_VERSION = "v1.0";
