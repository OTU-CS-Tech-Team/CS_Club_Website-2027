"use client";

import "./team.css";
import { useEffect, useRef, useState } from "react";
import TeamMemberCard from "@/app/team/memberCard";
import DepartmentFilter from "@/app/team/departmentFilter";
import { teamData, type TeamMember } from "@/app/team/teamData";

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <TeamMemberCard
      image={member.Image}
      name={member.name}
      role={member.role}
      link={member.link}
    />
  );
}

// "row" groups have nobody below them, so they are just a line-free row of cards.
// "tree" groups are departments: the director on top, every officer/coordinator
// on one row below, joined by connector lines.
type TeamGroup = {
  id: string;
  name: string;
  kind: "row" | "tree";
  members: TeamMember[];
};

const groups: TeamGroup[] = [
  { id: "presidents", name: "Presidents", kind: "row", members: teamData.presidents },
  { id: "vice-presidents", name: "Vice Presidents", kind: "row", members: teamData.vicePresidents },
  { id: "tech", name: "Tech Team", kind: "tree", members: teamData.tech },
  { id: "marketing", name: "Marketing Team", kind: "tree", members: teamData.marketing },
  { id: "logistics", name: "Logistics Team", kind: "tree", members: teamData.logistics },
  { id: "events", name: "Events Team", kind: "tree", members: teamData.events },
  { id: "sponsors", name: "Sponsors Team", kind: "tree", members: teamData.sponsors },
  { id: "advisors", name: "Advisors", kind: "row", members: teamData.advisors },
];

export default function TeamPage() {
  const [selected, setSelected] = useState(groups[0].id);
  const pageRef = useRef<HTMLDivElement>(null);

  // The page is sized to exactly fill the space under the navbar so that only the
  // footer needs scrolling to. The navbar's height changes (it wraps on narrow
  // screens), so measure it instead of hard-coding it.
  useEffect(() => {
    const page = pageRef.current;
    const header = document.querySelector("body > header");
    if (!page || !header) return;

    const update = () =>
      page.style.setProperty("--nav-h", `${header.getBoundingClientRect().height}px`);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const group = groups.find((g) => g.id === selected) ?? groups[0];
  const [director, ...officers] = group.members;

  return (
    <div className="team-page" ref={pageRef}>
      <div className="team-filter-bar">
        <DepartmentFilter
          departments={groups}
          selected={selected}
          onChange={setSelected}
        />
      </div>

      <h1>Meet the Team</h1>

      <div className="team-stage">
        {group.kind === "row" ? (
          <section key={group.id} className="team-view">
            <h2>{group.name}</h2>
            <div className="team-row">
              {group.members.map((member) => (
                <MemberCard key={member.name} member={member} />
              ))}
            </div>
          </section>
        ) : (
          <section key={group.id} className="team-view team-tree">
            <h2>{group.name}</h2>
            <MemberCard member={director} />
            <div className="tree-trunk"></div>
            <div className="tree-officers">
              {officers.map((member) => (
                <div key={member.name} className="officer">
                  <MemberCard member={member} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
