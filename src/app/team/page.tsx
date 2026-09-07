"use client";

import "./team.css";
import { useState } from "react";
import TeamMemberCard from "@/app/team/memberCard";
import DepartmentFilter from "@/app/team/departmentFilter";

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
          <TeamMemberCard
            image="/images/Maryam.png"
            name="Maryam"
            role="Co-President"
            link="https://www.linkedin.com/in/maryam-baz-mb1423/"
          />

          <TeamMemberCard
            image="/images/Abdul.png"
            name="Abdul"
            role="Co-President"
            link="https://www.linkedin.com/in/abdul-muqit-afzal/"
          />
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
          {/* The president connection supplies the line above this heading */}
          <h2>Vice Presidents</h2>
          <span className="v-stem-bottom"></span>
        </div>

        {/* Fork going down into Vice President cards */}
        <div className="vp-top-fork">
          <div className="fork-bar"></div>
          <div className="fork-stems">
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="Vice-Presidents">
          <TeamMemberCard
            image="/images/Samad.jpg"
            name="Ata-us-Samad"
            role="Vice-President"
            link="https://www.linkedin.com/in/samadaku/"
          />

          <TeamMemberCard
            image="/images/Samir.png"
            name="Samir"
            role="Vice-President"
            link="https://www.linkedin.com/in/samir-chowdhury23/"
          />
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
            {selectedUpperDepts.length > 0 &&
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
                <div className="lower-tier-stems">
                  {selectedLowerDepts.map((id) => <span key={id} />)}
                </div>
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

              <TeamMemberCard
                image="/images/Umad.png"
                name="Umad"
                role="Director of Technology"
                link="https://www.linkedin.com/in/umad-akram/"
              />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                <TeamMemberCard
                  image="/images/Haseeb.png"
                  name="Haseeb"
                  role="Technology Officer"
                  link="https://www.linkedin.com/in/haseeb-khann/"
                />
                <TeamMemberCard
                  image="/images/Tabish.png"
                  name="Tabish"
                  role="Technology Officer"
                  link="https://www.linkedin.com/in/tabish-ghouri/"
                />
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
                <TeamMemberCard
                  image="/images/Xavier.png"
                  name="Xavier"
                  role="Technology Officer"
                  link="https://www.linkedin.com/in/xavier-koch-527bb2387/"
                />
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

              <TeamMemberCard
                image="/images/Amna.png"
                name="Amna"
                role="Director of Marketing"
                link="https://www.linkedin.com/in/amna--yousuf/"
              />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                <TeamMemberCard
                  image="/images/Amitav.png"
                  name="Amitav"
                  role="UI/UX Designer"
                  link="https://www.linkedin.com/in/amitav-sonawane/"
                />
                <TeamMemberCard
                  image="/images/Hemanti.png"
                  name="Hemanti"
                  role="Marketing Coordinator"
                  link="https://www.linkedin.com/in/hemanti-badam-9b6986396/"
                />
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
                <TeamMemberCard
                  image="/images/Qudsia.jpg"
                  name="Qudsia"
                  role="Marketing Coordinator"
                  link=""
                />
                <TeamMemberCard
                  image="/images/Atifa Baz photo.jpg"
                  name="Atifa"
                  role="Marketing Coordinator"
                  link=""
                />
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

              <TeamMemberCard
                image="/images/Ihsan.png"
                name="Ihsan"
                role="Director of Logistics"
                link="https://www.linkedin.com/in/mohammad-ihsan-wadid-47596b36b/"
              />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                <TeamMemberCard
                  image="/images/Aakash.png"
                  name="Aakash"
                  role="Tech Logistics Officer"
                  link="https://www.linkedin.com/in/aakashharen/"
                />
                <TeamMemberCard
                  image="/images/Akeell.png"
                  name="Akeell"
                  role="Logistics Officer"
                  link="https://www.linkedin.com/in/akeell-parameswaran/"
                />
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

              <TeamMemberCard
                image="/images/Aravind.png"
                name="Aravind"
                role="Director of Events"
                link="https://www.linkedin.com/in/aravindnira/"
              />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                <TeamMemberCard
                  image="/images/Thomas.jpg"
                  name="Thomas"
                  role="Events Coordinator"
                  link="https://www.linkedin.com/in/thomas-mitchinson/"
                />
                <TeamMemberCard
                  image="/images/Haris.png"
                  name="Haris"
                  role="Events Coordinator"
                  link="https://www.linkedin.com/in/haris-khan-915300246/"
                />
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
                <TeamMemberCard
                  image="/images/Bach.png"
                  name="Bach"
                  role="Events Officer"
                  link="https://www.linkedin.com/in/bach-nguyen-vu/"
                />
                <TeamMemberCard
                  image="/images/Zoha.jpeg"
                  name="Zoha"
                  role="Events Officer"
                  link=""
                />
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

              <TeamMemberCard
                image="/images/Khalid.png"
                name="Khalid"
                role="Director of Sponsors"
                link="https://linkedin.com/in/Khalid"
              />

              <div className="center-v-line"></div>

              <div className="officer-fork-2">
                <div className="fork-bar"></div>
                <div className="fork-stems">
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="side-by-side-row">
                <TeamMemberCard
                  image="/images/Monty.png"
                  name="Monty"
                  role="Partnerships Officer"
                  link="https://www.linkedin.com/in/monty-abdi-94a5a8371/"
                />
                <TeamMemberCard
                  image="/images/Bushrat.png"
                  name="Bushrat"
                  role="Partnerships Officer"
                  link="https://www.linkedin.com/in/bushratzahan/"
                />
              </div>

              <div className="officer-merge-2">
                <div className="merge-stems">
                  <span></span>
                  <span></span>
                </div>
                <div className="merge-bar"></div>
                <div className="center-v-line"></div>
              </div>

              <div className="small-card-wrapper rameen-card">
                <TeamMemberCard
                  image="/images/Rameen.png"
                  name="Rameen"
                  role="Partnerships Officer"
                  link=""
                />
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
            <TeamMemberCard
              image="/images/Kevin.png"
              name="Kevin"
              role="Advisor"
              link="https://www.linkedin.com/in/kevintheinnovator/"
            />
            <TeamMemberCard
              image="/images/Wasay.jpg"
              name="Wasay"
              role="Advisor"
              link="https://www.linkedin.com/in/wasayaamir/"
            />
            <TeamMemberCard
              image="/images/Taha.png"
              name="Taha"
              role="Advisor"
              link="https://www.linkedin.com/in/taha-rana-haha/"
            />
            <TeamMemberCard
              image="/images/Hayden.png"
              name="Hayden"
              role="Advisor"
              link="https://www.linkedin.com/in/haydenpmac/"
            />
            <TeamMemberCard
              image="/images/Edrees.png"
              name="Edrees"
              role="Advisor"
              link="https://www.linkedin.com/in/edrees-amiri/"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
