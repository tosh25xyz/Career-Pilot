import { SignUp } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-dark-900 bg-grid flex items-center justify-center px-4">
      <div className="orb w-[500px] h-[500px] bg-brand-500/8 top-0 left-1/2 -translate-x-1/2" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">CareerPilot</span>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'glass border-0 shadow-2xl',
              headerTitle: 'text-white font-display',
              headerSubtitle: 'text-white/50',
              formButtonPrimary: 'btn-primary w-full justify-center',
              formFieldInput: 'input-field',
              formFieldLabel: 'text-white/60 text-sm',
              footerActionLink: 'text-brand-400',
            },
          }}
        />
      </div>
    </div>
  );
}
