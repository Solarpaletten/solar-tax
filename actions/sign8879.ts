// actions/sign8879.ts
await prisma.taxYear.update({
  where: { id: taxYearId },
  data: {
    signed8879: true,
    signedAt: new Date(),
    primaryPinHash: hashPin(primaryPin),
    ...(isMFJ && { spousePinHash: hashPin(spousePin) }),
    signed8879PrimaryAt: new Date(),
    ...(isMFJ && { signed8879SpouseAt: new Date() }),
  },
});