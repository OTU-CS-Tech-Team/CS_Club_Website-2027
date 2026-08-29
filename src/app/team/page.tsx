import TeamMemberCard from "@/app/team/memberCard";

export default function TeamPage() {
  return (
    <div className="page">
      <h1>Meet the Team</h1>
      {/* Presidents */}
      <div className="top-tree">
        <TeamMemberCard
          image="/images/Maryam.png"
          name="Maryam "
          role="Co-President"
          link="https://linkedin.com/in/Maryam"
        />
        <TeamMemberCard
          image="/images/Abdul.png"
          name="Abdul"
          role="Co-President"
          link="https://linkedin.com/in/Abdul"
        />
      </div>
      {/* Co-Presidents */}
      <div className="top2-tree">
        <TeamMemberCard
          image="/images/Ata-us-Samad.png"
          name="Ata-us-Samad"
          role="Co-President"
          link="https://linkedin.com/in/Ata-us-Samad"
        />
        <TeamMemberCard
          image="/images/Samir.png"
          name="Samir"
          role="Co-President"
          link="https://linkedin.com/in/Samir"
        />
      </div>
      {/* Technology Team */}
      <div className="Tech Team">
        <TeamMemberCard
          image="/images/Umad.png"
          name="Umad"
          role="Director of Technology"
          link="https://linkedin.com/in/Umad"
        />
        <TeamMemberCard
          image="/images/Haseeb.png"
          name="Haseeb"
          role="Technology Officer"
          link="https://linkedin.com/in/Haseeb"
        />
        <TeamMemberCard
          image="/images/Xavier.png"
          name="Xavier"
          role="Technology Officer"
          link="https://linkedin.com/in/Xavier"
        />
        <TeamMemberCard
          image="/images/Tabish.png"
          name="Tabish"
          role="Technology Officer"
          link="https://linkedin.com/in/Tabish"
        />
      </div>
      {/* Marketing Team */}
      <div className="Marketing Team">
        <TeamMemberCard
          image="/images/Amna.png"
          name="Amna"
          role="Director of Marketing"
          link="https://linkedin.com/in/Amna"
        />
        <TeamMemberCard
          image="/images/Amitav.png"
          name="Amitav"
          role="UI/UX Designer"
          link="https://linkedin.com/in/Amitav"
        />
        <TeamMemberCard
          image="/images/Hemanti.png"
          name="Hemanti"
          role="Marketing Coordinator"
          link="https://linkedin.com/in/Hemanti"
        />
        <TeamMemberCard
          image="/images/Qudsia.png"
          name="Qudsia"
          role="Marketing Coordinator"
          link="https://linkedin.com/in/Qudsia"
        />
        <TeamMemberCard
          image="/images/Atifa.png"
          name="Atifa"
          role="Marketing Coordinator"
          link="https://linkedin.com/in/Atifa"
        />
      </div>
      {/* Logistics Team */}
      <div className="Logistics Team">
        <TeamMemberCard
          image="/images/Ihsan.png"
          name="Ihsan"
          role="Director of Logistics"
          link="https://linkedin.com/in/Ihsan"
        />
        <TeamMemberCard
          image="/images/Aakash.png"
          name="Aakash"
          role="Tech Logistics Officer"
          link="https://linkedin.com/in/Aakash"
        />
        <TeamMemberCard
          image="/images/Akeel.png"
          name="Akeel"
          role="Logistics Officer"
          link="https://linkedin.com/in/Akeel"
        />
      </div>
      {/* Events Team */}
      <div className="Events Team">
        <TeamMemberCard
          image="/images/Aravind.png"
          name="Aravind"
          role="Director of Events"
          link="https://linkedin.com/in/Aravind"
        />
        <TeamMemberCard
          image="/images/Thomas.png"
          name="Thomas"
          role="Events Coordinator"
          link="https://linkedin.com/in/Thomas"
        />
        <TeamMemberCard
          image="/images/Haris.png"
          name="Haris"
          role="Events Coordinator"
          link="https://linkedin.com/in/Haris"
        />
        <TeamMemberCard
          image="/images/Bach.png"
          name="Bach"
          role="Events Officer"
          link="https://linkedin.com/in/Bach"
        />
      </div>
      {/* Sponsors Team */}
      <div className="Sponsors Team">
        <TeamMemberCard
          image="/images/Khalid.png"
          name="Khalid"
          role="Director of Sponsors"
          link="https://linkedin.com/in/Khalid"
        />
        <TeamMemberCard
          image="/images/Monty.png"
          name="Monty"
          role="Partnerships Officer"
          link="https://linkedin.com/in/Monty"
        />
        <TeamMemberCard
          image="/images/Bushrat.png"
          name="Bushrat"
          role="Partnerships Officer"
          link="https://linkedin.com/in/Bushrat"
        />
        <TeamMemberCard
          image="/images/Rameen.png"
          name="Rameen"
          role="Partnerships Officer"
          link="https://linkedin.com/in/Rameen"
        />
      </div>
      <p>Skeleton for club leadership and member profiles.</p>
    </div>
  );
}
