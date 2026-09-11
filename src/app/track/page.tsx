import { redirect } from 'next/navigation'

// The track is the home page now; old links keep working.
export default function TrackRedirect() {
  redirect('/')
}
