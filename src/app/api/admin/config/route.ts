import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const rows = await query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key]) as any[];
    return rows[0]?.setting_value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

async function setSetting(key: string, value: string) {
  await query(
    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
    [key, value]
  );
}

export async function GET() {
  try {
    await requireRole(['super_admin', 'editor']);
    const [siteName, allowRegistration, requireApproval, notifications, hideAncestralPrivacy, inAppMessage] = await Promise.all([
      getSetting('siteName', "Eriyadan's Legacy"),
      getSetting('allowRegistration', 'true'),
      getSetting('requireApproval', 'true'),
      getSetting('notifications', 'false'),
      getSetting('hideAncestralPrivacy', 'false'),
      getSetting('inAppMessage', ''),
    ]);
    return NextResponse.json({
      siteName,
      allowRegistration: allowRegistration !== 'false',
      requireApproval:   requireApproval !== 'false',
      notifications:     notifications === 'true',
      hideAncestralPrivacy: hideAncestralPrivacy === 'true',
      inAppMessage,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['super_admin']);
    const body = await request.json();
    const updates: Promise<void>[] = [];
    if (body.siteName !== undefined)          updates.push(setSetting('siteName', String(body.siteName)));
    if (body.allowRegistration !== undefined) updates.push(setSetting('allowRegistration', String(body.allowRegistration)));
    if (body.requireApproval !== undefined)   updates.push(setSetting('requireApproval', String(body.requireApproval)));
    if (body.notifications !== undefined)     updates.push(setSetting('notifications', String(body.notifications)));
    if (body.hideAncestralPrivacy !== undefined) updates.push(setSetting('hideAncestralPrivacy', String(body.hideAncestralPrivacy)));
    if (body.inAppMessage !== undefined)        updates.push(setSetting('inAppMessage', String(body.inAppMessage)));
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Config update error:', err);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
