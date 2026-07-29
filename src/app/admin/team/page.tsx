import { getTeamMembers } from '../actions';
import { TeamClient } from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const members = await getTeamMembers();

  const mappedMembers = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    createdAt: m.createdAt,
  }));

  return <TeamClient members={mappedMembers} />;
}
