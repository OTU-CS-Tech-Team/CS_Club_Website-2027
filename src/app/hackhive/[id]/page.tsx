import { notFound } from 'next/navigation';
import { Caveat } from 'next/font/google';
import ProjectDetailView from '@/components/hackhive/ProjectDetailView';
import { getProjectById, hackhiveProjects } from '@/data/hackhive';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return hackhiveProjects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return { title: 'Project not found' };
  return {
    title: `${project.title} — HackHive Archive`,
    description: project.description,
  };
}

export default async function HackHiveProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <ProjectDetailView
      project={project}
      handwrittenClass={caveat.className}
    />
  );
}
