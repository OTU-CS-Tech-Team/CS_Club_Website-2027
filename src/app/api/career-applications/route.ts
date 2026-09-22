import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendApplicationReceivedEmail } from '@/lib/email';
import { isMissingColumnError, packApplicationFallback, presentJob, readQuestionAnswers } from '@/lib/jobSections';

type StorageClient = ReturnType<typeof createAdminClient>;

const allowedYears = new Set(['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate']);
const fieldLimits = { firstName: 80, lastName: 80, email: 254, studentId: 20, program: 160, ideas: 2000 };

function getText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

const RESUME_LIMIT = 5 * 1024 * 1024;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const UPLOAD_LIMIT = 8;
const recentUploads = new Map<string, number[]>();

function recentStamps(key: string) {
  const now = Date.now();
  const stamps = (recentUploads.get(key) ?? []).filter((stamp) => now - stamp < UPLOAD_WINDOW_MS);
  recentUploads.set(key, stamps);
  return stamps;
}

function allowUpload(keys: string[]) {
  const stamps = keys.map((key) => recentStamps(key));
  if (stamps.some((entry) => entry.length >= UPLOAD_LIMIT)) return false;
  const now = Date.now();
  keys.forEach((key, index) => recentUploads.set(key, [...stamps[index], now]));
  return true;
}

function clientAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
}

function pdfError(file: File, bytes: Buffer) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (extension !== 'pdf') return 'Upload a PDF resume.';
  if (file.size <= 0 || file.size > RESUME_LIMIT || bytes.length > RESUME_LIMIT) return 'Resume must be 5 MB or smaller.';
  const head = bytes.subarray(0, 1024).toString('latin1');
  if (!head.includes('%PDF-')) return 'Upload a PDF resume.';
  return '';
}

async function storeResume(admin: StorageClient, jobId: string, bytes: Buffer) {
  const path = `${jobId}/${crypto.randomUUID()}.pdf`;
  const uploadFile = () => admin.storage.from('resumes').upload(path, bytes, { contentType: 'application/pdf', upsert: false });
  let upload = await uploadFile();
  if (upload.error && /bucket not found|not found/i.test(upload.error.message)) {
    await admin.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: RESUME_LIMIT,
      allowedMimeTypes: ['application/pdf'],
    });
    upload = await uploadFile();
  }
  if (upload.error) {
    console.error('Unable to store resume', { message: upload.error.message });
    return { error: 'We could not save your resume. Please try again.' };
  }
  return { path };
}

async function removeResume(admin: StorageClient, path: string) {
  const { error } = await admin.storage.from('resumes').remove([path]);
  if (error) console.error('Unable to remove unused resume', { message: error.message });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Please submit the form again.' }, { status: 400 });
  }
  const read = (name: string) => getText(form.get(name));

  const firstName = read('firstName');
  const lastName = read('lastName');
  const email = read('email').toLowerCase();
  const studentId = read('studentId');
  const year = read('year');
  const program = read('program');
  const ideas = read('ideas');
  const jobId = read('jobId');
  const resume = form.get('resume');

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
  let { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, description, sections')
    .eq('id', jobId)
    .eq('is_active', true)
    .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (isMissingColumnError(jobError)) {
    ({ data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, description')
      .eq('id', jobId)
      .eq('is_active', true)
      .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
      .maybeSingle());
  }
  if (isMissingColumnError(jobError)) {
    ({ data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, description')
      .eq('id', jobId)
      .eq('is_active', true)
      .maybeSingle());
  }
  if (jobError) {
    console.error('Unable to verify job availability', { code: jobError.code, message: jobError.message });
    return NextResponse.json({ error: 'We could not verify this job posting. Please try again.' }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: 'This job posting is no longer available.' }, { status: 400 });
  }
  if (!(resume instanceof File) || resume.size === 0) {
    return NextResponse.json({ error: 'Please upload your resume.' }, { status: 400 });
  }
  const resumeBytes = Buffer.from(await resume.arrayBuffer());
  const resumeProblem = pdfError(resume, resumeBytes);
  if (resumeProblem) return NextResponse.json({ error: resumeProblem }, { status: 400 });
  const presented = presentJob(typeof job.description === 'string' ? job.description : '', job.sections);
  const answerResult = readQuestionAnswers(presented.questions, read);
  if (!answerResult.ok) return NextResponse.json({ error: answerResult.message }, { status: 400 });
  if (!allowUpload([`ip:${clientAddress(request)}`, `email:${email}`])) {
    return NextResponse.json({ error: 'Too many applications were sent from this address. Try again later.' }, { status: 429 });
  }
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Resume uploads are not configured yet.' }, { status: 503 });
  }
  const storedResume = await storeResume(admin, jobId, resumeBytes);
  if ('error' in storedResume) return NextResponse.json({ error: storedResume.error }, { status: 400 });
  const application = {
    job_id: jobId,
    first_name: firstName,
    last_name: lastName,
    ontario_tech_email: email,
    student_id: studentId,
    year_of_study: year,
    program_of_study: program,
    ideas: ideas || null,
    resume_path: storedResume.path,
    answers: answerResult.answers,
  };
  let { error } = await admin.from('career_applications').insert(application);
  if (isMissingColumnError(error)) {
    const { answers: _answers, resume_path: _resumePath, ...withoutAnswers } = application;
    ({ error } = await admin.from('career_applications').insert({
      ...withoutAnswers,
      ideas: packApplicationFallback(ideas, answerResult.answers, storedResume.path),
    }));
  }

  if (error) {
    console.error('Unable to save application', { code: error.code, message: error.message });
    await removeResume(admin, storedResume.path);
    return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 });
  }
  const role = typeof job.title === 'string' && job.title.trim() ? job.title.trim() : 'this role';
  await sendApplicationReceivedEmail(email, role);
  return NextResponse.json({ ok: true });
}
