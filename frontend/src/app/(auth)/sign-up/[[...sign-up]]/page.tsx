import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground">Get started with your status page</p>
            </div>
            <SignUp />
        </div>
    );
}