import { redirectToDashboard } from '@/actions/dashboard-redirect';

export async function GET() {
  return redirectToDashboard();
}
