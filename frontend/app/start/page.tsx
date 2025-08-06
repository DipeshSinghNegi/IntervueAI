'use client';

import { useEffect, useState } from 'react';
import Experience from '@/components/Experience';
type ExperienceProps = {
  sessionId: string;
  email: string;
};
export default function ExperiencePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('session_id');
    const storedEmail = localStorage.getItem('session_email');

    if (!storedSessionId || !storedEmail) {
      // Redirect if no session
      window.location.href = '/';
      return;
    }

    setSessionId(storedSessionId);
    setEmail(storedEmail);
  }, []);

  if (!sessionId || !email) {
    return <div>Loading...</div>;
  }

  return <Experience sessionId={sessionId} email={email} />;
}
