import { connectDB } from '@/lib/mongodb';
import { checkAndUpdateInstanceDns } from '@/lib/provisioning/run-provision';
import type { TaskResult } from './types';

export async function handleSiteDnsCheck(): Promise<TaskResult> {
  const db = await connectDB();
  const pending = await db.siteInstances
    .find({
      status: { $in: ['awaiting_dns', 'dns_mismatch', 'dns_verified', 'active'] },
    })
    .toArray();

  let verified = 0;
  let mismatched = 0;

  for (const inst of pending) {
    const before = inst.status;
    const updated = await checkAndUpdateInstanceDns(inst.slug);
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
