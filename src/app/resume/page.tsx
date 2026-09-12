import type { Metadata } from 'next'
import Link from 'next/link'
import { AskBot } from '@/components/bot/AskBot'
import { ViewSwitch } from '@/components/ViewSwitch'
import { identity, resume } from '@/content/profile'

export const metadata: Metadata = {
  title: `Resume, ${identity.name}`,
  description: identity.headline,
  alternates: { canonical: '/resume' },
}

export default function ResumePage() {
  return (
    <>
      <div className="hud top">
        <Link className="wordmark" href="/">
          {identity.name}
        </Link>
        <div className="actions">
          <ViewSwitch />
          <a className="btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </div>
      </div>
      <main>
      <article className="resume" id="content">
        <h1>
          <span>{identity.name}</span>
        </h1>
        <p className="role">{identity.headline}</p>
        <p className="contactline">
          {identity.location}. {identity.availability}. | {identity.phone} | {identity.email} | {identity.linkedin.href.replace('https://www.', '').replace(/\/$/, '')} | {identity.github.href.replace('https://', '')}
        </p>

        <h2>Summary</h2>
        <p>{resume.summary}</p>
        <p>
          <b>Core strengths:</b> {resume.strengths}
        </p>

        <h2>Experience</h2>
        {resume.experience.map((job) => (
          <div key={job.title}>
            <div className="job">
              <b>{job.title}</b>
              <span>{job.dates}</span>
            </div>
            <p className="where">{job.where}</p>
            <ul>
              {job.bullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
          </div>
        ))}

        <h2>Projects</h2>
        {resume.projects.map((p) => (
          <div key={p.title}>
            <div className="job">
              <b>{p.title}</b>
              <span>{p.dates}</span>
            </div>
            <p className="where">{p.where}</p>
            <ul>
              {p.bullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          <b>{resume.otherPlatforms.heading}</b>
        </p>
        <ul>
          {resume.otherPlatforms.items.map((it) => (
            <li key={it.title}>
              <b>{it.title}</b> {it.body}
            </li>
          ))}
        </ul>

        <h2>Skills</h2>
        <div className="skills">
          {resume.skills.map((s) => (
            <p key={s.label}>
              <b>{s.label}:</b> {s.text}
            </p>
          ))}
        </div>

        <h2>Education</h2>
        <p>
          <b>{resume.education.degree}</b> {resume.education.school}
        </p>
        <p>{resume.education.awards}</p>
      </article>
      </main>
      <AskBot page="other" />
    </>
  )
}
