import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const allowedYears = new Set(['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate']);
const fieldLimits = { firstName: 80, lastName: 80, email: 254, studentId: 20, program: 160, ideas: 2000 };

function getText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Please submit the form again.' }, { status: 400 });
  }

  const firstName = getText(body.firstName);
  const lastName = getText(body.lastName);
  const email = getText(body.email).toLowerCase();
  const studentId = getText(body.studentId);
  const year = getText(body.year);
  const program = getText(body.program);
  const ideas = getText(body.ideas);
  const jobId = getText(body.jobId);

  if (!firstName || !lastName || !email || !studentId || !year || !program || !jobId) {
    return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
  }
  if (Object.entries({ firstName, lastName, email, studentId, program, ideas }).some(([field, value]) => value.length > fieldLimits[field as keyof typeof fieldLimits])) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 });
  }
  if (!/^[^\s@]+@ontariotechu\.net$/.test(email)) {
    return NextResponse.json({ error: 'Please use your Ontario Tech email address.' }, { status: 400 });
  }
  if (!/^1\d{8}$/.test(studentId) || !allowedYears.has(year)) {
    return NextResponse.json({ error: 'Please check your student ID and year of study.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Applications are not configured yet.' }, { status: 503 });
  }

  const supabase = createClient(url, key);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(jobId)) {
    return NextResponse.json({ error: 'This job posting is not available.' }, { status: 400 });
  }
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('is_active', true)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ error: 'This job posting is no longer available.' }, { status: 400 });
  }
  const { error } = await supabase.from('career_applications').insert({
    job_id: jobId,
    first_name: firstName,
    last_name: lastName,
    ontario_tech_email: email,
    student_id: studentId,
    year_of_study: year,
    program_of_study: program,
    ideas: ideas || null,
  });

  if (error) return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
