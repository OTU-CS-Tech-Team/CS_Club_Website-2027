type TeamMemberProps = {
  image: string;
  name: string;
  role: string;
  link: string;
};

export default function TeamMemberCard(props: TeamMemberProps) {
  return (
    <div className="teamCard">
      <img src= {props.image} alt= {`Photo of ${props.name}`}/>
      <h3>{props.name}</h3>
      <span>{props.role}</span>
      <a href={props.link} target="_blank" rel="noopener noreferrer">
        <img src="Images/LinkedinLogo.png" alt="LinkedIn Logo" />
      </a>
    </div>
  );
}