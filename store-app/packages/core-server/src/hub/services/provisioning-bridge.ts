/** Bridge to store-app provisioning (shared MongoDB + filesystem) */
export async function triggerProvisioningForOrder(orderId: string) {
  const mod = await import('../../../../../src/lib/provisioning/run-provision');
  return mod.triggerProvisioningForOrder(orderId);
}

export async function checkAndUpdateInstanceDns(slug: string) {
  const mod = await import('../../../../../src/lib/provisioning/run-provision');
  return mod.checkAndUpdateInstanceDns(slug);
}

export async function runBatchDnsCheck() {
  const { connectHubDb } = await import('@core-shared');
  const db = await connectHubDb();
  const pending = await db
    .collection('siteInstances')
    .find({ status: { $in: ['awaiting_dns', 'dns_mismatch', 'dns_verified', 'active'] } })
    .toArray();

  let verified = 0;
  let mismatched = 0;

  for (const inst of pending) {
    const before = String(inst.status);
    const updated = await checkAndUpdateInstanceDns(String(inst.slug));
    if (!updated) continue;
    if (updated.status === 'active' && before !== 'active') verified++;
    if (updated.status === 'dns_mismatch') mismatched++;
  }

  return {
    success: true,
    message: `DNS check: ${pending.length} instances, ${verified} activated, ${mismatched} mismatch`,
    details: { total: pending.length, verified, mismatched },
  };
}
