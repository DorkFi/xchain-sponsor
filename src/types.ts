export type SponsorLegStatus = "sent" | "skipped" | "error";

export type SponsorLeg = {
  status: SponsorLegStatus;
  txHash?: string;
  reason?: string;
  error?: string;
};

export type SponsorResult = {
  evmAddress: string;
  algorandAddress: string | null;
  eth: SponsorLeg;
  algo: SponsorLeg;
};
