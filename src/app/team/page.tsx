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

// "All" isn't a group of its own: it draws every group as one org chart.
const ALL_ID = "all";
const filterOptions = [{ id: ALL_ID, name: "All" }, ...groups];

const groupById = (id: string) => groups.find((g) => g.id === id)!;

// Lines that join a row of `count` cards to a single point. The spans are sized from
// the card width and gap in CSS, so each stem lands on the centre of a card.
// "merge" sits below a row (card stems -> bar -> one line down); "fork" sits above
// one (one line down -> bar -> a stem into each card).
// `trunk={false}` leaves the single line undrawn so something below can draw it instead.
function RowConnector({
  count,
  kind,
  trunk = true,
}: {
  count: number;
  kind: "merge" | "fork";
  trunk?: boolean;
}) {
  const style = { "--count": count } as React.CSSProperties;
  const stems = (
    <div className="all-stems" style={style}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}></span>
      ))}
    </div>
  );
  const bar = <div className="all-bar" style={style}></div>;

  return (
    <div className="all-connector" aria-hidden="true">
      {kind === "merge" ? (
        <>
          {stems}
          {bar}
          {/* Kept as a spacer when not drawn so the gap to the next bar stays the same. */}
          <div className={`all-trunk ${trunk ? "" : "all-trunk--spacer"}`}></div>
        </>
      ) : (
        <>
          <div className="all-trunk"></div>
          {bar}
          {stems}
        </>
      )}
    </div>
  );
}

// Presidents -> VPs -> every director on one row, each with their officers and
// coordinators stacked in a column beneath them. Advisors sit apart at the end.
function AllTeamsView() {
  const departments = groups.filter((g) => g.kind === "tree");
  const presidents = groupById("presidents").members;
  const vicePresidents = groupById("vice-presidents").members;
  // With an odd number of departments the middle one sits directly under the VPs,
  // so it draws the whole drop from the VP bar itself: one element, no seam to
  // round to a different pixel than the line above it.
  const centerIndex = departments.length % 2 === 1 ? (departments.length - 1) / 2 : -1;

  return (
    <section className="team-view team-all">
      <h2>Presidents</h2>
      <div className="team-row">
        {presidents.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
      <RowConnector count={presidents.length} kind="merge" />

      <h2 className="all-tier-heading">Vice Presidents</h2>
      <RowConnector count={vicePresidents.length} kind="fork" />
      <div className="team-row">
        {vicePresidents.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
      <RowConnector count={vicePresidents.length} kind="merge" trunk={centerIndex === -1} />

      <div className="all-departments">
        {departments.map((dept, i) => {
          const [director, ...officers] = dept.members;
          return (
            <div key={dept.id} className={`all-dept ${i === centerIndex ? "all-dept--center" : ""}`}>
              <h2>{dept.name}</h2>
              <MemberCard member={director} />
              <div className="all-officers">
                {officers.map((member) => (
                  <div key={member.name} className="all-officer">
                    <MemberCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="all-advisors-heading">Advisors</h2>
      <div className="team-row">
        {groupById("advisors").members.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

export default function TeamPage() {
  const [selected, setSelected] = useState(ALL_ID);
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

  const isAll = selected === ALL_ID;
  const group = groups.find((g) => g.id === selected) ?? groups[0];
  const [director, ...officers] = group.members;

  return (
    <div className={`team-page ${isAll ? "team-page--all" : ""}`} ref={pageRef}>
      <div className="team-filter-bar">
        <DepartmentFilter
          departments={filterOptions}
          selected={selected}
          onChange={setSelected}
        />
      </div>

      <h1>Meet the Team</h1>

      <div className="team-stage">
        {isAll ? (
          <AllTeamsView />
        ) : group.kind === "row" ? (
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
