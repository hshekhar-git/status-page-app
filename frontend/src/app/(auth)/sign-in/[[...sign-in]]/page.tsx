import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">Sign in to your status page dashboard</p>
            </div>
            <SignIn />
        </div>
    );
}