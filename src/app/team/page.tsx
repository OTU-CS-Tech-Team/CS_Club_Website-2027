import "./team.css";
import TeamMemberCard from "@/app/team/memberCard";

export default function TeamPage() {
  return (
    <div className="page">
      <h1>Meet the Team</h1>
      {/* Presidents */}
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
      {/* Vice-Presidents */}
      <h2>Vice Presidents</h2>
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
      <div className = "department-grid">
      <div className="dept-row">
        {/* Technology Team */}
        <div className="Tech-Team">
          <h2>Tech Team</h2>
          <TeamMemberCard
            image="/images/Umad.png"
            name="Umad"
            role="Director of Technology"
            link="https://www.linkedin.com/in/umad-akram/"
          />
          <div className="dept-officers-coordinators">
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
          <TeamMemberCard
            image="/images/Xavier.png"
            name="Xavier"
            role="Technology Officer"
            link="https://www.linkedin.com/in/xavier-koch-527bb2387/"
          />
          </div>
        </div>
        {/* Marketing Team */}
        <div className="Marketing-Team">
          <h2>Marketing Team</h2>
          <TeamMemberCard
            image="/images/Amna.png"
            name="Amna"
            role="Director of Marketing"
            link="https://www.linkedin.com/in/amna--yousuf/"
          />
          <div className="dept-officers-coordinators">
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
          <TeamMemberCard
            image="/images/Qudsia.jpg"
            name="Qudsia"
            role="Marketing Coordinator"
            link="" /* Waiting for linkdln */
          />
          <TeamMemberCard
            image="/images/Atifa Baz photo.jpg"
            name="Atifa"
            role="Marketing Coordinator"
            link="" /* Waiting for linkdln */
          />
          </div>
        </div>
        {/* Logistics Team */}
        <div className="Logistics-Team">
          <h2>Logistics Team</h2>
          <TeamMemberCard
            image="/images/Ihsan.png"
            name="Ihsan"
            role="Director of Logistics"
            link="https://www.linkedin.com/in/mohammad-ihsan-wadid-47596b36b/"
          />
          <div className="dept-officers-coordinators">
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
        </div>
        <div className="dept-row">
        {/* Events Team */}
        <div className="Events-Team">
          <h2>Events Team</h2>
          <TeamMemberCard
            image="/images/Aravind.png"
            name="Aravind"
            role="Director of Events"
            link="https://www.linkedin.com/in/aravindnira/"
          />
          <div className="dept-officers-coordinators">
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
          <TeamMemberCard
            image="/images/Bach.png"
            name="Bach"
            role="Events Officer"
            link="https://www.linkedin.com/in/bach-nguyen-vu/"
          />
          <TeamMemberCard
            image="/images/placeholder.jpg"
            name="Zoha"
            role="Events Officer"
            link="" /* Waiting for linkdln */
          />
          </div>
        </div>
        {/* Sponsors Team */}
        <div className="Sponsors-Team">
          <h2>Sponsors Team</h2>
          <TeamMemberCard
            image="/images/Khalid.png"
            name="Khalid"
            role="Director of Sponsors"
            link="https://linkedin.com/in/Khalid"
          />
          <div className="dept-officers-coordinators">
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
          <TeamMemberCard
            image="/images/Rameen.png"
            name="Rameen"
            role="Partnerships Officer"
            link="" /* Waiting for LinkedIn link */
          />
          </div>
        </div>
        {/* Advisors */}
      
        {/* Skeleton for Meet the Team Page */}
      </div>
      <h2>Advisors</h2>
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
  );
}
