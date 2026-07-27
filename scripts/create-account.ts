/**
 * Creates or updates a Treax account from the command line.
 *
 *   pnpm account --email a@b.com --password 'secret' --name 'Full Name' --role ADMIN
 *
 * Flags:
 *   --email     (required)
 *   --password  (required, min 8)
 *   --name      defaults to the local part of the email
 *   --handle    defaults to a free handle derived from the name
 *   --role      BUILDER (default) | EXPERT | ADMIN
 *   --university, --building, --focus, --bio
 *
 * Re-running with the same email updates that account (including its password
 * and role) rather than failing, so it doubles as a password reset for local
 * and staging environments.
 */
import { PrismaClient, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { colorFor, normalizeHandle, HANDLE_RE } from '../src/lib/handle';
import { initialsOf } from '../src/lib/types';

const db = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

async function freeHandle(seed: string, forEmail: string): Promise<string> {
  const base = (normalizeHandle(seed.replace(/\s+/g, '')) || 'builder').slice(0, 16);
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const taken = await db.user.findUnique({ where: { handle: candidate }, select: { email: true } });
    if (!taken || taken.email === forEmail) return candidate;
  }
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const password = arg('password');
  const role = (arg('role')?.toUpperCase() ?? 'BUILDER') as Role;

  if (!email) fail('Missing --email');
  if (!password) fail('Missing --password');
  if (password.length < 8) fail('Password must be at least 8 characters.');
  if (!['BUILDER', 'EXPERT', 'ADMIN'].includes(role)) fail(`Unknown role "${role}". Use BUILDER, EXPERT or ADMIN.`);

  const name = arg('name')?.trim() || email.split('@')[0];
  const requested = arg('handle');
  if (requested && !HANDLE_RE.test(normalizeHandle(requested))) {
    fail('Handles are 3-20 characters: letters, numbers and underscores.');
  }
  const handle = requested ? normalizeHandle(requested) : await freeHandle(name, email);

  const clash = await db.user.findUnique({ where: { handle }, select: { email: true } });
  if (clash && clash.email !== email) fail(`The handle @${handle} is already taken by ${clash.email}.`);

  const passwordHash = await bcrypt.hash(password, 12);

  const shared = {
    name,
    handle,
    passwordHash,
    role,
    initials: initialsOf(name),
    avatarColor: colorFor(email),
    university: arg('university') ?? null,
    building: arg('building') ?? null,
    focus: arg('focus') ?? null,
    bio: arg('bio') ?? null,
    // Created accounts skip the setup flow so they land straight on the feed.
    onboardingDone: true,
    onboardingStep: 3,
    signupStep: 3,
    verified: role === 'ADMIN',
    suspended: false,
  };

  const user = await db.user.upsert({
    where: { email },
    create: { email, ...shared },
    update: shared,
    select: { id: true, email: true, handle: true, role: true, createdAt: true, updatedAt: true },
  });

  const created = user.createdAt.getTime() === user.updatedAt.getTime();
  console.log(`\n  ${created ? 'Created' : 'Updated'} ${user.role}: ${user.email}  @${user.handle}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
