import { auth } from "@/api/auth/auth";
import { getTeamsData, getSports } from "./actions";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const session = await auth();

  const [data, sports] = await Promise.all([getTeamsData(), getSports()]);

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 1100, width: "100%" }}>
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Teams</h1>
          <p className="sp-page-subtitle">
            Browse all teams or create your own.
          </p>
        </div>
      </div>

      <TeamsClient
        teams={data?.allTeams ?? []}
        memberTeamIds={Array.from(data?.memberTeamIds ?? [])}
        sports={sports}
        userId={session?.user?.id ?? ""}
      />
    </div>
  );
}
