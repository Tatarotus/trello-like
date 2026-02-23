import Link from 'next/link';
import { register } from '../actions/auth-actions';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-6">
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-900 mb-4"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <h2 className="text-2xl font-semibold text-gray-900">Sign in to Projects</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-200 shadow-sm sm:rounded-lg sm:px-10">
          <form action={async (formData) => {
            'use server'
            await register(formData)
          }} className="space-y-4">
            <Input label="Email address" name="email" type="email" required />
            <Input label="Name" name="name" type="text" required />
            <Input label="Password" name="password" type="password" required />
            <div className="pt-2">
              <Button type="submit" fullWidth>Sign in</Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account? <Link href="/register" className="text-gray-900 font-medium hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
