import { getClientWorkspaceData } from './actions';
import ClientWorkspace from './ClientWorkspace';

export const dynamic = 'force-dynamic';

export default async function ClientPage() {
  const data = await getClientWorkspaceData();

  return (
    <ClientWorkspace
      initialProjects={data.projects}
      initialMeetings={data.meetings}
      clientName={data.client?.name || 'Workspace'}
    />
  );
}
