"use client";

import "./team.css";
import { useState } from "react";
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
const departmentList = [
  { id: "presidents", name: "Presidents" },
  { id: "vice-presidents", name: "Vice Presidents" },
  { id: "tech", name: "Tech Team" },
  { id: "marketing", name: "Marketing Team" },
  { id: "logistics", name: "Logistics Team" },
  { id: "events", name: "Events Team" },
  { id: "sponsors", name: "Sponsors Team" },
  { id: "advisors", name: "Advisors" },
];

// The five "department" filters, in the order they're drawn left-to-right.
const deptIds = ["tech", "marketing", "logistics", "events", "sponsors"];

export default function TeamPage() {
  const [selected, setSelected] = useState<string[]>(departmentList.map((d) => d.id));

  const showPresidents = selected.includes("presidents");
  const showVPs = selected.includes("vice-presidents");
  const upperDeptIds = ["tech", "marketing", "events"];
  const lowerDeptIds = ["logistics", "sponsors"];
  const selectedUpperDepts = upperDeptIds.filter((id) => selected.includes(id));
  const selectedLowerDepts = lowerDeptIds.filter((id) => selected.includes(id));
  const selectedDepts = deptIds.filter((id) => selected.includes(id));
  const hasDepts = selectedDepts.length > 0;
  const showAdvisors = selected.includes("advisors");
  const deptCount = Math.max(selectedUpperDepts.length, selectedLowerDepts.length);
  // Only draw a stem into a department column if something above it is actually
  // visible to connect from (or it's grouped with a sibling department) —
  // otherwise isolating one department via "Only" leaves a stem dangling above its heading.
  const showTreeAbove = showPresidents || showVPs;
  const upperTierActive = showTreeAbove || selectedUpperDepts.length > 1;
  const lowerTierActive =
    selectedUpperDepts.length > 0 || showTreeAbove || selectedLowerDepts.length > 1;

  // Keep each visible department and its connector on the same grid track.
  const getDeptColumn = (id: string) => {
    const row = lowerDeptIds.includes(id) ? selectedLowerDepts : selectedUpperDepts;
    const index = row.indexOf(id);
    if (lowerDeptIds.includes(id) && selectedLowerDepts.length === 1) {
      return Math.ceil(deptCount / 2);
    }
    if (lowerDeptIds.includes(id) && selectedLowerDepts.length === 2 && deptCount === 3) {
      return index * 2 + 1;
    }
    return index === -1 ? undefined : index + 1;
  };

  return (
    <div className="page">
      <div className="top-bar">
        <DepartmentFilter
          departments={departmentList}
          selected={selected}
          onChange={setSelected}
        />
      </div>

      <h1>Meet the Team</h1>

      {/* Presidents Section */}
      <div
        className={`executive-section presidents-section ${
          showPresidents ? "" : "hidden"
        }`}
      >
        <h2>Presidents</h2>

        <div className="Presidents">
          {teamData.presidents.map((member) => (
          <MemberCard key={member.name} member={member} />
          ))}
        </div>

        {/* Only draw the line down out of Presidents if there's something below to connect to */}
        {(showVPs || hasDepts || showAdvisors) && (
          <div className="president-merge">
            <div className="president-stems">
              <span></span>
              <span></span>
            </div>
            <div className="president-bar"></div>
            <div className="president-center-line"></div>
          </div>
        )}
      </div>

      {/* Vice-Presidents Section */}
      <div
        className={`executive-section vice-presidents-section ${
          showVPs ? "" : "hidden"
        }`}
      >
        <div className="heading-v-wrapper">
          <h2>Vice Presidents</h2>

          {showPresidents && (
            <span className="v-stem-bottom"></span>
          )}
        </div>

        {showPresidents && (
          <div className="vp-top-fork">
            <div className="fork-bar"></div>

            <div className="fork-stems">
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div className="Vice-Presidents">
          {teamData.vicePresidents.map((member) => (
          <MemberCard key={member.name} member={member} />
          ))}
        </div>

        {/* Only draw the line down into the department tree if a department is visible */}
        {(hasDepts || showAdvisors) && (
          <div className="pair-merge-bracket">
            <div className="bracket-stems">
              <span></span>
              <span></span>
            </div>
            <div className="bracket-bar"></div>
            {/* Bridges the VP merge point down into the department fan-out below */}
            <div className="center-v-line"></div>
          </div>
        )}
      </div>

      <div className="department-grid">
        <div className={`dept-tree-wrapper ${hasDepts ? "" : "hidden"}`}>
          <div
            className={`dept-row dept-count-${deptCount} upper-count-${selectedUpperDepts.length} lower-count-${selectedLowerDepts.length}`}
          >
            {selectedUpperDepts.length > 1 && <div className="branch-line-main"></div>}
            {upperTierActive &&
              selectedUpperDepts.map((id, index) => (
                <span
                  key={id}
                  className="branch-stem"
                  style={{ gridColumn: index + 1 }}
                ></span>
              ))}

            {selectedLowerDepts.length > 0 && (
              <div className={`lower-tier-connector lower-count-${selectedLowerDepts.length}`}>
                {(selectedUpperDepts.length > 0 || showVPs || showPresidents) && <span className="lower-tier-in" />}
                {selectedLowerDepts.length > 1 && <span className="lower-tier-bar" />}
                {lowerTierActive && (
                  <div className="lower-tier-stems">
                    {selectedLowerDepts.map((id) => <span key={id} />)}
                  </div>
                )}
              </div>
            )}

            {/* Tech Team */}
            <div
              className={`Tech-Team dept-column ${selected.includes("tech") ? "" : "hidden"}`}
              style={{ gridColumn: getDeptColumn("tech") }}
            >
              <div className="heading-v-wrapper">
                <h2>Tech Team</h2>
                <span className="v-stem-bottom"></span>
              </div>

              <MemberCard member={teamData.tech[0]} />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                {teamData.tech.slice(1, 3).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>

              <div className="officer-merge-2">
                <div className="merge-stems">
                  <span></span>
                  <span></span>
                </div>
                <div className="merge-bar"></div>
                <div className="center-v-line"></div>
              </div>

              <div className="small-card-wrapper">
                <MemberCard member={teamData.tech[3]} />
              </div>
            </div>

            {/* Marketing Team */}
            <div
              className={`Marketing-Team dept-column ${selected.includes("marketing") ? "" : "hidden"}`}
              style={{ gridColumn: getDeptColumn("marketing") }}
            >
              <div className="heading-v-wrapper">
                <h2>Marketing Team</h2>
                <span className="v-stem-bottom"></span>
              </div>

              <MemberCard member={teamData.marketing[0]} />
              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                {teamData.marketing.slice(1, 3).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>

              <div className="officer-merge-2">
                <div className="merge-stems">
                  <span></span>
                  <span></span>
                </div>
                <div className="merge-bar"></div>
                <div className="center-v-line"></div>
              </div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                {teamData.marketing.slice(3, 5).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </div>

            {/* Logistics Team */}
            <div
              className={`Logistics-Team dept-column ${selected.includes("logistics") ? "" : "hidden"}`}
              style={{ gridColumn: getDeptColumn("logistics") }}
            >
              <div className="heading-v-wrapper">
                <h2>Logistics Team</h2>
                <span className="v-stem-bottom"></span>
              </div>

              <MemberCard member={teamData.logistics[0]} />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>
            <div className="side-by-side-row">

              {teamData.logistics.slice(1).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </div>

            {/* Events Team */}
            <div
              className={`Events-Team dept-column ${selected.includes("events") ? "" : "hidden"}`}
              style={{ gridColumn: getDeptColumn("events") }}
            >
              <div className="heading-v-wrapper">
                <h2>Events Team</h2>
                <span className="v-stem-bottom"></span>
              </div>

              <MemberCard member={teamData.events[0]} />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                {teamData.events.slice(1, 3).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>

              <div className="officer-merge-2">
                <div className="merge-stems">
                  <span></span>
                  <span></span>
                </div>
                <div className="merge-bar"></div>
                <div className="center-v-line"></div>
              </div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                {teamData.events.slice(3, 5).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </div>

            {/* Sponsors Team */}
            <div
              className={`Sponsors-Team dept-column ${selected.includes("sponsors") ? "" : "hidden"}`}
              style={{ gridColumn: getDeptColumn("sponsors") }}
            >
              <div className="heading-v-wrapper">
                <h2>Sponsors Team</h2>
                <span className="v-stem-bottom"></span>
              </div>

              <MemberCard member={teamData.sponsors[0]} />

              <div className="center-v-line"></div>

              <div className="officer-fork-3">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row sponsors-officer-row">
                {teamData.sponsors.slice(1).map((member) => (
                <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advisors Section */}
        <div className={showAdvisors ? "advisors-tree" : "hidden"}>
          {(hasDepts || showVPs || showPresidents) && <div className="advisors-in-line" />}
          <h2>Advisors</h2>
          <div className="advisors-fanout"><span /><span /><span /><span /><span /></div>
          <div className="Advisors">
            {teamData.advisors.map((member) => (
            <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
